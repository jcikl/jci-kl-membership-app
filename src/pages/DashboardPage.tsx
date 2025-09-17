import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Space, Typography, List, Tag, Spin, Image, Progress, Badge, Avatar } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  HeartOutlined, 
  ApartmentOutlined, 
  ShopOutlined, 
  InfoCircleOutlined, 
  EyeOutlined,
  TrophyOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  DashboardOutlined,
  FilterOutlined,
  ClearOutlined,
  SmileOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMemberStore } from '@/store/memberStore';
import { Member, ChapterSettings } from '@/types';
import { HOBBY_OPTIONS, CATEGORY_OPTIONS, INTERESTED_INDUSTRY_OPTIONS } from '@/types/constants';
import { getChapterSettings } from '@/modules/system/services/chapterSettingsService';

const { Title } = Typography;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { members, isLoading, fetchMembers } = useMemberStore();
  
  // 筛选状态
  const [selectedHobby, setSelectedHobby] = React.useState<string>('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('');
  const [selectedIndustry, setSelectedIndustry] = React.useState<string>('');
  
  // 分会设置状态
  const [chapterSettings, setChapterSettings] = useState<ChapterSettings | null>(null);
  const [chapterLoading, setChapterLoading] = useState(true);
  
  // 生日宝宝状态
  const [selectedBirthdayMonth, setSelectedBirthdayMonth] = useState<number>(new Date().getMonth() + 1);

  useEffect(() => {
    fetchMembers({ page: 1, limit: 100 }); // 获取更多数据用于兴趣分析
  }, [fetchMembers]);

  // 加载分会设置
  useEffect(() => {
    const loadChapterSettings = async () => {
      try {
        const settings = await getChapterSettings();
        setChapterSettings(settings);
      } catch (error) {
        console.error('加载分会设置失败:', error);
      } finally {
        setChapterLoading(false);
      }
    };
    
    loadChapterSettings();
  }, []);

  // 根据筛选条件过滤会员
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      // 兴趣筛选
      if (selectedHobby && (!member.profile?.hobbies || !member.profile.hobbies.includes(selectedHobby as any))) {
        return false;
      }
      // 类别筛选
      if (selectedCategory && (!member.profile?.categories || !member.profile.categories.includes(selectedCategory as any))) {
        return false;
      }
      // 行业筛选
      if (selectedIndustry && (!member.profile?.interestedIndustries || !member.profile.interestedIndustries.includes(selectedIndustry as any))) {
        return false;
      }
      return true;
    });
  }, [members, selectedHobby, selectedCategory, selectedIndustry]);

  // 统计数据（基于筛选后的会员）
  const stats = {
    totalMembers: filteredMembers.length,
    activeMembers: filteredMembers.filter(m => m.status === 'active').length,
    pendingMembers: filteredMembers.filter(m => m.status === 'pending').length,
    newMembersThisMonth: filteredMembers.filter(m => {
      const joinDate = new Date(m.joinDate);
      const now = new Date();
      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
    }).length,
  };

  // 兴趣分析数据（基于筛选后的会员）
  const hobbyAnalysis = useMemo(() => {
    const hobbyCount: { [key: string]: { count: number; members: Member[] } } = {};
    
    // 初始化所有兴趣选项
    HOBBY_OPTIONS.forEach(hobby => {
      hobbyCount[hobby] = { count: 0, members: [] };
    });

    // 统计每个兴趣的用户数量（基于筛选后的会员）
    filteredMembers.forEach(member => {
      if (member.profile?.hobbies) {
        member.profile.hobbies.forEach(hobby => {
          if (hobbyCount[hobby]) {
            hobbyCount[hobby].count++;
            hobbyCount[hobby].members.push(member);
          }
        });
      }
    });

    // 转换为数组并按人数排序
    return Object.entries(hobbyCount)
      .map(([hobby, data]) => ({ hobby, ...data }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredMembers]);

  // 类别分析数据（基于筛选后的会员）
  const categoryAnalysis = useMemo(() => {
    const categoryCount: { [key: string]: { count: number; members: Member[] } } = {};
    
    // 初始化所有类别选项
    CATEGORY_OPTIONS.forEach(category => {
      categoryCount[category] = { count: 0, members: [] };
    });

    // 统计每个类别的用户数量（基于筛选后的会员）
    filteredMembers.forEach(member => {
      if (member.profile?.categories) {
        member.profile.categories.forEach(category => {
          if (categoryCount[category]) {
            categoryCount[category].count++;
            categoryCount[category].members.push(member);
          }
        });
      }
    });

    // 转换为数组并按人数排序
    return Object.entries(categoryCount)
      .map(([category, data]) => ({ category, ...data }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredMembers]);

  // 行业分析数据（基于筛选后的会员）
  const industryAnalysis = useMemo(() => {
    const industryCount: { [key: string]: { count: number; members: Member[] } } = {};
    
    // 初始化所有行业选项
    INTERESTED_INDUSTRY_OPTIONS.forEach(industry => {
      industryCount[industry] = { count: 0, members: [] };
    });

    // 统计每个行业的用户数量（基于筛选后的会员）
    filteredMembers.forEach(member => {
      if (member.profile?.interestedIndustries) {
        member.profile.interestedIndustries.forEach(industry => {
          if (industryCount[industry]) {
            industryCount[industry].count++;
            industryCount[industry].members.push(member);
          }
        });
      }
    });

    // 转换为数组并按人数排序
    return Object.entries(industryCount)
      .map(([industry, data]) => ({ industry, ...data }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [filteredMembers]);

  // 生日宝宝数据（按月份筛选）
  const birthdayBabies = useMemo(() => {
    return filteredMembers.filter(member => {
      if (!member.profile?.birthDate) return false;
      
      try {
        // 解析生日日期 (dd-mmm-yyyy 格式)
        const birthDateStr = member.profile.birthDate;
        
        // 检查 birthDateStr 是否为字符串
        if (typeof birthDateStr !== 'string') {
          return false;
        }
        
        let birthDate: Date;
        
        // 尝试不同的日期格式解析
        if (birthDateStr.includes('-')) {
          // DD-MMM-YYYY 格式
          birthDate = new Date(birthDateStr);
        } else if (birthDateStr.includes('/')) {
          // DD/MM/YYYY 或其他格式
          birthDate = new Date(birthDateStr);
        } else {
          // 尝试直接解析
          birthDate = new Date(birthDateStr);
        }
        
        // 检查日期是否有效
        if (isNaN(birthDate.getTime())) {
          return false;
        }
        
        const birthMonth = birthDate.getMonth() + 1; // getMonth() 返回 0-11，需要 +1
        return birthMonth === selectedBirthdayMonth;
      } catch (error) {
        console.warn('解析生日日期失败:', member.profile.birthDate, error);
        return false;
      }
    }).sort((a, b) => {
      // 按生日日期排序
      try {
        const dateA = new Date(a.profile?.birthDate || '');
        const dateB = new Date(b.profile?.birthDate || '');
        
        // 检查日期是否有效
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0;
        }
        
        return dateA.getDate() - dateB.getDate();
      } catch {
        return 0;
      }
    });
  }, [filteredMembers, selectedBirthdayMonth]);

  // 月份选项
  const monthOptions = [
    { value: 1, label: '一月' },
    { value: 2, label: '二月' },
    { value: 3, label: '三月' },
    { value: 4, label: '四月' },
    { value: 5, label: '五月' },
    { value: 6, label: '六月' },
    { value: 7, label: '七月' },
    { value: 8, label: '八月' },
    { value: 9, label: '九月' },
    { value: 10, label: '十月' },
    { value: 11, label: '十一月' },
    { value: 12, label: '十二月' },
  ];

  // 筛选处理函数
  const handleHobbyFilter = (hobby: string) => {
    setSelectedHobby(selectedHobby === hobby ? '' : hobby);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  const handleIndustryFilter = (industry: string) => {
    setSelectedIndustry(selectedIndustry === industry ? '' : industry);
  };

  const clearAllFilters = () => {
    setSelectedHobby('');
    setSelectedCategory('');
    setSelectedIndustry('');
  };

  // 所有用户名单表格列定义（仅显示姓名）
  const allUsersColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 头部仪表板标题卡片 */}
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
              <DashboardOutlined style={{ fontSize: '32px', marginRight: '16px', color: 'white' }} />
              <div>
                <Title level={2} style={{ margin: 0, color: 'white' }}>
                  仪表板
                </Title>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                  JCI KL 会员管理系统
                </p>
              </div>
            </div>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>系统状态</div>
                <Progress 
                  percent={100} 
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

      {/* 分会信息卡片 */}
      {chapterLoading ? (
        <Card style={{ marginBottom: '24px' }}>
          <Spin />
        </Card>
      ) : chapterSettings ? (
        <Card 
          title={<><TrophyOutlined /> 分会信息</>} 
          style={{ marginBottom: '24px' }}
          extra={
            <Button 
              type="primary"
              onClick={() => navigate('/system-settings')}
              style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              编辑分会设置
            </Button>
          }
        >
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={12} md={6}>
              {chapterSettings.logoUrl && (
                <div style={{ textAlign: 'center' }}>
                  <Badge dot color="#52c41a" offset={[-5, 5]}>
                    <Image
                      src={chapterSettings.logoUrl}
                      alt="分会Logo"
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: 'contain',
                        borderRadius: '50%',
                        border: '3px solid #f0f0f0'
                      }}
                      preview={{
                        mask: <EyeOutlined style={{ fontSize: 16 }} />
                      }}
                    />
                  </Badge>
                </div>
              )}
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size="small">
                <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                  <InfoCircleOutlined style={{ marginRight: 8 }} />
                  {chapterSettings.chapterName}
                </Title>
                <Typography.Text type="secondary">
                  <CalendarOutlined style={{ marginRight: 8 }} />
                  成立年份：{chapterSettings.establishmentYear}
                </Typography.Text>
                {chapterSettings.description && (
                  <Typography.Text type="secondary">
                    {chapterSettings.description}
                  </Typography.Text>
                )}
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size="small">
                {chapterSettings.contactEmail && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <MailOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <Typography.Text>
                      {chapterSettings.contactEmail}
                    </Typography.Text>
                  </div>
                )}
                {chapterSettings.contactPhone && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <PhoneOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <Typography.Text>
                      {chapterSettings.contactPhone}
                    </Typography.Text>
                  </div>
                )}
                {chapterSettings.website && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <GlobalOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <a href={chapterSettings.website} target="_blank" rel="noopener noreferrer">
                      {chapterSettings.website}
                    </a>
                  </div>
                )}
              </Space>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Space direction="vertical" size="small">
                {chapterSettings.address && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <Typography.Text>
                      {chapterSettings.address}
                    </Typography.Text>
                  </div>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      ) : null}

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
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
              value={stats.totalMembers}
              prefix={<UserOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              全部注册会员
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
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
              value={stats.activeMembers}
              prefix={<TeamOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              当前活跃状态
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
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
              value={stats.pendingMembers}
              prefix={<CalendarOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              等待审核通过
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
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
              value={stats.newMembersThisMonth}
              prefix={<TrophyOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              本月新加入会员
            </div>
          </Card>
        </Col>
      </Row>

      {/* 生日宝宝卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <SmileOutlined style={{ color: '#fff', fontSize: '18px' }} />
                  <span style={{ color: '#fff', fontWeight: '600', fontSize: '16px' }}>生日宝宝</span>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}>
                  <span style={{ color: '#ff4d4f', fontWeight: '600', fontSize: '14px' }}>
                    {monthOptions.find(m => m.value === selectedBirthdayMonth)?.label} 
                    <span style={{ color: '#666', marginLeft: '4px' }}>
                      ({birthdayBabies.length} 位)
                    </span>
                  </span>
                </div>
              </div>
            }
            extra={
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontSize: '14px', 
                  fontWeight: '500' 
                }}>
                  选择月份：
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {monthOptions.map((month) => (
                    <Tag
                      key={month.value}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '20px',
                        padding: '6px 16px',
                        fontSize: '13px',
                        fontWeight: selectedBirthdayMonth === month.value ? '600' : '400',
                        border: 'none',
                        background: selectedBirthdayMonth === month.value 
                          ? 'rgba(255, 255, 255, 0.95)' 
                          : 'rgba(255, 255, 255, 0.2)',
                        color: selectedBirthdayMonth === month.value ? '#ff4d4f' : 'rgba(255, 255, 255, 0.9)',
                        transition: 'all 0.3s ease',
                        boxShadow: selectedBirthdayMonth === month.value 
                          ? '0 2px 8px rgba(255, 77, 79, 0.3)' 
                          : 'none'
                      }}
                      onClick={() => setSelectedBirthdayMonth(month.value)}
                    >
                      {month.label}
                    </Tag>
                  ))}
                </div>
              </div>
            }
            style={{ 
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 50%, #ffa8a8 100%)',
              border: 'none',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(255, 107, 107, 0.2)'
            }}
            styles={{ 
              body: { 
                padding: '32px',
                minHeight: '240px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '0 0 16px 16px'
              } 
            }}
          >
            {birthdayBabies.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '60px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                border: '2px dashed rgba(255, 255, 255, 0.3)'
              }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '80px',
                  height: '80px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  marginBottom: '24px'
                }}>
                  <SmileOutlined style={{ fontSize: '40px', color: 'rgba(255, 255, 255, 0.8)' }} />
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  marginBottom: '8px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: '600'
                }}>
                  本月暂无生日宝宝
                </div>
                <div style={{ 
                  fontSize: '14px', 
                  color: 'rgba(255, 255, 255, 0.7)',
                  lineHeight: '1.5'
                }}>
                  请选择其他月份查看生日会员
                </div>
              </div>
            ) : (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: '20px',
                padding: '8px'
              }}>
                {birthdayBabies.map((member) => {
                  let day = 0;
                  let month = 0;
                  
                  try {
                    const birthDate = new Date(member.profile?.birthDate || '');
                    if (!isNaN(birthDate.getTime())) {
                      day = birthDate.getDate();
                      month = birthDate.getMonth() + 1;
                    }
                  } catch (error) {
                    console.warn('解析生日日期失败:', member.profile?.birthDate, error);
                  }
                  
                  return (
                    <div
                      key={member.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '16px',
                        padding: '24px',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.1)';
                      }}
                      onClick={() => navigate(`/members/${member.id}`)}
                    >
                      {/* 装饰性背景 */}
                      <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 142, 142, 0.1))',
                        borderRadius: '50%',
                        zIndex: 0
                      }} />
                      
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <Avatar
                          size={72}
                          src={member.profile?.profilePhotoUrl}
                          icon={<UserOutlined />}
                          style={{
                            marginBottom: '16px',
                            border: '4px solid #fff',
                            boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)'
                          }}
                        />
                        
                        <div style={{ 
                          fontWeight: '600', 
                          fontSize: '18px', 
                          marginBottom: '6px',
                          color: '#333',
                          lineHeight: '1.3'
                        }}>
                          {member.name}
                        </div>
                        
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#666',
                          marginBottom: '12px',
                          background: 'rgba(0, 0, 0, 0.05)',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}>
                          {member.memberId}
                        </div>
                        
                        <div style={{
                          background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
                          color: 'white',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '600',
                          display: 'inline-block',
                          boxShadow: '0 2px 8px rgba(255, 107, 107, 0.3)'
                        }}>
                          {month}月{day}日
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 分析卡片和用户名单 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            title={
              <Space>
                <HeartOutlined style={{ color: '#ff4d4f' }} />
                <span>兴趣分析</span>
                {selectedHobby && <Tag color="blue" icon={<FilterOutlined />}>筛选中</Tag>}
              </Space>
            }
            style={{ height: '500px' }}
            styles={{ body: { height: 'calc(100% - 57px)', overflow: 'auto', padding: '16px' } }}
            extra={
              selectedHobby && (
                <Button 
                  type="text" 
                  size="small" 
                  icon={<ClearOutlined />}
                  onClick={() => setSelectedHobby('')}
                >
                  清除
                </Button>
              )
            }
          >
            <List
              dataSource={hobbyAnalysis.slice(0, 6)} // 显示前6个最受欢迎的兴趣
              loading={isLoading}
              renderItem={(item) => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedHobby === item.hobby ? '#e6f7ff' : 'transparent',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    margin: '4px 0',
                    border: selectedHobby === item.hobby ? '1px solid #1890ff' : '1px solid transparent',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleHobbyFilter(item.hobby)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ fontWeight: 'bold' }}>{item.hobby}</span>
                        {selectedHobby === item.hobby && (
                          <Tag color="blue" icon={<FilterOutlined />}>已选择</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space>
                        <span style={{ color: '#666' }}>{item.count} 位会员</span>
                        <Progress 
                          percent={Math.round((item.count / stats.totalMembers) * 100)} 
                          size="small" 
                          showInfo={false}
                          strokeColor="#1890ff"
                        />
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            title={
              <Space>
                <ApartmentOutlined style={{ color: '#52c41a' }} />
                <span>类别分析</span>
                {selectedCategory && <Tag color="green" icon={<FilterOutlined />}>筛选中</Tag>}
              </Space>
            }
            style={{ height: '500px' }}
            styles={{ body: { height: 'calc(100% - 57px)', overflow: 'auto', padding: '16px' } }}
            extra={
              selectedCategory && (
                <Button 
                  type="text" 
                  size="small" 
                  icon={<ClearOutlined />}
                  onClick={() => setSelectedCategory('')}
                >
                  清除
                </Button>
              )
            }
          >
            <List
              dataSource={categoryAnalysis}
              loading={isLoading}
              renderItem={(item) => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedCategory === item.category ? '#f6ffed' : 'transparent',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    margin: '4px 0',
                    border: selectedCategory === item.category ? '1px solid #52c41a' : '1px solid transparent',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleCategoryFilter(item.category)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ fontWeight: 'bold' }}>{item.category}</span>
                        {selectedCategory === item.category && (
                          <Tag color="green" icon={<FilterOutlined />}>已选择</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space>
                        <span style={{ color: '#666' }}>{item.count} 位会员</span>
                        <Progress 
                          percent={Math.round((item.count / stats.totalMembers) * 100)} 
                          size="small" 
                          showInfo={false}
                          strokeColor="#52c41a"
                        />
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            title={
              <Space>
                <ShopOutlined style={{ color: '#fa8c16' }} />
                <span>行业分析</span>
                {selectedIndustry && <Tag color="orange" icon={<FilterOutlined />}>筛选中</Tag>}
              </Space>
            }
            style={{ height: '500px' }}
            styles={{ body: { height: 'calc(100% - 57px)', overflow: 'auto', padding: '16px' } }}
            extra={
              selectedIndustry && (
                <Button 
                  type="text" 
                  size="small" 
                  icon={<ClearOutlined />}
                  onClick={() => setSelectedIndustry('')}
                >
                  清除
                </Button>
              )
            }
          >
            <List
              dataSource={industryAnalysis.slice(0, 6)} // 显示前6个最受欢迎的行业
              loading={isLoading}
              renderItem={(item) => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedIndustry === item.industry ? '#fff7e6' : 'transparent',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    margin: '4px 0',
                    border: selectedIndustry === item.industry ? '1px solid #fa8c16' : '1px solid transparent',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => handleIndustryFilter(item.industry)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span style={{ fontWeight: 'bold' }}>{item.industry}</span>
                        {selectedIndustry === item.industry && (
                          <Tag color="orange" icon={<FilterOutlined />}>已选择</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <Space>
                        <span style={{ color: '#666' }}>{item.count} 位会员</span>
                        <Progress 
                          percent={Math.round((item.count / stats.totalMembers) * 100)} 
                          size="small" 
                          showInfo={false}
                          strokeColor="#fa8c16"
                        />
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            title={
              <Space>
                <TeamOutlined style={{ color: '#722ed1' }} />
                <span>所有用户名单</span>
                {(selectedHobby || selectedCategory || selectedIndustry) && (
                  <Tag color="purple" icon={<FilterOutlined />}>已筛选</Tag>
                )}
              </Space>
            }
            extra={
              <Space size="small">
                <Button 
                  type="primary" 
                  onClick={() => navigate('/members')}
                  style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                >
                  管理会员
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  style={{ color: '#1890ff', borderColor: '#1890ff' }}
                >
                  添加会员
                </Button>
                {(selectedHobby || selectedCategory || selectedIndustry) && (
                  <Button 
                    onClick={clearAllFilters}
                    icon={<ClearOutlined />}
                    danger
                  >
                    清除筛选
                  </Button>
                )}
              </Space>
            }
            style={{ height: '500px' }}
            styles={{ body: { height: 'calc(100% - 57px)', overflow: 'auto', padding: '16px' } }}
          >
            <Table
              columns={allUsersColumns}
              dataSource={filteredMembers}
              loading={isLoading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
                pageSizeOptions: ['5', '10', '20', '50'],
              }}
              size="small"
              rowClassName={(_: any, index) => 
                index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
              }
            />
          </Card>
        </Col>
      </Row>

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
        .ant-list-item:hover {
          background-color: #f0f0f0 !important;
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
