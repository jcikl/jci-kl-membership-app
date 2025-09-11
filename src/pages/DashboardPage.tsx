import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Space, Typography, List, Tag, Spin, Image, Progress, Badge, Avatar } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  DollarOutlined, 
  HeartOutlined, 
  ApartmentOutlined, 
  ShopOutlined, 
  InfoCircleOutlined, 
  EyeOutlined,
  TrophyOutlined,
  CrownOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  DashboardOutlined,
  FilterOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useMemberStore } from '@/store/memberStore';
import { Member, ChapterSettings } from '@/types';
import { HOBBY_OPTIONS, CATEGORY_OPTIONS, INTERESTED_INDUSTRY_OPTIONS } from '@/types/constants';
import { getChapterSettings } from '@/services/chapterSettingsService';

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
              rowClassName={(record, index) => 
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
