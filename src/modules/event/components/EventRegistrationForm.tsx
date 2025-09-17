import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Space,
  Typography,
  Divider,
  Radio,
  Checkbox,
  message,
  Alert,
  Spin,
} from 'antd';
import { useForm } from 'antd/es/form/Form';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  CheckOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Event,
  EventTicket,
  EventRegistrationData,
} from '@/types/event';
import { eventService, eventTicketService, eventRegistrationService } from '@/modules/event/services/eventService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface EventRegistrationFormProps {
  eventId?: string;
  onSuccess?: (registrationId: string) => void;
}

const EventRegistrationForm: React.FC<EventRegistrationFormProps> = ({
  eventId,
  onSuccess
}) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = useForm();
  const [loading, setLoading] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<EventTicket | null>(null);
  const [registrationDeadline, setRegistrationDeadline] = useState<boolean>(false);

  const currentEventId = eventId || id;

  useEffect(() => {
    if (currentEventId) {
      loadEventData();
    }
  }, [currentEventId]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const [eventData, ticketsData] = await Promise.all([
        eventService.getEvent(currentEventId!),
        eventTicketService.getEventTickets(currentEventId!),
      ]);

      if (!eventData) {
        message.error('活动不存在');
        navigate('/events');
        return;
      }

      if (eventData.status !== 'Published') {
        message.error('该活动暂不接受注册');
        navigate('/events');
        return;
      }

      setEvent(eventData);
      setTickets(ticketsData);

      // 检查注册截止时间
      if (eventData.registrationEndDate) {
        const now = dayjs();
        const deadline = dayjs(eventData.registrationEndDate.toDate());
        setRegistrationDeadline(now.isAfter(deadline));
      }

      // 检查是否已满员
      if (eventData.maxParticipants && eventData.totalRegistrations >= eventData.maxParticipants) {
        message.warning('该活动已满员');
        setRegistrationDeadline(true);
      }

    } catch (error) {
      console.error('加载活动数据失败:', error);
      message.error('加载活动数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (registrationDeadline) {
      message.error('注册已截止或活动已满员');
      return;
    }

    setLoading(true);
    try {
      const registrationData: EventRegistrationData = {
        eventId: currentEventId!,
        ticketId: selectedTicket?.id,
        userName: values.userName,
        userEmail: values.userEmail,
        userPhone: values.userPhone,
        nricPassport: values.nricPassport,
        arrangements: {
          nameOnTag: values.nameOnTag,
          meal: values.meal,
          foodAllergy: values.foodAllergy,
          tshirt: values.tshirt,
          tshirtSize: values.tshirtSize,
          accommodation: values.accommodation,
          transportation: values.transportation,
        },
        emergencyContact: values.emergencyContact ? {
          name: values.emergencyContactName,
          relationship: values.emergencyContactRelationship,
          phone: values.emergencyContactPhone,
        } : undefined,
        notes: values.notes || null,
      };

      const registrationId = await eventRegistrationService.registerForEvent(
        registrationData,
        'current-user-id' // TODO: 获取当前用户ID
      );

      message.success('注册成功！请等待审核。');
      
      if (onSuccess) {
        onSuccess(registrationId);
      } else {
        navigate(`/events/${currentEventId}/registration-success`);
      }

    } catch (error) {
      console.error('注册失败:', error);
      message.error('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (ticket: EventTicket) => {
    // 这里可以根据用户类型计算价格
    // 暂时返回标准价格
    return ticket.regularPrice;
  };

  const handleTicketChange = (ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    setSelectedTicket(ticket || null);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载活动信息...</div>
      </div>
    );
  }

  if (!event) {
    return <div>活动不存在</div>;
  }

  if (registrationDeadline) {
    return (
      <Alert
        message="注册已截止"
        description="该活动的注册时间已截止或活动已满员，无法进行注册。"
        type="warning"
        showIcon
        action={
          <Button size="small" onClick={() => navigate('/events')}>
            返回活动列表
          </Button>
        }
      />
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* 活动信息卡片 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Title level={3}>{event.title}</Title>
            <Space direction="vertical" size="small">
              <div>
                <CalendarOutlined style={{ marginRight: 8 }} />
                {dayjs(event.startDate.toDate()).format('YYYY年MM月DD日 HH:mm')} - 
                {dayjs(event.endDate.toDate()).format('HH:mm')}
              </div>
              <div>
                <EnvironmentOutlined style={{ marginRight: 8 }} />
                {event.venue}, {event.address}
              </div>
              {event.isVirtual && (
                <div>
                  <EnvironmentOutlined style={{ marginRight: 8 }} />
                  线上活动: {event.virtualLink}
                </div>
              )}
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                {event.isFree ? (
                  <Title level={2} style={{ color: '#52c41a', margin: 0 }}>
                    免费
                  </Title>
                ) : (
                  <div>
                    <Title level={2} style={{ margin: 0 }}>
                      {event.currency} {selectedTicket ? calculatePrice(selectedTicket) : event.regularPrice}
                    </Title>
                    {selectedTicket && selectedTicket.discountPrice && (
                      <Text delete style={{ color: '#999' }}>
                        {event.currency} {selectedTicket.regularPrice}
                      </Text>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 注册表单 */}
      <Card title="注册信息">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          scrollToFirstError
        >
          {/* 票务选择 */}
          {tickets.length > 0 && (
            <Card title="选择票务" size="small" style={{ marginBottom: 24 }}>
              <Form.Item
                name="ticketId"
                rules={[{ required: true, message: '请选择票务类型' }]}
              >
                <Radio.Group onChange={(e) => handleTicketChange(e.target.value)}>
                  <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {tickets.map(ticket => (
                      <Radio key={ticket.id} value={ticket.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <div>
                            <div style={{ fontWeight: 'bold' }}>{ticket.name}</div>
                            {ticket.description && (
                              <div style={{ color: '#666', fontSize: '12px' }}>
                                {ticket.description}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 'bold' }}>
                              {ticket.currency} {calculatePrice(ticket)}
                            </div>
                            {ticket.discountPrice && (
                              <div style={{ color: '#999', fontSize: '12px' }}>
                                原价: {ticket.currency} {ticket.regularPrice}
                              </div>
                            )}
                          </div>
                        </div>
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Card>
          )}

          {/* 基本信息 */}
          <Divider orientation="left">基本信息</Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="姓名"
                name="userName"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="请输入您的姓名"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="邮箱"
                name="userEmail"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="请输入您的邮箱"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="手机号码"
                name="userPhone"
                rules={[{ required: true, message: '请输入手机号码' }]}
              >
                <Input
                  prefix={<PhoneOutlined />}
                  placeholder="请输入您的手机号码"
                />
              </Form.Item>
            </Col>
            {event.registrationSettings?.collectPersonalInfo?.nricPassport && (
              <Col xs={24} sm={12}>
                <Form.Item
                  label="身份证/护照号码"
                  name="nricPassport"
                  rules={[{ required: true, message: '请输入身份证或护照号码' }]}
                >
                  <Input placeholder="请输入身份证或护照号码" />
                </Form.Item>
              </Col>
            )}
          </Row>

          {/* 活动安排 */}
          <Divider orientation="left">活动安排</Divider>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="姓名标签"
                name="nameOnTag"
              >
                <Input placeholder="请输入标签上显示的姓名（可选）" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="T恤尺码"
                name="tshirtSize"
              >
                <Select placeholder="请选择T恤尺码（可选）">
                  <Option value="XS">XS</Option>
                  <Option value="S">S</Option>
                  <Option value="M">M</Option>
                  <Option value="L">L</Option>
                  <Option value="XL">XL</Option>
                  <Option value="XXL">XXL</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="用餐"
                name="meal"
                valuePropName="checked"
              >
                <Checkbox>需要用餐</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="T恤"
                name="tshirt"
                valuePropName="checked"
              >
                <Checkbox>需要T恤</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="住宿"
                name="accommodation"
                valuePropName="checked"
              >
                <Checkbox>需要住宿</Checkbox>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="交通"
                name="transportation"
                valuePropName="checked"
              >
                <Checkbox>需要接送</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="食物过敏信息"
            name="foodAllergy"
          >
            <TextArea
              rows={3}
              placeholder="如有食物过敏，请详细说明（可选）"
            />
          </Form.Item>

          {/* 紧急联系人 */}
          <Divider orientation="left">紧急联系人</Divider>
          <Form.Item
            label="是否需要填写紧急联系人"
            name="emergencyContact"
            valuePropName="checked"
          >
            <Checkbox>需要填写紧急联系人信息</Checkbox>
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => {
              const needEmergencyContact = getFieldValue('emergencyContact');
              if (!needEmergencyContact) return null;

              return (
                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label="联系人姓名"
                      name="emergencyContactName"
                      rules={[{ required: true, message: '请输入紧急联系人姓名' }]}
                    >
                      <Input placeholder="请输入联系人姓名" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label="关系"
                      name="emergencyContactRelationship"
                      rules={[{ required: true, message: '请输入与联系人的关系' }]}
                    >
                      <Select placeholder="请选择关系">
                        <Option value="父母">父母</Option>
                        <Option value="配偶">配偶</Option>
                        <Option value="兄弟姐妹">兄弟姐妹</Option>
                        <Option value="朋友">朋友</Option>
                        <Option value="其他">其他</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Form.Item
                      label="联系电话"
                      name="emergencyContactPhone"
                      rules={[{ required: true, message: '请输入紧急联系人电话' }]}
                    >
                      <Input placeholder="请输入联系电话" />
                    </Form.Item>
                  </Col>
                </Row>
              );
            }}
          </Form.Item>

          {/* 备注 */}
          <Form.Item
            label="备注"
            name="notes"
          >
            <TextArea
              rows={3}
              placeholder="如有其他需要说明的信息，请在此填写（可选）"
            />
          </Form.Item>

          {/* 提交按钮 */}
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CheckOutlined />}
                loading={loading}
                size="large"
              >
                提交注册
              </Button>
              <Button
                onClick={() => navigate('/events')}
                size="large"
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EventRegistrationForm;
