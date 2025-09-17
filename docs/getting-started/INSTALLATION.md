# 📦 安装指南

本指南将帮助您快速安装和配置 JCI KL 会员管理系统。

## 🎯 系统要求

### 必需环境
- **Node.js**: 16.0.0 或更高版本
- **npm**: 8.0.0 或更高版本
- **Git**: 用于版本控制
- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 推荐环境
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **内存**: 8GB RAM 或更多
- **存储**: 至少 2GB 可用空间

## 🚀 快速安装

### 1. 克隆项目

```bash
# 克隆仓库
git clone <repository-url>
cd jci-kl-membership-app

# 或者下载 ZIP 文件并解压
```

### 2. 安装依赖

```bash
# 安装所有依赖包
npm install

# 或者使用 yarn
yarn install
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp config/env.example .env

# 编辑环境变量文件
# Windows
notepad .env

# macOS/Linux
nano .env
```

### 4. 启动开发服务器

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 🔧 详细配置

### Firebase 配置

1. **创建 Firebase 项目**
   - 访问 [Firebase Console](https://console.firebase.google.com/)
   - 点击"创建项目"
   - 输入项目名称：`jci-kl-membership`
   - 选择是否启用 Google Analytics

2. **启用 Authentication**
   - 在 Firebase Console 中点击"Authentication"
   - 点击"开始使用"
   - 在"登录方法"中启用"邮箱/密码"

3. **创建 Firestore 数据库**
   - 点击"Firestore Database"
   - 点击"创建数据库"
   - 选择"测试模式"
   - 选择数据库位置

4. **获取配置信息**
   - 点击项目设置（齿轮图标）
   - 滚动到"您的应用"部分
   - 点击"Web"图标
   - 复制配置信息

5. **更新 .env 文件**

```env
# Firebase 配置
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# 其他配置
VITE_APP_NAME=JCI KL 会员管理系统
VITE_APP_VERSION=1.0.0
```

### 数据库初始化

```bash
# 初始化事件数据
npm run init:events

# 初始化奖项数据
npm run init:awards

# 创建测试用户
npm run create:test-user
```

## 🛠️ 开发工具配置

### VS Code 推荐扩展

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "firebase.vscode-firebase-explorer",
    "ms-vscode.vscode-json"
  ]
}
```

### ESLint 配置

项目已包含 ESLint 配置，支持：
- TypeScript 语法检查
- React Hooks 规则
- 代码格式化

```bash
# 运行代码检查
npm run lint

# 自动修复问题
npm run lint -- --fix
```

### TypeScript 配置

项目使用严格的 TypeScript 配置：
- 严格模式启用
- 未使用变量检查
- 未使用参数检查
- 类型检查

```bash
# 类型检查
npm run type-check
```

## 🚀 生产环境准备

### 构建项目

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

### 环境变量检查

确保生产环境变量已正确配置：

```bash
# 检查环境变量
npm run check:env
```

## 🔍 故障排除

### 常见问题

1. **依赖安装失败**
   ```bash
   # 清除缓存
   npm cache clean --force
   
   # 删除 node_modules 重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **端口被占用**
   ```bash
   # 使用不同端口
   npm run dev -- --port 3001
   ```

3. **Firebase 连接失败**
   - 检查 .env 文件配置
   - 确认 Firebase 项目状态
   - 检查网络连接

4. **TypeScript 错误**
   ```bash
   # 重新生成类型定义
   npm run type-check
   ```

### 获取帮助

- 📖 查看 [文档中心](../README.md)
- 🐛 报告 [Issue](../../issues)
- 💬 参与 [讨论](../../discussions)

## ✅ 验证安装

安装完成后，请验证以下功能：

1. **开发服务器启动**
   ```bash
   npm run dev
   # 应该看到 "Local: http://localhost:3000"
   ```

2. **页面加载**
   - 访问 http://localhost:3000
   - 应该看到登录页面

3. **Firebase 连接**
   - 尝试注册新用户
   - 检查 Firebase Console 中的用户

4. **功能测试**
   - 登录系统
   - 访问会员管理页面
   - 检查数据加载

---

**恭喜！** 您已成功安装 JCI KL 会员管理系统！🎉
