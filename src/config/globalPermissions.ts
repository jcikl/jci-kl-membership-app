/**
 * 全局权限配置
 * 统一管理RBAC权限系统，确保权限检查的一致性和可扩展性
 */

import { getMemberById } from '@/modules/member/services/memberService';
import { permissionService } from '@/modules/permission/services/permissionService';

/**
 * 全局权限配置
 */
export const GLOBAL_PERMISSION_CONFIG = {
  // 超级管理员邮箱
  SUPER_ADMIN_EMAIL: 'admin@jcikl.com',
  
  // 权限模块定义
  PERMISSION_MODULES: {
    MEMBER_MANAGEMENT: 'member',
    EVENT_MANAGEMENT: 'event',
    FINANCE_MANAGEMENT: 'finance',
    BILL_PAYMENT: 'bill_payment',
    PROFILE_MANAGEMENT: 'profile',
    SYSTEM_ADMIN: 'system',
    AWARDS_MANAGEMENT: 'awards',
    SURVEY_MANAGEMENT: 'survey',
    RBAC_MANAGEMENT: 'rbac'
  },
  
  // 权限动作定义
  PERMISSION_ACTIONS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage', // 包含所有CRUD操作
    APPROVE: 'approve',
    EXPORT: 'export',
    IMPORT: 'import',
    AUDIT: 'audit'
  },
  
  // 权限层级定义
  PERMISSION_LEVELS: {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    MANAGER: 'manager',
    MEMBER: 'member',
    GUEST: 'guest'
  },
  
  // 特殊权限标记
  SPECIAL_PERMISSIONS: {
    BYPASS_ALL_CHECKS: 'bypass_all_checks',
    SYSTEM_MAINTENANCE: 'system_maintenance',
    AUDIT_ACCESS: 'audit_access'
  }
} as const;

/**
 * 权限模块类型
 */
export type PermissionModule = keyof typeof GLOBAL_PERMISSION_CONFIG.PERMISSION_MODULES;

/**
 * 权限动作类型
 */
export type PermissionAction = keyof typeof GLOBAL_PERMISSION_CONFIG.PERMISSION_ACTIONS;

/**
 * 权限层级类型
 */
export type PermissionLevel = keyof typeof GLOBAL_PERMISSION_CONFIG.PERMISSION_LEVELS;

/**
 * 权限检查结果接口
 */
export interface PermissionCheckResult {
  hasPermission: boolean;
  reason?: string;
  bypassReason?: string;
}

/**
 * 批量权限检查结果接口
 */
export interface BatchPermissionCheckResult {
  [permission: string]: boolean;
}

/**
 * 全局权限服务
 */
