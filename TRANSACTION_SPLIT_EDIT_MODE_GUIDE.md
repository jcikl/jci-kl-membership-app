# 拆分交易记录编辑模式功能指南

## 📋 功能概述

对于已经拆分的交易记录，系统现在支持编辑模式。当用户再次点击拆分按钮时，系统会自动进入编辑模式，加载现有的拆分记录供用户修改。

## 🔧 技术实现

### 1. 接口更新
```typescript
interface TransactionSplitModalProps {
  visible: boolean;
  transaction: Transaction | null;
  purposes: TransactionPurpose[];
  existingSplits?: TransactionSplit[]; // 新增：现有的拆分记录
  onCancel: () => void;
  onSplit: (transactionId: string, splits: Omit<TransactionSplit, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}
```

### 2. 编辑模式检测
```typescript
const isEditMode = existingSplits.length > 0;
```

### 3. 层级信息推断
```typescript
// 根据交易用途ID推断层级信息
const inferPurposeHierarchy = (purposeId: string) => {
  const purpose = purposes.find(p => p.id === purposeId);
  if (!purpose) return { mainCategory: '', businessCategory: '' };

  if (purpose.level === 2) {
    // 2级目录：具体用途
    const businessCategory = purposes.find(p => p.id === purpose.parentId);
    const mainCategory = businessCategory ? purposes.find(p => p.id === businessCategory.parentId) : null;
    return {
      mainCategory: mainCategory?.id || '',
      businessCategory: businessCategory?.id || ''
    };
  } else if (purpose.level === 1) {
    // 1级目录：业务分类
    const mainCategory = purposes.find(p => p.id === purpose.parentId);
    return {
      mainCategory: mainCategory?.id || '',
      businessCategory: purpose.id
    };
  } else if (purpose.level === 0) {
    // 0级目录：主要分类
    return {
      mainCategory: purpose.id,
      businessCategory: ''
    };
  }

  return { mainCategory: '', businessCategory: '' };
};
```

### 4. 数据加载逻辑
```typescript
useEffect(() => {
  if (visible && transaction) {
    if (existingSplits.length > 0) {
      // 编辑模式：加载现有拆分记录
      const loadedSplits = existingSplits.map(split => {
        const hierarchy = inferPurposeHierarchy(split.transactionPurpose || '');
        return {
          amount: split.amount,
          transactionPurpose: split.transactionPurpose || '',
          purposeName: split.purposeName || '',
          projectAccount: split.projectAccount || '',
          description: split.description || '',
          notes: split.notes || '',
          mainCategory: hierarchy.mainCategory,
          businessCategory: hierarchy.businessCategory,
          specificPurpose: split.transactionPurpose || ''
        };
      });
      setSplits(loadedSplits);
      form.setFieldsValue({ splits: loadedSplits });
    } else {
      // 新建模式：默认拆分为2项
      // ... 新建逻辑
    }
  }
}, [visible, transaction, form, existingSplits]);
```

## 🎯 用户界面变化

### 1. 模态框标题
- **新建模式**：`拆分交易记录`
- **编辑模式**：`编辑拆分记录`

### 2. 成功消息
- **新建模式**：`交易拆分成功`
- **编辑模式**：`拆分记录更新成功`

### 3. 数据加载
- **新建模式**：显示2个空的拆分项
- **编辑模式**：显示现有的拆分记录，并自动推断层级信息

## 🔍 层级信息推断逻辑

### 推断规则
1. **2级目录（具体用途）**
   - `mainCategory` = 父级业务分类的父级主要分类
   - `businessCategory` = 父级业务分类

2. **1级目录（业务分类）**
   - `mainCategory` = 父级主要分类
   - `businessCategory` = 当前业务分类

3. **0级目录（主要分类）**
   - `mainCategory` = 当前主要分类
   - `businessCategory` = 空

### 推断示例
```
交易用途：2025新会员费 (level: 2)
├── 业务分类：会员费 (level: 1, parentId: 收入类)
└── 主要分类：收入类 (level: 0)

推断结果：
- mainCategory: 收入类
- businessCategory: 会员费
- specificPurpose: 2025新会员费
```

## 📱 用户体验

### 1. 无缝切换
- 用户无需区分新建和编辑模式
- 系统自动检测并应用相应的模式

### 2. 数据保持
- 编辑模式下保持所有现有数据
- 自动推断层级信息，用户无需重新选择

### 3. 验证一致
- 编辑模式下应用相同的验证规则
- 确保数据完整性和准确性

## ⚠️ 注意事项

### 1. 数据一致性
- 编辑模式下会重新保存所有拆分记录
- 原有的拆分记录会被完全替换

### 2. 层级推断限制
- 只能推断已存在的交易用途的层级信息
- 如果交易用途不存在或层级结构不完整，推断可能失败

### 3. 性能考虑
- 层级推断在客户端进行
- 对于大量拆分记录，可能需要优化性能

## 🔄 使用流程

### 编辑拆分记录流程
1. 用户点击已拆分交易的拆分按钮
2. 系统检测到现有拆分记录，进入编辑模式
3. 加载现有拆分记录数据
4. 根据交易用途ID推断层级信息
5. 在表单中显示推断的层级信息
6. 用户修改拆分记录
7. 应用所有验证规则
8. 保存更新后的拆分记录

### 与新建模式的区别
- **数据来源**：现有拆分记录 vs 空记录
- **标题显示**：编辑拆分记录 vs 拆分交易记录
- **成功消息**：拆分记录更新成功 vs 交易拆分成功
- **初始化**：加载现有数据 vs 创建默认数据

## 📊 功能对比

| 功能 | 新建模式 | 编辑模式 |
|------|---------|---------|
| 触发条件 | 未拆分的交易 | 已拆分的交易 |
| 模态框标题 | 拆分交易记录 | 编辑拆分记录 |
| 初始数据 | 2个空拆分项 | 现有拆分记录 |
| 层级信息 | 用户选择 | 自动推断 |
| 成功消息 | 交易拆分成功 | 拆分记录更新成功 |
| 验证规则 | 完整验证 | 完整验证 |

这个编辑模式功能大大提升了用户体验，使得拆分记录的修改变得更加直观和便捷。
