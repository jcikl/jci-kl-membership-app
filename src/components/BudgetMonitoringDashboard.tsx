import React, { useState, useEffect } from 'react';
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
} from 'antd';
import {
  BarChartOutlined,
  DollarOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
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
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <BarChartOutlined style={{ marginRight: 8 }} />
              {selectedYear}年预算监控仪表板
            </Title>
            <Text type="secondary">
              实时监控预算执行情况和绩效表现
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
              <Select
                value={selectedBudget}
                onChange={setSelectedBudget}
                style={{ width: 200 }}
                placeholder="选择预算项目"
              >
                <Option value="all">全部项目</Option>
                {selectedYearBudgets.map(budget => (
                  <Option key={budget.id} value={budget.id}>
                    {budget.projectName}
                  </Option>
                ))}
              </Select>
              <DatePicker
                picker="month"
                value={dayjs().month(selectedMonth - 1)}
                onChange={(date) => setSelectedMonth(date ? date.month() + 1 : new Date().getMonth() + 1)}
              />
            </Space>
          </Col>
        </Row>

        {/* 总体统计 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总预算"
                value={overallStats.totalBudgetAmount}
                prefix={<DollarOutlined />}
                formatter={(value) => value?.toLocaleString()}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已分配"
                value={overallStats.totalAllocatedAmount}
                prefix="RM"
                formatter={(value) => value?.toLocaleString()}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="已支出"
                value={overallStats.totalSpentAmount}
                prefix="RM"
                formatter={(value) => value?.toLocaleString()}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
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

        {/* 预算绩效表格 */}
        <Card title="预算绩效分析" style={{ marginBottom: 16 }}>
          <Table
            columns={performanceColumns}
            dataSource={budgetPerformance.filter(perf => 
              selectedBudget === 'all' || perf.budgetId === selectedBudget
            )}
            rowKey="budgetId"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            }}
          />
        </Card>

        {/* 月度趋势分析 */}
        <Card title="月度趋势分析">
          <Table
            columns={trendColumns}
            dataSource={monthlyTrends}
            rowKey="month"
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>

        {/* 预算预警 */}
        <Card title="预算预警" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Alert
                message="超支预警"
                description={`${budgetPerformance.filter(p => p.status === 'over-budget').length} 个项目超支`}
                type="error"
                icon={<ExclamationCircleOutlined />}
                showIcon
              />
            </Col>
            <Col span={8}>
              <Alert
                message="使用率预警"
                description={`${budgetPerformance.filter(p => p.utilizationRate > 80 && p.utilizationRate < 100).length} 个项目使用率超过80%`}
                type="warning"
                icon={<WarningOutlined />}
                showIcon
              />
            </Col>
            <Col span={8}>
              <Alert
                message="未充分使用"
                description={`${budgetPerformance.filter(p => p.status === 'under-budget').length} 个项目未充分使用预算`}
                type="info"
                icon={<ArrowDownOutlined />}
                showIcon
              />
            </Col>
          </Row>
        </Card>
      </Card>
    </div>
  );
};

export default BudgetMonitoringDashboard;
