# 拆分交易记录验证规则增强

## 📋 更新概述

根据用户需求，已对拆分交易记录弹出窗口的验证规则进行了强化，确保数据的完整性和准确性。

## 🔧 新增验证规则

### 1. 剩余金额必须等于0
- **验证逻辑**：拆分金额总和必须完全等于原交易金额
- **容差处理**：使用0.01的容差来处理浮点数精度问题
- **错误提示**：`剩余金额必须等于0才能保存。当前剩余金额：RM X.XX`

### 2. 任意拆分记录的金额不可等于0
- **验证逻辑**：所有拆分记录的金额都必须大于0
- **表单验证**：在表单字段级别添加了 `min: 0.01` 验证
- **错误提示**：`所有拆分记录的金额都必须大于0`

## 🎯 技术实现

### 验证函数更新
```typescript
const handleOk = async () => {
  try {
    await form.validateFields();
    
    // 验证拆分金额总和 - 剩余金额必须等于0
    const totalAmount = calculateTotalAmount();
    const transactionTotal = transaction ? transaction.expense + transaction.income : 0;
    const remainingAmount = transactionTotal - totalAmount;
    
    if (Math.abs(remainingAmount) > 0.01) {
      message.error(`剩余金额必须等于0才能保存。当前剩余金额：RM ${remainingAmount.toFixed(2)}`);
      return;
    }

    // 验证任意拆分记录的金额不可等于0
    const hasZeroAmount = splits.some(split => split.amount <= 0);
    if (hasZeroAmount) {
      message.error('所有拆分记录的金额都必须大于0');
      return;
    }

    // 验证必填字段 - 至少需要选择交易用途
    const hasEmptyPurpose = splits.some(split => !split.transactionPurpose);
    if (hasEmptyPurpose) {
      message.error('所有拆分项都必须选择交易用途（可通过级联选择或直接选择）');
      return;
    }

    // ... 继续处理拆分数据
  } catch (error) {
    message.error('拆分失败');
  }
};
```

### 表单字段验证更新
```typescript
<Form.Item
  name={['splits', index, 'amount']}
  label="拆分金额"
  rules={[
    { required: true, message: '请输入拆分金额' },
    { type: 'number', min: 0.01, message: '拆分金额必须大于0' }
  ]}
>
  <InputNumber
    style={{ width: '100%' }}
    placeholder="0.00"
    precision={2}
    min={0.01}  // 设置最小值为0.01
    value={split.amount}
    onChange={(value) => handleAmountChange(value, index)}
    prefix="RM"
  />
</Form.Item>
```

## 📱 用户体验改进

### 1. 实时反馈
- 界面实时显示剩余金额，帮助用户调整拆分
- 剩余金额为0时显示绿色，不为0时显示红色

### 2. 清晰的错误提示
- 具体的错误信息，告诉用户当前剩余金额
- 明确的验证规则说明

### 3. 表单级验证
- 在输入时就防止用户输入无效值
- 提供即时反馈，避免提交时才发现错误

## 🔍 验证流程

### 完整的验证顺序
1. **表单字段验证**：检查必填字段和数据类型
2. **剩余金额验证**：确保拆分金额总和等于原交易金额
3. **非零金额验证**：确保所有拆分记录金额都大于0
4. **交易用途验证**：确保所有拆分项都选择了交易用途

### 验证失败处理
- 显示具体的错误信息
- 阻止保存操作
- 保持用户已输入的数据
- 引导用户修正错误

## ⚠️ 注意事项

### 1. 浮点数精度
- 使用0.01的容差来处理JavaScript浮点数精度问题
- 确保验证逻辑的准确性

### 2. 用户体验
- 验证失败时保持用户已输入的数据
- 提供清晰的错误提示和修正指导

### 3. 数据完整性
- 确保拆分数据的完整性和准确性
- 防止无效数据的保存

## 🔄 更新历史

- **2025-01-10**: 强化金额验证规则
  - 添加剩余金额必须等于0的验证
  - 添加非零金额验证，确保所有拆分记录金额都大于0
  - 更新表单字段验证规则
  - 改进错误提示信息
  - 保持0.01的容差来处理浮点数精度问题

## 📊 验证规则总结

| 验证项目 | 规则 | 错误提示 |
|---------|------|----------|
| 剩余金额 | 必须等于0 | `剩余金额必须等于0才能保存。当前剩余金额：RM X.XX` |
| 拆分金额 | 必须大于0 | `所有拆分记录的金额都必须大于0` |
| 交易用途 | 必须选择 | `所有拆分项都必须选择交易用途` |
| 拆分项数 | 至少2项 | `至少需要保留2个拆分项` |

这些验证规则确保了拆分交易记录的数据质量和完整性，提供了更好的用户体验和数据准确性。
