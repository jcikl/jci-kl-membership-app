import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  FinancialReport, 
  FinancialReportData,
  FinancialReportType,
  ReportStatus,
  BankAccount,
  Transaction
} from '@/types/finance';
import { bankAccountService } from './financeService';
import { transactionService } from './financeService';
// import { budgetService } from './financeService';
import { simpleFinancialReportGenerator } from './simpleFinancialReportGenerator';

// 财政年度计算工具
export class FiscalYearCalculator {
  private fiscalYearStartMonth: number;

  constructor(fiscalYearStartMonth: number = 1) {
    this.fiscalYearStartMonth = fiscalYearStartMonth;
  }

  // 根据日期获取财政年度
  getFiscalYear(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // getMonth() 返回 0-11，所以 +1
    
    if (month >= this.fiscalYearStartMonth) {
      return year;
    } else {
      return year - 1;
    }
  }

  // 获取财政年度的开始日期
  getFiscalYearStartDate(fiscalYear: number): Date {
    return new Date(fiscalYear, this.fiscalYearStartMonth - 1, 1);
  }

  // 获取财政年度的结束日期
  getFiscalYearEndDate(fiscalYear: number): Date {
    const nextFiscalYear = fiscalYear + 1;
    const endDate = new Date(nextFiscalYear, this.fiscalYearStartMonth - 1, 0);
    endDate.setHours(23, 59, 59, 999); // 设置为当天的最后一刻
    return endDate;
  }

  // 检查日期是否在指定财政年度内
  isDateInFiscalYear(date: Date, fiscalYear: number): boolean {
    const startDate = this.getFiscalYearStartDate(fiscalYear);
    const endDate = this.getFiscalYearEndDate(fiscalYear);
    return date >= startDate && date <= endDate;
  }

  // 获取财政年度的月份列表
  getFiscalYearMonths(fiscalYear: number): { year: number; month: number; name: string }[] {
    const months = [];
    const startMonth = this.fiscalYearStartMonth;
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (startMonth + i - 1) % 12;
      const year = fiscalYear + Math.floor((startMonth + i - 1) / 12);
      const monthNames = [
        '1月', '2月', '3月', '4月', '5月', '6月',
        '7月', '8月', '9月', '10月', '11月', '12月'
      ];
      
      months.push({
        year,
        month: monthIndex + 1,
        name: monthNames[monthIndex]
      });
    }
    
    return months;
  }
}

// 财务报表数据生成器
export class FinancialReportGenerator {
  private fiscalCalculator: FiscalYearCalculator;

  constructor(fiscalYearStartMonth: number = 1) {
    this.fiscalCalculator = new FiscalYearCalculator(fiscalYearStartMonth);
  }

