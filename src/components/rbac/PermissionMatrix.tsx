import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  message,
  Card,
  Row,
  Col,
  Typography,
  Switch,
  Tabs,
  Tag,
  Tooltip,
  Badge
} from 'antd';
import { 
  EditOutlined, 
  SaveOutlined, 
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { 
  PERMISSION_MODULES, 
  PERMISSION_ACTIONS, 
  ROLE_DEFINITIONS
} from '@/types/rbac';

const { Title, Text } = Typography;

// 权限矩阵数据接口
interface PermissionMatrixData {
  roles: string[];
  modules: string[];
  actions: string[];
  matrix: Record<string, Record<string, Record<string, boolean>>>;
}

const PermissionMatrix: React.FC = () => {
  const [matrix, setMatrix] = useState<PermissionMatrixData>({
    roles: [],
    modules: [],
    actions: [],
    matrix: {}
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // 初始化权限矩阵数据
  const initializeMatrix = () => {
    const roles = Object.keys(ROLE_DEFINITIONS);
    const modules = Object.values(PERMISSION_MODULES);
    const actions = Object.values(PERMISSION_ACTIONS);
    
    const matrixData: Record<string, Record<string, Record<string, boolean>>> = {};
    
    modules.forEach(module => {
      matrixData[module] = {};
      actions.forEach(action => {
        matrixData[module][action] = {};
        roles.forEach(role => {
          matrixData[module][action][role] = getDefaultPermission(module, action, role);
        });
      });
    });

    setMatrix({
      roles,
      modules,
      actions,
      matrix: matrixData
    });
  };

  // 根据角色和模块获取默认权限
  const getDefaultPermission = (module: string, action: string, role: string): boolean => {
    // 开发者拥有所有权限
    if (role === 'DEVELOPER') {
      return true;
    }

    // 管理员拥有大部分权限，除了某些敏感操作
    if (role === 'ADMINISTRATOR') {
      return true;
    }

    // 会长拥有所有业务权限
    if (role === 'PRESIDENT') {
      return true;
    }

    // 署理会长继承会长权限
    if (role === 'ACTING_PRESIDENT') {
      return true;
    }

    // 秘书长权限
    if (role === 'SECRETARY_GENERAL') {
      const secretaryPermissions: Record<string, string[]> = {
        '会员管理': ['Create', 'Read', 'Update', 'Delete'],
        '活动管理': ['Create', 'Read', 'Update', 'Delete'],
        '财务管理': ['Read'], // 秘书长只能查看财务
        '消息通知': ['Create', 'Read', 'Update', 'Delete'],
        '个人资料': ['Create', 'Read', 'Update', 'Delete']
      };
      return secretaryPermissions[module]?.includes(action) || false;
    }

    // 财务长权限
    if (role === 'TREASURER') {
      const treasurerPermissions: Record<string, string[]> = {
        '会员管理': ['Read', 'Update'],
        '活动管理': ['Read'],
        '财务管理': ['Create', 'Read', 'Update', 'Delete'],
        '消息通知': ['Read'],
        '个人资料': ['Read', 'Update']
      };
      return treasurerPermissions[module]?.includes(action) || false;
    }

    // 辅导会长权限（只读为主）
    if (role === 'ADVISOR_PRESIDENT') {
      const advisorPermissions: Record<string, string[]> = {
        '会员管理': ['Read'],
        '活动管理': ['Read'],
        '财务管理': ['Read'],
        '消息通知': ['Read'],
        '个人资料': ['Read']
      };
      return advisorPermissions[module]?.includes(action) || false;
    }

    // 副会长权限
    if (role === 'VICE_PRESIDENT') {
      const vpPermissions: Record<string, string[]> = {
        '会员管理': ['Create', 'Read', 'Update'],
        '活动管理': ['Create', 'Read', 'Update', 'Delete'],
        '财务管理': ['Read'],
        '消息通知': ['Create', 'Read', 'Update'],
        '个人资料': ['Create', 'Read', 'Update']
      };
      return vpPermissions[module]?.includes(action) || false;
    }

    // 部门主任权限
    if (role === 'DEPARTMENT_HEAD') {
      const deptHeadPermissions: Record<string, string[]> = {
        '会员管理': ['Read', 'Update'],
        '活动管理': ['Create', 'Read', 'Update', 'Delete'],
        '财务管理': ['Read'],
        '消息通知': ['Read', 'Update'],
        '个人资料': ['Read', 'Update']
      };
      return deptHeadPermissions[module]?.includes(action) || false;
    }

    // 正式会员权限
    if (role === 'OFFICIAL_MEMBER') {
      const officialMemberPermissions: Record<string, string[]> = {
        '会员管理': ['Read'],
        '活动管理': ['Read'],
        '财务管理': [],
        '消息通知': ['Read'],
        '个人资料': ['Read', 'Update']
      };
      return officialMemberPermissions[module]?.includes(action) || false;
    }

    // 准会员权限
    if (role === 'ASSOCIATE_MEMBER') {
      const associateMemberPermissions: Record<string, string[]> = {
        '会员管理': ['Read'],
        '活动管理': ['Read'],
        '财务管理': [],
        '消息通知': ['Read'],
        '个人资料': ['Read', 'Update']
      };
      return associateMemberPermissions[module]?.includes(action) || false;
    }

    // 荣誉会员权限
    if (role === 'HONORARY_MEMBER') {
      const honoraryMemberPermissions: Record<string, string[]> = {
        '会员管理': ['Read'],
        '活动管理': ['Read'],
        '财务管理': [],
        '消息通知': ['Read'],
        '个人资料': ['Read', 'Update']
      };
      return honoraryMemberPermissions[module]?.includes(action) || false;
    }

    // 联合会员权限
    if (role === 'AFFILIATE_MEMBER') {
      const affiliateMemberPermissions: Record<string, string[]> = {
        '会员管理': ['Read'],
        '活动管理': ['Read'],
        '财务管理': [],
        '消息通知': ['Read'],
        '个人资料': ['Read', 'Update']
      };
      return affiliateMemberPermissions[module]?.includes(action) || false;
    }

    // 拜访会员权限
    if (role === 'VISITOR_MEMBER') {
      const visitorMemberPermissions: Record<string, string[]> = {
        '会员管理': ['Read'],
        '活动管理': ['Read'],
        '财务管理': [],
        '消息通知': ['Read'],
        '个人资料': ['Read']
      };
      return visitorMemberPermissions[module]?.includes(action) || false;
    }

    return false;
  };

  useEffect(() => {
    initializeMatrix();
  }, []);

  // 切换权限
  const togglePermission = (module: string, action: string, role: string, hasPermission: boolean) => {
    setMatrix(prev => ({
      ...prev,
      matrix: {
        ...prev.matrix,
        [module]: {
          ...prev.matrix[module],
          [action]: {
            ...prev.matrix[module][action],
            [role]: hasPermission
          }
        }
      }
    }));
  };

  // 保存权限矩阵
  const handleSave = async () => {
    setLoading(true);
    try {
      // 这里可以调用API保存到数据库
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      message.success('权限矩阵保存成功');
      setEditing(false);
    } catch (error) {
      console.error('保存权限矩阵失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置权限矩阵
  const handleReset = () => {
    initializeMatrix();
    setEditing(false);
    message.info('权限矩阵已重置');
  };

  // 获取角色类型（户口类别 vs 岗位）
  const getRoleType = (role: string): 'category' | 'position' => {
    const categoryRoles = ['DEVELOPER', 'ADMINISTRATOR', 'OFFICIAL_MEMBER', 'ASSOCIATE_MEMBER', 'HONORARY_MEMBER', 'AFFILIATE_MEMBER', 'VISITOR_MEMBER'];
    return categoryRoles.includes(role) ? 'category' : 'position';
  };

  // 渲染权限矩阵表格
  const renderMatrixTable = (module: string) => {
    const moduleData = matrix.matrix[module];
    if (!moduleData) return null;

    // 按角色类型分组
    const categoryRoles = matrix.roles.filter(role => getRoleType(role) === 'category');
    const positionRoles = matrix.roles.filter(role => getRoleType(role) === 'position');

    // 如果是会员管理模块，分别显示用户类别和用户岗位
    if (module === '会员管理') {
      return (
        <div>
          {/* 用户类别权限表格 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5} style={{ marginBottom: 16, color: '#1890ff' }}>
              <UserOutlined style={{ marginRight: 8 }} />
              用户户口类别权限
            </Title>
            <Table
              columns={[
                {
                  title: '功能',
                  dataIndex: 'action',
                  key: 'action',
                  width: 100,
                  fixed: 'left' as const,
                  render: (action: string) => (
                    <Tag color="blue">{action}</Tag>
                  )
                },
                ...categoryRoles.map(role => ({
                  title: (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>{ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]}</div>
                    </div>
                  ),
                  dataIndex: role,
                  key: role,
                  width: 120,
                  align: 'center' as const,
                  render: (hasPermission: boolean, record: any) => (
                    <Switch
                      checked={hasPermission}
                      onChange={(checked) => togglePermission(module, record.action, role, checked)}
                      disabled={!editing}
                      size="small"
                      checkedChildren={<CheckCircleOutlined />}
                      unCheckedChildren={<CloseCircleOutlined />}
                    />
                  )
                }))
              ]}
              dataSource={matrix.actions.map(action => ({
                key: action,
                action,
                ...categoryRoles.reduce((acc, role) => {
                  acc[role] = moduleData[action]?.[role] || false;
                  return acc;
                }, {} as Record<string, boolean>)
              }))}
              pagination={false}
              scroll={{ x: 1000 }}
              size="small"
              bordered
              rowClassName={(_, index) => index % 2 === 0 ? 'even-row' : 'odd-row'}
            />
          </Card>

          {/* 用户岗位权限表格 */}
          <Card size="small">
            <Title level={5} style={{ marginBottom: 16, color: '#722ed1' }}>
              <TeamOutlined style={{ marginRight: 8 }} />
              用户岗位权限
            </Title>
            <Table
              columns={[
                {
                  title: '功能',
                  dataIndex: 'action',
                  key: 'action',
                  width: 100,
                  fixed: 'left' as const,
                  render: (action: string) => (
                    <Tag color="blue">{action}</Tag>
                  )
                },
                ...positionRoles.map(role => ({
                  title: (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 'bold' }}>{ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]}</div>
                    </div>
                  ),
                  dataIndex: role,
                  key: role,
                  width: 120,
                  align: 'center' as const,
                  render: (hasPermission: boolean, record: any) => (
                    <Switch
                      checked={hasPermission}
                      onChange={(checked) => togglePermission(module, record.action, role, checked)}
                      disabled={!editing}
                      size="small"
                      checkedChildren={<CheckCircleOutlined />}
                      unCheckedChildren={<CloseCircleOutlined />}
                    />
                  )
                }))
              ]}
              dataSource={matrix.actions.map(action => ({
                key: action,
                action,
                ...positionRoles.reduce((acc, role) => {
                  acc[role] = moduleData[action]?.[role] || false;
                  return acc;
                }, {} as Record<string, boolean>)
              }))}
              pagination={false}
              scroll={{ x: 1000 }}
              size="small"
              bordered
              rowClassName={(_, index) => index % 2 === 0 ? 'even-row' : 'odd-row'}
            />
          </Card>
        </div>
      );
    }

    // 其他模块保持原有显示方式
    const columns = [
      {
        title: '功能',
        dataIndex: 'action',
        key: 'action',
        width: 100,
        fixed: 'left' as const,
        render: (action: string) => (
          <Tag color="blue">{action}</Tag>
        )
      },
      // 户口类别权限列
      ...categoryRoles.map(role => ({
        title: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>户口类别</div>
            <div style={{ fontWeight: 'bold' }}>{ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]}</div>
          </div>
        ),
        dataIndex: role,
        key: role,
        width: 120,
        align: 'center' as const,
        render: (hasPermission: boolean, record: any) => (
          <Switch
            checked={hasPermission}
            onChange={(checked) => togglePermission(module, record.action, role, checked)}
            disabled={!editing}
            size="small"
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<CloseCircleOutlined />}
          />
        )
      })),
      // 岗位权限列
      ...positionRoles.map(role => ({
        title: (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: '#666' }}>岗位</div>
            <div style={{ fontWeight: 'bold' }}>{ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]}</div>
          </div>
        ),
        dataIndex: role,
        key: role,
        width: 120,
        align: 'center' as const,
        render: (hasPermission: boolean, record: any) => (
          <Switch
            checked={hasPermission}
            onChange={(checked) => togglePermission(module, record.action, role, checked)}
            disabled={!editing}
            size="small"
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<CloseCircleOutlined />}
          />
        )
      }))
    ];

    const dataSource = matrix.actions.map(action => ({
      key: action,
      action,
      ...moduleData[action]
    }));

    return (
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{ x: 2000 }}
        size="small"
        bordered
        rowClassName={(_, index) => index % 2 === 0 ? 'even-row' : 'odd-row'}
      />
    );
  };

  // 统计权限信息
  const getPermissionStats = () => {
    const stats = {
      totalPermissions: 0,
      grantedPermissions: 0,
      byRole: {} as Record<string, { total: number; granted: number }>
    };

    matrix.roles.forEach(role => {
      stats.byRole[role] = { total: 0, granted: 0 };
    });

    matrix.modules.forEach(module => {
      matrix.actions.forEach(action => {
        matrix.roles.forEach(role => {
          stats.totalPermissions++;
          stats.byRole[role].total++;
          if (matrix.matrix[module]?.[action]?.[role]) {
            stats.grantedPermissions++;
            stats.byRole[role].granted++;
          }
        });
      });
    });

    return stats;
  };

  const stats = getPermissionStats();

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              JCI KL 权限矩阵管理
            </Title>
            <Text type="secondary">
              管理用户户口类别和岗位权限设置
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                disabled={loading}
              >
                重置
              </Button>
              {editing ? (
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={loading}
                >
                  保存
                </Button>
              ) : (
                <Button
                  icon={<EditOutlined />}
                  onClick={() => setEditing(true)}
                >
                  编辑
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        {/* 权限统计 */}
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f8f9fa' }}>
          <Row gutter={16}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {stats.grantedPermissions}
                </div>
                <div style={{ color: '#666' }}>已授权权限</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.totalPermissions - stats.grantedPermissions}
                </div>
                <div style={{ color: '#666' }}>未授权权限</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {matrix.roles.length}
                </div>
                <div style={{ color: '#666' }}>角色总数</div>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                  {matrix.modules.length}
                </div>
                <div style={{ color: '#666' }}>功能模块</div>
              </div>
            </Col>
          </Row>
        </Card>

        <Tabs 
          defaultActiveKey={matrix.modules[0]}
          items={matrix.modules.map(module => ({
            key: module,
            label: module,
            children: (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Text strong>模块：{module}</Text>
                    <Tooltip title="绿色表示有权限，红色表示无权限">
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </Space>
                </div>
                {renderMatrixTable(module)}
              </div>
            )
          }))}
        />
      </Card>

      {/* 角色权限说明 */}
      <Card style={{ marginTop: 16 }}>
        <Title level={5}>角色权限说明</Title>
        <Row gutter={24}>
          <Col span={12}>
            <Title level={5}>用户户口类别权限</Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div><Badge status="success" text="开发者：拥有系统最高权限" /></div>
              <div><Badge status="success" text="管理员：拥有系统管理权限" /></div>
              <div><Badge status="processing" text="正式会员：基础会员权限" /></div>
              <div><Badge status="processing" text="准会员：有限会员权限" /></div>
              <div><Badge status="processing" text="荣誉会员：荣誉会员权限" /></div>
              <div><Badge status="processing" text="联合会员：联合会员权限" /></div>
              <div><Badge status="default" text="拜访会员：访客权限" /></div>
            </Space>
          </Col>
          <Col span={12}>
            <Title level={5}>用户岗位权限</Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div><Badge status="success" text="会长：最高业务权限" /></div>
              <div><Badge status="success" text="署理会长：临时会长权限" /></div>
              <div><Badge status="warning" text="秘书长：行政事务权限" /></div>
              <div><Badge status="warning" text="财务长：财务管理权限" /></div>
              <div><Badge status="default" text="辅导会长：指导权限（只读）" /></div>
              <div><Badge status="processing" text="副会长：分管领域权限" /></div>
              <div><Badge status="processing" text="部门主任：部门管理权限" /></div>
            </Space>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default PermissionMatrix;
