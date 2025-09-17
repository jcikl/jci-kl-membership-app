# JCI KL 会员管理系统

> 一个基于 React + TypeScript + Firebase + Netlify 的现代化会员管理系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7.1-orange.svg)](https://firebase.google.com/)

## 🚀 快速开始

### 安装和运行

```bash
# 克隆项目
git clone <repository-url>
cd jci-kl-membership-app

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 查看应用。

### 配置要求

1. **Node.js 16+** 和 **npm 8+**
2. **Firebase 项目** - 用于后端服务
3. **Netlify 账户** - 用于部署

## 📚 文档导航

### 🎯 新用户必读
- **[快速开始指南](docs/getting-started/README.md)** - 项目概述和基本使用
- **[安装指南](docs/getting-started/INSTALLATION.md)** - 详细安装步骤
- **[部署指南](docs/getting-started/DEPLOYMENT.md)** - 部署配置说明
- **[项目总结](docs/getting-started/PROJECT_SUMMARY.md)** - 项目完成状态

### 🏗️ 功能模块
- **[会员管理](docs/features/member-management/)** - 会员注册、管理、权限控制
- **[财务系统](docs/features/finance-system/)** - 交易管理、财务报表、预算管理
- **[活动管理](docs/features/event-management/)** - 活动创建、报名、统计
- **[权限系统](docs/features/permission-system/)** - 基于角色的访问控制
- **[奖项系统](docs/features/awards-system/)** - 奖项管理、评分系统

### 🔧 技术文档
- **[架构设计](docs/technical/architecture/)** - 系统架构和技术选型
- **[API参考](docs/technical/api-reference/)** - 接口文档和数据结构
- **[故障排除](docs/technical/troubleshooting/)** - 常见问题和解决方案
- **[开发指南](docs/technical/development/)** - 开发规范和最佳实践

## 🛠️ 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI 组件库**: Ant Design
- **状态管理**: Redux Toolkit + Zustand
- **后端服务**: Firebase (Auth + Firestore)
- **部署平台**: Netlify
- **包管理**: npm

## 📁 项目结构

```
📁 项目根目录/
├── 📁 src/                    # 源代码目录
│   ├── components/            # 可复用组件
│   ├── pages/                # 页面组件
│   ├── services/             # API 服务
│   ├── store/                # 状态管理
│   ├── types/                # TypeScript 类型
│   └── utils/                # 工具函数
├── 📁 docs/                   # 统一文档目录
│   ├── getting-started/       # 快速开始指南
│   ├── features/             # 功能文档
│   ├── technical/            # 技术文档
│   └── changelog/            # 更新日志
├── 📁 config/                 # 配置文件目录
├── 📁 scripts/                # 脚本目录
├── 📁 assets/                 # 静态资源
└── 📁 archive/                # 归档目录
```

## 🚀 部署

### Netlify 部署
1. 将代码推送到 Git 仓库
2. 在 Netlify 中连接仓库
3. 配置构建设置：
   - 构建命令: `npm run build`
   - 发布目录: `dist`
4. 添加环境变量
5. 部署

### 自动部署脚本
```bash
# 部署到 Netlify
npm run deploy:netlify

# 部署 Firebase 规则
npm run firebase:deploy
```

## 🎯 核心功能

### ✅ 已完成功能
- 🔐 **用户认证系统** - 安全的登录注册
- 👥 **会员管理** - 完整的会员生命周期管理
- 📊 **数据统计** - 实时仪表板和数据可视化
- 🔍 **搜索筛选** - 强大的会员搜索功能
- 📱 **响应式设计** - 支持桌面和移动设备
- 🎨 **现代化UI** - 基于 Ant Design 的企业级界面

### 🚧 开发中功能
- 📅 **活动管理** - 活动创建、报名、签到
- 💰 **财务管理** - 会费缴纳、财务报表
- 🔔 **通知系统** - 邮件通知、系统消息
- 📈 **高级分析** - 数据分析和报告生成

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

- 📧 创建 [Issue](../../issues)
- 📖 查看 [文档](docs/)
- 💬 参与讨论

---

**JCI KL 会员管理系统** - 让会员管理更简单、更高效！ 🎉
