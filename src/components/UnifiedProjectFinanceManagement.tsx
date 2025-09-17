import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  InputNumber,
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
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DollarOutlined,
  CalendarOutlined,
  FundOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import {
  ProjectAccount,
  ProjectAccountCreateData,
  ProjectAccountUpdateData,
  Event,
  EventStatus,
} from '@/types/event';
import {
  Transaction,
} from '@/types/finance';
import { projectAccountService } from '@/services/projectAccountService';
import { eventService } from '@/services/eventService';
import { transactionService } from '@/services/financeService';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface UnifiedProjectFinanceManagementProps {
  mode: 'activity' | 'finance'; // 活动管理模式或财务管理模式
  selectedYear?: number;
  selectedMonth?: number | null;
  onTransactionSync?: (projectId: string, transactions: Transaction[]) => void;
  onVerificationRequest?: (projectId: string, verificationData: any) => void;
}

interface ProjectFinanceSummary {
  projectId: string;
  projectName: string;
  totalBudget: number;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  budgetUtilization: number;
  transactionCount: number;
  lastSyncDate?: string;
  verificationStatus: 'pending' | 'verified' | 'discrepancy';
}

const UnifiedProjectFinanceManagement: React.FC<UnifiedProjectFinanceManagementProps> = ({
  mode,
  selectedYear,
  selectedMonth: _selectedMonth,
  onTransactionSync,
  onVerificationRequest,
}) => {
  const [accounts, setAccounts] = useState<ProjectAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<ProjectAccount | null>(null);
  const [accountEvents, setAccountEvents] = useState<Event[]>([]);
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>([]);
  const [accountStatistics, setAccountStatistics] = useState<any>(null);
  const [projectFinanceSummary, setProjectFinanceSummary] = useState<ProjectFinanceSummary[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isFinanceDetailModalVisible, setIsFinanceDetailModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [activeTab, setActiveTab] = useState('overview');
  const [form] = Form.useForm();

  useEffect(() => {
    loadAccounts();
  }, [selectedYear]);

  useEffect(() => {
    if (accounts.length > 0) {
      loadProjectFinanceSummary();
    }
  }, [accounts]);

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

  const loadProjectFinanceSummary = async () => {
    try {
      const summaryData: ProjectFinanceSummary[] = [];
      
      for (const account of accounts) {
        // 获取项目相关活动
        await eventService.getEventsByProjectAccount(account.id);
        
        // 获取项目相关交易记录
        const transactions = await transactionService.getTransactions();
        
        // 计算财务汇总
        const totalIncome = transactions.reduce((sum, t) => sum + (t.income || 0), 0);
        const totalExpense = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
        const netIncome = totalIncome - totalExpense;
        const budgetUtilization = account.budget > 0 ? (totalExpense / account.budget) * 100 : 0;
        
        summaryData.push({
          projectId: account.id,
          projectName: account.name,
          totalBudget: account.budget,
          totalIncome,
          totalExpense,
          netIncome,
          budgetUtilization,
          transactionCount: transactions.length,
          lastSyncDate: transactions.length > 0 ? 
            transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())[0].transactionDate : undefined,
          verificationStatus: 'pending', // 默认状态，实际应从数据库获取
        });
      }
      
      setProjectFinanceSummary(summaryData);
    } catch (error) {
      console.error('加载项目财务汇总失败:', error);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (account: ProjectAccount) => {
    setSelectedAccount(account);
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

  const handleCreateAccount = async (values: any) => {
    try {
      const accountData: ProjectAccountCreateData = {
        name: values.name,
        description: values.description || '',
        budget: values.budget,
        currency: 'MYR',
        responsiblePerson: values.responsiblePerson || '',
        responsiblePersonEmail: values.responsiblePersonEmail || '',
      };

      await projectAccountService.createProjectAccount(accountData, 'current-user-id');
      message.success('项目户口创建成功');
      setIsModalVisible(false);
      form.resetFields();
      loadAccounts();
    } catch (error) {
      console.error('创建项目户口失败:', error);
      message.error('创建项目户口失败');
    }
  };

  const handleUpdateAccount = async (values: any) => {
    try {
      if (!selectedAccount) return;

      const updateData: ProjectAccountUpdateData = {
        id: selectedAccount.id,
        name: values.name,
        description: values.description || '',
        budget: values.budget,
        currency: 'MYR',
        responsiblePerson: values.responsiblePerson || '',
        responsiblePersonEmail: values.responsiblePersonEmail || '',
        status: values.status,
      };

      await projectAccountService.updateProjectAccount(selectedAccount.id, updateData, 'current-user-id');
      message.success('项目户口更新成功');
      setIsModalVisible(false);
      form.resetFields();
      loadAccounts();
    } catch (error) {
      console.error('更新项目户口失败:', error);
      message.error('更新项目户口失败');
    }
  };

  const handleViewFinanceDetail = async (account: ProjectAccount) => {
    setSelectedAccount(account);
    
    // 加载项目相关数据
    try {
      const [events, allTransactions] = await Promise.all([
        eventService.getEventsByProjectAccount(account.id),
        transactionService.getTransactions(),
      ]);
      
      // 筛选与该项目相关的交易记录
      const projectTransactions = allTransactions.filter(transaction => 
        transaction.projectAccount === account.id || 
        transaction.projectAccount === account.name
      );
      
      setAccountEvents(events);
      setAccountTransactions(projectTransactions);
      
      // 计算收入分类统计
      const incomeByPurpose = projectTransactions
        .filter(t => t.income > 0)
        .reduce((acc, t) => {
          const purpose = t.transactionPurpose || '未分类';
          acc[purpose] = (acc[purpose] || 0) + t.income;
          return acc;
        }, {} as Record<string, number>);

      // 计算支出分类统计
      const expenseByPurpose = projectTransactions
        .filter(t => t.expense > 0)
        .reduce((acc, t) => {
          const purpose = t.transactionPurpose || '未分类';
          acc[purpose] = (acc[purpose] || 0) + t.expense;
          return acc;
        }, {} as Record<string, number>);

      // 计算统计信息
      const stats = {
        totalEvents: events.length,
        totalTransactions: projectTransactions.length,
        totalIncome: projectTransactions.reduce((sum, t) => sum + (t.income || 0), 0),
        totalExpense: projectTransactions.reduce((sum, t) => sum + (t.expense || 0), 0),
        budgetRemaining: account.budget - projectTransactions.reduce((sum, t) => sum + (t.expense || 0), 0),
        budgetUtilization: account.budget > 0 ? 
          (projectTransactions.reduce((sum, t) => sum + (t.expense || 0), 0) / account.budget) * 100 : 0,
        netIncome: projectTransactions.reduce((sum, t) => sum + (t.income || 0), 0) - 
                   projectTransactions.reduce((sum, t) => sum + (t.expense || 0), 0),
        averageTransactionAmount: projectTransactions.length > 0 ? 
          projectTransactions.reduce((sum, t) => sum + (t.income || 0) + (t.expense || 0), 0) / projectTransactions.length : 0,
        incomeByPurpose,
        expenseByPurpose,
      };
      
      setAccountStatistics(stats);
      setIsFinanceDetailModalVisible(true);
    } catch (error) {
      console.error('加载项目财务详情失败:', error);
      message.error('加载项目财务详情失败');
    }
  };

  const handleSyncTransactions = async (projectId: string) => {
    try {
      // 获取项目相关活动
      const events = await eventService.getEventsByProjectAccount(projectId);
      
      // 自动提取活动相关交易记录
      const allTransactions: Transaction[] = [];
      
      for (const _event of events) {
        // 根据活动信息查找相关交易记录
        const eventTransactions = await transactionService.getTransactions();
        allTransactions.push(...eventTransactions);
      }
      
      // 调用同步回调
      if (onTransactionSync) {
        onTransactionSync(projectId, allTransactions);
      }
      
      message.success(`成功同步 ${allTransactions.length} 笔交易记录`);
      
      // 重新加载数据
      loadProjectFinanceSummary();
    } catch (error) {
      console.error('同步交易记录失败:', error);
      message.error('同步交易记录失败');
    }
  };

  const handleRequestVerification = (projectId: string) => {
    const project = projectFinanceSummary.find(p => p.projectId === projectId);
    if (!project) return;
    
    if (onVerificationRequest) {
      onVerificationRequest(projectId, {
        projectName: project.projectName,
        totalIncome: project.totalIncome,
        totalExpense: project.totalExpense,
        netIncome: project.netIncome,
        transactionCount: project.transactionCount,
        lastSyncDate: project.lastSyncDate,
      });
    }
    
    message.success('已提交财政长核对申请');
  };

  // 筛选逻辑
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = !searchText || 
      account.name.toLowerCase().includes(searchText.toLowerCase()) ||
      account.description.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = !statusFilter || account.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // 表格列定义
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: ProjectAccount) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: '预算金额',
      dataIndex: 'budget',
      key: 'budget',
      width: 120,
      render: (amount: number) => (
        <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
          {amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '财务汇总',
      key: 'financeSummary',
      width: 200,
      render: (_: any, record: ProjectAccount) => {
        const summary = projectFinanceSummary.find(s => s.projectId === record.id);
        if (!summary) return '-';
        
        return (
          <div>
            <div>
              <Text style={{ color: '#52c41a', fontSize: '12px' }}>
                收入: RM {summary.totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </Text>
            </div>
            <div>
              <Text style={{ color: '#ff4d4f', fontSize: '12px' }}>
                支出: RM {summary.totalExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </Text>
            </div>
            <div>
              <Text style={{ 
                color: summary.netIncome >= 0 ? '#52c41a' : '#ff4d4f',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                净收入: RM {summary.netIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </Text>
            </div>
          </div>
        );
      },
    },
    {
      title: '预算使用率',
      key: 'budgetUtilization',
      width: 150,
      render: (_: any, record: ProjectAccount) => {
        const summary = projectFinanceSummary.find(s => s.projectId === record.id);
        if (!summary) return '-';
        
        const utilization = summary.budgetUtilization;
        const status = utilization > 100 ? 'exception' : utilization > 80 ? 'warning' : 'success';
        
        return (
          <div>
            <Progress 
              percent={Math.round(utilization)} 
              size="small" 
              status={status === 'warning' ? 'exception' : status}
              strokeColor={status === 'exception' ? '#ff4d4f' : status === 'warning' ? '#faad14' : '#52c41a'}
            />
            <Text style={{ fontSize: '12px', color: '#666' }}>
              {utilization.toFixed(1)}%
            </Text>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'green', text: '活跃' },
          inactive: { color: 'orange', text: '停用' },
          completed: { color: 'blue', text: '已完成' },
        };
        
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: mode === 'activity' ? 200 : 250,
      render: (_: any, record: ProjectAccount) => (
        <Space size="small">
          <Tooltip title="查看财务详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewFinanceDetail(record)}
            />
          </Tooltip>
          
          {mode === 'activity' && (
            <>
              <Tooltip title="同步交易记录">
                <Button
                  type="link"
                  icon={<SyncOutlined />}
                  onClick={() => handleSyncTransactions(record.id)}
                />
              </Tooltip>
              
              <Tooltip title="提交核对申请">
                <Button
                  type="link"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleRequestVerification(record.id)}
                />
              </Tooltip>
            </>
          )}
          
          {mode === 'finance' && (
            <>
              <Tooltip title="编辑项目">
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
              
              <Popconfirm
                title="确定要删除这个项目户口吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="删除项目">
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  // 财务详情模态框内容
  const renderFinanceDetailModal = () => {
    if (!selectedAccount || !accountStatistics) return null;

    const tabItems = [
      {
        key: 'overview',
        label: '财务概览',
        icon: <BarChartOutlined />,
        children: (
          <div>
            {/* 基本财务统计 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={6}>
                <Statistic
                title="总预算"
                value={selectedAccount.budget}
                valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="总收入"
                  value={accountStatistics.totalIncome}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="总支出"
                  value={accountStatistics.totalExpense}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="净收入"
                  value={accountStatistics.netIncome}
                  valueStyle={{ 
                    color: accountStatistics.netIncome >= 0 ? '#52c41a' : '#ff4d4f' 
                  }}
                />
              </Col>
            </Row>

            {/* 预算使用情况 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Statistic
                  title="预算剩余"
                  value={accountStatistics.budgetRemaining}
                  valueStyle={{ 
                    color: accountStatistics.budgetRemaining >= 0 ? '#52c41a' : '#ff4d4f' 
                  }}
                />
              </Col>
              <Col span={8}>
                <div>
                  <Text strong>预算使用率</Text>
                  <div style={{ marginTop: 8 }}>
                    <Progress
                      percent={Math.min(accountStatistics.budgetUtilization, 100)}
                      status={accountStatistics.budgetUtilization > 100 ? 'exception' : 
                              accountStatistics.budgetUtilization > 80 ? 'active' : 'success'}
                      strokeColor={accountStatistics.budgetUtilization > 100 ? '#ff4d4f' : 
                                   accountStatistics.budgetUtilization > 80 ? '#faad14' : '#52c41a'}
                    />
                    <Text style={{ fontSize: '12px', color: '#666' }}>
                      {accountStatistics.budgetUtilization.toFixed(1)}%
                    </Text>
                  </div>
                </div>
              </Col>
              <Col span={8}>
                <Statistic
                  title="平均交易金额"
                  value={accountStatistics.averageTransactionAmount}
                  precision={2}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>

            {/* 项目基本信息 */}
            <Card title="项目基本信息" size="small">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>负责人：</Text>
                  <Text>{selectedAccount.responsiblePerson || '未设置'}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>负责人邮箱：</Text>
                  <Text>{selectedAccount.responsiblePersonEmail || '未设置'}</Text>
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Text strong>项目状态：</Text>
                  <Tag color={selectedAccount.status === 'active' ? 'green' : 
                            selectedAccount.status === 'inactive' ? 'orange' : 'blue'}>
                    {selectedAccount.status === 'active' ? '活跃' : 
                     selectedAccount.status === 'inactive' ? '停用' : '已完成'}
                  </Tag>
                </Col>
              </Row>
              {selectedAccount.description && (
                <Row style={{ marginTop: 8 }}>
                  <Col span={24}>
                    <Text strong>项目描述：</Text>
                    <br />
                    <Text type="secondary">{selectedAccount.description}</Text>
                  </Col>
                </Row>
              )}
            </Card>
          </div>
        ),
      },
      {
        key: 'transactions',
        label: '交易记录',
        icon: <DollarOutlined />,
        children: (
          <div>
            {/* 交易记录统计 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="交易总数"
                  value={accountStatistics.totalTransactions}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="收入交易"
                  value={accountTransactions.filter(t => t.income > 0).length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="支出交易"
                  value={accountTransactions.filter(t => t.expense > 0).length}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="最大单笔"
                  value={Math.max(...accountTransactions.map(t => Math.max(t.income || 0, t.expense || 0)), 0)}
                  prefix="RM"
                  precision={2}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>

            {/* 收入分类统计 */}
            {Object.keys(accountStatistics.incomeByPurpose || {}).length > 0 && (
              <Card 
                title={
                  <Space>
                    <RiseOutlined style={{ color: '#52c41a' }} />
                    <span>收入分类统计</span>
                  </Space>
                } 
                size="small" 
                style={{ marginBottom: 16 }}
              >
                <Row gutter={16}>
                  {Object.entries(accountStatistics.incomeByPurpose || {})
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([purpose, amount], _index) => {
                      const percentage = accountStatistics.totalIncome > 0 ? 
                        (((amount as number) / accountStatistics.totalIncome) * 100).toFixed(1) : '0.0';
                      return (
                        <Col span={8} key={purpose} style={{ marginBottom: 8 }}>
                          <div style={{ 
                            padding: '12px 16px', 
                            background: '#f6ffed', 
                            border: '1px solid #b7eb8f', 
                            borderRadius: '8px',
                            position: 'relative'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>{purpose}</Text>
                              <Text style={{ color: '#52c41a', fontSize: '12px' }}>{percentage}%</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                           {(amount as number).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                         </Text>
                              <Progress
                                percent={parseFloat(percentage)}
                                size="small"
                                strokeColor="#52c41a"
                                showInfo={false}
                                style={{ width: 60 }}
                              />
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                </Row>
                <div style={{ marginTop: 16, textAlign: 'center', padding: '12px', background: '#f6ffed', borderRadius: '6px' }}>
                  <Space>
                    <RiseOutlined style={{ color: '#52c41a' }} />
               <Text strong style={{ color: '#52c41a' }}>
                 总收入: {accountStatistics.totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
               </Text>
                  </Space>
                </div>
              </Card>
            )}

            {/* 支出分类统计 */}
            {Object.keys(accountStatistics.expenseByPurpose || {}).length > 0 && (
              <Card 
                title={
                  <Space>
                    <FallOutlined style={{ color: '#ff4d4f' }} />
                    <span>支出分类统计</span>
                  </Space>
                } 
                size="small" 
                style={{ marginBottom: 16 }}
              >
                <Row gutter={16}>
                  {Object.entries(accountStatistics.expenseByPurpose || {})
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([purpose, amount], _index) => {
                      const percentage = accountStatistics.totalExpense > 0 ? 
                        (((amount as number) / accountStatistics.totalExpense) * 100).toFixed(1) : '0.0';
                      return (
                        <Col span={8} key={purpose} style={{ marginBottom: 8 }}>
                          <div style={{ 
                            padding: '12px 16px', 
                            background: '#fff2f0', 
                            border: '1px solid #ffccc7', 
                            borderRadius: '8px',
                            position: 'relative'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                              <Text strong style={{ color: '#ff4d4f', fontSize: '14px' }}>{purpose}</Text>
                              <Text style={{ color: '#ff4d4f', fontSize: '12px' }}>{percentage}%</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Text strong style={{ color: '#ff4d4f', fontSize: '16px' }}>
                           {(amount as number).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                         </Text>
                              <Progress
                                percent={parseFloat(percentage)}
                                size="small"
                                strokeColor="#ff4d4f"
                                showInfo={false}
                                style={{ width: 60 }}
                              />
                            </div>
                          </div>
                        </Col>
                      );
                    })}
                </Row>
                <div style={{ marginTop: 16, textAlign: 'center', padding: '12px', background: '#fff2f0', borderRadius: '6px' }}>
                  <Space>
                    <FallOutlined style={{ color: '#ff4d4f' }} />
               <Text strong style={{ color: '#ff4d4f' }}>
                 总支出: {accountStatistics.totalExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
               </Text>
                  </Space>
                </div>
              </Card>
            )}

            {/* 交易记录表格 */}
            <Table
              dataSource={accountTransactions}
              columns={[
                {
                  title: '日期',
                  dataIndex: 'transactionDate',
                  key: 'transactionDate',
                  width: 120,
                  sorter: (a: Transaction, b: Transaction) => 
                    new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime(),
                },
                {
                  title: '主描述',
                  dataIndex: 'mainDescription',
                  key: 'mainDescription',
                  width: 200,
                },
                {
                  title: '副描述',
                  dataIndex: 'subDescription',
                  key: 'subDescription',
                  width: 150,
                  render: (text: string) => text || '-',
                },
                {
                  title: '交易用途',
                  dataIndex: 'transactionPurpose',
                  key: 'transactionPurpose',
                  width: 120,
                  render: (text: string) => text || '-',
                },
                {
                  title: '收入',
                  dataIndex: 'income',
                  key: 'income',
                  width: 100,
                  align: 'right' as const,
                  render: (amount: number) => amount > 0 ? (
                    <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                      {amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </Text>
                  ) : '-',
                  sorter: (a: Transaction, b: Transaction) => (a.income || 0) - (b.income || 0),
                },
                {
                  title: '支出',
                  dataIndex: 'expense',
                  key: 'expense',
                  width: 100,
                  align: 'right' as const,
                  render: (amount: number) => amount > 0 ? (
                    <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                      {amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </Text>
                  ) : '-',
                  sorter: (a: Transaction, b: Transaction) => (a.expense || 0) - (b.expense || 0),
                },
                {
                  title: '付款人/收款人',
                  dataIndex: 'payerOrPayee',
                  key: 'payerOrPayee',
                  width: 120,
                  render: (text: string) => text || '-',
                },
                {
                  title: '输入人',
                  dataIndex: 'inputBy',
                  key: 'inputBy',
                  width: 100,
                  render: (text: string) => text || '-',
                },
              ]}
              pagination={{ 
                pageSize: 15,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
              size="small"
              scroll={{ x: 1000 }}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>交易汇总</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Text strong style={{ color: '#52c41a' }}>
                      {accountStatistics.totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    <Text strong style={{ color: '#ff4d4f' }}>
                      {accountStatistics.totalExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={6} colSpan={2} />
                </Table.Summary.Row>
              )}
            />
          </div>
        ),
      },
      {
        key: 'events',
        label: '相关活动',
        icon: <CalendarOutlined />,
        children: (
          <div>
            {/* 活动统计信息 */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Statistic
                  title="活动总数"
                  value={accountStatistics.totalEvents}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已完成活动"
                  value={accountEvents.filter(e => e.status === EventStatus.COMPLETED).length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="进行中活动"
                  value={accountEvents.filter(e => e.status === EventStatus.PUBLISHED).length}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="已发布活动"
                  value={accountEvents.filter(e => e.status === EventStatus.PUBLISHED).length}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>

            {/* 活动列表表格 */}
            <Table
              dataSource={accountEvents}
              columns={[
                {
                  title: '活动名称',
                  dataIndex: 'title',
                  key: 'title',
                  width: 200,
                  render: (text: string) => (
                    <Text strong>{text}</Text>
                  ),
                },
                {
                  title: '活动日期',
                  dataIndex: 'eventDate',
                  key: 'eventDate',
                  width: 120,
                  sorter: (a: Event, b: Event) => 
                    new Date(a.startDate.toDate()).getTime() - new Date(b.startDate.toDate()).getTime(),
                },
                {
                  title: '活动地点',
                  dataIndex: 'location',
                  key: 'location',
                  width: 150,
                  render: (text: string) => text || '-',
                },
                {
                  title: '参与人数',
                  dataIndex: 'participantCount',
                  key: 'participantCount',
                  width: 100,
                  render: (count: number) => count || '-',
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  width: 100,
                  render: (status: string) => {
                    const statusConfig = {
                      draft: { color: 'default', text: '草稿' },
                      published: { color: 'blue', text: '已发布' },
                      ongoing: { color: 'green', text: '进行中' },
                      completed: { color: 'purple', text: '已完成' },
                      cancelled: { color: 'red', text: '已取消' },
                    };
                    
                    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
                    return <Tag color={config.color}>{config.text}</Tag>;
                  },
                },
                {
                  title: '创建时间',
                  dataIndex: 'createdAt',
                  key: 'createdAt',
                  width: 120,
                  render: (date: string) => date ? new Date(date).toLocaleDateString('zh-CN') : '-',
                  sorter: (a: Event, b: Event) => 
                    new Date(a.createdAt?.toDate() || '').getTime() - new Date(b.createdAt?.toDate() || '').getTime(),
                },
              ]}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              }}
              size="small"
              scroll={{ x: 800 }}
            />
          </div>
        ),
      },
      {
        key: 'analysis',
        label: '财务分析',
        icon: <LineChartOutlined />,
        children: (
          <div>
            {/* 财务趋势分析 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card title="收支趋势" size="small">
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <PieChartOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                      <div style={{ marginTop: 16 }}>
                        <Text type="secondary">收支趋势图表</Text>
                        <br />
                        <Text type="secondary">总收入: RM {accountStatistics.totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</Text>
                        <br />
                        <Text type="secondary">总支出: RM {accountStatistics.totalExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="预算执行情况" size="small">
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <BarChartOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                      <div style={{ marginTop: 16 }}>
                        <Text type="secondary">预算执行分析</Text>
                        <br />
                        <Text type="secondary">预算使用率: {accountStatistics.budgetUtilization.toFixed(1)}%</Text>
                        <br />
                        <Text type="secondary">剩余预算: RM {accountStatistics.budgetRemaining.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</Text>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 财务健康度评估 */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card title="财务健康度评估" size="small">
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%', 
                          background: `conic-gradient(#52c41a 0deg ${accountStatistics.budgetUtilization * 3.6}deg, #f0f0f0 ${accountStatistics.budgetUtilization * 3.6}deg 360deg)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}>
                          <div style={{ 
                            width: 60, 
                            height: 60, 
                            borderRadius: '50%', 
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Text strong>{accountStatistics.budgetUtilization.toFixed(0)}%</Text>
                          </div>
                        </div>
                        <Text strong>预算使用率</Text>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%', 
                          background: `conic-gradient(#1890ff 0deg ${Math.min(accountStatistics.totalTransactions * 10, 360)}deg, #f0f0f0 ${Math.min(accountStatistics.totalTransactions * 10, 360)}deg 360deg)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}>
                          <div style={{ 
                            width: 60, 
                            height: 60, 
                            borderRadius: '50%', 
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Text strong>{accountStatistics.totalTransactions}</Text>
                          </div>
                        </div>
                        <Text strong>交易活跃度</Text>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ 
                          width: 80, 
                          height: 80, 
                          borderRadius: '50%', 
                          background: `conic-gradient(${accountStatistics.netIncome >= 0 ? '#52c41a' : '#ff4d4f'} 0deg 180deg, #f0f0f0 180deg 360deg)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}>
                          <div style={{ 
                            width: 60, 
                            height: 60, 
                            borderRadius: '50%', 
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Text strong style={{ color: accountStatistics.netIncome >= 0 ? '#52c41a' : '#ff4d4f' }}>
                              {accountStatistics.netIncome >= 0 ? '+' : ''}
                            </Text>
                          </div>
                        </div>
                        <Text strong>盈亏状况</Text>
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            {/* 关键指标汇总 */}
            <Card title="关键财务指标" size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginBottom: 8 }}>
                      RM {accountStatistics.totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </div>
                    <Text type="secondary">总收入</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f', marginBottom: 8 }}>
                      RM {accountStatistics.totalExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </div>
                    <Text type="secondary">总支出</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ 
                      fontSize: 24, 
                      fontWeight: 'bold', 
                      color: accountStatistics.netIncome >= 0 ? '#52c41a' : '#ff4d4f', 
                      marginBottom: 8 
                    }}>
                      RM {accountStatistics.netIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </div>
                    <Text type="secondary">净收入</Text>
                  </div>
                </Col>
                <Col span={6}>
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1', marginBottom: 8 }}>
                      {accountStatistics.totalTransactions}
                    </div>
                    <Text type="secondary">交易笔数</Text>
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        ),
      },
    ];

    return (
      <Modal
        title={
          <Space>
            <FundOutlined />
            <span>{selectedAccount.name} - 财务详情</span>
          </Space>
        }
        open={isFinanceDetailModalVisible}
        onCancel={() => setIsFinanceDetailModalVisible(false)}
        width={1200}
        footer={[
          <Button key="close" onClick={() => setIsFinanceDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Modal>
    );
  };

  return (
    <div>
      {/* 头部操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <FundOutlined style={{ marginRight: 8 }} />
              {mode === 'activity' ? '项目财务管理' : '项目财务监督'}
            </Title>
            <Text type="secondary">
              {mode === 'activity' 
                ? '管理项目财务，同步活动交易记录，提交财政长核对'
                : '监督项目财务状况，核对账目，管理项目预算'
              }
            </Text>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="搜索项目名称或描述"
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
              
              {mode === 'finance' && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreate}
                >
                  创建项目户口
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 模式说明 */}
      {mode === 'activity' && (
        <Alert
          message="活动管理模式"
          description="在此模式下，您可以查看项目财务汇总，同步活动相关交易记录，并提交财政长进行账目核对。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      
      {mode === 'finance' && (
        <Alert
          message="财务管理模式"
          description="在此模式下，您可以全面管理项目户口，监督项目财务状况，进行账目核对和预算管理。"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

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

      {/* 财务详情模态框 */}
      {renderFinanceDetailModal()}

      {/* 项目户口创建/编辑模态框 */}
      <Modal
        title={
          <Space>
            <FundOutlined />
            <span>{modalMode === 'create' ? '创建项目户口' : '编辑项目户口'}</span>
          </Space>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => {
          form.validateFields().then((values) => {
            if (modalMode === 'create') {
              handleCreateAccount(values);
            } else {
              handleUpdateAccount(values);
            }
          });
        }}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
        >
          <Form.Item
            name="name"
            label="项目名称"
            rules={[
              { required: true, message: '请输入项目名称' },
              { max: 100, message: '项目名称不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="项目描述"
            rules={[
              { max: 500, message: '项目描述不能超过500个字符' }
            ]}
          >
            <Input.TextArea 
              placeholder="请输入项目描述" 
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="budget"
            label="预算金额"
            rules={[
              { required: true, message: '请输入预算金额' },
              { type: 'number', min: 0, message: '预算金额必须大于等于0' }
            ]}
          >
            <InputNumber
              placeholder="请输入预算金额"
              style={{ width: '100%' }}
              formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/RM\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item
            name="responsiblePerson"
            label="负责人"
            rules={[
              { required: true, message: '请输入负责人姓名' },
              { max: 100, message: '负责人姓名不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入负责人姓名" />
          </Form.Item>

          <Form.Item
            name="responsiblePersonEmail"
            label="负责人邮箱"
            rules={[
              { required: true, message: '请输入负责人邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入负责人邮箱" />
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            rules={[
              { required: true, message: '请选择状态' }
            ]}
          >
            <Select placeholder="请选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">停用</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UnifiedProjectFinanceManagement;
