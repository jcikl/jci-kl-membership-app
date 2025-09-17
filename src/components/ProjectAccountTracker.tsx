import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  Typography,
  Progress,
  Tag,
  Button,
  DatePicker,
} from 'antd';
import {
  FundOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  BarChartOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  ProjectAccount,
  Event,
} from '@/types/event';
import { projectAccountService } from '@/modules/finance/services/projectAccountService';
import { eventService } from '@/modules/event/services/eventService';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ProjectAccountTrackerProps {
  projectAccountId?: string;
}

const ProjectAccountTracker: React.FC<ProjectAccountTrackerProps> = ({
  projectAccountId
}) => {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState<string>(projectAccountId || '');
  const [accounts, setAccounts] = useState<ProjectAccount[]>([]);
  const [account, setAccount] = useState<ProjectAccount | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadAccountDetails(selectedAccount);
    }
  }, [selectedAccount, dateRange]);

  const loadAccounts = async () => {
    try {
      const accountsData = await projectAccountService.getProjectAccounts();
      setAccounts(accountsData);
      
      // 如果有指定的项目户口ID，自动选择
      if (projectAccountId && accountsData.length > 0) {
        const foundAccount = accountsData.find(acc => acc.id === projectAccountId);
        if (foundAccount) {
          setSelectedAccount(projectAccountId);
        }
      }
    } catch (error) {
      console.error('加载项目户口列表失败:', error);
    }
  };

  const loadAccountDetails = async (accountId: string) => {
    setLoading(true);
    try {
      const [accountData, eventsData, statisticsData] = await Promise.all([
        projectAccountService.getProjectAccount(accountId),
        eventService.getEventsByProjectAccount(accountId),
        projectAccountService.getProjectAccountEventStatistics(accountId),
      ]);

      setAccount(accountData);
      setEvents(eventsData);
      setStatistics(statisticsData);

      // 如果有日期范围筛选，过滤活动
      if (dateRange) {
        const filteredEvents = eventsData.filter(event => {
          const eventDate = dayjs(event.startDate.toDate());
          return eventDate.isAfter(dateRange[0]) && eventDate.isBefore(dateRange[1]);
        });
        setEvents(filteredEvents);
      }
    } catch (error) {
      console.error('加载项目户口详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'orange';
      case 'completed':
        return 'blue';
      default:
        return 'default';
    }
  };

  const eventColumns = [
    {
      title: '活动名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Event) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{title}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.type} • {record.category}
          </Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          Published: 'green',
          Draft: 'orange',
          Cancelled: 'red',
          Completed: 'blue',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      },
    },
    {
      title: '日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (startDate: any) => dayjs(startDate.toDate()).format('YYYY-MM-DD'),
    },
    {
      title: '地点',
      dataIndex: 'venue',
      key: 'venue',
      render: (venue: string) => (
        <Text ellipsis={{ tooltip: venue }} style={{ maxWidth: 150 }}>
          {venue}
        </Text>
      ),
    },
    {
      title: '注册人数',
      dataIndex: 'totalRegistrations',
      key: 'totalRegistrations',
    },
    {
      title: '收入',
      key: 'revenue',
      render: (_: any, record: Event) => (
        <div>
          {record.isFree ? (
            <Text type="secondary">免费</Text>
          ) : (
            <Text>{record.currency} {(record.totalRegistrations * (record.regularPrice || 0)).toLocaleString()}</Text>
          )}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Event) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/events/${record.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      {/* 筛选器 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Select
              placeholder="选择项目户口"
              style={{ width: '100%' }}
              value={selectedAccount}
              onChange={setSelectedAccount}
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {accounts.map(account => (
                <Option key={account.id} value={account.id}>
                  {account.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
          </Col>
          <Col xs={24} sm={8}>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={() => {
                // 可以添加导出功能
              }}
            >
              导出数据
            </Button>
          </Col>
        </Row>
      </Card>

      {selectedAccount && account && (
        <>
          {/* 项目户口概览 */}
          <Card title={`${account.name} - 项目追踪`} style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={6}>
                <Statistic
                  title="项目户口"
                  value={account.name}
                  prefix={<FundOutlined />}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="预算"
                  value={`${account.currency} ${account.budget.toLocaleString()}`}
                  prefix={<DollarOutlined />}
                />
              </Col>
              <Col xs={24} sm={6}>
                <Statistic
                  title="状态"
                  value={account.status === 'active' ? '活跃' : 
                         account.status === 'inactive' ? '停用' : '已完成'}
                  suffix={
                    <Tag color={getStatusColor(account.status)}>
                      {account.status === 'active' ? '活跃' : 
                       account.status === 'inactive' ? '停用' : '已完成'}
                    </Tag>
                  }
                />
              </Col>
            </Row>
          </Card>

          {/* 统计数据 */}
          {statistics && (
            <Card title="活动统计" style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={6}>
                  <Statistic
                    title="总活动数"
                    value={statistics.totalEvents}
                    prefix={<CalendarOutlined />}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Statistic
                    title="已发布活动"
                    value={statistics.publishedEvents}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Statistic
                    title="总注册人数"
                    value={statistics.totalRegistrations}
                    prefix={<UserOutlined />}
                  />
                </Col>
                <Col xs={24} sm={6}>
                  <Statistic
                    title="总收入"
                    value={statistics.totalRevenue}
                    prefix={<DollarOutlined />}
                    suffix={account.currency}
                  />
                </Col>
              </Row>
              
              <div style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Text>预算使用率</Text>
                    <Progress
                      percent={statistics.budgetUtilization}
                      status={statistics.budgetUtilization > 100 ? 'exception' : 'active'}
                    />
                    <Text type="secondary">
                      {statistics.totalRevenue.toLocaleString()} / {account.budget.toLocaleString()} {account.currency}
                    </Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text>负责人信息</Text>
                    <div style={{ marginTop: 8 }}>
                      <div>{account.responsiblePerson}</div>
                      <Text type="secondary">{account.responsiblePersonEmail}</Text>
                    </div>
                  </Col>
                </Row>
              </div>
            </Card>
          )}

          {/* 活动列表 */}
          <Card title="相关活动">
            <Table
              columns={eventColumns}
              dataSource={events}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          </Card>
        </>
      )}

      {!selectedAccount && (
        <Card>
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <FundOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: 16 }} />
            <Title level={4} type="secondary">请选择一个项目户口进行追踪</Title>
            <Text type="secondary">选择项目户口后，可以查看该项目的所有活动数据和财务追踪</Text>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProjectAccountTracker;
