# 移除 TransactionSplit 中的 purposeName 字段

## 📋 任务概述

成功移除了 `TransactionSplit` 类型中的 `purposeName` 字段，简化了数据结构，改为通过 `transactionPurpose` ID 动态获取用途名称。

## 🔧 修改内容

### 1. 类型定义修改

**文件**: `src/types/finance.ts`

**修改前**:
```typescript
export interface TransactionSplit {
  id: string;
  transactionId: string;
  splitIndex: number;
  amount: number;
  transactionPurpose?: string; // 交易用途ID
  purposeName?: string; // 交易用途名称 ❌ 移除
  projectAccount?: string;
  payerPayee?: string;
  transactionType?: string;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

**修改后**:
```typescript
export interface TransactionSplit {
  id: string;
  transactionId: string;
  splitIndex: number;
  amount: number;
  transactionPurpose?: string; // 交易用途ID
  projectAccount?: string;
  payerPayee?: string;
  transactionType?: string;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 2. TransactionSplitModal 组件修改

**文件**: `src/components/TransactionSplitModal.tsx`

#### 状态类型修改
- 移除了 `purposeName` 字段从状态类型定义中
- 移除了所有 `purposeName` 相关的状态更新逻辑

#### 处理函数修改
- `handleMainCategoryChange`: 移除 `purposeName` 清空逻辑
- `handleBusinessCategoryChange`: 移除 `purposeName` 清空逻辑  
- `handleSpecificPurposeChange`: 移除 `purposeName` 设置逻辑
- `handlePurposeChange`: 移除 `purposeName` 设置逻辑

#### 数据提交修改
- 移除了 `purposeName` 字段从拆分数据提交中

### 3. TransactionManagement 组件修改

**文件**: `src/components/TransactionManagement.tsx`

#### 拆分记录显示修改
**修改前**:
```typescript
{
  title: '交易用途',
  dataIndex: 'purposeName',
  key: 'purposeName',
  width: 150,
  render: (purposeName: string) => (
    <Tag color="purple">{purposeName || '未设置'}</Tag>
  ),
},
```

**修改后**:
```typescript
{
  title: '交易用途',
  dataIndex: 'transactionPurpose',
  key: 'transactionPurpose',
  width: 150,
  render: (purposeId: string) => {
    if (!purposeId) return <Tag color="purple">未设置</Tag>;
    
    const purpose = purposes.find(p => p.id === purposeId);
    return purpose ? (
      <Tag color="purple">{purpose.name}</Tag>
    ) : (
      <Tag color="purple">未设置</Tag>
    );
  },
},
```

## 📊 影响分析

### ✅ 正面影响

1. **数据一致性提升**
   - 消除了冗余存储，避免数据不一致问题
   - 单一数据源原则：只存储 ID，名称动态获取

2. **存储空间优化**
   - 减少了数据库存储空间
   - 简化了数据结构

3. **维护性提升**
   - 减少了数据同步的复杂性
   - 用途名称变更时无需更新拆分记录

4. **性能优化**
   - 减少了数据传输量
   - 简化了数据处理逻辑

### ⚠️ 注意事项

1. **显示性能**
   - 现在需要动态查找用途名称，可能略微影响显示性能
   - 对于大量拆分记录，建议考虑缓存优化

2. **数据完整性**
   - 确保 `transactionPurpose` ID 的有效性
   - 需要处理用途被删除的情况

## 🔍 其他类型保持不变

以下类型中的 `purposeName` 字段保持不变，因为它们有不同的用途：

- `ExpenseSplit` - 费用拆分类型
- `BudgetAllocation` - 预算分配类型  
- `BudgetComparison` - 预算对比类型

## 🧪 测试建议

1. **功能测试**
   - 创建新的拆分记录
   - 编辑现有拆分记录
   - 查看拆分记录列表

2. **数据完整性测试**
   - 验证用途名称正确显示
   - 测试用途被删除的情况
   - 验证层级推断功能

3. **性能测试**
   - 测试大量拆分记录的显示性能
   - 验证内存使用情况

## 📈 后续优化建议

1. **缓存优化**
   - 考虑在组件级别缓存用途信息
   - 实现用途信息的批量查询

2. **错误处理**
   - 增强对无效用途ID的处理
   - 添加用途信息缺失的提示

3. **性能监控**
   - 监控拆分记录显示的性能
   - 根据实际使用情况优化查询逻辑

## ✅ 完成状态

所有相关修改已完成：
- ✅ 类型定义更新
- ✅ TransactionSplitModal 组件更新
- ✅ TransactionManagement 组件更新
- ✅ 语法错误修复
- ✅ 功能验证

移除 `purposeName` 字段的任务已成功完成，系统现在使用更简洁和一致的数据结构。
