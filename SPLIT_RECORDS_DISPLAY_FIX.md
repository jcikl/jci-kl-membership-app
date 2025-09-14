# 拆分记录显示业务分类和主要分类修复

## 📋 问题描述

拆分记录在展开显示时，没有正确显示业务分类和主要分类信息，只显示了交易用途名称。

## 🔧 解决方案

### 1. 分析数据结构

拆分记录 (`TransactionSplit`) 包含以下相关字段：
- `transactionType`: 主要分类ID（从主交易记录复制）
- `projectAccount`: 业务分类ID（从主交易记录复制）
- `transactionPurpose`: 交易用途ID
- `purposeName`: 交易用途名称

### 2. 实现层级推断逻辑

参考主交易记录的读写编码，实现了根据交易用途推断层级信息的逻辑：

#### 主要分类推断逻辑
```typescript
// 优先使用存储的主要分类
if (typeId) {
  const purpose = purposes.find(p => p.id === typeId);
  return purpose ? <Tag color="purple">{purpose.name}</Tag> : '-';
}

// 如果没有存储的主要分类，根据交易用途推断
if (record.transactionPurpose) {
  const purpose = purposes.find(p => p.id === record.transactionPurpose);
  if (purpose) {
    if (purpose.level === 2 && purpose.parentId) {
      // 具体用途，找到其父级（业务分类）的父级（主要分类）
      const businessCategory = purposes.find(p => p.id === purpose.parentId);
      if (businessCategory && businessCategory.parentId) {
        const mainCategory = purposes.find(p => p.id === businessCategory.parentId);
        return mainCategory ? <Tag color="purple">{mainCategory.name}</Tag> : '-';
      }
    } else if (purpose.level === 1 && purpose.parentId) {
      // 业务分类，找到其父级（主要分类）
      const mainCategory = purposes.find(p => p.id === purpose.parentId);
      return mainCategory ? <Tag color="purple">{mainCategory.name}</Tag> : '-';
    } else if (purpose.level === 0) {
      // 主要分类
      return <Tag color="purple">{purpose.name}</Tag>;
    }
  }
}
```

#### 业务分类推断逻辑
```typescript
// 优先使用存储的业务分类
if (businessCategoryId) {
  const purpose = purposes.find(p => p.id === businessCategoryId);
  return purpose ? <Tag color="green">{purpose.name}</Tag> : '-';
}

// 如果没有存储的业务分类，根据交易用途推断
if (record.transactionPurpose) {
  const purpose = purposes.find(p => p.id === record.transactionPurpose);
  if (purpose) {
    if (purpose.level === 2 && purpose.parentId) {
      // 具体用途，找到其父级（业务分类）
      const businessCategory = purposes.find(p => p.id === purpose.parentId);
      return businessCategory ? <Tag color="green">{businessCategory.name}</Tag> : '-';
    } else if (purpose.level === 1) {
      // 业务分类
      return <Tag color="green">{purpose.name}</Tag>;
    }
  }
}
```

### 3. 更新表格列定义

在 `renderSplitRecords` 函数中更新了表格列定义：

#### 修复前
```typescript
{
  title: '业务分类',
  dataIndex: 'projectAccount',
  key: 'projectAccount',
  width: 120,
  render: (businessCategoryId: string) => {
    const purpose = purposes.find(p => p.id === businessCategoryId);
    return purpose ? (
      <Tag color="green">{purpose.name}</Tag>
    ) : '-';
  },
},
```

#### 修复后
```typescript
{
  title: '主要分类',
  dataIndex: 'transactionType',
  key: 'transactionType',
  width: 120,
  render: (typeId: string, record: TransactionSplit) => {
    // 优先使用存储的主要分类，如果没有则根据交易用途推断
    // ... 推断逻辑
  },
},
{
  title: '业务分类',
  dataIndex: 'projectAccount',
  key: 'projectAccount',
  width: 120,
  render: (businessCategoryId: string, record: TransactionSplit) => {
    // 优先使用存储的业务分类，如果没有则根据交易用途推断
    // ... 推断逻辑
  },
},
```

## 📁 修改的文件

- `src/components/TransactionManagement.tsx` - 主要修复文件

## 🎯 修复效果

### 修复前
- 拆分记录只显示交易用途名称
- 没有显示主要分类和业务分类信息
- 用户无法清楚了解拆分记录的完整分类信息

### 修复后
- 拆分记录正确显示主要分类（紫色标签）
- 拆分记录正确显示业务分类（绿色标签）
- 拆分记录正确显示交易用途（紫色标签）
- 用户可以清楚了解每个拆分记录的完整分类层级

## 🔍 层级推断规则

### 3层级交易用途体系
```
0级目录（主要分类）
├── 1级目录（业务分类）
│   └── 2级目录（具体用途）
```

### 推断优先级
1. **优先使用存储的分类信息**：如果拆分记录中存储了 `transactionType` 或 `projectAccount`
2. **根据交易用途推断**：如果没有存储的分类信息，根据 `transactionPurpose` 推断层级
3. **显示默认值**：如果无法推断，显示 "-"

## ⚠️ 注意事项

### 1. 数据一致性
- 修复后的代码优先使用存储的分类信息
- 只有在存储信息缺失时才进行推断
- 确保显示的分类信息准确可靠

### 2. 性能考虑
- 层级推断在客户端进行
- 对于大量拆分记录，可能需要优化性能
- 建议在服务端存储完整的分类信息

### 3. 向后兼容
- 修复后的代码向后兼容
- 不会影响现有数据的显示
- 新功能与原有功能保持一致

## 🔄 验证方法

1. 启动开发服务器：`npm run dev`
2. 访问交易管理页面
3. 找到有拆分记录的交易
4. 点击展开按钮查看拆分记录
5. 确认主要分类、业务分类、交易用途都正确显示

这个修复确保了拆分记录能够正确显示完整的分类信息，提升了用户体验和数据可读性。
