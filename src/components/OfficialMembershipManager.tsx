import React from 'react';
import { Card, Table, Button, Space, Tag, Row, Col, Typography, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getMembers } from '@/services/memberService';
import { Member } from '@/types';
import dayjs from 'dayjs';

const { Title } = Typography;

const OfficialMembershipManager: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);

  const fetchOfficialMembers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMembers({ page: 1, limit: 500 });
      // 过滤出正式会员
      const officialMembers = res.data.filter(m => 
        m.profile?.proposedMembershipCategory === 'official' || 
        (m.profile?.categoryReviewStatus === 'approved' && m.profile?.proposedMembershipCategory === 'official')
      );
      setMembers(officialMembers);
    } catch (e) {
      message.error('加载正式会员数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOfficialMembers();
  }, [fetchOfficialMembers]);

  const getPaymentStatus = (member: Member) => {
    if (member.profile?.paymentVerifiedDate) {
      return { text: '已付费验证', color: 'green' };
    } else if (member.profile?.paymentDate) {
      return { text: '待验证', color: 'orange' };
    } else {
      return { text: '未付费', color: 'red' };
    }
  };

  const getLatestPaymentInfo = (member: Member) => {
    if (member.profile?.paymentDate) {
      return {
        date: member.profile.paymentDate,
        status: member.profile.paymentVerifiedDate ? 'verified' : 'pending',
        url: member.profile.paymentSlipUrl
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
      title: '会员编号', 
      dataIndex: 'memberId', 
      key: 'memberId',
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
    <Card title="正式会员管理" extra={<Button onClick={fetchOfficialMembers} loading={loading}>刷新</Button>}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>{stats.total}</div>
              <div style={{ color: '#666' }}>总正式会员</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3f8600' }}>{stats.verified}</div>
              <div style={{ color: '#666' }}>已付费验证</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#cf1322' }}>{stats.pending}</div>
              <div style={{ color: '#666' }}>待验证</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#cf1322' }}>{stats.unpaid}</div>
              <div style={{ color: '#666' }}>未付费</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 正式会员列表 - 两列布局 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <Typography.Title level={5} style={{ margin: 0 }}>正式会员列表</Typography.Title>
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
                <Typography.Title level={5} style={{ margin: 0 }}>正式会员列表</Typography.Title>
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

export default OfficialMembershipManager;
