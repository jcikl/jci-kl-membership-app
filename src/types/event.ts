import { Timestamp } from 'firebase/firestore';

// 活动类型枚举
export enum EventType {
  PROGRAM = 'Program',
  SKILL_DEVELOPMENT = 'Skill Development',
  EVENT = 'Event',
  PROJECT = 'Project'
}

// 活动级别枚举
export enum EventLevel {
  LOCAL = 'Local',
  AREA = 'Area',
  NATIONAL = 'National',
  JCI = 'JCI'
}

// 活动状态枚举
export enum EventStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  CANCELLED = 'Cancelled',
  COMPLETED = 'Completed'
}

// 活动类别枚举
export enum EventCategory {
  // 程序类
  MEETING = 'Meeting',
  CONFERENCE = 'Conference',
  SEMINAR = 'Seminar',
  
  // 技能发展类
  WORKSHOP = 'Workshop',
  TRAINING = 'Training',
  JCIM_INSPIRE = 'JCIM Inspire',
  
  // 活动类
  BUSINESS_NETWORKING = 'Business Networking',
  SOCIAL = 'Social',
  SPORTS = 'Sports',
  CULTURAL = 'Cultural',
  
  // 项目类
  COMMUNITY_SERVICE = 'Community Service',
  ENVIRONMENTAL = 'Environmental',
  EDUCATION = 'Education'
}

// 注册状态枚举
export enum RegistrationStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled'
}

// 票务类型枚举
export enum TicketType {
  REGULAR = 'Regular',
  EARLY_BIRD = 'Early Bird',
  MEMBER = 'Member',
  ALUMNI = 'Alumni',
  STUDENT = 'Student'
}

// 项目户口信息
export interface ProjectAccount {
  id: string;
  name: string;
  description: string;
  budget: number;
  currency: string;
  responsiblePerson: string;
  responsiblePersonEmail: string;
  status: 'active' | 'inactive' | 'completed';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 活动基本信息
export interface Event {
  id: string;
  title: string;
  description: string;
  type: EventType;
  category: EventCategory;
  level: EventLevel;
  status: EventStatus;
  
  // 项目户口绑定
  projectAccountId?: string;
  projectAccount?: ProjectAccount;
  
  // 时间信息
  startDate: Timestamp;
  endDate: Timestamp;
  registrationStartDate?: Timestamp;
  registrationEndDate?: Timestamp;
  
  // 地点信息
  venue: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isVirtual: boolean;
  virtualLink?: string;
  
  // 主办方信息
  hostingLO: string; // 主办分会
  coHostingLOs: string[]; // 协办分会
  
  // 联系方式
  contactEmail: string;
  contactPhone?: string;
  
  // 费用信息
  isFree: boolean;
  currency: string;
  regularPrice?: number;
  earlyBirdPrice?: number;
  memberPrice?: number;
  alumniPrice?: number;
  
  // 限制信息
  maxParticipants?: number;
  minParticipants?: number;
  isPrivate: boolean;
  
  // 注册开放对象
  registrationOpenFor: string[]; // ['Member', 'Alumni', 'Friend']
  
  // 活动安排
  programs: EventProgram[];
  
  // 委员会成员
  committeeMembers: CommitteeMember[];
  
  // 讲师信息
  trainers: EventTrainer[];
  
  // 票务信息
  tickets: EventTicket[];
  
  // 注册设置
  registrationSettings: EventRegistrationSettings;
  
  // 封面图片
  coverImageUrl?: string;
  coverImageTemplateUrl?: string;
  
  // Additional properties for form compatibility
  name: string;
  location: string;
  price: number;
  paymentMethods: string[];
  imageUrl: string;
  
  // 系统信息
  createdBy: string;
  createdAt: Timestamp;
  updatedBy: string;
  updatedAt: Timestamp;
  
  // 统计数据
  totalRegistrations: number;
  approvedRegistrations: number;
  pendingRegistrations: number;
}

// 活动程序安排
export interface EventProgram {
  id: string;
  eventId: string;
  date: Timestamp;
  time: string;
  duration?: number; // 时长（分钟）
  program: string;
  sessionChair?: string;
  registrationRequired: boolean;
  maxSeats?: number;
  isCompetition: boolean;
  sequence: number;
  // Additional properties for form compatibility
  title: string;
  description: string;
  startTime: any;
  endTime: any;
  speaker: string;
  location: string;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 委员会成员
export interface CommitteeMember {
  id: string;
  eventId: string;
  fullName: string;
  position: string;
  contact: string;
  email: string;
  canEditEvent: boolean;
  canApproveTickets: boolean;
  sequence: number;
  isRegistered?: boolean;
  isCommittee?: boolean;
  isPersonInCharge?: boolean;
  // Additional properties for form compatibility
  canManageParticipants: boolean;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 活动讲师
export interface EventTrainer {
  id: string;
  eventId: string;
  fullName: string;
  title: string;
  contact: string;
  email: string;
  sequence: number;
  // Additional properties for form compatibility
  company: string;
  phone: string;
  bio: string;
  expertise: string;
  fee: number;
  currency: string;
  photoUrl: string;
  socialLinks: any;
  notes: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 活动票务
export interface EventTicket {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  type: TicketType;
  quantity: number;
  soldQuantity: number;
  currency: string;
  regularPrice: number;
  discountPrice?: number;
  earlyBirdPrice?: number;
  memberPrice?: number;
  alumniPrice?: number;
  schedule: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 活动注册设置
export interface EventRegistrationSettings {
  isPrivate: boolean;
  limitedSeats: number; // 0表示无限制
  registrationOpenFor: string[];
  registrationClosingDate?: Timestamp;
  
