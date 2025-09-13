# 拆分记录编辑模式功能恢复

## 📋 功能需求

恢复对于已拆分的交易记录，再次点击拆分便是编辑其拆分记录的功能。

## 🔧 实现方案

### 1. 接口扩展

**文件**: `src/components/TransactionSplitModal.tsx`

```typescript
interface TransactionSplitModalProps {
  visible: boolean;
  transaction: Transaction | null;
  purposes: TransactionPurpose[];
  existingSplits?: TransactionSplit[]; // 现有的拆分记录 ✅
  onCancel: () => void;
  onSplit: (transactionId: string, splits: Omit<TransactionSplit, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}
```

### 2. 层级推断函数

添加了 `inferPurposeHierarchy` 函数来根据交易用途ID推断层级信息：

```typescript
const inferPurposeHierarchy = (purposeId: string) => {
  const purpose = purposes.find(p => p.id === purposeId);
  if (!purpose) {
    return { mainCategory: '', businessCategory: '' };
  }

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

### 3. 初始化逻辑修改

修改了 `useEffect` 来支持编辑模式：

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
          projectAccount: split.projectAccount || '',
          description: split.description || '',
          notes: split.notes || '',
          mainCategory: hierarchy.mainCategory,
          businessCategory: hierarchy.businessCategory,
          specificPurpose: split.transactionPurpose || ''
        };
      });
      setSplits(loadedSplits);
      // 使用 setTimeout 确保状态更新后再设置表单值
      setTimeout(() => {
        form.setFieldsValue({ splits: loadedSplits });
      }, 100);
    } else {
      // 新建模式：默认拆分为2项
      const defaultSplits = [
        { 
          amount: 0, 
          transactionPurpose: '', 
          projectAccount: '', 
          description: '', 
          notes: '',
          mainCategory: '',
          businessCategory: '',
          specificPurpose: ''
        },
        { 
          amount: 0, 
          transactionPurpose: '', 
          projectAccount: '', 
          description: '', 
          notes: '',
          mainCategory: '',
          businessCategory: '',
          specificPurpose: ''
        }
      ];
      setSplits(defaultSplits);
      form.setFieldsValue({ splits: defaultSplits });
    }
  }
}, [visible, transaction, form, existingSplits]);
```

### 4. 动态标题和消息

根据编辑模式动态显示标题和成功消息：

```typescript
const isEditMode = existingSplits.length > 0;

// 模态框标题
<Modal
  title={
    <Space>
      <SplitCellsOutlined />
      <span>{isEditMode ? '编辑拆分记录' : '拆分交易记录'}</span>
    </Space>
  }
  // ...
>

// 成功消息
message.success(existingSplits.length > 0 ? '拆分记录更新成功' : '交易拆分成功');
```

### 5. 数据传递

在 `TransactionManagement` 组件中传递现有拆分记录：

```typescript
<TransactionSplitModal
  visible={isSplitModalVisible}
  transaction={splittingTransaction}
  purposes={purposes}
  existingSplits={splittingTransaction ? transactionSplits.filter(split => split.transactionId === splittingTransaction.id) : []}
  onCancel={handleSplitModalCancel}
  onSplit={handleSplitTransactionConfirm}
/>
```

## 🎯 功能特点

### 1. 智能模式检测
- 自动检测是否存在现有拆分记录
- 根据检测结果切换到编辑模式或新建模式

### 2. 数据预填充
- 编辑模式下自动加载现有拆分记录
- 通过层级推断恢复级联选择状态
- 保持所有字段的完整性

### 3. 用户体验优化
- 动态标题显示当前操作类型
- 相应的成功消息提示
- 保持界面的一致性

### 4. 数据完整性
- 确保所有拆分记录字段正确加载
- 维护级联选择的逻辑关系
- 支持修改和新增拆分项

## 🔄 工作流程

### 1. 新建拆分记录
1. 用户点击"拆分"按钮
2. 系统检测到无现有拆分记录
3. 显示"拆分交易记录"标题
4. 初始化2个空的拆分项
5. 用户填写拆分信息
6. 保存后显示"交易拆分成功"

### 2. 编辑拆分记录
1. 用户点击"拆分"按钮
2. 系统检测到存在拆分记录
3. 显示"编辑拆分记录"标题
4. 加载现有拆分记录数据
5. 通过层级推断恢复级联选择状态
6. 用户修改拆分信息
7. 保存后显示"拆分记录更新成功"

## 📊 层级推断逻辑

### 3层级交易用途体系
```
0级目录（主要分类）
├── 1级目录（业务分类）
│   └── 2级目录（具体用途）
```

### 推断规则
- **2级目录（具体用途）**: 向上查找业务分类和主要分类
- **1级目录（业务分类）**: 向上查找主要分类
- **0级目录（主要分类）**: 直接使用该分类

## 🔍 技术实现细节

### 1. 状态管理
```typescript
const [splits, setSplits] = useState<Array<{
  amount: number;
  transactionPurpose?: string;
  projectAccount?: string;
  description?: string;
  notes?: string;
  mainCategory?: string;
  businessCategory?: string;
  specificPurpose?: string;
}>>([]);
```

### 2. 数据加载
```typescript
const loadedSplits = existingSplits.map(split => {
  const hierarchy = inferPurposeHierarchy(split.transactionPurpose || '');
  return {
    amount: split.amount,
    transactionPurpose: split.transactionPurpose || '',
    projectAccount: split.projectAccount || '',
    description: split.description || '',
    notes: split.notes || '',
    mainCategory: hierarchy.mainCategory,
    businessCategory: hierarchy.businessCategory,
    specificPurpose: split.transactionPurpose || ''
  };
});
```

### 3. 表单同步
```typescript
setTimeout(() => {
  form.setFieldsValue({ splits: loadedSplits });
}, 100);
```

## ✅ 功能验证

### 测试场景
1. **新建拆分记录**: 显示"拆分交易记录"标题，初始化2个空项
2. **编辑拆分记录**: 显示"编辑拆分记录"标题，加载现有数据
3. **级联选择恢复**: 验证主要分类、业务分类、具体用途正确恢复
4. **数据完整性**: 验证所有字段正确加载和保存

### 验证方法
1. 创建交易记录并拆分
2. 再次点击"拆分"按钮
3. 确认显示"编辑拆分记录"标题
4. 确认现有拆分记录正确加载
5. 确认级联选择状态正确恢复
6. 修改拆分记录并保存
7. 确认显示"拆分记录更新成功"消息

## 📁 修改的文件

- `src/components/TransactionSplitModal.tsx` - 主要修改文件
- `src/components/TransactionManagement.tsx` - 数据传递修改

## 🎉 功能完成

拆分记录编辑模式功能已成功恢复，现在用户可以：
- 对已拆分的交易记录进行编辑
- 自动加载现有拆分记录数据
- 通过层级推断恢复级联选择状态
- 享受完整的编辑体验

这个功能提升了系统的易用性和数据管理能力！
