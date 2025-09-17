import { 
  StatementOfFinancialPositionData,
  IncomeStatementData,
  DetailedIncomeStatementData,
  NotesToFinancialStatementsData,
  Transaction,
  BankAccount
} from '@/types/finance';
// 避免循环导入，直接使用 Firebase
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy 
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import dayjs from 'dayjs';

export class SimpleFinancialReportGenerator {
  private organizationName: string = 'Junior Chamber International Kuala Lumpur (PPBM 3895/09)';
  
  constructor(organizationName?: string) {
    if (organizationName) {
      this.organizationName = organizationName;
    }
  }

  /**
   * 生成财务状况表 (资产负债表)
   */
  async generateStatementOfFinancialPosition(fiscalYear: number): Promise<StatementOfFinancialPositionData> {
    try {
      const previousYear = fiscalYear - 1;
      
      // 获取基础数据
      const transactions = await this.getTransactions(fiscalYear);
      const previousYearTransactions = await this.getTransactions(previousYear);
      const bankAccounts = await this.getBankAccounts();
      
      // 计算基础财务数据
      const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
      const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);
      const netIncome = totalIncome - totalExpense;
      
      const previousTotalIncome = previousYearTransactions.reduce((sum, t) => sum + t.income, 0);
      const previousTotalExpense = previousYearTransactions.reduce((sum, t) => sum + t.expense, 0);
      const previousNetIncome = previousTotalIncome - previousTotalExpense;
      
      // 计算银行余额
      const bankBalances = bankAccounts.reduce((sum, account) => {
        const accountTransactions = transactions.filter(t => t.bankAccountId === account.id);
        const balance = accountTransactions.reduce((acc, t) => acc + t.income - t.expense, 0);
        return sum + balance;
      }, 0);
      
      // const previousBankBalances = bankAccounts.reduce((sum, account) => {
      //   const accountTransactions = previousYearTransactions.filter(t => t.bankAccountId === account.id);
      //   const balance = accountTransactions.reduce((acc, t) => acc + t.income - t.expense, 0);
      //   return sum + balance;
      // }, 0);
      
      // 简化的固定资产计算
      const propertyCost = 123700.00;
      const accumulatedDepreciation = (fiscalYear - 2020) * 2474.00; // 从2020年开始折旧
      const carryingAmount = propertyCost - accumulatedDepreciation;
      
      // const previousAccumulatedDepreciation = (previousYear - 2020) * 2474.00;
      // const previousCarryingAmount = propertyCost - previousAccumulatedDepreciation;
      
      // 计算流动资产
      const inventories = 5998.87; // 简化：固定库存值
      const otherReceivables = 27018.00; // 简化：固定应收款
      const deposits = 75000.00; // 简化：固定定期存款
      
      const currentAssetsSubtotal = inventories + otherReceivables + deposits + bankBalances;
      // const previousCurrentAssetsSubtotal = inventories + otherReceivables + deposits + previousBankBalances;
      
      // 计算总资产
      const totalAssets = carryingAmount + currentAssetsSubtotal;
      // const previousTotalAssets = previousCarryingAmount + previousCurrentAssetsSubtotal;
      
      return {
        organizationName: this.organizationName,
        reportDate: dayjs().format('YYYY-MM-DD'),
        currentYear: fiscalYear,
        previousYear,
        
        nonCurrentAssets: {
          propertyPlantEquipment: {
            cost: propertyCost,
            accumulatedDepreciation,
            carryingAmount
          }
        },
        
        currentAssets: {
          inventories,
          otherReceivablesDepositsPrepayment: otherReceivables,
          depositsWithFinancialInstitution: deposits,
          bankBalances,
          subtotal: currentAssetsSubtotal
        },
        
        currentLiabilities: {
          otherPayables: 0
        },
        
        netCurrentAssets: currentAssetsSubtotal,
        totalAssets,
        
        financedBy: {
          accumulatedFunds: previousNetIncome,
          currentYearSurplusDeficit: netIncome,
          total: previousNetIncome + netIncome
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
  async generateIncomeStatement(fiscalYear: number): Promise<IncomeStatementData> {
    try {
      const previousYear = fiscalYear - 1;
      
      const transactions = await this.getTransactions(fiscalYear);
      // const previousYearTransactions = await this.getTransactions(previousYear);
      
      const incomes = transactions.reduce((sum, t) => sum + t.income, 0);
      // const previousIncomes = previousYearTransactions.reduce((sum, t) => sum + t.income, 0);
      
      const costOfGoodsSold = transactions.reduce((sum, t) => {
        if (t.purposeName?.includes('销售成本') || t.purposeName?.includes('商品成本')) {
          return sum + t.expense;
        }
        return sum;
      }, 0);
      
      // const previousCostOfGoodsSold = previousYearTransactions.reduce((sum, t) => {
      //   if (t.purposeName?.includes('销售成本') || t.purposeName?.includes('商品成本')) {
      //     return sum + t.expense;
      //   }
      //   return sum;
      // }, 0);
      
      const expenses = transactions.reduce((sum, t) => sum + t.expense, 0) - costOfGoodsSold;
      // const previousExpenses = previousYearTransactions.reduce((sum, t) => sum + t.expense, 0) - previousCostOfGoodsSold;
      
      const depreciation = 2474.00;
      
      const subtotalExpenses = costOfGoodsSold + expenses + depreciation;
      // const previousSubtotalExpenses = previousCostOfGoodsSold + previousExpenses + depreciation;
      
      const profitBeforeTaxation = incomes - subtotalExpenses;
      // const previousProfitBeforeTaxation = previousIncomes - previousSubtotalExpenses;
      
      return {
        organizationName: this.organizationName,
        reportPeriod: `${fiscalYear}年财政年度`,
        currentYear: fiscalYear,
        previousYear,
        
        incomes,
        costOfGoodsSold,
        expenses,
        depreciation,
        subtotalExpenses,
        profitBeforeTaxation,
        taxExpenses: 0,
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
  async generateDetailedIncomeStatement(fiscalYear: number): Promise<DetailedIncomeStatementData> {
    try {
      const previousYear = fiscalYear - 1;
      
      const transactions = await this.getTransactions(fiscalYear);
      const previousYearTransactions = await this.getTransactions(previousYear);
      
      // 简化的收入明细
      const incomeDetails = [
        {
          category: 'Membership',
          subcategory: 'Membership Fees',
          description: '会员费收入',
          currentYear: transactions.reduce((sum, t) => {
            if (t.purposeName?.includes('会员')) return sum + t.income;
            return sum;
          }, 0),
          previousYear: previousYearTransactions.reduce((sum, t) => {
            if (t.purposeName?.includes('会员')) return sum + t.income;
            return sum;
          }, 0)
        },
        {
          category: 'Project',
          subcategory: 'Project Income',
          description: '项目收入',
          currentYear: transactions.reduce((sum, t) => {
            if (t.purposeName?.includes('项目')) return sum + t.income;
            return sum;
          }, 0),
          previousYear: previousYearTransactions.reduce((sum, t) => {
            if (t.purposeName?.includes('项目')) return sum + t.income;
            return sum;
          }, 0)
        },
        {
          category: 'Bank',
          subcategory: 'Bank Interest',
          description: '银行利息收入',
          currentYear: transactions.reduce((sum, t) => {
            if (t.purposeName?.includes('银行利息')) return sum + t.income;
            return sum;
          }, 0),
          previousYear: previousYearTransactions.reduce((sum, t) => {
            if (t.purposeName?.includes('银行利息')) return sum + t.income;
            return sum;
          }, 0)
        }
      ];
      
      // 简化的费用明细
      const expenseDetails = [
        {
          category: 'JCIM',
          subcategory: 'JCIM Dues',
          description: 'JCIM会费',
          currentYear: transactions.reduce((sum, t) => {
            if (t.purposeName?.includes('JCIM')) return sum + t.expense;
            return sum;
          }, 0),
          previousYear: previousYearTransactions.reduce((sum, t) => {
            if (t.purposeName?.includes('JCIM')) return sum + t.expense;
            return sum;
          }, 0)
        },
        {
          category: 'Office Expense',
          subcategory: 'Office Expenses',
          description: '办公室费用',
          currentYear: transactions.reduce((sum, t) => {
            if (t.purposeName?.includes('办公室')) return sum + t.expense;
            return sum;
          }, 0),
          previousYear: previousYearTransactions.reduce((sum, t) => {
            if (t.purposeName?.includes('办公室')) return sum + t.expense;
            return sum;
          }, 0)
        }
      ];
      
      const costOfGoodsSold = {
        openingInventory: 2194.59,
        costOfGoodsPurchased: transactions.reduce((sum, t) => {
          if (t.purposeName?.includes('商品采购')) return sum + t.expense;
          return sum;
        }, 0),
        closingInventory: 5998.87,
        total: transactions.reduce((sum, t) => {
          if (t.purposeName?.includes('销售成本')) return sum + t.expense;
          return sum;
        }, 0)
      };
      
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
        reportPeriod: `${fiscalYear}年财政年度`,
        currentYear: fiscalYear,
        previousYear,
        
        incomeDetails,
        depreciation,
        costOfGoodsSold,
        expenseDetails,
        profitCalculation
      };
    } catch (error) {
      console.error('生成详细损益表失败:', error);
      throw new Error(`生成详细损益表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 生成财务报表附注
   */
  async generateNotesToFinancialStatements(fiscalYear: number): Promise<NotesToFinancialStatementsData> {
    try {
      const previousYear = fiscalYear - 1;
      
      // const transactions = await this.getTransactions(fiscalYear);
      // const previousYearTransactions = await this.getTransactions(previousYear);
      const bankAccounts = await this.getBankAccounts();
      
      const notes = [
        {
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
              currentYear: (fiscalYear - 2020) * 2474.00,
              previousYear: (previousYear - 2020) * 2474.00,
              additionalInfo: 'Accumulated Depreciation'
            },
            {
              description: 'Carrying Amount',
              currentYear: 123700.00 - (fiscalYear - 2020) * 2474.00,
              previousYear: 123700.00 - (previousYear - 2020) * 2474.00,
              additionalInfo: 'Carrying Amount'
            }
          ]
        },
        {
          noteNumber: '2',
          title: 'Inventories',
          content: '库存商品明细',
          details: [
            {
              description: 'JCI KL Pink Shirt',
              currentYear: 5998.87,
              previousYear: 2194.59,
              additionalInfo: 'Closing Inventory'
            }
          ]
        },
        {
          noteNumber: '5',
          title: 'Bank Balances',
          content: '银行账户余额',
          details: bankAccounts.map(account => ({
            description: `${account.bankName} - ${account.accountName}`,
            currentYear: account.currentBalance || 0,
            previousYear: account.currentBalance || 0
          }))
        }
      ];
      
      return {
        organizationName: this.organizationName,
        reportPeriod: `${fiscalYear}年财政年度`,
        notes
      };
    } catch (error) {
      console.error('生成财务报表附注失败:', error);
      throw new Error(`生成财务报表附注失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 辅助方法：获取交易数据
  private async getTransactions(fiscalYear: number): Promise<Transaction[]> {
    try {
      const startDate = new Date(fiscalYear, 0, 1); // 财政年度开始
      const endDate = new Date(fiscalYear, 11, 31); // 财政年度结束
      
      const q = query(
        collection(db, 'transactions'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString()
      })) as Transaction[];
    } catch (error) {
      console.error('获取交易数据失败:', error);
      return [];
    }
  }

  // 辅助方法：获取银行账户数据
  private async getBankAccounts(): Promise<BankAccount[]> {
    try {
      const q = query(collection(db, 'bank_accounts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toISOString(),
        updatedAt: doc.data().updatedAt?.toDate().toISOString()
      })) as BankAccount[];
    } catch (error) {
      console.error('获取银行账户数据失败:', error);
      return [];
    }
  }
}

export const simpleFinancialReportGenerator = new SimpleFinancialReportGenerator();
