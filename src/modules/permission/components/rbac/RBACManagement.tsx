import React, { useState } from 'react';
import { Tabs, Card, Row, Col, Typography, Space, Statistic } from 'antd';
import { 
  SafetyOutlined, 
  TeamOutlined, 
  BarChartOutlined, 
  AuditOutlined,
  UserOutlined,
  TagsOutlined,
  LockOutlined
} from '@ant-design/icons';
import PermissionMatrix from './PermissionMatrix';
import PermissionMatrixChart from './PermissionMatrixChart';
import RBACAudit from './RBACAudit';
import PositionManagement from './PositionManagement';
import CategoryManagement from './CategoryManagement';

const { Title } = Typography;


const RBACManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('jci-matrix');

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
              <SafetyOutlined style={{ fontSize: '32px', marginRight: '16px', color: 'white' }} />
              <div>
                <Title level={2} style={{ margin: 0, color: 'white' }}>
                  权限管理
                </Title>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                  基于角色的访问控制（RBAC）系统管理
                </p>
              </div>
            </div>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>安全状态</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>已启用</div>
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>角色数量</span>}
              value={12} 
              prefix={<TeamOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              系统预定义角色
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>权限模块</span>}
              value={5} 
              prefix={<LockOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              功能模块权限控制
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>职位管理</span>}
              value={8} 
              prefix={<UserOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              管理职位数量
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>审计记录</span>}
              value={256} 
              prefix={<AuditOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              权限操作审计日志
            </div>
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'jci-matrix',
              label: (
                <span>
                  <SafetyOutlined />
                  JCI权限矩阵
                </span>
              ),
              children: <PermissionMatrix />
            },
            {
              key: 'matrix-chart',
              label: (
                <span>
                  <BarChartOutlined />
                  权限矩阵图表
                </span>
              ),
              children: <PermissionMatrixChart />
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
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default RBACManagement;
