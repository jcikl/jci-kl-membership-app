import React from 'react';
import { Card, Typography, Space, Alert, Divider } from 'antd';
import { LockOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { checkFieldPermission, UserRole } from '@/utils/fieldPermissions';
import { FieldPermission } from '@/types/profileFields';

const { Title, Text } = Typography;

interface PermissionControlDemoProps {
  userRole: UserRole;
  memberData: any;
}

const PermissionControlDemo: React.FC<PermissionControlDemoProps> = ({
  userRole,
  memberData
}) => {
  // 演示字段列表
  const demoFields = [
    { field: 'name', label: '姓名', description: '普通字段，所有用户可编辑' },
    { field: 'status', label: '状态', description: '管理员专用字段' },
    { field: 'senatorId', label: '参议员编号', description: '条件锁定字段' },
    { field: 'introducerName', label: '介绍人姓名', description: '条件锁定字段' },
    { field: 'nameToBeEmbroidered', label: '刺绣姓名', description: 'T恤相关锁定字段' },
    { field: 'shirtSize', label: 'T恤尺码', description: 'T恤相关锁定字段' },
  ];

  const getPermissionInfo = (field: string) => {
    const result = checkFieldPermission(field, userRole, memberData);
    
    return {
      permission: result.permission,
      editable: result.editable,
      lockReason: result.lockReason,
      message: result.message
    };
  };

  const getPermissionIcon = (permission: FieldPermission) => {
    switch (permission) {
      case FieldPermission.READ_WRITE:
        return <InfoCircleOutlined style={{ color: '#52c41a' }} />;
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

  const getPermissionText = (permission: FieldPermission) => {
    switch (permission) {
      case FieldPermission.READ_WRITE:
        return '可读写';
      case FieldPermission.READ_ONLY:
        return '只读';
      case FieldPermission.LOCKED:
        return '已锁定';
      case FieldPermission.ADMIN_ONLY:
        return '管理员专用';
      default:
        return '未知';
    }
  };

  const getAlertType = (permission: FieldPermission) => {
    switch (permission) {
      case FieldPermission.READ_WRITE:
        return 'success';
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
    <Card title="字段权限控制演示" style={{ marginTop: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message={`当前用户角色: ${userRole}`}
          type="info"
          showIcon
        />
        
        <Divider />
        
        <Title level={5}>字段权限状态</Title>
        
        {demoFields.map(({ field, label, description }) => {
          const permissionInfo = getPermissionInfo(field);
          
          return (
            <Card key={field} size="small" style={{ marginBottom: 8 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  {getPermissionIcon(permissionInfo.permission)}
                  <Text strong>{label}</Text>
                  <Text type="secondary">({field})</Text>
                </Space>
                
                <Text type="secondary">{description}</Text>
                
                <Alert
                  message={
                    <Space>
                      <Text>权限状态: {getPermissionText(permissionInfo.permission)}</Text>
                      {permissionInfo.lockReason && (
                        <Text type="secondary">
                          ('此字段已被锁定')
                        </Text>
                      )}
                    </Space>
                  }
                  type={getAlertType(permissionInfo.permission)}
                  showIcon={false}
                />
                
                {permissionInfo.message && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {permissionInfo.message}
                  </Text>
                )}
              </Space>
            </Card>
          );
        })}
        
        <Divider />
        
        <Title level={5}>权限控制规则说明</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="管理员专用字段"
            description="只有管理员和开发者可以编辑，普通用户只能查看"
            type="error"
            showIcon
          />
          <Alert
            message="条件锁定字段"
            description="根据业务条件动态锁定，如参议员编号验证后锁定"
            type="warning"
            showIcon
          />
          <Alert
            message="T恤相关锁定字段"
            description="当T恤领取状态为Requested时，相关字段被锁定"
            type="warning"
            showIcon
          />
          <Alert
            message="普通字段"
            description="所有用户都可以编辑"
            type="success"
            showIcon
          />
        </Space>
      </Space>
    </Card>
  );
};

export default PermissionControlDemo;