export const globalPermissionService = {
  /**
   * 检查是否为超级管理员
   * @param memberId 会员ID
   * @returns 是否为超级管理员
   */
  isSuperAdmin: async (memberId: string): Promise<boolean> => {
    try {
      const member = await getMemberById(memberId);
      return member?.email === GLOBAL_PERMISSION_CONFIG.SUPER_ADMIN_EMAIL;
    } catch (error) {
      console.error('检查超级管理员失败:', error);
      return false;
    }
  },

  /**
   * 统一权限检查
   * @param memberId 会员ID
   * @param module 权限模块
   * @param action 权限动作
   * @returns 权限检查结果
   */
  checkPermission: async (
    memberId: string, 
    module: PermissionModule, 
    action: PermissionAction
  ): Promise<PermissionCheckResult> => {
    try {
      // 超级管理员绕过所有权限检查
      const isSuperAdmin = await globalPermissionService.isSuperAdmin(memberId);
      if (isSuperAdmin) {
        return {
          hasPermission: true,
          bypassReason: 'Super admin bypass'
        };
      }

      // 构建权限字符串
      const moduleValue = GLOBAL_PERMISSION_CONFIG.PERMISSION_MODULES[module];
      const actionValue = GLOBAL_PERMISSION_CONFIG.PERMISSION_ACTIONS[action];
      const permission = `${moduleValue}.${actionValue}`;

      // 调用现有权限服务
      const hasPermission = await permissionService.checkPermission(memberId, permission);

      return {
        hasPermission,
        reason: hasPermission ? 'Permission granted' : 'Permission denied'
      };
    } catch (error) {
      console.error('权限检查失败:', error);
      return {
        hasPermission: false,
        reason: 'Permission check failed'
      };
    }
  },

  /**
   * 批量权限检查
   * @param memberId 会员ID
   * @param permissions 权限列表
   * @returns 批量权限检查结果
   */
  checkPermissions: async (
    memberId: string, 
    permissions: Array<{module: PermissionModule, action: PermissionAction}>
  ): Promise<BatchPermissionCheckResult> => {
    try {
      const results = await Promise.all(
        permissions.map(p => globalPermissionService.checkPermission(memberId, p.module, p.action))
      );
      
      return permissions.reduce((acc, permission, index) => {
        const permissionKey = `${permission.module}.${permission.action}`;
        acc[permissionKey] = results[index].hasPermission;
        return acc;
      }, {} as BatchPermissionCheckResult);
    } catch (error) {
      console.error('批量权限检查失败:', error);
      return {};
    }
  },

  /**
   * 检查管理权限（包含所有CRUD操作）
   * @param memberId 会员ID
   * @param module 权限模块
   * @returns 是否有管理权限
   */
  checkManagePermission: async (memberId: string, module: PermissionModule): Promise<PermissionCheckResult> => {
    return globalPermissionService.checkPermission(memberId, module, 'MANAGE');
  },

  /**
   * 检查特殊权限
   * @param memberId 会员ID
   * @param specialPermission 特殊权限
   * @returns 是否有特殊权限
   */
  checkSpecialPermission: async (memberId: string, specialPermission: string): Promise<PermissionCheckResult> => {
    try {
      // 超级管理员自动拥有所有特殊权限
      const isSuperAdmin = await globalPermissionService.isSuperAdmin(memberId);
      if (isSuperAdmin) {
        return {
          hasPermission: true,
          bypassReason: 'Super admin bypass'
        };
      }

      // 检查特殊权限
      const hasPermission = await permissionService.checkPermission(memberId, specialPermission);

      return {
        hasPermission,
        reason: hasPermission ? 'Special permission granted' : 'Special permission denied'
      };
    } catch (error) {
      console.error('特殊权限检查失败:', error);
      return {
        hasPermission: false,
        reason: 'Special permission check failed'
      };
    }
  },

  /**
   * 获取用户的所有有效权限
   * @param memberId 会员ID
   * @returns 权限列表
   */
  getEffectivePermissions: async (memberId: string): Promise<string[]> => {
    try {
      // 超级管理员返回所有权限
      const isSuperAdmin = await globalPermissionService.isSuperAdmin(memberId);
      if (isSuperAdmin) {
        return Object.values(GLOBAL_PERMISSION_CONFIG.PERMISSION_MODULES).flatMap(module =>
          Object.values(GLOBAL_PERMISSION_CONFIG.PERMISSION_ACTIONS).map(action => `${module}.${action}`)
        );
      }

      // 获取用户的实际权限
      return await permissionService.getEffectivePermissions(memberId);
    } catch (error) {
      console.error('获取有效权限失败:', error);
      return [];
    }
  },

  /**
   * 检查权限组合（需要同时满足多个权限）
   * @param memberId 会员ID
   * @param permissions 权限组合
   * @returns 是否满足所有权限
   */
  checkPermissionCombination: async (
    memberId: string,
    permissions: Array<{module: PermissionModule, action: PermissionAction}>
  ): Promise<PermissionCheckResult> => {
    try {
      const results = await globalPermissionService.checkPermissions(memberId, permissions);
      const hasAllPermissions = Object.values(results).every(hasPermission => hasPermission);

      return {
        hasPermission: hasAllPermissions,
        reason: hasAllPermissions ? 'All permissions granted' : 'Some permissions denied'
      };
    } catch (error) {
      console.error('权限组合检查失败:', error);
      return {
        hasPermission: false,
        reason: 'Permission combination check failed'
      };
    }
  },

  /**
   * 检查权限选择（满足其中任一权限即可）
   * @param memberId 会员ID
   * @param permissions 权限选择
   * @returns 是否满足任一权限
   */
  checkPermissionAlternative: async (
    memberId: string,
    permissions: Array<{module: PermissionModule, action: PermissionAction}>
  ): Promise<PermissionCheckResult> => {
    try {
      const results = await globalPermissionService.checkPermissions(memberId, permissions);
      const hasAnyPermission = Object.values(results).some(hasPermission => hasPermission);

      return {
        hasPermission: hasAnyPermission,
        reason: hasAnyPermission ? 'At least one permission granted' : 'All permissions denied'
      };
    } catch (error) {
      console.error('权限选择检查失败:', error);
      return {
        hasPermission: false,
        reason: 'Permission alternative check failed'
      };
    }
  }
};

