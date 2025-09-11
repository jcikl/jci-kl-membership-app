// RBAC 权限管理相关类型定义

// 权限定义
export interface Permission {
  id: string;
  key: string;
  label: string;
  description: string;
  module: string;
  action: string;
  scope?: string;
  createdAt: string;
  updatedAt: string;
}

// 角色定义
export interface Role {
  id: string;
  label: string;
  description: string;
  inherits: string[];
  allow: string[];
  deny: string[];
  conditions: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// 用户角色绑定
export interface RoleBinding {
  id: string;
  userId: string;
  roles: Array<{
    roleId: string;
    scopes?: Record<string, any>;
    expiresAt?: string;
    delegationRef?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

// 用户类型
export type AccountType = 'developer' | 'admin' | 'member' | 'moderator' | 'guest';

// 会员类别
export type MembershipCategory = 'active' | 'associate' | 'honorary' | 'affiliate' | 'visitor' | 'alumni' | 'corporate' | 'student';

// 职位类型 - 根据图片中的角色定义
export type Position = 
  | 'president'           // 会长
  | 'acting_president'    // 署理会长
  | 'secretary_general'   // 秘书长
  | 'treasurer'          // 财务长
  | 'advisor_president'  // 辅导会长
  | 'vice_president'     // 副会长
  | 'department_director' // 部门主任
  | 'official_member'    // 正式会员
  | 'associate_member'   // 准会员
  | 'honorary_member';   // 荣誉会员

// JCI职位类型 - 扩展版本
export type JCIPosition = 
  | 'president'                    // 会长
  | 'acting_president'             // 署理会长
  | 'mentor'                       // 辅导会长
  | 'legal_advisor'                // 法律顾问
  | 'secretary'                    // 秘书
  | 'treasurer'                    // 财政长
  | 'vp_personal_development'      // 个人发展副会长
  | 'vp_business_development'      // 商业发展副会长
  | 'vp_community_development'     // 社区发展副会长
  | 'vp_international_development' // 国际发展副会长
  | 'vp_chapter_management'        // 分会管理副会长
  | 'president_cadre'              // 会长干部
  | 'legal_advisor_cadre'          // 法律顾问干部
  | 'secretary_cadre'              // 秘书干部
  | 'treasurer_cadre'              // 财政长干部
  | 'acting_president_cadre'       // 署理会长干部
  | 'vp_personal_development_cadre' // 个人发展副会长干部
  | 'vp_business_development_cadre' // 商业发展副会长干部
  | 'vp_community_development_cadre' // 社区发展副会长干部
  | 'vp_international_development_cadre' // 国际发展副会长干部
  | 'vp_chapter_management_cadre'  // 分会管理副会长干部
  | 'department_head'              // 部门主任
  | 'official_member'              // 正式会员
  | 'associate_member'             // 准会员
  | 'honorary_member';             // 荣誉会员

// 副会长分管方向
export type VPDivision = 
  | 'personal_dev'        // 个人发展
  | 'business_dev'        // 商务发展
  | 'international_dev'   // 国际发展
  | 'chapter_admin'       // 分会管理
  | 'community_dev';      // 社区发展

// 会员职位信息
export interface MemberPosition {
  id: string;
  memberId: string;
  position: JCIPosition;
  vpDivision?: VPDivision;
  startDate?: string;
  endDate?: string;
  isActing: boolean;
  actingFor?: JCIPosition;
  assignedBy: string;
  assignedDate: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
  updatedAt: string;
}

// 会员分类信息
export interface MemberCategory {
  id: string;
  memberId: string;
  membershipCategory: MembershipCategory;
  accountType: AccountType;
  reason?: string;
  assignedBy: string;
  assignedDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 用户角色信息
export interface UserRole {
  userId: string;
  accountType: AccountType;
  membershipCategory: MembershipCategory;
  position: Position;
  vpDivision?: VPDivision;
  effectivePermissions: string[];
  roleBindings: RoleBinding[];
}

// RBAC 策略配置
export interface RBACPolicy {
  defaultNewUserType: AccountType;
  typeChangeBy: AccountType[];
  positionOnlyFor: MembershipCategory[];
  actingPresidentMirrors: string;
  advisorPresidentReadOnly: boolean;
  legalCounselNoBusinessApproval: boolean;
}

// 权限检查结果
export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
  effectivePermissions: string[];
  inheritedPermissions: string[];
  deniedPermissions: string[];
}

// 审计日志
export interface RBACAuditLog {
  id: string;
  actorId: string;
  action: string;
  targetType: 'user' | 'role' | 'permission' | 'binding';
  targetId: string;
  changes: Record<string, any>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}

// 权限模块分组 - 根据图片中的权限矩阵
export const PERMISSION_MODULES = {
  MEMBER_MANAGEMENT: '会员管理',
  ACTIVITY_MANAGEMENT: '活动管理', 
  FINANCIAL_MANAGEMENT: '财务管理',
  MESSAGE_NOTIFICATION: '消息通知',
  PERSONAL_DATA: '个人资料'
} as const;

// 权限动作 - 根据图片中的权限矩阵
export const PERMISSION_ACTIONS = {
  CREATE: 'Create',
  READ: 'Read',
  UPDATE: 'Update',
  DELETE: 'Delete'
} as const;

// 权限范围
export const PERMISSION_SCOPES = {
  ANY: 'any',
  OWN: 'own',
  DEPARTMENT: 'department',
  DIVISION: 'division',
  PUBLIC: 'public',
  INTERNAL: 'internal',
  RESTRICTED: 'restricted'
} as const;

// 权限矩阵条目
export interface PermissionMatrixEntry {
  id: string;
  module: string;
  action: string;
  roles: Record<string, boolean>; // 角色ID -> 是否有权限
  createdAt: string;
  updatedAt: string;
}

// 角色权限矩阵
export interface RolePermissionMatrix {
  roles: string[];
  modules: string[];
  actions: string[];
  matrix: Record<string, Record<string, Record<string, boolean>>>; // module -> action -> role -> hasPermission
}

// 角色定义 - 根据用户提供的角色列表
export const ROLE_DEFINITIONS = {
  // 用户户口类别权限
  DEVELOPER: '开发者',
  ADMINISTRATOR: '管理员',
  OFFICIAL_MEMBER: '正式会员',
  ASSOCIATE_MEMBER: '准会员',
  HONORARY_MEMBER: '荣誉会员',
  AFFILIATE_MEMBER: '联合会员',
  VISITOR_MEMBER: '拜访会员',
  
  // 用户岗位权限
  PRESIDENT: '会长',
  ACTING_PRESIDENT: '署理会长',
  SECRETARY_GENERAL: '秘书长',
  TREASURER: '财务长',
  ADVISOR_PRESIDENT: '辅导会长',
  VICE_PRESIDENT: '副会长',
  DEPARTMENT_HEAD: '部门主任'
} as const;

// JCI职位选项
export const JCI_POSITION_OPTIONS = [
  { value: 'president', label: '会长' },
  { value: 'acting_president', label: '署理会长' },
  { value: 'mentor', label: '辅导会长' },
  { value: 'legal_advisor', label: '法律顾问' },
  { value: 'secretary', label: '秘书' },
  { value: 'treasurer', label: '财政长' },
  { value: 'vp_personal_development', label: '个人发展副会长' },
  { value: 'vp_business_development', label: '商业发展副会长' },
  { value: 'vp_community_development', label: '社区发展副会长' },
  { value: 'vp_international_development', label: '国际发展副会长' },
  { value: 'vp_chapter_management', label: '分会管理副会长' },
  { value: 'president_cadre', label: '会长干部' },
  { value: 'legal_advisor_cadre', label: '法律顾问干部' },
  { value: 'secretary_cadre', label: '秘书干部' },
  { value: 'treasurer_cadre', label: '财政长干部' },
  { value: 'acting_president_cadre', label: '署理会长干部' },
  { value: 'vp_personal_development_cadre', label: '个人发展副会长干部' },
  { value: 'vp_business_development_cadre', label: '商业发展副会长干部' },
  { value: 'vp_community_development_cadre', label: '社区发展副会长干部' },
  { value: 'vp_international_development_cadre', label: '国际发展副会长干部' },
  { value: 'vp_chapter_management_cadre', label: '分会管理副会长干部' },
  { value: 'department_head', label: '部门主任' },
  { value: 'official_member', label: '正式会员' },
  { value: 'associate_member', label: '准会员' },
  { value: 'honorary_member', label: '荣誉会员' }
] as const;

// 副会长分管方向选项
export const VP_DIVISION_OPTIONS = [
  { value: 'personal_dev', label: '个人发展' },
  { value: 'business_dev', label: '商务发展' },
  { value: 'international_dev', label: '国际发展' },
  { value: 'chapter_admin', label: '分会管理' },
  { value: 'community_dev', label: '社区发展' }
] as const;

// 会员类别选项
export const MEMBERSHIP_CATEGORY_OPTIONS = [
  { value: 'active', label: '活跃会员' },
  { value: 'associate', label: '准会员' },
  { value: 'honorary', label: '荣誉会员' },
  { value: 'affiliate', label: '附属会员' },
  { value: 'visitor', label: '访客会员' },
  { value: 'alumni', label: '校友会员' },
  { value: 'corporate', label: '企业会员' },
  { value: 'student', label: '学生会员' }
] as const;

// 账户类型选项
export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'developer', label: '开发者' },
  { value: 'admin', label: '管理员' },
  { value: 'member', label: '普通会员' },
  { value: 'moderator', label: '版主' },
  { value: 'guest', label: '访客' }
] as const;
