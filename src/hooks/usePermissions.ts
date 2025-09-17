import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { permissionService } from '@/modules/permission/services/permissionService';

export const useIsAdmin = () => {
  const { member } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const check = async () => {
      if (!member?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      try {
        const ok = await permissionService.hasAdminPermission(member.id);
        setIsAdmin(ok);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [member?.id]);

  return { isAdmin, loading };
};