  // 银行账户信息
  bankAccountDetails: string;
  
  // 个人信息收集
  collectPersonalInfo: {
    nricPassport: boolean;
    proofOfPayment: boolean;
  };
  
  // 活动安排选项
  eventArrangements: {
    nameOnTag: boolean;
    meal: boolean;
    foodAllergy: boolean;
    tshirt: boolean;
    accommodation: boolean;
    transportation: boolean;
  };
  
  // 紧急联系人
  emergencyContact: {
    required: boolean;
    defaultOptional: boolean;
  };
}

// 活动注册记录
export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  
  // 注册信息
  ticketId?: string;
  ticketName?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  
  // 个人信息
  nricPassport?: string;
  proofOfPaymentUrl?: string;
  
  // 活动安排选择
  arrangements: {
    nameOnTag?: string;
    meal: boolean;
    foodAllergy?: string;
    tshirt: boolean;
    tshirtSize?: string;
    accommodation: boolean;
    transportation: boolean;
  };
  
  // 紧急联系人
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // 状态信息
  status: RegistrationStatus;
  registeredAt: Timestamp;
  approvedAt?: Timestamp;
  approvedBy?: string;
  rejectedAt?: Timestamp;
  rejectedBy?: string;
  rejectionReason?: string;
  
  // 备注
  notes?: string;
}

// 活动统计数据
export interface EventStatistics {
  totalRegistrations: number;
  approvedRegistrations: number;
  pendingRegistrations: number;
  rejectedRegistrations: number;
  totalRevenue: number;
  ticketSales: {
    [ticketId: string]: {
      ticketName: string;
      sold: number;
      total: number;
      revenue: number;
    };
  };
  registrationByType: {
    [type: string]: number;
  };
  registrationByDate: {
    [date: string]: number;
  };
}

// 活动过滤器
export interface EventFilter {
  type?: EventType[];
  level?: EventLevel[];
  category?: EventCategory[];
  status?: EventStatus[];
  hostingLO?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchText?: string;
}

// 项目户口创建数据
export interface ProjectAccountCreateData {
  name: string;
  description: string;
  budget: number;
  currency: string;
  responsiblePerson: string;
  responsiblePersonEmail: string;
}

// 项目户口更新数据
export interface ProjectAccountUpdateData extends Partial<ProjectAccountCreateData> {
  id: string;
  status?: 'active' | 'inactive' | 'completed';
}

// 活动创建表单数据
export interface EventCreateData {
  title: string;
  description: string;
  type: EventType;
  category: EventCategory;
  level: EventLevel;
  projectAccountId?: string;
  startDate: Date;
  endDate: Date;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  venue: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isVirtual: boolean;
  virtualLink?: string;
  hostingLO: string;
  coHostingLOs: string[];
  contactEmail: string;
  contactPhone?: string;
  isFree: boolean;
  currency: string;
  regularPrice?: number;
  earlyBirdPrice?: number;
  memberPrice?: number;
  alumniPrice?: number;
  maxParticipants?: number;
  minParticipants?: number;
  isPrivate: boolean;
  registrationOpenFor: string[];
  coverImageUrl?: string;
}

// 活动更新表单数据
export interface EventUpdateData extends Partial<EventCreateData> {
  id: string;
  status?: EventStatus;
}

// 活动注册表单数据
export interface EventRegistrationData {
  eventId: string;
  ticketId?: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  nricPassport?: string;
  arrangements: {
    nameOnTag?: string;
    meal: boolean;
    foodAllergy?: string;
    tshirt: boolean;
    tshirtSize?: string;
    accommodation: boolean;
    transportation: boolean;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  notes?: string;
}

// 活动搜索参数
export interface EventSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filter?: EventFilter;
}

// 活动列表响应
export interface EventListResponse {
  events: Event[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// 活动注册列表响应
export interface EventRegistrationListResponse {
  registrations: EventRegistration[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
