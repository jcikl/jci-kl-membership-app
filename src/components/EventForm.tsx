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
  Upload,
  message,
  Steps,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
  UploadOutlined,
  SaveOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import {
  EventCreateData,
  EventUpdateData,
  EventType,
  EventLevel,
  EventCategory,
  EventStatus,
  ProjectAccount,
} from '@/types/event';
import { eventService } from '@/services/eventService';
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
  const [form] = useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [projectAccounts, setProjectAccounts] = useState<ProjectAccount[]>([]);

  // 如果是编辑模式，加载活动数据
  useEffect(() => {
    if (mode === 'edit' && (eventId || id)) {
      loadEvent(eventId || id!);
    }
  }, [mode, eventId, id]);

  // 加载项目户口列表
  useEffect(() => {
    loadProjectAccounts();
  }, []);

  const loadEvent = async (eventId: string) => {
    try {
      const eventData = await eventService.getEvent(eventId);
      if (eventData) {
        // 转换日期格式
        const formData = {
          ...eventData,
          startDate: dayjs(eventData.startDate.toDate()),
          endDate: dayjs(eventData.endDate.toDate()),
          registrationStartDate: eventData.registrationStartDate 
            ? dayjs(eventData.registrationStartDate.toDate()) 
            : null,
          registrationEndDate: eventData.registrationEndDate 
            ? dayjs(eventData.registrationEndDate.toDate()) 
            : null,
        };
        form.setFieldsValue(formData);
      }
    } catch (error) {
      console.error('加载活动数据失败:', error);
      message.error('加载活动数据失败');
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

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // 调试信息
      console.log('=== FINAL FORM SUBMISSION ===');
      console.log('Current step:', currentStep);
      console.log('Form submission values:', values);
      console.log('startDate:', values.startDate);
      console.log('endDate:', values.endDate);
      
      // 检查表单当前值
      const currentFormValues = form.getFieldsValue();
      console.log('Current form values:', currentFormValues);
      console.log('Current form startDate:', currentFormValues.startDate);
      console.log('Current form endDate:', currentFormValues.endDate);
      
      // 如果不在最后一步，不应该提交表单
      if (currentStep !== steps.length - 1) {
        console.log('Form submission triggered on wrong step:', currentStep);
        setLoading(false);
        return;
      }
      
      // 验证必需字段
      if (!values.startDate || !values.endDate) {
        message.error('请选择活动的开始和结束日期');
        setLoading(false);
        return;
      }

      // 转换日期格式并清理undefined值
      const eventData = {
        ...values,
        startDate: values.startDate?.toDate ? values.startDate.toDate() : new Date(values.startDate),
        endDate: values.endDate?.toDate ? values.endDate.toDate() : new Date(values.endDate),
        registrationStartDate: values.registrationStartDate?.toDate ? values.registrationStartDate.toDate() : (values.registrationStartDate ? new Date(values.registrationStartDate) : null),
        registrationEndDate: values.registrationEndDate?.toDate ? values.registrationEndDate.toDate() : (values.registrationEndDate ? new Date(values.registrationEndDate) : null),
        coHostingLOs: values.coHostingLOs || [],
        registrationOpenFor: values.registrationOpenFor || [],
        // 清理undefined值，转换为null或删除字段
        projectAccountId: values.projectAccountId || null,
        contactPhone: values.contactPhone || null,
        virtualLink: values.virtualLink || null,
        regularPrice: values.regularPrice || null,
        earlyBirdPrice: values.earlyBirdPrice || null,
        memberPrice: values.memberPrice || null,
        alumniPrice: values.alumniPrice || null,
        maxParticipants: values.maxParticipants || null,
        minParticipants: values.minParticipants || null,
        latitude: values.latitude || null,
        longitude: values.longitude || null,
        coverImageUrl: values.coverImageUrl || null,
        isPrivate: values.isPrivate || false,
      };

      if (mode === 'create') {
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
      } else {
        await eventService.updateEvent(
          eventId || id!,
          eventData as EventUpdateData,
          'current-user-id' // TODO: 获取当前用户ID
        );
        message.success('活动更新成功');
        if (onSuccess) {
          onSuccess(eventId || id!);
        } else {
          navigate(`/events/${eventId || id}`);
        }
      }
    } catch (error) {
      console.error('保存活动失败:', error);
      message.error('保存活动失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = await form.validateFields();
      await handleSubmit({ ...values, status: EventStatus.DRAFT });
    } catch (error) {
      console.error('保存草稿失败:', error);
    }
  };

  const validateCurrentStep = async () => {
    try {
      // 根据当前步骤验证相应的字段
      let fieldsToValidate: string[] = [];
      
      switch (currentStep) {
        case 0: // 基本信息
          fieldsToValidate = ['title', 'type', 'category', 'level', 'description', 'hostingLO', 'contactEmail'];
          break;
        case 1: // 时间地点
          fieldsToValidate = ['startDate', 'endDate', 'venue', 'address'];
          break;
        case 2: // 费用设置
          // 如果活动不是免费的，验证价格相关字段
          const isFree = form.getFieldValue('isFree');
          if (!isFree) {
            fieldsToValidate = ['currency', 'regularPrice'];
          }
          break;
        case 3: // 注册设置
          fieldsToValidate = ['registrationOpenFor'];
          break;
        default:
          fieldsToValidate = [];
      }
      
      if (fieldsToValidate.length > 0) {
        await form.validateFields(fieldsToValidate);
      }
      
      console.log('Step validation successful for step:', currentStep);
      return true;
    } catch (error) {
      console.log('Step validation failed for step:', currentStep, error);
      return false;
    }
  };

  const handleNextStep = async () => {
    console.log('handleNextStep called, currentStep:', currentStep);
    
    // 检查当前表单值
    const currentValues = form.getFieldsValue();
    console.log('Current form values:', currentValues);
    console.log('startDate value:', currentValues.startDate);
    console.log('endDate value:', currentValues.endDate);
    console.log('startDate type:', typeof currentValues.startDate);
    console.log('endDate type:', typeof currentValues.endDate);
    
    // 检查表单字段状态
    const startDateField = form.getFieldValue('startDate');
    const endDateField = form.getFieldValue('endDate');
    console.log('startDate field value:', startDateField);
    console.log('endDate field value:', endDateField);
    
    const isValid = await validateCurrentStep();
    if (isValid) {
      console.log('Moving to next step:', currentStep + 1);
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Step validation failed, staying on current step');
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
  ];

  const renderBasicInfo = () => (
    <Card title="基本信息" style={{ marginBottom: 24 }}>
      <Row gutter={[16, 16]}>
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
                   {account.name} ({account.fiscalYear}) - {account.currency} {account.budget.toLocaleString()}
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
            rules={[{ required: true, message: '请选择活动开始时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择活动开始时间"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动结束时间"
            name="endDate"
            rules={[{ required: true, message: '请选择活动结束时间' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择活动结束时间"
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
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="注册结束时间"
            name="registrationEndDate"
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择注册结束时间（可选）"
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
          >
            <Switch />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => 
              getFieldValue('isVirtual') ? (
                <Form.Item
                  label="线上活动链接"
                  name="virtualLink"
                >
                  <Input placeholder="请输入线上活动链接" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            label="活动场地"
            name="venue"
            rules={[{ required: true, message: '请输入活动场地' }]}
          >
            <Input placeholder="请输入活动场地名称" />
          </Form.Item>
        </Col>
        <Col xs={24}>
          <Form.Item
            label="详细地址"
            name="address"
            rules={[{ required: true, message: '请输入详细地址' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入详细地址"
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="纬度"
            name="latitude"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入纬度（可选）"
              precision={6}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="经度"
            name="longitude"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入经度（可选）"
              precision={6}
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
        <Col xs={24}>
          <Divider orientation="left">参与限制</Divider>
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
        <Col xs={24} sm={12}>
          <Form.Item
            label="最小参与人数"
            name="minParticipants"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入最小参与人数"
              min={0}
            />
          </Form.Item>
        </Col>
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
        <Col xs={24}>
          <Form.Item
            label="封面图片"
            name="coverImageUrl"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              listType="picture-card"
              showUploadList={true}
              beforeUpload={() => false}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传封面图片</div>
              </div>
            </Upload>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );


  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          {mode === 'create' ? '创建活动' : '编辑活动'}
        </Title>
        <Text type="secondary">
          {mode === 'create' 
            ? '请填写活动信息，创建新的活动' 
            : '修改活动信息并保存更改'
          }
        </Text>
      </div>

      <Steps
        current={currentStep}
        items={steps}
        style={{ marginBottom: 32 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
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
                {mode === 'edit' && (
                  <Button
                    htmlType="button"
                    icon={<SaveOutlined />}
                    onClick={handleSaveDraft}
                    loading={loading}
                  >
                    保存草稿
                  </Button>
                )}
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
                    htmlType="submit"
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
