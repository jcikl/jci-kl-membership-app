import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import {
  DashboardOutlined, 
  TeamOutlined, 
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  MessageOutlined,
  SettingOutlined,
  FileTextOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
// import { globalComponentService } from '@/config/globalComponentSettings';

const { Sider } = Layout;
const { Title } = Typography;

const AppSider: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, setCollapsed, isMobile } = useSidebar();

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
      key: '/awards',
      icon: <TrophyOutlined />,
      label: '奖励管理',
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
      key: '/system-settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  // 获取响应式配置
  // const responsiveConfig = globalComponentService.getResponsiveConfig();

  return (
    <Sider 
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="md"
      collapsedWidth={isMobile ? 0 : 80}
      style={{
        background: '#fff',
        boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 999,
        height: '100vh',
        transition: 'all 0.2s ease-in-out'
      }}
    >
      <div style={{ 
        padding: isMobile ? '12px' : '16px', 
        textAlign: 'center',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Title 
          level={4} 
          style={{ 
            margin: 0, 
            color: '#1890ff',
            fontSize: collapsed || isMobile ? '14px' : '16px',
            transition: 'font-size 0.2s ease-in-out'
          }}
        >
          {collapsed || isMobile ? 'JCI' : 'JCI KL'}
        </Title>
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ 
          border: 'none',
          background: 'transparent',
          fontSize: isMobile ? '12px' : '14px'
        }}
        inlineCollapsed={collapsed || isMobile}
      />
    </Sider>
  );
};

export default AppSider;
