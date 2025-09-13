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
        ] = await Promise.all([
          permissionService.checkPermission(user.uid, 'finance.create'),
          permissionService.checkPermission(user.uid, 'finance.update'),
          permissionService.checkPermission(user.uid, 'finance.update'),
          permissionService.checkPermission(user.uid, 'finance.update'),
          permissionService.checkPermission(user.uid, 'finance.update'),
          permissionService.checkPermission(user.uid, 'finance.delete'),
        ]);

        setPermissions({
          canCreate,
          canEdit,
          canApprove,
          canReject,
          canPay,
          canDelete,
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
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!user?.uid) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        const result = await permissionService.checkPermission(user.uid, permission);
        setHasPermission(result);
      } catch (error) {
        console.error(`检查权限 ${permission} 失败:`, error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [user?.uid, permission]);

  return hasPermission;
};
