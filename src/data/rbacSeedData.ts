// RBAC 种子数据
import { Permission, Role, RBACPolicy } from '@/types/rbac';

// 权限种子数据 - 根据图片中的权限矩阵
export const PERMISSION_SEED_DATA: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // 会员管理权限
  { key: 'member.create', label: '创建会员', description: '创建新会员', module: '会员管理', action: 'Create' },
  { key: 'member.read', label: '查看会员', description: '查看会员信息', module: '会员管理', action: 'Read' },
  { key: 'member.update', label: '更新会员', description: '更新会员信息', module: '会员管理', action: 'Update' },
  { key: 'member.delete', label: '删除会员', description: '删除会员', module: '会员管理', action: 'Delete' },

  // 活动管理权限
  { key: 'activity.create', label: '创建活动', description: '创建新活动', module: '活动管理', action: 'Create' },
  { key: 'activity.read', label: '查看活动', description: '查看活动信息', module: '活动管理', action: 'Read' },
  { key: 'activity.update', label: '更新活动', description: '更新活动信息', module: '活动管理', action: 'Update' },
  { key: 'activity.delete', label: '删除活动', description: '删除活动', module: '活动管理', action: 'Delete' },

  // 财务管理权限
  { key: 'finance.create', label: '创建财务记录', description: '创建财务记录', module: '财务管理', action: 'Create' },
  { key: 'finance.read', label: '查看财务', description: '查看财务信息', module: '财务管理', action: 'Read' },
  { key: 'finance.update', label: '更新财务', description: '更新财务信息', module: '财务管理', action: 'Update' },
  { key: 'finance.delete', label: '删除财务', description: '删除财务记录', module: '财务管理', action: 'Delete' },

  // 消息通知权限
  { key: 'message.create', label: '创建消息', description: '创建新消息', module: '消息通知', action: 'Create' },
  { key: 'message.read', label: '查看消息', description: '查看消息', module: '消息通知', action: 'Read' },
  { key: 'message.update', label: '更新消息', description: '更新消息', module: '消息通知', action: 'Update' },
  { key: 'message.delete', label: '删除消息', description: '删除消息', module: '消息通知', action: 'Delete' },

  // 个人资料权限
  { key: 'profile.create', label: '创建个人资料', description: '创建个人资料', module: '个人资料', action: 'Create' },
  { key: 'profile.read', label: '查看个人资料', description: '查看个人资料', module: '个人资料', action: 'Read' },
  { key: 'profile.update', label: '更新个人资料', description: '更新个人资料', module: '个人资料', action: 'Update' },
  { key: 'profile.delete', label: '删除个人资料', description: '删除个人资料', module: '个人资料', action: 'Delete' }
];

