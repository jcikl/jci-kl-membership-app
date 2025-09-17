# JCI Malaysia 增强奖励系统使用指南

## 概述

本系统为JCI Malaysia会员管理系统提供了完整的奖励管理功能，包括历史指标查看、年度指标管理、活动参与追踪和竞争对手分数追踪等功能。

## 功能特性

### 1. 历史指标查看 (Historical Indicators)
- **功能描述**: 查看历年指标数据和趋势对比
- **访问路径**: `/awards/historical`
- **主要功能**:
  - 多年份指标对比分析
  - 按奖励类别筛选
  - 指标完成率统计
  - 历史趋势可视化
  - 数据导出功能

### 2. 指标管理 (Indicator Management)
- **功能描述**: 管理员创建和管理年度指标
- **访问路径**: `/awards/indicators`
- **权限要求**: 管理员权限
- **主要功能**:
  - 4级指标层级结构管理
  - 指标创建、编辑、删除
  - 层级关系设置
  - 分数目标设定
  - 负责人分配
  - 截止日期管理

#### 指标层级结构
- **Level 1**: 主要类别 (如 Efficient Star, Star Point)
- **Level 2**: 子类别 (如 Network Star, Experience Star)
- **Level 3**: 具体指标 (如 参与JCI活动)
- **Level 4**: 详细任务 (如 参加年度大会)

### 3. 活动参与追踪 (Activity Tracker)
- **功能描述**: 追踪会员活动参与记录
- **访问路径**: `/awards/tracker`
- **权限要求**: 开发者权限
- **主要功能**:
  - 活动参与记录管理
  - 自动分数更新
  - 手动分数调整
  - 证据文件上传
  - 参与验证状态管理

### 4. 竞争对手分数追踪 (Competitor Tracker)
- **功能描述**: 追踪竞争对手分数和排名
- **访问路径**: `/awards/competitors`
- **权限要求**: 开发者权限
- **主要功能**:
  - 竞争对手信息管理
  - 分数排名展示
  - 类别分数分析
  - 竞争策略制定支持

## 数据模型

### 指标 (Indicator)
```typescript
interface Indicator {
  id: string;
  title: string;                    // 指标标题
  description: string;              // 指标描述
  detailedExplanation: string;      // 详细解释
  scoringConditions: string;        // 得分条件
  responsiblePerson: string;        // 负责人
  deadline: string;                 // 期限
  year: number;                     // 年份
  category: AwardCategory;          // 奖励类别
  level: IndicatorLevel;            // 层级 (1-4)
  type: IndicatorType;              // 指标类型
  status: IndicatorStatus;          // 状态
  
  // 分数设置
  targetScore: number;              // 目标分数
  maxScore: number;                 // 最高分数
  participationScore: number;        // 参与分数
  attendanceScore: number;          // 出席分数
  
  // 层级关系
  parentId?: string;                // 父级指标ID
  children?: Indicator[];           // 子级指标
  
  // 活动关联
  relatedActivities?: string[];     // 相关活动ID列表
}
```

### 活动参与记录 (ActivityParticipationRecord)
```typescript
interface ActivityParticipationRecord {
  id: string;
  memberId: string;                 // 会员ID
  activityId: string;               // 活动ID
  indicatorId: string;              // 指标ID
  year: number;                     // 年份
  
  // 参与信息
  participationType: 'attended' | 'organized' | 'volunteered' | 'presented';
  participationDate: string;         // 参与日期
  duration: number;                 // 持续时间(小时)
  
  // 分数
  score: number;                    // 基础分数
  bonusScore?: number;              // 奖励分数
  
  // 验证信息
  verified: boolean;                // 是否已验证
  verifiedBy?: string;              // 验证人
  verifiedAt?: string;              // 验证时间
  
  // 证据
  evidence?: string[];               // 证据文件URLs
  notes?: string;                   // 备注
}
```

## 使用流程

### 管理员设置年度指标
1. 登录系统，确保具有管理员权限
2. 导航到 "奖励管理" > "指标管理"
3. 点击 "Create Indicator" 创建新指标
4. 填写指标信息：
   - 选择层级 (Level 1-4)
   - 设置奖励类别
   - 定义分数目标
   - 指定负责人
   - 设置截止日期
5. 保存指标，系统自动构建层级关系

### 开发者追踪活动参与
1. 登录系统，确保具有开发者权限
2. 导航到 "奖励管理" > "活动追踪"
3. 添加活动参与记录：
   - 选择相关指标
   - 记录参与类型和时长
   - 设置分数
   - 上传证据文件
4. 使用 "Auto Update Scores" 自动更新指标分数

### 查看历史指标对比
1. 导航到 "奖励管理" > "历史指标"
2. 选择要对比的年份
3. 选择奖励类别筛选
4. 查看指标完成情况和趋势分析
5. 导出数据用于报告

### 竞争对手分析
1. 登录系统，确保具有开发者权限
2. 导航到 "奖励管理" > "竞争对手追踪"
3. 添加竞争对手信息
4. 定期更新分数数据
5. 分析排名和竞争态势

## 权限管理

### 角色权限
- **普通会员**: 只能查看历史指标和奖励仪表板
- **管理员**: 可以管理指标创建和编辑
- **开发者**: 可以追踪活动参与和竞争对手分数

### 功能访问控制
- 指标管理功能仅限管理员访问
- 活动追踪和竞争对手追踪仅限开发者访问
- 历史指标查看对所有用户开放

## 技术实现

### 服务层
- `indicatorService`: 指标管理服务
- `awardService`: 奖励管理服务

### 组件结构
- `HistoricalIndicatorsView`: 历史指标查看组件
- `IndicatorManagement`: 指标管理组件
- `ActivityParticipationTracker`: 活动参与追踪组件
- `CompetitorScoreTracker`: 竞争对手追踪组件

### 数据存储
- Firebase Firestore 用于数据持久化
- 实时数据同步和更新
- 支持复杂查询和聚合操作

## 最佳实践

### 指标设计
1. 确保指标层级结构清晰合理
2. 设置合理的分数目标和权重
3. 明确负责人和截止日期
4. 提供详细的得分条件说明

### 数据管理
1. 定期备份重要数据
2. 及时更新活动参与记录
3. 验证分数数据的准确性
4. 保持竞争对手信息的时效性

### 用户体验
1. 提供清晰的操作指引
2. 及时反馈操作结果
3. 支持数据导出和报告生成
4. 确保界面响应性和易用性

## 故障排除

### 常见问题
1. **权限不足**: 确保用户具有相应的角色权限
2. **数据加载失败**: 检查网络连接和Firebase配置
3. **分数更新异常**: 验证活动参与记录的数据完整性
4. **层级关系错误**: 检查指标的parentId设置

### 技术支持
如遇到技术问题，请联系系统管理员或开发团队。

## 更新日志

### v2.0.0 (当前版本)
- 新增历史指标查看功能
- 实现4级指标层级管理
- 添加活动参与追踪系统
- 开发竞争对手分数追踪功能
- 完善权限管理和访问控制

### v1.0.0
- 基础奖励系统实现
- Efficient Star, Star Point, National & Area Incentive, E-Awards 支持
- 奖励仪表板和统计功能
