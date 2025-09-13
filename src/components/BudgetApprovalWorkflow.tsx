import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Timeline,
  Alert,
  Statistic,
  Tabs,
  Badge,
  Progress,
  Steps,
  Tooltip,
  Drawer,
  Descriptions,
  List,
  Avatar,
  Empty,
  Divider,
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  AuditOutlined,
  SendOutlined,
  StopOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DashboardOutlined,
  FilterOutlined,
  SyncOutlined,
  EyeOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { Budget, BudgetStatus } from '@/types/finance';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface BudgetApprovalWorkflowProps {
  budgets: Budget[];
  onUpdateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  loading?: boolean;
}

// interface ApprovalRecord {
//   id: string;
//   budgetId: string;
//   approverId: string;
//   approverName: string;
//   approverRole: string;
//   status: 'pending' | 'approved' | 'rejected';
//   comments?: string;
//   approvedAt?: string;
//   createdAt: string;
// }

interface ApprovalWorkflow {
  id: string;
  budgetId: string;
  currentStep: number;
  totalSteps: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  steps: ApprovalStep[];
  createdAt: string;
  updatedAt: string;
}

interface ApprovalStep {
  stepNumber: number;
  approverId: string;
  approverName: string;
  approverRole: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedAt?: string;
  required: boolean;
}

