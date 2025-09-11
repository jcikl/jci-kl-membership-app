import React from 'react';
import { Card, Typography, Tabs, Row, Col, Space, Statistic } from 'antd';
import { 
  SettingOutlined, 
  TeamOutlined, 
  TrophyOutlined, 
  SafetyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  UserOutlined
} from '@ant-design/icons';
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

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #52c41a 0%, #3f8600 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic 
              title={<span style={{ color: 'white', opacity: 0.9 }}>分会配置</span>}
              value="已配置" 
              prefix={<TeamOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              分会基本信息设置
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic 
              title={<span style={{ color: 'white', opacity: 0.9 }}>会员任务</span>}
              value={5} 
              prefix={<UserOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              活跃的会员管理任务
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic 
              title={<span style={{ color: 'white', opacity: 0.9 }}>理事团任务</span>}
              value={3} 
              prefix={<TrophyOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              理事团管理任务
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic 
              title={<span style={{ color: 'white', opacity: 0.9 }}>审计日志</span>}
              value={128} 
              prefix={<SafetyOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              系统操作审计记录
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          defaultActiveKey="chapter"
          size="large"
          items={[
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
              key: 'audit',
              label: (
                <span>
                  <SafetyOutlined />
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


