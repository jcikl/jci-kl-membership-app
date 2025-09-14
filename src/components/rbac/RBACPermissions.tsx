import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  Card,
  Row,
  Col,
  Typography
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { permissionService, auditService } from '@/services/rbacService';
import { Permission, PERMISSION_MODULES, PERMISSION_ACTIONS, PERMISSION_SCOPES } from '@/types/rbac';

const { Title } = Typography;
const { Option } = Select;

const RBACPermissions: React.FC = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleteVisible, setBatchDeleteVisible] = useState(false);

  // 加载权限列表
  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await permissionService.getAllPermissions();
      setPermissions(data);
    } catch (error) {
      message.error('加载权限列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  // 处理保存权限
  const handleSave = async (values: any) => {
    try {
      if (editingPermission) {
        await permissionService.updatePermission(editingPermission.id, values);
        message.success('权限更新成功');
      } else {
        await permissionService.createPermission(values);
        message.success('权限创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingPermission(null);
      loadPermissions();
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  // 处理删除权限
  const handleDelete = async (id: string) => {
    try {
      const permission = permissions.find(p => p.id === id);
      await permissionService.deletePermission(id);
      
      // 记录审计日志
      await auditService.logAction(
        'system', // 这里应该从认证状态获取当前用户ID
        'DELETE_PERMISSION',
        'permission',
        id,
        { deletedPermission: permission }
      );
      
      message.success('权限删除成功');
      loadPermissions();
    } catch (error) {
      console.error('删除权限失败:', error);
      message.error('删除失败，请重试');
    }
  };

  // 批量删除权限
  const handleBatchDelete = async (ids: string[]) => {
    try {
      const deletedPermissions = permissions.filter(p => ids.includes(p.id));
      const deletePromises = ids.map(id => permissionService.deletePermission(id));
      await Promise.all(deletePromises);
      
      // 记录审计日志
      await auditService.logAction(
        'system', // 这里应该从认证状态获取当前用户ID
        'BATCH_DELETE_PERMISSIONS',
        'permission',
        ids.join(','),
        { deletedPermissions: deletedPermissions.map(p => ({ id: p.id, key: p.key, label: p.label })) }
      );
      
      message.success(`成功删除 ${ids.length} 个权限`);
      setSelectedRowKeys([]);
      setBatchDeleteVisible(false);
      loadPermissions();
    } catch (error) {
      console.error('批量删除权限失败:', error);
      message.error('批量删除失败，请重试');
    }
  };

  // 确认批量删除
  const confirmBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的权限');
      return;
    }
    setBatchDeleteVisible(true);
  };

  // 打开编辑模态框
  const openEditModal = (permission: Permission) => {
    setEditingPermission(permission);
    form.setFieldsValue(permission);
    setModalVisible(true);
  };

  // 打开创建模态框
  const openCreateModal = () => {
    setEditingPermission(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingPermission(null);
  };

  // 过滤权限
  const filteredPermissions = permissions.filter(permission =>
    permission.label.toLowerCase().includes(searchText.toLowerCase()) ||
    permission.key.toLowerCase().includes(searchText.toLowerCase()) ||
    permission.module.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: '权限键',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (text: string) => <code>{text}</code>
    },
    {
      title: '权限名称',
      dataIndex: 'label',
      key: 'label',
      width: 150
    },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 100,
      render: (module: string) => (
        <Tag color="blue">{module}</Tag>
      )
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (action: string) => (
        <Tag color="green">{action}</Tag>
      )
    },
    {
      title: '范围',
      dataIndex: 'scope',
      key: 'scope',
      width: 100,
      render: (scope: string) => scope ? <Tag color="orange">{scope}</Tag> : '-'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Permission) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个权限吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              权限管理
            </Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="搜索权限..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={confirmBatchDelete}
                disabled={selectedRowKeys.length === 0}
              >
                批量删除 ({selectedRowKeys.length})
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
              >
                新增权限
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredPermissions}
          rowKey="id"
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              name: record.id,
            }),
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title={editingPermission ? '编辑权限' : '新增权限'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            name="key"
            label="权限键"
            rules={[{ required: true, message: '请输入权限键' }]}
          >
            <Input placeholder="例如: system.manage" />
          </Form.Item>

          <Form.Item
            name="label"
            label="权限名称"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="例如: 系统管理" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入权限描述' }]}
          >
            <Input.TextArea rows={3} placeholder="权限详细描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="module"
                label="模块"
                rules={[{ required: true, message: '请选择模块' }]}
              >
                <Select placeholder="选择模块">
                  {Object.entries(PERMISSION_MODULES).map(([key, value]) => (
                    <Option key={value} value={value}>
                      {key}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="action"
                label="动作"
                rules={[{ required: true, message: '请选择动作' }]}
              >
                <Select placeholder="选择动作">
                  {Object.entries(PERMISSION_ACTIONS).map(([key, value]) => (
                    <Option key={value} value={value}>
                      {key}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="scope"
                label="范围"
              >
                <Select placeholder="选择范围" allowClear>
                  {Object.entries(PERMISSION_SCOPES).map(([key, value]) => (
                    <Option key={value} value={value}>
                      {key}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeModal}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量删除确认对话框 */}
      <Modal
        title="确认批量删除"
        open={batchDeleteVisible}
        onOk={() => handleBatchDelete(selectedRowKeys as string[])}
        onCancel={() => setBatchDeleteVisible(false)}
        okText="确定删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除选中的 {selectedRowKeys.length} 个权限吗？</p>
        <p style={{ color: '#ff4d4f', fontSize: '14px' }}>
          此操作不可撤销，请谨慎操作！
        </p>
      </Modal>
    </div>
  );
};

export default RBACPermissions;
