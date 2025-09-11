import React from 'react';
import { Card, Table, Tag, Space, Button, Row, Col, Statistic, message, Typography } from 'antd';
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
      // 过滤出准会员且超过40岁的用户
      const associateMembers = res.data.filter(m => {
        const proposedCategory = m.profile?.proposedMembershipCategory;
        const isAssociate = (proposedCategory as any) === 'associate' || 
                           (m.profile?.categoryReviewStatus === 'approved' && (proposedCategory as any) === 'associate');
        
        if (!isAssociate) return false;
        
        // 计算年龄
        const birthDate = m.profile?.birthDate;
        if (!birthDate) return false;
        
        const age = dayjs().diff(dayjs(birthDate, 'DD-MMM-YYYY'), 'year');
        return age > 40;
      });
      
      setMembers(associateMembers);
    } catch (e) {
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
    <Card title="准会员管理（40岁以上）" extra={<Button onClick={fetchAssociateMembers} loading={loading}>刷新</Button>}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="总准会员(40+)" value={stats.total} />
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

      {/* 年龄分组统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="41-45岁" value={stats.ageGroups['41-45']} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="46-50岁" value={stats.ageGroups['46-50']} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small">
            <Statistic title="50岁以上" value={stats.ageGroups['50+']} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      {/* 准会员列表 - 两列布局 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <Typography.Title level={5} style={{ margin: 0 }}>准会员列表</Typography.Title>
                <Tag color="blue">{members.length}</Tag>
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
                <Typography.Title level={5} style={{ margin: 0 }}>准会员列表</Typography.Title>
                <Tag color="blue">{members.length}</Tag>
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

export default AssociateMembershipManager;