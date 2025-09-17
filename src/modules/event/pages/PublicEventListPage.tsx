import React from 'react';
import { Layout, Typography, Row, Col, Card, Button, Space } from 'antd';
import { CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import EventList from '@/modules/event/components/EventList';

const { Title, Text } = Typography;
const { Content } = Layout;

const PublicEventListPage: React.FC = () => {
  const navigate = useNavigate();

  const handleEventSelect = (event: any) => {
    navigate(`/events/${event.id}`);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px', background: '#f5f5f5' }}>
        {/* 头部横幅 */}
        <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ color: 'white', margin: 0 }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                JCI Kuala Lumpur 活动
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                发现精彩活动，与我们一起成长
              </Text>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  ghost
                  icon={<SearchOutlined />}
                  onClick={() => {
                    // 滚动到搜索区域
                    document.getElementById('event-list')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  浏览活动
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 活动特色 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card hoverable>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', color: '#1890ff', marginBottom: 8 }}>
                  🎯
                </div>
                <Title level={4}>专业发展</Title>
                <Text type="secondary">
                  参加我们的技能发展活动，提升个人和职业能力
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', color: '#52c41a', marginBottom: 8 }}>
                  🤝
                </div>
                <Title level={4}>网络建立</Title>
                <Text type="secondary">
                  与志同道合的年轻专业人士建立有价值的联系
                </Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card hoverable>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '32px', color: '#fa8c16', marginBottom: 8 }}>
                  🌟
                </div>
                <Title level={4}>社区服务</Title>
                <Text type="secondary">
                  参与社区项目，为社会创造积极影响
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 活动列表 */}
        <div id="event-list">
          <EventList
            showCreateButton={false}
            showActions={false}
            onEventSelect={handleEventSelect}
            mode="public"
          />
        </div>
      </Content>
    </Layout>
  );
};

export default PublicEventListPage;
