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
  Tabs,
  Alert,
  Divider,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  PieChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Budget, BudgetStatus, BudgetAllocation, TransactionPurpose, Transaction, BudgetMainCategory, BudgetSubCategory } from '@/types/finance';
import dayjs from 'dayjs';
import JCIBudgetTable from './JCIBudgetTable';
import GlobalYearFilterModal from './GlobalYearFilterModal';
import { useFinanceYear } from '@/contexts/FinanceYearContext';
import { 
  BUDGET_MAIN_CATEGORY_OPTIONS, 
  getSubCategoryOptions, 
  generateItemCode, 
  getItemTemplates,
  BUDGET_CATEGORIES 
} from '@/config/budgetCategories';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface IntegratedBudgetManagementProps {
  onCreateBudget: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  onCreateAllocation: (allocation: Omit<BudgetAllocation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateAllocation: (id: string, allocation: Partial<BudgetAllocation>) => Promise<void>;
  onDeleteAllocation: (id: string) => Promise<void>;
  budgets: Budget[];
  allocations: BudgetAllocation[];
  purposes: TransactionPurpose[];
  transactions: Transaction[];
  loading?: boolean;
}

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  totalAmount: number;
  allocations: {
    purposeId: string;
    purposeName: string;
    amount: number;
    percentage: number;
  }[];
}

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

interface BudgetPerformance {
  budgetId: string;
  projectName: string;
  totalBudget: number;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationRate: number;
  variance: number;
  variancePercentage: number;
  status: 'on-track' | 'over-budget' | 'under-budget' | 'completed';
}

