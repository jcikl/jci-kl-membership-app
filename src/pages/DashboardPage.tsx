import React, { useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Button, Space, Typography } from 'antd';
import { UserOutlined, TeamOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMemberStore } from '@/store/memberStore';
import { Member } from '@/types';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { members, isLoading, fetchMembers } = useMemberStore();

  useEffect(() => {
    fetchMembers({ page: 1, limit: 5 });
  }, [fetchMembers]);

  // 统计数据
  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter(m => m.status === 'active').length,
    pendingMembers: members.filter(m => m.status === 'pending').length,
    newMembersThisMonth: members.filter(m => {
      const joinDate = new Date(m.joinDate);
      const now = new Date();
      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
    }).length,
  };

  // 最近会员表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
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
      render: (status: string) => {
        const statusMap = {
          active: { color: 'green', text: '活跃' },
          inactive: { color: 'orange', text: '非活跃' },
          pending: { color: 'blue', text: '待审核' },
          suspended: { color: 'red', text: '已暂停' },
        };
        const config = statusMap[status as keyof typeof statusMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      render: (level: string) => {
        const levelMap = {
          bronze: { color: '#cd7f32', text: '铜牌' },
          silver: { color: '#c0c0c0', text: '银牌' },
          gold: { color: '#ffd700', text: '金牌' },
          platinum: { color: '#e5e4e2', text: '白金' },
          diamond: { color: '#b9f2ff', text: '钻石' },
        };
        const config = levelMap[level as keyof typeof levelMap];
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Member) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => navigate(`/members/${record.id}`)}
          >
            查看详情
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        仪表板
      </Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总会员数"
              value={stats.totalMembers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃会员"
              value={stats.activeMembers}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="待审核"
              value={stats.pendingMembers}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月新增"
              value={stats.newMembersThisMonth}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 最近会员 */}
      <Card 
        title="最近会员" 
        extra={
          <Button type="primary" onClick={() => navigate('/members')}>
            查看全部
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={members}
          loading={isLoading}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
