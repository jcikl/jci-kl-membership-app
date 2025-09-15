// JCI Malaysia 奖励系统类型定义

export interface Award {
  id: string;
  title: string;
  description: string;
  category: AwardCategory;
  year: number;
  status: AwardStatus;
  createdAt: string;
  updatedAt: string;
}

export type AwardCategory = 
  | 'efficient_star'
  | 'star_point'
  | 'national_area_incentive'
  | 'e_awards'
  | 'network_star'
  | 'experience_star'
  | 'social_star'
  | 'outreach_star';

export type AwardStatus = 
  | 'draft'
  | 'active'
  | 'completed'
  | 'archived'
  | 'open'
  | 'closed'
  | 'evaluating';

// 统一的Standard接口
export interface Standard {
  id: string;
  no: number;
  title: string;
  description: string;
  deadline: string;
  externalLink?: string; // 外部资料链接
  score: number;
  myScore?: number;
  status: 'pending' | 'completed' | 'overdue';
  guidelines?: string;
  subStandards?: SubStandard[];
  responsiblePerson?: string; // 负责人
  team?: string[]; // 团队成员
  teamManagement?: TeamManagement; // 团队管理
  scoreSettings?: any[]; // 分数设置
  // 新增字段用于统一管理
  category?: string; // 类别：efficient_star, network_star, experience_star, outreach_star, social_star
  type?: string; // 类型标识
  objective?: string; // 目标（Star Point专用）
  note?: string; // 备注（Star Point专用）
  points?: number; // 分数（Star Point专用）
}

export interface SubStandard {
  id: string;
  no: string; // 如 "2.1", "2.2"
  title: string;
  description: string;
  deadline: string;
  score: number;
  myScore?: number;
  status: 'pending' | 'completed' | 'overdue';
  guidelines?: string;
  responsiblePerson?: string; // 负责人
  team?: string[]; // 团队成员
}

// Efficient Star 奖励系统
export interface EfficientStarAward extends Award {
  category: 'efficient_star';
  standards: Standard[]; // 使用统一的Standard接口
  totalScore: number;
  currentScore: number;
  deadline: string;
  criteria: EfficientStarCriteria;
  categories?: string[]; // 新增：支持的类别列表
}

// 保持向后兼容的别名
export type EfficientStarStandard = Standard;
export type EfficientStarSubStandard = SubStandard;

export interface EfficientStarCriteria {
  tiers: {
    score: string; // 如 "90%-99%"
    award: string; // 如 "Good Local Organization Management"
  }[];
}

// Star Point 奖励系统 - 按具体Star类别独立存储
export interface StarPointAward extends Award {
  category: StarCategoryType; // 具体类别：network_star, experience_star, social_star, outreach_star
  standards: Standard[]; // 统一使用Standard接口
  totalScore: number;
  currentScore: number;
  deadline: string;
  terms: string[];
  starType: StarCategoryType; // 明确的Star类型
}

// Star Point 统称接口 - 用于管理所有Star类别
export interface StarPointManagement {
  year: number;
  starCategories: StarCategoryType[]; // 支持的Star类别列表
  totalStarScore: number; // 所有Star类别的总分
  currentStarScore: number; // 当前所有Star类别的分数
  deadline: string; // 统一截止日期
  terms: string[]; // 统一条款
  createdAt: string;
  updatedAt: string;
}

// Star Category类型定义
export type StarCategoryType = 
  | 'efficient_star'
  | 'network_star'
  | 'experience_star'
  | 'outreach_star'
  | 'social_star';

// 保持向后兼容的接口
export interface StarCategory {
  id: string;
  type: StarCategoryType;
  title: string;
  description: string;
  deadline?: string; // 截至日期
  externalLink?: string; // 外部资料链接
  objective: string;
  note?: string;
  points: number;
  myPoints: number;
  activities: StarActivity[];
  scoreSettings?: any[]; // 分数设置
  teamManagement?: TeamManagement; // 团队管理
}

export interface StarActivity {
  id: string;
  no: number;
  title: string;
  description: string;
  score: string; // 如 "20 points per LO President"
  myScore?: number;
  status: 'pending' | 'completed' | 'overdue';
  guidelines?: string;
  deadline?: string;
  responsiblePerson?: string; // 负责人
  team?: string[]; // 团队成员
  teamManagement?: TeamManagement; // 团队管理
}

// National & Area Incentive 奖励系统
export interface NationalAreaIncentiveAward extends Award {
  category: 'national_area_incentive';
  awardCategories: IncentiveAwardCategory[];
  submissionGuideline?: string;
}

export interface IncentiveAwardCategory {
  id: string;
  category: string; // 如 "A. Individual Awards"
  awards: IncentiveAward[];
}

export interface IncentiveAward {
  id: string;
  no: string; // 如 "A01"
  title: string;
  description?: string; // 描述
  deadline?: string; // 截至日期
  externalLink?: string; // 外部资料链接
  nationalAllocation: string; // 如 "1**", "3"
  areaAllocation: string; // 如 "-", "1*"
  guidelines?: string;
  status: 'open' | 'closed' | 'completed';
  responsiblePerson?: string; // 负责人
  team?: string[]; // 团队成员
  teamManagement?: TeamManagement; // 团队管理
  scoreSettings?: any[]; // 分数设置
}

// E-Awards 奖励系统
export interface EAward extends Award {
  category: 'e_awards';
  submissionPeriod: {
    start: string;
    end: string;
  };
  requirements: EAwardRequirement[];
  status: 'open' | 'closed' | 'evaluating' | 'completed';
  // Additional fields for the new E-Awards system
  title: string;
  description: string;
  criteria: string;
  maxScore: number;
  deadline?: string;
  instructions?: string;
  createdBy: string;
  updatedBy: string;
}

