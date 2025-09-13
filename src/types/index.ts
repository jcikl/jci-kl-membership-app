// 会员相关类型定义
export interface Member {
  id: string;
  email: string;
  name: string;
  phone: string;
  memberId: string; // 会员编号
  joinDate: string;
  status: MemberStatus;
  level: MemberLevel;
  accountType?: string; // 用户户口类别（用于权限控制）
  profile: MemberProfile;
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfile {
  avatar?: string;
  birthDate?: string; // dd-mmm-yyyy
  gender?: 'Male' | 'Female' | null;
  race?: 'Chinese' | 'Malay' | 'Indian' | 'Other' | null;
  address?: string; // Home Address

  // Personal names
  fullNameNric?: string; // Full Name as per NRIC
  
  // Senator ID
  senatorId?: string; // 参议员编号
  senatorVerified?: boolean; // 参议员验证状态
  
  // 参议员分数管理
  senatorScore?: number; // 参议员分数
  senatorScoreHistory?: Array<{
    id: string;
    score: number;
    reason: string;
    awardedBy: string;
    awardedDate: string;
    notes?: string;
  }>; // 分数历史记录
  
  // 活动参与管理
  activityParticipation?: Array<{
    id: string;
    activityName: string;
    activityType: 'meeting' | 'event' | 'training' | 'volunteer' | 'other';
    participationDate: string;
    status: 'attended' | 'absent' | 'excused';
    points?: number;
    notes?: string;
  }>; // 活动参与记录

  // Social & contact
  linkedin?: string;
  companyWebsite?: string;

  // Company / career
  company?: string; // Company/Business/Employer Name
  industryDetail?: string; // More specify about your industry
  ownIndustry?: Array<
    | 'Advertising, Marketing & Media'
    | 'Agriculture & Animals'
    | 'Architecture, Engineering & Construction'
    | 'Art, Entertainment & Design'
    | 'Automotive & Accessories'
    | 'Food & Beverages'
    | 'Computers & IT'
    | 'Consulting & Professional Services'
    | 'Education & Training'
    | 'Event & Hospitality'
    | 'Finance & Insurance'
    | 'Health, Wellness & Beauty'
    | 'Legal & Accounting'
    | 'Manufacturing'
    | 'Retail & E-Commerce'
    | 'Real Estate & Property Services'
    | 'Repair Services'
    | 'Security & Investigation'
    | 'Transport & Logistics'
    | 'Travel & Tourism'
    | 'Other'
  >; // 自身行业信息
  departmentAndPosition?: string; // Department & Position
  categories?: Array<'Distributor' | 'Manufacturer' | 'Retailer / E-commerce' | 'Service Provider'>; // multi-select
  interestedIndustries?: Array<
    | 'Advertising, Marketing & Media'
    | 'Agriculture & Animals'
    | 'Architecture, Engineering & Construction'
    | 'Art, Entertainment & Design'
    | 'Automotive & Accessories'
    | 'Food & Beverages'
    | 'Computers & IT'
    | 'Consulting & Professional Services'
    | 'Education & Training'
    | 'Event & Hospitality'
    | 'Finance & Insurance'
    | 'Health, Wellness & Beauty'
    | 'Legal & Accounting'
    | 'Manufacturing'
    | 'Retail & E-Commerce'
    | 'Real Estate & Property Services'
    | 'Repair Services'
    | 'Security & Investigation'
    | 'Transport & Logistics'
    | 'Travel & Tourism'
    | 'Other'
  >;

  // Interests / Hobbies
  hobbies?: Array<
    | 'Badminton'
    | 'Golf'
    | 'Basketball'
    | 'Pickle Ball'
    | 'E-Sport MLBB'
    | 'other E-sport'
    | 'Rock Climbing'
    | 'Hiking'
    | 'Car Enthusiast'
    | 'Liquor/ Wine tasting (Wine/ Whisky/ Brandy & etc.)'
    | 'Movie'
    | 'Public Speaking'
    | 'Reading'
    | 'Dancing'
    | 'Singing'
    | 'Other'
    | 'Not at this moment'
  >;

  // JCI Interests
  jciEventInterests?: string; // What types of JCI events or programs you are interested?
  jciBenefitsExpectation?: string; // Are there any resources/ activities/ benefits that you wish to gain through JCI KL?

  // IDs
  nricOrPassport?: string;
  nationality?: string; // 国籍（用于拜访会员审核）

  // Business profile
  companyIntro?: string; // Briefly share your company’s operations and your role

  // Introducer
  introducerName?: string;

  // Personal goals
  fiveYearsVision?: string; // Where do you see yourself in 5 years?
  activeMemberHow?: string; // How would you like to be an active member?

  // Shirt / merch
  nameToBeEmbroidered?: string;
  shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | null; // JCI KL Pink Shirt
  jacketSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | null; // JCI KL Jacket
  cutting?: 'Unisex' | 'Lady' | null; // Cutting - JCI KL Pink Shirt
  tshirtReceivingStatus?: 'Pending' | 'Requested' | 'Processing' | 'Delivered' | null;

  // Preferences & consents
  acceptInternationalBusiness?: 'Yes' | 'No' | 'Willing to explore' | null;
  whatsappGroup?: boolean | null;

  // Links & media
  profilePhotoUrl?: string; // Profile Photo
  paymentSlipUrl?: string; // Payment Slip

  // Dates
  paymentDate?: string; // dd-mmm-yyyy
  endorsementDate?: string; // dd-mmm-yyyy
  paymentVerifiedDate?: string; // Payment verification date dd-mmm-yyyy

  // JCI职位相关
  jciPosition?: 'president' | 'acting_president' | 'secretary_general' | 'treasurer' | 'advisor_president' | 'vice_president' | 'department_head' | 'official_member' | 'associate_member' | 'honorary_member';
  vpDivision?: 'personal_dev' | 'business_dev' | 'international_dev' | 'chapter_admin' | 'community_dev';
  positionStartDate?: string;
  positionEndDate?: string;
  isActingPosition?: boolean;
  actingForPosition?: 'president' | 'acting_president' | 'secretary_general' | 'treasurer' | 'advisor_president' | 'vice_president' | 'department_head' | 'official_member' | 'associate_member' | 'honorary_member';
  
  // 会员分类相关（已迁移到 member_categories 集合）
  // 注意：以下字段已废弃，请使用 categoryService 获取分类信息
  // membershipCategory, accountType, categoryReason, categoryAssignedBy, categoryAssignedDate
  // 分类审核（经理事团）工作流
  proposedMembershipCategory?: 'active' | 'associate' | 'honorary' | 'affiliate' | 'visitor' | 'alumni' | 'corporate' | 'student'; // 系统或用户提交的待审核类别
  categoryReviewStatus?: 'pending' | 'approved' | 'rejected';
  categoryReviewNotes?: string;
  categoryReviewerId?: string;
  categoryReviewedAt?: string;
  // 正式会员指定任务完成标志
  requiredTasksCompleted?: boolean;
  
  // 权限相关
  effectivePermissions?: string[];
  roleBindings?: Array<{
    roleId: string;
    scopes?: Record<string, any>;
    expiresAt?: string;
    delegationRef?: string;
  }>;

  // 自定义任务完成情况（由管理员/开发员定义）
  taskCompletions?: Array<{
    taskId: string;
    title: string;
    type: 'event_participation' | 'committee_role' | 'council_meeting' | 'course_completion' | 'other';
    completed: boolean;
    completedAt?: string;
    metadata?: Record<string, any>; // 例如活动ID、会议日期、课程ID等
  }>;
  
  // 任期管理
  termStartDate?: string;
  termEndDate?: string;
  isCurrentTerm?: boolean;
  
  // 特殊权限标记
  hasSpecialPermissions?: boolean;
  specialPermissions?: string[];
  permissionNotes?: string;

  // Legacy/previous fields for compatibility
  occupation?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'pending';
export type MemberLevel = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// 活动相关类型定义
export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  status: EventStatus;
  registrationDeadline: string;
  fee: number;
  organizer: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

// 用户认证相关
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
}

export type UserRole = 'admin' | 'member' | 'moderator';

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 表单类型
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone: string;
  memberId: string;
}

