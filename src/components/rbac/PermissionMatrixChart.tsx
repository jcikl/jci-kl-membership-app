import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Space,
  Tooltip,
  Badge,
  Statistic,
  Progress
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  CrownOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { ROLE_DEFINITIONS, PERMISSION_MODULES, PERMISSION_ACTIONS } from '@/types/rbac';

const { Text } = Typography;

interface PermissionMatrixChartProps {
  matrix?: Record<string, Record<string, Record<string, boolean>>>;
}

const PermissionMatrixChart: React.FC<PermissionMatrixChartProps> = ({ matrix }) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [roleStats, setRoleStats] = useState<Record<string, any>>({});

  useEffect(() => {
    if (matrix) {
      generateChartData();
    }
  }, [matrix]);

  const generateChartData = () => {
    if (!matrix) return;

    const roles = Object.keys(ROLE_DEFINITIONS);
    const modules = Object.values(PERMISSION_MODULES);
    const actions = Object.values(PERMISSION_ACTIONS);

    // 生成表格数据
    const data: any[] = [];
    const stats: Record<string, any> = {};

    roles.forEach(role => {
      stats[role] = {
        total: 0,
        granted: 0,
        modules: {}
      };

      modules.forEach(module => {
        stats[role].modules[module] = {
          total: 0,
          granted: 0
        };

        actions.forEach(action => {
          const hasPermission = matrix[module]?.[action]?.[role] || false;
          stats[role].total++;
          stats[role].modules[module].total++;
          
          if (hasPermission) {
            stats[role].granted++;
            stats[role].modules[module].granted++;
          }

          data.push({
            key: `${role}-${module}-${action}`,
            role,
            module,
            action,
            hasPermission,
            roleType: getRoleType(role)
          });
        });
      });
    });

    setChartData(data);
    setRoleStats(stats);
  };

  const getRoleType = (role: string): 'category' | 'position' => {
    const categoryRoles = ['DEVELOPER', 'ADMINISTRATOR', 'OFFICIAL_MEMBER', 'ASSOCIATE_MEMBER', 'HONORARY_MEMBER', 'AFFILIATE_MEMBER', 'VISITOR_MEMBER'];
    return categoryRoles.includes(role) ? 'category' : 'position';
  };

  const getPermissionColor = (hasPermission: boolean) => {
    return hasPermission ? '#52c41a' : '#ff4d4f';
  };

  const getRoleIcon = (role: string) => {
    if (role === 'DEVELOPER') return <CrownOutlined style={{ color: '#fa8c16' }} />;
    if (role === 'ADMINISTRATOR') return <UserOutlined style={{ color: '#1890ff' }} />;
    if (getRoleType(role) === 'position') return <TeamOutlined style={{ color: '#722ed1' }} />;
    return <UserOutlined style={{ color: '#52c41a' }} />;
  };

  const columns = [
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      fixed: 'left' as const,
      render: (role: string, record: any) => (
        <Space>
          {getRoleIcon(role)}
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.roleType === 'category' ? '户口类别' : '岗位'}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (module: string) => (
        <Tag color="blue">{module}</Tag>
      )
    },
    {
      title: '功能',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => (
        <Tag color="cyan">{action}</Tag>
      )
    },
    {
      title: '权限状态',
      dataIndex: 'hasPermission',
      key: 'hasPermission',
      width: 120,
      align: 'center' as const,
      render: (hasPermission: boolean) => (
        <Space>
          {hasPermission ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
          ) : (
            <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '16px' }} />
          )}
          <Text style={{ color: getPermissionColor(hasPermission) }}>
            {hasPermission ? '有权限' : '无权限'}
          </Text>
        </Space>
      )
    }
  ];

  const roleColumns = [
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: string) => (
        <Space>
          {getRoleIcon(role)}
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {getRoleType(role) === 'category' ? '户口类别' : '岗位'}
            </div>
          </div>
        </Space>
      )
    },
    {
      title: '权限统计',
      dataIndex: 'stats',
      key: 'stats',
      render: (stats: any) => (
        <div>
          <Progress
            percent={Math.round((stats.granted / stats.total) * 100)}
            size="small"
            strokeColor={{
              '0%': '#ff4d4f',
              '50%': '#faad14',
              '100%': '#52c41a'
            }}
          />
          <div style={{ marginTop: 4, fontSize: '12px' }}>
            {stats.granted} / {stats.total} 权限
          </div>
        </div>
      )
    },
    {
      title: '模块权限详情',
      dataIndex: 'modules',
      key: 'modules',
      render: (modules: any) => (
        <Space wrap>
          {Object.entries(modules).map(([module, stats]: [string, any]) => (
            <Tooltip
              key={module}
              title={`${module}: ${stats.granted}/${stats.total} 权限`}
            >
              <Badge
                count={stats.granted}
                showZero
                color={stats.granted === stats.total ? '#52c41a' : '#faad14'}
              >
                <Tag color="blue" style={{ margin: 2 }}>
                  {module}
                </Tag>
              </Badge>
            </Tooltip>
          ))}
        </Space>
      )
    }
  ];

  const roleData = Object.entries(roleStats).map(([role, stats]) => ({
    key: role,
    role,
    stats,
    modules: stats.modules
  }));

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="总角色数"
              value={Object.keys(ROLE_DEFINITIONS).length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="户口类别"
              value={Object.keys(ROLE_DEFINITIONS).filter(role => getRoleType(role) === 'category').length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="岗位角色"
              value={Object.keys(ROLE_DEFINITIONS).filter(role => getRoleType(role) === 'position').length}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="角色权限概览" style={{ marginBottom: 16 }}>
        <Table
          columns={roleColumns}
          dataSource={roleData}
          pagination={false}
          size="small"
          bordered
        />
      </Card>

      <Card title="详细权限矩阵">
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Text strong>权限矩阵详情</Text>
            <Tooltip title="显示所有角色在不同模块中的权限分配情况">
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          </Space>
        </div>
        
        <Table
          columns={columns}
          dataSource={chartData}
          pagination={{ pageSize: 50 }}
          scroll={{ x: 800, y: 400 }}
          size="small"
          bordered
          rowClassName={(record) => 
            record.hasPermission ? 'permission-granted' : 'permission-denied'
          }
        />
      </Card>

      <style>{`
        .permission-granted {
          background-color: #f6ffed;
        }
        .permission-denied {
          background-color: #fff2f0;
        }
        .even-row {
          background-color: #fafafa;
        }
        .odd-row {
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default PermissionMatrixChart;
