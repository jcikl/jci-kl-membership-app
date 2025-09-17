import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Button,
  Descriptions,
  Tabs,
  Table,
  Avatar,
  Statistic,
  Progress,
  message,
  Modal,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
  PhoneOutlined,
  MailOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  Event,
  EventProgram,
  CommitteeMember,
  EventTrainer,
  EventTicket,
  EventStatistics,
} from '@/types/event';
import { 
  eventService,
  eventProgramService,
  eventCommitteeService,
  eventTrainerService,
  eventTicketService,
} from '@/modules/event/services/eventService';

const { Title, Text, Paragraph } = Typography;

interface EventDetailProps {
  eventId: string;
  mode?: 'admin' | 'public';
}

const EventDetail: React.FC<EventDetailProps> = ({ eventId, mode = 'admin' }) => {
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [programs, setPrograms] = useState<EventProgram[]>([]);
  const [committee, setCommittee] = useState<CommitteeMember[]>([]);
  const [trainers, setTrainers] = useState<EventTrainer[]>([]);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [statistics, setStatistics] = useState<EventStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // 加载活动详情
  useEffect(() => {
    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    setLoading(true);
    try {
      // 并行加载所有数据
      const [
        eventData,
        programsData,
        committeeData,
        trainersData,
        ticketsData,
        statisticsData,
      ] = await Promise.all([
        eventService.getEvent(eventId),
        eventProgramService.getEventPrograms(eventId),
        eventCommitteeService.getEventCommittee(eventId),
        eventTrainerService.getEventTrainers(eventId),
        eventTicketService.getEventTickets(eventId),
        eventService.getEventStatistics(eventId),
      ]);

      if (eventData) {
        setEvent(eventData);
        setPrograms(programsData);
        setCommittee(committeeData);
        setTrainers(trainersData);
        setTickets(ticketsData);
        setStatistics(statisticsData);
      } else {
        message.error('活动不存在');
        navigate('/events');
      }
    } catch (error) {
      console.error('加载活动详情失败:', error);
      message.error('加载活动详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Published':
        return 'green';
      case 'Draft':
        return 'orange';
      case 'Cancelled':
        return 'red';
      case 'Completed':
        return 'blue';
      default:
        return 'default';
    }
  };

  // 获取级别标签颜色
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'JCI':
        return 'purple';
      case 'National':
        return 'blue';
      case 'Area':
        return 'green';
      case 'Local':
        return 'orange';
      default:
        return 'default';
    }
  };

  // 渲染概览信息
  const renderOverview = () => {
    if (!event) return null;

    return (
      <Row gutter={[24, 24]}>
        {/* 基本信息 */}
        <Col xs={24} lg={16}>
          <Card title="基本信息">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="活动标题">
                <Title level={4} style={{ margin: 0 }}>
                  {event.title}
                </Title>
              </Descriptions.Item>
              <Descriptions.Item label="活动状态">
                <Tag color={getStatusColor(event.status)}>{event.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="活动类型">
                {event.type}
              </Descriptions.Item>
              <Descriptions.Item label="活动类别">
                {event.category}
              </Descriptions.Item>
              <Descriptions.Item label="活动级别">
                <Tag color={getLevelColor(event.level)}>{event.level}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="主办分会">
                {event.hostingLO}
              </Descriptions.Item>
              <Descriptions.Item label="协办分会">
                {event.coHostingLOs?.join(', ') || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="项目户口">
                {event.projectAccount ? (
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{event.projectAccount.name}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {event.projectAccount.currency} {event.projectAccount.budget.toLocaleString()}
                    </Text>
                  </div>
                ) : (
                  <Text type="secondary">未绑定</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="联系邮箱">
                <a href={`mailto:${event.contactEmail}`}>
                  <MailOutlined /> {event.contactEmail}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                {event.contactPhone ? (
                  <a href={`tel:${event.contactPhone}`}>
                    <PhoneOutlined /> {event.contactPhone}
                  </a>
                ) : '未提供'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 统计信息 */}
        <Col xs={24} lg={8}>
          <Card title="统计信息">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="总注册数"
                  value={statistics?.totalRegistrations || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="已批准"
                  value={statistics?.approvedRegistrations || 0}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="待审核"
                  value={statistics?.pendingRegistrations || 0}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="总收入"
                  value={statistics?.totalRevenue || 0}
                  prefix={<DollarOutlined />}
                  suffix={event.currency}
                />
              </Col>
            </Row>
            {event.maxParticipants && (
              <div style={{ marginTop: 16 }}>
                <Text>参与进度</Text>
                <Progress
                  percent={Math.round(((statistics?.totalRegistrations || 0) / event.maxParticipants) * 100)}
                  status={(statistics?.totalRegistrations || 0) >= event.maxParticipants ? 'exception' : 'active'}
                />
                <Text type="secondary">
                  {statistics?.totalRegistrations || 0} / {event.maxParticipants}
                </Text>
              </div>
            )}
          </Card>
        </Col>

        {/* 时间地点信息 */}
        <Col xs={24}>
          <Card title="时间地点">
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Space direction="vertical" size="small">
                  <div>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    <Text strong>活动时间</Text>
                  </div>
                  <div style={{ marginLeft: 24 }}>
                    <div>
                      开始: {dayjs(event.startDate.toDate()).format('YYYY-MM-DD HH:mm')}
                    </div>
                    <div>
                      结束: {dayjs(event.endDate.toDate()).format('YYYY-MM-DD HH:mm')}
                    </div>
                    {event.registrationStartDate && (
                      <div>
                        注册开始: {dayjs(event.registrationStartDate.toDate()).format('YYYY-MM-DD HH:mm')}
                      </div>
                    )}
                    {event.registrationEndDate && (
                      <div>
                        注册结束: {dayjs(event.registrationEndDate.toDate()).format('YYYY-MM-DD HH:mm')}
                      </div>
                    )}
                  </div>
                </Space>
              </Col>
              <Col xs={24} md={12}>
                <Space direction="vertical" size="small">
                  <div>
                    <EnvironmentOutlined style={{ marginRight: 8 }} />
                    <Text strong>活动地点</Text>
                  </div>
                  <div style={{ marginLeft: 24 }}>
                    <div>{event.venue}</div>
                    <div>{event.address}</div>
                    {event.isVirtual && (
                      <div>
                        <GlobalOutlined style={{ marginRight: 4 }} />
                        线上活动: {event.virtualLink}
                      </div>
                    )}
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 费用信息 */}
        <Col xs={24}>
          <Card title="费用信息">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="活动费用"
                  value={event.isFree ? '免费' : `${event.currency} ${event.regularPrice}`}
                  prefix={event.isFree ? null : <DollarOutlined />}
                />
              </Col>
              {!event.isFree && event.earlyBirdPrice && (
                <Col xs={24} sm={8}>
                  <Statistic
                    title="早鸟价格"
                    value={`${event.currency} ${event.earlyBirdPrice}`}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              )}
              {!event.isFree && event.memberPrice && (
                <Col xs={24} sm={8}>
                  <Statistic
                    title="会员价格"
                    value={`${event.currency} ${event.memberPrice}`}
                    prefix={<DollarOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              )}
            </Row>
          </Card>
        </Col>

        {/* 活动描述 */}
        <Col xs={24}>
          <Card title="活动描述">
            <Paragraph>{event.description}</Paragraph>
          </Card>
        </Col>
      </Row>
    );
  };

  // 渲染程序安排
  const renderPrograms = () => {
    const columns = [
      {
        title: '时间',
        dataIndex: 'date',
        key: 'date',
        render: (date: any) => dayjs(date.toDate()).format('YYYY-MM-DD HH:mm'),
      },
      {
        title: '程序',
        dataIndex: 'program',
        key: 'program',
      },
      {
        title: '主持人',
        dataIndex: 'sessionChair',
        key: 'sessionChair',
      },
      {
        title: '注册要求',
        dataIndex: 'registrationRequired',
        key: 'registrationRequired',
        render: (required: boolean) => (
          <Tag color={required ? 'green' : 'default'}>
            {required ? '需要注册' : '无需注册'}
          </Tag>
        ),
      },
      {
        title: '最大座位',
        dataIndex: 'maxSeats',
        key: 'maxSeats',
        render: (seats: number) => seats || '无限制',
      },
      {
        title: '竞赛',
        dataIndex: 'isCompetition',
        key: 'isCompetition',
        render: (isCompetition: boolean) => (
          <Tag color={isCompetition ? 'red' : 'default'}>
            {isCompetition ? '是' : '否'}
          </Tag>
        ),
      },
    ];

    return (
      <Card title="程序安排">
        <Table
          columns={columns}
          dataSource={programs}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  // 渲染委员会成员
  const renderCommittee = () => {
    const columns = [
      {
        title: '姓名',
        dataIndex: 'fullName',
        key: 'fullName',
        render: (name: string) => (
          <Space>
            <Avatar size="small">{name.charAt(0)}</Avatar>
            {name}
          </Space>
        ),
      },
      {
        title: '职位',
        dataIndex: 'position',
        key: 'position',
      },
      {
        title: '联系方式',
        dataIndex: 'contact',
        key: 'contact',
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        key: 'email',
        render: (email: string) => (
          <a href={`mailto:${email}`}>{email}</a>
        ),
      },
      {
        title: '状态',
        key: 'status',
        render: (_: any, record: CommitteeMember) => (
          <Space>
            {record.isRegistered && (
              <Tag color="green">已注册</Tag>
            )}
            {record.isCommittee && (
              <Tag color="blue">委员会</Tag>
            )}
            {record.isPersonInCharge && (
              <Tag color="purple">负责人</Tag>
            )}
          </Space>
        ),
      },
    ];

    return (
      <Card title="委员会成员">
        <Table
          columns={columns}
          dataSource={committee}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  // 渲染讲师信息
  const renderTrainers = () => {
    const columns = [
      {
        title: '姓名',
        dataIndex: 'fullName',
        key: 'fullName',
        render: (name: string) => (
          <Space>
            <Avatar size="small">{name.charAt(0)}</Avatar>
            {name}
          </Space>
        ),
      },
      {
        title: '职位/头衔',
        dataIndex: 'title',
        key: 'title',
      },
      {
        title: '联系方式',
        dataIndex: 'contact',
        key: 'contact',
      },
      {
        title: '邮箱',
        dataIndex: 'email',
        key: 'email',
        render: (email: string) => (
          <a href={`mailto:${email}`}>{email}</a>
        ),
      },
    ];

    return (
      <Card title="讲师信息">
        <Table
          columns={columns}
          dataSource={trainers}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  // 渲染票务信息
  const renderTickets = () => {
    const columns = [
      {
        title: '票务名称',
        dataIndex: 'name',
        key: 'name',
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: '数量',
        key: 'quantity',
        render: (_: any, record: EventTicket) => (
          <div>
            <div>总数: {record.quantity}</div>
            <div>已售: {record.soldQuantity}</div>
            <div>剩余: {record.quantity - record.soldQuantity}</div>
          </div>
        ),
      },
      {
        title: '价格',
        key: 'price',
        render: (_: any, record: EventTicket) => (
          <div>
            <div>标准: {record.currency} {record.regularPrice}</div>
            {record.discountPrice && (
              <div>折扣: {record.currency} {record.discountPrice}</div>
            )}
          </div>
        ),
      },
      {
        title: '状态',
        dataIndex: 'isActive',
        key: 'isActive',
        render: (isActive: boolean) => (
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? '活跃' : '停用'}
          </Tag>
        ),
      },
    ];

    return (
      <Card title="票务信息">
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    );
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!event) {
    return <div>活动不存在</div>;
  }

  return (
    <div>
      {/* 头部操作栏 */}
      {mode === 'admin' && (
        <Card style={{ marginBottom: 24 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/events/${eventId}/edit`)}
                >
                  编辑活动
                </Button>
                {event.status === 'Draft' && (
                  <Button
                    icon={<TrophyOutlined />}
                    onClick={() => {
                      eventService.publishEvent(eventId, 'current-user-id');
                      message.success('活动已发布');
                      loadEventDetail();
                    }}
                  >
                    发布活动
                  </Button>
                )}
                {event.status === 'Published' && (
                  <Button
                    danger
                    onClick={() => {
                      eventService.cancelEvent(eventId, 'current-user-id');
                      message.success('活动已取消');
                      loadEventDetail();
                    }}
                  >
                    取消活动
                  </Button>
                )}
              </Space>
            </Col>
            <Col>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  Modal.confirm({
                    title: '确认删除',
                    content: '确定要删除这个活动吗？此操作不可撤销。',
                    onOk: async () => {
                      await eventService.deleteEvent(eventId);
                      message.success('活动已删除');
                      navigate('/events');
                    },
                  });
                }}
              >
                删除活动
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* 主要内容 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: '概览',
            children: renderOverview(),
          },
          {
            key: 'programs',
            label: '程序安排',
            children: renderPrograms(),
          },
          {
            key: 'committee',
            label: '委员会',
            children: renderCommittee(),
          },
          {
            key: 'trainers',
            label: '讲师',
            children: renderTrainers(),
          },
          {
            key: 'tickets',
            label: '票务',
            children: renderTickets(),
          },
        ]}
      />
    </div>
  );
};

export default EventDetail;