export interface MemberUpdateForm {
  name?: string;
  phone?: string;
  profile?: Partial<MemberProfile>;
}

// 分会设置
export interface ChapterSettings {
  id: string;
  chapterName: string;
  establishmentYear: number;
  fiscalYear: number; // 财政年度
  fiscalYearStartMonth: number; // 财政年度起始月份 (1-12)
  description?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string;
  // 用户户口类别晋升条件配置
  promotionRules?: {
    minAgeForActive?: number; // 达到年龄可晋升（如40用于affiliate示例，可按需）
    nationalityWhitelist?: string[]; // 国籍名单（如 MY, SG...）
    requirePaymentVerified?: boolean; // 付款已核验
    requireSenatorIdForHonorary?: boolean; // 参议员编号作为荣誉会员前置条件
  };
  createdAt: string;
  updatedAt: string;
}

// 问卷相关类型定义
export interface Survey {
  id: string;
  title: string;
  description?: string;
  status: SurveyStatus;
  type: SurveyType;
  targetAudience: SurveyTargetAudience;
  questions: SurveyQuestion[];
  settings: SurveySettings;
  createdBy: string; // 创建者用户ID
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  expiresAt?: string;
  totalResponses: number;
  isAnonymous: boolean;
  allowMultipleResponses: boolean;
  tags: string[];
}

