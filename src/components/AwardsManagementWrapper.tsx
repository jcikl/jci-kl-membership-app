import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { permissionService } from '@/services/permissionService';
import { categoryService } from '@/services/categoryService';
import AwardsManagementPage from '@/pages/AwardsManagementPage';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * 奖励管理页面包装器
 * 负责检查用户权限并传递适当的props给AwardsManagementPage
 */
const AwardsManagementWrapper: React.FC = () => {
  const { member } = useAuthStore();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isDeveloper, setIsDeveloper] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkPermissions = async () => {
      if (!member?.id) {
        setIsAdmin(false);
        setIsDeveloper(false);
        setLoading(false);
        return;
      }

      try {
        // 检查管理员权限
        const adminPermission = await permissionService.hasAdminPermission(member.id);
        setIsAdmin(adminPermission);

        // 检查开发者权限 - 通过账户类型判断
        const category = await categoryService.getMemberCategory(member.id);
        const developerPermission = category?.accountType === 'developer';
        setIsDeveloper(developerPermission);
      } catch (error) {
        console.error('检查权限失败:', error);
        setIsAdmin(false);
        setIsDeveloper(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermissions();
  }, [member?.id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AwardsManagementPage
      memberId={member?.id}
      isAdmin={isAdmin}
      isDeveloper={isDeveloper}
    />
  );
};

export default AwardsManagementWrapper;
