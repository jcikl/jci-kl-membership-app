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
  Tooltip
} from 'antd';
import { 
  EditOutlined, 
  SaveOutlined, 
  ReloadOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import { 
  PERMISSION_MODULES, 
  PERMISSION_ACTIONS, 
  ROLE_DEFINITIONS,
  RolePermissionMatrix as RolePermissionMatrixType 
} from '@/types/rbac';
import { permissionMatrixService } from '@/modules/permission/services/rbacService';

const { Title, Text } = Typography;

const RolePermissionMatrix: React.FC = () => {
  const [matrix, setMatrix] = useState<RolePermissionMatrixType>({
    roles: [],
    modules: [],
    actions: [],
    matrix: {}
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [, setSelectedModule] = useState<string>('');

  // 初始化权限矩阵数据
  const initializeMatrix = async () => {
    setLoading(true);
    try {
      // 尝试从数据库加载权限矩阵
      const savedMatrix = await permissionMatrixService.getPermissionMatrix();
      
      if (savedMatrix.roles.length > 0) {
        setMatrix(savedMatrix);
      } else {
        // 如果没有保存的矩阵，使用默认配置
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
      }
    } catch (error) {
      console.error('加载权限矩阵失败:', error);
      message.error('加载权限矩阵失败');
    } finally {
      setLoading(false);
    }
  };

  // 根据图片中的权限矩阵获取默认权限
  const getDefaultPermission = (module: string, action: string, role: string): boolean => {
    // 开发者和管理员拥有所有权限
    if (role === 'DEVELOPER' || role === 'ADMINISTRATOR') {
      return true;
    }

    // 根据图片中的权限矩阵设置权限
    const permissionMap: Record<string, Record<string, string[]>> = {
      '会员管理': {
        'Create': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT'],
        'Read': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT', 'DEPARTMENT_HEAD', 'OFFICIAL_MEMBER', 'ASSOCIATE_MEMBER', 'HONORARY_MEMBER'],
        'Update': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT', 'DEPARTMENT_HEAD', 'OFFICIAL_MEMBER', 'ASSOCIATE_MEMBER', 'HONORARY_MEMBER'],
        'Delete': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT']
      },
      '活动管理': {
        'Create': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT', 'DEPARTMENT_HEAD'],
        'Read': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT', 'DEPARTMENT_HEAD', 'OFFICIAL_MEMBER', 'ASSOCIATE_MEMBER', 'HONORARY_MEMBER'],
        'Update': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT', 'DEPARTMENT_HEAD'],
        'Delete': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT', 'DEPARTMENT_HEAD']
      },
      '财务管理': {
        'Create': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT'],
        'Read': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT'],
        'Update': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT'],
        'Delete': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT']
      },
      '消息通知': {
        'Create': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT'],
        'Read': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT', 'DEPARTMENT_HEAD', 'OFFICIAL_MEMBER', 'ASSOCIATE_MEMBER', 'HONORARY_MEMBER'],
        'Update': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT'],
        'Delete': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT']
      },
      '个人资料': {
        'Create': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT'],
        'Read': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT', 'DEPARTMENT_HEAD', 'OFFICIAL_MEMBER', 'ASSOCIATE_MEMBER', 'HONORARY_MEMBER'],
        'Update': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT', 'DEPARTMENT_HEAD', 'OFFICIAL_MEMBER', 'ASSOCIATE_MEMBER', 'HONORARY_MEMBER'],
        'Delete': ['PRESIDENT', 'ACTING_PRESIDENT', 'SECRETARY_GENERAL', 'TREASURER', 'ADVISOR_PRESIDENT', 'VICE_PRESIDENT']
      }
    };

    return permissionMap[module]?.[action]?.includes(role) || false;
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
      await permissionMatrixService.savePermissionMatrix(matrix);
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

  // 渲染权限矩阵表格
  const renderMatrixTable = (module: string) => {
    const moduleData = matrix.matrix[module];
    if (!moduleData) return null;

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
      ...matrix.roles.map(role => ({
        title: ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS],
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
        scroll={{ x: 1200 }}
        size="small"
        bordered
      />
    );
  };

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              角色权限矩阵管理
            </Title>
            <Text type="secondary">
              管理各角色在不同模块中的权限设置
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

        <Tabs 
          defaultActiveKey={matrix.modules[0]} 
          onChange={setSelectedModule}
          items={matrix.modules.map(module => ({
            key: module,
            label: module,
            children: (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Text strong>模块：{module}</Text>
                    <Tooltip title="绿色表示有权限，灰色表示无权限">
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

      {/* 权限说明 */}
      <Card style={{ marginTop: 16 }}>
        <Title level={5}>权限说明</Title>
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>开发者：</Text>
            <Text>拥有系统最高权限，可以管理所有功能</Text>
          </Col>
          <Col span={8}>
            <Text strong>管理员：</Text>
            <Text>拥有系统管理权限，可以管理用户和角色</Text>
          </Col>
          <Col span={8}>
            <Text strong>其他角色：</Text>
            <Text>根据职位和会员类别分配相应权限</Text>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default RolePermissionMatrix;
