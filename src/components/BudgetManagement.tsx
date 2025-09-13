import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tooltip,
  Progress,
  Tabs,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { Budget, BudgetStatus, BudgetAllocation, TransactionPurpose } from '@/types/finance';
import { DateFilter } from '@/hooks/useFinanceDateFilter';

const { Title, Text } = Typography;
const { Option } = Select;

interface BudgetManagementProps {
  onCreateBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  onCreateAllocation: (allocation: Omit<BudgetAllocation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateAllocation: (id: string, allocation: Partial<BudgetAllocation>) => Promise<void>;
  onDeleteAllocation: (id: string) => Promise<void>;
  budgets: Budget[];
  allocations: BudgetAllocation[];
  purposes: TransactionPurpose[];
  loading?: boolean;
  dateFilter?: DateFilter;
}

const BudgetManagement: React.FC<BudgetManagementProps> = ({
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
  onCreateAllocation,
  onUpdateAllocation,
  onDeleteAllocation,
  budgets,
  allocations,
  purposes,
  loading = false,
}) => {
  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [isAllocationModalVisible, setIsAllocationModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingAllocation, setEditingAllocation] = useState<BudgetAllocation | null>(null);
  const [budgetForm] = Form.useForm();
  const [allocationForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('budgets');

  const budgetStatusOptions: { value: BudgetStatus; label: string; color: string }[] = [
    { value: 'draft', label: '草稿', color: 'default' },
    { value: 'approved', label: '已审批', color: 'blue' },
    { value: 'active', label: '执行中', color: 'green' },
    { value: 'completed', label: '已完成', color: 'purple' },
    { value: 'cancelled', label: '已取消', color: 'red' },
  ];

  const getStatusTagColor = (status: BudgetStatus): string => {
    const option = budgetStatusOptions.find(opt => opt.value === status);
    return option?.color || 'default';
  };

  const getStatusLabel = (status: BudgetStatus): string => {
    const option = budgetStatusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };

  const handleCreateBudget = () => {
    setEditingBudget(null);
    setIsBudgetModalVisible(true);
    // 延迟重置表单字段，确保模态框已渲染
    setTimeout(() => {
      budgetForm.resetFields();
    }, 0);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsBudgetModalVisible(true);
    // 延迟设置表单字段，确保模态框已渲染
    setTimeout(() => {
      budgetForm.setFieldsValue(budget);
    }, 0);
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await onDeleteBudget(id);
      message.success('预算删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBudgetModalOk = async () => {
    try {
      const values = await budgetForm.validateFields();
      
      const budgetData = {
        projectName: values.projectName,
        budgetYear: values.budgetYear,
        totalBudget: values.totalBudget,
        allocatedAmount: 0,
        spentAmount: 0,
        remainingAmount: values.totalBudget,
        status: values.status,
        description: values.description || '',
        createdBy: 'current-user', // TODO: 从认证状态获取实际用户ID
      };

      if (editingBudget) {
        await onUpdateBudget(editingBudget.id, budgetData);
        message.success('预算更新成功');
      } else {
        await onCreateBudget(budgetData);
        message.success('预算创建成功');
      }

      setIsBudgetModalVisible(false);
      budgetForm.resetFields();
    } catch (error) {
      console.error('预算操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      message.error(`预算操作失败: ${errorMessage}`);
    }
  };

  const handleCreateAllocation = (budget: Budget) => {
    setEditingAllocation(null);
    setIsAllocationModalVisible(true);
    // Reset and set form values after modal is shown to avoid useForm warning
    setTimeout(() => {
      allocationForm.resetFields();
      allocationForm.setFieldsValue({ budgetId: budget.id });
    }, 0);
  };

  const handleEditAllocation = (allocation: BudgetAllocation) => {
    setEditingAllocation(allocation);
    setIsAllocationModalVisible(true);
    // Set form values after modal is shown to avoid useForm warning
    setTimeout(() => {
      allocationForm.setFieldsValue(allocation);
    }, 0);
  };

  const handleDeleteAllocation = async (id: string) => {
    try {
      await onDeleteAllocation(id);
      message.success('预算分配删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleAllocationModalOk = async () => {
    try {
      const values = await allocationForm.validateFields();
      
      const allocationData = {
        budgetId: values.budgetId,
        purposeId: values.purposeId,
        purposeName: purposes.find(p => p.id === values.purposeId)?.name || '',
        allocatedAmount: values.allocatedAmount,
        spentAmount: editingAllocation ? editingAllocation.spentAmount : 0,
        remainingAmount: values.allocatedAmount - (editingAllocation ? editingAllocation.spentAmount : 0),
      };

      if (editingAllocation) {
        await onUpdateAllocation(editingAllocation.id, allocationData);
        message.success('预算分配更新成功');
      } else {
        await onCreateAllocation(allocationData);
        message.success('预算分配创建成功');
      }

      setIsAllocationModalVisible(false);
      allocationForm.resetFields();
    } catch (error) {
      console.error('预算分配操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      message.error(`预算分配操作失败: ${errorMessage}`);
    }
  };

  const budgetColumns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      render: (text: string) => (
        <Space>
          <BarChartOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '预算年份',
      dataIndex: 'budgetYear',
      key: 'budgetYear',
      width: 100,
      render: (year: number) => (
        <Space>
          <CalendarOutlined />
          <Text>{year}</Text>
        </Space>
      ),
    },
    {
      title: '总预算',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text strong>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: 'MYR' 
          })}
        </Text>
      ),
    },
    {
      title: '已分配',
      dataIndex: 'allocatedAmount',
      key: 'allocatedAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: 'MYR' 
          })}
        </Text>
      ),
    },
    {
      title: '已支出',
      dataIndex: 'spentAmount',
      key: 'spentAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text style={{ color: '#ff4d4f' }}>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: 'MYR' 
          })}
        </Text>
      ),
    },
    {
      title: '剩余',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: 'MYR' 
          })}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BudgetStatus) => (
        <Tag color={getStatusTagColor(status)}>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: '使用率',
      key: 'usageRate',
      width: 120,
      render: (_: any, record: Budget) => {
        const usageRate = record.totalBudget > 0 ? (record.spentAmount / record.totalBudget) * 100 : 0;
        return (
          <Progress
            percent={Math.round(usageRate)}
            size="small"
            status={usageRate > 100 ? 'exception' : usageRate > 80 ? 'active' : 'normal'}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Budget) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditBudget(record)}
            />
          </Tooltip>
          <Tooltip title="分配预算">
            <Button
              type="link"
              icon={<PieChartOutlined />}
              onClick={() => handleCreateAllocation(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个预算吗？"
            description="删除后将无法恢复，请谨慎操作。"
            onConfirm={() => handleDeleteBudget(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const allocationColumns = [
    {
      title: '预算项目',
      dataIndex: 'budgetId',
      key: 'budgetId',
      width: 150,
      render: (budgetId: string) => {
        const budget = budgets.find(b => b.id === budgetId);
        return budget?.projectName || budgetId;
      },
    },
    {
      title: '交易用途',
      dataIndex: 'purposeName',
      key: 'purposeName',
      width: 150,
      render: (text: string) => (
        <Space>
          <TagOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '分配金额',
      dataIndex: 'allocatedAmount',
      key: 'allocatedAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text strong>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: 'MYR' 
          })}
        </Text>
      ),
    },
    {
      title: '已支出',
      dataIndex: 'spentAmount',
      key: 'spentAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text style={{ color: '#ff4d4f' }}>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: 'MYR' 
          })}
        </Text>
      ),
    },
    {
      title: '剩余',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: 'MYR' 
          })}
        </Text>
      ),
    },
    {
      title: '使用率',
      key: 'usageRate',
      width: 120,
      render: (_: any, record: BudgetAllocation) => {
        const usageRate = record.allocatedAmount > 0 ? (record.spentAmount / record.allocatedAmount) * 100 : 0;
        return (
          <Progress
            percent={Math.round(usageRate)}
            size="small"
            status={usageRate > 100 ? 'exception' : usageRate > 80 ? 'active' : 'normal'}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: BudgetAllocation) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditAllocation(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个预算分配吗？"
            description="删除后将无法恢复，请谨慎操作。"
            onConfirm={() => handleDeleteAllocation(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 计算统计信息
  const totalBudgets = budgets.length;
  const totalBudgetAmount = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalAllocatedAmount = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
  const totalSpentAmount = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
  const totalRemainingAmount = budgets.reduce((sum, b) => sum + b.remainingAmount, 0);

  const tabItems = [
    {
      key: 'budgets',
      label: '预算管理',
      children: (
        <div>
          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="总预算数"
                  value={totalBudgets}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="总预算金额"
                  value={totalBudgetAmount}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="已分配金额"
                  value={totalAllocatedAmount}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="已支出金额"
                  value={totalSpentAmount}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={5}>
              <Card size="small">
                <Statistic
                  title="剩余金额"
                  value={totalRemainingAmount}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: totalRemainingAmount >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <Table
            columns={budgetColumns}
            dataSource={budgets}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            }}
            scroll={{ x: 1200 }}
          />
        </div>
      ),
    },
    {
      key: 'allocations',
      label: '预算分配',
      children: (
        <div>
          <Table
            columns={allocationColumns}
            dataSource={allocations}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            }}
            scroll={{ x: 1000 }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <BarChartOutlined /> 预算管理
              </Title>
              <Text type="secondary">管理项目预算和分配</Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateBudget}
              >
                创建预算
              </Button>
            </Col>
          </Row>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* 预算创建/编辑模态框 */}
      <Modal
        title={editingBudget ? '编辑预算' : '创建预算'}
        open={isBudgetModalVisible}
        onOk={handleBudgetModalOk}
        onCancel={() => setIsBudgetModalVisible(false)}
        width={600}
        destroyOnHidden
      >
        <Form
          form={budgetForm}
          layout="vertical"
          initialValues={{
            status: 'draft',
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectName"
                label="项目名称"
                rules={[{ required: true, message: '请输入项目名称' }]}
              >
                <Input placeholder="请输入项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="budgetYear"
                label="预算年份"
                rules={[{ required: true, message: '请输入预算年份' }]}
              >
                <InputNumber
                  placeholder="请输入预算年份"
                  style={{ width: '100%' }}
                  min={2020}
                  max={2030}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="totalBudget"
            label="总预算"
            rules={[{ required: true, message: '请输入总预算' }]}
          >
            <InputNumber
              placeholder="请输入总预算"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (parseFloat(value!.replace(/RM\s?|(,*)/g, '')) || 0) as any}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              {budgetStatusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              placeholder="请输入描述"
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 预算分配创建/编辑模态框 */}
      <Modal
        title={editingAllocation ? '编辑预算分配' : '创建预算分配'}
        open={isAllocationModalVisible}
        onOk={handleAllocationModalOk}
        onCancel={() => setIsAllocationModalVisible(false)}
        width={500}
        destroyOnHidden
      >
        <Form
          form={allocationForm}
          layout="vertical"
        >
          <Form.Item
            name="budgetId"
            label="预算项目"
            rules={[{ required: true, message: '请选择预算项目' }]}
          >
            <Select placeholder="请选择预算项目" disabled={!!editingAllocation}>
              {budgets.map(budget => (
                <Option key={budget.id} value={budget.id}>
                  {budget.projectName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="purposeId"
            label="交易用途"
            rules={[{ required: true, message: '请选择交易用途' }]}
          >
            <Select placeholder="请选择交易用途">
              {purposes.filter(p => p.isActive).map(purpose => (
                <Option key={purpose.id} value={purpose.id}>
                  {purpose.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="allocatedAmount"
            label="分配金额"
            rules={[{ required: true, message: '请输入分配金额' }]}
          >
            <InputNumber
              placeholder="请输入分配金额"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => (parseFloat(value!.replace(/RM\s?|(,*)/g, '')) || 0) as any}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BudgetManagement;
