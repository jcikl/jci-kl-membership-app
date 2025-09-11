import React from 'react';
import { Card, Typography, Tabs } from 'antd';
import RBACAudit from '@/components/rbac/RBACAudit';
import ChapterSettings from '@/components/ChapterSettings';
import CouncilTasksManager from '@/components/CouncilTasksManager';
import MembershipTasksManager from '@/components/MembershipTasksManager.tsx';

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
            key: 'membership-tasks',
            label: '会员管理任务',
            children: <MembershipTasksManager />
          },
          {
            key: 'council-tasks',
            label: '理事团任务',
            children: <CouncilTasksManager />
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


