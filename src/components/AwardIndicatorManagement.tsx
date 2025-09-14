import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Modal,
  Table,
  Space,
  Typography,
  message,
  Popconfirm,
  Tabs,
  Tag,
  Tooltip,
  Alert,
  Collapse,
  Row,
  Col,
  Divider,
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  StarOutlined,
  GiftOutlined,
  ReloadOutlined,
  FileTextOutlined,
  EyeOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { 
  EfficientStarAward,
  StarPointAward,
  NationalAreaIncentiveAward,
  EfficientStarStandard,
  StarCategory,
  StarActivity,
  IncentiveAward,
  StarCategoryType,
  AwardCategory,
  TeamManagement,
  TeamPosition,
  TeamMember
} from '@/types/awards';
import { awardService } from '@/services/awardService';
import { indicatorService } from '@/services/indicatorService';
import { getMembers } from '@/services/memberService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface AwardIndicatorManagementProps {
  year?: number;
}

const AwardIndicatorManagement: React.FC<AwardIndicatorManagementProps> = ({
  year = new Date().getFullYear()
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('efficient-star');
  
  // Filter states (from HistoricalIndicatorsView)
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AwardCategory | 'all'>('all');
  
  // Members for responsible person and team selection
  const [members, setMembers] = useState<any[]>([]);
  
  // Team management states
  const [teamManagementModalVisible, setTeamManagementModalVisible] = useState(false);
  const [selectedAwardForTeam, setSelectedAwardForTeam] = useState<{
    type: 'efficient_star' | 'star_point' | 'national_area_incentive';
    id: string;
    title: string;
  } | null>(null);
  const [teamManagement, setTeamManagement] = useState<TeamManagement | null>(null);
  
  // Efficient Star states
  const [efficientStarAward, setEfficientStarAward] = useState<EfficientStarAward | null>(null);
  const [efficientStarModalVisible, setEfficientStarModalVisible] = useState(false);
  const [editingStandard, setEditingStandard] = useState<EfficientStarStandard | null>(null);
  const [efficientStarForm] = Form.useForm();
  
  // Star Point states
  const [starPointAward, setStarPointAward] = useState<StarPointAward | null>(null);
  const [starPointModalVisible, setStarPointModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StarCategory | null>(null);
  const [starPointForm] = Form.useForm();
  
  // National & Area Incentive states
  const [nationalIncentiveAward, setNationalIncentiveAward] = useState<NationalAreaIncentiveAward | null>(null);
  const [nationalIncentiveModalVisible, setNationalIncentiveModalVisible] = useState(false);
  const [editingIncentiveAward, setEditingIncentiveAward] = useState<IncentiveAward | null>(null);
  const [nationalIncentiveForm] = Form.useForm();

  useEffect(() => {
    loadAvailableYears();
    loadAllAwards();
    loadMembers();
  }, [year]);

  useEffect(() => {
    if (selectedYears.length > 0) {
      loadAllAwards();
    }
  }, [selectedYears, selectedCategory]);

  const loadAvailableYears = async () => {
    try {
      const years = await indicatorService.getAvailableYears();
      setAvailableYears(years);
      // 默认选择当前年份
      setSelectedYears([year]);
    } catch (error) {
      message.error('加载可用年份失败');
      console.error(error);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await getMembers({ page: 1, limit: 1000 });
      setMembers(response.data);
    } catch (error) {
      message.error('加载会员列表失败');
      console.error(error);
    }
  };

  const loadAllAwards = async () => {
    try {
      setLoading(true);
      const [efficientStar, starPoint, nationalIncentive] = await Promise.all([
        awardService.getEfficientStarAward(year),
        awardService.getStarPointAward(year),
        awardService.getNationalAreaIncentiveAward(year)
      ]);
      
      setEfficientStarAward(efficientStar);
      setStarPointAward(starPoint);
      setNationalIncentiveAward(nationalIncentive);
    } catch (error) {
      message.error('加载奖励数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (years: number[]) => {
    setSelectedYears(years);
  };

  const handleCategoryChange = (category: AwardCategory | 'all') => {
    setSelectedCategory(category);
  };


  const getCategoryName = (category: AwardCategory) => {
    switch (category) {
      case 'efficient_star':
        return 'Efficient Star';
      case 'star_point':
        return 'Star Point';
      case 'national_area_incentive':
        return 'National & Area Incentive';
      case 'e_awards':
        return 'E-Awards';
      default:
        return category;
    }
  };

  const exportData = () => {
    message.info('导出功能开发中...');
  };

  // ========== Team Management Functions ==========
  
  const handleTeamManagementOpen = (awardType: 'efficient_star' | 'star_point' | 'national_area_incentive', awardId: string, title: string) => {
    setSelectedAwardForTeam({ type: awardType, id: awardId, title });
    setTeamManagementModalVisible(true);
    loadTeamManagement(awardType, awardId);
  };

  const loadTeamManagement = async (awardType: 'efficient_star' | 'star_point' | 'national_area_incentive', awardId: string) => {
    try {
      // 这里应该调用API加载团队管理数据
      // 暂时创建默认的团队管理结构
      const defaultTeamManagement: TeamManagement = {
        id: `team_${awardType}_${awardId}`,
        awardType,
        awardId,
        positions: [],
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTeamManagement(defaultTeamManagement);
    } catch (error) {
      message.error('加载团队管理数据失败');
      console.error(error);
    }
  };

  const handleCreatePosition = () => {
    const newPosition: TeamPosition = {
      id: `position_${Date.now()}`,
      name: '',
      description: '',
      responsibilities: [],
      isRequired: false,
      order: (teamManagement?.positions.length || 0) + 1
    };
    
    if (teamManagement) {
      const updatedTeamManagement = {
        ...teamManagement,
        positions: [...teamManagement.positions, newPosition],
        updatedAt: new Date().toISOString()
      };
      setTeamManagement(updatedTeamManagement);
    }
  };

  const handleUpdatePosition = (positionId: string, updates: Partial<TeamPosition>) => {
    if (teamManagement) {
      const updatedPositions = teamManagement.positions.map(pos => 
        pos.id === positionId ? { ...pos, ...updates } : pos
      );
      const updatedTeamManagement = {
        ...teamManagement,
        positions: updatedPositions,
        updatedAt: new Date().toISOString()
      };
      setTeamManagement(updatedTeamManagement);
    }
  };

  const handleDeletePosition = (positionId: string) => {
    if (teamManagement) {
      const updatedPositions = teamManagement.positions.filter(pos => pos.id !== positionId);
      const updatedMembers = teamManagement.members.filter(member => member.positionId !== positionId);
      const updatedTeamManagement = {
        ...teamManagement,
        positions: updatedPositions,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };
      setTeamManagement(updatedTeamManagement);
    }
  };

  const handleAssignMember = (memberId: string, memberName: string, positionId: string, positionName: string) => {
    if (teamManagement) {
      const newMember: TeamMember = {
        id: `member_${Date.now()}`,
        memberId,
        memberName,
        positionId,
        positionName,
        assignedAt: new Date().toISOString(),
        assignedBy: 'current_user', // 这里应该从认证状态获取
        status: 'active'
      };
      
      const updatedTeamManagement = {
        ...teamManagement,
        members: [...teamManagement.members, newMember],
        updatedAt: new Date().toISOString()
      };
      setTeamManagement(updatedTeamManagement);
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (teamManagement) {
      const updatedMembers = teamManagement.members.filter(member => member.id !== memberId);
      const updatedTeamManagement = {
        ...teamManagement,
        members: updatedMembers,
        updatedAt: new Date().toISOString()
      };
      setTeamManagement(updatedTeamManagement);
    }
  };

  // ========== Efficient Star Management ==========
  
  const handleEfficientStarStandardEdit = (standard: EfficientStarStandard) => {
    setEditingStandard(standard);
    efficientStarForm.setFieldsValue({
      ...standard,
      deadline: standard.deadline ? dayjs(standard.deadline) : undefined
    });
    setEfficientStarModalVisible(true);
  };

  const handleEfficientStarStandardCreate = () => {
    setEditingStandard(null);
    efficientStarForm.resetFields();
    setEfficientStarModalVisible(true);
  };

  const handleEfficientStarStandardSave = async () => {
    try {
      const values = await efficientStarForm.validateFields();
      
      if (!efficientStarAward) {
        message.error('Efficient Star奖励数据未加载');
        return;
      }

      const updatedStandards = [...efficientStarAward.standards];
      
      if (editingStandard) {
        // Update existing standard
        const index = updatedStandards.findIndex(s => s.id === editingStandard.id);
        if (index >= 0) {
          updatedStandards[index] = {
            ...values,
            id: editingStandard.id,
            deadline: values.deadline?.format('YYYY-MM-DD') || '',
            status: editingStandard.status,
            myScore: editingStandard.myScore
          };
        }
      } else {
        // Create new standard
        const newStandard: EfficientStarStandard = {
          ...values,
          id: `standard_${Date.now()}`,
          deadline: values.deadline?.format('YYYY-MM-DD') || '',
          status: 'pending' as const,
          myScore: 0
        };
        updatedStandards.push(newStandard);
      }

      const updatedAward = {
        ...efficientStarAward,
        standards: updatedStandards,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveEfficientStarAward(updatedAward);
      setEfficientStarAward(updatedAward);
      setEfficientStarModalVisible(false);
      message.success(editingStandard ? '标准更新成功' : '标准创建成功');
    } catch (error) {
      message.error('保存失败');
      console.error(error);
    }
  };

  const handleEfficientStarStandardDelete = async (standardId: string) => {
    try {
      if (!efficientStarAward) return;

      const updatedStandards = efficientStarAward.standards.filter(s => s.id !== standardId);
      const updatedAward = {
        ...efficientStarAward,
        standards: updatedStandards,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveEfficientStarAward(updatedAward);
      setEfficientStarAward(updatedAward);
      message.success('标准删除成功');
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // ========== Star Point Management ==========
  
  const handleStarCategoryEdit = (category: StarCategory) => {
    setEditingCategory(category);
    starPointForm.setFieldsValue(category);
    setStarPointModalVisible(true);
  };

  const handleStarCategoryCreate = () => {
    setEditingCategory(null);
    starPointForm.resetFields();
    setStarPointModalVisible(true);
  };

  const handleStarCategorySave = async () => {
    try {
      const values = await starPointForm.validateFields();
      
      if (!starPointAward) {
        message.error('Star Point奖励数据未加载');
        return;
      }

      const updatedCategories = [...starPointAward.starCategories];
      
      if (editingCategory) {
        // Update existing category
        const index = updatedCategories.findIndex(c => c.id === editingCategory.id);
        if (index >= 0) {
          updatedCategories[index] = {
            ...values,
            id: editingCategory.id,
            activities: editingCategory.activities,
            myPoints: editingCategory.myPoints
          };
        }
      } else {
        // Create new category
        const newCategory: StarCategory = {
          ...values,
          id: `category_${Date.now()}`,
          activities: [],
          myPoints: 0
        };
        updatedCategories.push(newCategory);
      }

      const updatedAward = {
        ...starPointAward,
        starCategories: updatedCategories,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveStarPointAward(updatedAward);
      setStarPointAward(updatedAward);
      setStarPointModalVisible(false);
      message.success(editingCategory ? '类别更新成功' : '类别创建成功');
    } catch (error) {
      message.error('保存失败');
      console.error(error);
    }
  };

  const handleStarCategoryDelete = async (categoryId: string) => {
    try {
      if (!starPointAward) return;

      const updatedCategories = starPointAward.starCategories.filter(c => c.id !== categoryId);
      const updatedAward = {
        ...starPointAward,
        starCategories: updatedCategories,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveStarPointAward(updatedAward);
      setStarPointAward(updatedAward);
      message.success('类别删除成功');
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // ========== National & Area Incentive Management ==========
  
  const handleIncentiveAwardEdit = (award: IncentiveAward) => {
    setEditingIncentiveAward(award);
    nationalIncentiveForm.setFieldsValue(award);
    setNationalIncentiveModalVisible(true);
  };

  const handleIncentiveAwardCreate = () => {
    setEditingIncentiveAward(null);
    nationalIncentiveForm.resetFields();
    setNationalIncentiveModalVisible(true);
  };

  const handleIncentiveAwardSave = async () => {
    try {
      const values = await nationalIncentiveForm.validateFields();
      
      if (!nationalIncentiveAward) {
        message.error('National & Area Incentive奖励数据未加载');
        return;
      }

      const updatedCategories = [...nationalIncentiveAward.awardCategories];
      
      if (editingIncentiveAward) {
        // Update existing award
        const categoryIndex = updatedCategories.findIndex(c => 
          c.awards.some(a => a.id === editingIncentiveAward.id)
        );
        if (categoryIndex >= 0) {
          const awardIndex = updatedCategories[categoryIndex].awards.findIndex(
            a => a.id === editingIncentiveAward.id
          );
          if (awardIndex >= 0) {
            updatedCategories[categoryIndex].awards[awardIndex] = {
              ...values,
              id: editingIncentiveAward.id
            };
          }
        }
      } else {
        // Create new award - add to first category for now
        if (updatedCategories.length > 0) {
          const newAward: IncentiveAward = {
            ...values,
            id: `award_${Date.now()}`
          };
          updatedCategories[0].awards.push(newAward);
        }
      }

      const updatedAward = {
        ...nationalIncentiveAward,
        awardCategories: updatedCategories,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveNationalAreaIncentiveAward(updatedAward);
      setNationalIncentiveAward(updatedAward);
      setNationalIncentiveModalVisible(false);
      message.success(editingIncentiveAward ? '奖项更新成功' : '奖项创建成功');
    } catch (error) {
      message.error('保存失败');
      console.error(error);
    }
  };

  const handleIncentiveAwardDelete = async (awardId: string) => {
    try {
      if (!nationalIncentiveAward) return;

      const updatedCategories = nationalIncentiveAward.awardCategories.map(category => ({
        ...category,
        awards: category.awards.filter(a => a.id !== awardId)
      }));

      const updatedAward = {
        ...nationalIncentiveAward,
        awardCategories: updatedCategories,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveNationalAreaIncentiveAward(updatedAward);
      setNationalIncentiveAward(updatedAward);
      message.success('奖项删除成功');
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // ========== Helper Functions ==========
  
  const getStarIcon = (type: StarCategoryType) => {
    switch (type) {
      case 'network_star':
        return <StarOutlined style={{ color: '#1890ff' }} />;
      case 'experience_star':
        return <StarOutlined style={{ color: '#52c41a' }} />;
      case 'social_star':
        return <StarOutlined style={{ color: '#fa8c16' }} />;
      case 'outreach_star':
        return <StarOutlined style={{ color: '#eb2f96' }} />;
      default:
        return <StarOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStarTitle = (type: StarCategoryType) => {
    switch (type) {
      case 'network_star':
        return 'Network Star';
      case 'experience_star':
        return 'Experience Star';
      case 'social_star':
        return 'Social Star';
      case 'outreach_star':
        return 'Outreach Star';
      default:
        return 'Unknown Star';
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag>;
      case 'closed':
        return <Tag color="red" icon={<ExclamationCircleOutlined />}>已关闭</Tag>;
      default:
        return <Tag color="blue" icon={<ClockCircleOutlined />}>开放中</Tag>;
    }
  };

  const getNationalAllocationColor = (allocation: string) => {
    if (allocation.includes('**')) return '#f5222d';
    if (allocation.includes('*')) return '#fa8c16';
    return '#52c41a';
  };

  const getAreaAllocationColor = (allocation: string) => {
    if (allocation === '-') return '#d9d9d9';
    if (allocation.includes('*')) return '#fa8c16';
    return '#52c41a';
  };

  // ========== Render Functions ==========
  
  const renderEfficientStarTab = () => (
    <div>
      {efficientStarAward ? (
        <>
          {/* Header Card - 完全符合原始UI */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={24}>
              <Col span={16}>
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ color: '#1890ff', marginBottom: 8 }}>
                    {efficientStarAward.title}
                  </Title>
                  <Text strong style={{ color: '#1890ff' }}>
                    {efficientStarAward.description}
                  </Text>
                </div>
                <Divider />
                <Space direction="vertical" size="small">
                  <Button type="primary" icon={<FileTextOutlined />}>
                    Submit Score
                  </Button>
                  <Button icon={<EyeOutlined />}>
                    View History
                  </Button>
                </Space>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ backgroundColor: '#f0f9ff', border: '1px solid #1890ff' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#1890ff', marginBottom: 8 }}>
                      Achievement Tiers
                    </Title>
                    {efficientStarAward.criteria.tiers.map((tier, index) => (
                      <div key={index} style={{ marginBottom: 8 }}>
                        <Text strong style={{ color: '#1890ff' }}>
                          {tier.score}: {tier.award}
                        </Text>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* Standards Table - 完全符合原始UI */}
          <Card 
            title="Standards and Tasks"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleEfficientStarStandardCreate}
              >
                Add Standard
              </Button>
            }
          >
            <Table
              dataSource={efficientStarAward.standards}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
            >
              <Table.Column
                title="NO."
                dataIndex="no"
                width={60}
                align="center"
              />
              
              <Table.Column
                title="STANDARDS"
                dataIndex="title"
                render={(title, record: EfficientStarStandard) => (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <Text strong>{title}</Text>
                      {record.guidelines && (
                        <Button
                          type="link"
                          size="small"
                          icon={<FileTextOutlined />}
                          style={{ marginLeft: 8 }}
                        >
                          Guideline
                        </Button>
                      )}
                    </div>
                    <Text type="secondary">{record.description}</Text>
                    
                    {/* 子标准 */}
                    {record.subStandards && record.subStandards.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        {record.subStandards.map((subStandard) => (
                          <div key={subStandard.id} style={{ marginBottom: 8, paddingLeft: 16 }}>
                            <div style={{ marginBottom: 4 }}>
                              <Text strong>{subStandard.no} {subStandard.title}</Text>
                              {subStandard.guidelines && (
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<FileTextOutlined />}
                                  style={{ marginLeft: 8 }}
                                >
                                  Guideline
                                </Button>
                              )}
                            </div>
                            <Text type="secondary">{subStandard.description}</Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              />
              
              <Table.Column
                title="DEADLINE/CRITERIA"
                dataIndex="deadline"
                width={120}
                align="center"
              />
              
              <Table.Column
                title="SCORE"
                dataIndex="score"
                width={80}
                align="center"
                render={(score) => (
                  <Text strong>{score}%</Text>
                )}
              />
              
              <Table.Column
                title="MY SCORE"
                width={120}
                align="center"
                render={(_, record: EfficientStarStandard) => (
                  record.myScore !== undefined && record.myScore > 0 ? (
                    <Text strong style={{ color: '#52c41a' }}>
                      {record.myScore}%
                    </Text>
                  ) : (
                    <Text type="secondary">-</Text>
                  )
                )}
              />
              
              <Table.Column
                title="负责人"
                width={120}
                align="center"
                render={(_, record: EfficientStarStandard) => (
                  record.responsiblePerson ? (
                    <Text>{record.responsiblePerson}</Text>
                  ) : (
                    <Text type="secondary">-</Text>
                  )
                )}
              />
              
              <Table.Column
                title="团队"
                width={150}
                align="center"
                render={(_, record: EfficientStarStandard) => (
                  record.team && record.team.length > 0 ? (
                    <div>
                      {record.team.slice(0, 2).map((member, index) => (
                        <Tag key={index} style={{ marginBottom: 2, fontSize: '12px' }}>
                          {member}
                        </Tag>
                      ))}
                      {record.team.length > 2 && (
                        <Tag style={{ fontSize: '12px' }}>+{record.team.length - 2}</Tag>
                      )}
                    </div>
                  ) : (
                    <Text type="secondary">-</Text>
                  )
                )}
              />
              
              <Table.Column
                title="ACTION"
                width={180}
                render={(_, record: EfficientStarStandard) => (
                  <Space>
                    <Tooltip title="编辑">
                      <Button 
                        type="text" 
                        icon={<EditOutlined />} 
                        onClick={() => handleEfficientStarStandardEdit(record)}
                      />
                    </Tooltip>
                    <Tooltip title="团队管理">
                      <Button 
                        type="text" 
                        icon={<UserOutlined />} 
                        onClick={() => handleTeamManagementOpen('efficient_star', record.id, record.title)}
                      />
                    </Tooltip>
                    <Popconfirm
                      title="确定删除此标准？"
                      onConfirm={() => handleEfficientStarStandardDelete(record.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Tooltip title="删除">
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                )}
              />
            </Table>
          </Card>
        </>
      ) : (
        <Alert 
          message="暂无数据" 
          description="请先初始化Efficient Star奖励数据" 
          type="info" 
        />
      )}
    </div>
  );

  const renderStarPointTab = () => (
    <div>
      {starPointAward ? (
        <>
          {/* Header Card - 完全符合原始UI */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={24}>
              <Col span={16}>
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ color: '#52c41a', marginBottom: 8 }}>
                    {starPointAward.title}
                  </Title>
                  <Text strong style={{ color: '#52c41a' }}>
                    {starPointAward.description}
                  </Text>
                </div>
                <Divider />
                <Space direction="vertical" size="small">
                  <Button type="primary" icon={<FileTextOutlined />}>
                    Submit Score
                  </Button>
                  <Button icon={<EyeOutlined />}>
                    View History
                  </Button>
                </Space>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #52c41a' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#52c41a', marginBottom: 8 }}>
                      Terms & Conditions
                    </Title>
                    {starPointAward.terms.map((term, index) => (
                      <div key={index} style={{ marginBottom: 4 }}>
                        <Text style={{ fontSize: 12 }}>• {term}</Text>
                      </div>
                    ))}
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* Star Categories - 完全符合原始UI */}
          <Card 
            title="Star Categories"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleStarCategoryCreate}
              >
                Add Category
              </Button>
            }
          >
            <Collapse
              defaultActiveKey={['0']} 
              ghost
              items={starPointAward.starCategories.map((category, categoryIndex) => ({
                key: categoryIndex.toString(),
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {getStarIcon(category.type)}
                      <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                        {getStarTitle(category.type)} - [{category.myPoints} point{category.myPoints !== 1 ? 's' : ''}]
                      </span>
                    </div>
                    <div>
                      <Text type="secondary">
                        {category.myPoints} / {category.points} Points
                      </Text>
                    </div>
                  </div>
                ),
                children: (
                  <>
                    <Card size="small" style={{ marginBottom: 16 }}>
                      <Paragraph style={{ marginBottom: 8 }}>
                        <Text strong>Description:</Text> {category.description}
                      </Paragraph>
                      <Paragraph style={{ marginBottom: 8 }}>
                        <Text strong>Objective:</Text> {category.objective}
                      </Paragraph>
                      {category.note && (
                        <Alert
                          message="Note"
                          description={category.note}
                          type="warning"
                          showIcon
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </Card>

                    <Table
                      dataSource={category.activities}
                      rowKey="id"
                      pagination={false}
                      size="small"
                    >
                      <Table.Column
                        title="NO."
                        dataIndex="no"
                        width={60}
                        align="center"
                      />
                      
                      <Table.Column
                        title="DETAILS"
                        dataIndex="title"
                        render={(title, record: StarActivity) => (
                          <div>
                            <div style={{ marginBottom: 4 }}>
                              <Text strong>{title}</Text>
                              {record.guidelines && (
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<FileTextOutlined />}
                                  style={{ marginLeft: 8 }}
                                >
                                  Guideline
                                </Button>
                              )}
                            </div>
                            <Text type="secondary">{record.description}</Text>
                          </div>
                        )}
                      />
                      
                      <Table.Column
                        title="SCORE"
                        dataIndex="score"
                        width={200}
                        render={(score) => (
                          <Text style={{ fontSize: 12 }}>{score}</Text>
                        )}
                      />
                      
                      <Table.Column
                        title="MY SCORE"
                        width={100}
                        align="center"
                        render={(_, record: StarActivity) => (
                          record.myScore !== undefined ? (
                            <Text strong style={{ color: '#52c41a' }}>
                              {record.myScore}
                            </Text>
                          ) : (
                            <Text type="secondary">-</Text>
                          )
                        )}
                      />
                      
                      <Table.Column
                        title="负责人"
                        width={120}
                        align="center"
                        render={(_, record: StarActivity) => (
                          record.responsiblePerson ? (
                            <Text>{record.responsiblePerson}</Text>
                          ) : (
                            <Text type="secondary">-</Text>
                          )
                        )}
                      />
                      
                      <Table.Column
                        title="团队"
                        width={150}
                        align="center"
                        render={(_, record: StarActivity) => (
                          record.team && record.team.length > 0 ? (
                            <div>
                              {record.team.slice(0, 2).map((member, index) => (
                                <Tag key={index} style={{ marginBottom: 2, fontSize: '12px' }}>
                                  {member}
                                </Tag>
                              ))}
                              {record.team.length > 2 && (
                                <Tag style={{ fontSize: '12px' }}>+{record.team.length - 2}</Tag>
                              )}
                            </div>
                          ) : (
                            <Text type="secondary">-</Text>
                          )
                        )}
                      />
                      
                      <Table.Column
                        title="ACTION"
                        width={160}
                        render={(_, record: StarActivity) => (
                          <Space>
                            <Tooltip title="编辑活动">
                              <Button type="text" icon={<EditOutlined />} />
                            </Tooltip>
                            <Tooltip title="团队管理">
                              <Button 
                                type="text" 
                                icon={<UserOutlined />} 
                                onClick={() => handleTeamManagementOpen('star_point', record.id, record.title)}
                              />
                            </Tooltip>
                            <Tooltip title="删除活动">
                              <Button type="text" danger icon={<DeleteOutlined />} />
                            </Tooltip>
                          </Space>
                        )}
                      />
                    </Table>

                    <div style={{ marginTop: 16, textAlign: 'right' }}>
                      <Space>
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          onClick={() => handleStarCategoryEdit(category)}
                        >
                          Edit Category
                        </Button>
                        <Popconfirm
                          title="确定删除此类别？"
                          onConfirm={() => handleStarCategoryDelete(category.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button type="text" danger icon={<DeleteOutlined />}>
                            Delete Category
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                  </>
                )
              }))}
            />
          </Card>
        </>
      ) : (
        <Alert 
          message="暂无数据" 
          description="请先初始化Star Point奖励数据" 
          type="info" 
        />
      )}
    </div>
  );

  const renderNationalIncentiveTab = () => (
    <div>
      {nationalIncentiveAward ? (
        <>
          {/* Header Card - 完全符合原始UI */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={24}>
              <Col span={16}>
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ color: '#13c2c2', marginBottom: 8 }}>
                    {nationalIncentiveAward.title}
                  </Title>
                  <Text strong style={{ color: '#13c2c2' }}>
                    {nationalIncentiveAward.description}
                  </Text>
                </div>
                <Divider />
                <Space direction="vertical" size="small">
                  <Button type="primary" icon={<FileTextOutlined />}>
                    Submit Score
                  </Button>
                  <Button icon={<EyeOutlined />}>
                    View History
                  </Button>
                </Space>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ backgroundColor: '#e6fffb', border: '1px solid #13c2c2' }}>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#13c2c2', marginBottom: 8 }}>
                      Award Categories
                    </Title>
                    <div style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 12 }}>A. Individual Awards</Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 12 }}>B. Local Organisation Awards</Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 12 }}>C. Area Awards</Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 12 }}>D. Special Awards</Text>
                    </div>
                    <div style={{ marginBottom: 4 }}>
                      <Text style={{ fontSize: 12 }}>E. JCI Junior, Youth Awards</Text>
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* 提交指南 */}
          {nationalIncentiveAward.submissionGuideline && (
            <div style={{ marginBottom: 24 }}>
              <Button
                type="primary"
                icon={<SendOutlined />}
                style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
              >
                Submission Guideline
              </Button>
            </div>
          )}

          {/* 奖励列表 - 完全符合原始UI */}
          {nationalIncentiveAward.awardCategories.map((category) => (
            <Card key={category.id} style={{ marginBottom: 24 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ color: '#52c41a', marginBottom: 16 }}>
                  {category.category}
                </Title>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleIncentiveAwardCreate}
                >
                  Add Award
                </Button>
              </div>
              
              <Table
                dataSource={category.awards}
                rowKey="id"
                pagination={false}
                scroll={{ x: 800 }}
              >
                <Table.Column
                  title="NO."
                  dataIndex="no"
                  width={80}
                  align="center"
                />
                
                <Table.Column
                  title="AWARDS"
                  dataIndex="title"
                  render={(title, record: IncentiveAward) => (
                    <div>
                      <div style={{ marginBottom: 4 }}>
                        <Text strong>{title}</Text>
                        {record.guidelines && (
                          <Button
                            type="link"
                            size="small"
                            icon={<FileTextOutlined />}
                            style={{ marginLeft: 8 }}
                          >
                            Guideline
                          </Button>
                        )}
                      </div>
                      <div>
                        {getStatusTag(record.status)}
                      </div>
                    </div>
                  )}
                />
                
                <Table.Column
                  title="NATIONAL"
                  dataIndex="nationalAllocation"
                  width={100}
                  align="center"
                  render={(allocation) => (
                    <Text 
                      strong 
                      style={{ 
                        color: getNationalAllocationColor(allocation),
                        fontSize: 16
                      }}
                    >
                      {allocation}
                    </Text>
                  )}
                />
                
                <Table.Column
                  title="AREA"
                  dataIndex="areaAllocation"
                  width={100}
                  align="center"
                  render={(allocation) => (
                    <Text 
                      strong 
                      style={{ 
                        color: getAreaAllocationColor(allocation),
                        fontSize: 16
                      }}
                    >
                      {allocation}
                    </Text>
                  )}
                />
                
                <Table.Column
                  title="负责人"
                  width={120}
                  align="center"
                  render={(_, record: IncentiveAward) => (
                    record.responsiblePerson ? (
                      <Text>{record.responsiblePerson}</Text>
                    ) : (
                      <Text type="secondary">-</Text>
                    )
                  )}
                />
                
                <Table.Column
                  title="团队"
                  width={150}
                  align="center"
                  render={(_, record: IncentiveAward) => (
                    record.team && record.team.length > 0 ? (
                      <div>
                        {record.team.slice(0, 2).map((member, index) => (
                          <Tag key={index} style={{ marginBottom: 2, fontSize: '12px' }}>
                            {member}
                          </Tag>
                        ))}
                        {record.team.length > 2 && (
                          <Tag style={{ fontSize: '12px' }}>+{record.team.length - 2}</Tag>
                        )}
                      </div>
                    ) : (
                      <Text type="secondary">-</Text>
                    )
                  )}
                />
                
                <Table.Column
                  title="ACTION"
                  width={180}
                  render={(_, record: IncentiveAward) => (
                    <Space>
                      <Tooltip title="编辑">
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          onClick={() => handleIncentiveAwardEdit(record)}
                        />
                      </Tooltip>
                      <Tooltip title="团队管理">
                        <Button 
                          type="text" 
                          icon={<UserOutlined />} 
                          onClick={() => handleTeamManagementOpen('national_area_incentive', record.id, record.title)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="确定删除此奖项？"
                        onConfirm={() => handleIncentiveAwardDelete(record.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Tooltip title="删除">
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                      </Popconfirm>
                    </Space>
                  )}
                />
              </Table>
            </Card>
          ))}
        </>
      ) : (
        <Alert 
          message="暂无数据" 
          description="请先初始化National & Area Incentive奖励数据" 
          type="info" 
        />
      )}
    </div>
  );

  return (
    <div>
      {/* 页面标题和筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={2} style={{ marginBottom: 0 }}>
              <TrophyOutlined style={{ marginRight: 8 }} />
              奖励指标管理
            </Title>
            <Text type="secondary">管理所有奖励系统的指标和标准</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={loadAllAwards}
                loading={loading}
              >
                刷新数据
              </Button>
              <Button icon={<DownloadOutlined />} onClick={exportData}>
                导出数据
              </Button>
            </Space>
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>选择年份:</Text>
            <Select
              mode="multiple"
              style={{ width: '100%', marginTop: 8 }}
              placeholder="选择要查看的年份"
              value={selectedYears}
              onChange={handleYearChange}
              maxTagCount={3}
            >
              {availableYears.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </Col>
          
          <Col span={8}>
            <Text strong>奖励类别:</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <Option value="all">All Categories</Option>
              <Option value="efficient_star">Efficient Star</Option>
              <Option value="star_point">Star Point</Option>
              <Option value="national_area_incentive">National & Area Incentive</Option>
              <Option value="e_awards">E-Awards</Option>
            </Select>
          </Col>
          
          <Col span={8}>
            <Text strong>统计概览:</Text>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                共 {selectedYears.length} 年数据，当前选择: {selectedCategory === 'all' ? '所有类别' : getCategoryName(selectedCategory)}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <TrophyOutlined />
              Efficient Star
            </span>
          } 
          key="efficient-star"
        >
          {renderEfficientStarTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <StarOutlined />
              Star Point
            </span>
          } 
          key="star-point"
        >
          {renderStarPointTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <GiftOutlined />
              National & Area Incentive
            </span>
          } 
          key="national-incentive"
        >
          {renderNationalIncentiveTab()}
        </TabPane>
      </Tabs>

      {/* Efficient Star Modal */}
      <Modal
        title={editingStandard ? '编辑标准' : '创建标准'}
        open={efficientStarModalVisible}
        onOk={handleEfficientStarStandardSave}
        onCancel={() => setEfficientStarModalVisible(false)}
        width={600}
      >
        <Form form={efficientStarForm} layout="vertical">
          <Form.Item
            name="no"
            label="编号"
            rules={[{ required: true, message: '请输入编号' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="title"
            label="标准标题"
            rules={[{ required: true, message: '请输入标准标题' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={3} />
          </Form.Item>
          
          <Form.Item
            name="score"
            label="分数"
            rules={[{ required: true, message: '请输入分数' }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="deadline"
            label="截止日期"
            rules={[{ required: true, message: '请选择截止日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="guidelines"
            label="指导原则"
          >
            <Input placeholder="输入指导原则或链接" />
          </Form.Item>
          
          <Form.Item
            name="responsiblePerson"
            label="负责人"
          >
            <Select
              placeholder="选择负责人"
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {members.map(member => (
                <Option key={member.id} value={member.name}>
                  {member.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="team"
            label="团队成员"
          >
            <Select
              mode="multiple"
              placeholder="选择团队成员"
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {members.map(member => (
                <Option key={member.id} value={member.name}>
                  {member.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Star Point Modal */}
      <Modal
        title={editingCategory ? '编辑类别' : '创建类别'}
        open={starPointModalVisible}
        onOk={handleStarCategorySave}
        onCancel={() => setStarPointModalVisible(false)}
        width={600}
      >
        <Form form={starPointForm} layout="vertical">
          <Form.Item
            name="type"
            label="类别类型"
            rules={[{ required: true, message: '请选择类别类型' }]}
          >
            <Select>
              <Option value="network_star">Network Star</Option>
              <Option value="experience_star">Experience Star</Option>
              <Option value="social_star">Social Star</Option>
              <Option value="outreach_star">Outreach Star</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="title"
            label="类别标题"
            rules={[{ required: true, message: '请输入类别标题' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={2} />
          </Form.Item>
          
          <Form.Item
            name="objective"
            label="目标"
            rules={[{ required: true, message: '请输入目标' }]}
          >
            <TextArea rows={2} />
          </Form.Item>
          
          <Form.Item
            name="points"
            label="总分数"
            rules={[{ required: true, message: '请输入总分数' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="note"
            label="备注"
          >
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* National & Area Incentive Modal */}
      <Modal
        title={editingIncentiveAward ? '编辑奖项' : '创建奖项'}
        open={nationalIncentiveModalVisible}
        onOk={handleIncentiveAwardSave}
        onCancel={() => setNationalIncentiveModalVisible(false)}
        width={600}
      >
        <Form form={nationalIncentiveForm} layout="vertical">
          <Form.Item
            name="no"
            label="奖项编号"
            rules={[{ required: true, message: '请输入奖项编号' }]}
          >
            <Input placeholder="如: A01, B02" />
          </Form.Item>
          
          <Form.Item
            name="title"
            label="奖项标题"
            rules={[{ required: true, message: '请输入奖项标题' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="nationalAllocation"
            label="国家级分配"
            rules={[{ required: true, message: '请输入国家级分配' }]}
          >
            <Input placeholder="如: 1, 3, 1**" />
          </Form.Item>
          
          <Form.Item
            name="areaAllocation"
            label="区域级分配"
            rules={[{ required: true, message: '请输入区域级分配' }]}
          >
            <Input placeholder="如: -, 1*, 1" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="open">开放中</Option>
              <Option value="closed">已关闭</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="guidelines"
            label="指导原则"
          >
            <TextArea rows={3} />
          </Form.Item>
          
          <Form.Item
            name="responsiblePerson"
            label="负责人"
          >
            <Select
              placeholder="选择负责人"
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {members.map(member => (
                <Option key={member.id} value={member.name}>
                  {member.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="team"
            label="团队成员"
          >
            <Select
              mode="multiple"
              placeholder="选择团队成员"
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children || '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {members.map(member => (
                <Option key={member.id} value={member.name}>
                  {member.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Team Management Modal */}
      <Modal
        title={`团队管理 - ${selectedAwardForTeam?.title}`}
        open={teamManagementModalVisible}
        onCancel={() => setTeamManagementModalVisible(false)}
        width={1000}
        footer={null}
      >
        {teamManagement && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="职位管理" size="small">
                    <div style={{ marginBottom: 16 }}>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={handleCreatePosition}
                      >
                        创建职位
                      </Button>
                    </div>
                    
                    {teamManagement.positions.map((position) => (
                      <Card key={position.id} size="small" style={{ marginBottom: 8 }}>
                        <Row gutter={8}>
                          <Col span={8}>
                            <Input
                              placeholder="职位名称"
                              value={position.name}
                              onChange={(e) => handleUpdatePosition(position.id, { name: e.target.value })}
                            />
                          </Col>
                          <Col span={12}>
                            <Input
                              placeholder="职位描述"
                              value={position.description}
                              onChange={(e) => handleUpdatePosition(position.id, { description: e.target.value })}
                            />
                          </Col>
                          <Col span={4}>
                            <Space>
                              <Button 
                                type="text" 
                                icon={<EditOutlined />}
                                size="small"
                              />
                              <Popconfirm
                                title="确定删除此职位？"
                                onConfirm={() => handleDeletePosition(position.id)}
                              >
                                <Button 
                                  type="text" 
                                  danger 
                                  icon={<DeleteOutlined />}
                                  size="small"
                                />
                              </Popconfirm>
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </Card>
                </Col>
                
                <Col span={12}>
                  <Card title="成员分配" size="small">
                    <div style={{ marginBottom: 16 }}>
                      <Text type="secondary">选择会员分配到职位</Text>
                    </div>
                    
                    {teamManagement.positions.map((position) => (
                      <div key={position.id} style={{ marginBottom: 16 }}>
                        <Text strong>{position.name || '未命名职位'}</Text>
                        <Select
                          style={{ width: '100%', marginTop: 8 }}
                          placeholder="选择会员"
                          allowClear
                          showSearch
                          filterOption={(input, option) =>
                            String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                          }
                          onSelect={(value) => {
                            const member = members.find(m => m.id === value);
                            if (member) {
                              handleAssignMember(member.id, member.name, position.id, position.name);
                            }
                          }}
                        >
                          {members.map(member => (
                            <Option key={member.id} value={member.id}>
                              {member.name}
                            </Option>
                          ))}
                        </Select>
                        
                        {/* 显示已分配的成员 */}
                        <div style={{ marginTop: 8 }}>
                          {teamManagement.members
                            .filter(member => member.positionId === position.id)
                            .map((member) => (
                              <Tag 
                                key={member.id} 
                                closable
                                onClose={() => handleRemoveMember(member.id)}
                                style={{ marginBottom: 4 }}
                              >
                                {member.memberName}
                              </Tag>
                            ))}
                        </div>
                      </div>
                    ))}
                  </Card>
                </Col>
              </Row>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setTeamManagementModalVisible(false)}>
                  关闭
                </Button>
                <Button type="primary">
                  保存团队设置
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AwardIndicatorManagement;
