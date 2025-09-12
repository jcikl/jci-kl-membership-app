import React from 'react';
import { Card, Table, Tag, Space, Button, Row, Col, Statistic, message, Typography, Progress, Badge } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  CrownOutlined,
  TrophyOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { getMembers } from '@/services/memberService';
import { Member } from '@/types';
import dayjs from 'dayjs';

const AssociateMembershipManager: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);

  const fetchAssociateMembers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMembers({ page: 1, limit: 500 });
      console.log('总会员数:', res.data.length);
      
      // 调试：查看所有会员的 proposedMembershipCategory
      const allCategories = res.data.map(m => ({
        name: m.name,
        proposedCategory: m.profile?.proposedMembershipCategory,
        birthDate: m.profile?.birthDate,
        categoryReviewStatus: m.profile?.categoryReviewStatus
      }));
      console.log('所有会员的类别信息:', allCategories);
      
      // 过滤出准会员且超过40岁的用户
      const associateMembers = res.data.filter(m => {
        const proposedCategory = m.profile?.proposedMembershipCategory;
        const isAssociate = (proposedCategory as any) === 'associate' || 
                           (m.profile?.categoryReviewStatus === 'approved' && (proposedCategory as any) === 'associate');
        
        if (!isAssociate) {
          console.log(`会员 ${m.name} 不是准会员，类别: ${proposedCategory}`);
          return false;
        }
        
        // 计算年龄
        const birthDate = m.profile?.birthDate;
        if (!birthDate) {
          console.log(`会员 ${m.name} 没有出生日期`);
          return false;
        }
        
        const age = dayjs().diff(dayjs(birthDate, 'DD-MMM-YYYY'), 'year');
        const isOver40 = age > 40;
        
        if (!isOver40) {
          console.log(`会员 ${m.name} 年龄不足40岁，当前年龄: ${age}`);
        }
        
        return isOver40;
      });
      
      console.log('过滤后的准会员数量:', associateMembers.length);
      console.log('准会员列表:', associateMembers.map(m => ({ name: m.name, age: dayjs().diff(dayjs(m.profile?.birthDate, 'DD-MMM-YYYY'), 'year') })));
      
      setMembers(associateMembers);
    } catch (e) {
      console.error('加载准会员数据失败:', e);
      message.error('加载准会员数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAssociateMembers();
  }, [fetchAssociateMembers]);

  const calculateAge = (birthDate: string) => {
    return dayjs().diff(dayjs(birthDate, 'DD-MMM-YYYY'), 'year');
  };

  const getPaymentStatus = (member: Member) => {
    const paymentDate = member.profile?.paymentDate;
    const paymentVerifiedDate = member.profile?.paymentVerifiedDate;
    
    if (paymentVerifiedDate) {
      return { status: 'verified', text: '已验证', color: 'green' };
    } else if (paymentDate) {
      return { status: 'pending', text: '待验证', color: 'orange' };
    } else {
      return { status: 'unpaid', text: '未付费', color: 'red' };
    }
  };

  const getLatestPaymentInfo = (member: Member) => {
    const paymentDate = member.profile?.paymentDate;
    const paymentVerifiedDate = member.profile?.paymentVerifiedDate;
    const paymentSlipUrl = member.profile?.paymentSlipUrl;
    
    if (paymentVerifiedDate) {
      return {
        date: paymentVerifiedDate,
        status: 'verified',
        url: paymentSlipUrl
      };
    } else if (paymentDate) {
      return {
        date: paymentDate,
        status: 'pending',
        url: paymentSlipUrl
      };
    }
    return null;
  };

  const columns = [
    { 
      title: '姓名', 
      dataIndex: 'name', 
      key: 'name',
      width: 120
    },
    { 
      title: '年龄', 
      key: 'age',
      width: 80,
      render: (_: any, record: Member) => {
        const birthDate = record.profile?.birthDate;
        if (!birthDate) return '-';
        const age = calculateAge(birthDate);
        return (
          <Tag color={age > 50 ? 'red' : age > 45 ? 'orange' : 'blue'}>
            {age}岁
          </Tag>
        );
      }
    },
    { 
      title: '邮箱', 
      dataIndex: 'email', 
      key: 'email',
      width: 200
    },
    { 
      title: '手机', 
      dataIndex: 'phone', 
      key: 'phone',
      width: 120
    },
    { 
      title: '申请日期', 
      dataIndex: 'createdAt', 
      key: 'createdAt',
      width: 100,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    { 
      title: '最新付费记录', 
      key: 'payment',
      width: 150,
      render: (_: any, record: Member) => {
        const paymentInfo = getLatestPaymentInfo(record);
        if (!paymentInfo) {
          return <Tag color="red">无付费记录</Tag>;
        }
        
        return (
          <Space direction="vertical" size="small">
            <div>{dayjs(paymentInfo.date, 'DD-MMM-YYYY').format('YYYY-MM-DD')}</div>
            <Tag color={paymentInfo.status === 'verified' ? 'green' : 'orange'}>
              {paymentInfo.status === 'verified' ? '已验证' : '待验证'}
            </Tag>
            {paymentInfo.url && (
              <Button 
                type="link" 
                size="small" 
                onClick={() => window.open(paymentInfo.url, '_blank')}
              >
                查看凭证
              </Button>
            )}
          </Space>
        );
      }
    },
    { 
      title: '付费状态', 
      key: 'paymentStatus',
      width: 100,
      render: (_: any, record: Member) => {
        const { text, color } = getPaymentStatus(record);
        return <Tag color={color}>{text}</Tag>;
      }
    }
  ];

  const stats = React.useMemo(() => {
    const total = members.length;
    const verified = members.filter(m => m.profile?.paymentVerifiedDate).length;
    const pending = members.filter(m => m.profile?.paymentDate && !m.profile?.paymentVerifiedDate).length;
    const unpaid = members.filter(m => !m.profile?.paymentDate).length;
    
    // 年龄分组统计
    const ageGroups = {
      '41-45': members.filter(m => {
        const age = calculateAge(m.profile?.birthDate || '');
        return age >= 41 && age <= 45;
      }).length,
      '46-50': members.filter(m => {
        const age = calculateAge(m.profile?.birthDate || '');
        return age >= 46 && age <= 50;
      }).length,
      '50+': members.filter(m => {
        const age = calculateAge(m.profile?.birthDate || '');
        return age > 50;
      }).length
    };
    
    return { total, verified, pending, unpaid, ageGroups };
  }, [members]);

  return (
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
              <CrownOutlined style={{ fontSize: '32px', marginRight: '16px', color: 'white' }} />
              <div>
                <Typography.Title level={2} style={{ margin: 0, color: 'white' }}>
                  准会员管理（40岁以上）
                </Typography.Title>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                  管理40岁以上的准会员申请和付费状态
                </p>
              </div>
            </div>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <Button 
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchAssociateMembers} 
                loading={loading}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white'
                }}
              >
                刷新数据
              </Button>
              <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>数据完整性</div>
                <Progress 
                  percent={Math.round((stats.verified / Math.max(stats.total, 1)) * 100)} 
                  size="small" 
                  strokeColor="white"
                  trailColor="rgba(255,255,255,0.3)"
                  style={{ width: '120px' }}
                />
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>总准会员(40+)</span>}
              value={stats.total} 
              prefix={<UserOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              40岁以上准会员总数
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>已付费验证</span>}
              value={stats.verified} 
              prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              已完成付费验证
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>待验证</span>}
              value={stats.pending} 
              prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              等待付费验证
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic 
              title={<span style={{ color: 'white', opacity: 0.9 }}>未付费</span>}
              value={stats.unpaid} 
              prefix={<CloseCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              尚未提交付费
            </div>
          </Card>
        </Col>
      </Row>

      {/* 年龄分组统计 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={8}>
          <Card 
            title={<><UserOutlined style={{ color: '#1890ff' }} /> 41-45岁</>}
            style={{ textAlign: 'center' }}
          >
            <Statistic 
              value={stats.ageGroups['41-45']} 
              valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
              {Math.round((stats.ageGroups['41-45'] / Math.max(stats.total, 1)) * 100)}% 占比
            </div>
          </Card>
        </Col>
        <Col xs={8}>
          <Card 
            title={<><TeamOutlined style={{ color: '#fa8c16' }} /> 46-50岁</>}
            style={{ textAlign: 'center' }}
          >
            <Statistic 
              value={stats.ageGroups['46-50']} 
              valueStyle={{ color: '#fa8c16', fontSize: '24px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
              {Math.round((stats.ageGroups['46-50'] / Math.max(stats.total, 1)) * 100)}% 占比
            </div>
          </Card>
        </Col>
        <Col xs={8}>
          <Card 
            title={<><TrophyOutlined style={{ color: '#ff4d4f' }} /> 50岁以上</>}
            style={{ textAlign: 'center' }}
          >
            <Statistic 
              value={stats.ageGroups['50+']} 
              valueStyle={{ color: '#ff4d4f', fontSize: '24px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
              {Math.round((stats.ageGroups['50+'] / Math.max(stats.total, 1)) * 100)}% 占比
            </div>
          </Card>
        </Col>
      </Row>

      {/* 准会员列表 */}
      <Card 
        title={
          <Space>
            <FileTextOutlined style={{ color: '#1890ff' }} />
            <span>准会员列表</span>
            <Badge count={members.length} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table
          rowKey="id"
          dataSource={members}
          columns={columns}
          loading={loading}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          size="middle"
          scroll={{ x: 800 }}
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
};

export default AssociateMembershipManager;