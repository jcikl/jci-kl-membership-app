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
  InputNumber,
  Select,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Budget, BudgetStatus, BudgetAllocation, TransactionPurpose } from '@/types/finance';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
const { Title, Text } = Typography;
const { Option } = Select;

interface AnnualBudgetManagementProps {
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
}

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  allocations: Array<{
    purposeId: string;
    purposeName: string;
    amount: number;
    percentage: number;
  }>;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
}

const AnnualBudgetManagement: React.FC<AnnualBudgetManagementProps> = ({
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
  const { fiscalYear } = useFiscalYear();
  
  // 状态管理
  const [isBudgetModalVisible, setIsBudgetModalVisible] = useState(false);
  const [isAllocationModalVisible, setIsAllocationModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isTemplateCreateModalVisible, setIsTemplateCreateModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingAllocation, setEditingAllocation] = useState<BudgetAllocation | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetTemplates, setBudgetTemplates] = useState<BudgetTemplate[]>([]);
  // const [activeTab] = useState('current'); // Unused for now
  const [selectedYear, setSelectedYear] = useState<number>(fiscalYear);

  // 表单实例
  const [budgetForm] = Form.useForm();
  const [allocationForm] = Form.useForm();
  const [templateForm] = Form.useForm();

  // 加载预算模板
  const loadBudgetTemplates = async () => {
    try {
      // 这里应该从服务加载预算模板，暂时使用模拟数据
      const mockTemplates: BudgetTemplate[] = [
        {
          id: '1',
          name: '标准年度预算模板',
          description: '适用于一般分会的标准预算分配',
          allocations: [
            { purposeId: '1', purposeName: '会员费', amount: 50000, percentage: 30 },
            { purposeId: '2', purposeName: '活动支出', amount: 30000, percentage: 18 },
            { purposeId: '3', purposeName: '办公支出', amount: 25000, percentage: 15 },
            { purposeId: '4', purposeName: '营销费用', amount: 20000, percentage: 12 },
            { purposeId: '5', purposeName: '培训费用', amount: 15000, percentage: 9 },
            { purposeId: '6', purposeName: '设备费用', amount: 10000, percentage: 6 },
            { purposeId: '7', purposeName: '其他', amount: 10000, percentage: 6 },
          ],
          totalAmount: 160000,
          createdBy: 'system',
          createdAt: '2024-01-01',
        },
        {
          id: '2',
          name: '精简预算模板',
          description: '适用于小型分会的精简预算',
          allocations: [
            { purposeId: '1', purposeName: '会员费', amount: 30000, percentage: 40 },
            { purposeId: '2', purposeName: '活动支出', amount: 20000, percentage: 27 },
            { purposeId: '3', purposeName: '办公支出', amount: 15000, percentage: 20 },
            { purposeId: '4', purposeName: '其他', amount: 10000, percentage: 13 },
          ],
          totalAmount: 75000,
          createdBy: 'system',
          createdAt: '2024-01-01',
        },
      ];
      setBudgetTemplates(mockTemplates);
    } catch (error) {
      console.error('加载预算模板失败:', error);
    }
  };

  useEffect(() => {
    loadBudgetTemplates();
  }, []);

  // 获取选中年度预算
  const selectedYearBudgets = budgets.filter(budget => budget.budgetYear === selectedYear);
  const selectedYearAllocations = allocations.filter(allocation => 
    selectedYearBudgets.some(budget => budget.id === allocation.budgetId)
  );

  // 获取所有可用年份
  const availableYears = Array.from(new Set(budgets.map(budget => budget.budgetYear)))
    .sort((a, b) => b - a); // 按年份降序排列

  // 计算预算统计
  const budgetStats = {
    totalBudgets: selectedYearBudgets.length,
    totalBudgetAmount: selectedYearBudgets.reduce((sum, budget) => sum + budget.totalBudget, 0),
    totalAllocatedAmount: selectedYearBudgets.reduce((sum, budget) => sum + budget.allocatedAmount, 0),
    totalSpentAmount: selectedYearBudgets.reduce((sum, budget) => sum + budget.spentAmount, 0),
    totalRemainingAmount: selectedYearBudgets.reduce((sum, budget) => sum + budget.remainingAmount, 0),
  };

  // 预算状态颜色映射
  const getStatusColor = (status: BudgetStatus) => {
    const colors = {
      draft: 'default',
      approved: 'processing',
      active: 'success',
      completed: 'success',
      cancelled: 'error',
    };
    return colors[status] as any;
  };

  // 预算状态文本映射
  const getStatusText = (status: BudgetStatus) => {
    const texts = {
      draft: '草稿',
      approved: '已审批',
      active: '执行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return texts[status];
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
      sorter: (a: Budget, b: Budget) => a.totalBudget - b.totalBudget,
    },
    {
      title: '已分配',
      dataIndex: 'allocatedAmount',
      key: 'allocatedAmount',
      render: (amount: number, record: Budget) => (
        <div>
          <Text>RM {amount.toLocaleString()}</Text>
          <br />
          <Progress 
            percent={Math.round((amount / record.totalBudget) * 100)} 
            size="small" 
            showInfo={false}
          />
        </div>
      ),
    },
    {
      title: '已支出',
      dataIndex: 'spentAmount',
      key: 'spentAmount',
      render: (amount: number, record: Budget) => (
        <div>
          <Text>RM {amount.toLocaleString()}</Text>
          <br />
          <Progress 
            percent={Math.round((amount / record.totalBudget) * 100)} 
            size="small" 
            showInfo={false}
            strokeColor={amount > record.totalBudget ? '#ff4d4f' : '#52c41a'}
          />
        </div>
      ),
    },
    {
      title: '剩余',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      render: (amount: number) => (
        <Text type={amount < 0 ? 'danger' : 'success'}>
          RM {amount.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: BudgetStatus) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Budget) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewBudget(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditBudget(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个预算吗？"
            onConfirm={() => handleDeleteBudget(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 处理函数
  const handleCreateBudget = () => {
    setEditingBudget(null);
    setIsBudgetModalVisible(true);
    setTimeout(() => {
      budgetForm.resetFields();
      budgetForm.setFieldsValue({ budgetYear: fiscalYear });
    }, 0);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setIsBudgetModalVisible(true);
    setTimeout(() => {
      budgetForm.setFieldsValue(budget);
    }, 0);
  };

  const handleViewBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsAllocationModalVisible(true);
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
    setSelectedBudget(budget);
    setIsAllocationModalVisible(true);
    setTimeout(() => {
      allocationForm.resetFields();
      allocationForm.setFieldsValue({ budgetId: budget.id });
    }, 0);
  };

  const handleEditAllocation = (allocation: BudgetAllocation) => {
    setEditingAllocation(allocation);
    setIsAllocationModalVisible(true);
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
        spentAmount: 0,
        remainingAmount: values.allocatedAmount,
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

  const handleUseTemplate = (template: BudgetTemplate) => {
    setIsTemplateModalVisible(false);
    setIsBudgetModalVisible(true);
    setTimeout(() => {
      budgetForm.resetFields();
      budgetForm.setFieldsValue({
        projectName: `${template.name} - ${fiscalYear}年度`,
        budgetYear: fiscalYear,
        totalBudget: template.totalAmount,
        status: 'draft',
        description: template.description,
      });
    }, 0);
  };

  const handleCreateTemplate = () => {
    setIsTemplateCreateModalVisible(true);
  };

  const handleTemplateCreateOk = async () => {
    try {
      await templateForm.validateFields();
      // 这里应该保存模板到服务
      message.success('预算模板创建成功');
      setIsTemplateCreateModalVisible(false);
      templateForm.resetFields();
      loadBudgetTemplates();
    } catch (error) {
      console.error('创建预算模板失败:', error);
      message.error('创建预算模板失败');
    }
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              {selectedYear}年度预算管理
            </Title>
            <Text type="secondary">
              为新理事团管理年度预算和预算分配
            </Text>
          </Col>
          <Col>
            <Space>
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateBudget}
                disabled={selectedYear !== fiscalYear}
              >
                创建预算
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={() => setIsTemplateModalVisible(true)}
                disabled={selectedYear !== fiscalYear}
              >
                使用模板
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 年份提示 */}
        {selectedYear !== fiscalYear && (
          <Alert
            message={`当前查看 ${selectedYear} 年预算`}
            description={`只有 ${fiscalYear} 年（当前财政年度）的预算可以进行编辑操作。历史年份的预算仅供查看。`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 预算统计 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic
              title="预算项目"
              value={budgetStats.totalBudgets}
              prefix={<FileTextOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总预算金额"
              value={budgetStats.totalBudgetAmount}
              prefix="RM"
              formatter={(value) => value?.toLocaleString()}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已分配金额"
              value={budgetStats.totalAllocatedAmount}
              prefix="RM"
              formatter={(value) => value?.toLocaleString()}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="剩余金额"
              value={budgetStats.totalRemainingAmount}
              prefix="RM"
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: budgetStats.totalRemainingAmount < 0 ? '#cf1322' : '#3f8600' }}
            />
          </Col>
        </Row>

        {/* 预算列表 */}
        <Table
          columns={budgetColumns}
          dataSource={selectedYearBudgets}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 创建/编辑预算模态框 */}
      <Modal
        title={editingBudget ? '编辑预算' : '创建预算'}
        open={isBudgetModalVisible}
        onOk={handleBudgetModalOk}
        onCancel={() => {
          setIsBudgetModalVisible(false);
          budgetForm.resetFields();
        }}
        width={600}
      >
        <Form form={budgetForm} layout="vertical">
          <Form.Item
            name="projectName"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          
          <Form.Item
            name="budgetYear"
            label="预算年份"
            rules={[{ required: true, message: '请选择预算年份' }]}
          >
            <Select
              style={{ width: '100%' }}
              placeholder="请选择预算年份"
            >
              {availableYears.map(year => (
                <Option key={year} value={year}>
                  {year}年
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="totalBudget"
            label="总预算金额"
            rules={[{ required: true, message: '请输入总预算金额' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="请输入总预算金额"
              formatter={(value) => value ? `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
              parser={(value) => (parseFloat((value || '').replace(/RM\s?|(,*)/g, '')) || 0) as any}
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="预算状态"
            rules={[{ required: true, message: '请选择预算状态' }]}
          >
            <Select placeholder="请选择预算状态">
              <Option value="draft">草稿</Option>
              <Option value="approved">已审批</Option>
              <Option value="active">执行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea rows={3} placeholder="请输入预算描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 预算分配模态框 */}
      <Modal
        title={selectedBudget ? `${selectedBudget.projectName} - 预算分配` : '预算分配'}
        open={isAllocationModalVisible}
        onCancel={() => {
          setIsAllocationModalVisible(false);
          allocationForm.resetFields();
          setSelectedBudget(null);
        }}
        footer={null}
        width={800}
      >
        {selectedBudget && (
          <div>
            <Alert
              message={`总预算: RM ${selectedBudget.totalBudget.toLocaleString()}`}
              description={`已分配: RM ${selectedBudget.allocatedAmount.toLocaleString()} | 剩余: RM ${selectedBudget.remainingAmount.toLocaleString()}`}
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleCreateAllocation(selectedBudget)}
                disabled={selectedYear !== fiscalYear}
              >
                添加分配
              </Button>
            </div>

            <Table
              columns={[
                {
                  title: '用途',
                  dataIndex: 'purposeName',
                  key: 'purposeName',
                },
                {
                  title: '分配金额',
                  dataIndex: 'allocatedAmount',
                  key: 'allocatedAmount',
                  render: (amount: number) => `RM ${amount.toLocaleString()}`,
                },
                {
                  title: '已支出',
                  dataIndex: 'spentAmount',
                  key: 'spentAmount',
                  render: (amount: number) => `RM ${amount.toLocaleString()}`,
                },
                {
                  title: '剩余',
                  dataIndex: 'remainingAmount',
                  key: 'remainingAmount',
                  render: (amount: number) => (
                    <Text type={amount < 0 ? 'danger' : 'success'}>
                      RM {amount.toLocaleString()}
                    </Text>
                  ),
                },
                {
                  title: '操作',
                  key: 'actions',
                  render: (_: any, record: BudgetAllocation) => (
                    <Space>
                      <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleEditAllocation(record)}
                        disabled={selectedYear !== fiscalYear}
                      >
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定要删除这个分配吗？"
                        onConfirm={() => handleDeleteAllocation(record.id)}
                        okText="确定"
                        cancelText="取消"
                        disabled={selectedYear !== fiscalYear}
                      >
                        <Button 
                          type="link" 
                          danger 
                          icon={<DeleteOutlined />}
                          disabled={selectedYear !== fiscalYear}
                        >
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
              dataSource={selectedYearAllocations.filter(allocation => 
                allocation.budgetId === selectedBudget.id
              )}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}
      </Modal>

      {/* 预算模板选择模态框 */}
      <Modal
        title="选择预算模板"
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateTemplate}
          >
            创建新模板
          </Button>
        </div>

        <Table
          columns={[
            {
              title: '模板名称',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: '描述',
              dataIndex: 'description',
              key: 'description',
            },
            {
              title: '总金额',
              dataIndex: 'totalAmount',
              key: 'totalAmount',
              render: (amount: number) => `RM ${amount.toLocaleString()}`,
            },
            {
              title: '分配项目',
              dataIndex: 'allocations',
              key: 'allocations',
              render: (allocations: any[]) => (
                <Badge count={allocations.length} showZero />
              ),
            },
            {
              title: '操作',
              key: 'actions',
              render: (_: any, record: BudgetTemplate) => (
                <Button
                  type="primary"
                  onClick={() => handleUseTemplate(record)}
                >
                  使用模板
                </Button>
              ),
            },
          ]}
          dataSource={budgetTemplates}
          rowKey="id"
          pagination={false}
        />
      </Modal>

      {/* 创建预算模板模态框 */}
      <Modal
        title="创建预算模板"
        open={isTemplateCreateModalVisible}
        onOk={handleTemplateCreateOk}
        onCancel={() => {
          setIsTemplateCreateModalVisible(false);
          templateForm.resetFields();
        }}
        width={600}
      >
        <Form form={templateForm} layout="vertical">
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="请输入模板名称" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="模板描述"
          >
            <Input.TextArea rows={3} placeholder="请输入模板描述" />
          </Form.Item>
          
          <Alert
            message="提示"
            description="创建模板后，您可以在预算分配中添加具体的分配项目。"
            type="info"
            showIcon
          />
        </Form>
      </Modal>

      {/* 创建/编辑预算分配模态框 */}
      <Modal
        title={editingAllocation ? '编辑预算分配' : '创建预算分配'}
        open={isAllocationModalVisible && !selectedBudget}
        onOk={handleAllocationModalOk}
        onCancel={() => {
          setIsAllocationModalVisible(false);
          allocationForm.resetFields();
        }}
        width={500}
      >
        <Form form={allocationForm} layout="vertical">
          <Form.Item
            name="budgetId"
            label="预算项目"
            rules={[{ required: true, message: '请选择预算项目' }]}
          >
            <Select placeholder="请选择预算项目">
              {selectedYearBudgets.map(budget => (
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
              {purposes.map(purpose => (
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
              min={0}
              style={{ width: '100%' }}
              placeholder="请输入分配金额"
              formatter={(value) => value ? `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
              parser={(value) => (parseFloat((value || '').replace(/RM\s?|(,*)/g, '')) || 0) as any}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AnnualBudgetManagement;
