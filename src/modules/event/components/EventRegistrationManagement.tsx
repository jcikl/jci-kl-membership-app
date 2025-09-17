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
  Descriptions,
  DatePicker,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { eventRegistrationService } from '@/modules/event/services/eventService';
import { EventRegistration, RegistrationStatus } from '@/types/event';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const EventRegistrationManagement: React.FC = () => {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRegistrations, setSelectedRegistrations] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState<string>('');
  const [filterEventId, setFilterEventId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<RegistrationStatus | undefined>();
  const [filterDateRange, setFilterDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

  useEffect(() => {
    loadRegistrations();
  }, [searchText, filterEventId, filterStatus, filterDateRange]);

  const loadRegistrations = async () => {
    setLoading(true);
    try {
      // 这里需要根据实际情况调整API调用
      // const response = await eventRegistrationService.getAllRegistrations({
      //   searchText: searchText,
      //   eventId: filterEventId,
      //   status: filterStatus,
      //   dateRange: filterDateRange,
      // });
      // setRegistrations(response.registrations);
      
      // 临时数据
      setRegistrations([]);
    } catch (error) {
      console.error('加载注册记录失败:', error);
      message.error('加载注册记录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    try {
      await eventRegistrationService.updateRegistrationStatus(
        registrationId,
        RegistrationStatus.APPROVED,
        'current-user-id' // TODO: 获取当前用户ID
      );
      message.success('注册已批准');
      loadRegistrations();
    } catch (error) {
      console.error('批准注册失败:', error);
      message.error('批准注册失败');
    }
  };

  const handleReject = async (registrationId: string, reason: string) => {
    try {
      await eventRegistrationService.updateRegistrationStatus(
        registrationId,
        RegistrationStatus.REJECTED,
        'current-user-id', // TODO: 获取当前用户ID
        reason
      );
      message.success('注册已拒绝');
      loadRegistrations();
    } catch (error) {
      console.error('拒绝注册失败:', error);
      message.error('拒绝注册失败');
    }
  };

  const showRejectModal = (registrationId: string) => {
    let reason = '';
    Modal.confirm({
      title: '拒绝注册',
      content: (
        <Input.TextArea
          placeholder="请输入拒绝原因"
          rows={3}
          onChange={(e) => { reason = e.target.value; }}
        />
      ),
      onOk: () => {
        if (!reason.trim()) {
          message.error('请输入拒绝原因');
          return Promise.reject();
        }
        return handleReject(registrationId, reason);
      },
    });
  };

  const showDetailModal = (registration: EventRegistration) => {
    Modal.info({
      title: '注册详情',
      width: 600,
      content: (
        <Descriptions column={2} bordered>
          <Descriptions.Item label="姓名" span={2}>
            {registration.userName}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱">
            {registration.userEmail}
          </Descriptions.Item>
          <Descriptions.Item label="电话">
            {registration.userPhone}
          </Descriptions.Item>
          <Descriptions.Item label="身份证/护照">
            {registration.nricPassport || '未提供'}
          </Descriptions.Item>
          <Descriptions.Item label="票务类型">
            {registration.ticketName || '标准票'}
          </Descriptions.Item>
          <Descriptions.Item label="金额">
            {registration.currency} {registration.amount}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={getStatusColor(registration.status)}>
              {registration.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {dayjs(registration.registeredAt.toDate()).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="活动安排" span={2}>
            <div>
              {registration.arrangements.nameOnTag && (
                <Tag>姓名标签: {registration.arrangements.nameOnTag}</Tag>
              )}
              {registration.arrangements.meal && <Tag color="green">用餐</Tag>}
              {registration.arrangements.tshirt && <Tag color="blue">T恤</Tag>}
              {registration.arrangements.accommodation && <Tag color="purple">住宿</Tag>}
              {registration.arrangements.transportation && <Tag color="orange">交通</Tag>}
            </div>
          </Descriptions.Item>
          {registration.emergencyContact && (
            <Descriptions.Item label="紧急联系人" span={2}>
              <div>
                姓名: {registration.emergencyContact.name}<br />
                关系: {registration.emergencyContact.relationship}<br />
                电话: {registration.emergencyContact.phone}
              </div>
            </Descriptions.Item>
          )}
          {registration.notes && (
            <Descriptions.Item label="备注" span={2}>
              {registration.notes}
            </Descriptions.Item>
          )}
        </Descriptions>
      ),
    });
  };

  const getStatusColor = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.APPROVED:
        return 'green';
      case RegistrationStatus.PENDING:
        return 'orange';
      case RegistrationStatus.REJECTED:
        return 'red';
      case RegistrationStatus.CANCELLED:
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: any[] = [
    {
      title: '注册ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <Text code>{id.slice(0, 8)}...</Text>
      ),
    },
    {
      title: '姓名',
      dataIndex: 'userName',
      key: 'userName',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'userEmail',
      key: 'userEmail',
      width: 200,
    },
    {
      title: '电话',
      dataIndex: 'userPhone',
      key: 'userPhone',
      width: 130,
    },
    {
      title: '票务类型',
      dataIndex: 'ticketName',
      key: 'ticketName',
      width: 120,
      render: (ticketName: string) => ticketName || '标准票',
    },
    {
      title: '金额',
      key: 'amount',
      width: 100,
      render: (_: any, record: EventRegistration) => (
        <Text strong>
          {record.currency} {record.amount}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: RegistrationStatus) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
      filters: Object.values(RegistrationStatus).map(status => ({
        text: status,
        value: status,
      })),
      onFilter: (value: any, record: EventRegistration) => record.status === value,
    },
    {
      title: '注册时间',
      dataIndex: 'registeredAt',
      key: 'registeredAt',
      width: 150,
      render: (registeredAt: any) => (
        <div>
          <div>{dayjs(registeredAt.toDate()).format('YYYY-MM-DD')}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {dayjs(registeredAt.toDate()).format('HH:mm')}
          </Text>
        </div>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: EventRegistration) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showDetailModal(record)}
            />
          </Tooltip>
          {record.status === RegistrationStatus.PENDING && (
            <>
              <Tooltip title="批准">
                <Button
                  type="text"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(record.id)}
                />
              </Tooltip>
              <Tooltip title="拒绝">
                <Button
                  type="text"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => showRejectModal(record.id)}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={3}>注册管理</Title>
        <Text type="secondary">管理所有活动的注册申请和审核</Text>
      </div>

      {/* 筛选器 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="搜索姓名、邮箱..."
              allowClear
              onSearch={setSearchText}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择活动"
              allowClear
              style={{ width: '100%' }}
              value={filterEventId}
              onChange={setFilterEventId}
            >
              {/* 这里应该从API获取活动列表 */}
              <Option value="event1">活动1</Option>
              <Option value="event2">活动2</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="注册状态"
              allowClear
              style={{ width: '100%' }}
              value={filterStatus}
              onChange={setFilterStatus}
            >
              {Object.values(RegistrationStatus).map(status => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              placeholder={['开始日期', '结束日期']}
              style={{ width: '100%' }}
              value={filterDateRange}
              onChange={(dates) => setFilterDateRange(dates as [Dayjs, Dayjs] | null)}
            />
          </Col>
        </Row>
      </Card>

      {/* 批量操作 */}
      {selectedRegistrations.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <Text>已选择 {selectedRegistrations.length} 个注册记录</Text>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => {
                // 批量批准逻辑
                message.info('批量批准功能待实现');
              }}
            >
              批量批准
            </Button>
            <Button
              danger
              icon={<CloseOutlined />}
              onClick={() => {
                // 批量拒绝逻辑
                message.info('批量拒绝功能待实现');
              }}
            >
              批量拒绝
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => {
                // 导出逻辑
                message.info('导出功能待实现');
              }}
            >
              导出数据
            </Button>
          </Space>
        </Card>
      )}

      {/* 注册列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={registrations}
          loading={loading}
          rowKey="id"
          rowSelection={{
            selectedRowKeys: selectedRegistrations,
            onChange: setSelectedRegistrations,
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default EventRegistrationManagement;
