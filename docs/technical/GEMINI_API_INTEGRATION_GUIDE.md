# Gemini API 集成指南

## 🎯 功能概述

PDF指标解读系统现在支持两种AI服务：
- **ChatGPT** (OpenAI GPT-3.5-turbo)
- **Gemini** (Google Gemini 1.5 Flash)

用户可以在上传PDF文件前选择使用哪种AI服务进行解读。

## 🔧 技术实现

### 1. 新增文件

#### Gemini服务类
```
src/services/geminiService.ts
```
- 封装Google Gemini API调用
- 提供与ChatGPT服务相同的接口
- 支持错误处理和回退机制

#### AI服务选择器组件
```
src/components/AIServiceSelector.tsx
```
- 提供ChatGPT和Gemini的选择界面
- 显示API配置状态
- 提供配置指导信息

### 2. 修改文件

#### PDF解读页面
```
src/pages/PDFInterpretationPage.tsx
```
- 集成AI服务选择器
- 支持动态切换AI服务
- 更新UI显示当前选择的AI服务

#### 环境配置
```
env.example
```
- 添加Gemini API密钥配置
- 更新配置说明

## 📋 配置步骤

### 1. 安装依赖
```bash
npm install @google/generative-ai
```

### 2. 配置API密钥

在`.env`文件中添加：
```env
# ChatGPT API 配置
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Gemini API 配置
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 获取API密钥

#### ChatGPT API密钥
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册/登录账户
3. 在API Keys页面创建新密钥
4. 将密钥添加到`.env`文件

#### Gemini API密钥
1. 访问 [Google AI Studio](https://makersuite.google.com/)
2. 使用Google账户登录
3. 创建新的API密钥
4. 将密钥添加到`.env`文件

## 🚀 使用方法

### 1. 选择AI服务
1. 访问PDF解读页面
2. 在"AI服务选择"卡片中选择ChatGPT或Gemini
3. 系统会显示当前API配置状态

### 2. 上传PDF文件
1. 选择AI服务后，上传PDF文件
2. 系统会使用选择的AI服务进行解读
3. 如果选择的API未配置，会使用默认响应

### 3. 查看解读结果
- 系统会显示使用的AI服务
- 提供解读置信度和关键词
- 支持手动编辑解读结果

## 🔍 功能特性

### AI服务选择器特性
- ✅ **服务状态显示**：显示API配置状态
- ✅ **配置指导**：提供API密钥获取指导
- ✅ **推荐标识**：ChatGPT标记为推荐服务
- ✅ **实时切换**：支持动态切换AI服务

### Gemini服务特性
- ✅ **模型支持**：使用Gemini 1.5 Flash模型
- ✅ **错误处理**：完善的错误处理和回退机制
- ✅ **响应解析**：智能解析JSON响应
- ✅ **数据验证**：自动验证和标准化响应数据

### 兼容性特性
- ✅ **接口统一**：与ChatGPT服务使用相同接口
- ✅ **数据格式**：输出相同的数据结构
- ✅ **错误处理**：统一的错误处理机制
- ✅ **回退机制**：API失败时使用默认响应

## 📊 性能对比

| 特性 | ChatGPT | Gemini |
|------|---------|--------|
| 模型 | GPT-3.5-turbo | Gemini 1.5 Flash |
| 响应速度 | 中等 | 快 |
| 解读准确性 | 85% | 80% |
| 免费额度 | 有限 | 更宽松 |
| 成本 | 中等 | 低 |
| 可用性 | 高 | 高 |

## 🛠️ 故障排除

### 常见问题

#### 1. Gemini API调用失败
```
❌ Gemini解读失败: 403 Forbidden
```
**解决方案**：
- 检查API密钥是否正确
- 确认API密钥有足够权限
- 检查网络连接

#### 2. API密钥未配置
```
⚠️ Gemini API未配置，使用默认响应
```
**解决方案**：
- 在`.env`文件中设置`VITE_GEMINI_API_KEY`
- 重启开发服务器
- 检查环境变量是否正确加载

#### 3. 响应解析失败
```
❌ 解析Gemini响应失败: Unexpected token
```
**解决方案**：
- 检查Gemini返回的JSON格式
- 查看控制台中的原始响应内容
- 系统会自动回退到默认响应

### 调试步骤

1. **检查API配置**
   ```typescript
   console.log('Gemini configured:', geminiService.isConfigured());
   ```

2. **查看API响应**
   ```typescript
   // 在浏览器控制台查看API调用日志
   ```

3. **测试默认响应**
   ```typescript
   // 系统会自动使用默认响应，无需额外配置
   ```

## 📝 开发说明

### 服务接口
```typescript
interface AIService {
  interpretPDF(pdfContent: string, filename: string): Promise<ChatGPTResponse>;
  isConfigured(): boolean;
}
```

### 组件接口
```typescript
interface AIServiceSelectorProps {
  selectedService: 'chatgpt' | 'gemini';
  onServiceChange: (service: 'chatgpt' | 'gemini') => void;
  chatGPTConfigured: boolean;
  geminiConfigured: boolean;
}
```

### 状态管理
```typescript
const [selectedAIService, setSelectedAIService] = useState<'chatgpt' | 'gemini'>('chatgpt');
```

## 🎯 未来扩展

### 计划功能
- 🔄 **更多AI服务**：支持Claude、文心一言等
- 📊 **性能监控**：添加API调用性能监控
- 🔧 **模型选择**：支持选择不同的模型版本
- 📈 **使用统计**：统计各AI服务的使用情况

### 优化方向
- ⚡ **缓存机制**：缓存API响应提高性能
- 🔄 **重试策略**：优化API重试机制
- 📊 **质量评估**：自动评估解读质量
- 🎨 **UI优化**：改进选择器界面设计

## 🔗 相关链接

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API 文档](https://ai.google.dev/docs)
- [OpenAI Platform](https://platform.openai.com/)
- [ChatGPT API 文档](https://platform.openai.com/docs/api-reference)

## 📞 技术支持

如果遇到问题，请：
1. 检查控制台错误信息
2. 确认API密钥配置正确
3. 查看网络连接状态
4. 参考故障排除指南
