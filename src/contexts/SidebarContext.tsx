import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { globalComponentService } from '@/config/globalComponentSettings';

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800
  });

  // 获取响应式断点配置
  const breakpoints = globalComponentService.getResponsiveConfig();

  // 计算设备类型
  const isMobile = screenSize.width < breakpoints.md;
  const isTablet = screenSize.width >= breakpoints.md && screenSize.width < breakpoints.lg;
  const isDesktop = screenSize.width >= breakpoints.lg;

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      const newSize = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      setScreenSize(newSize);

      // 当屏幕变小时自动收起侧边栏
      if (newSize.width < breakpoints.md && !collapsed) {
        setCollapsed(true);
      }
    };

    // 初始检查
    handleResize();

    // 添加事件监听器
    window.addEventListener('resize', handleResize);

    // 清理事件监听器
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoints.md, collapsed]);

  const toggleCollapsed = () => {
    setCollapsed(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ 
      collapsed, 
      setCollapsed, 
      toggleCollapsed,
      isMobile,
      isTablet,
      isDesktop
    }}>
      {children}
    </SidebarContext.Provider>
  );
};
