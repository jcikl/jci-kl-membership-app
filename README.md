# 超级国际青年商会管理系统

一个基于 React + TypeScript + Firebase + Netlify 的现代化会员管理系统。

## 🚀 功能特性

### 核心功能
- **会员管理**: 完整的会员注册、登录、信息管理
- **权限控制**: 基于角色的访问控制
- **数据统计**: 实时仪表板和数据可视化
- **响应式设计**: 支持桌面和移动设备

### 技术特性
- ⚡ **Vite** - 极速的开发构建工具
- ⚛️ **React 18** - 现代化的用户界面库
- 🔷 **TypeScript** - 类型安全的JavaScript
- 🎨 **Ant Design** - 企业级UI组件库
- 🔥 **Firebase** - 后端即服务(BaaS)
- 🌐 **Netlify** - 静态网站托管和部署

## 📋 系统要求

- Node.js 16+ 
- npm 8+
- Firebase 项目
- Netlify 账户

## 🛠️ 安装和运行

### 1. 克隆项目
```bash
git clone <repository-url>
cd jci-kl-membership-app
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制 `env.example` 文件为 `.env` 并填入你的 Firebase 配置：

```bash
cp env.example .env
```

编辑 `.env` 文件：
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

## 🔧 Firebase 配置

### 1. 创建 Firebase 项目
1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 创建新项目
3. 启用 Authentication 和 Firestore Database

### 2. 配置 Authentication
- 启用邮箱/密码登录
- 配置用户注册流程

### 3. 配置 Firestore
创建以下集合和文档结构：

```
members/
  {memberId}/
    - email: string
    - name: string
    - phone: string
    - memberId: string
    - joinDate: timestamp
    - status: string (active, inactive, pending, suspended)
    - level: string (bronze, silver, gold, platinum, diamond)
    - profile: object
    - createdAt: timestamp
    - updatedAt: timestamp
```

### 4. 安全规则
配置 Firestore 安全规则：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /members/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Netlify 部署

### 1. 构建项目
```bash
npm run build
```

### 2. 部署到 Netlify
1. 将代码推送到 Git 仓库
2. 在 Netlify 中连接 Git 仓库
3. 配置构建设置：
   - 构建命令: `npm run build`
   - 发布目录: `dist`
4. 添加环境变量（与本地 `.env` 相同）
5. 部署

### 3. 自动部署
每次推送到主分支都会自动触发部署。

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── AppHeader.tsx
│   ├── AppSider.tsx
│   └── LoadingSpinner.tsx
├── pages/              # 页面组件
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── MemberListPage.tsx
│   ├── MemberDetailPage.tsx
│   └── ProfilePage.tsx
├── services/           # API 服务
│   ├── firebase.ts
│   ├── authService.ts
│   └── memberService.ts
├── store/              # 状态管理
│   ├── authStore.ts
│   └── memberStore.ts
├── types/              # TypeScript 类型定义
│   └── index.ts
├── styles/             # 样式文件
│   └── index.css
├── App.tsx
└── main.tsx
```

## 🎯 开发计划

### 第一阶段 - 会员管理 ✅
- [x] 用户认证系统
- [x] 会员注册和登录
- [x] 会员信息管理
- [x] 会员列表和详情
- [x] 基础仪表板

### 第二阶段 - 活动管理 🚧
- [ ] 活动创建和管理
- [ ] 活动报名系统
- [ ] 活动签到功能
- [ ] 活动统计和报告

### 第三阶段 - 财务管理 🚧
- [ ] 会费缴纳记录
- [ ] 活动费用管理
- [ ] 财务报表生成
- [ ] 支付集成

### 第四阶段 - 通知系统 🚧
- [ ] 邮件通知
- [ ] 系统内消息
- [ ] 公告发布
- [ ] 推送通知

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 发送邮件至 [your-email@example.com]
- 微信: [your-wechat-id]

---

**超级国际青年商会管理系统** - 让会员管理更简单、更高效！
