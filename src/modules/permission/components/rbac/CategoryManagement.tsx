import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Input,
  Space,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Progress
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  UserOutlined
} from '@ant-design/icons';
import { categoryService, CategoryAssignmentOptions } from '@/services/categoryService';
import { getMembers } from '@/modules/member/services/memberService';
import { MemberCategory, MembershipCategory, AccountType } from '@/types/rbac';
import { MEMBERSHIP_CATEGORY_OPTIONS } from '@/types/rbac';
import { getAccountTypeFormOptions, getAccountTypeTagProps } from '@/utils/accountType';
import { Member } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useIsAdmin } from '@/hooks/usePermissions';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<MemberCategory[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MemberCategory | null>(null);
  const [form] = Form.useForm();
  const [searchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MembershipCategory | ''>('');
  const [stats, setStats] = useState<any>(null);
  const { member } = useAuthStore();
  const { isAdmin } = useIsAdmin();

  // 加载分类列表
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
      
      // 加载统计信息
      const categoryStats = await categoryService.getCategoryStats();
      const accountTypeStats = await categoryService.getAccountTypeStats();
      setStats({ categoryStats, accountTypeStats });
    } catch (error) {
      message.error('加载分类列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载会员列表
  const loadMembers = async () => {
    try {
      const response = await getMembers({ page: 1, limit: 1000 }); // 获取所有会员
      setMembers(response.data);
    } catch (error) {
      console.error('加载会员列表失败:', error);
    }
  };

  useEffect(() => {
    loadCategories();
    loadMembers();
  }, []);

  // 处理保存分类
  const handleSave = async (values: any) => {
    try {
      // 验证当前用户
      if (!member?.id) {
        message.error('请先登录');
        return;
      }

      // 验证必填字段
      if (!values.memberId || !values.membershipCategory || !values.accountType) {
        message.error('请填写所有必填字段');
        return;
      }

      const options: CategoryAssignmentOptions = {
        reason: values.reason,
        assignedBy: member.id
      };

      if (editingCategory) {
        // 更新现有分类
        await categoryService.updateCategory(editingCategory.id, {
          membershipCategory: values.membershipCategory,
          accountType: values.accountType,
          reason: values.reason,
          status: 'active'
        });
        message.success('分类更新成功');
      } else {
        // 分配新分类
        await categoryService.assignCategory(
          values.memberId, 
          values.membershipCategory, 
          values.accountType, 
          options
        );
        message.success('分类分配成功');
      }
      
      // 关闭模态框并重置表单
      setModalVisible(false);
      form.resetFields();
      setEditingCategory(null);
      
      // 重新加载分类列表
      await loadCategories();
    } catch (error: any) {
      console.error('保存分类失败:', error);
      
      // 根据错误类型显示不同的错误信息
      if (error.message.includes('权限')) {
        message.error('权限不足，无法执行此操作');
      } else {
        message.error(error.message || '保存失败，请重试');
      }
    }
  };

  // 处理删除分类
  const handleDelete = async (id: string) => {
    try {
      await categoryService.deleteCategory(id);
      message.success('分类删除成功');
      loadCategories();
    } catch (error) {
      console.error('删除分类失败:', error);
      message.error('删除失败，请重试');
    }
  };

  // 打开编辑模态框
  const openEditModal = (category: MemberCategory) => {
    if (!isAdmin) {
      message.error('您没有权限进行该操作');
      return;
    }
    setEditingCategory(category);
    form.setFieldsValue({
      memberId: category.memberId,
      membershipCategory: category.membershipCategory,
      accountType: category.accountType,
      reason: category.reason
    });
    setModalVisible(true);
  };

  // 打开创建模态框
  const openCreateModal = () => {
    if (!isAdmin) {
      message.error('您没有权限进行该操作');
      return;
    }
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    form.resetFields();
    setEditingCategory(null);
  };

  // 过滤分类
  const filteredCategories = categories.filter(category => {
    const matchesSearch = !searchText || 
      category.memberId.toLowerCase().includes(searchText.toLowerCase()) ||
      category.membershipCategory.toLowerCase().includes(searchText.toLowerCase()) ||
      category.accountType.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = !selectedCategory || category.membershipCategory === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      title: '会员ID',
      dataIndex: 'memberId',
      key: 'memberId',
      width: 120,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      )
    },
    {
      title: '会员类别',
      dataIndex: 'membershipCategory',
      key: 'membershipCategory',
      width: 120,
      render: (category: MembershipCategory) => {
        const option = MEMBERSHIP_CATEGORY_OPTIONS.find(opt => opt.value === category);
        return <Tag color="blue">{option?.label || category}</Tag>;
      }
    },
    {
      title: '账户类型',
      dataIndex: 'accountType',
      key: 'accountType',
      width: 120,
      render: (type: AccountType) => {
        const tagProps = getAccountTypeTagProps(type);
        return <Tag {...tagProps} />;
      }
    },
    {
      title: '分类原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string) => reason || '-'
    },
    {
      title: '分配人',
      dataIndex: 'assignedBy',
      key: 'assignedBy',
      width: 100
    },
    {
      title: '分配日期',
      dataIndex: 'assignedDate',
      key: 'assignedDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'active' ? 'green' : 'red';
        return <Tag color={color}>{status === 'active' ? '活跃' : '非活跃'}</Tag>;
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: MemberCategory) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个分类记录吗？"
            onConfirm={() => {
              if (!isAdmin) {
                message.error('您没有权限进行该操作');
                return;
              }
              handleDelete(record.id);
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} disabled={!isAdmin}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Card>
              <Title level={5}>会员类别分布</Title>
              {stats.categoryStats.map((stat: any) => (
                <div key={stat.category} style={{ marginBottom: 8 }}>
                  <Space>
                    <Text>{stat.category}</Text>
                    <Text type="secondary">({stat.count})</Text>
                    <Progress 
                      percent={stat.percentage} 
                      size="small" 
                      style={{ width: 100 }}
                    />
                  </Space>
                </div>
              ))}
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Title level={5}>账户类型分布</Title>
              {stats.accountTypeStats.map((stat: any) => (
                <div key={stat.type} style={{ marginBottom: 8 }}>
                  <Space>
                    <Text>{stat.type}</Text>
                    <Text type="secondary">({stat.count})</Text>
                    <Progress 
                      percent={stat.percentage} 
                      size="small" 
                      style={{ width: 100 }}
                    />
                  </Space>
                </div>
              ))}
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              分类管理
            </Title>
            <Text type="secondary">
              管理会员的分类和账户类型
            </Text>
          </Col>
          <Col>
            <Space>
              <Select
                placeholder="按类别筛选"
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 150 }}
                allowClear
              >
                {MEMBERSHIP_CATEGORY_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateModal}
                disabled={!isAdmin}
              >
                分配分类
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredCategories}
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
        title={editingCategory ? '编辑分类' : '分配分类'}
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
          {!editingCategory && (
            <Form.Item
              name="memberId"
              label="选择会员"
              rules={[{ required: true, message: '请选择会员' }]}
            >
              <Select
                placeholder="选择会员"
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                }
              >
                {members.map(member => (
                  <Option key={member.id} value={member.id}>
                    {member.name} ({member.memberId}) - {member.email}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="membershipCategory"
                label="会员类别"
                rules={[{ required: true, message: '请选择会员类别' }]}
              >
                <Select placeholder="选择会员类别">
                  {MEMBERSHIP_CATEGORY_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="accountType"
                label="账户类型"
                rules={[{ required: true, message: '请选择账户类型' }]}
              >
                <Select placeholder="选择账户类型">
                  {getAccountTypeFormOptions().map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="reason"
            label="分类原因"
          >
            <TextArea rows={3} placeholder="说明分类原因" />
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
    </div>
  );
};

export default CategoryManagement;
