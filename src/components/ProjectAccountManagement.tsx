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
  Form,
  message,
  Tooltip,
  Popconfirm,
  Statistic,
  Progress,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  FundOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  ProjectAccount,
  ProjectAccountCreateData,
  ProjectAccountUpdateData,
  Event,
} from '@/types/event';
import { Transaction } from '@/types/finance';
import { projectAccountService } from '@/modules/finance/services/projectAccountService';
import { eventService } from '@/modules/event/services/eventService';
import UnifiedProjectFinanceManagement from '@/modules/finance/components/UnifiedProjectFinanceManagement';
import GlobalYearFilterModal from '@/modules/finance/components/GlobalYearFilterModal';
import { useFinanceYear } from '@/contexts/FinanceYearContext';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface ProjectAccountManagementProps {
}

const ProjectAccountManagement: React.FC<ProjectAccountManagementProps> = () => {
  const [accounts, setAccounts] = useState<ProjectAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  // 使用全局年份状态
  const { selectedYear: yearFilter, setSelectedYear: setYearFilter, availableYears, refreshAvailableYears } = useFinanceYear();
  const [selectedAccount, setSelectedAccount] = useState<ProjectAccount | null>(null);
  const [accountEvents, setAccountEvents] = useState<Event[]>([]);
  const [accountStatistics, setAccountStatistics] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isUnifiedFinanceModalVisible, setIsUnifiedFinanceModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeTab, setActiveTab] = useState('details');
  const [form] = Form.useForm();

  useEffect(() => {
    loadAccounts();
  }, []);

  // 更新全局可用年份 - 现在由 FinanceYearContext 统一管理
  useEffect(() => {
    if (accounts.length > 0) {
      // 触发年份范围刷新
      refreshAvailableYears();
    }
  }, [accounts, refreshAvailableYears]);


  const loadAccounts = async () => {
    setLoading(true);
    try {
      const accountsData = await projectAccountService.getProjectAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('加载项目户口列表失败:', error);
      message.error('加载项目户口列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (account: ProjectAccount) => {
    setModalMode('edit');
    form.setFieldsValue({
      ...account,
      budget: account.budget,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (accountId: string) => {
    try {
      await projectAccountService.deleteProjectAccount(accountId);
      message.success('项目户口删除成功');
      loadAccounts();
    } catch (error) {
      console.error('删除项目户口失败:', error);
      message.error('删除项目户口失败');
    }
  };

  const handleModalSubmit = async (values: any) => {
    try {
      if (modalMode === 'create') {
        await projectAccountService.createProjectAccount(
          values as ProjectAccountCreateData,
          'current-user-id' // TODO: 获取当前用户ID
        );
        message.success('项目户口创建成功');
      } else {
        await projectAccountService.updateProjectAccount(
          selectedAccount!.id,
          values as ProjectAccountUpdateData,
          'current-user-id' // TODO: 获取当前用户ID
        );
        message.success('项目户口更新成功');
      }
      setIsModalVisible(false);
      loadAccounts();
    } catch (error) {
      console.error('保存项目户口失败:', error);
      message.error('保存项目户口失败');
    }
  };

  const handleViewDetails = async (account: ProjectAccount) => {
    setSelectedAccount(account);
    setActiveTab('details');
    try {
      const [events, statistics] = await Promise.all([
        eventService.getEventsByProjectAccount(account.id),
        projectAccountService.getProjectAccountEventStatistics(account.id),
      ]);
      setAccountEvents(events);
      setAccountStatistics(statistics);
    } catch (error) {
      console.error('获取项目户口详情失败:', error);
      message.error('获取项目户口详情失败');
    }
  };

  const handleViewUnifiedFinance = (account: ProjectAccount) => {
    setSelectedAccount(account);
    setActiveTab('unified-finance');
    setIsUnifiedFinanceModalVisible(true);
  };

  const handleTransactionSync = (projectId: string, transactions: Transaction[]) => {
    console.log('Transaction sync for project:', projectId, transactions);
    message.success(`成功同步 ${transactions.length} 笔交易记录`);
  };

  const handleVerificationRequest = (projectId: string, verificationData: any) => {
    console.log('Verification request for project:', projectId, verificationData);
    message.success('已提交财政长核对申请');
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '活跃';
      case 'inactive':
        return '停用';
      case 'completed':
        return '已完成';
      default:
        return status;
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         account.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || account.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: '项目户口名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
        </div>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (description: string) => (
        <Text ellipsis={{ tooltip: description }} style={{ maxWidth: 200 }}>
          {description}
        </Text>
      ),
    },
    {
      title: '预算',
      dataIndex: 'budget',
      key: 'budget',
      width: 120,
      render: (budget: number, record: ProjectAccount) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {record.currency} {budget.toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
      width: 150,
      render: (person: string, record: ProjectAccount) => (
        <div>
          <div>{person}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.responsiblePersonEmail}
          </Text>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: [
        { text: '活跃', value: 'active' },
        { text: '停用', value: 'inactive' },
        { text: '已完成', value: 'completed' },
      ],
      onFilter: (value: any, record: ProjectAccount) => record.status === value,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (createdAt: any) => dayjs(createdAt.toDate()).format('YYYY-MM-DD'),
      sorter: (a: ProjectAccount, b: ProjectAccount) => 
        a.createdAt.toMillis() - b.createdAt.toMillis(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: ProjectAccount) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="统一财务管理">
            <Button
              type="text"
              icon={<BarChartOutlined />}
              onClick={() => handleViewUnifiedFinance(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个项目户口吗？"
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
    },
  ];

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
  ];

  return (
    <div>
      {/* 头部操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <FundOutlined style={{ marginRight: 8 }} />
              项目户口管理
            </Title>
            <Text type="secondary">
              管理项目户口，追踪项目活动的所有数据
            </Text>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="搜索项目户口名称或描述"
                allowClear
                onSearch={setSearchText}
                style={{ width: 300 }}
              />
              <Select
                placeholder="状态筛选"
                allowClear
                style={{ width: 120 }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Option value="active">活跃</Option>
                <Option value="inactive">停用</Option>
                <Option value="completed">已完成</Option>
              </Select>
              <GlobalYearFilterModal
                value={yearFilter}
                onChange={(year) => setYearFilter(year || new Date().getFullYear())}
                availableYears={availableYears}
                placeholder="年份筛选"
                style={{ width: 120 }}
              />
              <Button
                icon={<BarChartOutlined />}
                onClick={() => setIsUnifiedFinanceModalVisible(true)}
              >
                统一财务管理
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                创建项目户口
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 项目户口列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredAccounts}
          loading={loading}
          rowKey="id"
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

      {/* 项目户口详情模态框 */}
      <Modal
        title={selectedAccount ? `${selectedAccount.name} - 详情` : '项目户口详情'}
        open={!!selectedAccount}
        onCancel={() => setSelectedAccount(null)}
        footer={null}
        width={1200}
      >
        {selectedAccount && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'details',
                label: '基本信息',
                icon: <EyeOutlined />,
                children: (
                  <div>
                    {/* 基本信息 */}
                    <Card title="基本信息" style={{ marginBottom: 16 }}>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12}>
                          <Statistic
                            title="项目户口"
                            value={selectedAccount.name}
                            prefix={<FundOutlined />}
                          />
                        </Col>
                        <Col xs={24} sm={12}>
                          <Statistic
                            title="预算"
                            value={`${selectedAccount.currency} ${selectedAccount.budget.toLocaleString()}`}
                            prefix={<DollarOutlined />}
                          />
                        </Col>
                        <Col xs={24} sm={12}>
                          <Statistic
                            title="负责人"
                            value={selectedAccount.responsiblePerson}
                            prefix={<UserOutlined />}
                          />
                        </Col>
                      </Row>
                    </Card>

                    {/* 统计信息 */}
                    {accountStatistics && (
                      <Card title="活动统计" style={{ marginBottom: 16 }}>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={6}>
                            <Statistic
                              title="总活动数"
                              value={accountStatistics.totalEvents}
                              prefix={<CalendarOutlined />}
                            />
                          </Col>
                          <Col xs={24} sm={6}>
                            <Statistic
                              title="已发布活动"
                              value={accountStatistics.publishedEvents}
                              valueStyle={{ color: '#3f8600' }}
                            />
                          </Col>
                          <Col xs={24} sm={6}>
                            <Statistic
                              title="总注册人数"
                              value={accountStatistics.totalRegistrations}
                              prefix={<UserOutlined />}
                            />
                          </Col>
                          <Col xs={24} sm={6}>
                            <Statistic
                              title="总收入"
                              value={accountStatistics.totalRevenue}
                              prefix={<DollarOutlined />}
                              suffix={selectedAccount.currency}
                            />
                          </Col>
                        </Row>
                        <div style={{ marginTop: 16 }}>
                          <Text>预算使用率</Text>
                          <Progress
                            percent={accountStatistics.budgetUtilization}
                            status={accountStatistics.budgetUtilization > 100 ? 'exception' : 'active'}
                          />
                          <Text type="secondary">
                            {accountStatistics.totalRevenue.toLocaleString()} / {selectedAccount.budget.toLocaleString()} {selectedAccount.currency}
                          </Text>
                        </div>
                      </Card>
                    )}

                    {/* 相关活动 */}
                    <Card title="相关活动">
                      <Table
                        columns={eventColumns}
                        dataSource={accountEvents}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  </div>
                ),
              },
              {
                key: 'unified-finance',
                label: '统一财务管理',
                icon: <BarChartOutlined />,
                children: (
                  <UnifiedProjectFinanceManagement
                    mode="finance"
                    onTransactionSync={handleTransactionSync}
                    onVerificationRequest={handleVerificationRequest}
                  />
                ),
              },
            ]}
          />
        )}
      </Modal>

      {/* 统一财务管理模态框 */}
      <Modal
        title={
          <Space>
            <BarChartOutlined />
            <span>统一项目财务管理</span>
          </Space>
        }
        open={isUnifiedFinanceModalVisible}
        onCancel={() => setIsUnifiedFinanceModalVisible(false)}
        footer={null}
        width={1400}
        destroyOnClose
      >
        <UnifiedProjectFinanceManagement
          mode="finance"
          onTransactionSync={handleTransactionSync}
          onVerificationRequest={handleVerificationRequest}
        />
      </Modal>

      {/* 创建/编辑模态框 */}
      <Modal
        title={modalMode === 'create' ? '创建项目户口' : '编辑项目户口'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Form.Item
            label="项目户口名称"
            name="name"
            rules={[{ required: true, message: '请输入项目户口名称' }]}
          >
            <Input placeholder="请输入项目户口名称" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="请输入项目户口描述"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="货币"
                name="currency"
                rules={[{ required: true, message: '请选择货币' }]}
                initialValue="MYR"
              >
                <Select>
                  <Option value="MYR">MYR (马来西亚林吉特)</Option>
                  <Option value="USD">USD (美元)</Option>
                  <Option value="SGD">SGD (新加坡元)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="预算"
            name="budget"
            rules={[{ required: true, message: '请输入预算金额' }]}
          >
            <Input
              type="number"
              placeholder="请输入预算金额"
              min={0}
            />
          </Form.Item>

          <Form.Item
            label="负责人"
            name="responsiblePerson"
            rules={[{ required: true, message: '请输入负责人姓名' }]}
          >
            <Input placeholder="请输入负责人姓名" />
          </Form.Item>

          <Form.Item
            label="负责人邮箱"
            name="responsiblePersonEmail"
            rules={[
              { required: true, message: '请输入负责人邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入负责人邮箱" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {modalMode === 'create' ? '创建' : '更新'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectAccountManagement;
