import React from 'react';
import { Card, Typography, Tabs } from 'antd';
import RBACRoles from '@/components/rbac/RBACRoles';
import RBACPermissions from '@/components/rbac/RBACPermissions';
import RBACBindings from '@/components/rbac/RBACBindings';
import RBACAudit from '@/components/rbac/RBACAudit';
import ChapterSettings from '@/components/ChapterSettings';
import StorageTest from '@/components/StorageTest';

const { Title } = Typography;

/**
 * 系统设置 - RBAC 配置
 */
const SystemSettingsPage: React.FC = () => {
  return (
    <Card>
      <Title level={3} style={{ marginBottom: 16 }}>系统设置</Title>
      <Tabs
        defaultActiveKey="chapter"
        items={[
          {
            key: 'chapter',
            label: '分会设置',
            children: <ChapterSettings />
          },
          {
            key: 'storage-test',
            label: '存储测试',
            children: <StorageTest />
          },
          {
            key: 'roles',
            label: '角色管理',
            children: <RBACRoles />
          },
          {
            key: 'permissions',
            label: '权限管理',
            children: <RBACPermissions />
          },
          {
            key: 'bindings',
            label: '用户角色绑定',
            children: <RBACBindings />
          },
          {
            key: 'audit',
            label: '审计日志',
            children: <RBACAudit />
          }
        ]}
      />
    </Card>
  );
};

export default SystemSettingsPage;


