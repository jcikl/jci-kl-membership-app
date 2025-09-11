import React, { useEffect, useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Space, Typography, List, Tag, Spin, Image } from 'antd';
import { UserOutlined, TeamOutlined, CalendarOutlined, DollarOutlined, HeartOutlined, ApartmentOutlined, ShopOutlined, InfoCircleOutlined, EyeOutlined } from '@ant-design/icons';
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
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        仪表板
      </Title>

      {/* 分会信息卡片 */}
      {chapterLoading ? (
        <Card style={{ marginBottom: 24 }}>
          <Spin />
        </Card>
      ) : chapterSettings ? (
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              {chapterSettings.logoUrl && (
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Image
                    src={chapterSettings.logoUrl}
                    alt="分会Logo"
                    style={{
                      width: 80,
                      height: 80,
                      objectFit: 'contain',
                      borderRadius: 8,
                    }}
                    preview={{
                      mask: <EyeOutlined style={{ fontSize: 16 }} />
                    }}
                  />
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
                  成立年份：{chapterSettings.establishmentYear}
                </Typography.Text>
                {chapterSettings.description && (
                  <Typography.Text type="secondary">
                    {chapterSettings.description}
                  </Typography.Text>
                )}
              </Space>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Space direction="vertical" size="small">
                {chapterSettings.contactEmail && (
                  <Typography.Text>
                    <strong>邮箱：</strong>{chapterSettings.contactEmail}
                  </Typography.Text>
                )}
                {chapterSettings.contactPhone && (
                  <Typography.Text>
                    <strong>电话：</strong>{chapterSettings.contactPhone}
                  </Typography.Text>
                )}
                {chapterSettings.website && (
                  <Typography.Text>
                    <strong>网站：</strong>
                    <a href={chapterSettings.website} target="_blank" rel="noopener noreferrer">
                      {chapterSettings.website}
                    </a>
                  </Typography.Text>
                )}
              </Space>
            </Col>
            <Col xs={24} sm={24} md={8}>
              <Space direction="vertical" size="small">
                {chapterSettings.address && (
                  <Typography.Text>
                    <strong>地址：</strong>{chapterSettings.address}
                  </Typography.Text>
                )}
                <Button 
                  type="link" 
                  onClick={() => navigate('/system-settings')}
                  style={{ padding: 0, height: 'auto' }}
                >
                  编辑分会设置 →
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      ) : null}

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

      {/* 分析卡片和用户名单 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card 
            title={
              <Space>
                <HeartOutlined />
                兴趣分析
                {selectedHobby && <Tag color="blue">筛选中</Tag>}
              </Space>
            }
            style={{ height: '500px' }}
            bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
          >
            <List
              dataSource={hobbyAnalysis.slice(0, 6)} // 显示前6个最受欢迎的兴趣
              loading={isLoading}
              renderItem={(item) => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedHobby === item.hobby ? '#f0f0f0' : 'transparent',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    margin: '2px 0'
                  }}
                  onClick={() => handleHobbyFilter(item.hobby)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.hobby}</span>
                        {selectedHobby === item.hobby && <Tag color="blue">已选择</Tag>}
                      </Space>
                    }
                    description={`${item.count} 位会员`}
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
                <ApartmentOutlined />
                类别分析
                {selectedCategory && <Tag color="green">筛选中</Tag>}
              </Space>
            }
            style={{ height: '500px' }}
            bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
          >
            <List
              dataSource={categoryAnalysis}
              loading={isLoading}
              renderItem={(item) => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedCategory === item.category ? '#f0f0f0' : 'transparent',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    margin: '2px 0'
                  }}
                  onClick={() => handleCategoryFilter(item.category)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.category}</span>
                        {selectedCategory === item.category && <Tag color="green">已选择</Tag>}
                      </Space>
                    }
                    description={`${item.count} 位会员`}
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
                <ShopOutlined />
                行业分析
                {selectedIndustry && <Tag color="orange">筛选中</Tag>}
              </Space>
            }
            style={{ height: '500px' }}
            bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
          >
            <List
              dataSource={industryAnalysis.slice(0, 6)} // 显示前6个最受欢迎的行业
              loading={isLoading}
              renderItem={(item) => (
                <List.Item
                  style={{ 
                    cursor: 'pointer',
                    backgroundColor: selectedIndustry === item.industry ? '#f0f0f0' : 'transparent',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    margin: '2px 0'
                  }}
                  onClick={() => handleIndustryFilter(item.industry)}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>{item.industry}</span>
                        {selectedIndustry === item.industry && <Tag color="orange">已选择</Tag>}
                      </Space>
                    }
                    description={`${item.count} 位会员`}
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
                <TeamOutlined />
                所有用户名单
                {(selectedHobby || selectedCategory || selectedIndustry) && (
                  <Tag color="purple">已筛选</Tag>
                )}
              </Space>
            }
            extra={
              <Space>
                <Button type="primary" onClick={() => navigate('/members')}>
                  管理会员
                </Button>
                <Button onClick={() => navigate('/register')}>
                  添加会员
                </Button>
                {(selectedHobby || selectedCategory || selectedIndustry) && (
                  <Button onClick={clearAllFilters}>
                    清除筛选
                  </Button>
                )}
              </Space>
            }
            style={{ height: '500px' }}
            bodyStyle={{ height: 'calc(100% - 57px)', overflow: 'auto' }}
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
            />
          </Card>
        </Col>
      </Row>

    </div>
  );
};

export default DashboardPage;
