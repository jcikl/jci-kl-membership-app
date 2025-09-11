// 权限管理服务
import { positionService } from './positionService';
import { categoryService } from './categoryService';
import { JCIPosition, MembershipCategory, AccountType } from '@/types/rbac';

// 权限增强规则类型
interface PermissionEnhancementRule {
  position: JCIPosition;
  category: MembershipCategory;
  additionalPermissions: string[];
  description: string;
}

// 权限增强规则配置
const PERMISSION_ENHANCEMENT_RULES: PermissionEnhancementRule[] = [
  // 会长岗位增强规则
  {
    position: 'president',
    category: 'active',
    additionalPermissions: ['member.create', 'member.delete', 'finance.create', 'finance.update', 'finance.delete'],
    description: '活跃会员担任会长时获得完整管理权限'
  },
  {
    position: 'president',
    category: 'associate',
    additionalPermissions: ['member.create', 'member.update', 'activity.create', 'activity.update', 'message.create', 'message.update'],
    description: '准会员担任会长时获得基础管理权限'
  },
  {
    position: 'president',
    category: 'honorary',
    additionalPermissions: ['member.read', 'activity.read', 'message.read'],
    description: '荣誉会员担任会长时获得只读权限'
  },
  
  // 秘书长岗位增强规则
  {
    position: 'secretary',
    category: 'active',
    additionalPermissions: ['member.create', 'member.update', 'activity.create', 'activity.update', 'message.create', 'message.update'],
    description: '活跃会员担任秘书长时获得行政管理权限'
  },
  {
    position: 'secretary',
    category: 'associate',
    additionalPermissions: ['member.update', 'activity.create', 'activity.update', 'message.create', 'message.update'],
    description: '准会员担任秘书长时获得基础行政权限'
  },
  
  // 财务长岗位增强规则
  {
    position: 'treasurer',
    category: 'active',
    additionalPermissions: ['finance.create', 'finance.update', 'finance.delete', 'member.update'],
    description: '活跃会员担任财务长时获得完整财务权限'
  },
  {
    position: 'treasurer',
    category: 'associate',
    additionalPermissions: ['finance.read', 'member.update'],
    description: '准会员担任财务长时获得财务查看权限'
  },
  
  // 副会长岗位增强规则
  {
    position: 'vp_personal_development',
    category: 'active',
    additionalPermissions: ['member.create', 'member.update', 'activity.create', 'activity.update', 'activity.delete', 'message.create', 'message.update'],
    description: '活跃会员担任个人发展副会长时获得分管领域管理权限'
  },
  {
    position: 'vp_personal_development',
    category: 'associate',
    additionalPermissions: ['member.update', 'activity.create', 'activity.update', 'message.create', 'message.update'],
    description: '准会员担任个人发展副会长时获得基础分管权限'
  },
  
  {
    position: 'vp_business_development',
    category: 'active',
    additionalPermissions: ['member.create', 'member.update', 'activity.create', 'activity.update', 'activity.delete', 'message.create', 'message.update'],
    description: '活跃会员担任商业发展副会长时获得分管领域管理权限'
  },
  {
    position: 'vp_business_development',
    category: 'associate',
    additionalPermissions: ['member.update', 'activity.create', 'activity.update', 'message.create', 'message.update'],
    description: '准会员担任商业发展副会长时获得基础分管权限'
  },
  
  {
    position: 'vp_community_development',
    category: 'active',
    additionalPermissions: ['member.create', 'member.update', 'activity.create', 'activity.update', 'activity.delete', 'message.create', 'message.update'],
    description: '活跃会员担任社区发展副会长时获得分管领域管理权限'
  },
  {
    position: 'vp_community_development',
    category: 'associate',
    additionalPermissions: ['member.update', 'activity.create', 'activity.update', 'message.create', 'message.update'],
    description: '准会员担任社区发展副会长时获得基础分管权限'
  },
  
  {
    position: 'vp_international_development',
    category: 'active',
    additionalPermissions: ['member.create', 'member.update', 'activity.create', 'activity.update', 'activity.delete', 'message.create', 'message.update'],
    description: '活跃会员担任国际发展副会长时获得分管领域管理权限'
  },
  {
    position: 'vp_international_development',
    category: 'associate',
    additionalPermissions: ['member.update', 'activity.create', 'activity.update', 'message.create', 'message.update'],
    description: '准会员担任国际发展副会长时获得基础分管权限'
  },
  
  {
    position: 'vp_chapter_management',
    category: 'active',
    additionalPermissions: ['member.create', 'member.update', 'activity.create', 'activity.update', 'activity.delete', 'message.create', 'message.update'],
    description: '活跃会员担任分会管理副会长时获得分管领域管理权限'
  },
  {
    position: 'vp_chapter_management',
    category: 'associate',
    additionalPermissions: ['member.update', 'activity.create', 'activity.update', 'message.create', 'message.update'],
    description: '准会员担任分会管理副会长时获得基础分管权限'
  },
  
  // 部门主任岗位增强规则
  {
    position: 'department_head',
    category: 'active',
    additionalPermissions: ['member.update', 'activity.create', 'activity.update', 'activity.delete', 'message.update'],
    description: '活跃会员担任部门主任时获得部门管理权限'
  },
  {
    position: 'department_head',
    category: 'associate',
    additionalPermissions: ['member.update', 'activity.create', 'activity.update', 'message.update'],
    description: '准会员担任部门主任时获得基础部门权限'
  },
  
  // 署理会长岗位增强规则（继承会长权限）
  {
    position: 'acting_president',
    category: 'active',
    additionalPermissions: ['member.create', 'member.delete', 'finance.create', 'finance.update', 'finance.delete'],
    description: '活跃会员担任署理会长时获得完整管理权限'
  },
  {
    position: 'acting_president',
    category: 'associate',
    additionalPermissions: ['member.create', 'member.update', 'activity.create', 'activity.update', 'message.create', 'message.update'],
    description: '准会员担任署理会长时获得基础管理权限'
  },
  
  // 辅导会长岗位增强规则（只读权限）
  {
    position: 'mentor',
    category: 'active',
    additionalPermissions: ['member.read', 'activity.read', 'finance.read', 'message.read'],
    description: '活跃会员担任辅导会长时获得只读权限'
  },
  {
    position: 'mentor',
    category: 'honorary',
    additionalPermissions: ['member.read', 'activity.read', 'finance.read', 'message.read'],
    description: '荣誉会员担任辅导会长时获得只读权限'
  },
  
  // 法律顾问岗位增强规则
  {
    position: 'legal_advisor',
    category: 'active',
    additionalPermissions: ['member.read', 'member.update', 'activity.read', 'activity.create', 'activity.update', 'message.read', 'message.create', 'message.update'],
    description: '活跃会员担任法律顾问时获得法律相关权限'
  },
  {
    position: 'legal_advisor',
    category: 'associate',
    additionalPermissions: ['member.read', 'activity.read', 'message.read'],
    description: '准会员担任法律顾问时获得基础法律权限'
  }
];

