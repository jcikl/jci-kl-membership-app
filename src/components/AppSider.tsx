import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined, 
  TeamOutlined, 
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  MessageOutlined,
  SettingOutlined,
  SafetyOutlined,
  FileTextOutlined,
  TrophyOutlined,
  StarOutlined,
  GiftOutlined,
  SendOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;
const { Title } = Typography;

const AppSider: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/members',
      icon: <TeamOutlined />,
      label: '会员管理',
    },
    {
      key: '/surveys',
      icon: <FileTextOutlined />,
      label: '问卷管理',
    },
    {
      key: '/events',
      icon: <CalendarOutlined />,
      label: '活动管理',
    },
    {
      key: '/finance',
      icon: <DollarOutlined />,
      label: '财务管理',
    },
    {
      key: 'awards',
      icon: <TrophyOutlined />,
      label: '奖励管理',
      children: [
        {
          key: '/awards',
          icon: <TrophyOutlined />,
          label: '奖励仪表板',
        },
        {
          key: '/awards/efficient-star',
          icon: <StarOutlined />,
          label: 'Efficient Star',
        },
        {
          key: '/awards/star-point',
          icon: <GiftOutlined />,
          label: 'Star Point',
        },
        {
          key: '/awards/national-area-incentive',
          icon: <SendOutlined />,
          label: 'National & Area Incentive',
        },
        {
          key: '/awards/e-awards',
          icon: <TrophyOutlined />,
          label: 'E-Awards',
        },
        {
          key: '/awards/award-indicators',
          icon: <TrophyOutlined />,
          label: '奖励指标',
        },
        {
          key: '/awards/tracker',
          icon: <UserOutlined />,
          label: '活动追踪',
        },
        {
          key: '/awards/competitors',
          icon: <BarChartOutlined />,
          label: '竞争对手追踪',
        },
      ],
    },
    {
      key: '/messages',
      icon: <MessageOutlined />,
      label: '消息通知',
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: '/rbac-management',
      icon: <SafetyOutlined />,
      label: '权限管理',
    },
    {
      key: '/system-settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={setCollapsed}
      style={{
        background: '#fff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
      }}
    >
      <div style={{ 
        padding: '16px', 
        textAlign: 'center',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Title 
          level={4} 
          style={{ 
            margin: 0, 
            color: '#1890ff',
            fontSize: collapsed ? '14px' : '16px'
          }}
        >
          {collapsed ? 'JCI' : 'JCI KL'}
        </Title>
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ 
          border: 'none',
          background: 'transparent'
        }}
      />
    </Sider>
  );
};

export default AppSider;