const BudgetApprovalWorkflow: React.FC<BudgetApprovalWorkflowProps> = ({
  budgets,
  onUpdateBudget,
  loading = false,
}) => {
  const { fiscalYear } = useFiscalYear();
  
  // 状态管理
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
  const [isWorkflowModalVisible, setIsWorkflowModalVisible] = useState(false);
  const [isBudgetDetailDrawerVisible, setIsBudgetDetailDrawerVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(fiscalYear);
  const [activeTab, setActiveTab] = useState('pending');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all');

  // 表单实例
  const [approvalForm] = Form.useForm();

  // 模拟审批工作流数据
  const mockApprovalWorkflows: ApprovalWorkflow[] = [
    {
      id: '1',
      budgetId: 'budget-1',
      currentStep: 2,
      totalSteps: 3,
      status: 'pending',
      steps: [
        {
          stepNumber: 1,
          approverId: 'user-1',
          approverName: '张三',
          approverRole: '财务总监',
          status: 'approved',
          comments: '预算合理，同意',
          approvedAt: '2024-01-15T10:00:00Z',
          required: true,
        },
        {
          stepNumber: 2,
          approverId: 'user-2',
          approverName: '李四',
          approverRole: '分会会长',
          status: 'pending',
          required: true,
        },
        {
          stepNumber: 3,
          approverId: 'user-3',
          approverName: '王五',
          approverRole: '理事会主席',
          status: 'pending',
          required: true,
        },
      ],
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
  ];

  useEffect(() => {
    // setApprovalWorkflows(mockApprovalWorkflows); // Commented out since setApprovalWorkflows is not used
  }, []);

  // 获取所有可用年份
  const availableYears = useMemo(() => 
    Array.from(new Set(budgets.map(budget => budget.budgetYear)))
      .sort((a, b) => b - a), // 按年份降序排列
    [budgets]
  );

  // 获取选中年度预算
  const selectedYearBudgets = useMemo(() => 
    budgets.filter(budget => budget.budgetYear === selectedYear),
    [budgets, selectedYear]
  );

  // 按状态分组预算
  const budgetsByStatus = useMemo(() => {
    const filtered = statusFilter === 'all' ? selectedYearBudgets : 
                     selectedYearBudgets.filter(b => b.status === statusFilter);
    
    return {
      all: filtered,
      draft: selectedYearBudgets.filter(budget => budget.status === 'draft'),
      approved: selectedYearBudgets.filter(budget => budget.status === 'approved'),
      active: selectedYearBudgets.filter(budget => budget.status === 'active'),
      completed: selectedYearBudgets.filter(budget => budget.status === 'completed'),
      cancelled: selectedYearBudgets.filter(budget => budget.status === 'cancelled'),
    };
  }, [selectedYearBudgets, statusFilter]);

  // 审批统计
  const approvalStats = useMemo(() => {
    const total = selectedYearBudgets.length;
    const pending = budgetsByStatus.draft.length;
    const approved = budgetsByStatus.approved.length;
    const active = budgetsByStatus.active.length;
    const totalAmount = selectedYearBudgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const approvedAmount = budgetsByStatus.approved.reduce((sum, b) => sum + b.totalBudget, 0) +
                          budgetsByStatus.active.reduce((sum, b) => sum + b.totalBudget, 0);
    
    return {
      total,
      pending,
      approved,
      active,
      totalAmount,
      approvedAmount,
      approvalRate: total > 0 ? Math.round(((approved + active) / total) * 100) : 0,
    };
  }, [selectedYearBudgets, budgetsByStatus]);

  // 刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 模拟刷新
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('数据刷新成功');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 审批状态颜色映射
  const getApprovalStatusColor = (status: string) => {
    const colors = {
      pending: 'processing',
      approved: 'success',
      rejected: 'error',
      cancelled: 'default',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  // 审批状态文本映射
  const getApprovalStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待审批',
      approved: '已审批',
      rejected: '已拒绝',
      cancelled: '已取消',
    };
    return texts[status];
  };

  // 预算状态颜色映射
  const getBudgetStatusColor = (status: BudgetStatus) => {
    const colors: Record<string, string> = {
      draft: 'default',
      approved: 'processing',
      active: 'success',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  // 预算状态文本映射
  const getBudgetStatusText = (status: BudgetStatus) => {
    const texts = {
      draft: '草稿',
      approved: '已审批',
      active: '执行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return texts[status];
  };

  // 处理函数
  const handleStartApproval = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsApprovalModalVisible(true);
  };

  const handleViewWorkflow = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsWorkflowModalVisible(true);
  };

  const handleApprovalSubmit = async () => {
    try {
      await approvalForm.validateFields();
      
      if (selectedBudget) {
        await onUpdateBudget(selectedBudget.id, {
          status: 'approved',
        });
        message.success('预算审批成功');
        setIsApprovalModalVisible(false);
        approvalForm.resetFields();
      }
    } catch (error) {
      console.error('预算审批失败:', error);
      message.error('预算审批失败');
    }
  };

  const handleRejectBudget = async (budget: Budget) => {
    try {
      await onUpdateBudget(budget.id, {
        status: 'cancelled',
      });
      message.success('预算已拒绝');
    } catch (error) {
      console.error('拒绝预算失败:', error);
      message.error('拒绝预算失败');
    }
  };

  const handleActivateBudget = async (budget: Budget) => {
    try {
      await onUpdateBudget(budget.id, {
        status: 'active',
      });
      message.success('预算已激活');
    } catch (error) {
      console.error('激活预算失败:', error);
      message.error('激活预算失败');
    }
  };

  // 预算列定义
  const budgetColumns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string, record: Budget) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.budgetYear}年度
          </Text>
        </div>
      ),
    },
    {
      title: '总预算',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      render: (amount: number) => `RM ${amount.toLocaleString()}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: BudgetStatus) => (
        <Tag color={getBudgetStatusColor(status)}>
          {getBudgetStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Budget) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedBudget(record);
                setIsBudgetDetailDrawerVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <>
              <Tooltip title="提交审批">
                <Button
                  type="text"
                  size="small"
                  icon={<SendOutlined />}
                  onClick={() => handleStartApproval(record)}
                />
              </Tooltip>
              <Tooltip title="拒绝">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => handleRejectBudget(record)}
                />
              </Tooltip>
            </>
          )}
          {record.status === 'approved' && (
            <Tooltip title="激活预算">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => handleActivateBudget(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="查看流程">
            <Button
              type="text"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => handleViewWorkflow(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '16px' }}>
      {/* 页面头部 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  <AuditOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  {selectedYear}年预算审批工作流
                </Title>
                <Text type="secondary">
                  管理新理事团预算的审批流程，确保预算合规性和透明度
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                value={selectedYear}
                onChange={setSelectedYear}
                style={{ width: 120 }}
                placeholder="选择年份"
                suffixIcon={<CalendarOutlined />}
              >
                {availableYears.map(year => (
                  <Option key={year} value={year}>
                    {year}年
                  </Option>
                ))}
              </Select>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                placeholder="状态筛选"
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">全部状态</Option>
                <Option value="draft">草稿</Option>
                <Option value="approved">已审批</Option>
                <Option value="active">执行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
              <Tooltip title="刷新数据">
                <Button
                  icon={<SyncOutlined spin={isRefreshing} />}
                  onClick={handleRefresh}
                  loading={isRefreshing}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 审批统计概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="待审批"
              value={approvalStats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">需要处理</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已审批"
              value={approvalStats.approved + approvalStats.active}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ marginTop: 8 }}>
              <Progress
                percent={approvalStats.approvalRate}
                size="small"
                showInfo={false}
                strokeColor="#52c41a"
              />
              <Text type="secondary">{approvalStats.approvalRate}% 通过率</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="执行中"
              value={approvalStats.active}
              prefix={<PlayCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">正在执行</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总预算"
              value={approvalStats.totalAmount}
              prefix="RM"
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: '#722ed1' }}
            />
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                已批准 RM {approvalStats.approvedAmount.toLocaleString()}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 审批进度流程 */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={5}>
          <SendOutlined style={{ marginRight: 8 }} />
          审批流程概览
        </Title>
        <Steps
          current={1}
          items={[
            {
              title: '预算提交',
              description: `${budgetsByStatus.draft.length} 个待审批`,
              icon: <FileTextOutlined />,
            },
            {
              title: '财务审核',
              description: '财务总监审核',
              icon: <UserOutlined />,
            },
            {
              title: '会长审批',
              description: '分会会长审批',
              icon: <AuditOutlined />,
            },
            {
              title: '主席确认',
              description: '理事会主席确认',
              icon: <CheckCircleOutlined />,
            },
            {
              title: '预算激活',
              description: `${approvalStats.active} 个执行中`,
              icon: <PlayCircleOutlined />,
            },
          ]}
        />
      </Card>

      {/* 主要内容区域 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        >
          <Tabs.TabPane
            tab={
              <Space>
                <ClockCircleOutlined />
                待审批
                <Badge count={budgetsByStatus.draft.length} showZero />
              </Space>
            }
            key="pending"
          >
            {budgetsByStatus.draft.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无待审批预算"
              >
                <Text type="secondary">所有预算都已处理</Text>
              </Empty>
            ) : (
              <Table
                columns={budgetColumns}
                dataSource={budgetsByStatus.draft}
                rowKey="id"
                loading={loading}
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 10,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <CheckCircleOutlined />
                已审批
                <Badge count={budgetsByStatus.approved.length} showZero />
              </Space>
            }
            key="approved"
          >
            <Table
              columns={budgetColumns}
              dataSource={budgetsByStatus.approved}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={false}
              size="small"
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <PlayCircleOutlined />
                执行中
                <Badge count={budgetsByStatus.active.length} showZero />
              </Space>
            }
            key="active"
          >
            <Table
              columns={budgetColumns}
              dataSource={budgetsByStatus.active}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={false}
              size="small"
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <FileTextOutlined />
                全部预算
                <Badge count={budgetsByStatus.all.length} showZero />
              </Space>
            }
            key="all"
          >
            <Table
              columns={budgetColumns}
              dataSource={budgetsByStatus.all}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* 审批模态框 */}
      <Modal
        title="预算审批"
        open={isApprovalModalVisible}
        onOk={handleApprovalSubmit}
        onCancel={() => {
          setIsApprovalModalVisible(false);
          approvalForm.resetFields();
        }}
        width={600}
      >
        {selectedBudget && (
          <div>
            <Alert
              message={`审批预算: ${selectedBudget.projectName}`}
              description={`总预算: RM ${selectedBudget.totalBudget.toLocaleString()}`}
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Form form={approvalForm} layout="vertical">
              <Form.Item
                name="comments"
                label="审批意见"
                rules={[{ required: true, message: '请输入审批意见' }]}
              >
                <TextArea rows={4} placeholder="请输入审批意见" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 工作流查看模态框 */}
      <Modal
        title={selectedBudget ? `${selectedBudget.projectName} - 审批流程` : '审批流程'}
        open={isWorkflowModalVisible}
        onCancel={() => {
          setIsWorkflowModalVisible(false);
          setSelectedBudget(null);
        }}
        footer={null}
        width={800}
      >
        {selectedBudget && (
          <div>
            <Alert
              message={`预算项目: ${selectedBudget.projectName}`}
              description={`总预算: RM ${selectedBudget.totalBudget.toLocaleString()} | 状态: ${getBudgetStatusText(selectedBudget.status)}`}
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Timeline>
              {mockApprovalWorkflows[0]?.steps.map((step) => (
                <Timeline.Item
                  key={step.stepNumber}
                  color={
                    step.status === 'approved' ? 'green' :
                    step.status === 'rejected' ? 'red' :
                    step.status === 'pending' ? 'blue' : 'gray'
                  }
                  dot={
                    step.status === 'approved' ? <CheckCircleOutlined /> :
                    step.status === 'rejected' ? <ExclamationCircleOutlined /> :
                    <ClockCircleOutlined />
                  }
                >
                  <div>
                    <Text strong>{step.approverName}</Text>
                    <Tag color={getApprovalStatusColor(step.status)} style={{ marginLeft: 8 }}>
                      {getApprovalStatusText(step.status)}
                    </Tag>
                    <br />
                    <Text type="secondary">{step.approverRole}</Text>
                    {step.comments && (
                      <div style={{ marginTop: 8 }}>
                        <Text>审批意见: {step.comments}</Text>
                      </div>
                    )}
                    {step.approvedAt && (
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">
                          审批时间: {dayjs(step.approvedAt).format('YYYY-MM-DD HH:mm')}
                        </Text>
                      </div>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </div>
        )}
      </Modal>

      {/* 预算详情抽屉 */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            {selectedBudget?.projectName} - 审批详情
          </Space>
        }
        placement="right"
        size="large"
        open={isBudgetDetailDrawerVisible}
        onClose={() => {
          setIsBudgetDetailDrawerVisible(false);
          setSelectedBudget(null);
        }}
        extra={
          <Space>
            {selectedBudget?.status === 'draft' && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => {
                  handleStartApproval(selectedBudget);
                  setIsBudgetDetailDrawerVisible(false);
                }}
              >
                提交审批
              </Button>
            )}
            {selectedBudget?.status === 'approved' && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  handleActivateBudget(selectedBudget);
                  setIsBudgetDetailDrawerVisible(false);
                }}
              >
                激活预算
              </Button>
            )}
          </Space>
        }
      >
        {selectedBudget && (
          <div>
            {/* 预算基本信息 */}
            <Card title="预算信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="项目名称" span={2}>
                  <Text strong>{selectedBudget.projectName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="预算年份">
                  {selectedBudget.budgetYear}年
                </Descriptions.Item>
                <Descriptions.Item label="当前状态">
                  <Tag color={getBudgetStatusColor(selectedBudget.status)}>
                    {getBudgetStatusText(selectedBudget.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="总预算" span={2}>
                  <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                    RM {selectedBudget.totalBudget.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="创建者">
                  {selectedBudget.createdBy}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {dayjs(selectedBudget.createdAt).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                {selectedBudget.description && (
                  <Descriptions.Item label="描述" span={2}>
                    {selectedBudget.description}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* 审批流程状态 */}
            <Card title="审批流程" style={{ marginBottom: 16 }}>
              <Timeline>
                {mockApprovalWorkflows[0]?.steps.map((step) => (
                  <Timeline.Item
                    key={step.stepNumber}
                    color={
                      step.status === 'approved' ? 'green' :
                      step.status === 'rejected' ? 'red' :
                      step.status === 'pending' ? 'blue' : 'gray'
                    }
                    dot={
                      step.status === 'approved' ? <CheckCircleOutlined /> :
                      step.status === 'rejected' ? <ExclamationCircleOutlined /> :
                      <ClockCircleOutlined />
                    }
                  >
                    <div>
                      <Space>
                        <Text strong>{step.approverName}</Text>
                        <Tag color={getApprovalStatusColor(step.status)}>
                          {getApprovalStatusText(step.status)}
                        </Tag>
                      </Space>
                      <br />
                      <Text type="secondary">{step.approverRole}</Text>
                      {step.comments && (
                        <div style={{ marginTop: 8 }}>
                          <Text>审批意见: {step.comments}</Text>
                        </div>
                      )}
                      {step.approvedAt && (
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary">
                            审批时间: {dayjs(step.approvedAt).format('YYYY-MM-DD HH:mm')}
                          </Text>
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>

            {/* 预算使用情况 */}
            <Card title="预算使用情况">
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">已分配</Text>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>
                      RM {selectedBudget.allocatedAmount.toLocaleString()}
                    </div>
                    <Progress
                      percent={Math.round((selectedBudget.allocatedAmount / selectedBudget.totalBudget) * 100)}
                      size="small"
                      strokeColor="#faad14"
                    />
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">已支出</Text>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff4d4f' }}>
                      RM {selectedBudget.spentAmount.toLocaleString()}
                    </div>
                    <Progress
                      percent={Math.round((selectedBudget.spentAmount / selectedBudget.totalBudget) * 100)}
                      size="small"
                      strokeColor="#ff4d4f"
                    />
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Text type="secondary">剩余</Text>
                    <div 
                      style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: selectedBudget.remainingAmount < 0 ? '#ff4d4f' : '#52c41a' 
                      }}
                    >
                      RM {selectedBudget.remainingAmount.toLocaleString()}
                    </div>
                    <Progress
                      percent={Math.round((selectedBudget.remainingAmount / selectedBudget.totalBudget) * 100)}
                      size="small"
                      strokeColor={selectedBudget.remainingAmount < 0 ? '#ff4d4f' : '#52c41a'}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BudgetApprovalWorkflow;
