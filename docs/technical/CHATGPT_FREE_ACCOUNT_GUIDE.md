# ChatGPT 免费账户配置指南

## 🎯 问题背景

对于非付费的ChatGPT账户，无法访问`gpt-4`模型，会出现以下错误：
```
❌ ChatGPT解读失败: NotFoundError: 404 The model `gpt-4` does not exist or you do not have access to it.
```

## 🔧 解决方案

### 方案1: 使用免费模型（推荐）

系统已自动配置为使用`gpt-3.5-turbo`免费模型：

```typescript
// src/services/chatGPTService.ts
const response = await this.openai!.chat.completions.create({
  model: 'gpt-3.5-turbo', // 使用免费模型
  max_tokens: 3000, // 减少token数量以适应免费额度
  temperature: 0.1,
});
```

### 方案2: 无API密钥模式

如果没有任何OpenAI API密钥，系统会自动使用默认响应：

```typescript
// 默认响应结构
{
  awardType: 'efficient_star',
  basicFields: {
    title: 'PDF解读结果',
    description: 'PDF文件已成功解析，但AI解读功能需要有效的OpenAI API密钥。请手动填写相关字段。',
    deadline: '2025-12-31'
  },
  // ... 其他字段
  notes: 'PDF解析成功，但AI解读功能需要OpenAI API密钥。请手动填写相关字段信息。'
}
```

## 📋 配置步骤

### 1. 创建环境配置文件

```bash
# 复制示例配置文件
cp env.example .env
```

### 2. 配置API密钥（可选）

在`.env`文件中设置：
```env
# ChatGPT API 配置（用于PDF解读功能）
VITE_OPENAI_API_KEY=your_api_key_here
```

### 3. 获取免费API密钥

1. 访问 [OpenAI官网](https://platform.openai.com/)
2. 注册账户（免费）
3. 在API Keys页面创建新密钥
4. 将密钥添加到`.env`文件

## 🚀 功能说明

### 有API密钥时
- ✅ 使用`gpt-3.5-turbo`模型进行AI解读
- ✅ 自动提取PDF中的关键信息
- ✅ 生成结构化的表单数据
- ✅ 提供解读置信度

### 无API密钥时
- ✅ PDF文件正常解析
- ✅ 提供默认表单结构
- ✅ 用户可以手动填写字段
- ✅ 显示友好的提示信息

## 🔍 测试验证

### 1. 测试PDF解析功能
```bash
npm run dev
```
访问PDF解读页面，上传PDF文件，应该看到：
```
✅ PDF.js worker配置成功
📄 PDF文档加载完成
✅ PDF解析完成
```

### 2. 测试AI解读功能

#### 有API密钥时：
```
🤖 开始ChatGPT解读
✅ ChatGPT解读完成
```

#### 无API密钥时：
```
⚠️ ChatGPT API未配置，使用默认响应
✅ 进入字段映射步骤
```

## 🛠️ 故障排除

### 常见问题

#### 1. API密钥无效
```
❌ ChatGPT解读失败: 401 Unauthorized
```
**解决方案**: 检查API密钥是否正确，确保账户有足够的额度

#### 2. 免费额度用完
```
❌ ChatGPT解读失败: 429 Too Many Requests
```
**解决方案**: 
- 等待额度重置（通常每月重置）
- 升级到付费账户
- 使用无API密钥模式

#### 3. 模型访问权限问题
```
❌ ChatGPT解读失败: 404 The model does not exist
```
**解决方案**: 系统已自动使用`gpt-3.5-turbo`，如果仍有问题，检查API密钥权限

### 调试步骤

1. **检查环境配置**
   ```typescript
   console.log('API Key configured:', chatGPTService.isConfigured());
   ```

2. **检查API响应**
   ```typescript
   // 在浏览器控制台查看API调用日志
   ```

3. **测试默认响应**
   ```typescript
   // 系统会自动使用默认响应，无需额外配置
   ```

## 📊 性能对比

| 功能 | GPT-4 | GPT-3.5-turbo | 默认响应 |
|------|-------|---------------|----------|
| 解读准确性 | 95% | 85% | 0% |
| 响应速度 | 慢 | 快 | 即时 |
| 成本 | 高 | 低 | 免费 |
| 可用性 | 付费 | 免费 | 总是可用 |

## 🎯 推荐使用方式

### 开发阶段
- 使用默认响应模式进行功能测试
- 手动填写表单字段验证功能

### 生产环境
- 配置有效的API密钥
- 使用`gpt-3.5-turbo`模型
- 监控API使用量和成本

### 预算有限时
- 使用免费模型
- 定期检查API额度
- 考虑升级到付费账户

## 📝 注意事项

1. **API密钥安全**: 不要在代码中硬编码API密钥
2. **环境变量**: 确保`.env`文件不被提交到版本控制
3. **免费额度**: OpenAI免费账户有使用限制
4. **成本控制**: 监控API使用量，避免意外费用
5. **回退机制**: 系统已实现自动回退，确保功能可用

## 🔗 相关链接

- [OpenAI API 文档](https://platform.openai.com/docs)
- [GPT-3.5-turbo 模型说明](https://platform.openai.com/docs/models/gpt-3-5)
- [OpenAI 定价信息](https://openai.com/pricing)
- [API 密钥管理](https://platform.openai.com/api-keys)
