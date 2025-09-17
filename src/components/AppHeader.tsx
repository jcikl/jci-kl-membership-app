import React, { useEffect, useState } from 'react';
import { Layout, Dropdown, Avatar, Space, Typography, Button } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { logoutUser } from '@/services/authService';
import { getChapterSettings, getDefaultChapterSettings } from '@/modules/system/services/chapterSettingsService';
import type { ChapterSettings } from '@/types';
import { useSidebar } from '@/contexts/SidebarContext';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, member, logout } = useAuthStore();
  const { collapsed, isMobile } = useSidebar();
  const [chapterTitle, setChapterTitle] = useState<string>('');

  const handleLogout = async () => {
    try {
      await logoutUser();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失败:', error);
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  // 加载分会名称用于标题
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const settings: ChapterSettings | null = await getChapterSettings();
        if (!isMounted) return;
        if (settings && settings.chapterName) {
          setChapterTitle(settings.chapterName);
        } else {
          const defaults = getDefaultChapterSettings();
          setChapterTitle(defaults.chapterName);
        }
      } catch (e) {
        const defaults = getDefaultChapterSettings();
        setChapterTitle(defaults.chapterName);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // 计算侧边栏宽度
  const sidebarWidth = isMobile ? 0 : (collapsed ? 80 : 200);

  return (
    <Header 
      style={{ 
        background: '#fff', 
        padding: isMobile ? '0 16px' : '0 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        position: 'fixed',
        top: 0,
        left: `${sidebarWidth}px`,
        right: 0,
        zIndex: 1000,
        width: `calc(100% - ${sidebarWidth}px)`,
        transition: 'left 0.2s ease, width 0.2s ease',
        height: isMobile ? '56px' : '64px'
      }}
    >
      <div>
        <Typography.Title 
          level={4} 
          style={{ 
            margin: 0, 
            color: '#1890ff',
            fontSize: isMobile ? '16px' : '18px'
          }}
        >
          {isMobile 
            ? (chapterTitle ? `${chapterTitle}` : '管理系统')
            : (chapterTitle ? `${chapterTitle}管理系统` : '管理系统')
          }
        </Typography.Title>
      </div>
      
      <Space size={isMobile ? 'small' : 'middle'}>
        {!isMobile && (
          <Text strong style={{ fontSize: isMobile ? '12px' : '14px' }}>
            {member?.name || user?.displayName || '用户'}
          </Text>
        )}
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Button type="text" style={{ padding: 0 }}>
            <Avatar 
              size={isMobile ? 'small' : 'default'} 
              icon={<UserOutlined />} 
              src={member?.profile?.avatar}
            />
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;
