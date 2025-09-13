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
  Tabs,
  Empty,
  Tooltip,
  Divider,
  Spin,
  Drawer,
  Timeline,
  Descriptions,
  Steps,
  FloatButton,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  DashboardOutlined,
  BarChartOutlined,
  PieChartOutlined,
  TrendingUpOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  SyncOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
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
  const [isBudgetDetailDrawerVisible, setIsBudgetDetailDrawerVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingAllocation, setEditingAllocation] = useState<BudgetAllocation | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetTemplates, setBudgetTemplates] = useState<BudgetTemplate[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(fiscalYear);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

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
  const selectedYearBudgets = useMemo(() => 
    budgets.filter(budget => budget.budgetYear === selectedYear),
    [budgets, selectedYear]
  );
  
  const selectedYearAllocations = useMemo(() => 
    allocations.filter(allocation => 
      selectedYearBudgets.some(budget => budget.id === allocation.budgetId)
    ),
    [allocations, selectedYearBudgets]
  );

  // 获取所有可用年份
  const availableYears = useMemo(() => 
    Array.from(new Set(budgets.map(budget => budget.budgetYear)))
      .sort((a, b) => b - a), // 按年份降序排列
    [budgets]
  );

  // 过滤和搜索预算
  const filteredBudgets = useMemo(() => {
    let filtered = selectedYearBudgets;
    
    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }
    
    // 搜索过滤
    if (searchText) {
      filtered = filtered.filter(budget => 
        budget.projectName.toLowerCase().includes(searchText.toLowerCase()) ||
        (budget.description && budget.description.toLowerCase().includes(searchText.toLowerCase()))
      );
    }
    
    return filtered;
  }, [selectedYearBudgets, statusFilter, searchText]);

  // 预算状态分组
  const budgetsByStatus = useMemo(() => {
    const grouped = {
      draft: selectedYearBudgets.filter(b => b.status === 'draft'),
      approved: selectedYearBudgets.filter(b => b.status === 'approved'),
      active: selectedYearBudgets.filter(b => b.status === 'active'),
      completed: selectedYearBudgets.filter(b => b.status === 'completed'),
      cancelled: selectedYearBudgets.filter(b => b.status === 'cancelled'),
    };
    return grouped;
  }, [selectedYearBudgets]);

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

  // 获取状态图标
  const getStatusIcon = (status: BudgetStatus) => {
    const icons = {
      draft: <EditOutlined />,
      approved: <CheckCircleOutlined />,
      active: <RocketOutlined />,
      completed: <CheckCircleOutlined />,
      cancelled: <ExclamationCircleOutlined />,
    };
    return icons[status];
  };

  // 刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadBudgetTemplates();
      message.success('数据刷新成功');
    } catch (error) {
      message.error('数据刷新失败');
    } finally {
      setIsRefreshing(false);
    }
  };

  // 重置筛选
  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    message.info('筛选条件已重置');
  };

  // 导出预算数据
  const handleExportBudgets = () => {
    // TODO: 实现导出功能
    message.info('导出功能正在开发中');
  };

  // 预算列定义
  const budgetColumns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      fixed: 'left' as const,
      render: (text: string, record: Budget) => (
        <div>
          <Space>
            {getStatusIcon(record.status)}
            <Text strong>{text}</Text>
          </Space>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.budgetYear}年度 • 创建于 {new Date(record.createdAt).toLocaleDateString()}
          </Text>
          {record.description && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }} ellipsis>
                {record.description}
              </Text>
            </>
          )}
        </div>
      ),
      sorter: (a: Budget, b: Budget) => a.projectName.localeCompare(b.projectName),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value: string | number | boolean, record: Budget) => 
        record.projectName.toLowerCase().includes(value.toString().toLowerCase()),
    },
    {
      title: '总预算',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Tooltip title={`RM ${amount.toLocaleString()}`}>
          <Text strong style={{ color: '#1890ff' }}>
            RM {amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}M` : 
                 amount >= 1000 ? `${(amount / 1000).toFixed(0)}K` : 
                 amount.toLocaleString()}
          </Text>
        </Tooltip>
      ),
      sorter: (a: Budget, b: Budget) => a.totalBudget - b.totalBudget,
    },
    {
      title: '已分配',
      dataIndex: 'allocatedAmount',
      key: 'allocatedAmount',
      width: 140,
      align: 'right' as const,
      render: (amount: number, record: Budget) => {
        const percentage = Math.round((amount / record.totalBudget) * 100);
        return (
          <div>
            <Text>RM {amount.toLocaleString()}</Text>
            <br />
            <Progress 
              percent={percentage} 
              size="small" 
              showInfo={false}
              strokeColor={percentage > 100 ? '#ff4d4f' : '#52c41a'}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {percentage}%
            </Text>
          </div>
        );
      },
      sorter: (a: Budget, b: Budget) => a.allocatedAmount - b.allocatedAmount,
    },
    {
      title: '已支出',
      dataIndex: 'spentAmount',
      key: 'spentAmount',
      width: 140,
      align: 'right' as const,
      render: (amount: number, record: Budget) => {
        const percentage = Math.round((amount / record.totalBudget) * 100);
        const isOverBudget = amount > record.totalBudget;
        return (
          <div>
            <Text type={isOverBudget ? 'danger' : 'default'}>
              RM {amount.toLocaleString()}
            </Text>
            <br />
            <Progress 
              percent={Math.min(percentage, 100)} 
              size="small" 
              showInfo={false}
              strokeColor={isOverBudget ? '#ff4d4f' : '#faad14'}
              status={isOverBudget ? 'exception' : 'active'}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {percentage}%
            </Text>
          </div>
        );
      },
      sorter: (a: Budget, b: Budget) => a.spentAmount - b.spentAmount,
    },
    {
      title: '剩余',
      dataIndex: 'remainingAmount',
      key: 'remainingAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Tooltip title={`RM ${amount.toLocaleString()}`}>
          <Text type={amount < 0 ? 'danger' : 'success'} strong>
            RM {amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}M` : 
                 amount >= 1000 ? `${(amount / 1000).toFixed(0)}K` : 
                 amount.toLocaleString()}
          </Text>
        </Tooltip>
      ),
      sorter: (a: Budget, b: Budget) => a.remainingAmount - b.remainingAmount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: '草稿', value: 'draft' },
        { text: '已审批', value: 'approved' },
        { text: '执行中', value: 'active' },
        { text: '已完成', value: 'completed' },
        { text: '已取消', value: 'cancelled' },
      ],
      onFilter: (value: string | number | boolean, record: Budget) => record.status === value,
      render: (status: BudgetStatus) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
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
          <Tooltip title="编辑预算">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditBudget(record)}
              disabled={selectedYear !== fiscalYear}
            />
          </Tooltip>
          <Tooltip title="预算分配">
            <Button
              type="text"
              size="small"
              icon={<PieChartOutlined />}
              onClick={() => handleViewBudget(record)}
              disabled={selectedYear !== fiscalYear}
            />
          </Tooltip>
          {selectedYear === fiscalYear && (
            <Popconfirm
              title="确定要删除这个预算吗？"
              description="删除后将无法恢复，请谨慎操作。"
              onConfirm={() => handleDeleteBudget(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除预算">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
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
    <div style={{ background: '#f5f5f5', minHeight: '100vh', padding: '16px' }}>
      {/* 页面头部 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space size="large">
              <div>
                <Title level={3} style={{ margin: 0 }}>
                  <DashboardOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  {selectedYear}年度预算管理
                </Title>
                <Text type="secondary">
                  为新理事团管理年度预算和预算分配，确保财务规范透明
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
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
              <Tooltip title="刷新数据">
                <Button
                  icon={<SyncOutlined spin={isRefreshing} />}
                  onClick={handleRefresh}
                  loading={isRefreshing}
                />
              </Tooltip>
              <Tooltip title="导出数据">
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExportBudgets}
                />
              </Tooltip>
              <Button
                type="default"
                icon={<CopyOutlined />}
                onClick={() => setIsTemplateModalVisible(true)}
                disabled={selectedYear !== fiscalYear}
              >
                使用模板
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateBudget}
                disabled={selectedYear !== fiscalYear}
                size="large"
              >
                创建预算
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 年份提示 */}
      {selectedYear !== fiscalYear && (
        <Alert
          message={`当前查看 ${selectedYear} 年预算`}
          description={`只有 ${fiscalYear} 年（当前财政年度）的预算可以进行编辑操作。历史年份的预算仅供查看。`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          banner
        />
      )}

      {/* 预算统计概览 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="预算项目"
              value={budgetStats.totalBudgets}
              prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总预算金额"
              value={budgetStats.totalBudgetAmount}
              prefix="RM"
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已分配金额"
              value={budgetStats.totalAllocatedAmount}
              prefix="RM"
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="剩余金额"
              value={budgetStats.totalRemainingAmount}
              prefix="RM"
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: budgetStats.totalRemainingAmount < 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 状态分布卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ color: '#faad14' }}>
              <EditOutlined style={{ fontSize: '24px' }} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '20px' }}>{budgetsByStatus.draft.length}</Text>
                <br />
                <Text type="secondary">草稿</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ color: '#1890ff' }}>
              <CheckCircleOutlined style={{ fontSize: '24px' }} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '20px' }}>{budgetsByStatus.approved.length}</Text>
                <br />
                <Text type="secondary">已审批</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ color: '#52c41a' }}>
              <RocketOutlined style={{ fontSize: '24px' }} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '20px' }}>{budgetsByStatus.active.length}</Text>
                <br />
                <Text type="secondary">执行中</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ color: '#52c41a' }}>
              <CheckCircleOutlined style={{ fontSize: '24px' }} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '20px' }}>{budgetsByStatus.completed.length}</Text>
                <br />
                <Text type="secondary">已完成</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ color: '#ff4d4f' }}>
              <ExclamationCircleOutlined style={{ fontSize: '24px' }} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '20px' }}>{budgetsByStatus.cancelled.length}</Text>
                <br />
                <Text type="secondary">已取消</Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <div style={{ color: '#722ed1' }}>
              <TrendingUpOutlined style={{ fontSize: '24px' }} />
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: '20px' }}>
                  {budgetStats.totalBudgetAmount > 0 
                    ? Math.round((budgetStats.totalSpentAmount / budgetStats.totalBudgetAmount) * 100)
                    : 0}%
                </Text>
                <br />
                <Text type="secondary">使用率</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
          tabBarExtraContent={
            <Space>
              <Input.Search
                placeholder="搜索预算项目..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 120 }}
                placeholder="状态筛选"
              >
                <Option value="all">全部状态</Option>
                <Option value="draft">草稿</Option>
                <Option value="approved">已审批</Option>
                <Option value="active">执行中</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={handleResetFilters}
                title="重置筛选"
              />
            </Space>
          }
        >
          <Tabs.TabPane
            tab={
              <Space>
                <BarChartOutlined />
                概览
                <Badge count={filteredBudgets.length} showZero />
              </Space>
            }
            key="overview"
          >
            {filteredBudgets.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    {searchText || statusFilter !== 'all' ? '没有找到匹配的预算' : '暂无预算数据'}
                  </span>
                }
              >
                {selectedYear === fiscalYear && !searchText && statusFilter === 'all' && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateBudget}>
                    创建第一个预算
                  </Button>
                )}
              </Empty>
            ) : (
              <Spin spinning={loading}>
                <Table
                  columns={budgetColumns}
                  dataSource={filteredBudgets}
                  rowKey="id"
                  scroll={{ x: 1400 }}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  }}
                  rowClassName={(record) => {
                    if (record.remainingAmount < 0) return 'budget-row-danger';
                    if (record.spentAmount / record.totalBudget > 0.8) return 'budget-row-warning';
                    return '';
                  }}
                />
              </Spin>
            )}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <EditOutlined />
                草稿
                <Badge count={budgetsByStatus.draft.length} showZero />
              </Space>
            }
            key="draft"
          >
            <Table
              columns={budgetColumns}
              dataSource={budgetsByStatus.draft}
              rowKey="id"
              scroll={{ x: 1400 }}
              pagination={false}
              size="small"
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <RocketOutlined />
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
              scroll={{ x: 1400 }}
              pagination={false}
              size="small"
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <CheckCircleOutlined />
                已完成
                <Badge count={budgetsByStatus.completed.length} showZero />
              </Space>
            }
            key="completed"
          >
            <Table
              columns={budgetColumns}
              dataSource={budgetsByStatus.completed}
              rowKey="id"
              scroll={{ x: 1400 }}
              pagination={false}
              size="small"
            />
          </Tabs.TabPane>
        </Tabs>
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

      {/* 预算详情抽屉 */}
      <Drawer
        title={
          <Space>
            <BarChartOutlined />
            {selectedBudget?.projectName} - 预算详情
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
            <Button
              icon={<EditOutlined />}
              onClick={() => {
                if (selectedBudget) {
                  handleEditBudget(selectedBudget);
                  setIsBudgetDetailDrawerVisible(false);
                }
              }}
              disabled={selectedYear !== fiscalYear}
            >
              编辑
            </Button>
            <Button
              icon={<PieChartOutlined />}
              onClick={() => {
                if (selectedBudget) {
                  handleViewBudget(selectedBudget);
                  setIsBudgetDetailDrawerVisible(false);
                }
              }}
              disabled={selectedYear !== fiscalYear}
            >
              分配管理
            </Button>
          </Space>
        }
      >
        {selectedBudget && (
          <div>
            {/* 预算基本信息 */}
            <Card title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="项目名称" span={2}>
                  <Text strong>{selectedBudget.projectName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="预算年份">
                  {selectedBudget.budgetYear}年
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={getStatusColor(selectedBudget.status)} icon={getStatusIcon(selectedBudget.status)}>
                    {getStatusText(selectedBudget.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="总预算">
                  <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                    RM {selectedBudget.totalBudget.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="已分配">
                  <Text style={{ color: '#faad14', fontSize: '16px' }}>
                    RM {selectedBudget.allocatedAmount.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="已支出">
                  <Text style={{ color: '#ff4d4f', fontSize: '16px' }}>
                    RM {selectedBudget.spentAmount.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="剩余">
                  <Text 
                    style={{ 
                      color: selectedBudget.remainingAmount < 0 ? '#ff4d4f' : '#52c41a',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}
                  >
                    RM {selectedBudget.remainingAmount.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="创建者">
                  {selectedBudget.createdBy}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(selectedBudget.createdAt).toLocaleString()}
                </Descriptions.Item>
                {selectedBudget.description && (
                  <Descriptions.Item label="描述" span={2}>
                    {selectedBudget.description}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* 预算使用进度 */}
            <Card title="预算使用进度" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Text type="secondary">分配进度</Text>
                    <Progress
                      type="circle"
                      percent={Math.round((selectedBudget.allocatedAmount / selectedBudget.totalBudget) * 100)}
                      format={(percent) => `${percent}%`}
                      strokeColor="#faad14"
                      size={120}
                    />
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Text type="secondary">支出进度</Text>
                    <Progress
                      type="circle"
                      percent={Math.round((selectedBudget.spentAmount / selectedBudget.totalBudget) * 100)}
                      format={(percent) => `${percent}%`}
                      strokeColor={selectedBudget.spentAmount > selectedBudget.totalBudget ? "#ff4d4f" : "#52c41a"}
                      status={selectedBudget.spentAmount > selectedBudget.totalBudget ? "exception" : "normal"}
                      size={120}
                    />
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 预算分配详情 */}
            <Card title="预算分配详情">
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
                    align: 'right' as const,
                    render: (amount: number) => `RM ${amount.toLocaleString()}`,
                  },
                  {
                    title: '已支出',
                    dataIndex: 'spentAmount',
                    key: 'spentAmount',
                    align: 'right' as const,
                    render: (amount: number) => (
                      <Text style={{ color: '#ff4d4f' }}>
                        RM {amount.toLocaleString()}
                      </Text>
                    ),
                  },
                  {
                    title: '剩余',
                    dataIndex: 'remainingAmount',
                    key: 'remainingAmount',
                    align: 'right' as const,
                    render: (amount: number) => (
                      <Text type={amount < 0 ? 'danger' : 'success'}>
                        RM {amount.toLocaleString()}
                      </Text>
                    ),
                  },
                  {
                    title: '使用率',
                    key: 'usageRate',
                    align: 'center' as const,
                    render: (_: any, record: BudgetAllocation) => {
                      const rate = record.allocatedAmount > 0 
                        ? (record.spentAmount / record.allocatedAmount) * 100 
                        : 0;
                      return (
                        <Progress
                          percent={Math.round(rate)}
                          size="small"
                          status={rate > 100 ? 'exception' : rate > 80 ? 'active' : 'normal'}
                        />
                      );
                    },
                  },
                ]}
                dataSource={selectedYearAllocations.filter(allocation => 
                  allocation.budgetId === selectedBudget.id
                )}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          </div>
        )}
      </Drawer>

      {/* 浮动按钮 */}
      {selectedYear === fiscalYear && (
        <FloatButton.Group
          trigger="hover"
          type="primary"
          style={{ right: 24 }}
          icon={<PlusOutlined />}
        >
          <FloatButton
            icon={<PlusOutlined />}
            tooltip="创建预算"
            onClick={handleCreateBudget}
          />
          <FloatButton
            icon={<CopyOutlined />}
            tooltip="使用模板"
            onClick={() => setIsTemplateModalVisible(true)}
          />
          <FloatButton
            icon={<BulbOutlined />}
            tooltip="快速指南"
            onClick={() => message.info('快速指南功能正在开发中')}
          />
        </FloatButton.Group>
      )}
    </div>
  );
};

export default AnnualBudgetManagement;
