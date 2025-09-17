# JCI Malaysia 奖励管理系统指南

## 📋 功能概述

JCI Malaysia 奖励管理系统是一个完整的年度理事团任务和奖励管理平台，支持以下四个主要奖励类别：

1. **Efficient Star** - 高效之星奖励
2. **Star Point** - 星级积分系统（包含4个子类别）
3. **National & Area Incentive** - 国家与区域激励奖励
4. **E-Awards** - 电子奖励系统

## 🎯 主要功能

### 1. Efficient Star（高效之星）

#### 功能特点
- **标准管理**: 管理年度理事团任务标准
- **分数追踪**: 实时跟踪完成进度和分数
- **等级评定**: 根据分数自动评定等级
  - 90%-99%: Good Local Organization Management
  - 100%-119%: Efficient Local Organization Management
  - 120%-134%: Super Efficient Local Organization Management
  - 135%-140%: Ultra Efficient Local Organization Management

#### 主要标准
- 更新本地官员信息
- 提交文件和合规性检查
- 年度会议记录提交
- 预算和行动计划批准

### 2. Star Point（星级积分）

#### 四个子类别

##### Network Star（网络之星）
- **目标**: 鼓励会员积极参与JCI/JCIM活动，提升网络和社交技能
- **活动**: 
  - Leadership Summit参与
  - Area Conventions注册
  - 培训和LO活动

##### Experience Star（经验之星）
- **目标**: 通过多样化经验提升领导技能和个人发展
- **活动**:
  - 培训项目参与
  - 技能发展课程
  - 领导力发展项目

##### Outreach Star（外展之星）
- **目标**: 参与社区外展活动，展示领导力和社会责任
- **活动**:
  - 社区服务项目
  - 社会影响活动
  - 公益项目组织

##### Social Star（社交之星）
- **目标**: 通过社交活动建立会员间的强关系
- **活动**:
  - 社交活动参与
  - 会员聚会
  - 团队建设活动

### 3. National & Area Incentive（国家与区域激励）

#### 奖励类别
- **A. Individual Awards** - 个人奖项
- **B. Local Organisation Awards** - 本地组织奖项
- **C. Area Awards** - 区域奖项
- **D. Special Awards** - 特殊奖项
- **E. JCI Junior, Youth Awards** - JCI青少年奖项

#### 分配系统
- **National**: 国家级分配（如1**, 3, 1等）
- **Area**: 区域级分配（如-, 1*, 1等）

### 4. E-Awards（电子奖励）

#### 功能特点
- 在线提交系统
- 电子文档管理
- 自动化审核流程
- 数字证书生成

## 🏗️ 技术架构

### 前端组件结构
```
src/
├── types/
│   └── awards.ts                 # 奖励系统类型定义
├── services/
│   └── awardService.ts           # 奖励管理服务
├── components/
│   ├── EfficientStarAward.tsx    # Efficient Star组件
│   ├── StarPointAward.tsx        # Star Point组件
│   ├── StarPointCategories.tsx   # Star Point子类别组件
│   ├── NationalAreaIncentiveAward.tsx # National & Area Incentive组件
│   └── AwardsDashboard.tsx       # 奖励仪表板
└── pages/
    └── AwardsManagementPage.tsx  # 奖励管理主页面
```

### 数据模型

#### Award（奖励基础）
```typescript
interface Award {
  id: string;
  title: string;
  description: string;
  category: AwardCategory;
  year: number;
  status: AwardStatus;
  createdAt: string;
  updatedAt: string;
}
```

#### EfficientStarAward（高效之星）
```typescript
interface EfficientStarAward extends Award {
  standards: EfficientStarStandard[];
  totalScore: number;
  currentScore: number;
  deadline: string;
  criteria: EfficientStarCriteria;
}
```

#### StarPointAward（星级积分）
```typescript
interface StarPointAward extends Award {
  starCategories: StarCategory[];
  totalScore: number;
  currentScore: number;
  deadline: string;
  terms: string[];
}
```

## 📊 仪表板功能

### 总体统计
- **Total Awards**: 总奖励数量
- **Active Awards**: 活跃奖励数量
- **Total Score**: 总分数
- **Average Score**: 平均分数

### 分类统计
- 各奖励类别的完成情况
- 分数分布和进度
- 活动参与统计

### 最近活动
- 分数提交历史
- 审核状态跟踪
- 成就摘要

## 🔧 使用方法

### 1. 访问奖励管理
1. 登录系统后，在左侧导航栏点击"奖励管理"
2. 选择相应的奖励类别：
   - 奖励仪表板
   - Efficient Star
   - Star Point
   - National & Area Incentive
   - E-Awards

### 2. 提交分数
1. 在相应奖励页面找到要提交的活动
2. 点击"View"按钮
3. 填写分数和证据
4. 提交审核

### 3. 查看进度
1. 在仪表板查看总体进度
2. 在各奖励页面查看详细进度
3. 使用进度条和统计图表跟踪完成情况

## 🎨 界面特色

### 设计风格
- **深色主题**: 专业的深色界面设计
- **响应式布局**: 适配不同屏幕尺寸
- **直观导航**: 清晰的菜单结构和面包屑导航

### 视觉元素
- **进度条**: 圆形和线性进度条显示完成度
- **状态标签**: 颜色编码的状态指示器
- **图标系统**: 统一的图标语言
- **数据可视化**: 图表和统计信息展示

## 📝 数据初始化

### 初始化脚本
使用 `scripts/initAwardData.js` 脚本初始化示例数据：

```bash
node scripts/initAwardData.js
```

### 示例数据包含
- Efficient Star 标准配置
- Star Point 四个子类别活动
- National & Area Incentive 奖励列表
- 完整的评分标准和指南链接

## 🔐 权限管理

### 用户角色
- **会员**: 查看和提交分数
- **管理员**: 管理奖励配置和审核分数
- **超级管理员**: 完整系统管理权限

### 权限控制
- 基于现有RBAC系统
- 细粒度权限控制
- 审核流程管理

## 🚀 未来扩展

### 计划功能
1. **E-Awards完整实现**
2. **移动端应用**
3. **自动化审核**
4. **报告生成**
5. **通知系统**
6. **积分兑换系统**

### 集成计划
- 与现有会员管理系统集成
- 与活动管理系统联动
- 与财务系统数据同步

## 📞 技术支持

如有问题或建议，请联系系统管理员或开发团队。

---

*最后更新: 2025年1月*
