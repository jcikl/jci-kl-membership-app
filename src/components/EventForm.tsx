import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  InputNumber,
  message,
  Steps,
  Spin,
  Modal,
  Table,
  Tooltip,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
  SaveOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  TeamOutlined,
  BookOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import CloudinaryUpload from '@/components/CloudinaryUpload';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Event,
  EventCreateData,
  EventUpdateData,
  EventType,
  EventLevel,
  EventCategory,
  // EventStatus, // Unused
  ProjectAccount,
  EventProgram,
  CommitteeMember,
  EventTrainer,
} from '@/types/event';
import { 
  eventService,
  eventProgramService,
  eventCommitteeService,
  eventTrainerService,
} from '@/services/eventService';
import { projectAccountService } from '@/services/projectAccountService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface EventFormProps {
  eventId?: string;
  mode?: 'create' | 'edit';
  onSuccess?: (eventId: string) => void;
}

const EventForm: React.FC<EventFormProps> = ({
  eventId,
  mode = 'create',
  onSuccess
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [projectAccounts, setProjectAccounts] = useState<ProjectAccount[]>([]);
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  
  // 新增状态管理
  const [programs, setPrograms] = useState<EventProgram[]>([]);
  const [committee, setCommittee] = useState<CommitteeMember[]>([]);
  const [trainers, setTrainers] = useState<EventTrainer[]>([]);
  
  // 表单字段状态监听
  const [isVirtual, setIsVirtual] = useState(false);
  const [isFree, setIsFree] = useState(false);

  // 监听表单字段变化
  const handleFieldChange = (changedValues: any) => {
    if ('isVirtual' in changedValues) {
      const newIsVirtual = changedValues.isVirtual;
      setIsVirtual(newIsVirtual);
      
      if (newIsVirtual) {
        // 线上活动时清除场地和地址
        form.setFieldsValue({
          venue: '',
          address: ''
        });
      } else {
        // 线下活动时清除虚拟链接
        form.setFieldsValue({
          virtualLink: ''
        });
      }
    }
    
    if ('isFree' in changedValues) {
      const newIsFree = changedValues.isFree;
      setIsFree(newIsFree);
      
      if (newIsFree) {
        // 免费活动时清除价格字段
        form.setFieldsValue({
          currency: '',
          regularPrice: null,
          earlyBirdPrice: null,
          memberPrice: null,
          alumniPrice: null
        });
      }
    }
  };

  /**
   * 检查未完成的必填字段
   */
  const checkIncompleteRequiredFields = (_actionType: 'create' | 'save' = 'create') => {
    const values = form.getFieldsValue();
    const incompleteFields: string[] = [];
    
    // 基本信息必填字段
    if (!values.title) incompleteFields.push('活动标题');
    if (!values.type) incompleteFields.push('活动类型');
    if (!values.category) incompleteFields.push('活动类别');
    if (!values.level) incompleteFields.push('活动级别');
    if (!values.description) incompleteFields.push('活动描述');
    if (!values.hostingLO) incompleteFields.push('主办分会');
    if (!values.contactEmail) incompleteFields.push('联系邮箱');
    
    // 封面图片是必填的
    if (!values.coverImageUrl) {
      incompleteFields.push('封面图片');
    }
    
    // 时间地点必填字段
    if (!values.startDate) incompleteFields.push('活动开始时间');
    if (!values.endDate) incompleteFields.push('活动结束时间');
    
    // 场地和地址必填字段
    if (!isVirtual && !values.venue) incompleteFields.push('活动场地');
    if (!isVirtual && !values.address) incompleteFields.push('详细地址');
    if (isVirtual && !values.virtualLink) incompleteFields.push('线上活动链接');
    
    // 费用设置必填字段
    if (!isFree) {
      if (!values.currency) incompleteFields.push('货币');
      if (!values.regularPrice) incompleteFields.push('标准价格');
    }
    
    // 注册设置必填字段
    if (!values.registrationOpenFor || values.registrationOpenFor.length === 0) {
      incompleteFields.push('注册开放对象');
    }
    
    // 程序安排必填字段检查
    const incompletePrograms: number[] = [];
    programs.forEach((_, index) => {
      const programTime = form.getFieldValue(['programs', index, 'time']);
      const programContent = form.getFieldValue(['programs', index, 'program']);
      
      if (!programTime || !programContent) {
        incompletePrograms.push(index + 1);
      }
    });
    
    // 委员会成员必填字段检查
    const incompleteCommittee: number[] = [];
    committee.forEach((_, index) => {
      const fullName = form.getFieldValue(['committee', index, 'fullName']);
      const position = form.getFieldValue(['committee', index, 'position']);
      
      if (!fullName || !position) {
        incompleteCommittee.push(index + 1);
      }
    });
    
    // 讲师信息必填字段检查
    const incompleteTrainers: number[] = [];
    trainers.forEach((_, index) => {
      const fullName = form.getFieldValue(['trainers', index, 'fullName']);
      const title = form.getFieldValue(['trainers', index, 'title']);
      
      if (!fullName || !title) {
        incompleteTrainers.push(index + 1);
      }
    });
    
    return {
      incompleteFields,
      incompletePrograms,
      incompleteCommittee,
      incompleteTrainers
    };
  };

  /**
   * 显示未完成字段的弹出窗口
   */
  const showIncompleteFieldsModal = (actionType: 'create' | 'save') => {
    const { incompleteFields, incompletePrograms, incompleteCommittee, incompleteTrainers } = checkIncompleteRequiredFields(actionType);
    
    if (incompleteFields.length === 0 && incompletePrograms.length === 0 && 
        incompleteCommittee.length === 0 && incompleteTrainers.length === 0) {
      return true; // 没有未完成字段，可以继续
    }
    
    let message = '';
    if (actionType === 'create') {
      message = '创建活动前请完成以下必填字段：\n\n';
    } else {
      message = '保存更改前请完成以下必填字段：\n\n';
    }
    
    if (incompleteFields.length > 0) {
      message += `基本信息：\n${incompleteFields.map(field => `• ${field}`).join('\n')}\n\n`;
    }
    
    if (incompletePrograms.length > 0) {
      message += `程序安排：\n${incompletePrograms.map(num => `• 程序 ${num} 的时间和内容`).join('\n')}\n\n`;
    }
    
    if (incompleteCommittee.length > 0) {
      message += `委员会成员：\n${incompleteCommittee.map(num => `• 成员 ${num} 的姓名和职位`).join('\n')}\n\n`;
    }
    
    if (incompleteTrainers.length > 0) {
      message += `讲师信息：\n${incompleteTrainers.map(num => `• 讲师 ${num} 的姓名和职位/头衔`).join('\n')}\n\n`;
    }
    
    return new Promise<boolean>((resolve) => {
      Modal.warning({
        title: '未完成必填字段',
        content: (
          <div style={{ whiteSpace: 'pre-line' }}>
            {message}
            <div style={{ marginTop: '16px', fontWeight: 'bold', color: '#1890ff' }}>
              提示：您可以先完成这些字段，或者选择跳过相关部分不保存。
            </div>
          </div>
        ),
        width: 500,
        okText: '我知道了',
        cancelText: '继续编辑',
        okButtonProps: {
          type: 'primary'
        },
        cancelButtonProps: {
          type: 'default'
        },
        onOk: () => {
          resolve(true); // 直接继续保存，跳过未完成部分
        },
        onCancel: () => {
          resolve(false); // 返回继续编辑
        }
      });
    });
  };

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

  /**
   * 加载活动数据 - 编辑模式
   * 根据event collection id获取所有参数
   */
  const loadEvent = async (eventId: string) => {
    try {
      const eventData = await eventService.getEvent(eventId);
      
      if (eventData) {
        setCurrentEvent(eventData);
        
        // 转换Firebase Timestamp为dayjs对象，确保所有字段都被正确加载
        const formData = {
          ...eventData,
          // 转换日期字段
          startDate: eventData.startDate ? dayjs(eventData.startDate.toDate()) : null,
          endDate: eventData.endDate ? dayjs(eventData.endDate.toDate()) : null,
          registrationStartDate: eventData.registrationStartDate 
            ? dayjs(eventData.registrationStartDate.toDate()) 
            : null,
          registrationEndDate: eventData.registrationEndDate 
            ? dayjs(eventData.registrationEndDate.toDate()) 
            : null,
          // 确保布尔字段有默认值
          isVirtual: eventData.isVirtual ?? false,
          isFree: eventData.isFree ?? false,
          isPrivate: eventData.isPrivate ?? false,
          // 确保数组字段有默认值
          coHostingLOs: eventData.coHostingLOs || [],
          registrationOpenFor: eventData.registrationOpenFor || ['Member', 'Alumni', 'Friend'],
          // 确保其他字段有默认值
          projectAccountId: eventData.projectAccountId || null,
          contactPhone: eventData.contactPhone || null,
          virtualLink: eventData.virtualLink || null,
          regularPrice: eventData.regularPrice || null,
          earlyBirdPrice: eventData.earlyBirdPrice || null,
          memberPrice: eventData.memberPrice || null,
          alumniPrice: eventData.alumniPrice || null,
          maxParticipants: eventData.maxParticipants || null,
          minParticipants: eventData.minParticipants || null,
          // 如果用户已经上传了图片，保持用户的选择，否则使用数据库中的值
          coverImageUrl: form.getFieldValue('coverImageUrl') || eventData.coverImageUrl || null,
        };
        
        form.setFieldsValue(formData);
        
        // 设置状态
        setIsVirtual(eventData.isVirtual ?? false);
        setIsFree(eventData.isFree ?? false);
        
        message.success('活动数据加载成功');
      } else {
        message.error('活动不存在');
        navigate('/events');
      }
    } catch (error) {
      console.error('加载活动数据失败:', error);
      message.error('加载活动数据失败');
      navigate('/events');
    }
  };

  const loadProjectAccounts = async () => {
    try {
      const accounts = await projectAccountService.getActiveProjectAccounts();
      setProjectAccounts(accounts);
    } catch (error) {
      console.error('加载项目户口列表失败:', error);
      message.error('加载项目户口列表失败');
    }
  };

  /**
   * 加载相关数据 - 程序安排、委员会、讲师
   */
  const loadRelatedData = async (eventId: string) => {
    try {
      const [programsData, committeeData, trainersData] = await Promise.all([
        eventProgramService.getEventPrograms(eventId),
        eventCommitteeService.getEventCommittee(eventId),
        eventTrainerService.getEventTrainers(eventId),
      ]);
      
      setPrograms(programsData);
      setCommittee(committeeData);
      setTrainers(trainersData);
    } catch (error) {
      console.error('加载相关数据失败:', error);
      message.error('加载相关数据失败');
    }
  };

  /**
   * 处理表单提交
   * 创建活动：将用户输入的所有参数以新的event collection id存储至event collection中
   * 编辑活动：更新现有event collection中的参数
   */
  const handleSubmit = async (values: any) => {
    // 如果不在最后一步，不应该提交表单
    if (currentStep !== steps.length - 1) {
      return;
    }
    
      // 验证必需字段
      if (!values.startDate || !values.endDate) {
        message.error('请选择活动的开始和结束日期');
        return;
      }

    // 检查未完成字段并显示确认对话框
    const canContinue = await showIncompleteFieldsModal('create');
    if (!canContinue) {
      return; // 用户选择返回完善字段
    }
    
    showConfirmModal(values);
  };

  /**
   * 保存相关数据（程序安排、委员会、讲师）
   */
  const saveRelatedData = async (_eventId: string) => {
    try {
      // TODO: 实现程序安排、委员会、讲师数据的保存
      // 目前先跳过相关数据的保存，只保存主要活动信息
    } catch (error) {
      console.error('保存相关数据失败:', error);
      message.error('保存相关数据失败');
    }
  };

  /**
   * 显示确认创建活动的对话框
   */
  const showConfirmModal = (values: any) => {
    const eventData = transformFormDataToEventData(values);
    
    Modal.confirm({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExclamationCircleOutlined style={{ color: '#1890ff', fontSize: '20px' }} />
          <span>{mode === 'create' ? '确认创建活动' : '确认保存更改'}</span>
        </div>
      ),
      content: (
        <div style={{ padding: '8px 0' }}>
          <div style={{ 
            background: '#f6f8fa', 
            padding: '16px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            border: '1px solid #e1e4e8'
          }}>
            <Title level={5} style={{ margin: '0 0 12px 0', color: '#24292e' }}>
              活动信息预览
            </Title>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text strong>活动标题：</Text>
                <br />
                <Text>{values.title}</Text>
              </Col>
              <Col span={12}>
                <Text strong>活动类型：</Text>
                <br />
                <Text>{values.type}</Text>
              </Col>
              <Col span={12}>
                <Text strong>活动级别：</Text>
                <br />
                <Text>{values.level}</Text>
              </Col>
              <Col span={12}>
                <Text strong>主办分会：</Text>
                <br />
                <Text>{values.hostingLO}</Text>
              </Col>
              <Col span={24}>
                <Text strong>活动时间：</Text>
                <br />
                <Text>
                  {values.startDate && values.endDate ? 
                    `${values.startDate.format('YYYY-MM-DD HH:mm')} - ${values.endDate.format('YYYY-MM-DD HH:mm')}` : 
                    '未设置'
                  }
                </Text>
              </Col>
              <Col span={24}>
                <Text strong>活动地点：</Text>
                <br />
                <Text>{values.venue || '未设置'}</Text>
              </Col>
              <Col span={12}>
                <Text strong>活动费用：</Text>
                <br />
                <Text>
                  {values.isFree ? '免费' : `${values.currency} ${values.regularPrice || '未设置'}`}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>注册开放对象：</Text>
                <br />
                <Text>{values.registrationOpenFor?.join(', ') || '未设置'}</Text>
              </Col>
            </Row>
          </div>
          
          <div style={{ 
            background: '#fff7e6', 
            padding: '12px', 
            borderRadius: '6px', 
            border: '1px solid #ffd591',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
            <Text style={{ color: '#8c4a00', fontSize: '14px' }}>
              {mode === 'create' 
                ? '确认要创建这个活动吗？创建后可以继续编辑活动详情、添加程序安排、委员会成员等。' 
                : '确认要保存这些更改吗？'
              }
            </Text>
          </div>
        </div>
      ),
      okText: mode === 'create' ? '确认创建' : '确认保存',
      cancelText: '取消',
      okButtonProps: {
        type: 'primary',
        icon: mode === 'create' ? <SendOutlined /> : <SaveOutlined />
      },
      onOk: async () => {
        await performSubmit(eventData);
      },
      width: 600,
      centered: true,
    });
  };

  /**
   * 执行实际的提交操作
   */
  const performSubmit = async (eventData: any) => {
    setLoading(true);
    try {
      let eventId: string;
      
      if (mode === 'create') {
        // 创建活动：存储到新的event collection
        eventId = await createNewEvent(eventData);
      } else {
        // 编辑活动：更新现有event collection
        eventId = await updateExistingEvent(eventData);
      }
      
      // 保存相关数据（程序安排、委员会、讲师）
      await saveRelatedData(eventId);
      
    } catch (error) {
      console.error('保存活动失败:', error);
      message.error('保存活动失败');
    } finally {
      setLoading(false);
    }
  };

  /**
   * 转换表单数据为Event数据格式
   */
  const transformFormDataToEventData = (values: any) => {
    // 转换程序安排中的dayjs对象，并过滤空记录
    const transformedPrograms = values.programs?.map((program: any) => ({
      ...program,
      time: program.time?.toDate ? program.time.toDate() : (program.time ? new Date(program.time) : null),
      date: program.date?.toDate ? program.date.toDate() : (program.date ? new Date(program.date) : null),
    })).filter((program: any) => {
      // 保留有时间或程序内容的记录
      return program.time || program.program || program.sessionChair || program.maxSeats;
    }) || [];

    // 转换委员会成员中的dayjs对象，并过滤空记录
    const transformedCommittee = values.committee?.map((member: any) => ({
      ...member,
      // 委员会成员没有日期字段，但确保其他字段正确
    })).filter((member: any) => {
      // 保留有姓名或职位的记录
      return member.fullName || member.position || member.contact || member.email;
    }) || [];

    // 转换讲师信息中的dayjs对象，并过滤空记录
    const transformedTrainers = values.trainers?.map((trainer: any) => ({
      ...trainer,
      // 讲师信息没有日期字段，但确保其他字段正确
    })).filter((trainer: any) => {
      // 保留有姓名或职位/头衔的记录
      return trainer.fullName || trainer.title || trainer.contact || trainer.email;
    }) || [];

    return {
        ...values,
      // 转换日期格式
      startDate: values.startDate?.toDate ? values.startDate.toDate() : new Date(values.startDate),
      endDate: values.endDate?.toDate ? values.endDate.toDate() : new Date(values.endDate),
      registrationStartDate: values.registrationStartDate?.toDate ? values.registrationStartDate.toDate() : (values.registrationStartDate ? new Date(values.registrationStartDate) : null),
      registrationEndDate: values.registrationEndDate?.toDate ? values.registrationEndDate.toDate() : (values.registrationEndDate ? new Date(values.registrationEndDate) : null),
      
      // 处理数组字段，转换嵌套的dayjs对象
      programs: transformedPrograms,
      committee: transformedCommittee,
      trainers: transformedTrainers,
        coHostingLOs: values.coHostingLOs || [],
        registrationOpenFor: values.registrationOpenFor || [],
      
      // 清理undefined值，转换为null或默认值
      projectAccountId: values.projectAccountId || null,
      contactPhone: values.contactPhone || null,
      virtualLink: values.virtualLink || null,
      regularPrice: values.regularPrice || null,
      earlyBirdPrice: values.earlyBirdPrice || null,
      memberPrice: values.memberPrice || null,
      alumniPrice: values.alumniPrice || null,
      maxParticipants: values.maxParticipants || null,
      minParticipants: values.minParticipants || null,
      coverImageUrl: values.coverImageUrl || null,
      // 确保布尔字段有正确的默认值
      isPrivate: values.isPrivate ?? false,
      isVirtual: values.isVirtual ?? false,
      isFree: values.isFree ?? false,
    };
  };

  /**
   * 创建新活动
   */
  const createNewEvent = async (eventData: any): Promise<string> => {
    try {
        const newEventId = await eventService.createEvent(
          eventData as EventCreateData,
          'current-user-id' // TODO: 获取当前用户ID
        );
      
        message.success('活动创建成功');
      
        if (onSuccess) {
          onSuccess(newEventId);
        } else {
          navigate(`/events/${newEventId}`);
        }
        
        return newEventId;
    } catch (error) {
      console.error('创建活动失败:', error);
      throw error;
    }
  };

  /**
   * 更新现有活动
   */
  const updateExistingEvent = async (eventData: any): Promise<string> => {
    try {
      const targetEventId = eventId || id!;
      
        await eventService.updateEvent(
        targetEventId,
          eventData as EventUpdateData,
          'current-user-id' // TODO: 获取当前用户ID
        );
      
        message.success('活动更新成功');
      
        if (onSuccess) {
        onSuccess(targetEventId);
        } else {
        navigate(`/events/${targetEventId}`);
        }
        
        return targetEventId;
    } catch (error) {
      console.error('更新活动失败:', error);
      throw error;
    }
  };


  /**
   * 自动保存功能 - 编辑模式下日期选择后自动保存
   */
  const handleAutoSave = async () => {
    if (mode !== 'edit' || !currentEvent) return;
    
    try {
      const values = form.getFieldsValue();
      const eventData = transformFormDataToEventData(values);
      
      // 只更新当前活动的数据，不改变状态
      if (currentEvent) {
        await eventService.updateEvent(
          currentEvent.id,
          { ...eventData, status: currentEvent.status } as EventUpdateData,
          'current-user-id' // TODO: 获取当前用户ID
        );
      }
      
      message.success('已自动保存', 1); // 显示1秒后消失
    } catch (error) {
      console.error('自动保存失败:', error);
      // 不显示错误消息，避免干扰用户操作
    }
  };

  const validateCurrentStep = async () => {
    try {
      // 根据当前步骤验证相应的字段
      let fieldsToValidate: string[] = [];
      
      switch (currentStep) {
        case 0: // 基本信息
          fieldsToValidate = ['title', 'type', 'category', 'level', 'description', 'hostingLO', 'contactEmail', 'coverImageUrl'];
          break;
        case 1: // 时间地点
          fieldsToValidate = ['startDate', 'endDate'];
          // 如果不是线上活动，验证场地和地址
          if (!isVirtual) {
            fieldsToValidate.push('venue', 'address');
          }
          break;
        case 2: // 费用设置
          // 如果活动不是免费的，验证价格相关字段
          const isFree = form.getFieldValue('isFree');
          if (!isFree) {
            fieldsToValidate = ['currency', 'regularPrice'];
          }
          // 费用设置步骤总是可以通过验证（免费活动不需要验证价格字段）
          break;
        case 3: // 注册设置
          // 检查注册开放对象字段
          const registrationOpenFor = form.getFieldValue('registrationOpenFor');
          if (!registrationOpenFor || registrationOpenFor.length === 0) {
            fieldsToValidate = ['registrationOpenFor'];
          }
          // 注册设置步骤总是可以通过验证（有默认值）
          break;
        case 4: // 程序安排
          // 程序安排步骤是可选的，总是可以通过验证
          break;
        case 5: // 委员会成员
          // 委员会成员步骤是可选的，总是可以通过验证
          break;
        case 6: // 讲师信息
          // 讲师信息步骤是可选的，总是可以通过验证
          break;
        default:
          fieldsToValidate = [];
      }
      
      if (fieldsToValidate.length > 0) {
        await form.validateFields(fieldsToValidate);
      }
      
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleNextStep = async () => {
    const isValid = await validateCurrentStep();
    
    if (isValid) {
      const nextStep = currentStep + 1;
      
      // 检查是否已经是最后一步
      if (nextStep >= steps.length) {
        return;
      }
      
      setCurrentStep(nextStep);
    }
  };


  const steps = [
    {
      title: '基本信息',
      description: '设置活动的基本信息',
      icon: <CalendarOutlined />,
    },
    {
      title: '时间地点',
      description: '配置活动时间和地点',
      icon: <EnvironmentOutlined />,
    },
    {
      title: '费用设置',
      description: '设置活动费用和限制',
      icon: <DollarOutlined />,
    },
    {
      title: '注册设置',
      description: '配置注册相关信息',
      icon: <UserOutlined />,
    },
    {
      title: '程序安排',
      description: '设置活动程序和时间安排',
      icon: <ScheduleOutlined />,
    },
    {
      title: '委员会成员',
      description: '管理活动委员会成员',
      icon: <TeamOutlined />,
    },
    {
      title: '讲师信息',
      description: '设置活动讲师和培训师',
      icon: <BookOutlined />,
    },
  ];

  const renderBasicInfo = () => (
    <Card title="基本信息" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item
            label="封面图片"
            name="coverImageUrl"
            rules={[{ required: true, message: '请上传封面图片' }]}
          >
            <CloudinaryUpload
              maxSize={5}
              enableCompression={true}
              targetSize={{ width: 800, height: 600 }}
              placeholder="上传活动封面图片"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动标题"
            name="title"
            rules={[{ required: true, message: '请输入活动标题' }]}
          >
            <Input placeholder="请输入活动标题" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动类型"
            name="type"
            rules={[{ required: true, message: '请选择活动类型' }]}
          >
            <Select placeholder="请选择活动类型">
              {Object.values(EventType).map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动类别"
            name="category"
            rules={[{ required: true, message: '请选择活动类别' }]}
          >
            <Select placeholder="请选择活动类别">
              {Object.values(EventCategory).map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动级别"
            name="level"
            rules={[{ required: true, message: '请选择活动级别' }]}
          >
            <Select placeholder="请选择活动级别">
              {Object.values(EventLevel).map(level => (
                <Option key={level} value={level}>{level}</Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            label="活动描述"
            name="description"
            rules={[{ required: true, message: '请输入活动描述' }]}
          >
            <TextArea
              rows={4}
              placeholder="请详细描述活动内容、目标受众、预期效果等"
            />
          </Form.Item>
        </Col>
         <Col xs={24}>
           <Form.Item
             label="项目户口"
             name="projectAccountId"
             tooltip="选择项目户口以便追踪活动相关的所有数据，包括财务、注册等"
           >
             <Select
               placeholder="请选择项目户口（可选）"
               allowClear
               showSearch
               filterOption={(input, option) =>
                 (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
               }
             >
               {projectAccounts.map(account => (
                 <Option key={account.id} value={account.id}>
                   {account.name} - {account.currency} {account.budget.toLocaleString()}
                 </Option>
               ))}
             </Select>
           </Form.Item>
         </Col>
         <Col xs={24} sm={12}>
           <Form.Item
             label="主办分会"
             name="hostingLO"
             rules={[{ required: true, message: '请输入主办分会' }]}
             initialValue="JCI Kuala Lumpur"
           >
             <Input placeholder="请输入主办分会" />
           </Form.Item>
         </Col>
         <Col xs={24} sm={12}>
           <Form.Item
             label="协办分会"
             name="coHostingLOs"
           >
             <Select
               mode="multiple"
               placeholder="请选择协办分会（可选）"
               allowClear
             >
               <Option value="JCI Petaling Jaya">JCI Petaling Jaya</Option>
               <Option value="JCI Subang Jaya">JCI Subang Jaya</Option>
               <Option value="JCI Ampang">JCI Ampang</Option>
               <Option value="JCI Cheras">JCI Cheras</Option>
             </Select>
           </Form.Item>
         </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="联系邮箱"
            name="contactEmail"
            rules={[
              { required: true, message: '请输入联系邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入联系邮箱" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="联系电话"
            name="contactPhone"
          >
            <Input placeholder="请输入联系电话（可选）" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderTimeLocation = () => (
    <Card title="时间地点" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动开始时间"
            name="startDate"
            rules={[
              { required: true, message: '请选择活动开始时间' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const endDate = getFieldValue('endDate');
                  if (!value || !endDate) {
                    return Promise.resolve();
                  }
                  if (value.isAfter(endDate)) {
                    return Promise.reject(new Error('活动开始时间不能晚于结束时间'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择活动开始时间"
              disabledDate={(current) => {
                const endDate = form.getFieldValue('endDate');
                if (!endDate) return false;
                return current && current.isAfter(endDate, 'day');
              }}
              onChange={(date) => {
                // 当开始时间改变时，自动保存
                if (date && mode === 'edit') {
                  handleAutoSave();
                }
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动结束时间"
            name="endDate"
            rules={[
              { required: true, message: '请选择活动结束时间' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startDate = getFieldValue('startDate');
                  if (!value || !startDate) {
                    return Promise.resolve();
                  }
                  if (value.isBefore(startDate)) {
                    return Promise.reject(new Error('活动结束时间不能早于开始时间'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择活动结束时间"
              disabledDate={(current) => {
                const startDate = form.getFieldValue('startDate');
                if (!startDate) return false;
                return current && current.isBefore(startDate, 'day');
              }}
              onChange={(date) => {
                // 当结束时间改变时，自动保存
                if (date && mode === 'edit') {
                  handleAutoSave();
                }
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="注册开始时间"
            name="registrationStartDate"
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择注册开始时间（可选）"
              onChange={(date) => {
                // 当注册开始时间改变时，自动保存
                if (date && mode === 'edit') {
                  handleAutoSave();
                }
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="注册结束时间"
            name="registrationEndDate"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const registrationStartDate = getFieldValue('registrationStartDate');
                  if (!value || !registrationStartDate) {
                    return Promise.resolve();
                  }
                  if (value.isBefore(registrationStartDate)) {
                    return Promise.reject(new Error('注册结束时间不能早于注册开始时间'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择注册结束时间（可选）"
              disabledDate={(current) => {
                const registrationStartDate = form.getFieldValue('registrationStartDate');
                if (!registrationStartDate) return false;
                return current && current.isBefore(registrationStartDate, 'day');
              }}
              onChange={(date) => {
                // 当注册结束时间改变时，自动保存
                if (date && mode === 'edit') {
                  handleAutoSave();
                }
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Divider orientation="left">地点信息</Divider>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="是否为线上活动"
            name="isVirtual"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="线上活动链接"
            name="virtualLink"
            rules={[
              { required: isVirtual, message: '请输入线上活动链接' },
              { type: 'url', message: '请输入有效的URL地址' }
            ]}
          >
            <Input 
              placeholder="请输入线上活动链接" 
              disabled={!isVirtual}
            />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            label="活动场地"
            name="venue"
            rules={[{ required: !isVirtual, message: '请输入活动场地' }]}
          >
            <Input 
              placeholder="请输入活动场地名称" 
              disabled={isVirtual}
            />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            label="详细地址"
            name="address"
            rules={[{ required: !isVirtual, message: '请输入详细地址' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入详细地址"
              disabled={isVirtual}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderPricing = () => (
    <Card title="费用设置" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item
            label="是否免费活动"
            name="isFree"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Form.Item shouldUpdate noStyle>
          {({ getFieldValue }) => {
            const isFree = getFieldValue('isFree');
            if (isFree) return null;
            
            return (
              <>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="货币"
                    name="currency"
                    initialValue="MYR"
                  >
                    <Select>
                      <Option value="MYR">MYR (马来西亚林吉特)</Option>
                      <Option value="USD">USD (美元)</Option>
                      <Option value="SGD">SGD (新加坡元)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="标准价格"
                    name="regularPrice"
                    rules={[{ required: true, message: '请输入标准价格' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="请输入标准价格"
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="早鸟价格"
                    name="earlyBirdPrice"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="请输入早鸟价格（可选）"
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="会员价格"
                    name="memberPrice"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="请输入会员价格（可选）"
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="校友价格"
                    name="alumniPrice"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="请输入校友价格（可选）"
                      min={0}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </>
            );
          }}
        </Form.Item>
      </Row>
    </Card>
  );

  const renderRegistration = () => (
    <Card title="注册设置" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Form.Item
            label="是否为私人活动"
            name="isPrivate"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            label="注册开放对象"
            name="registrationOpenFor"
            rules={[{ required: true, message: '请选择注册开放对象' }]}
            initialValue={['Member', 'Alumni', 'Friend']}
          >
            <Select
              mode="multiple"
              placeholder="请选择注册开放对象"
            >
              <Option value="Member">会员</Option>
              <Option value="Alumni">校友</Option>
              <Option value="Friend">朋友</Option>
              <Option value="Public">公众</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="最大参与人数"
            name="maxParticipants"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入最大参与人数（0表示无限制）"
              min={0}
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  /**
   * 更新后续程序的时间
   */
  const updateSubsequentProgramTimes = () => {
    const firstTime = form.getFieldValue(['programs', 0, 'time']);
    // const _firstDuration = form.getFieldValue(['programs', 0, 'duration']) || 30; // Unused
    
    if (firstTime) {
      let currentTime = dayjs(firstTime);
      
      // 从序号2开始更新后续程序的时间
      for (let i = 1; i < programs.length; i++) {
        const prevDuration = form.getFieldValue(['programs', i - 1, 'duration']) || 30;
        currentTime = currentTime.add(prevDuration, 'minute');
        form.setFieldValue(['programs', i, 'time'], currentTime);
      }
    }
  };

  /**
   * 渲染程序安排步骤
   */
  const renderPrograms = () => {
    // 获取当前活动类别
    const eventCategory = form.getFieldValue('category');
    
    // 活动类别显示名称映射
    const getCategoryDisplayName = (category: string) => {
      const categoryMap: Record<string, string> = {
        [EventCategory.MEETING]: '会议',
        [EventCategory.CONFERENCE]: '会议',
        [EventCategory.SEMINAR]: '研讨会',
        [EventCategory.WORKSHOP]: '工作坊',
        [EventCategory.TRAINING]: '培训',
        [EventCategory.JCIM_INSPIRE]: 'JCIM Inspire',
        [EventCategory.BUSINESS_NETWORKING]: '商务网络',
        [EventCategory.SOCIAL]: '社交活动',
        [EventCategory.SPORTS]: '体育竞赛',
        [EventCategory.CULTURAL]: '文化活动',
        [EventCategory.COMMUNITY_SERVICE]: '社区服务',
        [EventCategory.ENVIRONMENTAL]: '环保活动',
        [EventCategory.EDUCATION]: '教育活动'
      };
      return categoryMap[category] || category;
    };

    // 表格列定义
    const columns = [
      {
        title: '序号',
        key: 'index',
        width: 60,
        render: (_value: any, _record: any, index: number) => index + 1
      },
      {
        title: '时间',
        dataIndex: 'time',
        key: 'time',
        width: 180,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['programs', index, 'time']}
            initialValue={record.time ? dayjs(record.time?.toDate ? record.time.toDate() : record.time as any) : null}
            rules={[
              { required: true, message: '请选择时间' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  
                  const startDate = form.getFieldValue('startDate');
                  const endDate = form.getFieldValue('endDate');
                  
                  if (!startDate || !endDate) {
                    return Promise.resolve();
                  }
                  
                  const programTime = dayjs(value);
                  const eventStartTime = dayjs(startDate);
                  const eventEndTime = dayjs(endDate);
                  
                  if (programTime.isBefore(eventStartTime) || programTime.isAfter(eventEndTime)) {
                    return Promise.reject(new Error(`程序时间应在活动时间范围内`));
                  }
                  
                  return Promise.resolve();
                }
              }
            ]}
            style={{ margin: 0 }}
          >
            <DatePicker 
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
              placeholder="选择程序时间"
              style={{ width: '100%' }}
              onChange={(value) => {
                // 当序号1的时间变化时，自动更新后续程序的时间
                if (index === 0 && value) {
                  updateSubsequentProgramTimes();
                }
              }}
              disabledDate={(current) => {
                const startDate = form.getFieldValue('startDate');
                const endDate = form.getFieldValue('endDate');
                if (!startDate || !endDate) return false;
                return current && (current.isBefore(startDate, 'day') || current.isAfter(endDate, 'day'));
              }}
              disabledTime={(current) => {
                const startDate = form.getFieldValue('startDate');
                const endDate = form.getFieldValue('endDate');
                if (!startDate || !endDate || !current) return {};
                
                const startTime = dayjs(startDate);
                const endTime = dayjs(endDate);
                const currentTime = dayjs(current);
                
                if (currentTime.isSame(startTime, 'day') && currentTime.isSame(endTime, 'day')) {
                  return {
                    disabledHours: () => {
                      const hours = [];
                      for (let i = 0; i < startTime.hour(); i++) {
                        hours.push(i);
                      }
                      for (let i = endTime.hour() + 1; i < 24; i++) {
                        hours.push(i);
                      }
                      return hours;
                    },
                    disabledMinutes: (selectedHour: number) => {
                      if (selectedHour === startTime.hour()) {
                        const minutes = [];
                        for (let i = 0; i < startTime.minute(); i++) {
                          minutes.push(i);
                        }
                        return minutes;
                      }
                      if (selectedHour === endTime.hour()) {
                        const minutes = [];
                        for (let i = endTime.minute() + 1; i < 60; i++) {
                          minutes.push(i);
                        }
                        return minutes;
                      }
                      return [];
                    }
                  };
                }
                
                if (currentTime.isSame(startTime, 'day')) {
                  return {
                    disabledHours: () => {
                      const hours = [];
                      for (let i = 0; i < startTime.hour(); i++) {
                        hours.push(i);
                      }
                      return hours;
                    },
                    disabledMinutes: (selectedHour: number) => {
                      if (selectedHour === startTime.hour()) {
                        const minutes = [];
                        for (let i = 0; i < startTime.minute(); i++) {
                          minutes.push(i);
                        }
                        return minutes;
                      }
                      return [];
                    }
                  };
                }
                
                if (currentTime.isSame(endTime, 'day')) {
                  return {
                    disabledHours: () => {
                      const hours = [];
                      for (let i = endTime.hour() + 1; i < 24; i++) {
                        hours.push(i);
                      }
                      return hours;
                    },
                    disabledMinutes: (selectedHour: number) => {
                      if (selectedHour === endTime.hour()) {
                        const minutes = [];
                        for (let i = endTime.minute() + 1; i < 60; i++) {
                          minutes.push(i);
                        }
                        return minutes;
                      }
                      return [];
                    }
                  };
                }
                
                return {};
              }}
            />
          </Form.Item>
        )
      },
      {
        title: '时长(分钟)',
        dataIndex: 'duration',
        key: 'duration',
        width: 100,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['programs', index, 'duration']}
            initialValue={record.duration}
            style={{ margin: 0 }}
          >
            <InputNumber 
              placeholder="分钟" 
              min={0} 
              max={1440}
              style={{ width: '100%' }}
              onChange={(value) => {
                // 当序号1的时长变化时，自动更新后续程序的时间
                if (index === 0 && value) {
                  updateSubsequentProgramTimes();
                }
                // 当其他程序的时长变化时，只更新下一个程序的时间
                else if (index > 0 && value) {
                  const prevTime = form.getFieldValue(['programs', index - 1, 'time']);
                  const prevDuration = form.getFieldValue(['programs', index - 1, 'duration']);
                  if (prevTime && prevDuration) {
                    const nextTime = dayjs(prevTime).add(prevDuration, 'minute');
                    form.setFieldValue(['programs', index, 'time'], nextTime);
                  }
                }
              }}
            />
          </Form.Item>
        )
      },
      {
        title: '程序内容',
        dataIndex: 'program',
        key: 'program',
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['programs', index, 'program']}
            initialValue={record.program}
            rules={[{ required: true, message: '请输入程序内容' }]}
            style={{ margin: 0 }}
          >
            <Input placeholder="请输入程序内容" />
          </Form.Item>
        )
      },
      {
        title: '主持人',
        dataIndex: 'sessionChair',
        key: 'sessionChair',
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['programs', index, 'sessionChair']}
            initialValue={record.sessionChair}
            style={{ margin: 0 }}
          >
            <Input placeholder="请输入主持人" />
          </Form.Item>
        )
      },
      {
        title: '最大座位数',
        dataIndex: 'maxSeats',
        key: 'maxSeats',
        width: 120,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['programs', index, 'maxSeats']}
            initialValue={record.maxSeats}
            style={{ margin: 0 }}
          >
            <InputNumber 
              placeholder="座位数" 
              min={0} 
              style={{ width: '100%' }}
            />
          </Form.Item>
        )
      },
      {
        title: '需要注册',
        dataIndex: 'registrationRequired',
        key: 'registrationRequired',
        width: 100,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['programs', index, 'registrationRequired']}
            initialValue={record.registrationRequired}
            valuePropName="checked"
            style={{ margin: 0 }}
          >
            <Switch />
          </Form.Item>
        )
      },
      {
        title: '竞赛项目',
        dataIndex: 'isCompetition',
        key: 'isCompetition',
        width: 100,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['programs', index, 'isCompetition']}
            initialValue={record.isCompetition}
            valuePropName="checked"
            style={{ margin: 0 }}
          >
            <Switch />
          </Form.Item>
        )
      },
      {
        title: '操作',
        key: 'action',
        width: 120,
        render: (_value: any, _record: any, index: number) => (
          <Space>
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  const newPrograms = programs.filter((_, i) => i !== index);
                  setPrograms(newPrograms);
                }}
              />
            </Tooltip>
          </Space>
        )
      }
    ];
    
    // 程序安排模板
    const programTemplates = {
      [EventCategory.MEETING]: [
        { time: dayjs().hour(9).minute(0), program: '签到注册', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(9).minute(30), program: '开幕致辞', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(10).minute(0), program: '主题演讲', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(11).minute(0), program: '茶歇', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(11).minute(15), program: '分组讨论', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(12).minute(15), program: '午餐', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(13).minute(15), program: '专题报告', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(14).minute(15), program: '闭幕总结', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false }
      ],
      [EventCategory.CONFERENCE]: [
        { time: dayjs().hour(9).minute(0), program: '签到注册', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(9).minute(30), program: '开幕致辞', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(10).minute(0), program: '主题演讲', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(11).minute(0), program: '茶歇', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(11).minute(15), program: '分组讨论', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(12).minute(15), program: '午餐', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(13).minute(15), program: '专题报告', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(14).minute(15), program: '闭幕总结', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false }
      ],
      [EventCategory.TRAINING]: [
        { time: dayjs().hour(9).minute(0), program: '签到注册', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(9).minute(30), program: '培训介绍', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(10).minute(30), program: '茶歇', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(10).minute(45), program: '理论讲解', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(12).minute(0), program: '午餐', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(13).minute(0), program: '实践操作', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(14).minute(30), program: '茶歇', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(14).minute(45), program: '案例分析', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(16).minute(0), program: '总结答疑', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false }
      ],
      [EventCategory.WORKSHOP]: [
        { time: dayjs().hour(9).minute(0), program: '签到注册', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(9).minute(30), program: '工作坊介绍', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(10).minute(0), program: '理论讲解', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(11).minute(0), program: '茶歇', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(11).minute(15), program: '实践操作', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(12).minute(15), program: '午餐', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(13).minute(15), program: '小组讨论', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(14).minute(30), program: '茶歇', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(14).minute(45), program: '成果展示', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(16).minute(0), program: '总结答疑', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false }
      ],
      [EventCategory.SOCIAL]: [
        { time: dayjs().hour(18).minute(0), program: '签到入场', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(18).minute(30), program: '欢迎致辞', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(19).minute(0), program: '自助晚餐', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(20).minute(0), program: '互动游戏', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(21).minute(0), program: '自由交流', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(22).minute(0), program: '活动结束', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false }
      ],
      [EventCategory.SPORTS]: [
        { time: dayjs().hour(8).minute(0), program: '选手签到', sessionChair: '', maxSeats: 0, registrationRequired: true, isCompetition: true },
        { time: dayjs().hour(8).minute(30), program: '规则说明', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: true },
        { time: dayjs().hour(9).minute(0), program: '初赛阶段', sessionChair: '', maxSeats: 0, registrationRequired: true, isCompetition: true },
        { time: dayjs().hour(12).minute(0), program: '午餐休息', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: false },
        { time: dayjs().hour(13).minute(0), program: '决赛阶段', sessionChair: '', maxSeats: 0, registrationRequired: true, isCompetition: true },
        { time: dayjs().hour(16).minute(0), program: '评分统计', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: true },
        { time: dayjs().hour(16).minute(30), program: '颁奖典礼', sessionChair: '', maxSeats: 0, registrationRequired: false, isCompetition: true }
      ]
    };

    const addProgramTemplate = (template: any[]) => {
      const newPrograms = template.map((item, index) => ({
        id: `temp_${Date.now()}_${index}`,
        eventId: eventId || id || '',
        date: dayjs().toDate() as any,
        time: item.time,
        duration: item.duration || 30, // 添加默认时长
        program: item.program,
        sessionChair: item.sessionChair,
        registrationRequired: item.registrationRequired,
        maxSeats: item.maxSeats,
        isCompetition: item.isCompetition,
        sequence: programs.length + index,
        createdAt: dayjs().toDate() as any,
        updatedAt: dayjs().toDate() as any,
      }));
      setPrograms([...programs, ...newPrograms]);
      
      // 自动更新后续程序的时间
      setTimeout(() => {
        updateSubsequentProgramTimes();
      }, 100);
    };

    return (
      <Card title="程序安排" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => {
                // 计算下一个程序的时间
                let nextTime = dayjs();
                if (programs.length > 0) {
                  const lastTime = form.getFieldValue(['programs', programs.length - 1, 'time']);
                  const lastDuration = form.getFieldValue(['programs', programs.length - 1, 'duration']) || 30; // 默认30分钟
                  if (lastTime) {
                    nextTime = dayjs(lastTime).add(lastDuration, 'minute');
                  }
                }

                const newProgram: EventProgram = {
                  id: `temp_${Date.now()}`,
                  eventId: eventId || id || '',
                  date: dayjs().toDate() as any,
                  time: nextTime.toISOString(),
                  duration: 30, // 默认30分钟
                  program: '',
                  sessionChair: '',
                  registrationRequired: false,
                  maxSeats: undefined,
                  isCompetition: false,
                  sequence: programs.length,
                  createdAt: dayjs().toDate() as any,
                  updatedAt: dayjs().toDate() as any,
                };
                setPrograms([...programs, newProgram]);
                
                // 自动更新后续程序的时间
                setTimeout(() => {
                  updateSubsequentProgramTimes();
                }, 100);
              }}
            >
              添加程序安排
            </Button>
            
            {eventCategory && programTemplates[eventCategory as keyof typeof programTemplates] && (
              <Button
                type="primary"
                onClick={() => addProgramTemplate(programTemplates[eventCategory as keyof typeof programTemplates])}
              >
                导入{getCategoryDisplayName(eventCategory)}模板
              </Button>
            )}
          </Space>
        </div>
      
        <Table
          dataSource={programs}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 1000 }}
          style={{ marginTop: 16 }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <ScheduleOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>暂无程序安排</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  点击上方按钮添加程序安排
                </div>
              </div>
            )
          }}
        />
    </Card>
  );
  };

  /**
   * 渲染委员会成员步骤
   */
  const renderCommittee = () => {
    // 表格列定义
    const columns = [
      {
        title: '序号',
        key: 'index',
        width: 60,
        render: (_value: any, _record: any, index: number) => index + 1
      },
      {
        title: '姓名',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 120,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['committee', index, 'fullName']}
            initialValue={record.fullName}
            rules={[{ required: true, message: '请输入姓名' }]}
            style={{ margin: 0 }}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
        )
      },
      {
        title: '职位',
        dataIndex: 'position',
        key: 'position',
        width: 120,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['committee', index, 'position']}
            initialValue={record.position}
            rules={[{ required: true, message: '请输入职位' }]}
            style={{ margin: 0 }}
          >
            <Input placeholder="请输入职位" />
          </Form.Item>
        )
      },
      {
        title: '联系方式',
        dataIndex: 'contact',
        key: 'contact',
        width: 150,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['committee', index, 'contact']}
            initialValue={record.contact}
            style={{ margin: 0 }}
          >
            <Input placeholder="请输入联系方式" />
          </Form.Item>
        )
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        key: 'email',
        width: 200,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['committee', index, 'email']}
            initialValue={record.email}
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
            style={{ margin: 0 }}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
        )
      },
      {
        title: '活动编辑权限',
        dataIndex: 'canEditEvent',
        key: 'canEditEvent',
        width: 120,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['committee', index, 'canEditEvent']}
            initialValue={record.canEditEvent || false}
            valuePropName="checked"
            style={{ margin: 0 }}
          >
            <Switch />
          </Form.Item>
        )
      },
      {
        title: '票务批准权限',
        dataIndex: 'canApproveTickets',
        key: 'canApproveTickets',
        width: 120,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['committee', index, 'canApproveTickets']}
            initialValue={record.canApproveTickets || false}
            valuePropName="checked"
            style={{ margin: 0 }}
          >
            <Switch />
          </Form.Item>
        )
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
        render: (_value: any, _record: any, index: number) => (
          <Space>
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  const newCommittee = committee.filter((_, i) => i !== index);
                  setCommittee(newCommittee);
                }}
              />
            </Tooltip>
          </Space>
        )
      }
    ];

    return (
      <Card title="委员会成员" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              const newMember: CommitteeMember = {
                id: `temp_${Date.now()}`,
                eventId: eventId || id || '',
                fullName: '',
                position: '',
                contact: '',
                email: '',
                canEditEvent: false,
                canApproveTickets: false,
                sequence: committee.length,
                createdAt: dayjs().toDate() as any,
                updatedAt: dayjs().toDate() as any,
              };
              setCommittee([...committee, newMember]);
            }}
          >
            添加委员会成员
          </Button>
        </div>
        
        <Table
          dataSource={committee}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 1000 }}
          style={{ marginTop: 16 }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <TeamOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>暂无委员会成员</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  点击上方按钮添加委员会成员
                </div>
              </div>
            )
          }}
        />
      </Card>
    );
  };

  /**
   * 渲染讲师信息步骤
   */
  const renderTrainers = () => {
    // 表格列定义
    const columns = [
      {
        title: '序号',
        key: 'index',
        width: 60,
        render: (_value: any, _record: any, index: number) => index + 1
      },
      {
        title: '姓名',
        dataIndex: 'fullName',
        key: 'fullName',
        width: 150,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['trainers', index, 'fullName']}
            initialValue={record.fullName}
            rules={[{ required: true, message: '请输入姓名' }]}
            style={{ margin: 0 }}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
        )
      },
      {
        title: '职位/头衔',
        dataIndex: 'title',
        key: 'title',
        width: 200,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['trainers', index, 'title']}
            initialValue={record.title}
            rules={[{ required: true, message: '请输入职位或头衔' }]}
            style={{ margin: 0 }}
          >
            <Input placeholder="请输入职位或头衔" />
          </Form.Item>
        )
      },
      {
        title: '联系方式',
        dataIndex: 'contact',
        key: 'contact',
        width: 150,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['trainers', index, 'contact']}
            initialValue={record.contact}
            style={{ margin: 0 }}
          >
            <Input placeholder="请输入联系方式" />
          </Form.Item>
        )
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        key: 'email',
        width: 200,
        render: (_value: any, record: any, index: number) => (
          <Form.Item
            name={['trainers', index, 'email']}
            initialValue={record.email}
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
            style={{ margin: 0 }}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
        )
      },
      {
        title: '操作',
        key: 'action',
        width: 80,
        render: (_value: any, _record: any, index: number) => (
          <Space>
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  const newTrainers = trainers.filter((_, i) => i !== index);
                  setTrainers(newTrainers);
                }}
              />
            </Tooltip>
          </Space>
        )
      }
    ];

    return (
      <Card title="讲师信息" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              const newTrainer: EventTrainer = {
                id: `temp_${Date.now()}`,
                eventId: eventId || id || '',
                fullName: '',
                title: '',
                contact: '',
                email: '',
                sequence: trainers.length,
                createdAt: dayjs().toDate() as any,
                updatedAt: dayjs().toDate() as any,
              };
              setTrainers([...trainers, newTrainer]);
            }}
          >
            添加讲师
          </Button>
        </div>
        
        <Table
          dataSource={trainers}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          style={{ marginTop: 16 }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                <BookOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                <div>暂无讲师信息</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>
                  点击上方按钮添加讲师信息
                </div>
              </div>
            )
          }}
        />
      </Card>
    );
  };


  // 如果正在初始化加载，显示加载状态
  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>正在加载{mode === 'edit' ? '活动数据' : '表单'}...</Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          {mode === 'create' ? '创建活动' : '编辑活动'}
        </Title>
        <Text type="secondary">
          {mode === 'create' 
            ? '请填写活动信息，创建新的活动' 
            : `修改活动信息并保存更改${currentEvent ? ` - ${currentEvent.title}` : ''}`
          }
        </Text>
      </div>

      <Steps
        current={currentStep}
        items={steps}
        style={{ marginBottom: 32 }}
      />
      
      {/* 当前步骤标题 */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Title level={3} style={{ color: '#1890ff' }}>
          {steps[currentStep]?.title}
        </Title>
        <Text type="secondary">
          {steps[currentStep]?.description}
        </Text>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleFieldChange}
        scrollToFirstError
      >
        {/* 渲染所有步骤的内容，但只显示当前步骤 */}
        <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
          {renderBasicInfo()}
        </div>
        <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
          {renderTimeLocation()}
        </div>
        <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
          {renderPricing()}
        </div>
        <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
          {renderRegistration()}
        </div>
        <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
          {renderPrograms()}
        </div>
        <div style={{ display: currentStep === 5 ? 'block' : 'none' }}>
          {renderCommittee()}
        </div>
        <div style={{ display: currentStep === 6 ? 'block' : 'none' }}>
          {renderTrainers()}
        </div>

        <Card>
          <Row justify="space-between">
            <Col>
              <Space>
                {currentStep > 0 && (
                  <Button 
                    htmlType="button"
                    onClick={() => setCurrentStep(currentStep - 1)}
                  >
                    上一步
                  </Button>
                )}
              </Space>
            </Col>
            <Col>
              <Space>
                <Button 
                  htmlType="button"
                  onClick={() => navigate('/events')}
                >
                  取消
                </Button>
                {currentStep < steps.length - 1 ? (
                  <Button
                    type="primary"
                    htmlType="button"
                    onClick={handleNextStep}
                  >
                    下一步
                  </Button>
                ) : (
                  <Button
                    type="primary"
                    htmlType="button"
                    onClick={() => {
                      // 手动触发表单提交
                      form.submit();
                    }}
                    icon={mode === 'create' ? <SendOutlined /> : <SaveOutlined />}
                    loading={loading}
                  >
                    {mode === 'create' ? '创建活动' : '保存更改'}
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default EventForm;
