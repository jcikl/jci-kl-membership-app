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
  | 'e_awards';

export type AwardStatus = 
  | 'draft'
  | 'active'
  | 'completed'
  | 'archived'
  | 'open'
  | 'closed'
  | 'evaluating';

// 团队管理相关类型
export interface TeamMember {
  id: string;
  memberId: string;
  name: string;
  position: string; // 职位
  email: string;
  phone?: string;
  role: TeamRole;
  isActive: boolean;
  joinedAt: string;
  notes?: string;
}

export type TeamRole = 
  | 'leader'      // 负责人
  | 'coordinator'  // 协调员
  | 'member'       // 成员
  | 'advisor';     // 顾问

export interface AwardTeam {
  id: string;
  awardId: string;
  awardType: AwardCategory;
  teamName: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

// Efficient Star 奖励系统
export interface EfficientStarAward extends Award {
  category: 'efficient_star';
  standards: EfficientStarStandard[];
  totalScore: number;
  currentScore: number;
  deadline: string;
  criteria: EfficientStarCriteria;
  team?: AwardTeam; // 团队信息
}

export interface EfficientStarStandard {
  id: string;
  no: number;
  title: string;
  description: string;
  deadline: string;
  score: number;
  myScore?: number;
  status: 'pending' | 'completed' | 'overdue';
  guidelines?: string;
  subStandards?: EfficientStarSubStandard[];
}

export interface EfficientStarSubStandard {
  id: string;
  no: string; // 如 "2.1", "2.2"
  title: string;
  description: string;
  deadline: string;
  score: number;
  myScore?: number;
  status: 'pending' | 'completed' | 'overdue';
  guidelines?: string;
}

export interface EfficientStarCriteria {
  tiers: {
    score: string; // 如 "90%-99%"
    award: string; // 如 "Good Local Organization Management"
  }[];
}

// Star Point 奖励系统
export interface StarPointAward extends Award {
  category: 'star_point';
  starCategories: StarCategory[];
  totalScore: number;
  currentScore: number;
  deadline: string;
  terms: string[];
  team?: AwardTeam; // 团队信息
}

export type StarCategoryType = 
  | 'network_star'
  | 'experience_star'
  | 'outreach_star'
  | 'social_star';

export interface StarCategory {
  id: string;
  type: StarCategoryType;
  title: string;
  description: string;
  objective: string;
  note?: string;
  points: number;
  myPoints: number;
  activities: StarActivity[];
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
}

// National & Area Incentive 奖励系统
export interface NationalAreaIncentiveAward extends Award {
  category: 'national_area_incentive';
  awardCategories: IncentiveAwardCategory[];
  submissionGuideline?: string;
  team?: AwardTeam; // 团队信息
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
  nationalAllocation: string; // 如 "1**", "3"
  areaAllocation: string; // 如 "-", "1*"
  guidelines?: string;
  status: 'open' | 'closed' | 'completed';
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
