// 权限同步服务 - 确保 Firebase 令牌与户口资料权限同步
import { auth } from './firebase';
import { permissionService } from './permissionService';

export interface PermissionSyncResult {
  success: boolean;
  message: string;
  oldRole?: string;
  newRole?: string;
}

export const permissionSyncService = {
  // 根据户口资料计算应该的 Firebase 角色
  async calculateFirebaseRole(memberId: string): Promise<string> {
    try {
      const effectivePermissions = await permissionService.getEffectivePermissions(memberId);
      
      // 根据权限计算角色优先级
      if (effectivePermissions.includes('system.admin') || effectivePermissions.includes('system.config')) {
        return 'developer';
      }
      
      if (effectivePermissions.includes('finance.delete') && effectivePermissions.includes('member.delete')) {
        return 'admin';
      }
      
      if (effectivePermissions.includes('finance.update') && effectivePermissions.includes('finance.create')) {
        return 'treasurer';
      }
      
      if (effectivePermissions.includes('member.update') && effectivePermissions.includes('activity.create')) {
        return 'moderator';
      }
      
      if (effectivePermissions.includes('member.read') && effectivePermissions.includes('activity.read')) {
        return 'member';
      }
      
      return 'user';
    } catch (error) {
      console.error('计算 Firebase 角色失败:', error);
      return 'user';
    }
  },

  // 同步用户权限到 Firebase 令牌
  async syncUserPermissions(memberId: string): Promise<PermissionSyncResult> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== memberId) {
        return {
          success: false,
          message: '用户未认证或用户ID不匹配'
        };
      }

      // 获取当前令牌中的角色
      const currentToken = await currentUser.getIdTokenResult();
      const oldRole = currentToken.claims.role as string;

      // 计算应该的角色
      const newRole = await this.calculateFirebaseRole(memberId);

      // 如果角色没有变化，不需要更新
      if (oldRole === newRole) {
        return {
          success: true,
          message: '权限已同步，无需更新',
          oldRole,
          newRole
        };
      }

      // 注意：这里需要 Firebase Admin SDK 来更新自定义声明
      // 在实际部署环境中，这应该通过后端 API 或 Cloud Function 来实现
      console.warn('需要 Firebase Admin SDK 来更新用户自定义声明');

      return {
        success: false,
        message: '需要后端服务来更新 Firebase 令牌',
        oldRole,
        newRole
      };
    } catch (error) {
      console.error('同步用户权限失败:', error);
      return {
        success: false,
        message: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`
      };
    }
  },

  // 批量同步多个用户的权限
  async syncMultipleUsersPermissions(memberIds: string[]): Promise<PermissionSyncResult[]> {
    const results: PermissionSyncResult[] = [];
    
    for (const memberId of memberIds) {
      try {
        const result = await this.syncUserPermissions(memberId);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          message: `同步用户 ${memberId} 失败: ${error instanceof Error ? error.message : '未知错误'}`
        });
      }
    }
    
    return results;
  },

  // 检查权限同步状态
  async checkPermissionSyncStatus(memberId: string): Promise<{
    isSynced: boolean;
    firebaseRole: string;
    calculatedRole: string;
    effectivePermissions: string[];
  }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== memberId) {
        throw new Error('用户未认证或用户ID不匹配');
      }

      const currentToken = await currentUser.getIdTokenResult();
      const firebaseRole = currentToken.claims.role as string;
      const calculatedRole = await this.calculateFirebaseRole(memberId);
      const effectivePermissions = await permissionService.getEffectivePermissions(memberId);

      return {
        isSynced: firebaseRole === calculatedRole,
        firebaseRole,
        calculatedRole,
        effectivePermissions
      };
    } catch (error) {
      console.error('检查权限同步状态失败:', error);
      throw error;
    }
  }
};

// 在户口资料更新时自动同步权限
export const autoSyncPermissions = async (memberId: string) => {
  try {
    const result = await permissionSyncService.syncUserPermissions(memberId);
    if (!result.success) {
      console.warn(`权限同步失败: ${result.message}`);
    }
    return result;
  } catch (error) {
    console.error('自动权限同步失败:', error);
    return {
      success: false,
      message: `自动同步失败: ${error instanceof Error ? error.message : '未知错误'}`
    };
  }
};