/**
 * 权限检查装饰器工厂
 * @param module 权限模块
 * @param action 权限动作
 * @returns 权限检查装饰器
 */
export function requirePermission(module: PermissionModule, action: PermissionAction) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const memberId = args[0]; // 假设第一个参数是memberId
      
      const result = await globalPermissionService.checkPermission(memberId, module, action);
      if (!result.hasPermission) {
        throw new Error(`Permission denied: ${module}.${action}`);
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 权限检查高阶函数
 * @param module 权限模块
 * @param action 权限动作
 * @param callback 回调函数
 * @returns 带权限检查的函数
 */
export function withPermissionCheck<T extends any[], R>(
  module: PermissionModule,
  action: PermissionAction,
  callback: (memberId: string, ...args: T) => Promise<R>
) {
  return async (memberId: string, ...args: T): Promise<R> => {
    const result = await globalPermissionService.checkPermission(memberId, module, action);
    if (!result.hasPermission) {
      throw new Error(`Permission denied: ${module}.${action}`);
    }

    return callback(memberId, ...args);
  };
}

/**
 * 权限验证工具
 */
export const permissionValidators = {
  /**
   * 验证会员管理权限
   */
  memberManagement: {
    create: (memberId: string) => globalPermissionService.checkPermission(memberId, 'MEMBER_MANAGEMENT', 'CREATE'),
    read: (memberId: string) => globalPermissionService.checkPermission(memberId, 'MEMBER_MANAGEMENT', 'READ'),
    update: (memberId: string) => globalPermissionService.checkPermission(memberId, 'MEMBER_MANAGEMENT', 'UPDATE'),
    delete: (memberId: string) => globalPermissionService.checkPermission(memberId, 'MEMBER_MANAGEMENT', 'DELETE'),
    manage: (memberId: string) => globalPermissionService.checkPermission(memberId, 'MEMBER_MANAGEMENT', 'MANAGE')
  },

  /**
   * 验证财务管理权限
   */
  financeManagement: {
    create: (memberId: string) => globalPermissionService.checkPermission(memberId, 'FINANCE_MANAGEMENT', 'CREATE'),
    read: (memberId: string) => globalPermissionService.checkPermission(memberId, 'FINANCE_MANAGEMENT', 'READ'),
    update: (memberId: string) => globalPermissionService.checkPermission(memberId, 'FINANCE_MANAGEMENT', 'UPDATE'),
    delete: (memberId: string) => globalPermissionService.checkPermission(memberId, 'FINANCE_MANAGEMENT', 'DELETE'),
    manage: (memberId: string) => globalPermissionService.checkPermission(memberId, 'FINANCE_MANAGEMENT', 'MANAGE')
  },

  /**
   * 验证活动管理权限
   */
  eventManagement: {
    create: (memberId: string) => globalPermissionService.checkPermission(memberId, 'EVENT_MANAGEMENT', 'CREATE'),
    read: (memberId: string) => globalPermissionService.checkPermission(memberId, 'EVENT_MANAGEMENT', 'READ'),
    update: (memberId: string) => globalPermissionService.checkPermission(memberId, 'EVENT_MANAGEMENT', 'UPDATE'),
    delete: (memberId: string) => globalPermissionService.checkPermission(memberId, 'EVENT_MANAGEMENT', 'DELETE'),
    manage: (memberId: string) => globalPermissionService.checkPermission(memberId, 'EVENT_MANAGEMENT', 'MANAGE')
  },

  /**
   * 验证系统管理权限
   */
  systemAdmin: {
    manage: (memberId: string) => globalPermissionService.checkPermission(memberId, 'SYSTEM_ADMIN', 'MANAGE'),
    audit: (memberId: string) => globalPermissionService.checkPermission(memberId, 'SYSTEM_ADMIN', 'AUDIT')
  }
};

/**
 * 导出默认配置
 */
export default GLOBAL_PERMISSION_CONFIG;
