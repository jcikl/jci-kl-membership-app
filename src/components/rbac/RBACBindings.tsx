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
  DatePicker,
  Divider,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons';
import { bindingService, roleService } from '@/services/rbacService';
import { RoleBinding, Role } from '@/types/rbac';

const { Title } = Typography;
const { Option } = Select;

const RBACBindings: React.FC = () => {
  const [bindings] = useState<RoleBinding[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBinding, setEditingBinding] = useState<RoleBinding | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const rolesData = await roleService.getAllRoles();
      setRoles(rolesData);
      
      // 这里需要实现获取所有绑定的方法
      // const bindingsData = await bindingService.getAllBindings();
      // setBindings(bindingsData);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 处理保存绑定
  const handleSave = async (values: any) => {
    try {
      if (editingBinding) {
        await bindingService.updateBinding(editingBinding.id, values);
        message.success('角色绑定更新成功');
      } else {
        await bindingService.createBinding(values);
        message.success('角色绑定创建成功');
      }
      setModalVisible(false);
      form.resetFields();
      setEditingBinding(null);
      loadData();
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  // 处理删除绑定
  const handleDelete = async (id: string) => {
    try {
      await bindingService.deleteBinding(id);
      message.success('角色绑定删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败，请重试');
    }
  };

  // 打开编辑模态框
  const openEditModal = (binding: RoleBinding) => {
    setEditingBinding(binding);
    form.setFieldsValue({
      userId: binding.userId,
      roles: binding.roles.map(role => ({
        roleId: role.roleId,
        scopes: role.scopes,
        expiresAt: role.expiresAt ? new Date(role.expiresAt) : null,
        delegationRef: role.delegationRef
      }))
    });
    setModalVisible(true);
  };

  // 打开创建模态框
  const openCreateModal = () => {
    setEditingBinding(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingBinding(null);
  };

  // 过滤绑定
  const filteredBindings = bindings.filter(binding =>
    binding.userId.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: '用户ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 150,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <code>{text}</code>
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: any[]) => (
        <Space wrap>
          {roles.map((role, index) => (
            <Tag key={index} color="blue">
              {role.roleId}
              {role.scopes && Object.keys(role.scopes).length > 0 && (
                <span style={{ fontSize: '12px' }}>
                  ({Object.entries(role.scopes).map(([k, v]) => `${k}:${v}`).join(', ')})
                </span>
              )}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: '过期时间',
      dataIndex: 'roles',
      key: 'expiresAt',
      width: 150,
      render: (roles: any[]) => {
        const hasExpired = roles.some(role => 
          role.expiresAt && new Date(role.expiresAt) < new Date()
        );
        const nearestExpiry = roles
          .filter(role => role.expiresAt)
          .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())[0];
        
        return nearestExpiry ? (
          <Tag color={hasExpired ? 'red' : 'orange'}>
            {new Date(nearestExpiry.expiresAt).toLocaleDateString()}
          </Tag>
        ) : '-';
      }
    },
    {
      title: '委任引用',
      dataIndex: 'roles',
      key: 'delegationRef',
      width: 150,
      render: (roles: any[]) => {
        const delegationRef = roles.find(role => role.delegationRef)?.delegationRef;
        return delegationRef ? <code>{delegationRef}</code> : '-';
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (text: string) => new Date(text).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: RoleBinding) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个角色绑定吗？"
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
              用户角色绑定
            </Title>
          </Col>
          <Col>
            <Space>
              <Input
                placeholder="搜索用户..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
              >
                新增绑定
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredBindings}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title={editingBinding ? '编辑角色绑定' : '新增角色绑定'}
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
          <Form.Item
            name="userId"
            label="用户ID"
            rules={[{ required: true, message: '请输入用户ID' }]}
          >
            <Input placeholder="输入用户ID" />
          </Form.Item>

          <Divider>角色配置</Divider>

          <Form.List name="roles">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" style={{ marginBottom: 16 }}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'roleId']}
                          label="角色"
                          rules={[{ required: true, message: '请选择角色' }]}
                        >
                          <Select placeholder="选择角色">
                            {roles.map(role => (
                              <Option key={role.id} value={role.id}>
                                {role.label} ({role.id})
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'expiresAt']}
                          label="过期时间"
                        >
                          <DatePicker 
                            style={{ width: '100%' }}
                            placeholder="选择过期时间"
                            showTime
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'delegationRef']}
                          label="委任引用"
                        >
                          <Input placeholder="委任文档引用" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row>
                      <Col span={24}>
                        <Form.Item
                          {...restField}
                          name={[name, 'scopes']}
                          label="范围配置"
                        >
                          <Input.TextArea 
                            rows={2}
                            placeholder="JSON格式的范围配置，例如: {&quot;division&quot;: &quot;business_dev&quot;, &quot;department&quot;: &quot;marketing&quot;}"
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Button 
                      type="link" 
                      danger 
                      onClick={() => remove(name)}
                      style={{ float: 'right' }}
                    >
                      删除角色
                    </Button>
                  </Card>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加角色
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

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
    </div>
  );
};

export default RBACBindings;
