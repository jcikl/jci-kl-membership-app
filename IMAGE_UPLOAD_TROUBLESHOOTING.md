# 图片上传故障排除指南

## 问题诊断步骤

### 1. 检查浏览器控制台
打开浏览器开发者工具（F12），查看Console标签页中的错误信息：

```javascript
// 查看这些关键日志
- "开始上传图片:" - 确认上传流程开始
- "文件验证失败:" - 检查文件格式和大小
- "开始智能缩放图片..." - 确认缩放功能
- "Firebase Storage 上传开始:" - 确认Storage连接
- "上传成功，URL:" - 确认上传完成
```

### 2. 使用存储测试功能
1. 进入系统设置 → 存储测试
2. 点击"测试Storage连接"按钮
3. 查看测试结果

### 3. 检查Firebase配置

#### 环境变量检查
确保 `.env` 文件包含正确的Firebase配置：

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

#### Firebase Storage规则检查
在Firebase控制台中检查Storage规则：

```javascript
// 允许认证用户上传
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 常见错误及解决方案

### 1. "Firebase Storage 未初始化"
**原因**: Firebase Storage服务未正确初始化
**解决方案**:
- 检查Firebase配置是否正确
- 确认环境变量已加载
- 重启开发服务器

### 2. "没有权限上传图片"
**原因**: Firebase Storage规则限制
**解决方案**:
- 检查用户是否已登录
- 更新Firebase Storage规则
- 确认用户有上传权限

### 3. "用户未认证，请先登录"
**原因**: 用户未登录或认证过期
**解决方案**:
- 重新登录系统
- 检查认证状态
- 清除浏览器缓存

### 4. "存储空间不足"
**原因**: Firebase Storage配额已满
**解决方案**:
- 检查Firebase控制台存储使用情况
- 升级Firebase计划
- 清理不需要的文件

### 5. "图片缩放失败"
**原因**: Canvas API不支持或图片格式问题
**解决方案**:
- 检查浏览器是否支持Canvas
- 尝试不同格式的图片
- 检查图片文件是否损坏

## 调试步骤

### 步骤1: 基础连接测试
```javascript
// 在浏览器控制台运行
console.log('Firebase Storage:', window.firebase?.storage);
console.log('Storage实例:', storage);
```

### 步骤2: 文件验证测试
```javascript
// 测试文件验证
const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
validateImageFile(testFile, 5).then(result => {
  console.log('验证结果:', result);
});
```

### 步骤3: 上传测试
```javascript
// 测试简单上传
const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
uploadImageToStorage(testFile, 'test').then(url => {
  console.log('上传成功:', url);
}).catch(error => {
  console.error('上传失败:', error);
});
```

## 网络问题排查

### 1. 检查网络连接
- 确认网络连接正常
- 检查防火墙设置
- 尝试使用VPN

### 2. 检查Firebase服务状态
- 访问 [Firebase状态页面](https://status.firebase.google.com/)
- 确认服务正常运行

### 3. 检查CORS设置
- 确认Firebase Storage CORS配置正确
- 检查浏览器CORS策略

## 性能优化建议

### 1. 图片压缩
- 启用智能缩放功能
- 调整压缩质量参数
- 使用合适的图片格式

### 2. 上传优化
- 分批上传大文件
- 使用断点续传
- 添加上传进度显示

### 3. 错误重试
- 实现自动重试机制
- 添加指数退避策略
- 提供手动重试选项

## 联系支持

如果以上步骤都无法解决问题，请提供以下信息：

1. **错误信息**: 完整的错误堆栈
2. **浏览器信息**: 浏览器版本和操作系统
3. **网络环境**: 网络类型和地区
4. **复现步骤**: 详细的操作步骤
5. **控制台日志**: 相关的控制台输出

## 预防措施

### 1. 定期检查
- 定期测试上传功能
- 监控存储使用情况
- 检查Firebase配额

### 2. 用户教育
- 提供上传指南
- 说明支持的文件格式
- 设置合理的文件大小限制

### 3. 监控告警
- 设置上传失败告警
- 监控存储使用率
- 跟踪错误频率
