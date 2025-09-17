# JCI Kuala Lumpur 活动管理系统指南

## 📋 功能概述

活动管理系统是JCI Kuala Lumpur会员管理系统的核心模块之一，提供了完整的活动生命周期管理功能，包括活动创建、发布、注册、审核和管理等。

## 🎯 主要功能

### 1. 活动管理
- **活动创建**: 支持多步骤表单创建活动，包括基本信息、时间地点、费用设置、注册配置
- **活动编辑**: 完整的活动信息编辑功能，支持草稿保存和实时更新
- **活动发布**: 一键发布活动，支持状态管理（草稿、已发布、已取消、已完成）
- **活动删除**: 安全的删除功能，同时清理相关数据

### 2. 活动分类
- **活动类型**: Programs（程序）、Skill Development（技能发展）、Events（活动）、Projects（项目）
- **活动级别**: Local（本地）、Area（区域）、National（国家）、JCI（国际）
- **活动类别**: 包括会议、研讨会、工作坊、商业网络、社区服务等

### 3. 注册管理
- **在线注册**: 用户友好的注册表单，支持多种票务类型
- **注册审核**: 管理员可以审核、批准或拒绝注册申请
- **注册限制**: 支持人数限制、时间限制、用户类型限制
- **批量操作**: 支持批量审核和管理注册记录

### 4. 票务系统
- **多种票务类型**: 标准票、早鸟票、会员票、校友票等
- **动态定价**: 支持不同用户类型的差异化定价
- **库存管理**: 实时跟踪票务销售情况和库存状态

### 5. 活动安排
- **程序管理**: 详细的活动程序安排和时间表
- **委员会管理**: 活动委员会成员信息管理
- **讲师管理**: 活动讲师和嘉宾信息管理

### 6. 数据统计
- **实时统计**: 注册人数、收入、审核状态等实时数据
- **图表展示**: 直观的数据可视化展示
- **报表导出**: 支持数据导出和报表生成

## 🏗️ 技术架构

### 前端技术栈
- **React 18**: 现代化的用户界面框架
- **TypeScript**: 类型安全的JavaScript超集
- **Ant Design**: 企业级UI组件库
- **React Router**: 单页应用路由管理
- **Day.js**: 轻量级日期处理库

### 后端服务
- **Firebase Firestore**: NoSQL文档数据库
- **Firebase Authentication**: 用户认证服务
- **Firebase Storage**: 文件存储服务

### 数据模型

#### Event（活动）
```typescript
interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  category: EventCategory;
  level: EventLevel;
  status: EventStatus;
  startDate: Timestamp;
  endDate: Timestamp;
  venue: string;
  address: string;
  hostingLO: string;
  coHostingLOs: string[];
  contactEmail: string;
  isFree: boolean;
  currency: string;
  regularPrice?: number;
  maxParticipants?: number;
  registrationOpenFor: string[];
  // ... 更多字段
}
```

#### EventRegistration（活动注册）
```typescript
interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
  ticketId?: string;
  amount: number;
  status: RegistrationStatus;
  registeredAt: Timestamp;
  // ... 更多字段
}
```

## 📁 文件结构

```
src/
├── types/
│   └── event.ts                 # 活动相关类型定义
├── services/
│   └── eventService.ts          # 活动服务层
├── components/
│   ├── EventList.tsx            # 活动列表组件
│   ├── EventForm.tsx            # 活动表单组件
│   ├── EventDetail.tsx          # 活动详情组件
│   ├── EventRegistrationForm.tsx # 注册表单组件
│   ├── EventStatistics.tsx      # 统计数据组件
│   ├── EventRegistrationManagement.tsx # 注册管理组件
│   └── EventSettings.tsx        # 系统设置组件
└── pages/
    ├── EventManagementPage.tsx  # 活动管理页面
    ├── EventCreatePage.tsx      # 活动创建页面
    ├── EventDetailPage.tsx      # 活动详情页面
    ├── EventRegistrationPage.tsx # 活动注册页面
    └── EventRegistrationSuccessPage.tsx # 注册成功页面
```

