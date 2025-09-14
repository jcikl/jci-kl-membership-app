# Firebase undefined 字段修复说明

## 🚨 问题描述

Firebase Firestore 不支持 `undefined` 值作为字段值。当尝试保存包含 `undefined` 字段的文档时，会出现以下错误：

```
FirebaseError: Function updateDoc() called with invalid data. 
Unsupported field value: undefined (found in field category in document transaction_purposes/xxx)
```

## 🔧 解决方案

### 1. 条件字段添加
只有当字段有值时才添加到数据对象中，避免传递 `undefined` 值：

```typescript
const purposeData: any = {
  name: values.name,
  description: values.description || '',
  level: level,
  isActive: values.isActive !== undefined ? values.isActive : true,
  createdBy: user?.uid || 'unknown-user',
};

// 只有当parentId有值时才添加到数据中
if (parentId) {
  purposeData.parentId = parentId;
}

// 只有当category有值时才添加到数据中
if (values.category) {
  purposeData.category = values.category;
}
```

### 2. 批量创建修复
同样适用于批量创建操作：

```typescript
// 批量创建主要分类
const data: any = {
  name: purposeData.name,
  description: purposeData.description || '',
  level: 0,
  isActive: true,
  createdBy: user?.uid || 'unknown-user',
};

// 主要分类没有父目录，不设置parentId字段

// 只有当category有值时才添加到数据中
if (purposeData.category) {
  data.category = purposeData.category;
}
```

## 📋 修复的字段

### 1. parentId 字段
- **问题**：当创建0级目录时，`parentId` 为 `undefined`
- **解决**：只有当 `parentId` 有值时才添加到数据中
- **影响**：0级目录不会包含 `parentId` 字段

### 2. category 字段
- **问题**：当不选择业务分类时，`category` 为 `undefined`
- **解决**：只有当 `category` 有值时才添加到数据中
- **影响**：没有业务分类的记录不会包含 `category` 字段

## 🏗️ 数据模型

### 0级目录（主要分类）
```typescript
{
  name: "收入类",
  description: "所有收入相关的交易用途",
  level: 0,
  isActive: true,
  createdBy: "user-id",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z"
  // 不包含 parentId 和 category 字段
}
```

### 1级目录（业务分类）
```typescript
{
  name: "会员费",
  description: "会员相关的费用收入",
  parentId: "main-category-id", // 主要分类ID
  level: 1,
  isActive: true,
  createdBy: "user-id",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z"
  // 不包含 category 字段
}
```

### 2级目录（具体用途）
```typescript
{
  name: "2025新会员费",
  description: "2025年新会员费用",
  parentId: "business-category-id", // 业务分类ID
  category: "business-category-id", // 业务分类ID（用于筛选）
  level: 2,
  isActive: true,
  createdBy: "user-id",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-01T00:00:00Z"
}
```

## ⚠️ 注意事项

### 1. Firebase 限制
- Firebase 不支持 `undefined` 值
- 字段要么有值，要么不存在
- 使用 `null` 值需要明确设置

### 2. 数据一致性
- 确保层级关系正确
- 验证 `parentId` 引用的记录存在
- 保持数据完整性

### 3. 查询优化
- 查询时需要考虑字段可能不存在
- 使用适当的查询条件
- 避免依赖不存在的字段

## 🔍 调试技巧

### 1. 检查数据对象
```typescript
console.log('保存的数据:', purposeData);
// 确保没有 undefined 值
```

### 2. 验证字段存在性
```typescript
// 检查字段是否存在
if (purposeData.parentId !== undefined) {
  console.log('parentId:', purposeData.parentId);
}
```

### 3. Firebase 规则
确保 Firestore 规则允许这些字段：
```javascript
// firestore.rules
match /transaction_purposes/{document} {
  allow read, write: if request.auth != null;
}
```

## 📞 技术支持

如果仍然遇到问题，请检查：
1. 数据对象中是否包含 `undefined` 值
2. Firebase 规则是否正确配置
3. 网络连接是否正常
4. 用户权限是否正确

---

**最后更新**: 2025年1月
**版本**: 1.0.0
**维护者**: JCI KL 财务管理系统团队
