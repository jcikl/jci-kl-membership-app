/**
 * 全局配置索引
 * 统一导出所有全局配置文件
 */

// 核心配置
export { GLOBAL_COLLECTIONS, getCollectionId, getCollectionIds, isValidCollectionId } from './globalCollections';
export { GLOBAL_DATE_CONFIG, globalDateService, dateValidators } from './globalDateSettings';
export { GLOBAL_PERMISSION_CONFIG, globalPermissionService, permissionValidators } from './globalPermissions';
export { GLOBAL_COMPONENT_CONFIG, globalComponentService, withPermissionControl, usePermission } from './globalComponentSettings';
export { GLOBAL_SYSTEM_CONFIG, globalSystemService } from './globalSystemSettings';
export { GLOBAL_VALIDATION_CONFIG, globalValidationService, yupSchemas, formValidators } from './globalValidationSettings';

// Import services for initialization
import { globalSystemService } from './globalSystemSettings';
import { globalComponentService } from './globalComponentSettings';
import { globalSettingsCommander } from './globalSettingsCommander';
import { GLOBAL_COLLECTIONS, getCollectionId, getCollectionIds, isValidCollectionId } from './globalCollections';
import { GLOBAL_DATE_CONFIG, globalDateService } from './globalDateSettings';
import { GLOBAL_PERMISSION_CONFIG, globalPermissionService } from './globalPermissions';
import { GLOBAL_COMPONENT_CONFIG } from './globalComponentSettings';
import { GLOBAL_SYSTEM_CONFIG } from './globalSystemSettings';
import { GLOBAL_VALIDATION_CONFIG, globalValidationService } from './globalValidationSettings';
import { GLOBAL_SETTINGS_COMMANDER_CONFIG } from './globalSettingsCommander';

// 全局设置总指挥系统
export { GLOBAL_SETTINGS_COMMANDER_CONFIG, globalSettingsCommander } from './globalSettingsCommander';
export type { ComplianceCheckResult, ComplianceViolation, ComplianceRecommendation } from './globalSettingsCommander';

// 类型导出
export type { CollectionType } from './globalCollections';
export type { PermissionModule, PermissionAction, PermissionLevel, PermissionCheckResult, BatchPermissionCheckResult } from './globalPermissions';
export type { ValidationRule, FieldLimit } from './globalValidationSettings';
export type { SystemConfig } from './globalSystemSettings';

// 默认导出
export { default as DateSettings } from './globalDateSettings';
export { default as Permissions } from './globalPermissions';
export { default as ComponentSettings } from './globalComponentSettings';
export { default as SystemSettings } from './globalSystemSettings';
export { default as ValidationSettings } from './globalValidationSettings';
export { default as CommanderSettings } from './globalSettingsCommander';

/**
 * 全局配置初始化函数
 * 用于初始化所有全局配置
 */
export const initializeGlobalConfig = async () => {
  try {
    // 初始化系统配置
    await globalSystemService.initialize();
    
    // 应用全局组件样式
    globalComponentService.applyGlobalStyles();
    
    // 配置消息提示
    globalComponentService.configureMessages();
    
    // 初始化全局设置总指挥系统
    await globalSettingsCommander.initialize();
    
    return true;
  } catch (error) {
    globalSystemService.logError(error as Error, { context: 'global_config_initialization' });
    return false;
  }
};

/**
 * 导出所有配置的便捷访问器
 */
export const GlobalConfig = {
  Collections: GLOBAL_COLLECTIONS,
  Date: GLOBAL_DATE_CONFIG,
  Permissions: GLOBAL_PERMISSION_CONFIG,
  Components: GLOBAL_COMPONENT_CONFIG,
  System: GLOBAL_SYSTEM_CONFIG,
  Validation: GLOBAL_VALIDATION_CONFIG,
  Commander: GLOBAL_SETTINGS_COMMANDER_CONFIG
} as const;

/**
 * 导出所有服务的便捷访问器
 */
export const GlobalServices = {
  Collections: {
    getCollectionId,
    getCollectionIds,
    isValidCollectionId
  },
  Date: globalDateService,
  Permissions: globalPermissionService,
  Components: globalComponentService,
  System: globalSystemService,
  Validation: globalValidationService,
  Commander: globalSettingsCommander
} as const;
