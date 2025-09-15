// 新奖励指标管理系统类型定义

// 奖励层级枚举
export type AwardLevel = 'star_point' | 'national_area_incentive' | 'e_awards';

// Star Point 类别
export type StarPointCategory = 
  | 'efficient_star' 
  | 'network_star' 
  | 'experience_star' 
  | 'outreach_star' 
  | 'social_star';

// National & Area Incentive 类别
export type NationalAreaCategory = 
  | 'individual_award'
  | 'local_organisation_award'
  | 'area_award'
  | 'special_award'
  | 'jci_junior'
  | 'youth_awards';

// E-Awards 类别
export type EAwardCategory = 
  | 'multi_entry_award'
  | 'best_of_the_best_award';

// 统一的奖励类别类型
export type AwardCategoryType = StarPointCategory | NationalAreaCategory | EAwardCategory;

// 分数设置接口
export interface ScoreSetting {
  id: string;
  sequenceNumber: number;
  description: string;
  score: number;
  participantCount?: number;
  eventCount?: number;
  partners?: string;
  eventType?: string;
  memberCount?: number;
  nonMemberCount?: number;
}

// E-Award 要求接口
export interface EAwardRequirement {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  submissionDate?: string;
  documents?: string[];
}

// 团队管理接口（复用现有的）
export interface TeamManagement {
  id: string;
  awardType: 'efficient_star' | 'star_point' | 'national_area_incentive';
  awardId: string;
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
  isRequired: boolean;
  maxMembers?: number;
  order: number;
}

export interface TeamMember {
  id: string;
  memberId: string;
  memberName: string;
  positionId: string;
  positionName: string;
  assignedAt: string;
  assignedBy: string;
  status: 'active' | 'inactive' | 'pending';
  notes?: string;
}

// 统一的指标接口
export interface Indicator {
  id: string;
  no: number;
  title: string;
  description: string;
  deadline: string;
  externalLink?: string;
  score: number;
  myScore?: number;
  status: 'pending' | 'completed' | 'overdue';
  guidelines?: string;
  responsiblePerson?: string;
  team?: string[];
  teamManagement?: TeamManagement;
  scoreSettings?: ScoreSetting[];
  
  // Star Point 特有字段
  objective?: string;
  note?: string;
  points?: number;
  
  // National & Area Incentive 特有字段
  nationalAllocation?: string;
  areaAllocation?: string;
  
  // E-Awards 特有字段
  submissionPeriod?: {
    start: string;
    end: string;
  };
  requirements?: EAwardRequirement[];
  
  // 元数据
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

// 奖励指标接口
export interface AwardIndicator {
  id: string;
  level: AwardLevel;
  category: AwardCategoryType;
  title: string;
  description: string;
  indicators: Indicator[];
  year: number;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

// 创建奖励指标的输入类型
export interface CreateAwardIndicatorInput {
  level: AwardLevel;
  category: AwardCategoryType;
  title: string;
  description: string;
  year: number;
  createdBy: string;
}

// 更新奖励指标的输入类型
export interface UpdateAwardIndicatorInput {
  title?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'draft';
  updatedBy: string;
}

// 创建指标的输入类型
export interface CreateIndicatorInput {
  awardIndicatorId: string;
  no: number;
  title: string;
  description: string;
  deadline: string;
  externalLink?: string;
  score: number;
  myScore?: number;
  status?: 'pending' | 'completed' | 'overdue';
  guidelines?: string;
  responsiblePerson?: string;
  team?: string[];
  teamManagement?: TeamManagement;
  scoreSettings?: ScoreSetting[];
  
  // Star Point 特有字段
  objective?: string;
  note?: string;
  points?: number;
  
  // National & Area Incentive 特有字段
  nationalAllocation?: string;
  areaAllocation?: string;
  
  // E-Awards 特有字段
  submissionPeriod?: {
    start: string;
    end: string;
  };
  requirements?: EAwardRequirement[];
  
  createdBy: string;
}

// 更新指标的输入类型
export interface UpdateIndicatorInput {
  awardIndicatorId?: string; // 支持类别变更
  no?: number;
  title?: string;
  description?: string;
  deadline?: string;
  externalLink?: string;
  score?: number;
  myScore?: number;
  status?: 'pending' | 'completed' | 'overdue';
  guidelines?: string;
  responsiblePerson?: string;
  team?: string[];
  teamManagement?: TeamManagement;
  scoreSettings?: ScoreSetting[];
  
  // Star Point 特有字段
  objective?: string;
  note?: string;
  points?: number;
  
  // National & Area Incentive 特有字段
  nationalAllocation?: string;
  areaAllocation?: string;
  
  // E-Awards 特有字段
  submissionPeriod?: {
    start: string;
    end: string;
  };
  requirements?: EAwardRequirement[];
  
  updatedBy: string;
}

// 奖励指标统计接口
export interface AwardIndicatorStats {
  totalIndicators: number;
  activeIndicators: number;
  completedIndicators: number;
  totalScore: number;
  currentScore: number;
  completionRate: number;
  categoryBreakdown: {
    category: AwardCategoryType;
    count: number;
    score: number;
  }[];
}
