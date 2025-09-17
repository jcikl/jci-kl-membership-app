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
  Typography,
  Transfer,
  Divider
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { roleService, rbacService as permissionService, auditService } from '@/modules/permission/services/rbacService';
import { Role, Permission } from '@/types/rbac';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RBACRoles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleteVisible, setBatchDeleteVisible] = useState(false);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        roleService.getAllRoles(),
        permissionService.getAllPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 处理保存角色
  const handleSave = async (values: any) => {
    try {
      if (editingRole) {
        await roleService.updateRole(editingRole.id, values);
        message.success('角色更新成功');
      } else {
        await roleService.createRole(values);
        message.success('角色创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingRole(null);
      loadData();
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  // 处理删除角色
  const handleDelete = async (id: string) => {
    try {
      const role = roles.find(r => r.id === id);
      await roleService.deleteRole(id);
      
      // 记录审计日志
      await auditService.logAction(
        'system', // 这里应该从认证状态获取当前用户ID
        'DELETE_ROLE',
        'role',
        id,
        { deletedRole: role }
      );
      
      message.success('角色删除成功');
      loadData();
    } catch (error) {
      console.error('删除角色失败:', error);
      message.error('删除失败，请重试');
    }
  };

  // 批量删除角色
  const handleBatchDelete = async (ids: string[]) => {
    try {
      const deletedRoles = roles.filter(r => ids.includes(r.id));
      const deletePromises = ids.map(id => roleService.deleteRole(id));
      await Promise.all(deletePromises);
      
      // 记录审计日志
      await auditService.logAction(
        'system', // 这里应该从认证状态获取当前用户ID
        'BATCH_DELETE_ROLES',
        'role',
        ids.join(','),
        { deletedRoles: deletedRoles.map(r => ({ id: r.id, label: r.label })) }
      );
      
      message.success(`成功删除 ${ids.length} 个角色`);
      setSelectedRowKeys([]);
      setBatchDeleteVisible(false);
      loadData();
    } catch (error) {
      console.error('批量删除角色失败:', error);
      message.error('批量删除失败，请重试');
    }
  };

  // 确认批量删除
  const confirmBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的角色');
      return;
    }
    setBatchDeleteVisible(true);
  };

  // 打开编辑模态框
  const openEditModal = (role: Role) => {
    setEditingRole(role);
    form.setFieldsValue(role);
    setModalVisible(true);
  };

  // 打开创建模态框
  const openCreateModal = () => {
    setEditingRole(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingRole(null);
  };

  // 过滤角色
  const filteredRoles = roles.filter(role =>
    role.label.toLowerCase().includes(searchText.toLowerCase()) ||
    role.id.toLowerCase().includes(searchText.toLowerCase())
  );

  // 权限选项
  const permissionOptions = permissions.map(permission => ({
    key: permission.key,
    title: permission.label,
    description: permission.description
  }));

  const columns = [
    {
      title: '角色ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string) => <code>{text}</code>
    },
    {
      title: '角色名称',
      dataIndex: 'label',
      key: 'label',
      width: 150
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: '继承角色',
      dataIndex: 'inherits',
      key: 'inherits',
      width: 200,
      render: (inherits: string[]) => (
        <Space wrap>
          {inherits.map(roleId => (
            <Tag key={roleId} color="blue">{roleId}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '允许权限',
      dataIndex: 'allow',
      key: 'allow',
      width: 200,
      render: (allow: string[]) => (
        <Space wrap>
          {allow.slice(0, 3).map(permission => (
            <Tag key={permission} color="green">{permission}</Tag>
          ))}
          {allow.length > 3 && <Tag color="default">+{allow.length - 3}</Tag>}
        </Space>
      )
    },
    {
      title: '拒绝权限',
      dataIndex: 'deny',
      key: 'deny',
      width: 200,
      render: (deny: string[]) => (
        <Space wrap>
          {deny.slice(0, 3).map(permission => (
            <Tag key={permission} color="red">{permission}</Tag>
          ))}
          {deny.length > 3 && <Tag color="default">+{deny.length - 3}</Tag>}
        </Space>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Role) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个角色吗？"
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
              角色管理
            </Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="搜索角色..."
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
                新增角色
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredRoles}
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
        title={editingRole ? '编辑角色' : '新增角色'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="id"
                label="角色ID"
                rules={[{ required: true, message: '请输入角色ID' }]}
              >
                <Input placeholder="例如: president" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="label"
                label="角色名称"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="例如: 会长" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <TextArea rows={3} placeholder="角色详细描述" />
          </Form.Item>

          <Form.Item
            name="inherits"
            label="继承角色"
          >
            <Select
              mode="multiple"
              placeholder="选择要继承的角色"
              allowClear
            >
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.label} ({role.id})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>权限配置</Divider>

          <Form.Item
            name="allow"
            label="允许权限"
            rules={[{ required: true, message: '请选择允许的权限' }]}
          >
            <Transfer
              dataSource={permissionOptions}
              titles={['可选权限', '已选权限']}
              targetKeys={form.getFieldValue('allow') || []}
              onChange={(targetKeys) => {
                form.setFieldsValue({ allow: targetKeys });
              }}
              render={item => item.title}
              listStyle={{
                width: 300,
                height: 300,
              }}
            />
          </Form.Item>

          <Form.Item
            name="deny"
            label="拒绝权限"
          >
            <Transfer
              dataSource={permissionOptions}
              titles={['可选权限', '已选权限']}
              targetKeys={form.getFieldValue('deny') || []}
              onChange={(targetKeys) => {
                form.setFieldsValue({ deny: targetKeys });
              }}
              render={item => item.title}
              listStyle={{
                width: 300,
                height: 300,
              }}
            />
          </Form.Item>

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
        <p>确定要删除选中的 {selectedRowKeys.length} 个角色吗？</p>
        <p style={{ color: '#ff4d4f', fontSize: '14px' }}>
          此操作不可撤销，请谨慎操作！
        </p>
      </Modal>
    </div>
  );
};

export default RBACRoles;
