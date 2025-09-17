import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { onAuthStateChanged } from '@/services/authService';
import { getMemberByEmail } from '@/modules/member/services/memberService';
import { User } from 'firebase/auth';
import { initChapterSettings } from '@/scripts/initChapterSettings';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

// 页面组件
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import MemberListPage from '@/modules/member/pages/MemberListPage';
import MemberDetailPage from '@/modules/member/pages/MemberDetailPage';
import ProfilePage from '@/modules/member/pages/ProfilePage';
import SystemSettingsPage from '@/modules/system/pages/SystemSettingsPage';
import SurveyListPage from '@/modules/survey/pages/SurveyListPage';
import SurveyCreatePage from '@/modules/survey/pages/SurveyCreatePage';
import SurveyEditPage from '@/modules/survey/pages/SurveyEditPage';
import SurveyDetailPage from '@/modules/survey/pages/SurveyDetailPage';
import SurveyResponsePage from '@/modules/survey/pages/SurveyResponsePage';
import FinancePage from '@/modules/finance/pages/FinancePage';
import EventManagementPage from '@/modules/event/pages/EventManagementPage';
import EventCreatePage from '@/modules/event/pages/EventCreatePage';
import EventDetailPage from '@/modules/event/pages/EventDetailPage';
import EventRegistrationPage from '@/modules/event/pages/EventRegistrationPage';
import EventRegistrationSuccessPage from '@/modules/event/pages/EventRegistrationSuccessPage';
import AwardsManagementWrapper from '@/modules/award/components/AwardsManagementWrapper';
import PDFInterpretationPage from '@/pages/PDFInterpretationPage';
import ImageManagementPage from '@/modules/image/pages/ImageManagementPage';
import FolderManagementPage from '@/pages/FolderManagementPage';

// 布局组件
import AppHeader from '@/components/AppHeader';
import AppSider from '@/components/AppSider';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Content } = Layout;

// Main content component that uses sidebar context
const MainContent: React.FC = () => {
  const { collapsed, isMobile } = useSidebar();
  
  // 计算侧边栏宽度
  const sidebarWidth = isMobile ? 0 : (collapsed ? 80 : 200);
  
  return (
    <Content style={{ 
      margin: `${isMobile ? '56px' : '64px'} 16px 24px 16px`, 
      padding: isMobile ? 16 : 24, 
      background: '#fff',
      marginLeft: `${sidebarWidth}px`,
      transition: 'margin-left 0.2s ease',
      minHeight: `calc(100vh - ${isMobile ? '56px' : '64px'})`
    }}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/members" element={<MemberListPage />} />
        <Route path="/members/:id" element={<MemberDetailPage />} />
        <Route path="/surveys" element={<SurveyListPage />} />
        <Route path="/surveys/create" element={<SurveyCreatePage />} />
        <Route path="/surveys/:id" element={<SurveyDetailPage />} />
        <Route path="/surveys/:id/edit" element={<SurveyEditPage />} />
        <Route path="/surveys/:id/response" element={<SurveyResponsePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/events" element={<EventManagementPage />} />
        <Route path="/events/create" element={<EventCreatePage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/events/:id/edit" element={<EventCreatePage />} />
        <Route path="/events/:id/register" element={<EventRegistrationPage />} />
        <Route path="/events/:id/registration-success" element={<EventRegistrationSuccessPage />} />
        <Route path="/awards" element={<AwardsManagementWrapper />} />
        <Route path="/awards/efficient-star" element={<AwardsManagementWrapper />} />
        <Route path="/awards/star-point" element={<AwardsManagementWrapper />} />
        <Route path="/awards/national-area-incentive" element={<AwardsManagementWrapper />} />
        <Route path="/awards/e-awards" element={<AwardsManagementWrapper />} />
        <Route path="/awards/tracker" element={<AwardsManagementWrapper />} />
        <Route path="/awards/competitors" element={<AwardsManagementWrapper />} />
        <Route path="/pdf-interpretation" element={<PDFInterpretationPage />} />
        <Route path="/image-management" element={<ImageManagementPage />} />
        <Route path="/folder-management" element={<FolderManagementPage />} />
        <Route path="/system-settings" element={<SystemSettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Content>
  );
};

const App: React.FC = () => {
  const { user, isLoading, setUser, setMember, setLoading } = useAuthStore();

  useEffect(() => {
    // 初始化分会设置
    initChapterSettings().catch(error => {
      console.error('初始化分会设置失败:', error);
    });

    const unsubscribe = onAuthStateChanged(async (user: User | null) => {
      setUser(user);
      
      if (user) {
        // 获取会员信息
        try {
          const memberData = await getMemberByEmail(user.email!);
          setMember(memberData);
        } catch (error) {
          console.error('获取会员信息失败:', error);
        }
      } else {
        setMember(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setMember, setLoading]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <SidebarProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <AppSider />
        <Layout>
          <AppHeader />
          <MainContent />
        </Layout>
      </Layout>
    </SidebarProvider>
  );
};

export default App;
