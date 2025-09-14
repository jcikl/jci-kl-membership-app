# 拆分记录编辑限制功能实现

## 📋 功能需求

当交易记录存在拆分记录时，禁止编辑交易记录里的主要分类、业务分类和具体用途，并显示提示信息："该交易记录已拆分，请先取消拆分以便继续编辑"。

## 🔧 实现方案

### 1. 检查逻辑

使用以下逻辑检查交易记录是否存在拆分记录：
```typescript
editingTransaction ? transactionSplits.some(split => split.transactionId === editingTransaction.id) : false
```

### 2. 主要分类限制

**文件**: `src/components/TransactionManagement.tsx`

```typescript
<Select 
  placeholder="请选择主要分类"
  disabled={editingTransaction ? transactionSplits.some(split => split.transactionId === editingTransaction.id) : false}
  onChange={(value) => {
    // 检查是否存在拆分记录
    if (editingTransaction && transactionSplits.some(split => split.transactionId === editingTransaction.id)) {
      message.warning('该交易记录已拆分，请先取消拆分以便继续编辑主要分类');
      return;
    }
    
    setSelectedMainCategory(value);
    setSelectedBusinessCategory('');
    form.setFieldsValue({ projectAccount: undefined, transactionPurpose: undefined });
  }}
>
```

### 3. 业务分类限制

```typescript
<Select 
  placeholder="请选择业务分类" 
  allowClear
  onChange={(value) => {
    // 检查是否存在拆分记录
    if (editingTransaction && transactionSplits.some(split => split.transactionId === editingTransaction.id)) {
      message.warning('该交易记录已拆分，请先取消拆分以便继续编辑业务分类');
      return;
    }
    
    setSelectedBusinessCategory(value);
    form.setFieldsValue({ transactionPurpose: undefined });
  }}
  disabled={!selectedMainCategory || (editingTransaction ? transactionSplits.some(split => split.transactionId === editingTransaction.id) : false)}
>
```

### 4. 具体用途限制

```typescript
<Select
  placeholder="请选择具体用途"
  allowClear
  disabled={!selectedBusinessCategory || (editingTransaction ? transactionSplits.some(split => split.transactionId === editingTransaction.id) : false)}
  showSearch
  optionFilterProp="children"
  style={{ width: '100%' }}
  onChange={() => {
    // 检查是否存在拆分记录
    if (editingTransaction && transactionSplits.some(split => split.transactionId === editingTransaction.id)) {
      message.warning('该交易记录已拆分，请先取消拆分以便继续编辑具体用途');
      return;
    }
  }}
>
```

## 🎯 功能特点

### 1. 双重保护机制

- **UI层面禁用**: 通过 `disabled` 属性禁用选择器
- **逻辑层面检查**: 在 `onChange` 事件中再次检查并显示警告

### 2. 用户友好的提示

- 使用 `message.warning()` 显示清晰的提示信息
- 提示用户需要先取消拆分才能继续编辑
- 针对不同字段显示相应的提示信息

### 3. 状态管理

- 检查 `editingTransaction` 是否存在
- 检查 `transactionSplits` 中是否有对应的拆分记录
- 保持原有的级联选择逻辑

## 📊 限制范围

### 受限制的字段
1. **主要分类** (`transactionType`)
2. **业务分类** (`projectAccount`) 
3. **具体用途** (`transactionPurpose`)

### 不受限制的字段
- 交易日期
- 主描述
- 副描述
- 支出金额
- 收入金额
- 付款人/收款人
- 备注
- 附件

## 🔄 工作流程

### 1. 正常编辑流程
1. 用户点击"编辑"按钮
2. 系统检查是否存在拆分记录
3. 如果不存在拆分记录，允许正常编辑所有字段
4. 用户可以修改分类信息

### 2. 拆分记录存在时的流程
1. 用户点击"编辑"按钮
2. 系统检查发现存在拆分记录
3. 主要分类、业务分类、具体用途字段被禁用
4. 用户尝试修改这些字段时显示警告信息
5. 用户需要先取消拆分才能继续编辑

### 3. 取消拆分后的流程
1. 用户取消拆分记录
2. 系统更新 `transactionSplits` 状态
3. 编辑表单中的分类字段重新启用
4. 用户可以正常编辑分类信息

## 💡 设计原则

### 1. 数据一致性
- 防止拆分记录与主交易记录的分类信息不一致
- 确保数据的完整性和准确性

### 2. 用户体验
- 提供清晰的提示信息
- 避免用户困惑和误操作
- 引导用户正确的操作流程

### 3. 系统稳定性
- 防止数据冲突
- 确保业务逻辑的正确性
- 维护系统的完整性

## 🔍 技术实现细节

### 1. 检查函数
```typescript
const hasSplits = editingTransaction ? 
  transactionSplits.some(split => split.transactionId === editingTransaction.id) : 
  false;
```

### 2. 禁用逻辑
```typescript
disabled={!selectedMainCategory || hasSplits}
```

### 3. 警告消息
```typescript
message.warning('该交易记录已拆分，请先取消拆分以便继续编辑主要分类');
```

## ✅ 功能验证

### 测试场景
1. **新建交易记录**: 所有字段可正常编辑
2. **编辑无拆分记录**: 所有字段可正常编辑
3. **编辑有拆分记录**: 分类字段被禁用，显示警告
4. **取消拆分后编辑**: 分类字段重新启用

### 验证方法
1. 创建交易记录并拆分
2. 尝试编辑该交易记录
3. 确认分类字段被禁用
4. 尝试点击分类字段，确认显示警告信息
5. 取消拆分后再次编辑，确认字段重新启用

## 📁 修改的文件

- `src/components/TransactionManagement.tsx` - 主要修改文件

## 🎉 功能完成

拆分记录编辑限制功能已成功实现，确保了数据的一致性和系统的稳定性，同时提供了良好的用户体验！
