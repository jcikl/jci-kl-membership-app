// 账单付款申请权限检查 Hook
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { permissionService } from '@/services/permissionService';

export interface BillPaymentPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  canReject: boolean;
  canPay: boolean;
  canDelete: boolean;
  canView: boolean;
  canExport: boolean;
  canBulkApprove: boolean;
  canBulkReject: boolean;
  loading: boolean;
}

export const useBillPaymentPermissions = (): BillPaymentPermissions => {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<BillPaymentPermissions>({
    canCreate: false,
    canEdit: false,
    canApprove: false,
    canReject: false,
    canPay: false,
    canDelete: false,
    canView: false,
    canExport: false,
    canBulkApprove: false,
    canBulkReject: false,
    loading: true,
  });

  useEffect(() => {
    const checkPermissions = async () => {
      if (!user?.uid) {
        setPermissions({
          canCreate: false,
          canEdit: false,
          canApprove: false,
          canReject: false,
          canPay: false,
          canDelete: false,
          canView: false,
          canExport: false,
          canBulkApprove: false,
          canBulkReject: false,
          loading: false,
        });
        return;
      }

      try {
        const [
          canCreate,
          canEdit,
          canApprove,
          canReject,
          canPay,
          canDelete,
          canView,
          canExport,
          canBulkApprove,
          canBulkReject,
        ] = await Promise.all([
          permissionService.checkPermission(user.uid, 'finance.create'),
          permissionService.checkPermission(user.uid, 'finance.update'),
          permissionService.checkPermission(user.uid, 'finance.approve'),
          permissionService.checkPermission(user.uid, 'finance.reject'),
          permissionService.checkPermission(user.uid, 'finance.pay'),
          permissionService.checkPermission(user.uid, 'finance.delete'),
          permissionService.checkPermission(user.uid, 'finance.view'),
          permissionService.checkPermission(user.uid, 'finance.export'),
          permissionService.checkPermission(user.uid, 'finance.bulk_approve'),
          permissionService.checkPermission(user.uid, 'finance.bulk_reject'),
        ]);

        setPermissions({
          canCreate,
          canEdit,
          canApprove,
          canReject,
          canPay,
          canDelete,
          canView,
          canExport,
          canBulkApprove,
          canBulkReject,
          loading: false,
        });
      } catch (error) {
        console.error('检查账单付款权限失败:', error);
        setPermissions({
          canCreate: false,
          canEdit: false,
          canApprove: false,
          canReject: false,
          canPay: false,
          canDelete: false,
          canView: false,
          canExport: false,
          canBulkApprove: false,
          canBulkReject: false,
          loading: false,
        });
      }
    };

    checkPermissions();
  }, [user?.uid]);

  return permissions;
};

// 检查特定权限的 Hook
export const useBillPaymentPermission = (permission: string): boolean => {
  const { user } = useAuthStore();
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  // const [loading, setLoading] = useState<boolean>(true); // Unused variable

  useEffect(() => {
    const checkPermission = async () => {
      if (!user?.uid) {
        setHasPermission(false);
        // setLoading(false); // Commented out since loading is unused
        return;
      }

      try {
        const result = await permissionService.checkPermission(user.uid, permission);
        setHasPermission(result);
      } catch (error) {
        console.error(`检查权限 ${permission} 失败:`, error);
        setHasPermission(false);
      } finally {
        // setLoading(false); // Commented out since loading is unused
      }
    };

    checkPermission();
  }, [user?.uid, permission]);

  return hasPermission;
};

// 检查用户是否可以操作特定状态的申请
export const useBillPaymentStatusPermission = (status: string, action: string): boolean => {
  const permissions = useBillPaymentPermissions();
  
  if (permissions.loading) return false;
  
  switch (action) {
    case 'edit':
      return permissions.canEdit && status === 'pending';
    case 'approve':
      return permissions.canApprove && status === 'pending';
    case 'reject':
      return permissions.canReject && status === 'pending';
    case 'pay':
      return permissions.canPay && status === 'approved';
    case 'delete':
      return permissions.canDelete;
    case 'view':
      return permissions.canView;
    default:
      return false;
  }
};
