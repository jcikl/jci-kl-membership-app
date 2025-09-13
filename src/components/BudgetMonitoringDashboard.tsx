import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Progress,
  Alert,
  Select,
  DatePicker,
  Tabs,
  Tooltip,
  Button,
  Empty,
  Divider,
  Timeline,
  List,
  Avatar,
  Badge,
} from 'antd';
import {
  BarChartOutlined,
  DollarOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined,
  DashboardOutlined,
  PieChartOutlined,
  LineChartOutlined,
  AlertOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  FilterOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { Budget, BudgetAllocation, Transaction } from '@/types/finance';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface BudgetMonitoringDashboardProps {
  budgets: Budget[];
  allocations: BudgetAllocation[];
  transactions: Transaction[];
  loading?: boolean;
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

interface MonthlyTrend {
  month: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
}

const BudgetMonitoringDashboard: React.FC<BudgetMonitoringDashboardProps> = ({
  budgets,
  allocations,
  transactions,
  loading = false,
}) => {
  const { fiscalYear, fiscalYearStartMonth } = useFiscalYear();
  
  // 状态管理
  const [selectedBudget, setSelectedBudget] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [budgetPerformance, setBudgetPerformance] = useState<BudgetPerformance[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(fiscalYear);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewPeriod, setViewPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  // 获取选中年度预算
  const selectedYearBudgets = budgets.filter(budget => budget.budgetYear === selectedYear);
  const selectedYearAllocations = allocations.filter(allocation => 
    selectedYearBudgets.some(budget => budget.id === allocation.budgetId)
  );
  const selectedYearTransactions = transactions.filter(transaction => 
    transaction.auditYear === selectedYear
  );

  // 获取所有可用年份
  const availableYears = Array.from(new Set(budgets.map(budget => budget.budgetYear)))
    .sort((a, b) => b - a); // 按年份降序排列

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

  // 计算月度趋势
  const calculateMonthlyTrends = (): MonthlyTrend[] => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      const month = ((fiscalYearStartMonth - 1 + i) % 12) + 1;
      const year = fiscalYearStartMonth > month ? fiscalYear + 1 : fiscalYear;
      
      const monthTransactions = selectedYearTransactions.filter(transaction => {
        const transactionDate = dayjs(transaction.transactionDate);
        return transactionDate.month() + 1 === month && transactionDate.year() === year;
      });
      
      const actualAmount = monthTransactions.reduce((sum, transaction) => 
        sum + transaction.expense, 0
      );
      
      // 计算该月的预算金额（简单平均分配）
      const budgetedAmount = selectedYearBudgets.reduce((sum, budget) => 
        sum + (budget.totalBudget / 12), 0
      );
      
      months.push({
        month: `${year}-${month.toString().padStart(2, '0')}`,
        budgetedAmount,
        actualAmount,
        variance: actualAmount - budgetedAmount,
      });
    }
    
    return months;
  };

  useEffect(() => {
    setBudgetPerformance(calculateBudgetPerformance());
    setMonthlyTrends(calculateMonthlyTrends());
  }, [budgets, allocations, transactions, fiscalYear, selectedYear]);

  // 预算健康度评估
  const budgetHealthScore = useMemo(() => {
    if (budgetPerformance.length === 0) return 0;
    
    const scores = budgetPerformance.map(perf => {
      let score = 100;
      
      // 超支扣分
      if (perf.variance > 0) {
        score -= Math.min(perf.variancePercentage * 2, 50);
      }
      
      // 使用率过低扣分
      if (perf.utilizationRate < 20) {
        score -= 30;
      }
      
      // 使用率过高扣分
      if (perf.utilizationRate > 90) {
        score -= 20;
      }
      
      return Math.max(score, 0);
    });
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [budgetPerformance]);

  // 预警项目
  const alertBudgets = useMemo(() => {
    return budgetPerformance.filter(perf => 
      perf.status === 'over-budget' || 
      (perf.utilizationRate > 80 && perf.utilizationRate < 100) ||
      perf.utilizationRate < 20
    );
  }, [budgetPerformance]);

  // 趋势分析
  const trendAnalysis = useMemo(() => {
    const lastThreeMonths = monthlyTrends.slice(-3);
    if (lastThreeMonths.length < 2) return { trend: 'stable', change: 0 };
    
    const latest = lastThreeMonths[lastThreeMonths.length - 1];
    const previous = lastThreeMonths[lastThreeMonths.length - 2];
    
    const change = ((latest.actualAmount - previous.actualAmount) / previous.actualAmount) * 100;
    
    return {
      trend: change > 10 ? 'increasing' : change < -10 ? 'decreasing' : 'stable',
      change: Math.round(change)
    };
  }, [monthlyTrends]);

  // 刷新数据
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // 重新计算数据
      setBudgetPerformance(calculateBudgetPerformance());
      setMonthlyTrends(calculateMonthlyTrends());
    } finally {
      setIsRefreshing(false);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const colors = {
      'on-track': 'success',
      'over-budget': 'error',
      'under-budget': 'warning',
      'completed': 'success',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'on-track': '正常',
      'over-budget': '超支',
      'under-budget': '未充分使用',
      'completed': '已完成',
    };
    return texts[status];
  };

  // 获取状态图标
  const getStatusIcon = (status: string) => {
    const icons: Record<string, React.ReactElement> = {
      'on-track': <CheckCircleOutlined />,
      'over-budget': <ExclamationCircleOutlined />,
      'under-budget': <WarningOutlined />,
      'completed': <CheckCircleOutlined />,
    };
    return icons[status];
  };

  // 计算总体统计
  const overallStats = {
    totalBudgets: selectedYearBudgets.length,
    totalBudgetAmount: selectedYearBudgets.reduce((sum, budget) => sum + budget.totalBudget, 0),
    totalAllocatedAmount: selectedYearAllocations.reduce((sum, allocation) => sum + allocation.allocatedAmount, 0),
    totalSpentAmount: selectedYearAllocations.reduce((sum, allocation) => sum + allocation.spentAmount, 0),
    totalRemainingAmount: selectedYearBudgets.reduce((sum, budget) => sum + budget.remainingAmount, 0),
    averageUtilizationRate: budgetPerformance.length > 0 
      ? budgetPerformance.reduce((sum, perf) => sum + perf.utilizationRate, 0) / budgetPerformance.length 
      : 0,
  };

  // 预算绩效列定义
  const performanceColumns = [
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '总预算',
      dataIndex: 'totalBudget',
      key: 'totalBudget',
      render: (amount: number) => `RM ${amount.toLocaleString()}`,
      sorter: (a: BudgetPerformance, b: BudgetPerformance) => a.totalBudget - b.totalBudget,
    },
    {
      title: '已分配',
      dataIndex: 'allocatedAmount',
      key: 'allocatedAmount',
      render: (amount: number, record: BudgetPerformance) => (
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
      render: (amount: number, record: BudgetPerformance) => (
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
      title: '使用率',
      dataIndex: 'utilizationRate',
      key: 'utilizationRate',
      render: (rate: number) => (
        <div>
          <Text>{rate.toFixed(1)}%</Text>
          <br />
          <Progress 
            percent={rate} 
            size="small" 
            showInfo={false}
            strokeColor={rate > 100 ? '#ff4d4f' : rate > 80 ? '#faad14' : '#52c41a'}
          />
        </div>
      ),
      sorter: (a: BudgetPerformance, b: BudgetPerformance) => a.utilizationRate - b.utilizationRate,
    },
    {
      title: '差异',
      dataIndex: 'variance',
      key: 'variance',
      render: (variance: number, record: BudgetPerformance) => (
        <div>
          <Text type={variance > 0 ? 'danger' : 'success'}>
            RM {variance.toLocaleString()}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ({record.variancePercentage.toFixed(1)}%)
          </Text>
        </div>
      ),
      sorter: (a: BudgetPerformance, b: BudgetPerformance) => a.variance - b.variance,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
  ];

  // 月度趋势列定义
  const trendColumns = [
    {
      title: '月份',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: '预算金额',
      dataIndex: 'budgetedAmount',
      key: 'budgetedAmount',
      render: (amount: number) => `RM ${amount.toLocaleString()}`,
    },
    {
      title: '实际金额',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      render: (amount: number) => `RM ${amount.toLocaleString()}`,
    },
    {
      title: '差异',
      dataIndex: 'variance',
      key: 'variance',
      render: (variance: number) => (
        <Text type={variance > 0 ? 'danger' : 'success'}>
          RM {variance.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '差异率',
      key: 'varianceRate',
      render: (_: any, record: MonthlyTrend) => {
        const rate = (record.variance / record.budgetedAmount) * 100;
        return (
          <Text type={rate > 0 ? 'danger' : 'success'}>
            {rate.toFixed(1)}%
          </Text>
        );
      },
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
                  <DashboardOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  {selectedYear}年预算监控仪表板
                </Title>
                <Text type="secondary">
                  实时监控预算执行情况和绩效表现，确保财务健康运行
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
                value={selectedBudget}
                onChange={setSelectedBudget}
                style={{ width: 200 }}
                placeholder="选择预算项目"
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">全部项目</Option>
                {selectedYearBudgets.map(budget => (
                  <Option key={budget.id} value={budget.id}>
                    {budget.projectName}
                  </Option>
                ))}
              </Select>
              <Select
                value={viewPeriod}
                onChange={setViewPeriod}
                style={{ width: 100 }}
              >
                <Option value="month">月度</Option>
                <Option value="quarter">季度</Option>
                <Option value="year">年度</Option>
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

      {/* 健康度评分卡 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: budgetHealthScore >= 80 ? '#52c41a' : budgetHealthScore >= 60 ? '#faad14' : '#ff4d4f' }}>
                {budgetHealthScore}
              </div>
              <Text type="secondary">预算健康度</Text>
              <div style={{ marginTop: 8 }}>
                <Progress
                  percent={budgetHealthScore}
                  size="small"
                  strokeColor={budgetHealthScore >= 80 ? '#52c41a' : budgetHealthScore >= 60 ? '#faad14' : '#ff4d4f'}
                  showInfo={false}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#1890ff' }}>
                {trendAnalysis.trend === 'increasing' ? <TrendingUpOutlined /> : 
                 trendAnalysis.trend === 'decreasing' ? <TrendingDownOutlined /> : 
                 <BarChartOutlined />}
                <span style={{ marginLeft: 8, fontSize: '18px', fontWeight: 'bold' }}>
                  {Math.abs(trendAnalysis.change)}%
                </span>
              </div>
              <Text type="secondary">支出趋势</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={trendAnalysis.trend === 'increasing' ? 'red' : trendAnalysis.trend === 'decreasing' ? 'green' : 'blue'}>
                  {trendAnalysis.trend === 'increasing' ? '上升' : trendAnalysis.trend === 'decreasing' ? '下降' : '稳定'}
                </Tag>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#ff4d4f' }}>
                <AlertOutlined />
                <span style={{ marginLeft: 8, fontSize: '18px', fontWeight: 'bold' }}>
                  {alertBudgets.length}
                </span>
              </div>
              <Text type="secondary">预警项目</Text>
              <div style={{ marginTop: 8 }}>
                <Badge 
                  count={alertBudgets.length} 
                  style={{ backgroundColor: alertBudgets.length > 0 ? '#ff4d4f' : '#52c41a' }}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', color: '#52c41a' }}>
                <CheckCircleOutlined />
                <span style={{ marginLeft: 8, fontSize: '18px', fontWeight: 'bold' }}>
                  {budgetPerformance.filter(p => p.status === 'on-track').length}
                </span>
              </div>
              <Text type="secondary">正常项目</Text>
              <div style={{ marginTop: 8 }}>
                <Text type="success">运行良好</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 总体统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总预算"
              value={overallStats.totalBudgetAmount}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已分配"
              value={overallStats.totalAllocatedAmount}
              prefix="RM"
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已支出"
              value={overallStats.totalSpentAmount}
              prefix="RM"
              formatter={(value) => value?.toLocaleString()}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均使用率"
              value={overallStats.averageUtilizationRate}
              suffix="%"
              precision={1}
              valueStyle={{ 
                color: overallStats.averageUtilizationRate > 80 ? '#faad14' : '#52c41a' 
              }}
            />
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
        >
          <Tabs.TabPane
            tab={
              <Space>
                <PieChartOutlined />
                预算绩效
                <Badge count={budgetPerformance.length} showZero />
              </Space>
            }
            key="overview"
          >
            {budgetPerformance.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无预算数据"
              />
            ) : (
              <Table
                columns={performanceColumns}
                dataSource={budgetPerformance.filter(perf => 
                  selectedBudget === 'all' || perf.budgetId === selectedBudget
                )}
                rowKey="budgetId"
                loading={loading}
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
                rowClassName={(record) => {
                  if (record.status === 'over-budget') return 'budget-row-danger';
                  if (record.utilizationRate > 80) return 'budget-row-warning';
                  return '';
                }}
              />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <LineChartOutlined />
                趋势分析
                <Badge count={monthlyTrends.length} showZero />
              </Space>
            }
            key="trends"
          >
            <Table
              columns={trendColumns}
              dataSource={monthlyTrends}
              rowKey="month"
              loading={loading}
              pagination={false}
              size="small"
            />
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <AlertOutlined />
                预算预警
                <Badge count={alertBudgets.length} status={alertBudgets.length > 0 ? 'error' : 'success'} />
              </Space>
            }
            key="alerts"
          >
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={8}>
                <Alert
                  message="超支预警"
                  description={`${budgetPerformance.filter(p => p.status === 'over-budget').length} 个项目超支`}
                  type="error"
                  icon={<ExclamationCircleOutlined />}
                  showIcon
                  style={{ height: '100%' }}
                />
              </Col>
              <Col span={8}>
                <Alert
                  message="使用率预警"
                  description={`${budgetPerformance.filter(p => p.utilizationRate > 80 && p.utilizationRate < 100).length} 个项目使用率超过80%`}
                  type="warning"
                  icon={<WarningOutlined />}
                  showIcon
                  style={{ height: '100%' }}
                />
              </Col>
              <Col span={8}>
                <Alert
                  message="未充分使用"
                  description={`${budgetPerformance.filter(p => p.status === 'under-budget').length} 个项目未充分使用预算`}
                  type="info"
                  icon={<ArrowDownOutlined />}
                  showIcon
                  style={{ height: '100%' }}
                />
              </Col>
            </Row>

            {alertBudgets.length > 0 ? (
              <Card title="预警详情" style={{ marginTop: 16 }}>
                <List
                  itemLayout="horizontal"
                  dataSource={alertBudgets}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button type="link" size="small">
                          查看详情
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            style={{ 
                              backgroundColor: item.status === 'over-budget' ? '#ff4d4f' : 
                                              item.utilizationRate > 80 ? '#faad14' : '#1890ff' 
                            }}
                            icon={
                              item.status === 'over-budget' ? <ExclamationCircleOutlined /> :
                              item.utilizationRate > 80 ? <WarningOutlined /> : <InfoCircleOutlined />
                            }
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{item.projectName}</Text>
                            <Tag color={getStatusColor(item.status)}>
                              {getStatusText(item.status)}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <Text type="secondary">
                              使用率: {item.utilizationRate.toFixed(1)}% | 
                              差异: RM {item.variance.toLocaleString()} ({item.variancePercentage.toFixed(1)}%)
                            </Text>
                            <br />
                            <Progress
                              percent={Math.min(item.utilizationRate, 100)}
                              size="small"
                              status={item.utilizationRate > 100 ? 'exception' : item.utilizationRate > 80 ? 'active' : 'normal'}
                              showInfo={false}
                            />
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无预警项目"
              >
                <Text type="secondary">所有预算项目运行正常</Text>
              </Empty>
            )}
          </Tabs.TabPane>

          <Tabs.TabPane
            tab={
              <Space>
                <InfoCircleOutlined />
                健康报告
              </Space>
            }
            key="health"
          >
            <Row gutter={16}>
              <Col span={12}>
                <Card title="预算健康度分析" style={{ height: '400px' }}>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Progress
                      type="circle"
                      percent={budgetHealthScore}
                      format={(percent) => `${percent}分`}
                      strokeColor={budgetHealthScore >= 80 ? '#52c41a' : budgetHealthScore >= 60 ? '#faad14' : '#ff4d4f'}
                      size={120}
                    />
                  </div>
                  <Divider />
                  <div>
                    <Text strong>健康度评级：</Text>
                    <Tag color={budgetHealthScore >= 80 ? 'success' : budgetHealthScore >= 60 ? 'warning' : 'error'}>
                      {budgetHealthScore >= 80 ? '优秀' : budgetHealthScore >= 60 ? '良好' : '需改进'}
                    </Tag>
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">
                      评分标准：超支情况、使用率合理性、预算执行效率等综合评估
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="改进建议" style={{ height: '400px' }}>
                  <Timeline>
                    {budgetHealthScore < 80 && (
                      <Timeline.Item color="red" dot={<ExclamationCircleOutlined />}>
                        <Text strong>优先处理超支项目</Text>
                        <br />
                        <Text type="secondary">
                          关注预算超支的项目，分析原因并采取控制措施
                        </Text>
                      </Timeline.Item>
                    )}
                    {budgetPerformance.filter(p => p.utilizationRate < 20).length > 0 && (
                      <Timeline.Item color="orange" dot={<WarningOutlined />}>
                        <Text strong>激活低使用率预算</Text>
                        <br />
                        <Text type="secondary">
                          检查使用率过低的预算项目，考虑重新分配资源
                        </Text>
                      </Timeline.Item>
                    )}
                    {trendAnalysis.trend === 'increasing' && (
                      <Timeline.Item color="blue" dot={<TrendingUpOutlined />}>
                        <Text strong>监控支出增长趋势</Text>
                        <br />
                        <Text type="secondary">
                          支出呈上升趋势，建议加强成本控制和预算监督
                        </Text>
                      </Timeline.Item>
                    )}
                    <Timeline.Item color="green" dot={<CheckCircleOutlined />}>
                      <Text strong>定期审查预算执行</Text>
                      <br />
                      <Text type="secondary">
                        建议每月定期审查预算执行情况，及时调整策略
                      </Text>
                    </Timeline.Item>
                  </Timeline>
                </Card>
              </Col>
            </Row>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default BudgetMonitoringDashboard;
