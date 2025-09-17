# JCI KL 奖励指标管理系统 - 部署配置指南

## 📋 部署概览

本文档提供了完整的部署配置指南，包括环境设置、依赖安装、构建配置和部署步骤。

## 🚀 快速开始

### 1. 环境要求

- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Firebase CLI**: >= 12.0.0
- **Git**: >= 2.30.0

### 2. 安装依赖

```bash
# 安装项目依赖
npm install

# 安装Firebase CLI（如果未安装）
npm install -g firebase-tools
```

### 3. 环境配置

#### Firebase 配置
1. 创建 `.env.local` 文件：
```bash
# Firebase 配置
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

2. 初始化Firebase：
```bash
firebase login
firebase init
```

#### Firestore 安全规则
更新 `firestore.rules`：
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 奖励指标管理规则
    match /award_indicators/{document} {
      allow read, write: if request.auth != null;
    }
    
    match /indicators/{document} {
      allow read, write: if request.auth != null;
    }
    
    // 现有规则保持不变
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🏗️ 构建配置

### 1. Vite 配置优化

更新 `vite.config.ts`：
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
```

### 2. TypeScript 配置

确保 `tsconfig.json` 包含：
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## 📦 构建和部署

### 1. 开发环境

```bash
# 启动开发服务器
npm run dev

# 运行类型检查
npm run type-check

# 运行代码检查
npm run lint
```

### 2. 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 3. Firebase 部署

```bash
# 部署到Firebase Hosting
firebase deploy

# 仅部署Firestore规则
firebase deploy --only firestore:rules

# 仅部署Hosting
firebase deploy --only hosting
```

## 🔧 数据库迁移

### 1. 数据迁移步骤

1. **备份现有数据**：
```bash
# 导出Firestore数据
firebase firestore:export gs://your-bucket/backup-$(date +%Y%m%d)
```

2. **运行迁移**：
   - 访问 `/migration` 页面
   - 选择源年份和目标年份
   - 执行数据迁移
   - 验证迁移结果

3. **验证数据**：
   - 检查新系统中的数据完整性
   - 验证所有奖励指标和指标数据
   - 测试功能正常性

### 2. 回滚计划

如果迁移出现问题：
```bash
# 使用迁移界面回滚
# 或手动删除新集合数据
```

## 🧪 测试配置

### 1. 单元测试

```bash
# 运行测试
npm run test

# 运行测试覆盖率
npm run test:coverage
```

### 2. 集成测试

```bash
# 运行迁移测试
npm run test:migration

# 运行数据验证测试
npm run test:validation
```

## 📊 监控和日志

### 1. 性能监控

- **Firebase Performance**: 自动监控应用性能
- **Firebase Analytics**: 用户行为分析
- **Firebase Crashlytics**: 错误监控

### 2. 日志配置

```typescript
// 生产环境日志级别
const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'error' : 'debug';
```

## 🔒 安全配置

### 1. 环境变量安全

- 所有敏感信息存储在环境变量中
- 生产环境使用Firebase项目配置
- 开发环境使用本地`.env.local`

### 2. Firestore 安全规则

- 用户认证检查
- 数据访问权限控制
- 字段级安全验证

## 🚀 部署检查清单

### 部署前检查

- [ ] 环境变量配置正确
- [ ] Firebase项目配置完成
- [ ] Firestore安全规则更新
- [ ] 构建无错误
- [ ] 测试通过
- [ ] 数据迁移计划准备

### 部署后验证

- [ ] 应用正常加载
- [ ] 用户认证工作正常
- [ ] 数据读写功能正常
- [ ] 新功能可用
- [ ] 性能指标正常
- [ ] 错误监控正常

## 📞 故障排除

### 常见问题

1. **构建失败**：
   - 检查Node.js版本
   - 清除node_modules重新安装
   - 检查TypeScript错误

2. **Firebase连接失败**：
   - 验证环境变量
   - 检查网络连接
   - 确认Firebase项目配置

3. **数据迁移失败**：
   - 检查源数据完整性
   - 验证目标年份数据
   - 查看错误日志

### 联系支持

- **技术问题**: 联系开发团队
- **数据问题**: 联系数据管理员
- **部署问题**: 联系DevOps团队

## 📈 性能优化

### 1. 代码分割

- 路由级别的代码分割
- 组件懒加载
- 第三方库按需加载

### 2. 缓存策略

- 静态资源缓存
- API响应缓存
- 本地存储优化

### 3. 数据库优化

- 查询索引优化
- 数据分页加载
- 实时监听优化

---

**部署版本**: v2.0.0  
**最后更新**: 2024年1月  
**维护团队**: JCI KL 开发团队