  // 生成损益表
  async generateIncomeStatement(fiscalYear: number): Promise<FinancialReportData> {
    const startDate = this.fiscalCalculator.getFiscalYearStartDate(fiscalYear);
    const endDate = this.fiscalCalculator.getFiscalYearEndDate(fiscalYear);

    // 获取财政年度内的所有交易
    const transactions = await this.getTransactionsInPeriod(startDate, endDate);
    
    // 计算收入
    const totalIncome = transactions.reduce((sum, t) => sum + (t.income || 0), 0);
    const incomeByCategory = this.groupTransactionsByCategory(transactions, 'income');
    
    // 计算支出
    const totalExpense = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
    const expenseByCategory = this.groupTransactionsByCategory(transactions, 'expense');
    
    // 计算净收入
    const netIncome = totalIncome - totalExpense;

    return {
      reportType: 'income_statement',
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalIncome: totalIncome || 0,
      totalExpense: totalExpense || 0,
      netIncome: netIncome || 0,
      bankBalances: [],
      budgetComparison: [],
      transactions: transactions.map(t => ({
        id: t.id,
        transactionNumber: t.transactionNumber || `TXN-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        bankAccountId: t.bankAccountId,
        transactionDate: t.transactionDate,
        mainDescription: t.mainDescription || t.description || '',
        subDescription: t.subDescription,
        expense: t.expense || 0,
        income: t.income || 0,
        payerPayee: t.payerPayee,
        transactionType: t.transactionType,
        projectAccount: t.projectAccount,
        transactionPurpose: t.transactionPurpose,
        accountType: t.accountType,
        inputBy: t.inputBy,
        paymentDescription: t.paymentDescription,
        notes: t.notes,
        attachments: t.attachments,
        membershipFeeData: t.membershipFeeData,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        // 兼容性属性
        purposeId: t.purposeId,
        purposeName: t.purposeName,
        date: t.date || t.transactionDate,
        amount: t.amount || (t.income || 0) - (t.expense || 0),
        description: t.description || t.mainDescription || '',
        status: t.status,
        payer: t.payer,
        payee: t.payee
      })),
      summary: {
        netIncome: netIncome || 0,
        openingBalance: 0, // 需要计算
        periodIncome: totalIncome || 0,
        periodExpense: totalExpense || 0,
        closingBalance: 0 // 需要计算
      },
      details: {
        income: incomeByCategory,
        expense: expenseByCategory,
        monthlyData: {} // 需要计算月度数据
      }
    };
  }

  // 生成资产负债表
  async generateBalanceSheet(fiscalYear: number): Promise<FinancialReportData> {
    const endDate = this.fiscalCalculator.getFiscalYearEndDate(fiscalYear);
    
    // 获取所有银行户口
    const bankAccounts = await bankAccountService.getAccounts();
    
    // 计算总资产（银行户口余额）
    const totalAssets = bankAccounts.reduce((sum, account) => sum + account.currentBalance, 0);
    
    // 计算期初余额（财政年度开始时的余额）
    const startDate = this.fiscalCalculator.getFiscalYearStartDate(fiscalYear);
    const startTransactions = await this.getTransactionsInPeriod(
      new Date(0), // 从最早开始
      new Date(startDate.getTime() - 1) // 到财政年度开始前一天
    );
    
    const openingBalance = this.calculateOpeningBalance(bankAccounts, startTransactions);
    
    // 计算期间收支
    const periodTransactions = await this.getTransactionsInPeriod(startDate, endDate);
    const periodIncome = periodTransactions.reduce((sum, t) => sum + t.income, 0);
    const periodExpense = periodTransactions.reduce((sum, t) => sum + t.expense, 0);
    const periodNetChange = periodIncome - periodExpense;

    return {
      reportType: 'balance_sheet',
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalIncome: 0,
      totalExpense: 0,
      netIncome: 0,
      bankBalances: [],
      budgetComparison: [],
      transactions: [],
      summary: {
        netIncome: periodNetChange || 0,
        openingBalance: openingBalance || 0,
        periodIncome: periodIncome || 0,
        periodExpense: periodExpense || 0,
        closingBalance: totalAssets || 0
      },
      details: {
        income: {},
        expense: {},
        monthlyData: {}
      }
    };
  }

  // 生成现金流量表
  async generateCashFlowStatement(fiscalYear: number): Promise<FinancialReportData> {
    const startDate = this.fiscalCalculator.getFiscalYearStartDate(fiscalYear);
    const endDate = this.fiscalCalculator.getFiscalYearEndDate(fiscalYear);

    const transactions = await this.getTransactionsInPeriod(startDate, endDate);
    
    // 按月份分组现金流量
    const monthlyCashFlow = this.groupTransactionsByMonth(transactions, fiscalYear);
    
    // 计算经营活动现金流量
    const operatingCashFlow = transactions.reduce((sum, t) => {
      // 这里可以根据交易用途分类为经营活动、投资活动、筹资活动
      return sum + t.income - t.expense;
    }, 0);

    return {
      reportType: 'cash_flow',
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalIncome: transactions.reduce((sum, t) => sum + (t.income || 0), 0),
      totalExpense: transactions.reduce((sum, t) => sum + (t.expense || 0), 0),
      netIncome: operatingCashFlow || 0,
      bankBalances: [],
      budgetComparison: [],
      summary: {
        netIncome: operatingCashFlow || 0,
        openingBalance: 0,
        periodIncome: transactions.reduce((sum, t) => sum + (t.income || 0), 0),
        periodExpense: transactions.reduce((sum, t) => sum + (t.expense || 0), 0),
        closingBalance: operatingCashFlow || 0
      },
      transactions: transactions.map(t => ({
        id: t.id,
        transactionNumber: t.transactionNumber || `TXN-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        bankAccountId: t.bankAccountId,
        transactionDate: t.transactionDate,
        mainDescription: t.mainDescription || '',
        subDescription: t.subDescription,
        expense: t.expense || 0,
        income: t.income || 0,
        payerPayee: t.payerPayee,
        transactionType: t.transactionType,
        projectAccount: t.projectAccount,
        transactionPurpose: t.transactionPurpose,
        accountType: t.accountType,
        inputBy: t.inputBy,
        paymentDescription: t.paymentDescription,
        notes: t.notes,
        attachments: t.attachments,
        membershipFeeData: t.membershipFeeData,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        // 兼容性属性
        purposeId: t.purposeId,
        purposeName: t.purposeName,
        date: t.date || t.transactionDate,
        amount: t.amount || (t.income || 0) - (t.expense || 0),
        description: t.description || t.mainDescription || '',
        status: t.status,
        payer: t.payer,
        payee: t.payee
      })),
      details: {
        income: {},
        expense: {},
        monthlyData: monthlyCashFlow
      }
    };
  }

