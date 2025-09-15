import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Typography,
  Tag,
  Space
} from 'antd';
import {
  StarOutlined,
  TrophyOutlined,
  SendOutlined,
  GiftOutlined,
  DashboardOutlined,
  UserOutlined,
  BarChartOutlined,
  EyeOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import EfficientStarAwardComponent from '@/components/EfficientStarAward';
import StarPointAwardComponent from '@/components/StarPointAward';
import NationalAreaIncentiveAwardComponent from '@/components/NationalAreaIncentiveAward';
import AwardsDashboard from '@/components/AwardsDashboard';
import ActivityParticipationTracker from '@/components/ActivityParticipationTracker';
import CompetitorScoreTracker from '@/components/CompetitorScoreTracker';
import EAwardsComponent from '@/components/EAwardsComponent';

const { Title } = Typography;

interface AwardsManagementPageProps {
  memberId?: string;
  isAdmin?: boolean;
  isDeveloper?: boolean;
}

const AwardsManagementPage: React.FC<AwardsManagementPageProps> = ({
  memberId,
  isAdmin = false,
  isDeveloper = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  // 检查是否有权限访问追踪功能
  const canAccessTracking = isAdmin || isDeveloper;

  // 根据URL路径设置活动标签页
  useEffect(() => {
    const path = location.pathname;
    if (path === '/awards') {
      setActiveTab('dashboard');
    } else if (path === '/awards/efficient-star') {
      setActiveTab('efficient_star');
    } else if (path === '/awards/star-point') {
      setActiveTab('star_point');
    } else if (path === '/awards/national-area-incentive') {
      setActiveTab('national_area_incentive');
    } else if (path === '/awards/e-awards') {
      setActiveTab('e_awards');
    } else if (path === '/awards/award-indicators') {
      setActiveTab('award_indicators');
    } else if (path === '/awards/tracker') {
      setActiveTab('tracker');
    } else if (path === '/awards/competitors') {
      setActiveTab('competitors');
    }
  }, [location.pathname]);


  const handleTabChange = (key: string) => {
    setActiveTab(key);
    const pathMap: Record<string, string> = {
      dashboard: '/awards',
      efficient_star: '/awards/efficient-star',
      star_point: '/awards/star-point',
      national_area_incentive: '/awards/national-area-incentive',
      e_awards: '/awards/e-awards',
      award_indicators: '/awards/award-indicators',
      tracker: '/awards/tracker',
      competitors: '/awards/competitors'
    };
    navigate(pathMap[key] || '/awards');
  };

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <DashboardOutlined />
          Dashboard
        </span>
      ),
      children: (
        <AwardsDashboard
          memberId={memberId}
          isAdmin={isAdmin}
        />
      ),
    },
    {
      key: 'efficient_star',
      label: (
        <span>
          <StarOutlined />
          Efficient Star
        </span>
      ),
      children: (
        <EfficientStarAwardComponent
          memberId={memberId}
          isAdmin={isAdmin}
        />
      ),
    },
    {
      key: 'star_point',
      label: (
        <span>
          <GiftOutlined />
          Star Point
        </span>
      ),
      children: (
        <StarPointAwardComponent
          memberId={memberId}
          isAdmin={isAdmin}
        />
      ),
    },
    {
      key: 'national_area_incentive',
      label: (
        <span>
          <SendOutlined />
          National & Area Incentive
        </span>
      ),
      children: (
        <NationalAreaIncentiveAwardComponent
          memberId={memberId}
          isAdmin={isAdmin}
        />
      ),
    },
    {
      key: 'e_awards',
      label: (
        <span>
          <TrophyOutlined />
          E-Awards
        </span>
      ),
      children: (
        <EAwardsComponent
          memberId={memberId}
          isAdmin={isAdmin}
          isDeveloper={isDeveloper}
        />
      ),
    },
    // 活动追踪标签 - 现在对管理员和开发者都可见
    ...(canAccessTracking ? [{
      key: 'tracker',
      label: (
        <span>
          <UserOutlined />
          <Space>
            Activity Tracker
            <Tag color="blue" icon={<EyeOutlined />}>
              Tracking
            </Tag>
          </Space>
        </span>
      ),
      children: (
        <ActivityParticipationTracker
          memberId={memberId}
          isDeveloper={isDeveloper}
        />
      ),
    }] : []),
    // 竞争对手追踪标签 - 现在对管理员和开发者都可见
    ...(canAccessTracking ? [{
      key: 'competitors',
      label: (
        <span>
          <BarChartOutlined />
          <Space>
            Competitor Tracker
            <Tag color="green" icon={<TeamOutlined />}>
              Analysis
            </Tag>
          </Space>
        </span>
      ),
      children: (
        <CompetitorScoreTracker
          isDeveloper={isDeveloper}
        />
      ),
    }] : []),
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <TrophyOutlined style={{ marginRight: 8 }} />
        Awards Management
        {canAccessTracking && (
          <Space style={{ marginLeft: 16 }}>
            <Tag color="blue" icon={<EyeOutlined />}>
              Activity Tracking Available
            </Tag>
            <Tag color="green" icon={<TeamOutlined />}>
              Competitor Analysis Available
            </Tag>
          </Space>
        )}
      </Title>

      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
    </div>
  );
};

export default AwardsManagementPage;