// 角色种子数据 - 根据用户提供的角色列表
export const ROLE_SEED_DATA: Role[] = [
  // 系统角色
  {
    id: 'DEVELOPER',
    label: '开发者',
    description: '系统开发者，拥有最高权限',
    inherits: [],
    allow: [
      'member.create', 'member.read', 'member.update', 'member.delete',
      'activity.create', 'activity.read', 'activity.update', 'activity.delete',
      'finance.create', 'finance.read', 'finance.update', 'finance.delete',
      'message.create', 'message.read', 'message.update', 'message.delete',
      'profile.create', 'profile.read', 'profile.update', 'profile.delete'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ADMINISTRATOR',
    label: '管理员',
    description: '系统管理员，管理用户和角色',
    inherits: [],
    allow: [
      'member.create', 'member.read', 'member.update', 'member.delete',
      'activity.create', 'activity.read', 'activity.update', 'activity.delete',
      'finance.create', 'finance.read', 'finance.update', 'finance.delete',
      'message.create', 'message.read', 'message.update', 'message.delete',
      'profile.create', 'profile.read', 'profile.update', 'profile.delete'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 用户户口类别角色
  {
    id: 'OFFICIAL_MEMBER',
    label: '正式会员',
    description: '正式会员，基础会员权限',
    inherits: [],
    allow: [
      'member.read',
      'activity.read',
      'message.read',
      'profile.read', 'profile.update'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ASSOCIATE_MEMBER',
    label: '准会员',
    description: '准会员，有限会员权限',
    inherits: [],
    allow: [
      'member.read',
      'activity.read',
      'message.read',
      'profile.read', 'profile.update'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'HONORARY_MEMBER',
    label: '荣誉会员',
    description: '荣誉会员，荣誉会员权限',
    inherits: [],
    allow: [
      'member.read',
      'activity.read',
      'message.read',
      'profile.read', 'profile.update'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'AFFILIATE_MEMBER',
    label: '联合会员',
    description: '联合会员，联合会员权限',
    inherits: [],
    allow: [
      'member.read',
      'activity.read',
      'message.read',
      'profile.read', 'profile.update'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'VISITOR_MEMBER',
    label: '拜访会员',
    description: '拜访会员，访客权限',
    inherits: [],
    allow: [
      'member.read',
      'activity.read',
      'message.read',
      'profile.read'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // 用户岗位角色
  {
    id: 'PRESIDENT',
    label: '会长',
    description: '分会会长，最高业务权限',
    inherits: [],
    allow: [
      'member.create', 'member.read', 'member.update', 'member.delete',
      'activity.create', 'activity.read', 'activity.update', 'activity.delete',
      'finance.create', 'finance.read', 'finance.update', 'finance.delete',
      'message.create', 'message.read', 'message.update', 'message.delete',
      'profile.create', 'profile.read', 'profile.update', 'profile.delete'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ACTING_PRESIDENT',
    label: '署理会长',
    description: '署理会长，临时行使会长权限',
    inherits: ['PRESIDENT'],
    allow: [],
    deny: [],
    conditions: { timebox: 'required', delegation: 'required' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SECRETARY_GENERAL',
    label: '秘书长',
    description: '秘书长，行政事务管理',
    inherits: [],
    allow: [
      'member.create', 'member.read', 'member.update', 'member.delete',
      'activity.create', 'activity.read', 'activity.update', 'activity.delete',
      'finance.read', // 秘书长只能查看财务
      'message.create', 'message.read', 'message.update', 'message.delete',
      'profile.create', 'profile.read', 'profile.update', 'profile.delete'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'TREASURER',
    label: '财务长',
    description: '财务长，财务管理',
    inherits: [],
    allow: [
      'member.read', 'member.update',
      'activity.read',
      'finance.create', 'finance.read', 'finance.update', 'finance.delete',
      'message.read',
      'profile.read', 'profile.update'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ADVISOR_PRESIDENT',
    label: '辅导会长',
    description: '辅导会长，战略指导角色（只读）',
    inherits: [],
    allow: [
      'member.read',
      'activity.read',
      'finance.read',
      'message.read',
      'profile.read'
    ],
    deny: [],
    conditions: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'VICE_PRESIDENT',
    label: '副会长',
    description: '副会长，分管特定领域',
    inherits: [],
    allow: [
      'member.create', 'member.read', 'member.update',
      'activity.create', 'activity.read', 'activity.update', 'activity.delete',
      'finance.read',
      'message.create', 'message.read', 'message.update',
      'profile.create', 'profile.read', 'profile.update'
    ],
    deny: [],
    conditions: { scope: { division: 'required' } },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'DEPARTMENT_HEAD',
    label: '部门主任',
    description: '部门主任，部门管理',
    inherits: [],
    allow: [
      'member.read', 'member.update',
      'activity.create', 'activity.read', 'activity.update', 'activity.delete',
      'finance.read',
      'message.read', 'message.update',
      'profile.read', 'profile.update'
    ],
    deny: [],
    conditions: { scope: { department: 'required' } },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// 策略配置种子数据
export const POLICY_SEED_DATA: RBACPolicy = {
  defaultNewUserType: 'member',
  typeChangeBy: ['developer'],
  positionOnlyFor: ['active'],
  actingPresidentMirrors: 'president',
  advisorPresidentReadOnly: true,
  legalCounselNoBusinessApproval: true
};