export type EAwardCategory = 
  | 'individual'
  | 'organization' 
  | 'project'
  | 'leadership'
  | 'innovation';

export interface EAwardSubmission {
  id: string;
  awardId: string;
  memberId: string;
  year: number;
  score: number;
  evidence: string;
  supportingDocuments?: string[];
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EAwardCriteria {
  id: string;
  title: string;
  description: string;
  maxScore: number;
  weight: number;
}

export interface EAwardRequirement {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  submissionDate?: string;
  documents?: string[];
}

// 奖励评分记录
export interface AwardScoreRecord {
  id: string;
  awardId: string;
  memberId: string;
  score: number;
  maxScore: number;
  percentage: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  notes?: string;
  evidence?: string[]; // 证据文件URLs
}

// 奖励提交记录
export interface AwardSubmission {
  id: string;
  awardId: string;
  memberId: string;
  submissionType: 'standard' | 'activity' | 'requirement';
  submissionData: any; // 根据具体奖励类型而定
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  feedback?: string;
  documents?: string[];
}

// 奖励统计
export interface AwardStatistics {
  totalAwards: number;
  activeAwards: number;
  completedAwards: number;
  totalScore: number;
  averageScore: number;
  memberRanking: number;
  categoryBreakdown: {
    category: AwardCategory;
    count: number;
    score: number;
  }[];
}

// 指标层级定义
export type IndicatorLevel = 1 | 2 | 3 | 4;

// 指标类型
export type IndicatorType = 
  | 'participation'      // 活动参与
  | 'attendance'         // 出席率
  | 'leadership'         // 领导力
  | 'community_service'  // 社区服务
  | 'networking'         // 网络建设
  | 'training'          // 培训完成
  | 'project'           // 项目管理
  | 'other';            // 其他

// 指标状态
export type IndicatorStatus = 
  | 'draft'             // 草稿
  | 'active'            // 活跃
  | 'completed'         // 已完成
  | 'archived'          // 已归档
  | 'cancelled';        // 已取消

// 4级指标层级结构
export interface Indicator {
  id: string;
  title: string;
  description: string;
  detailedExplanation: string;
  scoringConditions: string;
  responsiblePerson: string;
  deadline: string;
  year: number;
  category: AwardCategory;
  level: IndicatorLevel;
  type: IndicatorType;
  status: IndicatorStatus;
  
  // 分数设置
  targetScore: number;           // 目标分数
  maxScore: number;             // 最高分数
  participationScore: number;   // 参与分数
  attendanceScore: number;      // 出席分数
  
  // 层级关系
  parentId?: string;            // 父级指标ID
  children?: Indicator[];       // 子级指标
  
  // 活动关联
  relatedActivities?: string[]; // 相关活动ID列表
  
  // 元数据
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

// 指标完成记录
export interface IndicatorCompletion {
  id: string;
  indicatorId: string;
  memberId: string;
  year: number;
  
  // 完成情况
  actualScore: number;
  participationCount: number;
  attendanceCount: number;
  
  // 状态
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completionDate?: string;
  
  // 证据和备注
  evidence?: string[];
  notes?: string;
  
  // 审核信息
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  
  createdAt: string;
  updatedAt: string;
}

// 历史指标对比
export interface HistoricalIndicatorComparison {
  indicatorId: string;
  title: string;
  years: {
    year: number;
    targetScore: number;
    averageScore: number;
    completionRate: number;
    participantCount: number;
  }[];
}

// 竞争对手分数追踪
export interface CompetitorScoreTracking {
  id: string;
  competitorName: string;
  competitorType: 'individual' | 'organization' | 'chapter';
  year: number;
  category: AwardCategory;
  
  // 分数信息
  totalScore: number;
  categoryScores: {
    category: AwardCategory;
    score: number;
    indicators: {
      indicatorId: string;
      score: number;
      completionRate: number;
    }[];
  }[];
  
  // 追踪信息
  lastUpdated: string;
  updatedBy: string;
  notes?: string;
  
  createdAt: string;
}

// 活动参与记录
export interface ActivityParticipationRecord {
  id: string;
  memberId: string;
  activityId: string;
  indicatorId: string;
  year: number;
  
  // 参与信息
  participationType: 'attended' | 'organized' | 'volunteered' | 'presented';
  participationDate: string;
  duration: number; // 小时
  
  // 分数
  score: number;
  bonusScore?: number;
  
  // 验证信息
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  
  // 证据
  evidence?: string[];
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

// 奖励配置
export interface AwardConfiguration {
  year: number;
  efficientStar: {
    enabled: boolean;
    deadline: string;
    criteria: EfficientStarCriteria;
  };
  starPoint: {
    enabled: boolean;
    deadline: string;
    categories: StarCategoryType[];
  };
  nationalAreaIncentive: {
    enabled: boolean;
    submissionPeriod: {
      start: string;
      end: string;
    };
  };
  eAwards: {
    enabled: boolean;
    submissionPeriod: {
      start: string;
      end: string;
    };
  };
}

// 团队管理相关类型定义
export interface TeamManagement {
  id: string;
  awardType: 'efficient_star' | 'star_point' | 'national_area_incentive';
  awardId: string; // 关联的奖励ID
  positions: TeamPosition[];
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamPosition {
  id: string;
  name: string;
  description: string;
  responsibilities: string[];
  requiredSkills?: string[];
  isRequired: boolean; // 是否必需职位
  maxMembers?: number; // 最大成员数
  order: number; // 排序
}

export interface TeamMember {
  id: string;
  memberId: string; // 关联的会员ID
  memberName: string;
  positionId: string; // 关联的职位ID
  positionName: string;
  assignedAt: string;
  assignedBy: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
}
