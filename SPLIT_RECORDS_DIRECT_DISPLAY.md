# 拆分记录直接显示功能实现

## 📋 功能需求

拆分记录直接显示在表格中，无需隐藏，用户可以直接看到所有拆分记录。

## 🔧 实现方案

### 1. 数据结构重构

**文件**: `src/components/TransactionManagement.tsx`

修改了 `getAccountTableData` 函数，将拆分记录直接包含在表格数据中：

```typescript
const getAccountTableData = (accountId: string) => {
  // 筛选出当前银行户口的交易
  const accountTransactions = filteredTransactions.filter(t => t.bankAccountId === accountId);
  
  // 构建表格数据，包含拆分记录
  const tableData: any[] = [];
  
  accountTransactions.forEach(transaction => {
    // 添加主交易记录
    tableData.push({
      ...transaction,
      key: transaction.id,
      isMainRecord: true,
      isSplitRecord: false,
    });
    
    // 添加该交易的拆分记录
    const splits = transactionSplits.filter(split => split.transactionId === transaction.id);
    splits.forEach(split => {
      tableData.push({
        ...split,
        key: `split-${split.id}`,
        isMainRecord: false,
        isSplitRecord: true,
        parentTransactionId: transaction.id,
      });
    });
  });
  
  return tableData;
};
```

### 2. 表格列定义更新

添加了新的"类型"列来区分主记录和拆分记录：

```typescript
{
  title: '类型',
  dataIndex: 'isSplitRecord',
  key: 'isSplitRecord',
  width: 80,
  render: (isSplitRecord: boolean, record: any) => {
    if (isSplitRecord) {
      return (
        <Tag color="blue" icon={<SplitCellsOutlined />}>
          拆分
        </Tag>
      );
    }
    return (
      <Tag color="green" icon={<TransactionOutlined />}>
        主记录
      </Tag>
    );
  },
},
```

### 3. 列显示逻辑优化

所有列都根据记录类型显示不同的内容：

#### 交易日期列
- **主记录**: 显示交易日期
- **拆分记录**: 显示 "-"

#### 主描述列
- **主记录**: 显示主描述
- **拆分记录**: 显示拆分描述

#### 副描述列
- **主记录**: 显示副描述
- **拆分记录**: 显示备注

#### 支出列
- **主记录**: 显示支出金额
- **拆分记录**: 显示拆分金额

#### 收入列
- **主记录**: 显示收入金额
- **拆分记录**: 显示 "-"

#### 余额列
- **主记录**: 显示余额
- **拆分记录**: 显示 "-"

#### 付款人/收款人列
- **主记录**: 显示付款人/收款人
- **拆分记录**: 显示拆分记录的付款人/收款人

#### 业务分类列
- **主记录**: 显示业务分类
- **拆分记录**: 显示拆分记录的业务分类（支持层级推断）

#### 交易用途列
- **主记录**: 显示交易用途（带层级路径）
- **拆分记录**: 显示拆分记录的交易用途

#### 主要分类列
- **主记录**: 显示主要分类
- **拆分记录**: 显示拆分记录的主要分类（支持层级推断）

#### 操作列
- **主记录**: 显示编辑、拆分、删除按钮
- **拆分记录**: 显示 "-"

### 4. 选择功能优化

修改了 `rowSelection` 配置，禁用拆分记录的选择：

```typescript
const rowSelection = {
  selectedRowKeys: selectedTransactions,
  onChange: handleSelectChange,
  getCheckboxProps: (record: any) => ({
    name: record.id,
    disabled: record.isSplitRecord, // 禁用拆分记录的选择
  }),
};
```

### 5. 移除展开功能

移除了 `expandable` 配置和 `renderSplitRecords` 函数，因为拆分记录现在直接显示在表格中。

## 🎯 功能特点

### 1. 直观显示
- 拆分记录直接显示在表格中
- 通过"类型"列清楚区分主记录和拆分记录
- 无需点击展开即可查看所有信息

### 2. 信息完整性
- 拆分记录显示完整的分类信息
- 支持层级推断确保分类信息完整
- 保持与主记录一致的数据结构

### 3. 用户体验优化
- 减少了用户操作步骤
- 提高了信息可见性
- 简化了界面交互

### 4. 数据一致性
- 拆分记录与主记录保持关联
- 分类信息通过层级推断保持一致
- 选择功能只针对主记录

## 📊 显示效果

### 表格结构
```
| 类型 | 交易日期 | 主描述 | 副描述 | 支出 | 收入 | 余额 | 付款人/收款人 | 业务分类 | 交易用途 | 主要分类 | 操作 |
|------|----------|--------|--------|------|------|------|---------------|----------|----------|----------|------|
| 主记录 | 01-Jan-2024 | 交易描述 | 副描述 | RM 1000 | - | RM 5000 | 张三 | 业务分类A | 具体用途1 | 主要分类A | [编辑][拆分][删除] |
| 拆分 | - | 拆分描述1 | 备注1 | RM 500 | - | - | 张三 | 业务分类A | 具体用途1 | 主要分类A | - |
| 拆分 | - | 拆分描述2 | 备注2 | RM 500 | - | - | 张三 | 业务分类B | 具体用途2 | 主要分类B | - |
```

### 颜色方案
- **主记录**: 绿色标签
- **拆分记录**: 蓝色标签
- **业务分类**: 绿色标签
- **交易用途**: 蓝色标签
- **主要分类**: 紫色标签

## 🔍 技术实现细节

### 1. 数据标识
```typescript
// 主记录标识
isMainRecord: true,
isSplitRecord: false,

// 拆分记录标识
isMainRecord: false,
isSplitRecord: true,
parentTransactionId: transaction.id,
```

### 2. 层级推断逻辑
```typescript
// 业务分类推断
if (purpose.level === 2 && purpose.parentId) {
  const businessCategory = purposes.find(p => p.id === purpose.parentId);
  return businessCategory ? (
    <Tag color="green">{businessCategory.name}</Tag>
  ) : '-';
}

// 主要分类推断
if (purpose.level === 2 && purpose.parentId) {
  const businessCategory = purposes.find(p => p.id === purpose.parentId);
  if (businessCategory && businessCategory.parentId) {
    const mainCategory = purposes.find(p => p.id === businessCategory.parentId);
    return mainCategory ? (
      <Tag color="purple">{mainCategory.name}</Tag>
    ) : '-';
  }
}
```

### 3. 条件渲染
```typescript
render: (value: any, record: any) => {
  if (record.isSplitRecord) {
    // 拆分记录的显示逻辑
    return <SplitRecordDisplay />;
  }
  // 主记录的显示逻辑
  return <MainRecordDisplay />;
}
```

## ✅ 功能验证

### 测试场景
1. **无拆分记录**: 只显示主记录
2. **有拆分记录**: 显示主记录和所有拆分记录
3. **分类信息**: 验证拆分记录的分类信息正确显示
4. **选择功能**: 验证只能选择主记录
5. **操作功能**: 验证操作按钮只对主记录有效

### 验证方法
1. 创建交易记录并拆分
2. 查看表格显示
3. 确认拆分记录直接显示
4. 验证分类信息正确
5. 测试选择功能
6. 测试操作功能

## 📁 修改的文件

- `src/components/TransactionManagement.tsx` - 主要修改文件

## 🎉 功能完成

拆分记录直接显示功能已成功实现，现在用户可以：
- 直接查看所有拆分记录
- 清楚区分主记录和拆分记录
- 查看完整的分类信息
- 享受更直观的用户体验

这个功能大大提升了数据的可见性和用户体验！