// 获取权限增强规则
const getPermissionEnhancementRule = (position: JCIPosition, category: MembershipCategory): PermissionEnhancementRule | null => {
  return PERMISSION_ENHANCEMENT_RULES.find(rule => 
    rule.position === position && rule.category === category
  ) || null;
};

// 计算增强后的权限
const calculateEnhancedPermissions = (
  basePermissions: string[],
  position: JCIPosition,
  category: MembershipCategory
): string[] => {
  const enhancementRule = getPermissionEnhancementRule(position, category);
  
  if (!enhancementRule) {
    // 如果没有找到增强规则，返回基础权限
    return basePermissions;
  }
  
  // 合并基础权限和增强权限，去重
  const enhancedPermissions = [...basePermissions, ...enhancementRule.additionalPermissions];
  return [...new Set(enhancedPermissions)];
};

// 职位权限映射表
const POSITION_PERMISSION_MAP: Record<JCIPosition, string[]> = {
  president: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'finance.create', 'finance.read', 'finance.update', 'finance.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete'
  ],
  acting_president: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'finance.create', 'finance.read', 'finance.update', 'finance.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete'
  ],
  secretary: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete'
  ],
  treasurer: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'finance.create', 'finance.read', 'finance.update', 'finance.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete'
  ],
  mentor: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete'
  ],
  legal_advisor: [
    'member.read', 'member.update',
    'activity.read', 'activity.create', 'activity.update',
    'message.read', 'message.create', 'message.update',
    'profile.read', 'profile.update'
  ],
  vp_personal_development: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete'
  ],
  vp_business_development: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete'
  ],
  vp_community_development: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete'
  ],
  vp_international_development: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete'
  ],
  vp_chapter_management: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete'
  ],
  president_cadre: [
    'member.read', 'member.update',
    'activity.read', 'activity.create', 'activity.update',
    'message.read', 'message.create', 'message.update',
    'profile.read', 'profile.update'
  ],
  legal_advisor_cadre: [
    'member.read',
    'activity.read',
    'message.read',
    'profile.read'
  ],
  secretary_cadre: [
    'member.read', 'member.update',
    'activity.read', 'activity.create', 'activity.update',
    'message.read', 'message.create', 'message.update',
    'profile.read', 'profile.update'
  ],
  treasurer_cadre: [
    'member.read', 'member.update',
    'activity.read', 'activity.create', 'activity.update',
    'message.read', 'message.create', 'message.update',
    'profile.read', 'profile.update'
  ],
  acting_president_cadre: [
    'member.read', 'member.update',
    'activity.read', 'activity.create', 'activity.update',
    'message.read', 'message.create', 'message.update',
    'profile.read', 'profile.update'
  ],
  vp_personal_development_cadre: [
    'member.read', 'member.update',
    'activity.read', 'activity.create', 'activity.update',
    'message.read', 'message.create', 'message.update',
    'profile.read', 'profile.update'
  ],
  vp_business_development_cadre: [
    'member.read', 'member.update',
    'activity.read', 'activity.create', 'activity.update',
    'message.read', 'message.create', 'message.update',
    'profile.read', 'profile.update'
  ],
  vp_community_development_cadre: [
    'member.read', 'member.update',
    'activity.read', 'activity.create', 'activity.update',
    'message.read', 'message.create', 'message.update',
    'profile.read', 'profile.update'
  ],
  vp_international_development_cadre: [
    'member.read', 'member.update',
    'activity.read', 'activity.create', 'activity.update',
    'message.read', 'message.create', 'message.update',
    'profile.read', 'profile.update'
  ],
  vp_chapter_management_cadre: [
    'member.read', 'member.update',
    'activity.read', 'activity.create', 'activity.update',
    'message.read', 'message.create', 'message.update',
    'profile.read', 'profile.update'
  ],
  department_head: [
    'member.read', 'member.update',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'profile.read', 'profile.update'
  ],
  official_member: [
    'member.read', 'member.update',
    'activity.read',
    'message.read',
    'profile.read', 'profile.update'
  ],
  associate_member: [
    'member.read', 'member.update',
    'activity.read',
    'message.read',
    'profile.read', 'profile.update'
  ],
  honorary_member: [
    'member.read', 'member.update',
    'activity.read',
    'message.read',
    'profile.read', 'profile.update'
  ]
};

