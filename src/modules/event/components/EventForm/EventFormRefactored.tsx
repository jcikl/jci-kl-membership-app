import React, { useEffect, useState } from 'react';
import { Steps, Button, Card, Typography, message, Spin, Space } from 'antd';
import { SaveOutlined, SendOutlined, ArrowLeftOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { EventFormProvider, useEventForm } from '@/contexts/EventFormContext';
import { EventFormValidator } from '@/modules/event/services/EventFormValidator';
import { eventService, eventProgramService, eventCommitteeService, eventTrainerService } from '@/modules/event/services/eventService';
import { projectAccountService } from '@/modules/finance/services/projectAccountService';

// 导入子组件
import EventBasicInfo from './EventBasicInfo';
import EventTimeLocation from './EventTimeLocation';
import EventPricing from './EventPricing';
import EventRegistration from './EventRegistration';
import EventPrograms from './EventPrograms';
import EventCommittee from './EventCommittee';
import EventTrainers from './EventTrainers';

const { Title, Text } = Typography;

interface EventFormRefactoredProps {
  eventId?: string;
  mode?: 'create' | 'edit';
  onSuccess?: (eventId: string) => void;
}

// 步骤配置
const STEP_CONFIG = [
  {
    title: '基本信息',
    description: '活动基本信息',
    component: EventBasicInfo
  },
  {
    title: '时间地点',
    description: '时间地点设置',
    component: EventTimeLocation
  },
  {
    title: '定价设置',
    description: '费用和支付',
    component: EventPricing
  },
  {
    title: '注册设置',
    description: '注册管理',
    component: EventRegistration
  },
  {
    title: '程序安排',
    description: '活动议程',
    component: EventPrograms
  },
  {
    title: '委员会',
    description: '委员会管理',
    component: EventCommittee
  },
  {
    title: '讲师信息',
    description: '讲师管理',
    component: EventTrainers
  }
];

// 主表单组件
const EventFormContent: React.FC<EventFormRefactoredProps> = ({
  eventId,
  mode = 'create',
  onSuccess
}) => {
  const { id } = useParams();
  const { state, updateFormData, setCurrentStep, setValidationErrors, setProjectAccounts, setCurrentEvent } = useEventForm();
  
  const [initialLoading, setInitialLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 初始化数据加载
  useEffect(() => {
    const initializeData = async () => {
      setInitialLoading(true);
      try {
        // 加载项目户口列表
        await loadProjectAccounts();
        
        // 如果是编辑模式，加载活动数据
        if (mode === 'edit' && (eventId || id)) {
          await loadEvent(eventId || id!);
          await loadRelatedData(eventId || id!);
        }
      } catch (error) {
        console.error('初始化数据失败:', error);
        message.error('初始化数据失败');
      } finally {
        setInitialLoading(false);
      }
    };

    initializeData();
  }, [mode, eventId, id]);

  // 加载项目户口列表
  const loadProjectAccounts = async () => {
    try {
      const accounts = await projectAccountService.getActiveProjectAccounts();
      setProjectAccounts(accounts);
    } catch (error) {
      console.error('加载项目户口失败:', error);
    }
  };

  // 加载活动数据
  const loadEvent = async (eventId: string) => {
    try {
      const event = await eventService.getEvent(eventId);
      if (event) {
        setCurrentEvent(event);
        updateFormData({
          name: event.name,
          description: event.description,
          type: event.type,
          level: event.level,
          category: event.category,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          isVirtual: event.isVirtual,
          virtualLink: event.virtualLink,
          isFree: event.isFree,
          price: event.price,
          currency: event.currency,
          paymentMethods: event.paymentMethods,
          registrationStartDate: event.registrationStartDate,
          registrationEndDate: event.registrationEndDate,
          maxParticipants: event.maxParticipants,
          projectAccountId: event.projectAccountId,
          imageUrl: event.imageUrl,
          status: event.status
        });
      }
    } catch (error) {
      console.error('加载活动数据失败:', error);
      message.error('加载活动数据失败');
    }
  };

  // 加载相关数据
  const loadRelatedData = async (eventId: string) => {
    try {
      const [programs, committee, trainers] = await Promise.all([
        eventProgramService.getEventPrograms(eventId),
        eventCommitteeService.getEventCommittee(eventId),
        eventTrainerService.getEventTrainers(eventId)
      ]);

      updateFormData({
        programs: programs || [],
        committee: committee || [],
        trainers: trainers || []
      });
    } catch (error) {
      console.error('加载相关数据失败:', error);
    }
  };

  // 验证当前步骤
  const validateCurrentStep = async (): Promise<boolean> => {
    const result = EventFormValidator.validateStep(state.formData, state.currentStep);
    setValidationErrors(result.errors);
    return result.isValid;
  };

  // 下一步
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid) {
      if (state.currentStep < STEP_CONFIG.length - 1) {
        setCurrentStep(state.currentStep + 1);
      }
    } else {
      message.error('请完成当前步骤的必填字段');
    }
  };

  // 上一步
  const handlePrev = () => {
    if (state.currentStep > 0) {
      setCurrentStep(state.currentStep - 1);
    }
  };

  // 跳转到指定步骤
  const handleStepChange = async (step: number) => {
    // 验证当前步骤
    const isValid = await validateCurrentStep();
    if (isValid || step <= state.currentStep) {
      setCurrentStep(step);
    } else {
      message.error('请先完成当前步骤');
    }
  };

  // 保存活动
  const handleSave = async () => {
    setSaving(true);
    try {
      // 验证整个表单
      const validationResult = EventFormValidator.validateForm(state.formData);
      if (!validationResult.isValid) {
        setValidationErrors(validationResult.errors);
        message.error('请完成所有必填字段');
        return;
      }

      if (mode === 'create') {
        // 创建新活动
        const eventData = {
          title: state.formData.name,
          description: state.formData.description,
          type: state.formData.type,
          category: state.formData.category,
          level: state.formData.level,
          startDate: state.formData.startDate,
          endDate: state.formData.endDate,
          venue: state.formData.location,
          address: state.formData.location,
          isVirtual: state.formData.isVirtual,
          virtualLink: state.formData.virtualLink,
          hostingLO: 'JCI KL',
          coHostingLOs: [],
          contactEmail: 'contact@jcikl.org',
          contactPhone: '',
          isFree: state.formData.price === 0,
          currency: 'MYR',
          regularPrice: state.formData.price,
          maxParticipants: 100,
          minParticipants: 1,
          isPrivate: false,
          registrationOpenFor: ['Member', 'Alumni', 'Friend'],
          coverImageUrl: state.formData.imageUrl
        };
        const newEventId = await eventService.createEvent(eventData, 'current-user-id');
        
        // 保存相关数据
        await Promise.all([
          eventProgramService.createEventPrograms(newEventId, state.formData.programs),
          eventCommitteeService.createEventCommittee(newEventId, state.formData.committee),
          eventTrainerService.createEventTrainers(newEventId, state.formData.trainers)
        ]);

        message.success('活动创建成功');
        onSuccess?.(newEventId);
      } else {
        // 更新现有活动
        const eventData = {
          id: eventId || id!,
          title: state.formData.name,
          description: state.formData.description,
          type: state.formData.type,
          category: state.formData.category,
          level: state.formData.level,
          startDate: state.formData.startDate,
          endDate: state.formData.endDate,
          venue: state.formData.location,
          address: state.formData.location,
          isVirtual: state.formData.isVirtual,
          virtualLink: state.formData.virtualLink,
          hostingLO: 'JCI KL',
          coHostingLOs: [],
          contactEmail: 'contact@jcikl.org',
          contactPhone: '',
          isFree: state.formData.price === 0,
          currency: 'MYR',
          regularPrice: state.formData.price,
          maxParticipants: 100,
          minParticipants: 1,
          isPrivate: false,
          registrationOpenFor: ['Member', 'Alumni', 'Friend'],
          coverImageUrl: state.formData.imageUrl,
          status: 'draft' as any
        };
        await eventService.updateEvent(eventId || id!, eventData, 'current-user-id');
        
        // 更新相关数据
        await Promise.all([
          eventProgramService.updateEventPrograms(eventId || id!, state.formData.programs),
          eventCommitteeService.updateEventCommittee(eventId || id!, state.formData.committee),
          eventTrainerService.updateEventTrainers(eventId || id!, state.formData.trainers)
        ]);

        message.success('活动更新成功');
        onSuccess?.(eventId || id!);
      }
    } catch (error) {
      console.error('保存活动失败:', error);
      message.error('保存活动失败');
    } finally {
      setSaving(false);
    }
  };

  // 发布活动
  const handlePublish = async () => {
    setSaving(true);
    try {
      // 验证整个表单
      const validationResult = EventFormValidator.validateForm(state.formData);
      if (!validationResult.isValid) {
        setValidationErrors(validationResult.errors);
        message.error('请完成所有必填字段');
        return;
      }

      const eventData = {
        title: state.formData.name,
        description: state.formData.description,
        type: state.formData.type,
        category: state.formData.category,
        level: state.formData.level,
        startDate: state.formData.startDate,
        endDate: state.formData.endDate,
        venue: state.formData.location,
        address: state.formData.location,
        isVirtual: state.formData.isVirtual,
        virtualLink: state.formData.virtualLink,
        hostingLO: 'JCI KL',
        coHostingLOs: [],
        contactEmail: 'contact@jcikl.org',
        contactPhone: '',
        isFree: state.formData.price === 0,
        currency: 'MYR',
        regularPrice: state.formData.price,
        maxParticipants: 100,
        minParticipants: 1,
        isPrivate: false,
        registrationOpenFor: ['Member', 'Alumni', 'Friend'],
        coverImageUrl: state.formData.imageUrl,
        ...(mode === 'edit' && { id: eventId || id! })
      };

      if (mode === 'create') {
        const newEventId = await eventService.createEvent(eventData, 'current-user-id');
        await Promise.all([
          eventProgramService.createEventPrograms(newEventId, state.formData.programs),
          eventCommitteeService.createEventCommittee(newEventId, state.formData.committee),
          eventTrainerService.createEventTrainers(newEventId, state.formData.trainers)
        ]);
        message.success('活动发布成功');
        onSuccess?.(newEventId);
      } else {
        await eventService.updateEvent(eventId || id!, { ...eventData, id: eventId || id!, status: 'published' as any }, 'current-user-id');
        await Promise.all([
          eventProgramService.updateEventPrograms(eventId || id!, state.formData.programs),
          eventCommitteeService.updateEventCommittee(eventId || id!, state.formData.committee),
          eventTrainerService.updateEventTrainers(eventId || id!, state.formData.trainers)
        ]);
        message.success('活动发布成功');
        onSuccess?.(eventId || id!);
      }
    } catch (error) {
      console.error('发布活动失败:', error);
      message.error('发布活动失败');
    } finally {
      setSaving(false);
    }
  };

  // 渲染当前步骤组件
  const renderCurrentStep = () => {
    const StepComponent = STEP_CONFIG[state.currentStep].component;
    return <StepComponent onFieldChange={(field, value) => updateFormData({ [field]: value })} />;
  };

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>正在加载数据...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          {mode === 'create' ? '创建活动' : '编辑活动'}
        </Title>
        <Text type="secondary">
          {mode === 'create' ? '填写活动信息以创建新活动' : '修改活动信息'}
        </Text>
      </div>

      <Card>
        <Steps
          current={state.currentStep}
          onChange={handleStepChange}
          items={STEP_CONFIG.map((step, index) => ({
            title: step.title,
            description: step.description,
            status: index <= state.currentStep ? 'process' : 'wait'
          }))}
          style={{ marginBottom: 24 }}
        />

        <div style={{ minHeight: '400px' }}>
          {renderCurrentStep()}
        </div>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            {state.currentStep > 0 && (
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handlePrev}
              >
                上一步
              </Button>
            )}
            
            {state.currentStep < STEP_CONFIG.length - 1 ? (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={handleNext}
              >
                下一步
              </Button>
            ) : (
              <>
                <Button
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                >
                  保存草稿
                </Button>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handlePublish}
                  loading={saving}
                >
                  发布活动
                </Button>
              </>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
};

// 主组件，包含Provider
const EventFormRefactored: React.FC<EventFormRefactoredProps> = (props) => {
  return (
    <EventFormProvider>
      <EventFormContent {...props} />
    </EventFormProvider>
  );
};

export default EventFormRefactored;
