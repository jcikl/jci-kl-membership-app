import React, { useState } from 'react';
import { Layout, Typography, Tabs, Space, Button } from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  SettingOutlined,
  BarChartOutlined,
  TeamOutlined,
  FundOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import EventList from '@/components/EventList';
import EventStatistics from '@/components/EventStatistics';
import EventRegistrationManagement from '@/components/EventRegistrationManagement';
import EventSettings from '@/components/EventSettings';
import ProjectAccountManagement from '@/components/ProjectAccountManagement';
import ProjectAccountTracker from '@/components/ProjectAccountTracker';

const { Title } = Typography;
const { Content } = Layout;

const EventManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');

  const handleCreateEvent = () => {
    navigate('/events/create');
  };

  const handleEventSelect = (event: any) => {
    navigate(`/events/${event.id}`);
  };

  const tabItems = [
    {
      key: 'events',
      label: '活动管理',
      icon: <CalendarOutlined />,
      children: (
        <EventList
          showCreateButton={true}
          showActions={true}
          onEventSelect={handleEventSelect}
          mode="admin"
        />
      ),
    },
    {
      key: 'project-accounts',
      label: '项目户口',
      icon: <FundOutlined />,
      children: (
        <Tabs 
          defaultActiveKey="management" 
          items={[
            {
              key: 'management',
              label: '户口管理',
              children: <ProjectAccountManagement />
            },
            {
              key: 'tracker',
              label: '数据追踪',
              children: <ProjectAccountTracker />
            }
          ]} 
        />
      ),
    },
    {
      key: 'registrations',
      label: '注册管理',
      icon: <TeamOutlined />,
      children: <EventRegistrationManagement />,
    },
    {
      key: 'statistics',
      label: '数据统计',
      icon: <BarChartOutlined />,
      children: <EventStatistics />,
    },
    {
      key: 'settings',
      label: '系统设置',
      icon: <SettingOutlined />,
      children: <EventSettings />,
    },
  ];

  return (
    <Content style={{ padding: '24px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={2} style={{ margin: 0 }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              活动管理
            </Title>
            <p style={{ margin: 0, color: '#666' }}>
              管理JCI Kuala Lumpur的所有活动，包括创建、编辑、发布和统计分析
            </p>
          </div>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateEvent}
            >
              创建活动
            </Button>
          </Space>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </div>
    </Content>
  );
};

export default EventManagementPage;