## 🚀 使用指南

### 创建活动

1. **访问活动管理**: 登录系统后，点击侧边栏的"活动管理"
2. **创建新活动**: 点击"创建活动"按钮
3. **填写基本信息**: 
   - 活动标题和描述
   - 选择活动类型、类别和级别
   - 设置主办方和协办方
4. **配置时间地点**:
   - 设置活动开始和结束时间
   - 填写活动场地和地址
   - 支持线上活动配置
5. **设置费用**:
   - 选择是否免费活动
   - 配置不同票务类型的价格
   - 设置参与人数限制
6. **注册设置**:
   - 配置注册开放对象
   - 上传活动封面图片
   - 设置其他注册选项

### 管理注册

1. **查看注册列表**: 在活动管理页面切换到"注册管理"标签
2. **筛选和搜索**: 使用筛选器按活动、状态、日期等条件查找注册记录
3. **审核注册**: 
   - 点击"查看详情"查看完整注册信息
   - 点击"批准"或"拒绝"按钮进行审核
   - 批量操作多个注册记录
4. **导出数据**: 支持将注册数据导出为Excel格式

### 查看统计

1. **访问统计页面**: 在活动管理页面切换到"数据统计"标签
2. **总体统计**: 查看所有活动的总体数据概览
3. **单个活动统计**: 选择特定活动查看详细统计信息
4. **图表展示**: 直观的数据可视化展示

## 🔧 配置说明

### 环境变量
确保在`.env`文件中配置了正确的Firebase设置：
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firestore安全规则
确保在Firestore中配置了适当的安全规则，允许经过认证的用户访问活动相关数据。

## 📱 响应式设计

活动管理系统完全支持响应式设计，可以在桌面、平板和移动设备上完美运行：

- **桌面端**: 完整功能展示，多列布局
- **平板端**: 自适应布局，保持核心功能
- **移动端**: 单列布局，优化的触摸体验

## 🔐 权限控制

系统集成了基于角色的权限控制（RBAC）：

- **管理员**: 完整的活动管理权限
- **活动组织者**: 创建和管理自己组织的活动
- **普通用户**: 查看和注册公开活动
- **会员**: 享受会员价格和优先注册权

## 🚀 部署说明

### 开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 生产构建
```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### Netlify部署
```bash
# 部署到Netlify
npm run deploy:netlify
```

## 🐛 故障排除

### 常见问题

1. **活动创建失败**
   - 检查Firebase配置是否正确
   - 确认用户权限是否足够
   - 查看浏览器控制台错误信息

2. **注册功能异常**
   - 检查活动状态是否为"已发布"
   - 确认注册时间是否在有效期内
   - 验证用户是否已经注册过该活动

3. **数据加载缓慢**
   - 检查网络连接
   - 确认Firebase服务状态
   - 考虑添加数据缓存

## 📈 未来规划

### 计划功能
- [ ] 活动日历视图
- [ ] 邮件通知系统
- [ ] 移动端应用
- [ ] 活动评价系统
- [ ] 社交媒体集成
- [ ] 多语言支持
- [ ] 活动模板功能
- [ ] 高级数据分析

### 性能优化
- [ ] 图片压缩和CDN
- [ ] 数据分页优化
- [ ] 缓存策略改进
- [ ] 代码分割和懒加载

## 🤝 贡献指南

欢迎为活动管理系统贡献代码！请遵循以下步骤：

1. Fork项目仓库
2. 创建功能分支
3. 提交代码更改
4. 创建Pull Request
5. 等待代码审查

## 📞 支持联系

如有任何问题或建议，请联系：
- 邮箱: tech@jcikl.org
- 电话: +60 3-1234 5678
- 地址: JCI Kuala Lumpur Office

---

**JCI Kuala Lumpur 活动管理系统** - 让活动管理更简单、更高效！
