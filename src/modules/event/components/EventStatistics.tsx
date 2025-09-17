import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Select,
  Space,
  Typography,
  Progress,
  Tag,
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { eventService } from '@/modules/event/services/eventService';
import { Event, EventStatistics as EventStatsType } from '@/types/event';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const EventStatistics: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [statistics, setStatistics] = useState<EventStatsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadEventStatistics(selectedEvent);
    }
  }, [selectedEvent]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = await eventService.getEvents({ limit: 1000 });
      setEvents(response.events);
    } catch (error) {
      console.error('加载活动列表失败:', error);
      // Set empty array on error to prevent further issues
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEventStatistics = async (eventId: string) => {
    setLoading(true);
    try {
      const stats = await eventService.getEventStatistics(eventId);
      setStatistics(stats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      setStatistics(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallStats = () => {
    if (!events || !events.length) return null;

    const totalEvents = events.length;
    const publishedEvents = events.filter(e => e && e.status === 'Published').length;
    const totalRegistrations = events.reduce((sum, e) => sum + (e?.totalRegistrations || 0), 0);
    const totalRevenue = events.reduce((sum, e) => {
      // 这里需要根据实际价格计算，暂时使用总注册数 * 平均价格
      return sum + ((e?.totalRegistrations || 0) * (e?.regularPrice || 0));
    }, 0);

    return {
      totalEvents,
      publishedEvents,
      totalRegistrations,
      totalRevenue,
    };
  };

  const overallStats = calculateOverallStats();

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
      title: '注册人数',
      dataIndex: 'totalRegistrations',
      key: 'totalRegistrations',
      render: (total: number, record: Event) => (
        <div>
          <div>{total}</div>
          {record.maxParticipants && (
            <Progress
              percent={Math.round((total / record.maxParticipants) * 100)}
              size="small"
              showInfo={false}
            />
          )}
        </div>
      ),
    },
    {
      title: '收入',
      dataIndex: 'regularPrice',
      key: 'revenue',
      render: (price: number, record: Event) => (
        <div>
          {record.isFree ? (
            <Text type="secondary">免费</Text>
          ) : (
            <Text>{record.currency} {record.totalRegistrations * (price || 0)}</Text>
          )}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => {
        if (!createdAt) return '-';
        try {
          return dayjs(createdAt.toDate()).format('YYYY-MM-DD');
        } catch (error) {
          return '-';
        }
      },
    },
  ];

  return (
    <div>
      <Title level={3}>活动数据统计</Title>
      
      {/* 总体统计 */}
      {overallStats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总活动数"
                value={overallStats.totalEvents}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="已发布活动"
                value={overallStats.publishedEvents}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总注册人数"
                value={overallStats.totalRegistrations}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card>
              <Statistic
                title="总收入"
                value={overallStats.totalRevenue}
                prefix={<DollarOutlined />}
                suffix="MYR"
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Select
            placeholder="选择活动查看详细统计"
            style={{ width: 300 }}
            value={selectedEvent}
            onChange={setSelectedEvent}
            allowClear
          >
            {events.map(event => (
              <Option key={event.id} value={event.id}>
                {event.title}
              </Option>
            ))}
          </Select>
          <RangePicker
            placeholder={['开始日期', '结束日期']}
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
          />
        </Space>
      </Card>

      {/* 活动列表统计 */}
      <Card title="活动列表统计">
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

      {/* 单个活动详细统计 */}
      {selectedEvent && statistics && (
        <Card title="详细统计数据" style={{ marginTop: 24 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Statistic
                title="总注册数"
                value={statistics.totalRegistrations}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="已批准"
                value={statistics.approvedRegistrations}
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="待审核"
                value={statistics.pendingRegistrations}
                valueStyle={{ color: '#cf1322' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="总收入"
                value={statistics.totalRevenue}
                prefix={<DollarOutlined />}
                suffix="MYR"
              />
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default EventStatistics;
