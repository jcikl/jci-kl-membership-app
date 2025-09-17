import { 
  StatementOfFinancialPositionData,
  IncomeStatementData,
  DetailedIncomeStatementData,
  NotesToFinancialStatementsData,
  Transaction,
  BankAccount
} from '@/types/finance';
import { transactionService, bankAccountService } from './financeService';
import dayjs from 'dayjs';

export class FinancialReportGenerator {
  private organizationName: string = 'Junior Chamber International Kuala Lumpur (PPBM 3895/09)';
  
  constructor(organizationName?: string) {
    if (organizationName) {
      this.organizationName = organizationName;
    }
  }

  /**
   * 生成财务状况表 (资产负债表)
   */
  async generateStatementOfFinancialPosition(
    fiscalYear: number,
    reportDate: string = dayjs().format('YYYY-MM-DD')
  ): Promise<StatementOfFinancialPositionData> {
    try {
      const previousYear = fiscalYear - 1;
      
      // 获取银行账户数据
      const bankAccounts = await bankAccountService.getAccounts();
      
      // 获取交易数据
      const transactions = await transactionService.getTransactions();
      
      // 计算银行余额
      const currentBankBalances = this.calculateBankBalances(bankAccounts, transactions);
      
      // 计算固定资产 (假设有办公室等固定资产)
      const propertyPlantEquipment = {
        cost: 123700.00, // 办公室成本
        accumulatedDepreciation: this.calculateAccumulatedDepreciation(fiscalYear),
        carryingAmount: 123700.00 - this.calculateAccumulatedDepreciation(fiscalYear)
      };
      
      // 计算其他应收款和预付款
      const otherReceivables = this.calculateOtherReceivables(transactions);
      
      // 计算定期存款
      const deposits = this.calculateFixedDeposits(transactions);
      
      // 计算库存
      const inventories = this.calculateInventories(transactions);
      
      // 计算流动资产小计
      const currentAssetsSubtotal = inventories + otherReceivables + deposits + currentBankBalances;
      // const previousCurrentAssetsSubtotal = previousInventories + previousOtherReceivables + previousDeposits + previousBankBalances;
      
      // 计算总资产
      const totalAssets = propertyPlantEquipment.carryingAmount + currentAssetsSubtotal;
      // const previousTotalAssets = propertyPlantEquipment.carryingAmount + previousCurrentAssetsSubtotal;
      
      // 计算累计资金和当年盈余
      const accumulatedFunds = this.calculateAccumulatedFunds([]);
      const currentYearSurplus = this.calculateCurrentYearSurplus(transactions);
      // const previousAccumulatedFunds = this.calculateAccumulatedFunds(previousYearTransactions.slice(0, -1));
      // const previousYearSurplus = this.calculateCurrentYearSurplus(previousYearTransactions);
      
      return {
        organizationName: this.organizationName,
        reportDate,
        currentYear: fiscalYear,
        previousYear,
        
        nonCurrentAssets: {
          propertyPlantEquipment: {
            cost: propertyPlantEquipment.cost,
            accumulatedDepreciation: propertyPlantEquipment.accumulatedDepreciation,
            carryingAmount: propertyPlantEquipment.carryingAmount
          }
        },
        
        currentAssets: {
          inventories,
          otherReceivablesDepositsPrepayment: otherReceivables,
          depositsWithFinancialInstitution: deposits,
          bankBalances: currentBankBalances,
          subtotal: currentAssetsSubtotal
        },
        
        currentLiabilities: {
          otherPayables: 0 // 假设无其他应付款
        },
        
        netCurrentAssets: currentAssetsSubtotal,
        totalAssets,
        
        financedBy: {
          accumulatedFunds,
          currentYearSurplusDeficit: currentYearSurplus,
          total: accumulatedFunds + currentYearSurplus
        }
      };
    } catch (error) {
      console.error('生成财务状况表失败:', error);
      throw new Error(`生成财务状况表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 生成损益表
   */
  async generateIncomeStatement(
    fiscalYear: number,
    reportPeriod: string = `${fiscalYear}年财政年度`
  ): Promise<IncomeStatementData> {
    try {
      const previousYear = fiscalYear - 1;
      
      const transactions = await transactionService.getTransactions();
      
      const incomes = this.calculateTotalIncome(transactions);
      // const previousIncomes = this.calculateTotalIncome(previousYearTransactions);
      
      const costOfGoodsSold = this.calculateCostOfGoodsSold(transactions);
      
      const expenses = this.calculateTotalExpenses(transactions);
      
      const depreciation = 2474.00; // 年折旧费用
      
      const subtotalExpenses = costOfGoodsSold + expenses + depreciation;
      // const previousSubtotalExpenses = previousCostOfGoodsSold + previousExpenses + depreciation;
      
      const profitBeforeTaxation = incomes - subtotalExpenses;
      // const previousProfitBeforeTaxation = previousIncomes - previousSubtotalExpenses;
      
      return {
        organizationName: this.organizationName,
        reportPeriod,
        currentYear: fiscalYear,
        previousYear,
        
        incomes,
        costOfGoodsSold,
        expenses,
        depreciation,
        subtotalExpenses,
        profitBeforeTaxation,
        taxExpenses: 0, // 假设无税务费用
        profitForTheYear: profitBeforeTaxation,
        priorYearAdjustment: 0,
        adjustedProfitForTheYear: profitBeforeTaxation
      };
    } catch (error) {
      console.error('生成损益表失败:', error);
      throw new Error(`生成损益表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 生成详细损益表
   */
  async generateDetailedIncomeStatement(
    fiscalYear: number,
    reportPeriod: string = `${fiscalYear}年财政年度`
  ): Promise<DetailedIncomeStatementData> {
    const previousYear = fiscalYear - 1;
    
    const transactions = await transactionService.getTransactions();
    const previousYearTransactions = await transactionService.getTransactions();
    
    // 生成收入明细
    const incomeDetails = this.generateIncomeDetails(transactions, previousYearTransactions);
    
    // 生成费用明细
    const expenseDetails = this.generateExpenseDetails(transactions, previousYearTransactions);
    
    // 计算销售成本
    const costOfGoodsSold = {
      openingInventory: this.calculateOpeningInventory(previousYearTransactions),
      costOfGoodsPurchased: this.calculateCostOfGoodsPurchased(transactions),
      closingInventory: this.calculateClosingInventory(transactions),
      total: this.calculateCostOfGoodsSold(transactions)
    };
    
    // 计算利润
    const totalIncome = incomeDetails.reduce((sum, item) => sum + item.currentYear, 0);
    const totalExpenses = expenseDetails.reduce((sum, item) => sum + item.currentYear, 0);
    const depreciation = 2474.00;
    
    const profitCalculation = {
      profitBeforeTaxation: totalIncome - costOfGoodsSold.total - totalExpenses - depreciation,
      taxExpenses: 0,
      profitForTheYear: totalIncome - costOfGoodsSold.total - totalExpenses - depreciation,
      priorYearAdjustment: 0,
      adjustedProfitForTheYear: totalIncome - costOfGoodsSold.total - totalExpenses - depreciation
    };
    
    return {
      organizationName: this.organizationName,
      reportPeriod,
      currentYear: fiscalYear,
      previousYear,
      
      incomeDetails,
      depreciation,
      costOfGoodsSold,
      expenseDetails,
      profitCalculation
    };
  }

  /**
   * 生成财务报表附注
   */
  async generateNotesToFinancialStatements(
    fiscalYear: number,
    reportPeriod: string = `${fiscalYear}年财政年度`
  ): Promise<NotesToFinancialStatementsData> {
    const previousYear = fiscalYear - 1;
    
    const transactions = await transactionService.getTransactions();
    const previousYearTransactions = await transactionService.getTransactions();
    const bankAccounts = await bankAccountService.getAccounts();
    const previousYearBankAccounts = await bankAccountService.getAccounts();
    
    const notes: any[] = [
      this.generatePropertyPlantEquipmentNote(fiscalYear, previousYear),
      this.generateInventoriesNote(transactions, previousYearTransactions),
      this.generateOtherReceivablesNote(transactions, previousYearTransactions),
      this.generateDepositsNote(transactions, previousYearTransactions),
      this.generateBankBalancesNote(bankAccounts, previousYearBankAccounts),
      this.generateMembershipNote(transactions, previousYearTransactions),
      this.generateMiscellaneousNote(transactions, previousYearTransactions)
    ];
    
    return {
      organizationName: this.organizationName,
      reportPeriod,
      notes
    };
  }

  // 辅助计算方法
  private calculateBankBalances(bankAccounts: BankAccount[], transactions: Transaction[]): number {
    return bankAccounts.reduce((total, account) => {
      const accountTransactions = transactions.filter(t => t.bankAccountId === account.id);
      const balance = accountTransactions.reduce((sum, t) => sum + t.income - t.expense, 0);
      return total + balance;
    }, 0);
  }

  private calculateAccumulatedDepreciation(fiscalYear: number): number {
    const startYear = 2020; // 假设从2020年开始折旧
    const yearsDepreciated = fiscalYear - startYear;
    return yearsDepreciated * 2474.00; // 年折旧2474
  }

  private calculateOtherReceivables(transactions: Transaction[]): number {
    // 计算其他应收款、存款和预付款
    return transactions
      .filter(t => t.purposeName?.includes('应收') || t.purposeName?.includes('预付款'))
      .reduce((sum, t) => sum + t.income, 0);
  }

  private calculateFixedDeposits(transactions: Transaction[]): number {
    // 计算定期存款
    return transactions
      .filter(t => t.purposeName?.includes('定期存款'))
      .reduce((sum, t) => sum + t.income, 0);
  }

  private calculateInventories(transactions: Transaction[]): number {
    // 计算库存价值
    return transactions
      .filter(t => t.purposeName?.includes('库存') || t.purposeName?.includes('商品'))
      .reduce((sum, t) => sum + t.income, 0);
  }

  private calculateAccumulatedFunds(transactions: Transaction[]): number {
    // 计算累计资金
    return transactions.reduce((sum, t) => sum + t.income - t.expense, 0);
  }

  private calculateCurrentYearSurplus(transactions: Transaction[]): number {
    // 计算当年盈余
    return transactions.reduce((sum, t) => sum + t.income - t.expense, 0);
  }

  private calculateTotalIncome(transactions: Transaction[]): number {
    return transactions.reduce((sum, t) => sum + t.income, 0);
  }

  private calculateTotalExpenses(transactions: Transaction[]): number {
    return transactions.reduce((sum, t) => sum + t.expense, 0);
  }

  private calculateCostOfGoodsSold(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.purposeName?.includes('销售成本') || t.purposeName?.includes('商品成本'))
      .reduce((sum, t) => sum + t.expense, 0);
  }

  private calculateOpeningInventory(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.purposeName?.includes('期初库存'))
      .reduce((sum, t) => sum + t.income, 0);
  }

  private calculateCostOfGoodsPurchased(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.purposeName?.includes('商品采购'))
      .reduce((sum, t) => sum + t.expense, 0);
  }

