# Ant Design Modal 弃用警告修复

## 📋 问题描述

在控制台中出现警告：
```
Warning: [antd: Modal] `destroyOnClose` is deprecated. Please use `destroyOnHidden` instead.
```

这是因为 Ant Design 在新版本中弃用了 `destroyOnClose` 属性，推荐使用 `destroyOnHidden` 替代。

## 🔧 解决方案

### 修复前
```typescript
<Modal
  open={visible}
  onOk={handleOk}
  onCancel={onCancel}
  width={800}
  destroyOnClose  // ❌ 已弃用
>
```

### 修复后
```typescript
<Modal
  open={visible}
  onOk={handleOk}
  onCancel={onCancel}
  width={800}
  destroyOnHidden  // ✅ 新属性
>
```

## 📁 修复的文件

- `src/components/TransactionSplitModal.tsx` - 拆分交易记录模态框

## 🎯 修复效果

- **修复前**：控制台显示弃用警告
- **修复后**：警告消失，功能保持不变

## ⚠️ 注意事项

1. **功能一致性**：`destroyOnHidden` 与 `destroyOnClose` 功能相同
2. **向后兼容**：不影响现有功能
3. **性能影响**：无性能影响

## 🔄 验证方法

1. 启动开发服务器：`npm run dev`
2. 打开浏览器控制台
3. 访问交易管理页面
4. 点击拆分按钮
5. 确认没有弃用警告

这个修复消除了 Ant Design Modal 的弃用警告，保持了代码的现代化和最佳实践。
