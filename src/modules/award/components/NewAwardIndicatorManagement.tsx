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
  Select,
  Modal,
  Form,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  StarOutlined,
  GiftOutlined,
  TrophyOutlined,
  SettingOutlined,
  ImportOutlined
} from '@ant-design/icons';
import { 
  AwardIndicator, 
  Indicator, 
  AwardLevel, 
  AwardIndicatorStats,
  AwardCategoryType
} from '@/types/awardIndicators';
import { awardIndicatorService } from '@/modules/award/services/awardIndicatorService';
import { getMembers } from '@/modules/member/services/memberService';
import ManageCategoryModal from '@/components/common/ManageCategoryModal';
import IndicatorCard from '@/components/common/IndicatorCard';
import StandardEditModal from '@/components/common/StandardEditModal';
import IndicatorBatchImportModal from '@/components/IndicatorBatchImportModal';

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
  const [currentYear, setCurrentYear] = useState<number>(year);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Manage Category Modal 状态
  const [manageCategoryModalVisible, setManageCategoryModalVisible] = useState(false);
  
  // StandardEditModal 状态
  const [standardEditModalVisible, setStandardEditModalVisible] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null);
  const [currentAwardIndicatorId, setCurrentAwardIndicatorId] = useState<string | null>(null);
  
  // 创建新指标年份 Modal 状态
  const [createYearModalVisible, setCreateYearModalVisible] = useState(false);
  const [createYearForm] = Form.useForm();
  
  // 批量导入 Modal 状态
  const [batchImportModalVisible, setBatchImportModalVisible] = useState(false);

  // 加载可用年份
  const loadAvailableYears = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const years = [];
      
      // 生成过去5年到未来2年的年份选项
      for (let i = currentYear - 5; i <= currentYear + 2; i++) {
        years.push(i);
      }
      
      setAvailableYears(years);
    } catch (error) {
      console.error('加载年份失败', error);
    }
  };

  // 数据加载
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 并行加载数据
      const [awardIndicatorsData, statsData, membersData] = await Promise.all([
        awardIndicatorService.getAllAwardIndicators(currentYear),
        awardIndicatorService.getAwardIndicatorStats(currentYear),
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
    loadAvailableYears();
  }, []);

  useEffect(() => {
    loadData();
  }, [currentYear]);

  // 处理奖励类别保存
  const handleCategorySave = async () => {
    try {
      await loadData(); // 重新加载数据
    } catch (error) {
      message.error('刷新数据失败');
      console.error(error);
    }
  };

  // 检查年份是否已存在
  const checkYearExists = async (year: number) => {
    try {
      const indicators = await awardIndicatorService.getAllAwardIndicators(year);
      return indicators.length > 0;
    } catch (error) {
      console.error('检查年份失败', error);
      return false;
    }
  };

  // 创建新指标年份
  const handleCreateYear = async () => {
    try {
      const values = await createYearForm.validateFields();
      const newYear = values.year;
      
      // 检查年份是否已存在
      const exists = await checkYearExists(newYear);
      if (exists) {
        message.error(`${newYear}年的奖励指标已存在，请选择其他年份`);
        return;
      }
      
      // 这里可以调用服务来创建新年份的默认指标
      // 暂时只是切换年份
      setCurrentYear(newYear);
      setCreateYearModalVisible(false);
      createYearForm.resetFields();
      message.success(`${newYear}年奖励指标创建成功`);
      
    } catch (error) {
      message.error('创建失败');
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

  // 处理批量导入
  const handleBatchImport = async (indicators: any[], _developerMode: boolean) => {
    try {
      let success = 0;
      let failed = 0;
      let created = 0;
      let updated = 0;
      const errors: string[] = [];

      for (const indicatorData of indicators) {
        try {
          // 根据类别找到对应的AwardIndicator
          const targetAwardIndicator = awardIndicators.find(ai => 
            ai.level === activeTab && 
            ai.category === indicatorData.category &&
            ai.year === currentYear
          );

          if (!targetAwardIndicator) {
            failed++;
            errors.push(`未找到类别 ${indicatorData.category} 对应的AwardIndicator`);
            continue;
          }

          // 检查是否已存在相同标题的指标
          const existingIndicator = targetAwardIndicator.indicators.find(ind => 
            ind.title === indicatorData.title
          );

          if (existingIndicator) {
            // 更新现有指标
            await awardIndicatorService.updateIndicator(existingIndicator.id, {
              ...indicatorData,
              awardIndicatorId: targetAwardIndicator.id,
              updatedBy: 'system'
            });
            updated++;
          } else {
            // 创建新指标
            const nextNo = await awardIndicatorService.getNextIndicatorNumber(targetAwardIndicator.id);
            const { no, ...indicatorDataWithoutNo } = indicatorData;
            await awardIndicatorService.saveIndicator({
              awardIndicatorId: targetAwardIndicator.id,
              no: nextNo,
              ...indicatorDataWithoutNo,
              createdBy: 'system'
            });
            created++;
          }
          success++;
        } catch (error) {
          failed++;
          errors.push(`指标 "${indicatorData.title}" 导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }

      return { success, failed, created, updated, errors };
    } catch (error) {
      throw error;
    }
  };

  // 处理指标保存
  const handleIndicatorSave = async (values: any) => {
    try {
      if (editingIndicatorId) {
        // 更新现有指标 - 需要处理类别变更
        let updateData = {
          ...values,
          updatedBy: 'system' // TODO: 从用户上下文获取
        };
        
        // 如果用户更改了类别，需要找到新的AwardIndicator
        if (values.category && activeTab === 'star_point') {
          const targetAwardIndicator = awardIndicators.find(ai => 
            ai.level === 'star_point' && 
            ai.category === values.category &&
            ai.year === currentYear
          );
          
          if (targetAwardIndicator) {
            updateData.awardIndicatorId = targetAwardIndicator.id;
            console.log('🔄 指标类别变更:', {
              indicatorId: editingIndicatorId,
              oldAwardIndicatorId: currentAwardIndicatorId,
              newCategory: values.category,
              newAwardIndicatorId: targetAwardIndicator.id,
              newTitle: targetAwardIndicator.title
            });
          } else {
            console.warn('⚠️ 更新时未找到对应的AwardIndicator:', values.category);
          }
        }
        
        await awardIndicatorService.updateIndicator(editingIndicatorId, updateData);
        message.success('指标更新成功');
      } else if (currentAwardIndicatorId) {
        // 创建新指标 - 需要根据选择的类别找到正确的AwardIndicator
        let targetAwardIndicatorId = currentAwardIndicatorId;
        
        // 如果用户选择了类别类型，需要找到对应的AwardIndicator
        if (values.category && activeTab === 'star_point') {
          const targetAwardIndicator = awardIndicators.find(ai => 
            ai.level === 'star_point' && 
            ai.category === values.category &&
            ai.year === currentYear
          );
          
          if (targetAwardIndicator) {
            targetAwardIndicatorId = targetAwardIndicator.id;
            console.log('🎯 根据类别选择找到目标AwardIndicator:', {
              selectedCategory: values.category,
              targetAwardIndicatorId,
              targetTitle: targetAwardIndicator.title
            });
          } else {
            console.warn('⚠️ 未找到对应的AwardIndicator:', values.category);
          }
        }
        
        const nextNo = await awardIndicatorService.getNextIndicatorNumber(targetAwardIndicatorId);
        await awardIndicatorService.saveIndicator({
          awardIndicatorId: targetAwardIndicatorId,
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
    let filteredIndicators = awardIndicators.filter(indicator => {
      // 只显示激活状态的类别
      if (indicator.status !== 'active') {
        return false;
      }
      
      if (activeTab === 'star_point') {
        // Star Point标签只显示非efficient_star的类别
        return indicator.level === 'star_point' && indicator.category !== 'efficient_star';
      }
      return indicator.level === activeTab;
    });
    
    return filteredIndicators;
  };

  // 获取Efficient Star指标（独立显示）
  const getEfficientStarIndicators = () => {
    return awardIndicators.filter(indicator => 
      indicator.level === 'star_point' && 
      indicator.category === 'efficient_star' &&
      indicator.status === 'active'
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

  // 获取指定层级的可用类别
  const getAvailableCategoriesForLevel = (level: AwardLevel): AwardCategoryType[] => {
    switch (level) {
      case 'star_point':
        return ['efficient_star', 'network_star', 'experience_star', 'outreach_star', 'social_star'];
      case 'national_area_incentive':
        return ['individual_award', 'local_organisation_award', 'area_award', 'special_award', 'jci_junior', 'youth_awards'];
      case 'e_awards':
        return ['multi_entry_award', 'best_of_the_best_award'];
      default:
        return [];
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
              奖励指标管理
            </Title>
            <Text type="secondary">统一管理所有奖励指标和类别</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Select
                value={currentYear}
                onChange={setCurrentYear}
                style={{ width: 120 }}
                placeholder="选择年份"
              >
                {availableYears.map(year => (
                  <Select.Option key={year} value={year}>
                    {year}年
                  </Select.Option>
                ))}
              </Select>
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
                onClick={() => setCreateYearModalVisible(true)}
              >
                创建新指标
              </Button>
              <Button 
                icon={<PlusOutlined />}
                onClick={() => setManageCategoryModalVisible(true)}
              >
                Manage Category
              </Button>
              <Button 
                icon={<ImportOutlined />}
                onClick={() => setBatchImportModalVisible(true)}
              >
                批量导入
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
                  {Number.isFinite(stats.totalIndicators) ? stats.totalIndicators : 0}
                </div>
                <Text type="secondary">总指标数</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {Number.isFinite(stats.completedIndicators) ? stats.completedIndicators : 0}
                </div>
                <Text type="secondary">已完成</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {Number.isFinite(stats.totalScore) ? stats.totalScore : 0}
                </div>
                <Text type="secondary">总分</Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#722ed1' }}>
                  {Number.isFinite(stats.completionRate) ? Math.round(stats.completionRate) : 0}%
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
        year={currentYear}
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

      {/* 批量导入 Modal */}
      <IndicatorBatchImportModal
        visible={batchImportModalVisible}
        onCancel={() => setBatchImportModalVisible(false)}
        onImport={handleBatchImport}
        awardLevel={activeTab}
        availableCategories={getAvailableCategoriesForLevel(activeTab)}
      />

      {/* 创建新指标年份 Modal */}
      <Modal
        title="创建新指标年份"
        open={createYearModalVisible}
        onCancel={() => {
          setCreateYearModalVisible(false);
          createYearForm.resetFields();
        }}
        onOk={handleCreateYear}
        destroyOnHidden
      >
        <Form
          form={createYearForm}
          layout="vertical"
          preserve={false}
        >
          <Form.Item
            name="year"
            label="选择年份"
            rules={[
              { required: true, message: '请选择年份' },
              { type: 'number', min: 2020, max: 2030, message: '年份必须在2020-2030之间' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="请输入年份"
              min={2020}
              max={2030}
            />
          </Form.Item>
          <Form.Item>
            <Text type="secondary">
              创建新年份的奖励指标后，将自动生成所有默认类别。每个年份的奖励指标独立管理。
            </Text>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NewAwardIndicatorManagement;
