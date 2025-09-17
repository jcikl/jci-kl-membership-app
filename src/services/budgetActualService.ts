import { Transaction, Budget, BudgetMainCategory, BudgetSubCategory } from '@/types/finance';
import { transactionService } from './financeService';

// 实际收支数据接口
export interface ActualIncomeExpenseData {
  budgetId: string;
  budgetCategory: BudgetMainCategory;
  budgetSubCategory: BudgetSubCategory;
  actualIncome: number;
  actualExpense: number;
  netActual: number;
  budgetedAmount: number;
  variance: number;
  variancePercentage: number;
}

// 预算分类映射到交易用途的规则
const BUDGET_TO_TRANSACTION_MAPPING: Record<BudgetSubCategory, string[]> = {
  // 收入子分类映射
  'membership_subscription': ['会员费', 'membership', 'subscription', '会员订阅'],
  'external_funding': ['赞助', 'sponsor', '资助', 'funding', '外部资助'],
  'project_surplus': ['项目', 'project', '盈余', 'surplus', '项目盈余'],
  'project_floating_funds': ['浮动资金', 'floating', '项目浮动'],
  'other_income': ['其他收入', 'other', '杂项收入'],
  
  // 支出子分类映射
  'administrative_management': ['行政', 'administrative', '管理', 'management', '办公'],
  'projects': ['项目', 'project', '活动', 'event'],
  'convention_reception': ['大会', 'convention', '接待', 'reception', '会议'],
  'merchandise': ['商品', 'merchandise', '采购', 'purchase', '物品'],
  'pre_purchase_tickets': ['预购', 'pre-purchase', '门票', 'ticket', '预订']
};

// 预算实际收支服务
export const budgetActualService = {
  // 根据预算分类计算实际收支
  async calculateActualIncomeExpense(
    budgets: Budget[]
  ): Promise<ActualIncomeExpenseData[]> {
    try {
      // 获取所有交易记录
      const transactions = await transactionService.getTransactions();
      
      const results: ActualIncomeExpenseData[] = [];
      
      for (const budget of budgets) {
        const actualData = await this.calculateBudgetActual(budget, transactions);
        results.push(actualData);
      }
      
      return results;
    } catch (error) {
      console.error('计算实际收支失败:', error);
      throw new Error(`计算实际收支失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  // 计算单个预算的实际收支
  async calculateBudgetActual(
    budget: Budget, 
    transactions: Transaction[]
  ): Promise<ActualIncomeExpenseData> {
    const subCategory = budget.subCategory;
    if (!subCategory) {
      return {
        budgetId: budget.id,
        budgetCategory: budget.mainCategory || 'income',
        budgetSubCategory: 'other_income',
        actualIncome: 0,
        actualExpense: 0,
        netActual: 0,
        budgetedAmount: budget.totalBudget,
        variance: budget.totalBudget,
        variancePercentage: 100
      };
    }

    // 获取该子分类的关键词
    const keywords = BUDGET_TO_TRANSACTION_MAPPING[subCategory] || [];
    
    // 筛选相关的交易记录
    const relevantTransactions = transactions.filter(transaction => {
      // 检查交易描述是否包含相关关键词
      const description = (transaction.mainDescription + ' ' + (transaction.subDescription || '')).toLowerCase();
      const payerPayee = (transaction.payerPayee || '').toLowerCase();
      const purpose = (transaction.transactionPurpose || '').toLowerCase();
      
      return keywords.some(keyword => 
        description.includes(keyword.toLowerCase()) ||
        payerPayee.includes(keyword.toLowerCase()) ||
        purpose.includes(keyword.toLowerCase())
      );
    });

    // 计算实际收入和支出
    let actualIncome = 0;
    let actualExpense = 0;

    relevantTransactions.forEach(transaction => {
      actualIncome += transaction.income || 0;
      actualExpense += transaction.expense || 0;
    });

    const netActual = actualIncome - actualExpense;
    const variance = netActual - budget.totalBudget;
    const variancePercentage = budget.totalBudget !== 0 ? (variance / budget.totalBudget) * 100 : 0;

    return {
      budgetId: budget.id,
      budgetCategory: budget.mainCategory || 'income',
      budgetSubCategory: subCategory,
      actualIncome,
      actualExpense,
      netActual,
      budgetedAmount: budget.totalBudget,
      variance,
      variancePercentage
    };
  },

  // 按主分类汇总实际收支
  async calculateActualSummaryByCategory(
    budgets: Budget[]
  ): Promise<{
    income: Record<BudgetSubCategory, ActualIncomeExpenseData>;
    expense: Record<BudgetSubCategory, ActualIncomeExpenseData>;
    totalIncome: number;
    totalExpense: number;
    netActual: number;
    totalBudgetedIncome: number;
    totalBudgetedExpense: number;
    netBudgeted: number;
    overallVariance: number;
    overallVariancePercentage: number;
  }> {
    const actualData = await this.calculateActualIncomeExpense(budgets);
    
    const incomeCategories: Record<BudgetSubCategory, ActualIncomeExpenseData> = {} as any;
    const expenseCategories: Record<BudgetSubCategory, ActualIncomeExpenseData> = {} as any;
    
    let totalIncome = 0;
    let totalExpense = 0;
    let totalBudgetedIncome = 0;
    let totalBudgetedExpense = 0;

    actualData.forEach(data => {
      if (data.budgetCategory === 'income') {
        incomeCategories[data.budgetSubCategory] = data;
        totalIncome += data.actualIncome;
        totalBudgetedIncome += data.budgetedAmount;
      } else if (data.budgetCategory === 'expense') {
        expenseCategories[data.budgetSubCategory] = data;
        totalExpense += data.actualExpense;
        totalBudgetedExpense += data.budgetedAmount;
      }
    });

    const netActual = totalIncome - totalExpense;
    const netBudgeted = totalBudgetedIncome - totalBudgetedExpense;
    const overallVariance = netActual - netBudgeted;
    const overallVariancePercentage = netBudgeted !== 0 ? (overallVariance / netBudgeted) * 100 : 0;

    return {
      income: incomeCategories,
      expense: expenseCategories,
      totalIncome,
      totalExpense,
      netActual,
      totalBudgetedIncome,
      totalBudgetedExpense,
      netBudgeted,
      overallVariance,
      overallVariancePercentage
    };
  },

  // 获取预算执行状态
  getBudgetExecutionStatus(variancePercentage: number): {
    status: 'excellent' | 'good' | 'warning' | 'critical';
    color: string;
    text: string;
  } {
    if (variancePercentage >= 0 && variancePercentage <= 5) {
      return { status: 'excellent', color: '#52c41a', text: '优秀' };
    } else if (variancePercentage > 5 && variancePercentage <= 15) {
      return { status: 'good', color: '#1890ff', text: '良好' };
    } else if (variancePercentage > 15 && variancePercentage <= 30) {
      return { status: 'warning', color: '#faad14', text: '需关注' };
    } else {
      return { status: 'critical', color: '#ff4d4f', text: '严重偏差' };
    }
  },

  // 格式化金额显示
  formatAmount(amount: number, showSign: boolean = false): string {
    const formatted = Math.abs(amount).toLocaleString();
    if (showSign) {
      return amount >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    return formatted;
  },

  // 格式化百分比显示
  formatPercentage(percentage: number): string {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  }
};