  // 生成月度收支报告
  async generateMonthlySummary(fiscalYear: number): Promise<FinancialReportData> {
    const months = this.fiscalCalculator.getFiscalYearMonths(fiscalYear);
    const monthlyData = [];

    for (const monthInfo of months) {
      const monthStart = new Date(monthInfo.year, monthInfo.month - 1, 1);
      const monthEnd = new Date(monthInfo.year, monthInfo.month, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthTransactions = await this.getTransactionsInPeriod(monthStart, monthEnd);
      
      const income = monthTransactions.reduce((sum, t) => sum + t.income, 0);
      const expense = monthTransactions.reduce((sum, t) => sum + t.expense, 0);
      
      monthlyData.push({
        month: monthInfo.name,
        year: monthInfo.year,
        income,
        expense,
        netIncome: income - expense,
        transactionCount: monthTransactions.length
      });
    }

    const totalIncome = monthlyData.reduce((sum, m) => sum + (m.income || 0), 0);
    const totalExpense = monthlyData.reduce((sum, m) => sum + (m.expense || 0), 0);

    return {
      reportType: 'monthly_summary',
      period: {
        startDate: this.fiscalCalculator.getFiscalYearStartDate(fiscalYear).toISOString(),
        endDate: this.fiscalCalculator.getFiscalYearEndDate(fiscalYear).toISOString(),
      },
      totalIncome: totalIncome || 0,
      totalExpense: totalExpense || 0,
      netIncome: (totalIncome || 0) - (totalExpense || 0),
      bankBalances: [],
      budgetComparison: [],
      summary: {
        netIncome: (totalIncome || 0) - (totalExpense || 0),
        openingBalance: 0,
        periodIncome: totalIncome || 0,
        periodExpense: totalExpense || 0,
        closingBalance: 0
      },
      transactions: [], // 月度报告不需要详细交易列表
      details: {
        income: {},
        expense: {},
        monthlyData: monthlyData.reduce((acc, item) => {
          acc[item.month] = { income: item.income, expense: item.expense, netIncome: item.netIncome };
          return acc;
        }, {} as Record<string, { income: number; expense: number; netIncome: number }>)
      }
    };
  }

  // 生成项目收支报告
  async generateProjectSummary(fiscalYear: number): Promise<FinancialReportData> {
    const startDate = this.fiscalCalculator.getFiscalYearStartDate(fiscalYear);
    const endDate = this.fiscalCalculator.getFiscalYearEndDate(fiscalYear);

    const transactions = await this.getTransactionsInPeriod(startDate, endDate);
    
    // 按项目分组（使用 projectAccount 字段）
    // const projectData = this.groupTransactionsByProject(transactions);
    
    // 获取预算信息
    // const budgets = await budgetService.getBudgets();
    // const budgetData = budgets.map(budget => ({
    //   projectName: budget.projectName || '',
    //   budgetYear: budget.budgetYear || fiscalYear,
    //   totalBudget: budget.totalBudget || 0,
    //   allocatedAmount: budget.allocatedAmount || 0,
    //   spentAmount: budget.spentAmount || 0,
    //   remainingAmount: budget.remainingAmount || 0
    // }));

    const totalIncome = transactions.reduce((sum, t) => sum + (t.income || 0), 0);
    const totalExpense = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);

    return {
      reportType: 'project_summary',
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalIncome,
      totalExpense,
      netIncome: totalIncome - totalExpense,
      bankBalances: [],
      budgetComparison: [],
      summary: {
        netIncome: (totalIncome || 0) - (totalExpense || 0),
        openingBalance: 0,
        periodIncome: totalIncome || 0,
        periodExpense: totalExpense || 0,
        closingBalance: 0
      },
      transactions: transactions.map(t => ({
        id: t.id,
        transactionNumber: t.transactionNumber || `TXN-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        bankAccountId: t.bankAccountId,
        transactionDate: t.transactionDate,
        mainDescription: t.mainDescription || '',
        subDescription: t.subDescription,
        expense: t.expense || 0,
        income: t.income || 0,
        payerPayee: t.payerPayee,
        transactionType: t.transactionType,
        projectAccount: t.projectAccount,
        transactionPurpose: t.transactionPurpose,
        accountType: t.accountType,
        inputBy: t.inputBy,
        paymentDescription: t.paymentDescription,
        notes: t.notes,
        attachments: t.attachments,
        membershipFeeData: t.membershipFeeData,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        // 兼容性属性
        purposeId: t.purposeId,
        purposeName: t.purposeName,
        date: t.date || t.transactionDate,
        amount: t.amount || (t.income || 0) - (t.expense || 0),
        description: t.description || t.mainDescription || '',
        status: t.status,
        payer: t.payer,
        payee: t.payee
      })),
      details: {
        income: {},
        expense: {},
        monthlyData: {}
      }
    };
  }

  // 生成银行对账单
  async generateBankReconciliation(fiscalYear: number): Promise<FinancialReportData> {
    const startDate = this.fiscalCalculator.getFiscalYearStartDate(fiscalYear);
    const endDate = this.fiscalCalculator.getFiscalYearEndDate(fiscalYear);

    const bankAccounts = await bankAccountService.getAccounts();
    const reconciliationData = [];

    for (const account of bankAccounts) {
      const accountTransactions = await this.getTransactionsInPeriod(
        startDate, 
        endDate, 
        account.id
      );
      
      const totalIncome = accountTransactions.reduce((sum, t) => sum + t.income, 0);
      const totalExpense = accountTransactions.reduce((sum, t) => sum + t.expense, 0);
      
      reconciliationData.push({
        accountId: account.id,
        accountName: account.accountName,
        accountType: account.accountType,
        openingBalance: account.initialAmount,
        totalIncome,
        totalExpense,
        netChange: totalIncome - totalExpense,
        closingBalance: account.currentBalance,
        transactionCount: accountTransactions.length,
        transactions: accountTransactions.map(t => ({
          id: t.id,
          date: t.transactionDate,
          description: t.mainDescription,
          amount: t.income > 0 ? t.income : -t.expense,
          type: t.income > 0 ? 'income' : 'expense',
          balance: account.currentBalance // 这里需要根据交易顺序计算余额
        }))
      });
    }

    return {
      reportType: 'bank_reconciliation',
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      totalIncome: 0,
      totalExpense: 0,
      netIncome: bankAccounts.reduce((sum, a) => sum + ((a.currentBalance || 0) - (a.initialAmount || 0)), 0),
      bankBalances: [],
      budgetComparison: [],
      transactions: [],
      summary: {
        netIncome: bankAccounts.reduce((sum, a) => sum + ((a.currentBalance || 0) - (a.initialAmount || 0)), 0),
        openingBalance: bankAccounts.reduce((sum, a) => sum + (a.initialAmount || 0), 0),
        periodIncome: 0,
        periodExpense: 0,
        closingBalance: bankAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0)
      },
      details: {
        income: {},
        expense: {},
        monthlyData: {}
      }
    };
  }

  // 辅助方法：获取指定期间内的交易
  private async getTransactionsInPeriod(
    startDate: Date, 
    endDate: Date, 
    accountId?: string
  ): Promise<Transaction[]> {
    // 这里需要实现根据日期范围查询交易的逻辑
    // 由于现有的 transactionService.getTransactions 只支持按财政年度查询
    // 我们需要扩展这个服务或在这里实现自定义查询
    
    const allTransactions = await transactionService.getTransactions();
    
    return allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.transactionDate);
      const inPeriod = transactionDate >= startDate && transactionDate <= endDate;
      const matchesAccount = !accountId || transaction.bankAccountId === accountId;
      
      return inPeriod && matchesAccount;
    });
  }

  // 辅助方法：按类别分组交易
  private groupTransactionsByCategory(
    transactions: Transaction[], 
    type: 'income' | 'expense'
  ): Record<string, number> {
    const grouped: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const amount = type === 'income' ? transaction.income : transaction.expense;
      if (amount > 0) {
        const category = transaction.transactionPurpose || '未分类';
        grouped[category] = (grouped[category] || 0) + amount;
      }
    });
    
    return grouped;
  }

  // 辅助方法：按月份分组交易
  private groupTransactionsByMonth(
    transactions: Transaction[], 
    fiscalYear: number
  ): Record<string, { income: number; expense: number; netIncome: number }> {
    const months = this.fiscalCalculator.getFiscalYearMonths(fiscalYear);
    const monthlyData: Record<string, { income: number; expense: number; netIncome: number }> = {};
    
    // 初始化所有月份
    months.forEach(month => {
      monthlyData[month.name] = { income: 0, expense: 0, netIncome: 0 };
    });
    
    // 分配交易到对应月份
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.transactionDate);
      const monthIndex = transactionDate.getMonth();
      const monthName = months[monthIndex]?.name || '未知月份';
      
      if (monthlyData[monthName]) {
        monthlyData[monthName].income += transaction.income;
        monthlyData[monthName].expense += transaction.expense;
        monthlyData[monthName].netIncome += transaction.income - transaction.expense;
      }
    });
    
    return monthlyData;
  }

  // 辅助方法：按项目分组交易
  // private groupTransactionsByProject(transactions: Transaction[]): Record<string, {
  //   income: number;
  //   expense: number;
  //   netIncome: number;
  //   transactionCount: number;
  // }> {
  //   const projectData: Record<string, {
  //     income: number;
  //     expense: number;
  //     netIncome: number;
  //     transactionCount: number;
  //   }> = {};
    
  //   transactions.forEach(transaction => {
  //     const project = transaction.projectAccount || '未分类项目';
      
  //     if (!projectData[project]) {
  //       projectData[project] = {
  //         income: 0,
  //         expense: 0,
  //         netIncome: 0,
  //         transactionCount: 0
  //       };
  //     }
      
  //     projectData[project].income += transaction.income;
  //     projectData[project].expense += transaction.expense;
  //     projectData[project].netIncome += transaction.income - transaction.expense;
  //     projectData[project].transactionCount += 1;
  //   });
    
  //   return projectData;
  // }

  // 辅助方法：计算期初余额
  private calculateOpeningBalance(
    bankAccounts: BankAccount[], 
    startTransactions: Transaction[]
  ): number {
    // 期初余额 = 当前余额 - 期间收支
    const currentBalance = bankAccounts.reduce((sum, account) => sum + account.currentBalance, 0);
    const periodIncome = startTransactions.reduce((sum, t) => sum + t.income, 0);
    const periodExpense = startTransactions.reduce((sum, t) => sum + t.expense, 0);
    
    return currentBalance - (periodIncome - periodExpense);
  }
}

// 财务报表服务
export const financialReportService = {
  // 生成财务报表
  async generateReport(
    reportType: FinancialReportType,
    fiscalYear: number,
    generatedBy: string,
    fiscalYearStartMonth: number = 1
  ): Promise<string> {
    const generator = new FinancialReportGenerator(fiscalYearStartMonth);
    let reportData: FinancialReportData;

    // 使用简化的生成器
    switch (reportType) {
      case 'statement_of_financial_position':
        reportData = {
          totalIncome: 0,
          totalExpense: 0,
          netIncome: 0,
          bankBalances: [],
          transactions: [],
          budgetComparison: [],
          statementOfFinancialPosition: await simpleFinancialReportGenerator.generateStatementOfFinancialPosition(fiscalYear)
        };
        break;
      case 'income_statement':
        reportData = {
          totalIncome: 0,
          totalExpense: 0,
          netIncome: 0,
          bankBalances: [],
          transactions: [],
          budgetComparison: [],
          incomeStatement: await simpleFinancialReportGenerator.generateIncomeStatement(fiscalYear)
        };
        break;
      case 'detailed_income_statement':
        reportData = {
          totalIncome: 0,
          totalExpense: 0,
          netIncome: 0,
          bankBalances: [],
          transactions: [],
          budgetComparison: [],
          detailedIncomeStatement: await simpleFinancialReportGenerator.generateDetailedIncomeStatement(fiscalYear)
        };
        break;
      case 'notes_to_financial_statements':
        reportData = {
          totalIncome: 0,
          totalExpense: 0,
          netIncome: 0,
          bankBalances: [],
          transactions: [],
          budgetComparison: [],
          notesToFinancialStatements: await simpleFinancialReportGenerator.generateNotesToFinancialStatements(fiscalYear)
        };
        break;
      case 'cash_flow':
        reportData = await generator.generateCashFlowStatement(fiscalYear);
        break;
      case 'monthly_summary':
        reportData = await generator.generateMonthlySummary(fiscalYear);
        break;
      case 'project_summary':
        reportData = await generator.generateProjectSummary(fiscalYear);
        break;
      case 'bank_reconciliation':
        reportData = await generator.generateBankReconciliation(fiscalYear);
        break;
      default:
        throw new Error(`不支持的报表类型: ${reportType}`);
    }

    // 保存报表到数据库
    const report: Omit<FinancialReport, 'id'> = {
      reportType,
      reportName: this.getReportName(reportType, fiscalYear),
      reportPeriod: `${fiscalYear}财政年度`,
      generatedBy,
      generatedAt: new Date().toISOString(),
      data: reportData,
      status: 'completed' as ReportStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'financial_reports'), {
      ...report,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    return docRef.id;
  },

  // 获取报表名称
  getReportName(reportType: FinancialReportType, fiscalYear: number): string {
    const reportNames: Record<FinancialReportType, string> = {
      statement_of_financial_position: `STATEMENT OF FINANCIAL POSITION AS AT 30 JUN ${fiscalYear}`,
      income_statement: `INCOME STATEMENT FOR THE YEAR ENDED 30 JUN ${fiscalYear}`,
      detailed_income_statement: `DETAILED INCOME STATEMENT FOR THE YEAR ENDED 30 JUN ${fiscalYear}`,
      notes_to_financial_statements: `NOTES TO THE FINANCIAL STATEMENTS FOR THE YEAR ENDED 30 JUN ${fiscalYear}`,
      balance_sheet: '资产负债表',
      cash_flow: '现金流量表',
      bank_reconciliation: '银行对账单',
      monthly_summary: '月度收支报告',
      project_summary: '项目收支报告',
      general_ledger: '总账'
    };

    return reportNames[reportType] || `${reportType} - ${fiscalYear}财政年度`;
  },

  // 获取所有报表
  async getReports(): Promise<FinancialReport[]> {
    const querySnapshot = await getDocs(
      query(collection(db, 'financial_reports'), orderBy('generatedAt', 'desc'))
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString()
    })) as FinancialReport[];
  },

  // 获取指定财政年度的报表
  async getReportsByFiscalYear(fiscalYear: number): Promise<FinancialReport[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'financial_reports'),
        orderBy('generatedAt', 'desc')
      )
    );

    return querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString()
      }))
      .filter(report => {
        // 从报告期间中提取财政年度信息
        const reportPeriod = (report as any).reportPeriod || '';
        return reportPeriod.includes(fiscalYear.toString());
      }) as FinancialReport[];
  },

  // 导出报表为CSV
  exportReportToCSV(reportData: FinancialReportData): string {
    const headers = ['项目', '金额', '备注'];
    const rows: string[][] = [];

    // 根据报表类型生成不同的CSV内容
    switch (reportData.reportType) {
      case 'income_statement':
        rows.push(['收入', '', '']);
        if (reportData.details?.income) {
          Object.entries(reportData.details.income).forEach(([category, amount]) => {
            rows.push([category, (amount as number).toString(), '']);
          });
        }
        rows.push(['支出', '', '']);
        if (reportData.details?.expense) {
          Object.entries(reportData.details.expense).forEach(([category, amount]) => {
            rows.push([category, (amount as number).toString(), '']);
          });
        }
        rows.push(['净收入', (reportData.summary?.netIncome || 0).toString(), '']);
        break;

      case 'balance_sheet':
        rows.push(['期初余额', (reportData.summary?.openingBalance || 0).toString(), '']);
        rows.push(['期间收入', (reportData.summary?.periodIncome || 0).toString(), '']);
        rows.push(['期间支出', (reportData.summary?.periodExpense || 0).toString(), '']);
        rows.push(['期末余额', (reportData.summary?.closingBalance || 0).toString(), '']);
        break;

      case 'monthly_summary':
        rows.push(['月份', '收入', '支出', '净收入']);
        if (reportData.details?.monthlyData) {
          Object.entries(reportData.details.monthlyData).forEach(([month, data]) => {
            rows.push([month, (data as any).income.toString(), (data as any).expense.toString(), (data as any).netIncome.toString()]);
          });
        }
        break;

      default:
        rows.push(['项目', '金额', '备注']);
        break;
    }

    // 转换为CSV格式
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  },

  // 导出报表为Excel（需要额外的库支持）
  async exportReportToExcel(reportData: FinancialReportData): Promise<Blob> {
    // 这里需要集成 xlsx 库来实现Excel导出
    // 暂时返回CSV格式的Blob
    const csvContent = this.exportReportToCSV(reportData);
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }
};
