import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Tag, 
  Card, 
  Typography, 
  Row, 
  Col,
  Select,
  Modal,
  Form,
  message
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined 
} from '@ant-design/icons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMemberStore } from '@/store/memberStore';
import { Member, MemberStatus, MemberLevel } from '@/types';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const memberFormSchema = yup.object({
  name: yup.string().required('请输入姓名'),
  email: yup.string().email('请输入有效的邮箱').required('请输入邮箱'),
  phone: yup.string().required('请输入手机号'),
  memberId: yup.string().required('请输入会员编号'),
  status: yup.string().required('请选择状态'),
  level: yup.string().required('请选择等级'),
});

type MemberFormData = yup.InferType<typeof memberFormSchema>;

const MemberListPage: React.FC = () => {
  const { 
    members, 
    isLoading, 
    pagination, 
    fetchMembers, 
    addMember, 
    deleteMemberById 
  } = useMemberStore();
  
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'all'>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: yupResolver(memberFormSchema),
  });

  useEffect(() => {
    fetchMembers({ page: 1, limit: 10 });
  }, [fetchMembers]);

  const handleSearch = (value: string) => {
    // 这里可以实现搜索逻辑
    console.log('Search:', value);
  };

  const handleStatusFilter = (value: MemberStatus | 'all') => {
    setStatusFilter(value);
    // 这里可以实现状态过滤逻辑
  };

  const handleAddMember = () => {
    setEditingMember(null);
    reset();
    setIsModalVisible(true);
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    reset(member);
    setIsModalVisible(true);
  };

  const handleDeleteMember = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个会员吗？此操作不可撤销。',
      onOk: async () => {
        try {
          await deleteMemberById(id);
          message.success('删除成功');
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const onSubmit = async (data: MemberFormData) => {
    try {
      if (editingMember) {
        // 更新会员
        // await updateMemberById(editingMember.id, data);
        message.success('更新成功');
      } else {
        // 添加新会员
        await addMember(data as Omit<Member, 'id' | 'createdAt' | 'updatedAt'>);
        message.success('添加成功');
      }
      setIsModalVisible(false);
      reset();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '会员编号',
      dataIndex: 'memberId',
      key: 'memberId',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: MemberStatus) => {
        const statusMap = {
          active: { color: 'green', text: '活跃' },
          inactive: { color: 'orange', text: '非活跃' },
          pending: { color: 'blue', text: '待审核' },
          suspended: { color: 'red', text: '已暂停' },
        };
        const config = statusMap[status];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: MemberLevel) => {
        const levelMap = {
          bronze: { color: '#cd7f32', text: '铜牌' },
          silver: { color: '#c0c0c0', text: '银牌' },
          gold: { color: '#ffd700', text: '金牌' },
          platinum: { color: '#e5e4e2', text: '白金' },
          diamond: { color: '#b9f2ff', text: '钻石' },
        };
        const config = levelMap[level];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '加入时间',
      dataIndex: 'joinDate',
      key: 'joinDate',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Member) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditMember(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteMember(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              会员管理
            </Title>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddMember}
            >
              添加会员
            </Button>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Search
              placeholder="搜索会员姓名或邮箱"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="选择状态"
              style={{ width: '100%' }}
              size="large"
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">活跃</Option>
              <Option value="inactive">非活跃</Option>
              <Option value="pending">待审核</Option>
              <Option value="suspended">已暂停</Option>
            </Select>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={members}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
          }}
        />
      </Card>

      {/* 添加/编辑会员模态框 */}
      <Modal
        title={editingMember ? '编辑会员' : '添加会员'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          reset();
        }}
        footer={null}
        width={600}
      >
        <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                validateStatus={errors.name ? 'error' : ''}
                help={errors.name?.message}
              >
                <Input {...register('name')} placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                validateStatus={errors.email ? 'error' : ''}
                help={errors.email?.message}
              >
                <Input {...register('email')} placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="手机号"
                validateStatus={errors.phone ? 'error' : ''}
                help={errors.phone?.message}
              >
                <Input {...register('phone')} placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="会员编号"
                validateStatus={errors.memberId ? 'error' : ''}
                help={errors.memberId?.message}
              >
                <Input {...register('memberId')} placeholder="请输入会员编号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="状态"
                validateStatus={errors.status ? 'error' : ''}
                help={errors.status?.message}
              >
                <Select {...register('status')} placeholder="请选择状态">
                  <Option value="active">活跃</Option>
                  <Option value="inactive">非活跃</Option>
                  <Option value="pending">待审核</Option>
                  <Option value="suspended">已暂停</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="等级"
                validateStatus={errors.level ? 'error' : ''}
                help={errors.level?.message}
              >
                <Select {...register('level')} placeholder="请选择等级">
                  <Option value="bronze">铜牌</Option>
                  <Option value="silver">银牌</Option>
                  <Option value="gold">金牌</Option>
                  <Option value="platinum">白金</Option>
                  <Option value="diamond">钻石</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingMember ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MemberListPage;
