import React from 'react';
import { 
  Card, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Avatar, 
  Row, 
  Col, 
  Badge,
  Statistic,
  Progress,
  Modal
} from 'antd';
import { 
  EditOutlined, 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  TrophyOutlined,
  CrownOutlined,
  GlobalOutlined,
  LinkedinOutlined,
  WhatsAppOutlined
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { updateMember } from '@/modules/member/services/memberService';
import UserTasksDisplay from '@/components/UserTasksDisplay';
import ProfileEditForm from '@/modules/member/components/ProfileEditForm';

// Helper function to safely format date values
const formatDateValue = (dateValue: any): string => {
  if (!dateValue) return '未设置';
  if (typeof dateValue === 'string') return dateValue;
  if (dateValue && typeof dateValue.format === 'function') {
    return dateValue.format('DD-MMM-YYYY');
  }
  return String(dateValue);
};

const { Title } = Typography;

const ProfilePage: React.FC = () => {
  const { user, member, setMember } = useAuthStore();
  const [editing, setEditing] = React.useState(false);

  if (!member) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        fontSize: '16px',
        color: '#666'
      }}>
        加载中...
      </div>
    );
  }

  // 计算资料完整度
  const calculateProfileCompleteness = () => {
    const fields = [
      member.name,
      member.phone,
      member.profile?.fullNameNric,
      member.profile?.senatorId,
      member.profile?.gender,
      member.profile?.race,
      member.profile?.address,
      member.profile?.nricOrPassport,
      member.profile?.birthDate,
      member.profile?.company,
      member.profile?.departmentAndPosition,
      member.profile?.industryDetail,
      member.profile?.introducerName,
      member.profile?.jciEventInterests,
      member.profile?.jciBenefitsExpectation,
      member.profile?.fiveYearsVision,
      member.profile?.activeMemberHow,
      member.profile?.nameToBeEmbroidered,
      member.profile?.shirtSize,
      member.profile?.jacketSize,
      member.profile?.cutting
    ];
    
    const filledFields = fields.filter(field => field && field !== '未设置').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const profileCompleteness = calculateProfileCompleteness();

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
                color={member.status === 'active' ? '#52c41a' : '#ff4d4f'}
                offset={[-5, 5]}
              >
          <Avatar 
                  size={80} 
            icon={<UserOutlined />} 
                  src={member.profile?.profilePhotoUrl}
                  style={{ border: '3px solid white' }}
                />
              </Badge>
              <div style={{ marginLeft: '24px', color: 'white' }}>
                <Title level={2} style={{ margin: 0, color: 'white' }}>
                  {member.name}
          </Title>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                  {member.profile?.fullNameNric || '未设置完整姓名'}
                </p>
                <Space style={{ marginTop: '8px' }}>
                  <Tag color="white" style={{ color: '#667eea' }}>
                    {member.memberId || '未设置会员编号'}
                  </Tag>
                  {member.level && (
                    <Tag color="gold" style={{ color: '#000' }}>
                      <CrownOutlined /> {member.level}
                    </Tag>
                  )}
                  {member.status && (
                    <Tag color={member.status === 'active' ? 'green' : 'red'}>
                      {member.status === 'active' ? '活跃会员' : member.status}
                    </Tag>
                  )}
          </Space>
        </div>
            </div>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <Button 
                type="primary" 
                size="large"
                icon={<EditOutlined />} 
                onClick={() => setEditing(true)}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white'
                }}
              >
                编辑个人资料
          </Button>
              <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>资料完整度</div>
                <Progress 
                  percent={profileCompleteness} 
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

      {/* 主要内容区域 */}
      <Row gutter={[24, 24]}>
        {/* 左侧：基本信息 */}
        <Col xs={24} lg={16}>
          <Card title={<><UserOutlined /> 基本信息</>} style={{ marginBottom: '24px' }}>
                    <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <PhoneOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>手机号:</span>
                  <span>{member.phone || '未设置'}</span>
                </div>
                      </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <MailOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>邮箱:</span>
                  <span>{user?.email || '未设置'}</span>
                </div>
                      </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <CalendarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>出生日期:</span>
                  <span>{formatDateValue(member.profile?.birthDate)}</span>
                </div>
                      </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <EnvironmentOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>地址:</span>
                  <span>{member.profile?.address || '未设置'}</span>
                </div>
                      </Col>
              <Col xs={24}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <UserOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>NRIC/护照号:</span>
                  <span>{member.profile?.nricOrPassport || '未设置'}</span>
                </div>
                      </Col>
            </Row>
          </Card>

          {/* 职业信息 */}
          <Card title={<><TeamOutlined /> 职业信息</>} style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>公司:</span>
                  <span>{member.profile?.company || '未设置'}</span>
                </div>
                      </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>职位:</span>
                  <span>{member.profile?.departmentAndPosition || '未设置'}</span>
                </div>
                      </Col>
              <Col xs={24}>
                <div style={{ marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>行业详情:</span>
                  <span>{member.profile?.industryDetail || '未设置'}</span>
                </div>
                       </Col>
              {member.profile?.linkedin && (
                <Col xs={24} sm={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <LinkedinOutlined style={{ marginRight: '8px', color: '#0077b5' }} />
                    <a href={member.profile.linkedin} target="_blank" rel="noopener noreferrer">
                      LinkedIn 个人资料
                    </a>
                  </div>
                      </Col>
              )}
              {member.profile?.companyWebsite && (
                <Col xs={24} sm={12}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                    <GlobalOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                    <a href={member.profile.companyWebsite} target="_blank" rel="noopener noreferrer">
                      公司网站
                    </a>
                  </div>
                      </Col>
              )}
            </Row>
          </Card>

          {/* JCI相关信息 */}
          <Card title={<><TrophyOutlined /> JCI 相关信息</>} style={{ marginBottom: '24px' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>参议员编号:</span>
                  <span>{member.profile?.senatorId || '未设置'}</span>
                </div>
                      </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>JCI职位:</span>
                  <span>{member.profile?.jciPosition || '未设置'}</span>
                                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>介绍人:</span>
                  <span>{member.profile?.introducerName || '未设置'}</span>
                              </div>
                      </Col>
              <Col xs={24} sm={12}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '8px' }}>入会日期:</span>
                  <span>{formatDateValue(member.joinDate)}</span>
                              </div>
                      </Col>
                    </Row>
          </Card>
        </Col>

        {/* 右侧：统计信息和标签 */}
        <Col xs={24} lg={8}>
          {/* 会员状态统计 */}
          <Card title={<><CrownOutlined /> 会员状态</>} style={{ marginBottom: '24px' }}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                <Statistic 
                  title="会员等级" 
                  value={member.level || '未设置'} 
                  prefix={<CrownOutlined />}
                />
                      </Col>
                      <Col span={12}>
                <Statistic 
                  title="会员状态" 
                  value={member.status === 'active' ? '活跃' : member.status || '未设置'}
                  valueStyle={{ color: member.status === 'active' ? '#3f8600' : '#cf1322' }}
                />
                      </Col>
            </Row>
          </Card>

          {/* 兴趣爱好标签 */}
          {member.profile?.hobbies && member.profile.hobbies.length > 0 && (
            <Card title="兴趣爱好" style={{ marginBottom: '24px' }}>
              <Space wrap>
                {member.profile.hobbies.map((hobby, index) => (
                  <Tag key={index} color="blue">{hobby}</Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* 行业标签 */}
          {member.profile?.ownIndustry && member.profile.ownIndustry.length > 0 && (
            <Card title="自身行业" style={{ marginBottom: '24px' }}>
              <Space wrap>
                {member.profile.ownIndustry.map((industry, index) => (
                  <Tag key={index} color="green">{industry}</Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* 关注行业 */}
          {member.profile?.interestedIndustries && member.profile.interestedIndustries.length > 0 && (
            <Card title="关注行业" style={{ marginBottom: '24px' }}>
              <Space wrap>
                {member.profile.interestedIndustries.map((industry, index) => (
                  <Tag key={index} color="orange">{industry}</Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* 类别标签 */}
          {member.profile?.categories && member.profile.categories.length > 0 && (
            <Card title="类别" style={{ marginBottom: '24px' }}>
              <Space wrap>
                {member.profile.categories.map((category, index) => (
                  <Tag key={index} color="purple">{category}</Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* WhatsApp群组 */}
          {member.profile?.whatsappGroup && (
            <Card title="WhatsApp群组" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <WhatsAppOutlined style={{ marginRight: '8px', color: '#25D366', fontSize: '20px' }} />
                <Tag color="green">已加入群组</Tag>
              </div>
            </Card>
          )}
                      </Col>
                    </Row>

      {/* 详细信息区域 */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          {/* 个人愿景和目标 */}
          {(member.profile?.fiveYearsVision || member.profile?.activeMemberHow) && (
            <Card title={<><TrophyOutlined /> 个人愿景</>} style={{ marginBottom: '24px' }}>
              {member.profile?.fiveYearsVision && (
                <div style={{ marginBottom: '16px' }}>
                  <Title level={5}>五年愿景</Title>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>{member.profile.fiveYearsVision}</p>
                </div>
              )}
              {member.profile?.activeMemberHow && (
                <div>
                  <Title level={5}>如何成为活跃会员</Title>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>{member.profile.activeMemberHow}</p>
                </div>
              )}
            </Card>
          )}

          {/* JCI期望和兴趣 */}
          {(member.profile?.jciEventInterests || member.profile?.jciBenefitsExpectation) && (
            <Card title={<><TeamOutlined /> JCI 期望</>} style={{ marginBottom: '24px' }}>
              {member.profile?.jciEventInterests && (
                <div style={{ marginBottom: '16px' }}>
                  <Title level={5}>感兴趣的活动类型</Title>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>{member.profile.jciEventInterests}</p>
                </div>
              )}
              {member.profile?.jciBenefitsExpectation && (
                <div>
                  <Title level={5}>期望获得的收益</Title>
                  <p style={{ color: '#666', lineHeight: '1.6' }}>{member.profile.jciBenefitsExpectation}</p>
                  </div>
              )}
            </Card>
          )}
        </Col>

        <Col xs={24} lg={12}>
          {/* 公司介绍 */}
          {member.profile?.companyIntro && (
            <Card title={<><TeamOutlined /> 公司介绍</>} style={{ marginBottom: '24px' }}>
              <p style={{ color: '#666', lineHeight: '1.6' }}>{member.profile.companyIntro}</p>
            </Card>
          )}

          {/* 国际商务 */}
          {member.profile?.acceptInternationalBusiness && (
            <Card title={<><GlobalOutlined /> 国际商务</>} style={{ marginBottom: '24px' }}>
              <p style={{ color: '#666', lineHeight: '1.6' }}>{member.profile.acceptInternationalBusiness}</p>
            </Card>
          )}

          {/* 服装信息 */}
          {(member.profile?.nameToBeEmbroidered || member.profile?.shirtSize || member.profile?.jacketSize || member.profile?.cutting) && (
            <Card title={<><UserOutlined /> 服装信息</>} style={{ marginBottom: '24px' }}>
                    <Row gutter={[16, 16]}>
                {member.profile?.nameToBeEmbroidered && (
                      <Col span={12}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: 'bold', marginRight: '8px' }}>刺绣姓名:</span>
                      <span>{member.profile.nameToBeEmbroidered}</span>
                    </div>
                      </Col>
                )}
                {member.profile?.shirtSize && (
                      <Col span={12}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: 'bold', marginRight: '8px' }}>T恤尺码:</span>
                      <span>{member.profile.shirtSize}</span>
                    </div>
                      </Col>
                )}
                {member.profile?.jacketSize && (
                      <Col span={12}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: 'bold', marginRight: '8px' }}>外套尺码:</span>
                      <span>{member.profile.jacketSize}</span>
                    </div>
                      </Col>
                )}
                {member.profile?.cutting && (
                      <Col span={12}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: 'bold', marginRight: '8px' }}>T恤版型:</span>
                      <span>{member.profile.cutting}</span>
                    </div>
                      </Col>
                )}
                {member.profile?.tshirtReceivingStatus && (
                  <Col span={24}>
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: 'bold', marginRight: '8px' }}>T恤领取状态:</span>
                      <Tag color={member.profile.tshirtReceivingStatus === 'Delivered' ? 'green' : 'orange'}>
                        {member.profile.tshirtReceivingStatus}
                      </Tag>
                    </div>
                      </Col>
                )}
              </Row>
            </Card>
          )}
                      </Col>
                    </Row>

      {/* 任务区域 */}
      <Card title={<><TrophyOutlined /> 我的任务</>} style={{ marginTop: '24px' }}>
        <UserTasksDisplay />
      </Card>

      <Modal
        title="编辑个人资料"
        open={editing}
        onCancel={() => setEditing(false)}
        footer={null}
        width={1200}
        destroyOnHidden
        style={{ top: 20 }}
      >
        {editing && member && (
          <ProfileEditForm
            member={member}
            onSubmit={async (updated) => {
              try {
                await updateMember(member.id, updated);
                setMember({ ...member, ...updated });
                setEditing(false);
              } catch (error) {
                console.error('更新失败:', error);
              }
            }}
            onCancel={() => setEditing(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default ProfilePage;
