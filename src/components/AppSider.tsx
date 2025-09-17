import React, { useState, useEffect } from 'react';
import { Layout, Menu, Image } from 'antd';
import {
  DashboardOutlined, 
  TeamOutlined, 
  UserOutlined,
  CalendarOutlined,
  DollarOutlined,
  MessageOutlined,
  SettingOutlined,
  FileTextOutlined,
  TrophyOutlined,
  FilePdfOutlined,
  PictureOutlined,
  FolderOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '@/contexts/SidebarContext';
import { ChapterSettings } from '@/types';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
// import { globalComponentService } from '@/config/globalComponentSettings';

const { Sider } = Layout;

const AppSider: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, setCollapsed, isMobile } = useSidebar();
  
  // 分会Logo状态管理
  const [chapterLogo, setChapterLogo] = useState<string>('/jci-logo.svg'); // 默认Logo
  const [chapterName, setChapterName] = useState<string>('JCI KL');

  // 加载分会设置并监听实时更新
  useEffect(() => {
    const CHAPTER_SETTINGS_COLLECTION = 'localChapter_Setting';
    const CHAPTER_SETTINGS_DOC_ID = 'main';
    
    // 设置实时监听
    const unsubscribe = onSnapshot(
      doc(db, CHAPTER_SETTINGS_COLLECTION, CHAPTER_SETTINGS_DOC_ID),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const settings = docSnapshot.data() as ChapterSettings;
          
          // 如果有自定义Logo，使用自定义Logo，否则使用默认Logo
          if (settings.logoUrl && settings.logoUrl.trim() !== '') {
            setChapterLogo(settings.logoUrl);
          } else {
            setChapterLogo('/jci-logo.svg');
          }
          
          // 设置分会名称
          if (settings.chapterName && settings.chapterName.trim() !== '') {
            setChapterName(settings.chapterName);
          } else {
            setChapterName('JCI KL');
          }
        } else {
          // 如果没有设置文档，使用默认值
          setChapterLogo('/jci-logo.svg');
          setChapterName('JCI KL');
        }
      },
      (error) => {
        console.error('监听分会设置失败:', error);
        // 出错时使用默认值
        setChapterLogo('/jci-logo.svg');
        setChapterName('JCI KL');
      }
    );

    // 清理监听器
    return () => {
      unsubscribe();
    };
  }, []);

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
      key: '/pdf-interpretation',
      icon: <FilePdfOutlined />,
      label: 'PDF解读',
    },
    {
      key: '/image-management',
      icon: <PictureOutlined />,
      label: '图片管理',
    },
    {
      key: '/folder-management',
      icon: <FolderOutlined />,
      label: '文件夹管理',
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
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: collapsed || isMobile ? 'column' : 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: collapsed || isMobile ? '4px' : '8px'
      }}>
        <Image
          src={chapterLogo}
          alt={`${chapterName} Logo`}
          preview={false}
          style={{
            height: collapsed || isMobile ? '32px' : '40px',
            width: collapsed || isMobile ? '32px' : '40px',
            transition: 'all 0.2s ease-in-out',
            objectFit: 'contain'
          }}
          onError={() => {
            // 如果自定义Logo加载失败，回退到默认Logo
            setChapterLogo('/jci-logo.svg');
          }}
        />
        {!collapsed && !isMobile && (
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#1890ff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '120px'
          }}>
            {chapterName}
          </div>
        )}
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
