# 银行户口分开计算累计余额功能指南

## 🎯 功能概述

新增了按银行户口分开计算累计余额的功能，每个银行户口独立计算其累计余额，提供更清晰和准确的财务数据管理。

## ✅ 新增功能

### 1. 按户口分开计算服务 (`src/services/financeService.ts`)

#### **新增方法**

```typescript
// 按银行户口分别计算累计余额
calculateBalancesByAccountSeparately(
  transactions: Transaction[], 
  bankAccounts: BankAccount[]
): {
  [accountId: string]: {
    accountName: string;
    initialBalance: number;
    finalBalance: number;
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
    transactionBalances: Array<{
      transactionId: string;
      transactionNumber: string;
      description: string;
      income: number;
      expense: number;
      netAmount: number;
      runningBalance: number;
      transactionDate: string;
    }>;
  }
}

// 获取指定银行户口的累计余额信息
getAccountBalanceInfo(
  accountId: string,
  transactions: Transaction[],
  bankAccounts: BankAccount[]
): AccountBalanceInfo | null
```

#### **功能特点**
- **独立计算**: 每个银行户口独立计算累计余额
- **详细统计**: 提供每个户口的完整财务统计
- **交易详情**: 显示每笔交易的累计余额变化
- **类型安全**: 完整的TypeScript类型定义

### 2. 户口余额显示组件 (`src/components/AccountBalanceDisplay.tsx`)

#### **组件功能**
- **汇总表格**: 显示所有户口的余额汇总
- **详细查看**: 点击查看单个户口的交易详情
- **统计信息**: 显示总体和单个户口的统计
- **交互式界面**: 支持户口选择和详情展开

#### **使用示例**
```typescript
<AccountBalanceDisplay
  transactions={transactions}
  bankAccounts={bankAccounts}
  title="银行户口累计余额汇总"
/>
```

### 3. 交易管理界面集成

#### **新增标签页**
- ✅ **累计余额汇总**: 显示所有户口的余额汇总
- ✅ **户口详情**: 点击查看单个户口的详细交易记录
- ✅ **统计对比**: 不同户口之间的财务对比

## 🔧 技术实现

### 1. 计算逻辑

#### **按户口分组**
```typescript
// 按银行户口分组交易
const transactionsByAccount: { [accountId: string]: Transaction[] } = {};

transactions.forEach(transaction => {
  if (!transactionsByAccount[transaction.bankAccountId]) {
    transactionsByAccount[transaction.bankAccountId] = [];
  }
  transactionsByAccount[transaction.bankAccountId].push(transaction);
});
```

#### **独立计算**
```typescript
// 为每个银行户口独立计算
Object.entries(transactionsByAccount).forEach(([accountId, accountTransactions]) => {
  const account = bankAccounts.find(acc => acc.id === accountId);
  
  // 按交易记录序号排序
  const sortedTransactions = [...accountTransactions].sort((a, b) => {
    if (a.transactionNumber && b.transactionNumber) {
      return a.transactionNumber.localeCompare(b.transactionNumber);
    }
    // 按日期排序作为备用
    return new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime();
  });

  // 计算该户口的统计信息
  const initialBalance = account.initialAmount || 0;
  const totalIncome = sortedTransactions.reduce((sum, t) => sum + (t.income || 0), 0);
  const totalExpense = sortedTransactions.reduce((sum, t) => sum + (t.expense || 0), 0);
  const netAmount = totalIncome - totalExpense;
  const finalBalance = initialBalance + netAmount;
});
```

### 2. 数据结构

#### **户口余额信息**
```typescript
interface AccountBalanceInfo {
  accountName: string;           // 户口名称
  initialBalance: number;        // 初始余额
  finalBalance: number;         // 最终余额
  totalIncome: number;          // 总收入
  totalExpense: number;         // 总支出
  netAmount: number;            // 净额
  transactionCount: number;     // 交易数量
  transactionBalances: Array<{  // 交易详情
    transactionId: string;
    transactionNumber: string;
    description: string;
    income: number;
    expense: number;
    netAmount: number;
    runningBalance: number;
    transactionDate: string;
  }>;
}
```

## 📊 界面展示

### 1. 累计余额汇总标签页

