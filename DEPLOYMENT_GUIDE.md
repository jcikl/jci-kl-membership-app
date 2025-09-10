# 部署配置指南

## 🚀 快速开始

### 1. 环境准备

确保你的系统已安装以下工具：
- Node.js 16+ 
- npm 8+
- Git

### 2. 项目设置

```bash
# 克隆项目
git clone <your-repository-url>
cd jci-kl-membership-app

# 安装依赖
npm install

# 复制环境变量文件
cp env.example .env
```

## 🔥 Firebase 配置

### 步骤 1: 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 点击"创建项目"
3. 输入项目名称：`jci-kl-membership`
4. 选择是否启用 Google Analytics（推荐启用）
5. 创建项目

### 步骤 2: 启用 Authentication

1. 在 Firebase Console 中，点击左侧菜单的"Authentication"
2. 点击"开始使用"
3. 在"登录方法"标签页中，启用"邮箱/密码"
4. 可选：启用"Google"登录方式

### 步骤 3: 创建 Firestore 数据库

1. 在 Firebase Console 中，点击左侧菜单的"Firestore Database"
2. 点击"创建数据库"
3. 选择"测试模式"（稍后我们会配置安全规则）
4. 选择数据库位置（推荐选择离你最近的区域）

### 步骤 4: 获取 Firebase 配置

1. 在 Firebase Console 中，点击项目设置（齿轮图标）
2. 在"常规"标签页中，滚动到"你的应用"部分
3. 点击"Web"图标（</>）
4. 输入应用名称：`JCI KL Membership App`
5. 复制配置信息到你的 `.env` 文件

### 步骤 5: 配置安全规则

1. 在 Firestore Database 页面，点击"规则"标签
2. 将 `firestore.rules` 文件的内容复制到规则编辑器中
3. 点击"发布"

### 步骤 6: 配置索引

1. 在 Firestore Database 页面，点击"索引"标签
2. 点击"导入"
3. 上传 `firestore.indexes.json` 文件

## 🌐 Netlify 配置

### 步骤 1: 创建 Netlify 账户

1. 访问 [Netlify](https://netlify.com/)
2. 点击"Sign up"注册账户
3. 推荐使用 GitHub 账户登录

### 步骤 2: 连接 Git 仓库

1. 在 Netlify 仪表板中，点击"New site from Git"
2. 选择你的 Git 提供商（GitHub/GitLab/Bitbucket）
3. 选择你的仓库
4. 配置构建设置：
   - **构建命令**: `npm run build`
   - **发布目录**: `dist`
   - **Node 版本**: `18`

### 步骤 3: 配置环境变量

1. 在站点设置中，点击"Environment variables"
2. 添加以下环境变量（与 `.env` 文件相同）：
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 步骤 4: 部署

1. 点击"Deploy site"
2. 等待构建完成
3. 访问提供的 URL 查看你的应用

## 🛠️ 开发环境设置

### 本地开发

```bash
# 启动开发服务器
npm run dev

# 启动 Firebase 模拟器
npm run firebase:emulators
```

### 测试部署

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 📱 移动端配置

### PWA 支持

项目已配置为 PWA（渐进式 Web 应用），支持：

- 离线访问
- 添加到主屏幕
- 推送通知（需要额外配置）

### 移动端优化

- 响应式设计
- 触摸友好的界面
- 快速加载

## 🔧 高级配置

### 自定义域名

1. 在 Netlify 站点设置中，点击"Domain management"
2. 添加你的自定义域名
3. 配置 DNS 记录

### SSL 证书

Netlify 自动提供免费的 SSL 证书，无需额外配置。

### CDN 配置

Netlify 使用全球 CDN，自动优化静态资源加载速度。

## 🚨 故障排除

### 常见问题

1. **Firebase 认证失败**
   - 检查 API 密钥是否正确
   - 确认 Authentication 已启用
   - 检查域名是否在授权列表中

2. **构建失败**
   - 检查 Node.js 版本
   - 清除 node_modules 并重新安装
   - 检查环境变量是否正确设置

3. **部署失败**
   - 检查 Netlify 构建日志
   - 确认环境变量已正确设置
   - 检查 Firebase 项目配置

### 调试技巧

1. **本地调试**
   ```bash
   # 启用详细日志
   DEBUG=* npm run dev
   ```

2. **Firebase 调试**
   ```bash
   # 使用 Firebase 模拟器
   firebase emulators:start --debug
   ```

3. **Netlify 调试**
   - 查看构建日志
   - 使用 Netlify CLI 本地测试
   ```bash
   netlify dev
   ```

## 📊 监控和分析

### Firebase Analytics

1. 在 Firebase Console 中启用 Analytics
2. 配置事件跟踪
3. 查看用户行为数据

### Netlify Analytics

1. 在 Netlify 站点设置中启用 Analytics
2. 查看访问统计
3. 监控性能指标

## 🔐 安全最佳实践

1. **环境变量安全**
   - 永远不要将 `.env` 文件提交到 Git
   - 使用强密码和 API 密钥
   - 定期轮换密钥

2. **Firebase 安全规则**
   - 定期审查和更新安全规则
   - 使用最小权限原则
   - 测试安全规则

3. **HTTPS 强制**
   - Netlify 自动启用 HTTPS
   - 确保所有 API 调用使用 HTTPS

## 📈 性能优化

1. **代码分割**
   - 使用 React.lazy() 进行懒加载
   - 优化包大小

2. **图片优化**
   - 使用 WebP 格式
   - 实现响应式图片

3. **缓存策略**
   - 配置适当的缓存头
   - 使用 Service Worker

## 🎯 下一步

1. 配置 CI/CD 流水线
2. 设置监控和告警
3. 实现备份策略
4. 优化性能
5. 添加更多功能

---

如有问题，请查看 [README.md](README.md) 或创建 Issue。