  private calculateClosingInventory(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.purposeName?.includes('期末库存'))
      .reduce((sum, t) => sum + t.income, 0);
  }

  private generateIncomeDetails(transactions: Transaction[], previousYearTransactions: Transaction[]): any[] {
    // 按类别分组收入
    const incomeCategories = this.groupTransactionsByCategory(transactions, 'income');
    const previousIncomeCategories = this.groupTransactionsByCategory(previousYearTransactions, 'income');
    
    const details: any[] = [];
    
    // 会员费收入
    const membershipIncome = incomeCategories['会员费'] || 0;
    const previousMembershipIncome = previousIncomeCategories['会员费'] || 0;
    details.push({
      category: 'Membership',
      subcategory: 'Membership Fees',
      description: '会员费收入',
      currentYear: membershipIncome,
      previousYear: previousMembershipIncome
    });
    
    // 项目收入
    const projectIncome = incomeCategories['项目'] || 0;
    const previousProjectIncome = previousIncomeCategories['项目'] || 0;
    details.push({
      category: 'Project',
      subcategory: 'Project Income',
      description: '项目收入',
      currentYear: projectIncome,
      previousYear: previousProjectIncome
    });
    
    // 银行利息
    const bankInterest = incomeCategories['银行利息'] || 0;
    const previousBankInterest = previousIncomeCategories['银行利息'] || 0;
    details.push({
      category: 'Bank',
      subcategory: 'Bank Interest',
      description: '银行利息收入',
      currentYear: bankInterest,
      previousYear: previousBankInterest
    });
    
    return details;
  }

  private generateExpenseDetails(transactions: Transaction[], previousYearTransactions: Transaction[]): any[] {
    // 按类别分组费用
    const expenseCategories = this.groupTransactionsByCategory(transactions, 'expense');
    const previousExpenseCategories = this.groupTransactionsByCategory(previousYearTransactions, 'expense');
    
    const details: any[] = [];
    
    // JCIM费用
    const jcimExpenses = expenseCategories['JCIM'] || 0;
    const previousJcimExpenses = previousExpenseCategories['JCIM'] || 0;
    details.push({
      category: 'JCIM',
      subcategory: 'JCIM Dues',
      description: 'JCIM会费',
      currentYear: jcimExpenses,
      previousYear: previousJcimExpenses
    });
    
    // 办公室费用
    const officeExpenses = expenseCategories['办公室'] || 0;
    const previousOfficeExpenses = previousExpenseCategories['办公室'] || 0;
    details.push({
      category: 'Office Expense',
      subcategory: 'Office Expenses',
      description: '办公室费用',
      currentYear: officeExpenses,
      previousYear: previousOfficeExpenses
    });
    
    return details;
  }

  private groupTransactionsByCategory(transactions: Transaction[], type: 'income' | 'expense'): Record<string, number> {
    const categories: Record<string, number> = {};
    
    transactions.forEach(transaction => {
      const amount = type === 'income' ? transaction.income : transaction.expense;
      if (amount > 0) {
        const category = this.getTransactionCategory(transaction.purposeName || '');
        categories[category] = (categories[category] || 0) + amount;
      }
    });
    
    return categories;
  }

  private getTransactionCategory(purposeName: string): string {
    if (purposeName.includes('会员') || purposeName.includes('Membership')) return '会员费';
    if (purposeName.includes('项目') || purposeName.includes('Project')) return '项目';
    if (purposeName.includes('银行') || purposeName.includes('Bank')) return '银行利息';
    if (purposeName.includes('JCIM')) return 'JCIM';
    if (purposeName.includes('办公室') || purposeName.includes('Office')) return '办公室';
    return '其他';
  }

  // 生成各种附注
  private generatePropertyPlantEquipmentNote(fiscalYear: number, previousYear: number): any {
    return {
      noteNumber: '1',
      title: 'Property, Plant and Equipment',
      content: '固定资产按直线法计提折旧',
      details: [
        {
          description: 'Freehold Property (office)',
          currentYear: 123700.00,
          previousYear: 123700.00,
          additionalInfo: 'Cost'
        },
        {
          description: 'Accumulated Depreciation',
          currentYear: this.calculateAccumulatedDepreciation(fiscalYear),
          previousYear: this.calculateAccumulatedDepreciation(previousYear),
          additionalInfo: 'Accumulated Depreciation'
        },
        {
          description: 'Carrying Amount',
          currentYear: 123700.00 - this.calculateAccumulatedDepreciation(fiscalYear),
          previousYear: 123700.00 - this.calculateAccumulatedDepreciation(previousYear),
          additionalInfo: 'Carrying Amount'
        }
      ]
    };
  }

  private generateInventoriesNote(transactions: Transaction[], previousYearTransactions: Transaction[]): any {
    return {
      noteNumber: '2',
      title: 'Inventories',
      content: '库存商品明细',
      details: [
        {
          description: 'JCI KL Pink Shirt',
          currentYear: this.calculateInventories(transactions),
          previousYear: this.calculateInventories(previousYearTransactions),
          additionalInfo: 'Closing Inventory'
        }
      ]
    };
  }

  private generateOtherReceivablesNote(transactions: Transaction[], previousYearTransactions: Transaction[]): any {
    return {
      noteNumber: '3',
      title: 'Other Receivables, Deposits and Prepayment',
      content: '其他应收款、存款和预付款',
      details: [
        {
          description: 'Total',
          currentYear: this.calculateOtherReceivables(transactions),
          previousYear: this.calculateOtherReceivables(previousYearTransactions)
        }
      ]
    };
  }

  private generateDepositsNote(transactions: Transaction[], previousYearTransactions: Transaction[]): any {
    return {
      noteNumber: '4',
      title: 'Deposits with Financial Institution',
      content: '金融机构定期存款',
      details: [
        {
          description: 'Fixed deposit with licensed bank',
          currentYear: this.calculateFixedDeposits(transactions),
          previousYear: this.calculateFixedDeposits(previousYearTransactions)
        }
      ]
    };
  }

  private generateBankBalancesNote(bankAccounts: BankAccount[], previousYearBankAccounts: BankAccount[]): any {
    return {
      noteNumber: '5',
      title: 'Bank Balances',
      content: '银行账户余额',
      details: bankAccounts.map(account => ({
        description: `${account.bankName} - ${account.accountName}`,
        currentYear: account.currentBalance || 0,
        previousYear: previousYearBankAccounts.find(prev => prev.id === account.id)?.currentBalance || 0
      }))
    };
  }

  private generateMembershipNote(transactions: Transaction[], previousYearTransactions: Transaction[]): any {
    return {
      noteNumber: '6',
      title: 'Membership Received',
      content: '会员费收入明细',
      details: [
        {
          description: 'Total Membership',
          currentYear: this.calculateMembershipCount(transactions),
          previousYear: this.calculateMembershipCount(previousYearTransactions),
          additionalInfo: 'Total Membership'
        },
        {
          description: 'Paid Amount',
          currentYear: this.calculateMembershipIncome(transactions),
          previousYear: this.calculateMembershipIncome(previousYearTransactions),
          additionalInfo: 'Paid Amount'
        }
      ]
    };
  }

  private generateMiscellaneousNote(transactions: Transaction[], previousYearTransactions: Transaction[]): any {
    return {
      noteNumber: '7',
      title: 'Miscellaneous',
      content: '杂项费用',
      details: [
        {
          description: 'Total Miscellaneous',
          currentYear: this.calculateMiscellaneousExpenses(transactions),
          previousYear: this.calculateMiscellaneousExpenses(previousYearTransactions)
        }
      ]
    };
  }

  private calculateMembershipCount(transactions: Transaction[]): number {
    // 计算会员数量
    return transactions.filter(t => t.purposeName?.includes('会员')).length;
  }

  private calculateMembershipIncome(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.purposeName?.includes('会员'))
      .reduce((sum, t) => sum + t.income, 0);
  }

  private calculateMiscellaneousExpenses(transactions: Transaction[]): number {
    return transactions
      .filter(t => t.purposeName?.includes('杂项') || t.purposeName?.includes('Miscellaneous'))
      .reduce((sum, t) => sum + t.expense, 0);
  }
}

export const financialReportGenerator = new FinancialReportGenerator();