// 分类权限映射表
const CATEGORY_PERMISSION_MAP: Record<MembershipCategory, string[]> = {
  active: [
    'member.read', 'member.update',
    'activity.read', 'activity.create',
    'message.read', 'message.create',
    'profile.read', 'profile.update'
  ],
  associate: [
    'member.read', 'member.update',
    'activity.read',
    'message.read',
    'profile.read', 'profile.update'
  ],
  honorary: [
    'member.read',
    'activity.read',
    'message.read',
    'profile.read'
  ],
  affiliate: [
    'member.read',
    'activity.read',
    'message.read',
    'profile.read'
  ],
  visitor: [
    'activity.read',
    'message.read',
    'profile.read'
  ],
  alumni: [
    'member.read',
    'activity.read',
    'message.read',
    'profile.read', 'profile.update'
  ],
  corporate: [
    'member.read', 'member.update',
    'activity.read', 'activity.create',
    'message.read', 'message.create',
    'profile.read', 'profile.update'
  ],
  student: [
    'member.read', 'member.update',
    'activity.read',
    'message.read',
    'profile.read', 'profile.update'
  ]
};

// 账户类型权限映射表
const ACCOUNT_TYPE_PERMISSION_MAP: Record<AccountType, string[]> = {
  developer: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'finance.create', 'finance.read', 'finance.update', 'finance.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete',
    'system.admin', 'system.config', 'system.audit'
  ],
  admin: [
    'member.create', 'member.read', 'member.update', 'member.delete',
    'activity.create', 'activity.read', 'activity.update', 'activity.delete',
    'finance.create', 'finance.read', 'finance.update', 'finance.delete',
    'message.create', 'message.read', 'message.update', 'message.delete',
    'profile.create', 'profile.read', 'profile.update', 'profile.delete',
    'system.admin', 'system.config'
  ],
  member: [
    'member.read', 'member.update',
    'activity.read',
    'message.read',
    'profile.read', 'profile.update'
  ],
  moderator: [
    'member.read', 'member.update',
    'activity.create', 'activity.read', 'activity.update',
    'message.create', 'message.read', 'message.update',
    'profile.read', 'profile.update'
  ],
  guest: [
    'activity.read',
    'message.read',
    'profile.read'
  ]
};

