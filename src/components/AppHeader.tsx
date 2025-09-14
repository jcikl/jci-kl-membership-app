import React, { useEffect, useState } from 'react';
import { Layout, Dropdown, Avatar, Space, Typography, Button } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { logoutUser } from '@/services/authService';
import { getChapterSettings, getDefaultChapterSettings } from '@/services/chapterSettingsService';
import type { ChapterSettings } from '@/types';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, member, logout } = useAuthStore();
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

  return (
    <Header 
      style={{ 
        background: '#fff', 
        padding: '0 24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <div>
        <Typography.Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          {chapterTitle ? `${chapterTitle}管理系统` : '管理系统'}
        </Typography.Title>
      </div>
      
      <Space>
        <Text strong>{member?.name || user?.displayName || '用户'}</Text>
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Button type="text" style={{ padding: 0 }}>
            <Avatar 
              size="small" 
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
