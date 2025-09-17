import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Typography,
  Tabs,
  Space,
  Button,
  message,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
} from 'antd';
import {
  DollarOutlined,
  BankOutlined,
  FileTextOutlined,
  FundOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import BankAccountManagement from '@/components/BankAccountManagement';
import TransactionManagement from '@/components/TransactionManagement';
import TransactionPurposeManagement from '@/components/TransactionPurposeManagement';
import IntegratedBudgetManagement from '@/components/IntegratedBudgetManagement';
import BillPaymentSystem from '@/components/BillPaymentSystem';
import FinancialReports from '@/components/FinancialReports';
import FinancialReportGenerator from '@/components/FinancialReportGenerator';
import ExpenseSplittingModal from '@/components/ExpenseSplittingModal';
import MembershipFeeManagement from '@/components/MembershipFeeManagement';
import UnifiedProjectFinanceManagement from '@/components/UnifiedProjectFinanceManagement';
import GlobalYearFilterModal from '@/components/GlobalYearFilterModal';
import { FinanceYearProvider, useFinanceYear } from '@/contexts/FinanceYearContext';
import dayjs from 'dayjs';
import {
  bankAccountService,
  transactionService,
  transactionPurposeService,
  budgetService,
  budgetAllocationService,
  billPaymentService,
  financialReportService,
} from '@/services/financeService';
import { financialReportService as newFinancialReportService } from '@/services/financialReportService';
import {
  BankAccount,
  Transaction,
  TransactionPurpose,
  Budget,
  BudgetAllocation,
  BillPaymentRequest,
  FinancialReport,
  FinancialReportType,
  FinancialImportData,
  ExpenseSplit,
} from '@/types/finance';

const { Title, Text } = Typography;
const { Content } = Layout;
const { Option } = Select;
const { RangePicker } = DatePicker;

const FinancePageContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  // 使用全局年份状态
  const { selectedYear, setSelectedYear, availableYears } = useFinanceYear();
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const { user } = useAuthStore();

  // 数据状态
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purposes, setPurposes] = useState<TransactionPurpose[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [billRequests, setBillRequests] = useState<BillPaymentRequest[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);

  // 统一的筛选功能
  const getFilteredTransactions = () => {
    let filtered = transactions;
    
    if (selectedYear) {
      filtered = filtered.filter(t => {
        const transactionYear = dayjs(t.transactionDate, 'DD-MMM-YYYY').year();
        return transactionYear === selectedYear;
      });
    }
    
    if (selectedMonth) {
      filtered = filtered.filter(t => {
        const transactionMonth = dayjs(t.transactionDate, 'DD-MMM-YYYY').month() + 1;
        return transactionMonth === selectedMonth;
      });
    }
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(t => {
        const transactionDate = dayjs(t.transactionDate, 'DD-MMM-YYYY');
        return transactionDate.isAfter(dateRange[0].subtract(1, 'day')) && 
               transactionDate.isBefore(dateRange[1].add(1, 'day'));
      });
    }
    
    return filtered;
  };
  
  const filteredTransactions = getFilteredTransactions();

  // 费用拆分模态框状态
  const [isExpenseSplittingVisible, setIsExpenseSplittingVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // 财务报表生成器模态框状态
  const [isFinancialReportGeneratorVisible, setIsFinancialReportGeneratorVisible] = useState(false);
  
  // 项目财务管理相关状态
  // const [projectFinanceVerifications, setProjectFinanceVerifications] = useState<any[]>([]);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [
        accountsData,
        transactionsData,
        purposesData,
        budgetsData,
        allocationsData,
        billRequestsData,
        reportsData,
      ] = await Promise.all([
        bankAccountService.getAccounts(),
        transactionService.getTransactions(),
        transactionPurposeService.getPurposes(),
        budgetService.getBudgets(),
        budgetAllocationService.getAllocations(),
        billPaymentService.getRequests(),
        financialReportService.getReports(),
      ]);

      setBankAccounts(accountsData);
      setTransactions(transactionsData);
      setPurposes(purposesData);
      setBudgets(budgetsData);
      setAllocations(allocationsData);
      setBillRequests(billRequestsData);
      setReports(reportsData);
    } catch (error) {
      console.error('数据加载失败:', error);
      message.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 刷新报告列表
  const handleRefreshReports = async () => {
    try {
      const reportsData = await financialReportService.getReports();
      setReports(reportsData);
    } catch (error) {
      console.error('刷新报告失败:', error);
      message.error('刷新报告失败');
    }
  };

  // 项目财务管理相关处理函数
  const handleProjectTransactionSync = async (projectId: string, transactions: Transaction[]) => {
    try {
      // 这里可以添加同步逻辑，比如更新交易记录的项目关联
      console.log(`同步项目 ${projectId} 的交易记录:`, transactions);
      message.success(`成功同步 ${transactions.length} 笔交易记录到项目财务`);
    } catch (error) {
      console.error('同步项目交易记录失败:', error);
      message.error('同步项目交易记录失败');
    }
  };

  const handleVerificationRequest = async (projectId: string, verificationData: any) => {
    try {
      // 这里可以添加验证请求处理逻辑
      console.log(`项目 ${projectId} 验证请求:`, verificationData);
      message.success('已提交财政长核对申请');
    } catch (error) {
      console.error('提交验证请求失败:', error);
      message.error('提交验证请求失败');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 银行户口管理
  const handleCreateAccount = async (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await bankAccountService.createAccount(account);
      await loadData();
    } catch (error) {
      console.error('创建银行户口失败:', error);
      throw error;
    }
  };

  const handleUpdateAccount = async (id: string, account: Partial<BankAccount>) => {
    try {
      await bankAccountService.updateAccount(id, account);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await bankAccountService.deleteAccount(id);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  // 交易记录管理
  const handleCreateTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await transactionService.createTransaction(transaction);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    try {
      await transactionService.updateTransaction(id, transaction);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionService.deleteTransaction(id);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteTransactions = async (ids: string[]) => {
    try {
      const result = await transactionService.deleteTransactions(ids);
      await loadData();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleImportTransactions = async (transactions: FinancialImportData[], _bankAccountId: string) => {
    try {
      // 转换 FinancialImportData 为 Transaction 格式
      const transactionData = transactions.map(t => {
        // 合并 payer 和 payee 字段到 payerPayee
        const payerPayee = [t.payer, t.payee].filter(Boolean).join(' / ') || '';
        
        return {
          bankAccountId: t.bankAccountId,
          transactionDate: t.transactionDate,
          mainDescription: t.mainDescription,
          subDescription: t.subDescription || '',
          expense: t.expense || 0,
          income: t.income || 0,
          payerPayee: payerPayee, // 使用合并字段
          transactionPurpose: t.transactionPurpose || '',
          projectAccount: t.projectAccount || '',
          accountType: t.accountType || '',
          inputBy: t.inputBy || '系统导入',
          paymentDescription: t.paymentDescription || '',
          transactionNumber: '', // 将在服务层自动生成
          // 兼容性字段，确保不为 undefined
          payer: t.payer || '',
          payee: t.payee || '',
        };
      });
      
      const result = await transactionService.createTransactions(transactionData);
      await loadData();
      return result;
    } catch (error) {
      console.error('交易记录导入失败:', error);
      throw error;
    }
  };

  // 交易用途管理
  const handleCreatePurpose = async (purpose: Omit<TransactionPurpose, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await transactionPurposeService.createPurpose(purpose);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdatePurpose = async (id: string, purpose: Partial<TransactionPurpose>) => {
    try {
      await transactionPurposeService.updatePurpose(id, purpose);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeletePurpose = async (id: string) => {
    try {
      await transactionPurposeService.deletePurpose(id);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  // 预算管理
  const handleCreateBudget = async (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await budgetService.createBudget(budget);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateBudget = async (id: string, budget: Partial<Budget>) => {
    try {
      await budgetService.updateBudget(id, budget);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteBudget = async (id: string) => {
    try {
      await budgetService.deleteBudget(id);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleCreateAllocation = async (allocation: Omit<BudgetAllocation, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await budgetAllocationService.createAllocation(allocation);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateAllocation = async (id: string, allocation: Partial<BudgetAllocation>) => {
    try {
      await budgetAllocationService.updateAllocation(id, allocation);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteAllocation = async (id: string) => {
    try {
      await budgetAllocationService.deleteAllocation(id);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  // 账单付款申请管理
  const handleCreateRequest = async (request: Omit<BillPaymentRequest, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await billPaymentService.createRequest(request);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateRequest = async (id: string, request: Partial<BillPaymentRequest>) => {
    try {
      await billPaymentService.updateRequest(id, request);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await billPaymentService.deleteRequest(id);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleApproveRequest = async (id: string, notes?: string) => {
    try {
      await billPaymentService.approveRequest(id, notes);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handleRejectRequest = async (id: string, notes?: string) => {
    try {
      await billPaymentService.rejectRequest(id, notes);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  const handlePayRequest = async (id: string) => {
    try {
      await billPaymentService.payRequest(id);
      await loadData();
    } catch (error) {
      throw error;
    }
  };

  // 财务报告管理
  const handleGenerateReport = async (reportType: FinancialReportType, _startDate: string, _endDate: string) => {
    try {
      const reportId = await newFinancialReportService.generateReport(
        reportType,
        selectedYear, // 使用当前选中的年份
        user?.uid || 'unknown-user',
        1 // 默认从1月开始
      );
      await loadData();
      
      // 返回完整的报表对象
      const reports = await newFinancialReportService.getReports();
      const report = reports.find(r => r.id === reportId);
      return report || { id: reportId } as FinancialReport;
    } catch (error) {
      throw error;
    }
  };

  const handleExportReport = async (reportId: string, format: 'pdf' | 'excel') => {
    try {
      const reports = await newFinancialReportService.getReports();
      const report = reports.find(r => r.id === reportId);
      if (report) {
        if (format === 'excel') {
          const blob = await newFinancialReportService.exportReportToExcel(report.data);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${report.reportName}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        } else {
          // PDF 导出需要额外的库支持，暂时使用 CSV
          const content = newFinancialReportService.exportReportToCSV(report.data);
          const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${report.reportName}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  // 费用拆分管理
  const handleSaveExpenseSplit = async (_transactionId: string, _splits: Omit<ExpenseSplit, 'id' | 'createdAt'>[]) => {
    try {
      // TODO: 实现费用拆分保存逻辑
      message.success('费用拆分保存成功');
    } catch (error) {
      throw error;
    }
  };

  // 计算财务概览（使用筛选后的数据）
  const totalIncome = filteredTransactions.reduce((sum, t) => sum + t.income, 0);
  const totalExpense = filteredTransactions.reduce((sum, t) => sum + t.expense, 0);
  const netIncome = totalIncome - totalExpense;
  const totalAccounts = bankAccounts.length;
  const activeAccounts = bankAccounts.filter(acc => acc.isActive).length;
  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const pendingRequests = billRequests.filter(r => r.status === 'pending').length;
  const approvedRequests = billRequests.filter(r => r.status === 'approved').length;

  const tabItems = [
    {
      key: 'overview',
      label: '财务概览',
      children: (
        <div>
          {/* 统一的筛选功能 */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={16} align="middle">
              <Col>
                <Space>
                  <FilterOutlined />
                  <Text strong>筛选条件：</Text>
                </Space>
              </Col>
              <Col>
                <GlobalYearFilterModal
                  value={selectedYear}
                  onChange={(year) => setSelectedYear(year || new Date().getFullYear())}
                  availableYears={availableYears}
                  placeholder="选择年份"
                  style={{ width: 120 }}
                />
              </Col>
              <Col>
                <Select
                  value={selectedMonth}
                  onChange={setSelectedMonth}
                  style={{ width: 120 }}
                  placeholder="选择月份"
                  allowClear
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    return (
                      <Option key={month} value={month}>
                        {month}月
                      </Option>
                    );
                  })}
                </Select>
              </Col>
              <Col>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                  style={{ width: 240 }}
                  placeholder={['开始日期', '结束日期']}
                />
              </Col>
              <Col>
                <Button 
                  onClick={() => {
                    setSelectedYear(new Date().getFullYear());
                    setSelectedMonth(null);
                    setDateRange(null);
                  }}
                >
                  重置筛选
                </Button>
              </Col>
            </Row>
          </Card>
          
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总收入"
                  value={totalIncome}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="总支出"
                  value={totalExpense}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="净收入"
                  value={netIncome}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: netIncome >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="银行余额"
                  value={totalBalance}
                  prefix={<BankOutlined />}
                  precision={2}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="银行户口"
                  value={totalAccounts}
                  suffix={`/ ${activeAccounts} 启用`}
                  prefix={<BankOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="待审批申请"
                  value={pendingRequests}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="已审批申请"
                  value={approvedRequests}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
          </Row>

        </div>
      ),
    },
    {
      key: 'accounts',
      label: '银行户口管理',
      children: (
        <BankAccountManagement
          onCreateAccount={handleCreateAccount}
          onUpdateAccount={handleUpdateAccount}
          onDeleteAccount={handleDeleteAccount}
          bankAccounts={bankAccounts}
          loading={loading}
        />
      ),
    },
    {
      key: 'transactions',
      label: '交易记录管理',
      children: (
        <TransactionManagement
          onCreateTransaction={handleCreateTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onDeleteTransactions={handleDeleteTransactions}
          onImportTransactions={handleImportTransactions}
          transactions={filteredTransactions}
          bankAccounts={bankAccounts}
          purposes={purposes}
          loading={loading}
        />
      ),
    },
    {
      key: 'membership-fees',
      label: '会费管理',
        children: (
          <MembershipFeeManagement
            onUpdateTransaction={handleUpdateTransaction}
            transactions={transactions}
            purposes={purposes}
            loading={loading}
          />
        ),
    },
    {
      key: 'purposes',
      label: '交易用途管理',
      children: (
        <TransactionPurposeManagement
          onCreatePurpose={handleCreatePurpose}
          onUpdatePurpose={handleUpdatePurpose}
          onDeletePurpose={handleDeletePurpose}
          purposes={purposes}
          loading={loading}
        />
      ),
    },
    {
      key: 'budgets',
      label: '预算管理',
      children: (
        <IntegratedBudgetManagement
          onCreateBudget={handleCreateBudget}
          onUpdateBudget={handleUpdateBudget}
          onDeleteBudget={handleDeleteBudget}
          onCreateAllocation={handleCreateAllocation}
          onUpdateAllocation={handleUpdateAllocation}
          onDeleteAllocation={handleDeleteAllocation}
          budgets={budgets}
          allocations={allocations}
          purposes={purposes}
          transactions={transactions}
          loading={loading}
        />
      ),
    },
    {
      key: 'bills',
      label: '账单付款申请',
      children: (
        <BillPaymentSystem
          onCreateRequest={handleCreateRequest}
          onUpdateRequest={handleUpdateRequest}
          onDeleteRequest={handleDeleteRequest}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onPayRequest={handlePayRequest}
          requests={billRequests}
          bankAccounts={bankAccounts}
          loading={loading}
          dateFilter={{
            year: selectedYear,
            month: selectedMonth
          }}
        />
      ),
    },
    {
      key: 'project-finance',
      label: '项目财务管理',
      icon: <FundOutlined />,
      children: (
        <UnifiedProjectFinanceManagement
          mode="finance"
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onTransactionSync={handleProjectTransactionSync}
          onVerificationRequest={handleVerificationRequest}
        />
      ),
    },
    {
      key: 'reports',
      label: '财务报告',
      children: (
        <div>
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => setIsFinancialReportGeneratorVisible(true)}
            >
              高级报表生成器
            </Button>
          </div>
           <FinancialReports
             onGenerateReport={handleGenerateReport}
             onExportReport={handleExportReport}
             onRefreshReports={handleRefreshReports}
             reports={reports}
             transactions={filteredTransactions}
             budgets={budgets}
             loading={loading}
           />
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>
            <DollarOutlined /> 财务管理系统
          </Title>
          <Text type='secondary'>
            JCI Kuala Lumpur 标准财务管理系统 - {selectedYear}年{selectedMonth ? `${selectedMonth}月` : ''}
          </Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />

        {/* 费用拆分模态框 */}
        <ExpenseSplittingModal
          visible={isExpenseSplittingVisible}
          onCancel={() => {
            setIsExpenseSplittingVisible(false);
            setSelectedTransaction(null);
          }}
          onSave={handleSaveExpenseSplit}
          transaction={selectedTransaction}
          purposes={purposes}
        />

        {/* 财务报表生成器模态框 */}
        <FinancialReportGenerator
          visible={isFinancialReportGeneratorVisible}
          onCancel={() => setIsFinancialReportGeneratorVisible(false)}
        />
      </Content>
    </Layout>
  );
};

const FinancePage: React.FC = () => {
  return (
    <FinanceYearProvider>
      <FinancePageContent />
    </FinanceYearProvider>
  );
};

export default FinancePage;
