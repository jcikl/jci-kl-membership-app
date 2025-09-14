import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { onAuthStateChanged } from '@/services/authService';
import { getMemberByEmail } from '@/services/memberService';
import { User } from 'firebase/auth';
import { initChapterSettings } from '@/scripts/initChapterSettings';
import { FiscalYearProvider } from '@/contexts/FiscalYearContext';

// 页面组件
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import MemberListPage from '@/pages/MemberListPage';
import MemberDetailPage from '@/pages/MemberDetailPage';
import ProfilePage from '@/pages/ProfilePage';
import SystemSettingsPage from '@/pages/SystemSettingsPage';
import SurveyListPage from '@/pages/SurveyListPage';
import SurveyCreatePage from '@/pages/SurveyCreatePage';
import SurveyEditPage from '@/pages/SurveyEditPage';
import SurveyDetailPage from '@/pages/SurveyDetailPage';
import SurveyResponsePage from '@/pages/SurveyResponsePage';
import FinancePage from '@/pages/FinancePage';
import EventManagementPage from '@/pages/EventManagementPage';
import EventCreatePage from '@/pages/EventCreatePage';
import EventDetailPage from '@/pages/EventDetailPage';
import EventRegistrationPage from '@/pages/EventRegistrationPage';
import EventRegistrationSuccessPage from '@/pages/EventRegistrationSuccessPage';
import AwardsManagementPage from '@/pages/AwardsManagementPage';

// RBAC组件
import RBACManagement from '@/components/rbac/RBACManagement';

// 布局组件
import AppHeader from '@/components/AppHeader';
import AppSider from '@/components/AppSider';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Content } = Layout;

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
    <FiscalYearProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <AppSider />
        <Layout>
          <AppHeader />
          <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
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
        <Route path="/awards" element={<AwardsManagementPage />} />
        <Route path="/awards/efficient-star" element={<AwardsManagementPage />} />
        <Route path="/awards/star-point" element={<AwardsManagementPage />} />
        <Route path="/awards/national-area-incentive" element={<AwardsManagementPage />} />
        <Route path="/awards/e-awards" element={<AwardsManagementPage />} />
        <Route path="/awards/historical" element={<AwardsManagementPage />} />
        <Route path="/awards/indicators" element={<AwardsManagementPage />} />
        <Route path="/awards/tracker" element={<AwardsManagementPage />} />
        <Route path="/awards/competitors" element={<AwardsManagementPage />} />
              <Route path="/rbac-management" element={<RBACManagement />} />
              <Route path="/system-settings" element={<SystemSettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </FiscalYearProvider>
  );
};

export default App;
