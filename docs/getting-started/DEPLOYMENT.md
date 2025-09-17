# 🚀 部署指南

本指南将帮助您将 JCI KL 会员管理系统部署到生产环境。

## 🎯 部署选项

### 推荐部署平台
- **Netlify** - 静态网站托管（推荐）
- **Vercel** - 静态网站托管
- **Firebase Hosting** - Firebase 集成托管
- **GitHub Pages** - 免费静态托管

## 🌐 Netlify 部署

### 方法一：通过 Git 仓库部署（推荐）

1. **准备代码仓库**
   ```bash
   # 确保代码已提交到 Git
   git add .
   git commit -m "准备部署"
   git push origin main
   ```

2. **连接 Netlify**
   - 访问 [Netlify](https://netlify.com)
   - 点击 "New site from Git"
   - 选择您的 Git 提供商
   - 选择仓库

3. **配置构建设置**
   ```
   Build command: npm run build
   Publish directory: dist
   Node version: 18
   ```

4. **环境变量配置**
   在 Netlify 控制台中添加环境变量：
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **部署**
   - 点击 "Deploy site"
   - 等待构建完成
   - 访问生成的 URL

### 方法二：手动部署

1. **构建项目**
   ```bash
   npm run build
   ```

2. **上传到 Netlify**
   - 访问 [Netlify](https://netlify.com)
   - 点击 "Deploy manually"
   - 拖拽 `dist` 文件夹到部署区域

### 方法三：使用 CLI 部署

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod --dir=dist
```

## 🔥 Firebase Hosting 部署

### 1. 安装 Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. 登录 Firebase

```bash
firebase login
```

### 3. 初始化项目

```bash
firebase init hosting
```

选择：
- 使用现有项目
- 选择 `dist` 作为公共目录
- 配置为单页应用
- 不覆盖 index.html

### 4. 构建和部署

```bash
# 构建项目
npm run build

# 部署到 Firebase
firebase deploy
```

## ⚙️ 环境配置

### 生产环境变量

创建 `.env.production` 文件：

```env
# Firebase 生产配置
VITE_FIREBASE_API_KEY=your_production_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_production_domain
VITE_FIREBASE_PROJECT_ID=your_production_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_production_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_production_sender_id
VITE_FIREBASE_APP_ID=your_production_app_id

# 应用配置
VITE_APP_NAME=JCI KL 会员管理系统
VITE_APP_VERSION=1.0.0
VITE_APP_ENV=production
```

### Firebase 安全规则

确保生产环境的 Firebase 安全规则：

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 会员数据规则
    match /members/{document} {
      allow read, write: if request.auth != null;
    }
    
    // 交易数据规则
    match /transactions/{document} {
      allow read, write: if request.auth != null;
    }
    
    // 活动数据规则
    match /events/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔧 构建优化

### 生产构建配置

更新 `config/vite.config.ts`：

```typescript
export default defineConfig({
  // ... 其他配置
  build: {
    outDir: 'dist',
    sourcemap: false, // 生产环境关闭 sourcemap
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
})
```

### 性能优化

1. **代码分割**
   ```typescript
   // 路由懒加载
   const MemberListPage = lazy(() => import('@/pages/MemberListPage'));
   ```

2. **图片优化**
   ```typescript
   // 使用 WebP 格式
   // 实现图片懒加载
   ```

3. **缓存策略**
   ```typescript
   // 设置适当的缓存头
   // 使用 Service Worker
   ```

## 📊 监控和分析

### 性能监控

1. **Google Analytics**
   ```typescript
   // 在 main.tsx 中添加
   import { analytics } from '@/services/analytics';
   ```

2. **错误监控**
   ```typescript
   // 集成 Sentry 或其他错误监控服务
   ```

### 用户分析

1. **Firebase Analytics**
   - 自动跟踪页面访问
   - 自定义事件跟踪
   - 用户行为分析

2. **自定义指标**
   ```typescript
   // 跟踪关键业务指标
   analytics.track('member_registration', { source: 'web' });
   ```

## 🔒 安全配置

### HTTPS 配置

确保所有部署都使用 HTTPS：
- Netlify 自动提供 HTTPS
- Firebase Hosting 自动提供 HTTPS
- 配置自定义域名时启用 SSL

### 内容安全策略

在 `index.html` 中添加 CSP：

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://www.gstatic.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:;">
```

### Firebase 安全规则

定期审查和更新安全规则：

```bash
# 部署安全规则
firebase deploy --only firestore:rules
```

## 🚀 自动化部署

### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v1.2
      with:
        publish-dir: './dist'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## 🔍 部署验证

### 功能测试清单

- [ ] 页面正常加载
- [ ] 用户注册/登录功能
- [ ] 会员管理功能
- [ ] 数据同步正常
- [ ] 响应式设计
- [ ] 性能指标正常

### 性能测试

```bash
# 使用 Lighthouse 测试
npm install -g lighthouse
lighthouse https://your-site.netlify.app --output html
```

## 🆘 故障排除

### 常见部署问题

1. **构建失败**
   ```bash
   # 检查构建日志
   npm run build
   
   # 检查环境变量
   npm run check:env
   ```

2. **页面空白**
   - 检查控制台错误
   - 验证环境变量配置
   - 检查路由配置

3. **Firebase 连接失败**
   - 验证 Firebase 配置
   - 检查网络连接
   - 确认 Firebase 项目状态

4. **性能问题**
   - 检查包大小
   - 优化图片资源
   - 启用代码分割

### 回滚策略

```bash
# Netlify 回滚
netlify sites:list
netlify rollback --site-id=your-site-id

# Firebase 回滚
firebase hosting:channel:list
firebase hosting:channel:deploy previous-version
```

---

**部署完成！** 您的 JCI KL 会员管理系统已成功上线！🎉
