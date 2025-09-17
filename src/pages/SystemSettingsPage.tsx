import React from 'react';
import { Card, Typography, Tabs, Row, Col, Space } from 'antd';
import { 
  SettingOutlined, 
  TeamOutlined, 
  TrophyOutlined, 
  SafetyOutlined,
  UserOutlined,
  BarChartOutlined,
  AuditOutlined,
  TagsOutlined,
  FlagOutlined,
  BankOutlined
} from '@ant-design/icons';
import RBACAudit from '@/components/rbac/RBACAudit';
import PermissionMatrix from '@/components/rbac/PermissionMatrix';
import PermissionMatrixChart from '@/components/rbac/PermissionMatrixChart';
import PositionManagement from '@/components/rbac/PositionManagement';
import CategoryManagement from '@/components/rbac/CategoryManagement';
import ChapterSettings from '@/components/ChapterSettings';
import CouncilTasksManager from '@/components/CouncilTasksManager';
import MembershipTasksManager from '@/components/MembershipTasksManager.tsx';
import NewAwardIndicatorManagement from '@/components/NewAwardIndicatorManagement';
import HeadquartersSettings from '@/components/HeadquartersSettings';
import CountrySettings from '@/components/CountrySettings';

const { Title } = Typography;

/**
 * 系统设置 - RBAC 配置
 */
const SystemSettingsPage: React.FC = () => {
  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 头部标题卡片 */}
      <Card 
        style={{ 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none'
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <SettingOutlined style={{ fontSize: '32px', marginRight: '16px', color: 'white' }} />
              <div>
                <Title level={2} style={{ margin: 0, color: 'white' }}>
                  系统设置
                </Title>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                  配置分会信息、任务管理和系统审计
                </p>
              </div>
            </div>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>系统状态</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>运行正常</div>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>


      <Card>
        <Tabs
          defaultActiveKey="headquarters"
          size="large"
          tabPosition="left"
          items={[
            {
              key: 'headquarters',
              label: (
                <span>
                  <BankOutlined />
                  总部设置
                </span>
              ),
              children: <HeadquartersSettings />
            },
            {
              key: 'country-settings',
              label: (
                <span>
                  <FlagOutlined />
                  国家设置
                </span>
              ),
              children: <CountrySettings />
            },
            {
              key: 'chapter',
              label: (
                <span>
                  <TeamOutlined />
                  分会设置
                </span>
              ),
              children: <ChapterSettings />
            },
            {
              key: 'membership-tasks',
              label: (
                <span>
                  <UserOutlined />
                  会员管理任务
                </span>
              ),
              children: <MembershipTasksManager />
            },
            {
              key: 'council-tasks',
              label: (
                <span>
                  <TrophyOutlined />
                  理事团任务
                </span>
              ),
              children: <CouncilTasksManager />
            },
            {
              key: 'award-indicators',
              label: (
                <span>
                  <TrophyOutlined />
                  奖励指标管理
                </span>
              ),
              children: <NewAwardIndicatorManagement />
            },
            {
              key: 'rbac-matrix',
              label: (
                <span>
                  <SafetyOutlined />
                  JCI权限矩阵
                </span>
              ),
              children: <PermissionMatrix />
            },
            {
              key: 'rbac-chart',
              label: (
                <span>
                  <BarChartOutlined />
                  权限矩阵图表
                </span>
              ),
              children: <PermissionMatrixChart />
            },
            {
              key: 'positions',
              label: (
                <span>
                  <UserOutlined />
                  职位管理
                </span>
              ),
              children: <PositionManagement />
            },
            {
              key: 'categories',
              label: (
                <span>
                  <TagsOutlined />
                  分类管理
                </span>
              ),
              children: <CategoryManagement />
            },
            {
              key: 'audit',
              label: (
                <span>
                  <AuditOutlined />
                  审计日志
                </span>
              ),
              children: <RBACAudit />
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default SystemSettingsPage;


