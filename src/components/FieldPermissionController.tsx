import React from 'react';
import { Form, Tooltip, Alert, Space } from 'antd';
import { LockOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { 
  checkFieldPermission, 
  FieldPermissionResult, 
  UserRole 
} from '@/utils/fieldPermissions';
import { FieldPermission, LockReason, LOCK_REASON_MESSAGES } from '@/types/profileFields';

interface FieldPermissionControllerProps {
  field: string;
  userRole: UserRole;
  memberData: any;
  children: React.ReactNode;
  showPermissionIndicator?: boolean;
  showLockMessage?: boolean;
}

const FieldPermissionController: React.FC<FieldPermissionControllerProps> = ({
  field,
  userRole,
  memberData,
  children,
  showPermissionIndicator = true,
  showLockMessage = true
}) => {
  const permissionResult = checkFieldPermission(field, userRole, memberData);
  
  // 如果字段可编辑，直接渲染子组件
  if (permissionResult.editable) {
    return <>{children}</>;
  }

  // 如果字段不可编辑，包装子组件并添加权限指示器
  const renderPermissionIndicator = () => {
    if (!showPermissionIndicator) return null;

    const getIcon = () => {
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

    const getTooltipTitle = () => {
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

    return (
      <Tooltip title={getTooltipTitle()}>
        {getIcon()}
      </Tooltip>
    );
  };

  // 渲染锁定消息
  const renderLockMessage = () => {
    if (!showLockMessage || !permissionResult.lockReason) return null;

    const message = LOCK_REASON_MESSAGES[permissionResult.lockReason];
    if (!message) return null;

    return (
      <Alert
        message={message}
        type="warning"
        showIcon
        size="small"
        style={{ marginTop: 8 }}
      />
    );
  };

  // 克隆子组件并添加禁用状态
  const clonedChildren = React.cloneElement(children as React.ReactElement, {
    disabled: true,
    style: {
      ...((children as React.ReactElement).props?.style || {}),
      backgroundColor: '#f5f5f5',
      cursor: 'not-allowed'
    }
  });

  return (
    <div>
      <div style={{ position: 'relative' }}>
        {clonedChildren}
        {renderPermissionIndicator()}
      </div>
      {renderLockMessage()}
    </div>
  );
};

export default FieldPermissionController;
