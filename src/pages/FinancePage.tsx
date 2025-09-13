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
  Tag,
} from 'antd';
import {
  DollarOutlined,
  BankOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useAuthStore } from '@/store/authStore';
import BankAccountManagement from '@/components/BankAccountManagement';
import TransactionManagement from '@/components/TransactionManagement';
import TransactionPurposeManagement from '@/components/TransactionPurposeManagement';
import BudgetManagement from '@/components/BudgetManagement';
import AnnualBudgetManagement from '@/components/AnnualBudgetManagement';
import BudgetApprovalWorkflow from '@/components/BudgetApprovalWorkflow';
import BudgetMonitoringDashboard from '@/components/BudgetMonitoringDashboard';
import BillPaymentSystem from '@/components/BillPaymentSystem';
import FinancialReports from '@/components/FinancialReports';
import FinancialReportGenerator from '@/components/FinancialReportGenerator';
import ExpenseSplittingModal from '@/components/ExpenseSplittingModal';
import FinanceDateFilter from '@/components/FinanceDateFilter';
import MembershipFeeManagement from '@/components/MembershipFeeManagement';
import { useFinanceDateFilter } from '@/hooks/useFinanceDateFilter';
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

const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const { fiscalYear, fiscalYearStartMonth } = useFiscalYear();
  const { user } = useAuthStore();

  // 数据状态
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purposes, setPurposes] = useState<TransactionPurpose[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [billRequests, setBillRequests] = useState<BillPaymentRequest[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);

  // 日期筛选功能
  const {
    dateFilter,
    setYear,
    setMonth,
    resetFilter,
    filteredData: filteredTransactions,
    getFilteredStats,
  } = useFinanceDateFilter(transactions, { dateField: 'transactionDate', format: 'DD-MMM-YYYY' });

  // 费用拆分模态框状态
  const [isExpenseSplittingVisible, setIsExpenseSplittingVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // 财务报表生成器模态框状态
  const [isFinancialReportGeneratorVisible, setIsFinancialReportGeneratorVisible] = useState(false);

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
        bankAccountService.getAccounts(fiscalYear),
        transactionService.getTransactions(fiscalYear),
        transactionPurposeService.getPurposes(),
        budgetService.getBudgets(),
        budgetAllocationService.getAllocations(),
        billPaymentService.getRequests(fiscalYear),
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

  useEffect(() => {
    loadData();
  }, [fiscalYear]);

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

  const handleImportTransactions = async (transactions: FinancialImportData[], _bankAccountId: string) => {
    try {
      // 转换 FinancialImportData 为 Transaction 格式
      const transactionData = transactions.map(t => ({
        bankAccountId: t.bankAccountId,
        transactionDate: t.transactionDate,
        mainDescription: t.mainDescription,
        subDescription: t.subDescription,
        expense: t.expense,
        income: t.income,
        payer: t.payer,
        payee: t.payee,
        transactionPurpose: t.transactionPurpose,
        projectAccount: t.projectAccount,
        accountType: t.accountType,
        inputBy: t.inputBy || '系统导入',
        paymentDescription: t.paymentDescription,
        auditYear: t.auditYear,
      }));
      
      const result = await transactionService.createTransactions(transactionData);
      await loadData();
      return result;
    } catch (error) {
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
  const handleGenerateReport = async (reportType: FinancialReportType, _startDate: string, _endDate: string, auditYear: number) => {
    try {
      const reportId = await newFinancialReportService.generateReport(
        reportType,
        auditYear,
        user?.uid || 'unknown-user',
        fiscalYearStartMonth
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
  const totalIncome = getFilteredStats(filteredTransactions, 'income');
  const totalExpense = getFilteredStats(filteredTransactions, 'expense');
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
          {/* 日期筛选组件 */}
          <FinanceDateFilter
            dateFilter={dateFilter}
            onYearChange={setYear}
            onMonthChange={setMonth}
            onReset={resetFilter}
            fiscalYear={fiscalYear}
          />
          
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

          <Card title="财政年度设置" style={{ marginTop: 24 }}>
            <Space>
              <Text strong>当前财政年度：</Text>
              <Tag color="blue" icon={<CalendarOutlined />}>
                {fiscalYear}
              </Tag>
              <Button 
                type="link" 
                icon={<SettingOutlined />}
                onClick={() => {
                  message.info('财政年度设置已迁移到分会设置页面，请前往系统设置 > 分会设置进行修改');
                }}
              >
                修改财政年度
              </Button>
            </Space>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                财政年度设置已统一管理，请前往 系统设置 &gt; 分会设置 进行修改
              </Text>
            </div>
          </Card>
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
        <BudgetManagement
          onCreateBudget={handleCreateBudget}
          onUpdateBudget={handleUpdateBudget}
          onDeleteBudget={handleDeleteBudget}
          onCreateAllocation={handleCreateAllocation}
          onUpdateAllocation={handleUpdateAllocation}
          onDeleteAllocation={handleDeleteAllocation}
          budgets={budgets}
          allocations={allocations}
          purposes={purposes}
          loading={loading}
          dateFilter={dateFilter}
        />
      ),
    },
    {
      key: 'annual-budgets',
      label: '年度预算管理',
      children: (
        <AnnualBudgetManagement
          onCreateBudget={handleCreateBudget}
          onUpdateBudget={handleUpdateBudget}
          onDeleteBudget={handleDeleteBudget}
          onCreateAllocation={handleCreateAllocation}
          onUpdateAllocation={handleUpdateAllocation}
          onDeleteAllocation={handleDeleteAllocation}
          budgets={budgets}
          allocations={allocations}
          purposes={purposes}
          loading={loading}
        />
      ),
    },
    {
      key: 'budget-approval',
      label: '预算审批',
      children: (
        <BudgetApprovalWorkflow
          budgets={budgets}
          onUpdateBudget={handleUpdateBudget}
          loading={loading}
        />
      ),
    },
    {
      key: 'budget-monitoring',
      label: '预算监控',
      children: (
        <BudgetMonitoringDashboard
          budgets={budgets}
          allocations={allocations}
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
          dateFilter={dateFilter}
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
             reports={reports}
             bankAccounts={bankAccounts}
             transactions={filteredTransactions}
             budgets={budgets}
             allocations={allocations}
             purposes={purposes}
             loading={loading}
             dateFilter={dateFilter}
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
          <Text type="secondary">
            JCI Kuala Lumpur 标准财务管理系统 - 财政年度 {fiscalYear}
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

export default FinancePage;
