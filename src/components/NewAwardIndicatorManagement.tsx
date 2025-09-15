import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Tabs,
  Row,
  Col,
  message,
  Spin,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  StarOutlined,
  GiftOutlined,
  TrophyOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { 
  AwardIndicator, 
  Indicator, 
  AwardLevel, 
  AwardIndicatorStats 
} from '@/types/awardIndicators';
import { awardIndicatorService } from '@/services/awardIndicatorService';
import { getMembers } from '@/services/memberService';
import ManageCategoryModal from './common/ManageCategoryModal';
import IndicatorCard from './common/IndicatorCard';
import StandardEditModal from './common/StandardEditModal';

const { Title, Text } = Typography;

interface NewAwardIndicatorManagementProps {
  year?: number;
}

const NewAwardIndicatorManagement: React.FC<NewAwardIndicatorManagementProps> = ({
  year = new Date().getFullYear()
}) => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AwardLevel>('star_point');
  const [awardIndicators, setAwardIndicators] = useState<AwardIndicator[]>([]);
  const [stats, setStats] = useState<AwardIndicatorStats | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  
  // Manage Category Modal 状态
  const [manageCategoryModalVisible, setManageCategoryModalVisible] = useState(false);
  
  // StandardEditModal 状态
  const [standardEditModalVisible, setStandardEditModalVisible] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null);
  const [currentAwardIndicatorId, setCurrentAwardIndicatorId] = useState<string | null>(null);

  // 数据加载
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 并行加载数据
      const [awardIndicatorsData, statsData, membersData] = await Promise.all([
        awardIndicatorService.getAllAwardIndicators(year),
        awardIndicatorService.getAwardIndicatorStats(year),
        getMembers()
      ]);
      
      setAwardIndicators(awardIndicatorsData);
      setStats(statsData);
      setMembers(membersData.data || []);
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [year]);

  // 处理奖励类别保存
  const handleCategorySave = async () => {
    try {
      await loadData(); // 重新加载数据
    } catch (error) {
      message.error('刷新数据失败');
      console.error(error);
    }
  };

  // 处理指标编辑
  const handleEditIndicator = (indicator: Indicator) => {
    setEditingIndicator(indicator);
    setEditingIndicatorId(indicator.id);
    setStandardEditModalVisible(true);
  };

  // 处理指标查看
  const handleViewIndicator = (_indicator: Indicator) => {
    // TODO: 实现指标详情查看功能
    message.info('指标详情查看功能开发中');
  };

  // 处理指标删除
  const handleDeleteIndicator = async (indicatorId: string) => {
    try {
      await awardIndicatorService.deleteIndicator(indicatorId);
      message.success('指标删除成功');
      await loadData(); // 重新加载数据
    } catch (error) {
      message.error('删除指标失败');
      console.error(error);
    }
  };

  // 处理添加指标
  const handleAddIndicator = (awardIndicatorId: string) => {
    setEditingIndicator(null);
    setEditingIndicatorId(null);
    setCurrentAwardIndicatorId(awardIndicatorId);
    setStandardEditModalVisible(true);
  };

  // 处理指标保存
  const handleIndicatorSave = async (values: any) => {
    try {
      if (editingIndicatorId) {
        // 更新现有指标
        await awardIndicatorService.updateIndicator(editingIndicatorId, {
          ...values,
          updatedBy: 'system' // TODO: 从用户上下文获取
        });
        message.success('指标更新成功');
      } else if (currentAwardIndicatorId) {
        // 创建新指标
        const nextNo = await awardIndicatorService.getNextIndicatorNumber(currentAwardIndicatorId);
        await awardIndicatorService.saveIndicator({
          awardIndicatorId: currentAwardIndicatorId,
          no: nextNo,
          ...values,
          createdBy: 'system' // TODO: 从用户上下文获取
        });
        message.success('指标创建成功');
      }
      
      setStandardEditModalVisible(false);
      setEditingIndicator(null);
      setEditingIndicatorId(null);
      setCurrentAwardIndicatorId(null);
      await loadData(); // 重新加载数据
    } catch (error) {
      message.error('保存指标失败');
      console.error(error);
    }
  };

  // 获取当前标签页的奖励指标
  const getCurrentTabIndicators = () => {
    if (activeTab === 'star_point') {
      // Star Point标签只显示非efficient_star的类别
      return awardIndicators.filter(indicator => 
        indicator.level === 'star_point' && indicator.category !== 'efficient_star'
      );
    }
    return awardIndicators.filter(indicator => indicator.level === activeTab);
  };

  // 获取Efficient Star指标（独立显示）
  const getEfficientStarIndicators = () => {
    return awardIndicators.filter(indicator => 
      indicator.level === 'star_point' && indicator.category === 'efficient_star'
    );
  };

  // 渲染Efficient Star标签页
  const renderEfficientStarTab = () => {
    const efficientStarIndicators = getEfficientStarIndicators();
    
    if (efficientStarIndicators.length === 0) {
      return (
        <Empty
          description="暂无Efficient Star数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setManageCategoryModalVisible(true)}
          >
            创建Efficient Star类别
          </Button>
        </Empty>
      );
    }

    return (
      <div>
        {efficientStarIndicators.map(indicator => (
          <IndicatorCard
            key={indicator.id}
            awardIndicator={indicator}
            onEditIndicator={handleEditIndicator}
            onDeleteIndicator={handleDeleteIndicator}
            onAddIndicator={handleAddIndicator}
            onViewIndicator={handleViewIndicator}
          />
        ))}
      </div>
    );
  };

  // 渲染其他标签页（卡片式布局）
  const renderCardTab = () => {
    const currentIndicators = getCurrentTabIndicators();
    
    if (currentIndicators.length === 0) {
      return (
        <Empty
          description={`暂无${activeTab === 'star_point' ? 'Star Point' : 
                      activeTab === 'national_area_incentive' ? 'National & Area Incentive' : 
                      'E-Awards'}数据`}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setManageCategoryModalVisible(true)}
          >
            创建{activeTab === 'star_point' ? 'Star Point' : 
                 activeTab === 'national_area_incentive' ? 'National & Area Incentive' : 
                 'E-Awards'}类别
          </Button>
        </Empty>
      );
    }

    return (
      <div>
        {currentIndicators.map(indicator => (
          <IndicatorCard
            key={indicator.id}
            awardIndicator={indicator}
            onEditIndicator={handleEditIndicator}
            onDeleteIndicator={handleDeleteIndicator}
            onAddIndicator={handleAddIndicator}
            onViewIndicator={handleViewIndicator}
          />
        ))}
      </div>
    );
  };

  // 获取awardType用于StandardEditModal
  const getAwardTypeFromLevel = (level: AwardLevel) => {
    switch (level) {
      case 'star_point':
        return 'star_point';
      case 'national_area_incentive':
        return 'national_area_incentive';
      case 'e_awards':
        return 'efficient_star'; // 使用efficient_star作为默认类型
      default:
        return 'efficient_star';
    }
  };

  return (
    <div>
      {/* 页面标题和操作按钮 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={2} style={{ marginBottom: 0 }}>
              <SettingOutlined style={{ marginRight: 8, color: '#722ed1' }} />
              奖励指标管理 - {year}
            </Title>
            <Text type="secondary">统一管理所有奖励指标和类别</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={loadData}
                loading={loading}
              >
                刷新
              </Button>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setManageCategoryModalVisible(true)}
              >
                Manage Category
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计概览 */}
      {stats && (
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {stats.totalIndicators}
                </div>
                <Text type="secondary">总指标数</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {stats.completedIndicators}
                </div>
                <Text type="secondary">已完成</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {stats.totalScore}
                </div>
                <Text type="secondary">总分</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                  {Math.round(stats.completionRate)}%
                </div>
                <Text type="secondary">完成率</Text>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* 主标签页 */}
      <Card>
        <Spin spinning={loading}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as AwardLevel)}
            items={[
              {
                key: 'efficient_star',
                label: (
                  <span>
                    <StarOutlined />
                    Efficient Star
                  </span>
                ),
                children: renderEfficientStarTab()
              },
               {
                 key: 'star_point',
                 label: (
                   <span>
                     <GiftOutlined />
                     Star Point
                   </span>
                 ),
                 children: renderCardTab()
               },
               {
                 key: 'national_area_incentive',
                 label: (
                   <span>
                     <TrophyOutlined />
                     National & Area Incentive
                   </span>
                 ),
                 children: renderCardTab()
               },
               {
                 key: 'e_awards',
                 label: (
                   <span>
                     <StarOutlined />
                     E-Awards
                   </span>
                 ),
                 children: renderCardTab()
               }
            ]}
          />
        </Spin>
      </Card>

      {/* Manage Category Modal */}
      <ManageCategoryModal
        visible={manageCategoryModalVisible}
        onClose={() => setManageCategoryModalVisible(false)}
        year={year}
        onSave={handleCategorySave}
      />

      {/* StandardEditModal */}
      <StandardEditModal
        visible={standardEditModalVisible}
        onClose={() => {
          setStandardEditModalVisible(false);
          setEditingIndicatorId(null);
          setCurrentAwardIndicatorId(null);
        }}
        onSave={handleIndicatorSave}
        title={editingIndicator ? '编辑指标' : '创建指标'}
        initialValues={editingIndicator}
        members={members}
        awardType={getAwardTypeFromLevel(activeTab)}
        showTeamManagement={true}
        showCategorySelection={false}
        standardId={editingIndicatorId || undefined}
      />
    </div>
  );
};

export default NewAwardIndicatorManagement;
