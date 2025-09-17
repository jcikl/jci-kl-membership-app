import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Select,
  Row,
  Col,
  Modal,
  message,
  Tooltip,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  Event, 
  EventType, 
  EventLevel, 
  EventStatus, 
  EventFilter 
} from '@/types/event';
import { eventService } from '@/modules/event/services/eventService';

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface EventListProps {
  showCreateButton?: boolean;
  showActions?: boolean;
  filter?: EventFilter;
  onEventSelect?: (event: Event) => void;
  mode?: 'admin' | 'public';
}

const EventList: React.FC<EventListProps> = ({
  showCreateButton = true,
  showActions = true,
  filter = {},
  onEventSelect,
  mode = 'admin'
}) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState<EventFilter>(filter);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  // 加载活动列表
  const loadEvents = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        filter: {
          ...filters,
          searchText: searchText || undefined,
        },
      };

      let response;
      if (mode === 'public') {
        response = await eventService.getPublicEvents(params);
      } else {
        response = await eventService.getEvents(params);
      }

      setEvents(response.events);
      setPagination({
        current: page,
        pageSize,
        total: response.total,
      });
    } catch (error) {
      console.error('加载活动列表失败:', error);
      message.error('加载活动列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [filters, searchText, mode]);

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 过滤器处理
  const handleFilterChange = (key: keyof EventFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  // 分页处理
  const handleTableChange = (pagination: any) => {
    loadEvents(pagination.current, pagination.pageSize);
  };

  // 删除活动
  const handleDelete = async (eventId: string) => {
    try {
      await eventService.deleteEvent(eventId);
      message.success('活动删除成功');
      loadEvents(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('删除活动失败:', error);
      message.error('删除活动失败');
    }
  };

  // 发布活动
  const handlePublish = async (eventId: string) => {
    try {
      await eventService.publishEvent(eventId, 'current-user-id'); // TODO: 获取当前用户ID
      message.success('活动发布成功');
      loadEvents(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('发布活动失败:', error);
      message.error('发布活动失败');
    }
  };

  // 取消活动
  const handleCancel = async (eventId: string) => {
    try {
      await eventService.cancelEvent(eventId, 'current-user-id'); // TODO: 获取当前用户ID
      message.success('活动已取消');
      loadEvents(pagination.current, pagination.pageSize);
    } catch (error) {
      console.error('取消活动失败:', error);
      message.error('取消活动失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的活动');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个活动吗？此操作不可撤销。`,
      onOk: async () => {
        try {
          const deletePromises = selectedRowKeys.map(key => 
            eventService.deleteEvent(key as string)
          );
          await Promise.all(deletePromises);
          message.success(`成功删除 ${selectedRowKeys.length} 个活动`);
          setSelectedRowKeys([]);
          loadEvents(pagination.current, pagination.pageSize);
        } catch (error) {
          console.error('批量删除失败:', error);
          message.error('批量删除失败');
        }
      },
    });
  };

  // 获取状态标签颜色
  const getStatusColor = (status: EventStatus) => {
    switch (status) {
      case EventStatus.PUBLISHED:
        return 'green';
      case EventStatus.DRAFT:
        return 'orange';
      case EventStatus.CANCELLED:
        return 'red';
      case EventStatus.COMPLETED:
        return 'blue';
      default:
        return 'default';
    }
  };

  // 获取级别标签颜色
  const getLevelColor = (level: EventLevel) => {
    switch (level) {
      case EventLevel.JCI:
        return 'purple';
      case EventLevel.NATIONAL:
        return 'blue';
      case EventLevel.AREA:
        return 'green';
      case EventLevel.LOCAL:
        return 'orange';
      default:
        return 'default';
    }
  };

  // 表格列定义
  const columns: any[] = [
    {
      title: '活动标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (title: string, record: Event) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            {title}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.type} • {record.category}
          </div>
        </div>
      ),
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (level: EventLevel) => (
        <Tag color={getLevelColor(level)}>{level}</Tag>
      ),
      filters: Object.values(EventLevel).map(level => ({
        text: level,
        value: level,
      })),
      onFilter: (value: any, record: Event) => record.level === value,
    },
    {
      title: '日期时间',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 180,
      render: (startDate: any, record: Event) => (
        <div>
          <div>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {dayjs(startDate.toDate()).format('YYYY-MM-DD')}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(startDate.toDate()).format('HH:mm')} - {dayjs(record.endDate.toDate()).format('HH:mm')}
          </div>
        </div>
      ),
    },
    {
      title: '地点',
      dataIndex: 'venue',
      key: 'venue',
      width: 200,
      render: (venue: string, record: Event) => (
        <div>
          <div>
            <EnvironmentOutlined style={{ marginRight: 4 }} />
            {venue}
          </div>
          {record.isVirtual && (
            <Tag color="blue">线上活动</Tag>
          )}
        </div>
      ),
    },
    {
      title: '主办方',
      dataIndex: 'hostingLO',
      key: 'hostingLO',
      width: 150,
      render: (hostingLO: string, record: Event) => (
        <div>
          <div>{hostingLO}</div>
          {record.coHostingLOs && record.coHostingLOs.length > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              协办: {record.coHostingLOs.join(', ')}
            </Text>
          )}
          {record.projectAccount && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              项目: {record.projectAccount.name}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '费用',
      dataIndex: 'regularPrice',
      key: 'regularPrice',
      width: 120,
      render: (price: number, record: Event) => (
        <div>
          {record.isFree ? (
            <Tag color="green">免费</Tag>
          ) : (
            <div>
              <div>
                <DollarOutlined style={{ marginRight: 4 }} />
                {record.currency} {price}
              </div>
              {record.earlyBirdPrice && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  早鸟: {record.currency} {record.earlyBirdPrice}
                </Text>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: EventStatus) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
      filters: Object.values(EventStatus).map(status => ({
        text: status,
        value: status,
      })),
      onFilter: (value: any, record: Event) => record.status === value,
    },
    {
      title: '注册人数',
      dataIndex: 'totalRegistrations',
      key: 'totalRegistrations',
      width: 120,
      render: (total: number, record: Event) => (
        <div>
          <div>
            <UserOutlined style={{ marginRight: 4 }} />
            {total}
          </div>
          {record.maxParticipants && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              限额: {record.maxParticipants}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (createdAt: any) => (
        <div>
          <div>{dayjs(createdAt.toDate()).format('YYYY-MM-DD')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(createdAt.toDate()).format('HH:mm')}
          </Text>
        </div>
      ),
      sorter: (a: Event, b: Event) => a.createdAt.toMillis() - b.createdAt.toMillis(),
    },
  ];

  // 如果是管理员模式，添加操作列
  if (mode === 'admin' && showActions) {
    columns.push({
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_: any, record: Event) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                if (onEventSelect) {
                  onEventSelect(record);
                } else {
                  navigate(`/events/${record.id}`);
                }
              }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/events/${record.id}/edit`)}
            />
          </Tooltip>
          {record.status === EventStatus.DRAFT && (
            <Tooltip title="发布">
              <Button
                type="text"
                icon={<CalendarOutlined />}
                onClick={() => handlePublish(record.id)}
              />
            </Tooltip>
          )}
          {record.status === EventStatus.PUBLISHED && (
            <Tooltip title="取消">
              <Button
                type="text"
                icon={<CalendarOutlined />}
                onClick={() => handleCancel(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个活动吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    });
  }

  // 如果是公开模式，添加注册按钮
  if (mode === 'public') {
    columns.push({
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_: any, record: Event) => (
        <Button
          type="primary"
          onClick={() => navigate(`/events/${record.id}/register`)}
          disabled={record.status !== EventStatus.PUBLISHED}
        >
          {record.status === EventStatus.PUBLISHED ? '立即注册' : '暂不可注册'}
        </Button>
      ),
    });
  }

  return (
    <div>
      {/* 搜索和过滤器 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8} lg={6}>
            <Search
              placeholder="搜索活动标题、地点..."
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="活动类型"
              allowClear
              style={{ width: '100%' }}
              value={filters.type}
              onChange={(value) => handleFilterChange('type', value)}
            >
              {Object.values(EventType).map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="活动级别"
              allowClear
              style={{ width: '100%' }}
              value={filters.level}
              onChange={(value) => handleFilterChange('level', value)}
            >
              {Object.values(EventLevel).map(level => (
                <Option key={level} value={level}>{level}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder="活动状态"
              allowClear
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
            >
              {Object.values(EventStatus).map(status => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Space>
              {showCreateButton && mode === 'admin' && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/events/create')}
                >
                  创建活动
                </Button>
              )}
              {selectedRowKeys.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                >
                  批量删除 ({selectedRowKeys.length})
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 活动列表表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={events}
          loading={loading}
          rowKey="id"
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          onChange={handleTableChange}
          rowSelection={mode === 'admin' && showActions ? {
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          } : undefined}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default EventList;
