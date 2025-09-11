import React from 'react';
import { Alert, Space, Typography } from 'antd';
import { LockOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { 
  checkFieldPermission, 
  UserRole 
} from '@/utils/fieldPermissions';
import { FieldPermission, LockReason, LOCK_REASON_MESSAGES } from '@/types/profileFields';

const { Text } = Typography;

interface FieldPermissionStatusProps {
  field: string;
  userRole: UserRole;
  memberData: any;
  showIcon?: boolean;
  showMessage?: boolean;
  size?: 'small' | 'default';
}

const FieldPermissionStatus: React.FC<FieldPermissionStatusProps> = ({
  field,
  userRole,
  memberData,
  showIcon = true,
  showMessage = true,
  size = 'small'
}) => {
  const permissionResult = checkFieldPermission(field, userRole, memberData);
  
  // 如果字段可编辑，不显示任何状态
  if (permissionResult.editable) {
    return null;
  }

  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (permissionResult.permission) {
      case FieldPermission.READ_ONLY:
        return <EyeOutlined style={{ color: '#1890ff' }} />;
      case FieldPermission.LOCKED:
        return <LockOutlined style={{ color: '#ff4d4f' }} />;
      case FieldPermission.ADMIN_ONLY:
        return <LockOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  const getMessage = () => {
    if (!showMessage) return null;
    
    if (permissionResult.message) {
      return permissionResult.message;
    }
    
    switch (permissionResult.permission) {
      case FieldPermission.READ_ONLY:
        return '只读字段';
      case FieldPermission.LOCKED:
        return '字段已锁定';
      case FieldPermission.ADMIN_ONLY:
        return '仅管理员可编辑';
      default:
        return '';
    }
  };

  const getAlertType = () => {
    switch (permissionResult.permission) {
      case FieldPermission.READ_ONLY:
        return 'info';
      case FieldPermission.LOCKED:
        return 'warning';
      case FieldPermission.ADMIN_ONLY:
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Alert
      message={
        <Space>
          {getIcon()}
          <Text>{getMessage()}</Text>
        </Space>
      }
      type={getAlertType()}
      size={size}
      showIcon={false}
      style={{ marginTop: 8 }}
    />
  );
};

export default FieldPermissionStatus;
