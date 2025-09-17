import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Typography, Spin, Row, Col, Badge, Avatar, Statistic, Progress } from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  UserOutlined,
  CrownOutlined,
  TrophyOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useMemberStore } from '@/store/memberStore';
import { getAccountTypeTagProps } from '@/utils/accountType';
import { useAccountType } from '@/hooks/useMemberCategory';

const { Title } = Typography;

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentMember, isLoading, fetchMemberById } = useMemberStore();
  const { accountType, loading: categoryLoading } = useAccountType(id);

  useEffect(() => {
    if (id) {
      fetchMemberById(id);
    }
  }, [id, fetchMemberById]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentMember) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>会员不存在</Title>
        <Button onClick={() => navigate('/members')}>
          返回会员列表
        </Button>
      </div>
    );
  }


  const getLevelTag = (level: string) => {
    const levelMap = {
      bronze: { color: '#cd7f32', text: '铜牌' },
      silver: { color: '#c0c0c0', text: '银牌' },
      gold: { color: '#ffd700', text: '金牌' },
      platinum: { color: '#e5e4e2', text: '白金' },
      diamond: { color: '#b9f2ff', text: '钻石' },
    };
    const config = levelMap[level as keyof typeof levelMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 头部信息卡片 */}
      <Card 
        style={{ 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none'
        }}
        styles={{ body: { padding: '32px' } }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Badge 
                dot 
                color={currentMember.status === 'active' ? '#52c41a' : '#ff4d4f'}
                offset={[-5, 5]}
              >
                <Avatar 
                  size={80} 
                  icon={<UserOutlined />} 
                  src={currentMember.profile?.profilePhotoUrl}
                  style={{ border: '3px solid white' }}
                />
              </Badge>
              <div style={{ marginLeft: '24px', color: 'white' }}>
                <Title level={2} style={{ margin: 0, color: 'white' }}>
                  {currentMember.name}
                </Title>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                  {currentMember.profile?.fullNameNric || '会员详情'}
                </p>
                <Space style={{ marginTop: '8px' }}>
                  <Tag color="white" style={{ color: '#667eea' }}>
                    {currentMember.memberId || '未设置会员编号'}
                  </Tag>
                  {currentMember.level && (
                    <Tag color="gold" style={{ color: '#000' }}>
                      <CrownOutlined /> {getLevelTag(currentMember.level)}
                    </Tag>
                  )}
                  {currentMember.status && (
                    <Tag color={currentMember.status === 'active' ? 'green' : 'red'}>
                      {currentMember.status === 'active' ? '活跃会员' : currentMember.status}
                    </Tag>
                  )}
                </Space>
              </div>
            </div>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <Space>
                <Button 
                  icon={<ArrowLeftOutlined />} 
                  onClick={() => navigate('/members')}
                  style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                >
                  返回
                </Button>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/members/${id}/edit`)}
                  style={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    border: '1px solid rgba(255,255,255,0.9)',
                    color: '#667eea'
                  }}
                >
                  编辑会员
                </Button>
              </Space>
              <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>会员状态</div>
                <Progress 
                  percent={currentMember.status === 'active' ? 100 : 50} 
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>会员等级</span>}
              value={currentMember.level || '未设置'} 
              prefix={<CrownOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}
            />
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>会员状态</span>}
              value={currentMember.status === 'active' ? '活跃' : currentMember.status || '未设置'}
              valueStyle={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}
            />
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>加入时间</span>}
              value={new Date(currentMember.joinDate).toLocaleDateString()} 
              prefix={<CalendarOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}
            />
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
              title={<span style={{ color: 'white', opacity: 0.9 }}>最后更新</span>}
              value={new Date(currentMember.updatedAt).toLocaleDateString()} 
              prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 基本信息卡片 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card 
            title={<><UserOutlined /> 基本信息</>} 
            style={{ marginBottom: '24px' }}
          >
            <Descriptions column={2} bordered>
              <Descriptions.Item label={<><UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />姓名</>} span={1}>
                {currentMember.name}
              </Descriptions.Item>
              <Descriptions.Item label={<><TrophyOutlined style={{ marginRight: 8, color: '#1890ff' }} />会员编号</>} span={1}>
                {currentMember.memberId}
              </Descriptions.Item>
              <Descriptions.Item label={<><MailOutlined style={{ marginRight: 8, color: '#1890ff' }} />邮箱</>} span={1}>
                {currentMember.email}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined style={{ marginRight: 8, color: '#1890ff' }} />手机号</>} span={1}>
                {currentMember.phone}
              </Descriptions.Item>
              <Descriptions.Item label={<><TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />用户户口类别</>} span={1}>
                {categoryLoading ? <Spin size="small" /> : <Tag {...getAccountTypeTagProps(accountType)} />}
              </Descriptions.Item>
              <Descriptions.Item label={<><CrownOutlined style={{ marginRight: 8, color: '#1890ff' }} />等级</>} span={1}>
                {getLevelTag(currentMember.level)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {currentMember.profile && Object.keys(currentMember.profile).length > 0 && (
        <Card 
          title={<><TeamOutlined /> 详细信息</>} 
          style={{ marginTop: '24px' }}
        >
          <Descriptions column={2} bordered>
            {currentMember.profile.birthDate && (
              <Descriptions.Item label={<><CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />出生日期</>} span={1}>
                {new Date(currentMember.profile.birthDate).toLocaleDateString()}
              </Descriptions.Item>
            )}
            {currentMember.profile.gender && (
              <Descriptions.Item label={<><UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />性别</>} span={1}>
                {currentMember.profile.gender === 'Male' ? '男' :
                  currentMember.profile.gender === 'Female' ? '女' : '其他'}
              </Descriptions.Item>
            )}
            {currentMember.profile.address && (
              <Descriptions.Item label={<><EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />地址</>} span={2}>
                {currentMember.profile.address}
              </Descriptions.Item>
            )}
            {currentMember.profile.occupation && (
              <Descriptions.Item label={<><TrophyOutlined style={{ marginRight: 8, color: '#1890ff' }} />职业</>} span={1}>
                {currentMember.profile.occupation}
              </Descriptions.Item>
            )}
            {currentMember.profile.company && (
              <Descriptions.Item label={<><CrownOutlined style={{ marginRight: 8, color: '#1890ff' }} />公司</>} span={1}>
                {currentMember.profile.company}
              </Descriptions.Item>
            )}
            {currentMember.profile.emergencyContact && (
              <>
                <Descriptions.Item label={<><UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />紧急联系人</>} span={1}>
                  {currentMember.profile.emergencyContact.name}
                </Descriptions.Item>
                <Descriptions.Item label={<><PhoneOutlined style={{ marginRight: 8, color: '#1890ff' }} />紧急联系电话</>} span={1}>
                  {currentMember.profile.emergencyContact.phone}
                </Descriptions.Item>
                <Descriptions.Item label={<><TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />关系</>} span={1}>
                  {currentMember.profile.emergencyContact.relationship}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default MemberDetailPage;
