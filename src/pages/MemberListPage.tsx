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
  message,
  Tabs,
  Badge,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined,
  UploadOutlined,
  TeamOutlined,
  FilterOutlined,
  CrownOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMemberStore } from '@/store/memberStore';
import { Member, MemberLevel } from '@/types';
import { getAccountTypeTagProps, getAccountTypeFormOptions, isValidAccountType } from '@/utils/accountType';
import ProfileEditForm from '@/components/ProfileEditForm';
import BatchImportModal from '@/components/BatchImportModal';
import SenatorManagement from '@/components/SenatorManagement';
import VisitingMembershipManager from '@/components/VisitingMembershipManager';
import AssociateMembershipManager from '@/components/AssociateMembershipManager';
import OfficialMembershipManager from '@/components/OfficialMembershipManager';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const memberFormSchema = yup.object({
  name: yup.string().required('请输入姓名'),
  email: yup.string().email('请输入有效的邮箱').required('请输入邮箱'),
  phone: yup.string().required('请输入手机号'),
  memberId: yup.string().required('请输入会员编号'),
  accountType: yup.string().test('is-valid-account-type', '请选择有效的用户户口类别', (value) => value ? isValidAccountType(value) : false).required('请选择用户户口类别'),
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
    addMembersBatch,
    deleteMemberById 
  } = useMemberStore();
  
  const [accountTypeFilter, setAccountTypeFilter] = useState<string | 'all'>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBatchImportVisible, setIsBatchImportVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const {
    control,
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

  const handleAccountTypeFilter = (value: string | 'all') => {
    setAccountTypeFilter(value);
    // 这里可以实现用户户口类别过滤逻辑
  };

  const handleAddMember = () => {
    setEditingMember(null);
    reset();
    setIsModalVisible(true);
  };

  const handleBatchImport = () => {
    setIsBatchImportVisible(true);
  };

  const handleBatchImportSubmit = async (membersData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      const result = await addMembersBatch(membersData);
      return result;
    } catch (error) {
      throw error;
    }
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
        // 添加新会员 - 创建完整的会员对象
        const memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'> = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          memberId: data.memberId,
          joinDate: new Date().toISOString(),
          status: 'active', // 默认状态
          level: data.level as any,
          profile: {
            // 基本档案信息
          }
        };
        
        await addMember(memberData);
        
        // 如果设置了账户类型，需要单独创建分类记录
        if (data.accountType && data.accountType !== 'member') {
          // 这里需要调用 categoryService 来创建分类记录
          // 由于需要 memberId，我们需要先获取新创建的会员ID
          message.info('会员已创建，请稍后在分类管理中设置用户户口类别');
        }
        
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
      title: '用户户口类别',
      dataIndex: 'accountType',
      key: 'accountType',
      render: (accountType: string) => {
        const tagProps = getAccountTypeTagProps(accountType);
        return <Tag {...tagProps} />;
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

  const MemberListContent = () => (
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
              <TeamOutlined style={{ fontSize: '32px', marginRight: '16px', color: 'white' }} />
              <div>
                <Title level={2} style={{ margin: 0, color: 'white' }}>
                  会员管理
                </Title>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                  管理所有会员信息、状态和权限
                </p>
              </div>
            </div>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <Space>
                <Button 
                  icon={<UploadOutlined />}
                  onClick={handleBatchImport}
                  style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                >
                  批量导入
                </Button>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleAddMember}
                  style={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    border: '1px solid rgba(255,255,255,0.9)',
                    color: '#667eea'
                  }}
                >
                  添加会员
                </Button>
              </Space>
              <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>会员总数</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{pagination.total}</div>
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>总会员数</span>}
              value={pagination.total} 
              prefix={<UserOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              全部注册会员
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>活跃会员</span>}
              value={members.filter(m => m.status === 'active').length} 
              prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              当前活跃状态
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>待审核</span>}
              value={members.filter(m => m.status === 'pending').length} 
              prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              等待审核通过
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>本月新增</span>}
              value={members.filter(m => {
                const joinDate = new Date(m.joinDate);
                const now = new Date();
                return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
              }).length} 
              prefix={<TrophyOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              本月新加入会员
            </div>
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选区域 */}
      <Card 
        title={
          <Space>
            <FilterOutlined style={{ color: '#1890ff' }} />
            <span>搜索和筛选</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索会员姓名或邮箱"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="选择用户户口类别"
              style={{ width: '100%' }}
              size="large"
              value={accountTypeFilter}
              onChange={handleAccountTypeFilter}
            >
              <Option value="all">全部类别</Option>
              {getAccountTypeFormOptions().map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ textAlign: 'right' }}>
              <Badge count={members.length} style={{ backgroundColor: '#52c41a' }}>
                <Tag color="blue" style={{ fontSize: '16px', padding: '8px 16px' }}>
                  当前显示 {members.length} 条记录
                </Tag>
              </Badge>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 会员列表表格 */}
      <Card 
        title={
          <Space>
            <TeamOutlined style={{ color: '#1890ff' }} />
            <span>会员列表</span>
            <Badge count={pagination.total} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
      >
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
          rowClassName={(_, index) => 
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
        />
      </Card>

      {/* 添加自定义样式 */}
      <style>{`
        .table-row-light {
          background-color: #fafafa;
        }
        .table-row-dark {
          background-color: #ffffff;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </div>
  );

  return (
    <div>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>会员管理</Title>
        <Tabs
          defaultActiveKey="member-list"
          size="large"
          items={[
            {
              key: 'member-list',
              label: (
                <span>
                  <TeamOutlined />
                  会员列表
                </span>
              ),
              children: <MemberListContent />
            },
            {
              key: 'senators',
              label: (
                <span>
                  <CheckCircleOutlined />
                  参议员管理
                </span>
              ),
              children: <SenatorManagement />
            },
            {
              key: 'visiting-membership',
              label: (
                <span>
                  <TrophyOutlined />
                  拜访会员管理
                </span>
              ),
              children: <VisitingMembershipManager />
            },
            {
              key: 'associate-membership',
              label: (
                <span>
                  <UserOutlined />
                  准会员管理
                </span>
              ),
              children: <AssociateMembershipManager />
            },
            {
              key: 'official-membership',
              label: (
                <span>
                  <CrownOutlined />
                  正式会员管理
                </span>
              ),
              children: <OfficialMembershipManager />
            }
          ]}
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
        width={editingMember ? 1200 : 600}
        destroyOnHidden
        style={{ top: 20 }}
      >
        {editingMember ? (
          <ProfileEditForm
            member={editingMember}
            onSubmit={async (updated) => {
              // 通过 store 执行更新
              const { updateMemberById, fetchMembers } = useMemberStore.getState();
              await updateMemberById(editingMember.id, updated as Partial<Member>);
              await fetchMembers({ page: 1, limit: pagination.limit });
              setIsModalVisible(false);
            }}
            onCancel={() => {
              setIsModalVisible(false);
            }}
          />
        ) : (
          <Form onSubmitCapture={handleSubmit(onSubmit)} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                validateStatus={errors.name ? 'error' : ''}
                help={errors.name?.message}
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入姓名" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                validateStatus={errors.email ? 'error' : ''}
                help={errors.email?.message}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入邮箱" />}
                />
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
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入手机号" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="会员编号"
                validateStatus={errors.memberId ? 'error' : ''}
                help={errors.memberId?.message}
              >
                <Controller
                  name="memberId"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入会员编号" />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户户口类别"
                validateStatus={errors.accountType ? 'error' : ''}
                help={errors.accountType?.message}
              >
                <Controller
                  name="accountType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} placeholder="请选择用户户口类别">
                      {getAccountTypeFormOptions().map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="等级"
                validateStatus={errors.level ? 'error' : ''}
                help={errors.level?.message}
              >
                <Controller
                  name="level"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} placeholder="请选择等级">
                      <Option value="bronze">铜牌</Option>
                      <Option value="silver">银牌</Option>
                      <Option value="gold">金牌</Option>
                      <Option value="platinum">白金</Option>
                      <Option value="diamond">钻石</Option>
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
        )}
      </Modal>

      {/* 批量导入模态框 */}
      <BatchImportModal
        visible={isBatchImportVisible}
        onCancel={() => setIsBatchImportVisible(false)}
        onImport={handleBatchImportSubmit}
      />
    </div>
  );
};

export default MemberListPage;
