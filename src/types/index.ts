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
  profile: MemberProfile;
  createdAt: string;
  updatedAt: string;
}

export interface MemberProfile {
  avatar?: string;
  birthDate?: string; // dd-mmm-yyyy
  gender?: 'male' | 'female';
  race?: 'Chinese' | 'Malay' | 'Indian' | 'Other';
  address?: string; // Home Address

  // Personal names
  fullNameNric?: string; // Full Name as per NRIC
  nicknameWithSurname?: string;
  
  // Senator ID
  senatorId?: string; // 参议员编号

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

  // Business profile
  companyIntro?: string; // Briefly share your company’s operations and your role

  // Introducer
  introducerName?: string;

  // Personal goals
  fiveYearsVision?: string; // Where do you see yourself in 5 years?
  activeMemberHow?: string; // How would you like to be an active member?

  // Shirt / merch
  nameToBeEmbroidered?: string;
  shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'; // JCI KL Pink Shirt
  jacketSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL'; // JCI KL Jacket
  cutting?: 'Unisex' | 'Lady'; // Cutting - JCI KL Pink Shirt
  tshirtReceivingStatus?: 'Pending' | 'Requested' | 'Processing' | 'Delivered';

  // Preferences & consents
  acceptInternationalBusiness?: 'Yes' | 'No' | 'Willing to explore';
  whatsappGroup?: boolean;

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
  
  // 会员分类相关
  membershipCategory?: 'active' | 'associate' | 'honorary' | 'affiliate' | 'visitor' | 'alumni' | 'corporate' | 'student';
  accountType?: 'developer' | 'admin' | 'member' | 'moderator' | 'guest';
  categoryReason?: string; // 分类原因
  categoryAssignedBy?: string; // 分类分配人
  categoryAssignedDate?: string; // 分类分配日期
  
  // 权限相关
  effectivePermissions?: string[];
  roleBindings?: Array<{
    roleId: string;
    scopes?: Record<string, any>;
    expiresAt?: string;
    delegationRef?: string;
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
  description?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}
