import { 
  FieldPermission, 
  LockReason, 
  LOCK_REASON_MESSAGES,
  FIELD_PERMISSION_RULES 
} from '@/types/profileFields';

// 用户角色类型
export type UserRole = 'admin' | 'developer' | 'member';

// 字段权限检查结果
export interface FieldPermissionResult {
  permission: FieldPermission;
  editable: boolean;
  lockReason?: LockReason;
  message?: string;
}

/**
 * 检查字段权限
 * @param field 字段名
 * @param userRole 用户角色
 * @param memberData 会员数据
 * @returns 字段权限结果
 */
export function checkFieldPermission(
  field: string, 
  userRole: UserRole, 
  memberData: any
): FieldPermissionResult {
  // 查找字段权限规则
  const rule = FIELD_PERMISSION_RULES.find(r => r.field === field);
  
  if (!rule) {
    // 没有特殊规则，默认可读写
    return {
      permission: FieldPermission.READ_WRITE,
      editable: true
    };
  }

  // 检查管理员专用字段
  if (rule.permission === FieldPermission.ADMIN_ONLY) {
    if (userRole === 'admin' || userRole === 'developer') {
      return {
        permission: FieldPermission.READ_WRITE,
        editable: true
      };
    } else {
      return {
        permission: FieldPermission.READ_ONLY,
        editable: false,
        message: '仅管理员可编辑'
      };
    }
  }

  // 检查条件锁定
  if (rule.condition && rule.condition(memberData)) {
    return {
      permission: FieldPermission.LOCKED,
      editable: false,
      lockReason: rule.lockReason,
      message: rule.lockReason ? LOCK_REASON_MESSAGES[rule.lockReason] : '字段已锁定'
    };
  }

  // 检查只读权限
  if (rule.permission === FieldPermission.READ_ONLY) {
    return {
      permission: FieldPermission.READ_ONLY,
      editable: false,
      message: '只读字段'
    };
  }

  // 默认可读写
  return {
    permission: FieldPermission.READ_WRITE,
    editable: true
  };
}

/**
 * 检查字段是否应该显示锁定消息
 * @param field 字段名
 * @param memberData 会员数据
 * @returns 是否显示锁定消息
 */
export function shouldShowLockMessage(field: string, memberData: any): boolean {
  const result = checkFieldPermission(field, 'member', memberData);
  return result.permission === FieldPermission.LOCKED && !!result.lockReason;
}


/**
 * 批量检查字段权限
 * @param fields 字段列表
 * @param userRole 用户角色
 * @param memberData 会员数据
 * @returns 字段权限映射
 */
export function checkMultipleFieldPermissions(
  fields: string[],
  userRole: UserRole,
  memberData: any
): Record<string, FieldPermissionResult> {
  const result: Record<string, FieldPermissionResult> = {};
  
  fields.forEach(field => {
    result[field] = checkFieldPermission(field, userRole, memberData);
  });
  
  return result;
}

/**
 * 检查字段是否被锁定
 * @param field 字段名
 * @param memberData 会员数据
 * @returns 是否被锁定
 */
export function isFieldLocked(field: string, memberData: any): boolean {
  const result = checkFieldPermission(field, 'member', memberData);
  return result.permission === FieldPermission.LOCKED;
}

/**
 * 获取字段锁定原因
 * @param field 字段名
 * @param memberData 会员数据
 * @returns 锁定原因
 */
export function getFieldLockReason(field: string, memberData: any): LockReason | null {
  const result = checkFieldPermission(field, 'member', memberData);
  return result.lockReason || null;
}

/**
 * 检查用户是否有编辑权限
 * @param userRole 用户角色
 * @returns 是否有编辑权限
 */
export function hasEditPermission(userRole: UserRole): boolean {
  return userRole === 'admin' || userRole === 'developer';
}

/**
 * 检查用户是否有管理员权限
 * @param userRole 用户角色
 * @returns 是否有管理员权限
 */
export function hasAdminPermission(userRole: UserRole): boolean {
  return userRole === 'admin' || userRole === 'developer';
}
