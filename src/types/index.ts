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
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  occupation?: string;
  company?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  socialMedia?: {
    wechat?: string;
    linkedin?: string;
    instagram?: string;
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