const IntegratedBudgetManagement: React.FC<IntegratedBudgetManagementProps> = ({
  onCreateBudget,
  onUpdateBudget,
  onDeleteBudget,
  onCreateAllocation,
  budgets,
  allocations,
  purposes,
  loading = false,
}) => {
  
  // 状态管理
  const [activeTab, setActiveTab] = useState('overview');
  // 使用全局年份状态
  const { selectedYear, setSelectedYear, availableYears, setAvailableYears } = useFinanceYear();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAllocationModalVisible, setIsAllocationModalVisible] = useState(false);
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
  const [isWorkflowModalVisible, setIsWorkflowModalVisible] = useState(false);
  const [isTemplateModalVisible, setIsTemplateModalVisible] = useState(false);
  const [isCreateAllocationModalVisible, setIsCreateAllocationModalVisible] = useState(false);
  const [isCreateYearlyBudgetModalVisible, setIsCreateYearlyBudgetModalVisible] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetTemplates, setBudgetTemplates] = useState<BudgetTemplate[]>([]);
  
  // 预算创建表单状态
  const [selectedMainCategory, setSelectedMainCategory] = useState<BudgetMainCategory | undefined>(undefined);
  const [selectedSubCategory, setSelectedSubCategory] = useState<BudgetSubCategory | undefined>(undefined);

  // 表单实例
  const [budgetForm] = Form.useForm();
  const [allocationForm] = Form.useForm();
  const [approvalForm] = Form.useForm();
  const [yearlyBudgetForm] = Form.useForm();

  // 预算模板数据
  const defaultTemplates: BudgetTemplate[] = [
    {
      id: 'standard',
      name: '标准年度预算模板',
      description: '适用于一般分会的标准预算模板',
      totalAmount: 160000,
      allocations: [
        { purposeId: 'membership', purposeName: '会员费', amount: 50000, percentage: 30 },
        { purposeId: 'event', purposeName: '活动支出', amount: 30000, percentage: 18 },
        { purposeId: 'office', purposeName: '办公支出', amount: 25000, percentage: 15 },
        { purposeId: 'marketing', purposeName: '营销费用', amount: 20000, percentage: 12 },
        { purposeId: 'training', purposeName: '培训费用', amount: 15000, percentage: 9 },
        { purposeId: 'equipment', purposeName: '设备费用', amount: 10000, percentage: 6 },
        { purposeId: 'other', purposeName: '其他', amount: 10000, percentage: 6 },
      ],
    },
    {
      id: 'compact',
      name: '精简预算模板',
      description: '适用于小型分会的精简预算模板',
      totalAmount: 75000,
      allocations: [
        { purposeId: 'membership', purposeName: '会员费', amount: 30000, percentage: 40 },
        { purposeId: 'event', purposeName: '活动支出', amount: 20000, percentage: 27 },
        { purposeId: 'office', purposeName: '办公支出', amount: 15000, percentage: 20 },
        { purposeId: 'other', purposeName: '其他', amount: 10000, percentage: 13 },
      ],
    },
    {
      id: 'large',
      name: '大型分会预算模板',
      description: '适用于大型分会的大型预算模板',
      totalAmount: 400000,
      allocations: [
        { purposeId: 'membership', purposeName: '会员费', amount: 100000, percentage: 25 },
        { purposeId: 'event', purposeName: '活动支出', amount: 80000, percentage: 20 },
        { purposeId: 'office', purposeName: '办公支出', amount: 60000, percentage: 15 },
        { purposeId: 'marketing', purposeName: '营销费用', amount: 50000, percentage: 12.5 },
        { purposeId: 'training', purposeName: '培训费用', amount: 40000, percentage: 10 },
        { purposeId: 'equipment', purposeName: '设备费用', amount: 30000, percentage: 7.5 },
        { purposeId: 'travel', purposeName: '差旅费', amount: 20000, percentage: 5 },
        { purposeId: 'other', purposeName: '其他', amount: 20000, percentage: 5 },
      ],
    },
  ];

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
    setBudgetTemplates(defaultTemplates);
  }, []);

  // 更新全局可用年份
  useEffect(() => {
    if (budgets.length > 0) {
      const years = Array.from(new Set(budgets.map(budget => budget.budgetYear)))
        .sort((a, b) => b - a);
      setAvailableYears(years);
    }
  }, [budgets, setAvailableYears]);

  // 获取选中年度预算
  const selectedYearBudgets = budgets.filter(budget => budget.budgetYear === selectedYear);
  const selectedYearAllocations = allocations.filter(allocation => 
    selectedYearBudgets.some(budget => budget.id === allocation.budgetId)
  );


  // 计算预算统计
  const budgetStats = {
    totalBudgets: selectedYearBudgets.length,
    totalBudgetAmount: selectedYearBudgets.reduce((sum, budget) => sum + budget.totalBudget, 0),
    totalAllocatedAmount: selectedYearBudgets.reduce((sum, budget) => sum + budget.allocatedAmount, 0),
    totalSpentAmount: selectedYearBudgets.reduce((sum, budget) => sum + budget.spentAmount, 0),
    totalRemainingAmount: selectedYearBudgets.reduce((sum, budget) => sum + budget.remainingAmount, 0),
  };

  // 计算预算绩效
  const calculateBudgetPerformance = (): BudgetPerformance[] => {
    return selectedYearBudgets.map(budget => {
      const budgetAllocations = selectedYearAllocations.filter(
        allocation => allocation.budgetId === budget.id
      );
      
      const totalAllocated = budgetAllocations.reduce((sum, allocation) => 
        sum + allocation.allocatedAmount, 0
      );
      
      const totalSpent = budgetAllocations.reduce((sum, allocation) => 
        sum + allocation.spentAmount, 0
      );
      
      const remaining = budget.totalBudget - totalSpent;
      const utilizationRate = (totalSpent / budget.totalBudget) * 100;
      const variance = totalSpent - budget.totalBudget;
      const variancePercentage = (variance / budget.totalBudget) * 100;
      
      let status: 'on-track' | 'over-budget' | 'under-budget' | 'completed';
      if (utilizationRate >= 100) {
        status = 'completed';
      } else if (variance > 0) {
        status = 'over-budget';
      } else if (variance < -budget.totalBudget * 0.1) {
        status = 'under-budget';
      } else {
        status = 'on-track';
      }
      
      return {
        budgetId: budget.id,
        projectName: budget.projectName,
        totalBudget: budget.totalBudget,
        allocatedAmount: totalAllocated,
        spentAmount: totalSpent,
        remainingAmount: remaining,
        utilizationRate,
        variance,
        variancePercentage,
        status,
      };
    });
  };

  const budgetPerformance = calculateBudgetPerformance();

  // 预算状态颜色映射
  const getStatusColor = (status: BudgetStatus) => {
    const colors = {
      draft: 'default',
      approved: 'processing',
      active: 'success',
      completed: 'success',
      cancelled: 'error',
      revoked: 'warning',
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
      revoked: '已撤销',
    };
    return texts[status];
  };

  // 审批状态颜色映射
  const getApprovalStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'processing',
      approved: 'success',
      rejected: 'error',
      cancelled: 'default',
    };
    return colors[status] as any;
  };

  // 审批状态文本映射
  const getApprovalStatusText = (status: string) => {
    const texts: { [key: string]: string } = {
      pending: '待审批',
      approved: '已审批',
      rejected: '已拒绝',
      cancelled: '已取消',
    };
    return texts[status];
  };

  // 处理函数
  const handleCreateBudget = async () => {
    try {
      const values = await budgetForm.validateFields();
      await onCreateBudget({
        ...values,
        budgetYear: selectedYear,
        allocatedAmount: 0,
        spentAmount: 0,
        remainingAmount: values.totalBudget,
        status: 'draft',
        createdBy: 'current-user', // 这里应该从用户上下文获取
        // 新增的层次结构字段 - 确保没有undefined值
        mainCategory: values.mainCategory || null,
        subCategory: values.subCategory || null,
        itemCode: values.itemCode || (values.subCategory ? generateItemCode(values.subCategory, 0) : '') || null,
        note: values.note || null,
        description: values.description || null,
      });
      message.success('JCI预算项目创建成功');
      setIsCreateModalVisible(false);
      budgetForm.resetFields();
      setSelectedMainCategory(undefined);
      setSelectedSubCategory(undefined);
    } catch (error) {
      console.error('创建预算失败:', error);
      message.error('创建预算失败');
    }
  };

  const handleUseTemplate = async (template: BudgetTemplate) => {
    try {
      // 创建预算
      const budgetData = {
        projectName: `${template.name} - ${selectedYear}年`,
        budgetYear: selectedYear,
        totalBudget: template.totalAmount,
        allocatedAmount: 0,
        spentAmount: 0,
        remainingAmount: template.totalAmount,
        status: 'draft' as BudgetStatus,
        description: template.description,
        createdBy: 'current-user',
      };

      await onCreateBudget(budgetData);
      
      // 注意：这里需要等待预算创建完成后再创建分配
      // 由于onCreateBudget是异步的，我们需要在组件外部处理分配创建
      message.success('预算模板应用成功');
      setIsTemplateModalVisible(false);
    } catch (error) {
      console.error('应用模板失败:', error);
      message.error('应用模板失败');
    }
  };

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

  const handleRevokeApproval = async () => {
    try {
      await approvalForm.validateFields();
      
      if (selectedBudget) {
        await onUpdateBudget(selectedBudget.id, {
          status: 'revoked',
        });
        message.success('撤销审批成功');
        setIsApprovalModalVisible(false);
        approvalForm.resetFields();
      }
    } catch (error) {
      console.error('撤销审批失败:', error);
      message.error('撤销审批失败');
    }
  };

  // 处理新全年预算创建
  const handleCreateYearlyBudget = () => {
    setIsCreateYearlyBudgetModalVisible(true);
    yearlyBudgetForm.setFieldsValue({
      budgetYear: new Date().getFullYear() + 1, // 默认下一年
    });
  };

  const handleYearlyBudgetSubmit = async () => {
    try {
      const values = await yearlyBudgetForm.validateFields();
      const targetYear = values.budgetYear;
      
      // 检查目标年份是否已存在预算
      const existingBudgets = budgets.filter(budget => budget.budgetYear === targetYear);
      if (existingBudgets.length > 0) {
        message.warning(`${targetYear}年已存在预算数据，请选择其他年份或删除现有预算`);
        return;
      }

      // 使用标准模板创建新年度预算
      const standardTemplate = defaultTemplates.find(t => t.id === 'standard');
      if (!standardTemplate) {
        message.error('找不到标准预算模板');
        return;
      }

      // 创建预算项目 - 使用标准预算分类
      const budgetCategories = [
        // 收入预算
        { mainCategory: 'income' as BudgetMainCategory, subCategory: 'membership_subscription' as BudgetSubCategory, name: '会员费收入', amount: 50000 },
        { mainCategory: 'income' as BudgetMainCategory, subCategory: 'external_funding' as BudgetSubCategory, name: '外部资助', amount: 30000 },
        { mainCategory: 'income' as BudgetMainCategory, subCategory: 'project_surplus' as BudgetSubCategory, name: '项目盈余', amount: 20000 },
        { mainCategory: 'income' as BudgetMainCategory, subCategory: 'other_income' as BudgetSubCategory, name: '其他收入', amount: 10000 },
        
        // 支出预算
        { mainCategory: 'expense' as BudgetMainCategory, subCategory: 'administrative' as BudgetSubCategory, name: '行政费用', amount: 25000 },
        { mainCategory: 'expense' as BudgetMainCategory, subCategory: 'projects' as BudgetSubCategory, name: '项目费用', amount: 30000 },
        { mainCategory: 'expense' as BudgetMainCategory, subCategory: 'convention' as BudgetSubCategory, name: '大会费用', amount: 20000 },
        { mainCategory: 'expense' as BudgetMainCategory, subCategory: 'merchandise' as BudgetSubCategory, name: '商品费用', amount: 15000 },
      ];

      for (let i = 0; i < budgetCategories.length; i++) {
        const category = budgetCategories[i];
        const budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> = {
          mainCategory: category.mainCategory,
          subCategory: category.subCategory,
          projectName: `${category.name} - ${targetYear}年`,
          budgetYear: targetYear,
          totalBudget: category.amount,
          allocatedAmount: 0,
          spentAmount: 0,
          remainingAmount: category.amount,
          status: 'draft',
          description: `${category.name}预算项目`,
          note: `自动生成的${targetYear}年${category.name}预算`,
          itemCode: generateItemCode(category.subCategory, i),
          createdBy: 'system', // 添加必需的createdBy字段
        };

        await onCreateBudget(budgetData);
      }

      message.success(`${targetYear}年全年预算创建成功！`);
      setIsCreateYearlyBudgetModalVisible(false);
      yearlyBudgetForm.resetFields();
      
      // 自动切换到新创建的年份
      setSelectedYear(targetYear);
    } catch (error) {
      console.error('创建新全年预算失败:', error);
      message.error('创建新全年预算失败');
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

  const handleViewAllocations = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsAllocationModalVisible(true);
  };

  const handleCreateAllocation = async () => {
    try {
      const values = await allocationForm.validateFields();
      
      if (selectedBudget) {
        await onCreateAllocation({
          budgetId: selectedBudget.id,
          purposeId: values.purposeId,
          purposeName: values.purposeName || '',
          allocatedAmount: values.allocatedAmount,
          spentAmount: 0,
          remainingAmount: values.allocatedAmount,
          // createdBy: 'current-user',
        });
        message.success('预算分配创建成功');
        setIsAllocationModalVisible(false);
        allocationForm.resetFields();
      }
    } catch (error) {
      console.error('创建预算分配失败:', error);
      message.error('创建预算分配失败');
    }
  };

  const handleEditBudget = (budget: Budget) => {
    setSelectedBudget(budget);
    budgetForm.setFieldsValue({
      projectName: budget.projectName,
      totalBudget: budget.totalBudget,
      description: budget.description,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateBudget = async () => {
    try {
      const values = await budgetForm.validateFields();
      
      if (selectedBudget) {
        await onUpdateBudget(selectedBudget.id, {
          projectName: values.projectName,
          totalBudget: values.totalBudget,
          description: values.description,
        });
        message.success('预算更新成功');
        setIsEditModalVisible(false);
        budgetForm.resetFields();
        setSelectedBudget(null);
      }
    } catch (error) {
      console.error('更新预算失败:', error);
      message.error('更新预算失败');
    }
  };

  const handleDeleteBudget = async (budget: Budget) => {
    try {
      await onDeleteBudget(budget.id);
      message.success('预算删除成功');
    } catch (error) {
      console.error('删除预算失败:', error);
      message.error('删除预算失败');
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
      title: '已分配',
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
      render: (amount: number) => `RM ${amount.toLocaleString()}`,
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
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewAllocations(record)}
          >
            查看分配
          </Button>
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
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditBudget(record)}
              >
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这个预算吗？"
                onConfirm={() => handleDeleteBudget(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'approved' && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleActivateBudget(record)}
              >
                激活预算
              </Button>
              <Button
                size="small"
                danger
                onClick={() => handleStartApproval(record)}
              >
                撤销审批
              </Button>
            </>
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
              <DollarOutlined style={{ marginRight: 8 }} />
              整合预算管理
            </Title>
            <Text type="secondary">
              统一的预算管理界面，包含预算创建、审批、监控等功能
            </Text>
          </Col>
          <Col>
            <Space>
              <GlobalYearFilterModal
                value={selectedYear}
                onChange={(year) => setSelectedYear(year || new Date().getFullYear())}
                availableYears={availableYears}
                placeholder="选择年份"
                style={{ width: 120 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateYearlyBudget}
              >
                创建新全年预算
              </Button>
            </Space>
          </Col>
        </Row>

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'overview',
              label: '预算概览',
              children: (
                <>
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="总预算"
                          value={budgetStats.totalBudgetAmount}
                          prefix="RM"
                          formatter={(value) => value?.toLocaleString()}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="已分配"
                          value={budgetStats.totalAllocatedAmount}
                          prefix="RM"
                          formatter={(value) => value?.toLocaleString()}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="已支出"
                          value={budgetStats.totalSpentAmount}
                          prefix="RM"
                          formatter={(value) => value?.toLocaleString()}
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="剩余"
                          value={budgetStats.totalRemainingAmount}
                          prefix="RM"
                          formatter={(value) => value?.toLocaleString()}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Card title="预算状态分布" size="small">
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 16 }}>
                            <div>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                                {selectedYearBudgets.filter(b => b.status === 'draft').length}
                              </div>
                              <Text type="secondary">草稿</Text>
                            </div>
                            <div>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                                {selectedYearBudgets.filter(b => b.status === 'active').length}
                              </div>
                              <Text type="secondary">执行中</Text>
                            </div>
                            <div>
                              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                                {selectedYearBudgets.filter(b => b.status === 'approved').length}
                              </div>
                              <Text type="secondary">已审批</Text>
                            </div>
                          </div>
                          <PieChartOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">预算状态统计</Text>
                          </div>
                        </div>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card title="预算使用趋势" size="small">
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                              {budgetStats.totalBudgetAmount > 0 ? 
                                ((budgetStats.totalSpentAmount / budgetStats.totalBudgetAmount) * 100).toFixed(1) : 0}%
                            </div>
                            <Text type="secondary">总体使用率</Text>
                          </div>
                          <Progress 
                            type="circle" 
                            percent={budgetStats.totalBudgetAmount > 0 ? 
                              (budgetStats.totalSpentAmount / budgetStats.totalBudgetAmount) * 100 : 0} 
                            strokeColor="#52c41a"
                            size={80}
                          />
                          <div style={{ marginTop: 8 }}>
                            <Text type="secondary">预算执行进度</Text>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  </Row>
                </>
              ),
            },
            {
              key: 'jci-budget',
              label: 'JCI预算列表',
              children: (
                <>
                  <JCIBudgetTable
                    budgets={selectedYearBudgets}
                    allocations={allocations}
                    loading={loading}
                    onEditBudget={handleEditBudget}
                    onDeleteBudget={handleDeleteBudget}
                    onViewAllocations={handleViewAllocations}
                    onStartApproval={handleStartApproval}
                    onViewWorkflow={handleViewWorkflow}
                    onUpdateBudget={(budget: Budget) => onUpdateBudget(budget.id, budget)}
                    onCreateBudget={onCreateBudget}
                    onUseTemplate={() => setIsTemplateModalVisible(true)}
                    selectedYear={selectedYear}
                  />
                </>
              ),
            },
            {
              key: 'approval',
              label: '审批流程',
              children: (
                <>
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="待审批"
                          value={selectedYearBudgets.filter(b => b.status === 'draft').length}
                          prefix={<ClockCircleOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="已审批"
                          value={selectedYearBudgets.filter(b => b.status === 'approved').length}
                          prefix={<CheckCircleOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="执行中"
                          value={selectedYearBudgets.filter(b => b.status === 'active').length}
                          prefix={<ExclamationCircleOutlined />}
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="总预算"
                          value={budgetStats.totalBudgetAmount}
                          prefix="RM"
                          formatter={(value) => value?.toLocaleString()}
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Table
                    columns={budgetColumns}
                    dataSource={selectedYearBudgets}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    size="small"
                  />
                </>
              ),
            },
            {
              key: 'monitoring',
              label: '执行监控',
              children: (
                <>
                  <Row gutter={16} style={{ marginBottom: 24 }}>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="总预算"
                          value={budgetStats.totalBudgetAmount}
                          prefix="RM"
                          formatter={(value) => value?.toLocaleString()}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="已分配"
                          value={budgetStats.totalAllocatedAmount}
                          prefix="RM"
                          formatter={(value) => value?.toLocaleString()}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="已支出"
                          value={budgetStats.totalSpentAmount}
                          prefix="RM"
                          formatter={(value) => value?.toLocaleString()}
                          valueStyle={{ color: '#faad14' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card size="small">
                        <Statistic
                          title="平均使用率"
                          value={budgetStats.totalBudgetAmount > 0 ? (budgetStats.totalSpentAmount / budgetStats.totalBudgetAmount * 100).toFixed(1) : 0}
                          suffix="%"
                          valueStyle={{ color: '#722ed1' }}
                        />
                      </Card>
                    </Col>
                  </Row>

                  {/* 预算预警 */}
                  <Card title="预算预警" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Alert
                          message="超支预警"
                          description={`${budgetPerformance.filter(p => p.status === 'over-budget').length} 个项目超支`}
                          type="error"
                          icon={<ExclamationCircleOutlined />}
                        />
                      </Col>
                      <Col span={8}>
                        <Alert
                          message="使用率预警"
                          description={`${budgetPerformance.filter(p => p.utilizationRate > 80 && p.status !== 'completed').length} 个项目使用率超过80%`}
                          type="warning"
                          icon={<WarningOutlined />}
                        />
                      </Col>
                      <Col span={8}>
                        <Alert
                          message="未充分使用"
                          description={`${budgetPerformance.filter(p => p.status === 'under-budget').length} 个项目使用率过低`}
                          type="info"
                          icon={<ClockCircleOutlined />}
                        />
                      </Col>
                    </Row>
                  </Card>

                  <Table
                    columns={[
                      ...budgetColumns.slice(0, -1), // 移除操作列
                      {
                        title: '使用率',
                        key: 'utilizationRate',
                        render: (_, record: Budget) => {
                          const rate = (record.spentAmount / record.totalBudget * 100).toFixed(1);
                          return (
                            <div>
                              <Progress 
                                percent={parseFloat(rate)} 
                                size="small" 
                                status={parseFloat(rate) > 80 ? 'exception' : 'normal'}
                              />
                              <Text type="secondary">{rate}%</Text>
                            </div>
                          );
                        },
                      },
                    ]}
                    dataSource={selectedYearBudgets}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    size="small"
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      {/* 创建预算模态框 */}
      <Modal
        title="创建JCI预算项目"
        open={isCreateModalVisible}
        onOk={handleCreateBudget}
        onCancel={() => {
          setIsCreateModalVisible(false);
          budgetForm.resetFields();
          setSelectedMainCategory(undefined);
          setSelectedSubCategory(undefined);
        }}
        width={800}
      >
        <Form form={budgetForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mainCategory"
                label="主要分类"
                rules={[{ required: true, message: '请选择主要分类' }]}
              >
                <Select 
                  placeholder="请选择主要分类"
                  onChange={(value: BudgetMainCategory) => {
                    setSelectedMainCategory(value);
                    setSelectedSubCategory(undefined);
                    budgetForm.setFieldsValue({ subCategory: undefined, itemTemplate: undefined });
                  }}
                >
                  {BUDGET_MAIN_CATEGORY_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="subCategory"
                label="子分类"
                rules={[{ required: true, message: '请选择子分类' }]}
              >
                <Select 
                  placeholder="请选择子分类"
                  disabled={!selectedMainCategory}
                  onChange={(value: BudgetSubCategory) => {
                    setSelectedSubCategory(value);
                    budgetForm.setFieldsValue({ itemTemplate: undefined });
                  }}
                >
                  {selectedMainCategory && getSubCategoryOptions(selectedMainCategory).map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="itemTemplate"
                label="项目模板"
                rules={[{ required: true, message: '请选择项目模板' }]}
              >
                <Select 
                  placeholder="请选择项目模板"
                  disabled={!selectedSubCategory}
                  onChange={(value: string) => {
                    const template = getItemTemplates(selectedSubCategory!).find(t => t.name === value);
                    budgetForm.setFieldsValue({ 
                      projectName: value,
                      note: template?.note || ''
                    });
                  }}
                >
                  {selectedSubCategory && getItemTemplates(selectedSubCategory).map(template => (
                    <Option key={template.name} value={template.name}>
                      {template.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="itemCode"
                label="项目代码"
              >
                <Input 
                  placeholder="自动生成" 
                  disabled 
                  value={selectedSubCategory ? generateItemCode(selectedSubCategory, 0) : ''}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="projectName"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalBudget"
                label="预算金额 (RM)"
                rules={[{ required: true, message: '请输入预算金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入预算金额"
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: string | undefined) => parseFloat(value ? value.replace(/(,*)/g, '') : '0') || 0}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="note"
                label="备注"
              >
                <Input placeholder="备注说明 (如 Note 1)" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="详细描述"
          >
            <TextArea rows={3} placeholder="请输入预算详细描述" />
          </Form.Item>

          {/* 分类信息预览 */}
          {selectedMainCategory && selectedSubCategory && (
            <Alert
              message="分类信息预览"
              description={
                <div>
                  <Text strong>主要分类：</Text> {BUDGET_CATEGORIES.find(cat => cat.id === selectedMainCategory)?.mainCategoryName}<br />
                  <Text strong>子分类：</Text> {BUDGET_CATEGORIES.find(cat => cat.id === selectedMainCategory)?.subCategories.find(sub => sub.id === selectedSubCategory)?.subCategoryName}<br />
                  <Text strong>项目代码：</Text> {generateItemCode(selectedSubCategory, 0)}
                </div>
              }
              type="info"
              showIcon
            />
          )}
        </Form>
      </Modal>

      {/* 审批模态框 */}
      <Modal
        title={selectedBudget?.status === 'approved' ? '撤销审批' : '预算审批'}
        open={isApprovalModalVisible}
        onOk={selectedBudget?.status === 'approved' ? handleRevokeApproval : handleApprovalSubmit}
        onCancel={() => {
          setIsApprovalModalVisible(false);
          approvalForm.resetFields();
        }}
        width={600}
        okText={selectedBudget?.status === 'approved' ? '确认撤销' : '确认审批'}
        okButtonProps={selectedBudget?.status === 'approved' ? { danger: true } : { type: 'primary' }}
      >
        {selectedBudget && (
          <div>
            <Alert
              message={selectedBudget.status === 'approved' ? `撤销审批: ${selectedBudget.projectName}` : `审批预算: ${selectedBudget.projectName}`}
              description={`总预算: RM ${selectedBudget.totalBudget.toLocaleString()} | 当前状态: ${getStatusText(selectedBudget.status)}`}
              type={selectedBudget.status === 'approved' ? 'warning' : 'info'}
              style={{ marginBottom: 16 }}
            />
            
            <Form form={approvalForm} layout="vertical">
              <Form.Item
                name="comments"
                label={selectedBudget.status === 'approved' ? '撤销原因' : '审批意见'}
                rules={[{ required: true, message: selectedBudget.status === 'approved' ? '请输入撤销原因' : '请输入审批意见' }]}
              >
                <TextArea 
                  rows={4} 
                  placeholder={selectedBudget.status === 'approved' ? '请输入撤销原因' : '请输入审批意见'} 
                />
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
              description={`总预算: RM ${selectedBudget.totalBudget.toLocaleString()} | 状态: ${getStatusText(selectedBudget.status)}`}
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Timeline>
               {mockApprovalWorkflows[0]?.steps.map((step, _index) => (
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

      {/* 模板选择模态框 */}
      <Modal
        title="选择预算模板"
        open={isTemplateModalVisible}
        onCancel={() => setIsTemplateModalVisible(false)}
        footer={null}
        width={800}
      >
        <div>
          <Alert
            message="选择适合的预算模板"
            description="模板将自动创建预算和预算分配，您可以在创建后进行修改"
            type="info"
            style={{ marginBottom: 16 }}
          />
          
          <Row gutter={16}>
            {budgetTemplates.map(template => (
              <Col span={8} key={template.id}>
                <Card
                  hoverable
                  style={{ marginBottom: 16 }}
                  actions={[
                    <Button
                      type="primary"
                      onClick={() => handleUseTemplate(template)}
                    >
                      使用此模板
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={template.name}
                    description={
                      <div>
                        <Text type="secondary">{template.description}</Text>
                        <br />
                        <Text strong style={{ color: '#1890ff' }}>
                          总预算: RM {template.totalAmount.toLocaleString()}
                        </Text>
                        <Divider style={{ margin: '8px 0' }} />
                        <div>
                          {template.allocations.slice(0, 3).map(allocation => (
                            <div key={allocation.purposeId} style={{ fontSize: '12px' }}>
                              {allocation.purposeName}: RM {allocation.amount.toLocaleString()}
                            </div>
                          ))}
                          {template.allocations.length > 3 && (
                            <Text type="secondary">... 等{template.allocations.length}项</Text>
                          )}
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      </Modal>

      {/* 预算分配管理模态框 */}
      <Modal
        title={selectedBudget ? `${selectedBudget.projectName} - 预算分配管理` : '预算分配管理'}
        open={isAllocationModalVisible}
        onCancel={() => {
          setIsAllocationModalVisible(false);
          setSelectedBudget(null);
        }}
        footer={null}
        width={1000}
      >
        {selectedBudget && (
          <div>
            <Alert
              message={`预算项目: ${selectedBudget.projectName}`}
              description={`总预算: RM ${selectedBudget.totalBudget.toLocaleString()} | 已分配: RM ${selectedBudget.allocatedAmount.toLocaleString()} | 剩余: RM ${selectedBudget.remainingAmount.toLocaleString()}`}
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  allocationForm.resetFields();
                  setIsCreateAllocationModalVisible(true);
                }}
              >
                添加分配
              </Button>
            </div>

            <Table
              columns={[
                {
                  title: '用途',
                  dataIndex: 'purposeId',
                  key: 'purposeId',
                  render: (purposeId: string) => {
                    const purpose = purposes.find(p => p.id === purposeId);
                    return purpose ? purpose.name : '未知用途';
                  },
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
                  render: (amount: number) => `RM ${amount.toLocaleString()}`,
                },
                {
                  title: '使用率',
                  key: 'utilizationRate',
                  render: (_, record: BudgetAllocation) => {
                    const rate = (record.spentAmount / record.allocatedAmount * 100).toFixed(1);
                    return (
                      <div>
                        <Progress 
                          percent={parseFloat(rate)} 
                          size="small" 
                          status={parseFloat(rate) > 80 ? 'exception' : 'normal'}
                        />
                        <Text type="secondary">{rate}%</Text>
                      </div>
                    );
                  },
                },
                {
                  title: '操作',
                  key: 'actions',
                   render: (_, _record: BudgetAllocation) => (
                    <Space>
                      <Button size="small" icon={<EditOutlined />}>
                        编辑
                      </Button>
                      <Popconfirm
                        title="确定要删除这个分配吗？"
                        onConfirm={() => {
                          // 这里添加删除分配的逻辑
                        }}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button size="small" danger icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    </Space>
                  ),
                },
              ]}
              dataSource={allocations.filter(allocation => allocation.budgetId === selectedBudget.id)}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      {/* 编辑预算模态框 */}
      <Modal
        title="编辑预算"
        open={isEditModalVisible}
        onOk={handleUpdateBudget}
        onCancel={() => {
          setIsEditModalVisible(false);
          budgetForm.resetFields();
          setSelectedBudget(null);
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
            name="totalBudget"
            label="总预算 (RM)"
            rules={[{ required: true, message: '请输入总预算' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入总预算"
              min={0}
              formatter={value => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value: string | undefined) => parseFloat(value ? value.replace(/RM\s?|(,*)/g, '') : '0') || 0}
            />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <TextArea rows={3} placeholder="请输入预算描述" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建预算分配模态框 */}
      <Modal
        title="创建预算分配"
        open={isCreateAllocationModalVisible}
        onOk={handleCreateAllocation}
        onCancel={() => {
          setIsCreateAllocationModalVisible(false);
          allocationForm.resetFields();
        }}
        width={600}
      >
        {selectedBudget && (
          <div>
            <Alert
              message={`为预算项目 "${selectedBudget.projectName}" 创建分配`}
              description={`总预算: RM ${selectedBudget.totalBudget.toLocaleString()} | 剩余可分配: RM ${selectedBudget.remainingAmount.toLocaleString()}`}
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Form form={allocationForm} layout="vertical">
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
                label="分配金额 (RM)"
                rules={[
                  { required: true, message: '请输入分配金额' },
                  { 
                    validator: (_, value) => {
                      if (value && value > selectedBudget.remainingAmount) {
                        return Promise.reject(new Error('分配金额不能超过剩余预算'));
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入分配金额"
                  min={0}
                  max={selectedBudget.remainingAmount}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value: string | undefined) => parseFloat(value ? value.replace(/RM\s?|(,*)/g, '') : '0') || 0}
                />
              </Form.Item>
              <Form.Item
                name="description"
                label="描述"
              >
                <TextArea rows={3} placeholder="请输入分配描述" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 创建新全年预算模态框 */}
      <Modal
        title="创建新全年预算"
        open={isCreateYearlyBudgetModalVisible}
        onOk={handleYearlyBudgetSubmit}
        onCancel={() => {
          setIsCreateYearlyBudgetModalVisible(false);
          yearlyBudgetForm.resetFields();
        }}
        width={500}
        confirmLoading={loading}
      >
        <Form form={yearlyBudgetForm} layout="vertical">
          <Alert
            message="新全年预算创建"
            description="系统将使用标准预算模板为新年度创建完整的预算结构，包括收入、支出等各类预算项目。"
            type="info"
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            name="budgetYear"
            label="预算年份"
            rules={[
              { required: true, message: '请选择预算年份' },
              { type: 'number', min: 2020, max: 2030, message: '请输入有效的年份（2020-2030）' }
            ]}
            extra="选择要创建预算的年份，系统会自动检查该年份是否已存在预算"
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入预算年份"
              min={2020}
              max={2030}
            />
          </Form.Item>

          <Form.Item
            name="templateType"
            label="预算模板类型"
            initialValue="standard"
          >
            <Select disabled>
              <Option value="standard">标准年度预算模板</Option>
            </Select>
          </Form.Item>

          <Alert
            message="注意事项"
            description={
              <div>
                <p>• 系统将创建包含以下分类的完整预算结构：</p>
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  <li>收入预算：会员费、外部资助、项目盈余、其他收入</li>
                  <li>支出预算：行政费用、项目费用、大会费用、商品费用</li>
                </ul>
                <p>• 所有预算项目初始状态为"草稿"，需要后续审批</p>
                <p>• 如果目标年份已存在预算，系统将提示错误</p>
              </div>
            }
            type="warning"
            style={{ marginTop: 16 }}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default IntegratedBudgetManagement;
