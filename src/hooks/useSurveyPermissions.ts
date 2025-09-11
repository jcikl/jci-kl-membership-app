import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { permissionService } from '@/services/permissionService';
import { SurveyPermissionType } from '@/types';

interface SurveyPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canClose: boolean;
  canArchive: boolean;
  canViewResponses: boolean;
  canExportResponses: boolean;
  canViewAnalytics: boolean;
  canManageTemplates: boolean;
  canSubmitResponse: boolean;
}

export const useSurveyPermissions = (surveyId?: string) => {
  const { user, member } = useAuthStore();
  const [permissions, setPermissions] = useState<SurveyPermissions>({
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
    canPublish: false,
    canClose: false,
    canArchive: false,
    canViewResponses: false,
    canExportResponses: false,
    canViewAnalytics: false,
    canManageTemplates: false,
    canSubmitResponse: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !member) {
      setPermissions({
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canPublish: false,
        canClose: false,
        canArchive: false,
        canViewResponses: false,
        canExportResponses: false,
        canViewAnalytics: false,
        canManageTemplates: false,
        canSubmitResponse: false
      });
      setLoading(false);
      return;
    }

    checkPermissions();
  }, [user, member, surveyId]);

  const checkPermissions = async () => {
    if (!user || !member) return;

    try {
      setLoading(true);
      
      // 检查基础问卷权限
      const [
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        canPublish,
        canClose,
        canArchive,
        canViewResponses,
        canExportResponses,
        canViewAnalytics,
        canManageTemplates,
        canSubmitResponse
      ] = await Promise.all([
        permissionService.checkPermission(user.uid, 'survey.create'),
        permissionService.checkPermission(user.uid, 'survey.read'),
        permissionService.checkPermission(user.uid, 'survey.update'),
        permissionService.checkPermission(user.uid, 'survey.delete'),
        permissionService.checkPermission(user.uid, 'survey.publish'),
        permissionService.checkPermission(user.uid, 'survey.close'),
        permissionService.checkPermission(user.uid, 'survey.archive'),
        permissionService.checkPermission(user.uid, 'survey.response.read'),
        permissionService.checkPermission(user.uid, 'survey.response.export'),
        permissionService.checkPermission(user.uid, 'survey.analytics.read'),
        permissionService.checkPermission(user.uid, 'survey.template.create'),
        permissionService.checkPermission(user.uid, 'survey.response.create')
      ]);

      setPermissions({
        canCreate: canCreate,
        canRead: canRead,
        canUpdate: canUpdate,
        canDelete: canDelete,
        canPublish: canPublish,
        canClose: canClose,
        canArchive: canArchive,
        canViewResponses: canViewResponses,
        canExportResponses: canExportResponses,
        canViewAnalytics: canViewAnalytics,
        canManageTemplates: canManageTemplates,
        canSubmitResponse: canSubmitResponse
      });
    } catch (error) {
      console.error('检查问卷权限失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 检查特定权限
  const hasPermission = (permission: SurveyPermissionType): boolean => {
    switch (permission) {
      case 'view':
        return permissions.canRead;
      case 'edit':
        return permissions.canUpdate;
      case 'delete':
        return permissions.canDelete;
      case 'publish':
        return permissions.canPublish;
      case 'close':
        return permissions.canClose;
      case 'view_responses':
        return permissions.canViewResponses;
      case 'export_responses':
        return permissions.canExportResponses;
      case 'view_analytics':
        return permissions.canViewAnalytics;
      case 'manage_permissions':
        return permissions.canUpdate; // 简化处理，有更新权限就可以管理权限
      default:
        return false;
    }
  };

  // 检查是否可以访问问卷
  const canAccessSurvey = (_: string): boolean => {
    return permissions.canRead;
  };

  // 检查是否可以编辑问卷
  const canEditSurvey = (_: string): boolean => {
    return permissions.canUpdate;
  };

  // 检查是否可以删除问卷
  const canDeleteSurvey = (_: string): boolean => {
    return permissions.canDelete;
  };

  // 检查是否可以发布问卷
  const canPublishSurvey = (_: string): boolean => {
    return permissions.canPublish;
  };

  // 检查是否可以查看回答
  const canViewResponses = (_: string): boolean => {
    return permissions.canViewResponses;
  };

  // 检查是否可以查看分析
  const canViewAnalytics = (_: string): boolean => {
    return permissions.canViewAnalytics;
  };

  return {
    permissions,
    loading,
    hasPermission,
    canAccessSurvey,
    canEditSurvey,
    canDeleteSurvey,
    canPublishSurvey,
    canViewResponses,
    canViewAnalytics,
    checkPermissions
  };
};
