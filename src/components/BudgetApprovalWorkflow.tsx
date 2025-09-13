import React, { useState, useEffect } from 'react';
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
} from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
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
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  // const [approvalWorkflows, setApprovalWorkflows] = useState<ApprovalWorkflow[]>([]);
  // const [approvalRecords] = useState<ApprovalRecord[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(fiscalYear);

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
  const availableYears = Array.from(new Set(budgets.map(budget => budget.budgetYear)))
    .sort((a, b) => b - a); // 按年份降序排列

  // 获取选中年度待审批预算
  const pendingBudgets = budgets.filter(budget => 
    budget.budgetYear === selectedYear && budget.status === 'draft'
  );

  // 获取选中年度已审批预算
  const approvedBudgets = budgets.filter(budget => 
    budget.budgetYear === selectedYear && budget.status === 'approved'
  );

  // 获取选中年度执行中预算
  const activeBudgets = budgets.filter(budget => 
    budget.budgetYear === selectedYear && budget.status === 'active'
  );

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
        <Space>
          {record.status === 'draft' && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleStartApproval(record)}
              >
                提交审批
              </Button>
              <Button
                size="small"
                onClick={() => handleViewWorkflow(record)}
              >
                查看流程
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleActivateBudget(record)}
            >
              激活预算
            </Button>
          )}
          {record.status === 'draft' && (
            <Button
              size="small"
              danger
              onClick={() => handleRejectBudget(record)}
            >
              拒绝
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <CheckCircleOutlined style={{ marginRight: 8 }} />
              {selectedYear}年预算审批工作流
            </Title>
            <Text type="secondary">
              管理新理事团预算的审批流程
            </Text>
          </Col>
          <Col>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 120 }}
              placeholder="选择年份"
            >
              {availableYears.map(year => (
                <Option key={year} value={year}>
                  {year}年
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        {/* 审批统计 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="待审批"
                value={pendingBudgets.length}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已审批"
                value={approvedBudgets.length}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="执行中"
                value={activeBudgets.length}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总预算"
                value={budgets.filter(b => b.budgetYear === selectedYear).reduce((sum, b) => sum + b.totalBudget, 0)}
                prefix="RM"
                formatter={(value) => value?.toLocaleString()}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 待审批预算 */}
        <Card title="待审批预算" style={{ marginBottom: 16 }}>
          <Table
            columns={budgetColumns}
            dataSource={pendingBudgets}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>

        {/* 已审批预算 */}
        <Card title="已审批预算" style={{ marginBottom: 16 }}>
          <Table
            columns={budgetColumns}
            dataSource={approvedBudgets}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>

        {/* 执行中预算 */}
        <Card title="执行中预算">
          <Table
            columns={budgetColumns}
            dataSource={activeBudgets}
            rowKey="id"
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>
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
    </div>
  );
};

export default BudgetApprovalWorkflow;