export type SurveyStatus = 'draft' | 'published' | 'closed' | 'archived';
export type SurveyType = 'feedback' | 'evaluation' | 'registration' | 'poll' | 'assessment' | 'custom';
export type SurveyTargetAudience = 'all_members' | 'official_members' | 'associate_members' | 'honorary_members' | 'affiliate_members' | 'visitor_members' | 'specific_roles' | 'custom';

export interface SurveyQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  order: number;
  options?: SurveyQuestionOption[];
  validation?: QuestionValidation;
  conditionalLogic?: ConditionalLogic;
}

export type QuestionType = 
  | 'text'           // 单行文本
  | 'textarea'       // 多行文本
  | 'single_choice'  // 单选题
  | 'multiple_choice' // 多选题
  | 'rating'         // 评分题
  | 'date'           // 日期
  | 'time'           // 时间
  | 'datetime'       // 日期时间
  | 'email'          // 邮箱
  | 'phone'          // 电话
  | 'number'         // 数字
  | 'url'            // 网址
  | 'file_upload'    // 文件上传
  | 'matrix'         // 矩阵题
  | 'ranking'        // 排序题
  | 'nps'            // NPS评分
  | 'slider';        // 滑块

export interface SurveyQuestionOption {
  id: string;
  label: string;
  value: string;
  order: number;
  isOther?: boolean; // 是否为"其他"选项
}

export interface QuestionValidation {
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string; // 正则表达式
  customMessage?: string;
}

export interface ConditionalLogic {
  conditions: ConditionalRule[];
  action: 'show' | 'hide' | 'require' | 'skip';
}

export interface ConditionalRule {
  questionId: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface SurveySettings {
  allowBackNavigation: boolean;
  showProgressBar: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showQuestionNumbers: boolean;
  autoSave: boolean;
  timeLimit?: number; // 时间限制（分钟）
  maxAttempts?: number; // 最大尝试次数
  customCSS?: string; // 自定义样式
  thankYouMessage?: string; // 完成后的感谢信息
  redirectUrl?: string; // 完成后的重定向URL
}

// 问卷回答相关类型
export interface SurveyResponse {
  id: string;
  surveyId: string;
  respondentId?: string; // 回答者ID，匿名问卷可能为空
  respondentEmail?: string; // 回答者邮箱
  answers: SurveyAnswer[];
  status: ResponseStatus;
  startedAt: string;
  completedAt?: string;
  timeSpent?: number; // 花费时间（秒）
  ipAddress?: string;
  userAgent?: string;
  isAnonymous: boolean;
}

export type ResponseStatus = 'in_progress' | 'completed' | 'abandoned';

export interface SurveyAnswer {
  questionId: string;
  questionType: QuestionType;
  value: AnswerValue;
  answeredAt: string;
}

export type AnswerValue = 
  | string 
  | string[] 
  | number 
  | boolean 
  | Date 
  | File 
  | MatrixAnswer
  | RankingAnswer;

export interface MatrixAnswer {
  rows: Record<string, string>; // 行ID -> 选择的值
}

export interface RankingAnswer {
  items: Array<{
    id: string;
    rank: number;
  }>;
}

// 问卷分析相关类型
export interface SurveyAnalytics {
  surveyId: string;
  totalResponses: number;
  completionRate: number;
  averageTimeSpent: number;
  questionAnalytics: QuestionAnalytics[];
  responseTrends: ResponseTrend[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestionAnalytics {
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  totalAnswers: number;
  completionRate: number;
  averageRating?: number; // 评分题的平均分
  distribution?: Record<string, number>; // 选项分布
  textAnswers?: string[]; // 文本答案（用于文本分析）
}

export interface ResponseTrend {
  date: string;
  responses: number;
  completions: number;
}

// 问卷模板相关类型
export interface SurveyTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  questions: SurveyQuestion[];
  settings: SurveySettings;
  isPublic: boolean;
  createdBy: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TemplateCategory = 'feedback' | 'evaluation' | 'registration' | 'event' | 'training' | 'assessment' | 'general';

// 问卷权限相关类型
export interface SurveyPermission {
  surveyId: string;
  userId: string;
  permissions: SurveyPermissionType[];
  grantedBy: string;
  grantedAt: string;
  expiresAt?: string;
}

export type SurveyPermissionType = 
  | 'view'           // 查看问卷
  | 'edit'           // 编辑问卷
  | 'delete'         // 删除问卷
  | 'publish'        // 发布问卷
  | 'close'          // 关闭问卷
  | 'view_responses' // 查看回答
  | 'export_responses' // 导出回答
  | 'manage_permissions' // 管理权限
  | 'view_analytics'; // 查看分析
