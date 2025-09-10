import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { useAuthStore } from '@/store/authStore';
import { onAuthStateChanged } from '@/services/authService';
import { getMemberByEmail } from '@/services/memberService';
import { User } from 'firebase/auth';

// 页面组件
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import MemberListPage from '@/pages/MemberListPage';
import MemberDetailPage from '@/pages/MemberDetailPage';
import ProfilePage from '@/pages/ProfilePage';

// 布局组件
import AppHeader from '@/components/AppHeader';
import AppSider from '@/components/AppSider';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Content } = Layout;

const App: React.FC = () => {
  const { user, isLoading, setUser, setMember, setLoading } = useAuthStore();

  useEffect(() => {
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
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