export const permissionService = {
  // 检查职位权限
  checkPositionPermission: async (memberId: string, permission: string): Promise<boolean> => {
    try {
      const position = await positionService.getCurrentPosition(memberId);
      if (!position) return false;
      
      const permissions = POSITION_PERMISSION_MAP[position.position] || [];
      return permissions.includes(permission);
    } catch (error) {
      console.error('检查职位权限失败:', error);
      return false;
    }
  },

  // 检查分类权限
  checkCategoryPermission: async (memberId: string, permission: string): Promise<boolean> => {
    try {
      const category = await categoryService.getMemberCategory(memberId);
      if (!category) return false;
      
      const permissions = CATEGORY_PERMISSION_MAP[category.membershipCategory] || [];
      return permissions.includes(permission);
    } catch (error) {
      console.error('检查分类权限失败:', error);
      return false;
    }
  },

  // 检查账户类型权限
  checkAccountTypePermission: async (memberId: string, permission: string): Promise<boolean> => {
    try {
      const category = await categoryService.getMemberCategory(memberId);
      if (!category) return false;
      
      const permissions = ACCOUNT_TYPE_PERMISSION_MAP[category.accountType] || [];
      return permissions.includes(permission);
    } catch (error) {
      console.error('检查账户类型权限失败:', error);
      return false;
    }
  },

  // 获取有效权限列表
  getEffectivePermissions: async (memberId: string): Promise<string[]> => {
    try {
      const position = await positionService.getCurrentPosition(memberId);
      const category = await categoryService.getMemberCategory(memberId);
      
      if (!category) {
        // 如果没有分类信息，返回空权限
        return [];
      }
      
      // 获取基础权限（用户户口类别权限 + 账户类型权限）
      const categoryPermissions = CATEGORY_PERMISSION_MAP[category.membershipCategory] || [];
      const accountTypePermissions = ACCOUNT_TYPE_PERMISSION_MAP[category.accountType] || [];
      const basePermissions = [...categoryPermissions, ...accountTypePermissions];
      
      // 如果有岗位，应用权限增强
      if (position) {
        return calculateEnhancedPermissions(basePermissions, position.position, category.membershipCategory);
      }
      
      // 如果没有岗位，返回基础权限
      return [...new Set(basePermissions)];
    } catch (error) {
      console.error('获取有效权限失败:', error);
      return [];
    }
  },

  // 检查权限（综合检查）
  checkPermission: async (memberId: string, permission: string): Promise<boolean> => {
    try {
      const effectivePermissions = await permissionService.getEffectivePermissions(memberId);
      return effectivePermissions.includes(permission);
    } catch (error) {
      console.error('检查权限失败:', error);
      return false;
    }
  },

  // 获取职位权限列表
  getPositionPermissions: (position: JCIPosition): string[] => {
    return POSITION_PERMISSION_MAP[position] || [];
  },

  // 获取分类权限列表
  getCategoryPermissions: (category: MembershipCategory): string[] => {
    return CATEGORY_PERMISSION_MAP[category] || [];
  },

  // 获取账户类型权限列表
  getAccountTypePermissions: (accountType: AccountType): string[] => {
    return ACCOUNT_TYPE_PERMISSION_MAP[accountType] || [];
  },

  // 检查是否有管理权限
  hasAdminPermission: async (memberId: string): Promise<boolean> => {
    try {
      const category = await categoryService.getMemberCategory(memberId);
      if (!category) return false;
      
      return category.accountType === 'developer' || category.accountType === 'admin';
    } catch (error) {
      console.error('检查管理权限失败:', error);
      return false;
    }
  },

  // 检查是否可以管理其他用户
  canManageUsers: async (memberId: string): Promise<boolean> => {
    try {
      const effectivePermissions = await permissionService.getEffectivePermissions(memberId);
      return effectivePermissions.includes('member.create') || 
             effectivePermissions.includes('member.update') || 
             effectivePermissions.includes('member.delete');
    } catch (error) {
      console.error('检查用户管理权限失败:', error);
      return false;
    }
  },

  // 检查是否可以管理活动
  canManageActivities: async (memberId: string): Promise<boolean> => {
    try {
      const effectivePermissions = await permissionService.getEffectivePermissions(memberId);
      return effectivePermissions.includes('activity.create') || 
             effectivePermissions.includes('activity.update') || 
             effectivePermissions.includes('activity.delete');
    } catch (error) {
      console.error('检查活动管理权限失败:', error);
      return false;
    }
  },

  // 检查是否可以管理财务
  canManageFinance: async (memberId: string): Promise<boolean> => {
    try {
      const effectivePermissions = await permissionService.getEffectivePermissions(memberId);
      return effectivePermissions.includes('finance.create') || 
             effectivePermissions.includes('finance.update') || 
             effectivePermissions.includes('finance.delete');
    } catch (error) {
      console.error('检查财务管理权限失败:', error);
      return false;
    }
  },

  // 获取权限统计
  getPermissionStats: async (memberId: string) => {
    try {
      const position = await positionService.getCurrentPosition(memberId);
      const category = await categoryService.getMemberCategory(memberId);
      const effectivePermissions = await permissionService.getEffectivePermissions(memberId);
      
      // 获取权限增强信息
      let enhancementInfo = null;
      if (position && category) {
        const enhancementRule = getPermissionEnhancementRule(position.position, category.membershipCategory);
        if (enhancementRule) {
          enhancementInfo = {
            rule: enhancementRule,
            additionalPermissions: enhancementRule.additionalPermissions,
            description: enhancementRule.description
          };
        }
      }
      
      return {
        position: position?.position,
        membershipCategory: category?.membershipCategory,
        accountType: category?.accountType,
        totalPermissions: effectivePermissions.length,
        permissions: effectivePermissions,
        positionPermissions: position ? POSITION_PERMISSION_MAP[position.position] || [] : [],
        categoryPermissions: category ? CATEGORY_PERMISSION_MAP[category.membershipCategory] || [] : [],
        accountTypePermissions: category ? ACCOUNT_TYPE_PERMISSION_MAP[category.accountType] || [] : [],
        enhancementInfo
      };
    } catch (error) {
      console.error('获取权限统计失败:', error);
      return null;
    }
  },

  // 获取权限增强规则
  getPermissionEnhancementRule: (position: JCIPosition, category: MembershipCategory): PermissionEnhancementRule | null => {
    return getPermissionEnhancementRule(position, category);
  },

  // 获取所有权限增强规则
  getAllPermissionEnhancementRules: (): PermissionEnhancementRule[] => {
    return PERMISSION_ENHANCEMENT_RULES;
  },

  // 检查是否有权限增强
  hasPermissionEnhancement: async (memberId: string): Promise<boolean> => {
    try {
      const position = await positionService.getCurrentPosition(memberId);
      const category = await categoryService.getMemberCategory(memberId);
      
      if (!position || !category) {
        return false;
      }
      
      const enhancementRule = getPermissionEnhancementRule(position.position, category.membershipCategory);
      return enhancementRule !== null;
    } catch (error) {
      console.error('检查权限增强失败:', error);
      return false;
    }
  },

  // 获取权限增强详情
  getPermissionEnhancementDetails: async (memberId: string) => {
    try {
      const position = await positionService.getCurrentPosition(memberId);
      const category = await categoryService.getMemberCategory(memberId);
      
      if (!position || !category) {
        return null;
      }
      
      const enhancementRule = getPermissionEnhancementRule(position.position, category.membershipCategory);
      
      if (!enhancementRule) {
        return null;
      }
      
      // 获取基础权限
      const categoryPermissions = CATEGORY_PERMISSION_MAP[category.membershipCategory] || [];
      const accountTypePermissions = ACCOUNT_TYPE_PERMISSION_MAP[category.accountType] || [];
      const basePermissions = [...categoryPermissions, ...accountTypePermissions];
      
      // 获取增强后的权限
      const enhancedPermissions = calculateEnhancedPermissions(basePermissions, position.position, category.membershipCategory);
      
      return {
        position: position.position,
        category: category.membershipCategory,
        basePermissions: [...new Set(basePermissions)],
        additionalPermissions: enhancementRule.additionalPermissions,
        enhancedPermissions,
        description: enhancementRule.description,
        enhancementCount: enhancementRule.additionalPermissions.length
      };
    } catch (error) {
      console.error('获取权限增强详情失败:', error);
      return null;
    }
  }
};
