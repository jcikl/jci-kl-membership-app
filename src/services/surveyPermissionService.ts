import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  SurveyPermission,
  SurveyPermissionType,
  ApiResponse
} from '@/types';

// 问卷权限服务
export const surveyPermissionService = {
  // 授予权限
  async grantPermission(
    surveyId: string,
    userId: string,
    permissions: SurveyPermissionType[],
    grantedBy: string,
    expiresAt?: string
  ): Promise<ApiResponse<SurveyPermission>> {
    try {
      const now = new Date().toISOString();
      const permission: Omit<SurveyPermission, 'id'> = {
        surveyId,
        userId,
        permissions,
        grantedBy,
        grantedAt: now,
        expiresAt
      };

      const docRef = await addDoc(collection(db, 'survey_permissions'), {
        ...permission,
        grantedAt: Timestamp.fromDate(new Date(now)),
        expiresAt: expiresAt ? Timestamp.fromDate(new Date(expiresAt)) : null,
      });

      return {
        success: true,
        data: { ...permission, id: docRef.id } as any,
        message: '权限授予成功'
      };
    } catch (error) {
      console.error('授予权限失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '授予权限失败'
      };
    }
  },

  // 撤销权限
  async revokePermission(permissionId: string): Promise<ApiResponse<void>> {
    try {
      const docRef = doc(db, 'survey_permissions', permissionId);
      await deleteDoc(docRef);

      return {
        success: true,
        message: '权限撤销成功'
      };
    } catch (error) {
      console.error('撤销权限失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '撤销权限失败'
      };
    }
  },

  // 更新权限
  async updatePermission(
    permissionId: string,
    updates: Partial<Pick<SurveyPermission, 'permissions' | 'expiresAt'>>
  ): Promise<ApiResponse<SurveyPermission>> {
    try {
      const docRef = doc(db, 'survey_permissions', permissionId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      if (updates.expiresAt) {
        (updateData as any).expiresAt = Timestamp.fromDate(new Date(updates.expiresAt!));
      }

      await updateDoc(docRef, updateData);

      // 获取更新后的数据
      const result = await this.getPermission(permissionId);
      if (result.success) {
        return {
          success: true,
          data: result.data!,
          message: '权限更新成功'
        };
      }

      return result;
    } catch (error) {
      console.error('更新权限失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新权限失败'
      };
    }
  },

  // 获取权限详情
  async getPermission(permissionId: string): Promise<ApiResponse<SurveyPermission>> {
    try {
      const docRef = doc(db, 'survey_permissions', permissionId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          success: false,
          error: '权限不存在'
        };
      }

      const data = docSnap.data();
      const permission: SurveyPermission = {
        id: docSnap.id,
        ...data,
        grantedAt: data.grantedAt?.toDate?.()?.toISOString() || data.grantedAt,
        expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
      } as any;

      return {
        success: true,
        data: permission
      };
    } catch (error) {
      console.error('获取权限失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取权限失败'
      };
    }
  },

  // 获取问卷的所有权限
  async getSurveyPermissions(surveyId: string): Promise<ApiResponse<SurveyPermission[]>> {
    try {
      const q = query(
        collection(db, 'survey_permissions'),
        where('surveyId', '==', surveyId),
        orderBy('grantedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const permissions: SurveyPermission[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const permission: SurveyPermission = {
          id: doc.id,
          ...data,
          grantedAt: data.grantedAt?.toDate?.()?.toISOString() || data.grantedAt,
          expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
        } as any;
        permissions.push(permission);
      });

      return {
        success: true,
        data: permissions
      };
    } catch (error) {
      console.error('获取问卷权限失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取问卷权限失败'
      };
    }
  },

  // 获取用户的问卷权限
  async getUserSurveyPermissions(userId: string): Promise<ApiResponse<SurveyPermission[]>> {
    try {
      const q = query(
        collection(db, 'survey_permissions'),
        where('userId', '==', userId),
        orderBy('grantedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const permissions: SurveyPermission[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const permission: SurveyPermission = {
          id: doc.id,
          ...data,
          grantedAt: data.grantedAt?.toDate?.()?.toISOString() || data.grantedAt,
          expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
        } as any;
        permissions.push(permission);
      });

      return {
        success: true,
        data: permissions
      };
    } catch (error) {
      console.error('获取用户问卷权限失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户问卷权限失败'
      };
    }
  },

  // 检查用户对特定问卷的权限
  async checkUserSurveyPermission(
    userId: string,
    surveyId: string,
    permission: SurveyPermissionType
  ): Promise<ApiResponse<boolean>> {
    try {
      const q = query(
        collection(db, 'survey_permissions'),
        where('userId', '==', userId),
        where('surveyId', '==', surveyId)
      );

      const snapshot = await getDocs(q);
      const now = new Date();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const permissionData: SurveyPermission = {
          id: doc.id,
          ...data,
          grantedAt: data.grantedAt?.toDate?.()?.toISOString() || data.grantedAt,
          expiresAt: data.expiresAt?.toDate?.()?.toISOString() || data.expiresAt,
        } as any;

        // 检查权限是否过期
        if (permissionData.expiresAt && new Date(permissionData.expiresAt) < now) {
          continue;
        }

        // 检查是否包含所需权限
        if (permissionData.permissions.includes(permission)) {
          return {
            success: true,
            data: true
          };
        }
      }

      return {
        success: true,
        data: false
      };
    } catch (error) {
      console.error('检查用户问卷权限失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '检查用户问卷权限失败'
      };
    }
  },

  // 批量授予权限
  async grantPermissionsToUsers(
    surveyId: string,
    userPermissions: Array<{
      userId: string;
      permissions: SurveyPermissionType[];
      expiresAt?: string;
    }>,
    grantedBy: string
  ): Promise<ApiResponse<SurveyPermission[]>> {
    try {
      const permissions: SurveyPermission[] = [];
      const now = new Date().toISOString();

      for (const userPerm of userPermissions) {
        const permission: Omit<SurveyPermission, 'id'> = {
          surveyId,
          userId: userPerm.userId,
          permissions: userPerm.permissions,
          grantedBy,
          grantedAt: now,
          expiresAt: userPerm.expiresAt
        };

        const docRef = await addDoc(collection(db, 'survey_permissions'), {
          ...permission,
          grantedAt: Timestamp.fromDate(new Date(now)),
          expiresAt: userPerm.expiresAt ? Timestamp.fromDate(new Date(userPerm.expiresAt)) : null,
        });

        permissions.push({ ...permission, id: docRef.id } as any);
      }

      return {
        success: true,
        data: permissions,
        message: '批量权限授予成功'
      };
    } catch (error) {
      console.error('批量授予权限失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '批量授予权限失败'
      };
    }
  },

  // 清理过期权限
  async cleanupExpiredPermissions(): Promise<ApiResponse<number>> {
    try {
      const q = query(
        collection(db, 'survey_permissions'),
        where('expiresAt', '!=', null)
      );

      const snapshot = await getDocs(q);
      const now = new Date();
      let deletedCount = 0;

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const expiresAt = data.expiresAt?.toDate?.();
        
        if (expiresAt && expiresAt < now) {
          await deleteDoc(doc.ref);
          deletedCount++;
        }
      }

      return {
        success: true,
        data: deletedCount,
        message: `清理了 ${deletedCount} 个过期权限`
      };
    } catch (error) {
      console.error('清理过期权限失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '清理过期权限失败'
      };
    }
  }
};