#### **总体统计卡片**
- **总初始余额**: 所有户口的初始余额总和
- **总收入**: 所有交易的总收入
- **总支出**: 所有交易的总支出
- **总最终余额**: 所有户口的最终余额总和

#### **户口汇总表格**
| 户口名称 | 初始余额 | 总收入 | 总支出 | 净额 | 最终余额 | 交易数 | 操作 |
|---------|---------|--------|--------|------|----------|--------|------|
| 主户口   | 10,000  | 5,000  | 2,000  | 3,000 | 13,000   | 25     | 查看详情 |
| 备用户口 | 5,000   | 1,000  | 500    | 500   | 5,500    | 10     | 查看详情 |

### 2. 户口详情查看

#### **户口统计信息**
- **初始余额**: 该户口的初始余额
- **总收入**: 该户口的总收入
- **总支出**: 该户口的总支出
- **最终余额**: 该户口的最终余额

#### **交易详情表格**
| 交易序号 | 交易日期 | 描述 | 收入 | 支出 | 净额 | 累计余额 |
|---------|---------|------|------|------|------|----------|
| TXN-001 | 01-Jan  | 收入 | 1,000| 0    | 1,000| 11,000   |
| TXN-002 | 02-Jan  | 支出 | 0    | 500  | -500 | 10,500   |

## 🎨 使用场景

### 1. 财务管理
- **多户口管理**: 同时管理多个银行户口的财务
- **独立核算**: 每个户口独立计算累计余额
- **对比分析**: 不同户口之间的财务对比

### 2. 审计检查
- **详细追踪**: 每笔交易的累计余额变化
- **数据验证**: 验证计算的一致性和准确性
- **报告生成**: 生成详细的财务报告

### 3. 业务分析
- **趋势分析**: 分析不同户口的财务趋势
- **风险评估**: 评估不同户口的财务风险
- **决策支持**: 为财务决策提供数据支持

## 🚀 高级功能

### 1. 批量操作
```typescript
// 获取所有户口的余额信息
const allAccountBalances = balanceCalculationService.calculateBalancesByAccountSeparately(transactions, bankAccounts);

// 获取特定户口的余额信息
const accountInfo = balanceCalculationService.getAccountBalanceInfo(accountId, transactions, bankAccounts);
```

### 2. 数据导出
- **Excel导出**: 导出户口余额汇总表
- **PDF报告**: 生成详细的财务报告
- **CSV数据**: 导出原始交易数据

### 3. 实时更新
- **自动刷新**: 数据变化时自动更新显示
- **缓存优化**: 使用缓存提高性能
- **增量计算**: 只计算变化的部分

## 📝 最佳实践

### 1. 数据管理
- **定期备份**: 定期备份财务数据
- **数据验证**: 定期验证计算的一致性
- **错误处理**: 处理异常数据和计算错误

### 2. 性能优化
- **分页显示**: 大量数据时使用分页
- **缓存策略**: 合理使用缓存提高性能
- **异步加载**: 使用异步加载提高用户体验

### 3. 用户体验
- **清晰显示**: 使用颜色和图标清晰显示数据
- **交互友好**: 提供友好的用户交互界面
- **错误提示**: 提供清晰的错误提示信息

## 🔍 故障排除

### 1. 常见问题
- **计算不一致**: 检查交易数据的完整性
- **显示异常**: 检查组件的数据绑定
- **性能问题**: 检查数据量和计算复杂度

### 2. 调试工具
- **BalanceDebugTool**: 使用调试工具诊断问题
- **控制台日志**: 查看控制台的错误信息
- **数据验证**: 使用验证功能检查数据一致性

### 3. 解决方案
- **数据修复**: 修复不完整或错误的数据
- **代码优化**: 优化计算逻辑和界面渲染
- **缓存清理**: 清理缓存解决显示问题

## 🎯 总结

按银行户口分开计算累计余额的功能提供了：

1. **更清晰的财务视图**: 每个户口独立显示，便于管理
2. **更准确的计算**: 避免不同户口之间的数据混淆
3. **更详细的统计**: 提供完整的财务统计信息
4. **更好的用户体验**: 直观的界面和友好的交互

这个功能完全满足了按个别银行户口分开计算累计余额的需求，为财务管理提供了更强大和灵活的工具。
