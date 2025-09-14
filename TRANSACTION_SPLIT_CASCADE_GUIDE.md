# 拆分交易记录级联选择功能指南

## 📋 功能概述

拆分交易记录弹出窗口现在支持3层级级联选择功能，用户可以通过主要分类 → 业务分类 → 具体用途的层级结构来快速选择交易用途。

**编辑模式**：对于已拆分的交易记录，再次点击拆分按钮将进入编辑模式，显示现有的拆分记录供用户修改。

## 🏗️ 功能结构

### 1. 主要分类下拉（Level 0）
- **位置**：拆分记录的第一行，第一个下拉框
- **数据来源**：所有 `level === 0` 的交易用途记录
- **功能**：选择主要分类后，会清空业务分类和具体用途的选择

### 2. 业务分类下拉（Level 1）
- **位置**：拆分记录的第一行，第二个下拉框
- **数据来源**：根据选择的主要分类筛选 `level === 1` 且 `parentId` 匹配的交易用途记录
- **功能**：选择业务分类后，会清空具体用途的选择
- **状态**：只有选择了主要分类后才能使用

### 3. 具体用途下拉（Level 2）
- **位置**：拆分记录的第一行，第三个下拉框
- **数据来源**：根据选择的业务分类筛选 `level === 2` 且 `parentId` 匹配的交易用途记录
- **功能**：选择具体用途后，会自动设置 `transactionPurpose` 和 `purposeName`
- **状态**：只有选择了业务分类后才能使用

## 🔧 技术实现

### 数据结构更新
```typescript
interface SplitItem {
  amount: number;
  transactionPurpose?: string;
  purposeName?: string;
  projectAccount?: string;
  description?: string;
  notes?: string;
  mainCategory?: string;     // 新增：主要分类
  businessCategory?: string;  // 新增：业务分类
  specificPurpose?: string;  // 新增：具体用途
}
```

### 级联选择逻辑
```typescript
// 主要分类变化时
const handleMainCategoryChange = (value: string, index: number) => {
  // 清空下级选择
  businessCategory: '',
  specificPurpose: '',
  transactionPurpose: '',
  purposeName: ''
};

// 业务分类变化时
const handleBusinessCategoryChange = (value: string, index: number) => {
  // 清空下级选择
  specificPurpose: '',
  transactionPurpose: '',
  purposeName: ''
};

// 具体用途变化时
const handleSpecificPurposeChange = (value: string, index: number) => {
  // 自动设置交易用途
  transactionPurpose: value,
  purposeName: purpose?.name || ''
};
```

### 数据筛选函数
```typescript
// 获取主要分类选项（0级目录）
const getMainCategoryOptions = () => {
  return purposes
    .filter(purpose => purpose.level === 0)
    .map(purpose => ({ value: purpose.id, label: purpose.name }));
};

// 获取业务分类选项（1级目录，根据主要分类筛选）
const getBusinessCategoryOptions = (mainCategoryId: string) => {
  return purposes
    .filter(purpose => purpose.level === 1 && purpose.parentId === mainCategoryId)
    .map(purpose => ({ value: purpose.id, label: purpose.name }));
};

// 获取具体用途选项（2级目录，根据业务分类筛选）
const getSpecificPurposeOptions = (businessCategoryId: string) => {
  return purposes
    .filter(purpose => purpose.level === 2 && purpose.parentId === businessCategoryId)
    .map(purpose => ({ value: purpose.id, label: purpose.name }));
};

// 根据交易用途ID推断层级信息（用于编辑模式）
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

## 🎯 使用流程

### 1. 新建拆分流程
```
点击拆分按钮 → 选择主要分类 → 业务分类下拉激活 → 选择业务分类 → 具体用途下拉激活 → 选择具体用途 → 自动设置交易用途 → 保存拆分
```

### 2. 编辑拆分流程
```
点击已拆分交易的拆分按钮 → 加载现有拆分记录 → 显示推断的层级信息 → 修改拆分记录 → 保存更新
```

### 3. 级联选择流程
```
选择主要分类 → 业务分类下拉激活 → 选择业务分类 → 具体用途下拉激活 → 选择具体用途 → 自动设置交易用途
```

### 4. 备选方案
如果级联选择无法满足需求，用户仍可以直接使用"交易用途（备选）"下拉框选择任何交易用途。

### 5. 验证规则
- 每个拆分项必须至少选择一个交易用途（通过级联选择或直接选择）
- **剩余金额必须等于0才能保存** - 拆分金额总和必须完全等于原交易金额
- **任意拆分记录的金额不可等于0** - 所有拆分金额都必须大于0
- 至少需要保留2个拆分项

## 📱 用户界面

### 布局结构
```
┌─────────────────────────────────────────────────────────┐
│ #1  [拆分金额] [删除按钮]                                │
├─────────────────────────────────────────────────────────┤
│ [主要分类] [业务分类] [具体用途]                         │
├─────────────────────────────────────────────────────────┤
│ [交易用途（备选）] [项目户口]                           │
├─────────────────────────────────────────────────────────┤
│ [拆分描述] [备注]                                       │
└─────────────────────────────────────────────────────────┘
```

### 交互特性
- **级联禁用**：下级选择框在上级未选择时自动禁用
- **自动清空**：上级选择变化时自动清空下级选择
- **搜索功能**：所有下拉框都支持搜索功能
- **清除功能**：所有下拉框都支持清除选择

## ⚠️ 注意事项

### 1. 数据一致性
- 级联选择会自动设置 `transactionPurpose` 和 `purposeName`
- 直接选择交易用途会覆盖级联选择的结果
- 建议优先使用级联选择，确保数据层级的一致性

### 2. 金额验证
- **严格验证**：剩余金额必须等于0才能保存
- **非零验证**：所有拆分记录的金额都必须大于0
- **实时显示**：界面会实时显示剩余金额，帮助用户调整拆分
- **精确计算**：使用0.01的容差来处理浮点数精度问题

### 3. 性能考虑
- 数据筛选在客户端进行，适合中小规模数据
- 如果交易用途数据量很大，建议考虑服务端筛选

### 4. 兼容性
- 保留了原有的直接选择交易用途功能
- 现有数据不会受到影响
- 新功能向后兼容

## 🔄 更新历史

- **2025-01-10**: 初始实现3层级级联选择功能
  - 添加主要分类、业务分类、具体用途三个下拉选择
  - 实现级联选择逻辑和状态管理
  - 保持与原有功能的兼容性
- **2025-01-10**: 强化金额验证规则
  - 修改验证逻辑，确保剩余金额必须等于0才能保存
  - 添加非零验证，确保所有拆分记录的金额都必须大于0
  - 更新错误提示信息，更清晰地显示剩余金额
  - 保持0.01的容差来处理浮点数精度问题
- **2025-01-10**: 添加编辑拆分记录功能
  - 对于已拆分的交易记录，再次点击拆分按钮进入编辑模式
  - 自动加载现有拆分记录并推断层级信息
  - 更新模态框标题和成功消息以反映编辑模式
  - 保持所有验证规则在编辑模式下同样有效
