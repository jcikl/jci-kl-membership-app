import React from 'react';
import { Card, Table, Tag, Space, Button, Typography, Row, Col, Statistic, message } from 'antd';
import { getMembers } from '@/modules/member/services/memberService';
import { Member } from '@/types';
// import { useIsAdmin } from '@/hooks/usePermissions';
import dayjs from 'dayjs';


const VisitingMembershipManager: React.FC = () => {
  // const { isAdmin } = useIsAdmin();
  const [loading, setLoading] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);

  const fetchVisitingMembers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMembers({ page: 1, limit: 500 });
      // 过滤出国籍非马来西亚的会员
      const visitingMembers = res.data.filter(m => {
        const isNonMalaysian = m.profile?.nationality && m.profile.nationality.toLowerCase() !== 'malaysia' && 
                              m.profile.nationality.toLowerCase() !== 'malaysian';
        return isNonMalaysian;
      });
      setMembers(visitingMembers);
    } catch (e) {
      message.error('加载拜访会员数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchVisitingMembers();
  }, [fetchVisitingMembers]);

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
      title: '国籍', 
      dataIndex: ['profile', 'nationality'], 
      key: 'nationality',
      width: 100,
      render: (nationality: string) => nationality || '-'
    },
    { 
      title: '邮箱', 
      dataIndex: 'email', 
      key: 'email',
      width: 180
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
    },
    { 
      title: '审核状态', 
      key: 'reviewStatus',
      width: 100,
      render: (_: any, record: Member) => {
        const status = record.profile?.categoryReviewStatus;
        if (status === 'approved') {
          return <Tag color="green">已通过</Tag>;
        } else if (status === 'rejected') {
          return <Tag color="red">已拒绝</Tag>;
        } else {
          return <Tag color="orange">待审核</Tag>;
        }
      }
    }
  ];

  const stats = React.useMemo(() => {
    const total = members.length;
    const verified = members.filter(m => m.profile?.paymentVerifiedDate).length;
    const pending = members.filter(m => m.profile?.paymentDate && !m.profile?.paymentVerifiedDate).length;
    const unpaid = members.filter(m => !m.profile?.paymentDate).length;
    
    return { total, verified, pending, unpaid };
  }, [members]);

  return (
    <Card title="拜访会员管理（非马来西亚公民）" extra={<Button onClick={fetchVisitingMembers} loading={loading}>刷新</Button>}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="总拜访会员" value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="已付费验证" value={stats.verified} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="待验证" value={stats.pending} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="未付费" value={stats.unpaid} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>

      {/* 拜访会员列表 - 两列布局 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <Typography.Title level={5} style={{ margin: 0 }}>拜访会员列表</Typography.Title>
                <Tag color="blue">{Math.ceil(members.length / 2)}</Tag>
              </Space>
            }
            size="small"
            style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '12px' } }}
          >
            <Table
              rowKey="id"
              dataSource={members.slice(0, Math.ceil(members.length / 2))}
              columns={columns}
              loading={loading}
              pagination={{ pageSize: 8, size: 'small' }}
              size="small"
              style={{ flex: 1 }}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <Typography.Title level={5} style={{ margin: 0 }}>拜访会员列表</Typography.Title>
                <Tag color="blue">{Math.floor(members.length / 2)}</Tag>
              </Space>
            }
            size="small"
            style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '12px' } }}
          >
            <Table
              rowKey="id"
              dataSource={members.slice(Math.ceil(members.length / 2))}
              columns={columns}
              loading={loading}
              pagination={{ pageSize: 8, size: 'small' }}
              size="small"
              style={{ flex: 1 }}
              scroll={{ x: 600 }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default VisitingMembershipManager;
