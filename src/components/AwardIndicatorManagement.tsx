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
  Standard,
  AwardCategory,
  TeamManagement,
} from '@/types/awards';
import { awardService } from '@/services/awardService';
import { indicatorService } from '@/services/indicatorService';
import { getMembers } from '@/services/memberService';
import { globalDateService } from '@/config/globalDateSettings';
import ResponsiblePersonSelector from './common/ResponsiblePersonSelector';
import TeamManagementModal from './common/TeamManagementModal';
import ResponsiblePersonDisplay from './common/ResponsiblePersonDisplay';
import StandardEditModal from './common/StandardEditModal';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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
  const [teamManagement, setTeamManagement] = useState<TeamManagement | null>(null);
  
  // Unified edit modal states
  const [unifiedEditModalVisible, setUnifiedEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editModalType, setEditModalType] = useState<'efficient_star' | 'star_point' | 'national_area_incentive'>('efficient_star');
  const [editingStandardId, setEditingStandardId] = useState<string | null>(null);
  
  // Category management states
  const [categoryManagementModalVisible, setCategoryManagementModalVisible] = useState(false);
  const [selectedCategoryForStandard, setSelectedCategoryForStandard] = useState<StarCategory | null>(null);
  
  // Inline editing states for category management
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryForm] = Form.useForm();
  
  // Initialize award states
  const [initializeModalVisible, setInitializeModalVisible] = useState(false);
  const [sourceYear, setSourceYear] = useState<number | null>(null);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [availableYearsForInit, setAvailableYearsForInit] = useState<number[]>([]);
  
  // Efficient Star states
  const [efficientStarAward, setEfficientStarAward] = useState<EfficientStarAward | null>(null);
  const [efficientStarModalVisible, setEfficientStarModalVisible] = useState(false);
  const [efficientStarForm] = Form.useForm();
  
  // Star Point states - 支持多个Star类别
  const [starPointAwards, setStarPointAwards] = useState<StarPointAward[]>([]);
  const [selectedStarType, setSelectedStarType] = useState<StarCategoryType>('network_star');
  const [starPointModalVisible, setStarPointModalVisible] = useState(false);
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

  const loadAvailableYearsForInit = async () => {
    try {
      const years = await awardService.getAvailableYears();
      setAvailableYearsForInit(years);
    } catch (error) {
      message.error('加载初始化可用年份失败');
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
      const [efficientStar, starPointAwards, nationalIncentive] = await Promise.all([
        awardService.getEfficientStarAward(year),
        awardService.getAllStarPointAwards(year),
        awardService.getNationalAreaIncentiveAward(year)
      ]);
      
      setEfficientStarAward(efficientStar);
      setStarPointAwards(starPointAwards);
      setNationalIncentiveAward(nationalIncentive);
    } catch (error) {
      message.error('加载奖励数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeAward = async () => {
    if (!sourceYear) {
      message.error('请选择参考年份');
      return;
    }

    try {
      setLoading(true);
      await awardService.initializeAwardsFromYear(sourceYear, targetYear);
      message.success(`成功从 ${sourceYear} 年创建 ${targetYear} 年的奖励配置`);
      setInitializeModalVisible(false);
      setSourceYear(null);
      setTargetYear(new Date().getFullYear());
      // 重新加载数据
      await loadAllAwards();
    } catch (error) {
      message.error('初始化奖励配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const showInitializeModal = () => {
    setInitializeModalVisible(true);
    loadAvailableYearsForInit();
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




  // ========== Star Point Activity CRUD ==========
  

  const handleStarActivityDelete = (_activityId: string, _categoryId: string) => {
    // TODO: 实现Star Point Activity删除功能
    message.info('Star Point Activity删除功能待实现');
  };

  // ========== Star Point Helper Functions ==========
  
  // 获取当前选中的Star Point Award
  const getCurrentStarPointAward = (): StarPointAward | null => {
    return starPointAwards.find(award => award.starType === selectedStarType) || null;
  };

  // ========== Category Management Functions ==========
  
  const handleManageCategories = async () => {
    try {
      // 从awards collection读取选定年份的Star Point记录参数
      const currentAward = getCurrentStarPointAward();
      if (!currentAward) {
        message.error('未找到当前Star Point奖励数据');
        return;
      }
      
      // 确保standards数据是最新的
      const standardsData = await awardService.getStandardsByCategoryAndYear(selectedStarType, year);
      if (standardsData && standardsData.length > 0) {
        // 更新当前award的standards数据
        const updatedAwards = starPointAwards.map(award => 
          award.starType === selectedStarType 
            ? { ...award, standards: standardsData }
            : award
        );
        setStarPointAwards(updatedAwards);
      }
      
      setCategoryManagementModalVisible(true);
      
      // 总是自动添加一行，确保用户有可编辑的行
      setTimeout(() => {
        autoAddNewRow();
      }, 200); // 延迟执行，确保Modal已完全打开
    } catch (error) {
      message.error('加载Star Point类别数据失败');
      console.error(error);
    }
  };


  const handleCreateStandardForStarPoint = () => {
    setSelectedCategoryForStandard(null);
    handleStandardCreate('star_point');
  };

  // ========== Inline Category Management Functions ==========
  

  const handleCancelEditingCategory = () => {
    setEditingCategoryId(null);
    newCategoryForm.resetFields();
  };

  // 检查行是否具备完整参数输入
  const isRowComplete = (standard: Standard): boolean => {
    return !!(
      standard.title?.trim() &&
      standard.description?.trim() &&
      standard.objective?.trim() &&
      (standard.points || 0) > 0 &&
      standard.deadline?.trim()
    );
  };


  // 自动添加新行
  const autoAddNewRow = () => {
    const currentAward = getCurrentStarPointAward();
    if (!currentAward) return;
    
    const newCategory = createEmptyStarPointCategory();
    newCategory.no = (currentAward.standards?.length || 0) + 1;
    
    const updatedStandards = [...(currentAward.standards || []), newCategory];
    const updatedAward = {
      ...currentAward,
      standards: updatedStandards,
      updatedAt: new Date().toISOString()
    };
    
    // 更新对应的Star Point Award
    const updatedAwards = starPointAwards.map(award => 
      award.starType === selectedStarType ? updatedAward : award
    );
    setStarPointAwards(updatedAwards);
    setEditingCategoryId(newCategory.id);
    
    // 设置表单初始值
    newCategoryForm.resetFields();
    newCategoryForm.setFieldsValue({
      no: newCategory.no,
      type: newCategory.type,
      title: newCategory.title,
      description: newCategory.description,
      objective: newCategory.objective,
      points: newCategory.points,
      deadline: newCategory.deadline ? globalDateService.parseDate(newCategory.deadline) : null
    });
  };

  // 自动删除空行
  const autoRemoveEmptyRows = () => {
    const currentAward = getCurrentStarPointAward();
    if (!currentAward) return;
    
    const updatedStandards = (currentAward.standards || []).filter(standard => 
      isRowComplete(standard)
    );
    
    // 重新编号
    updatedStandards.forEach((standard, index) => {
      standard.no = index + 1;
    });
    
    const updatedAward = {
      ...currentAward,
      standards: updatedStandards,
      updatedAt: new Date().toISOString()
    };
    
    // 更新对应的Star Point Award
    const updatedAwards = starPointAwards.map(award => 
      award.starType === selectedStarType ? updatedAward : award
    );
    setStarPointAwards(updatedAwards);
  };

  const handleSaveInlineCategory = async () => {
    try {
      const values = await newCategoryForm.validateFields();
      
      const currentAward = getCurrentStarPointAward();
      if (!currentAward) {
        message.error('Star Point奖励数据未加载');
        return;
      }

      const updatedStandards = [...(currentAward.standards || [])];
      
      if (editingCategoryId) {
        // 更新现有类别 - 保存到awards collection
        const index = updatedStandards.findIndex(s => s.id === editingCategoryId);
        if (index >= 0) {
          const updatedCategory: Standard = {
            ...updatedStandards[index],
            no: values.no,
            title: values.title,
            description: values.description,
            category: values.type as StarCategoryType,
            type: values.type,
            objective: values.objective,
            points: values.points || 0,
            score: values.score || values.points || updatedStandards[index].score,
            deadline: globalDateService.formatDate(values.deadline, 'YYYY-MM-DD') || updatedStandards[index].deadline,
            status: 'pending' as const
          };
          
          // 创建或更新到standards collection
          await awardService.upsertStandard(updatedCategory);
          
          // 更新本地状态
          updatedStandards[index] = updatedCategory;
        }
      } else {
        // 添加新类别 - 保存到awards collection
        const newCategory: Standard = {
          id: `star-category-${Date.now()}`,
          no: values.no,
          title: values.title,
          description: values.description,
          category: values.type as StarCategoryType,
          type: values.type,
          objective: values.objective,
          note: '',
          points: values.points || 0,
          score: values.score || values.points || 0,
          deadline: globalDateService.formatDate(values.deadline, 'YYYY-MM-DD') || '',
          externalLink: '',
          guidelines: '',
          status: 'pending' as const,
          myScore: 0,
          responsiblePerson: '',
          team: [],
          teamManagement: {
            id: `team-${Date.now()}`,
            awardType: 'star_point' as const,
            awardId: currentAward.id,
            positions: [],
            members: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          scoreSettings: []
        };
        
        // 创建或更新到standards collection
        await awardService.upsertStandard(newCategory);
        
        // 更新本地状态
        updatedStandards.push(newCategory);
      }

      const updatedAward = {
        ...currentAward,
        standards: updatedStandards,
        updatedAt: new Date().toISOString()
      };

      // 保存到awards collection
      await awardService.saveStarPointAward(updatedAward);
      
      // 更新对应的Star Point Award
      const updatedAwards = starPointAwards.map(award => 
        award.starType === selectedStarType ? updatedAward : award
      );
      setStarPointAwards(updatedAwards);
      setEditingCategoryId(null);
      newCategoryForm.resetFields();
      
      // 自动管理行：保存后自动添加新行
      setTimeout(() => {
        autoAddNewRow();
      }, 100);
      
      message.success(editingCategoryId ? '类别更新成功' : '类别添加成功');
    } catch (error) {
      message.error('保存类别失败');
      console.error(error);
    }
  };

  const handleDeleteInlineCategory = async (categoryId: string) => {
    try {
      const currentAward = getCurrentStarPointAward();
      if (!currentAward) return;

      const updatedStandards = (currentAward.standards || []).filter((s: any) => s.id !== categoryId);
      
      // 重新编号
      updatedStandards.forEach((standard: any, index: number) => {
        standard.no = index + 1;
      });
      
      const updatedAward = {
        ...currentAward,
        standards: updatedStandards,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveStarPointAward(updatedAward);
      
      // 更新对应的Star Point Award
      const updatedAwards = starPointAwards.map(award => 
        award.starType === selectedStarType ? updatedAward : award
      );
      setStarPointAwards(updatedAwards);
      
      // 自动删除空行
      autoRemoveEmptyRows();
      
      message.success('类别删除成功');
    } catch (error) {
      message.error('删除类别失败');
      console.error(error);
    }
  };

  // ========== Unified Edit Modal Functions ==========
  
  const handleUnifiedEdit = (item: any, type: 'efficient_star' | 'star_point' | 'national_area_incentive') => {
    setEditingItem(item);
    setEditModalType(type);
    setUnifiedEditModalVisible(true);
  };

  const handleUnifiedSave = async (values: any) => {
    try {
      if (editModalType === 'efficient_star' || editModalType === 'star_point') {
        await handleStandardSave(values);
      } else if (editModalType === 'national_area_incentive') {
        await handleIncentiveAwardSave(values);
      }
      setUnifiedEditModalVisible(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  // ========== Efficient Star Management ==========
  

  // ========== 统一的Standard创建处理函数 ==========
  
  const handleStandardCreate = (awardType: 'efficient_star' | 'star_point') => {
    setEditingItem(null);
    setEditingStandardId(null);
    setEditModalType(awardType);
    setUnifiedEditModalVisible(true);
  };

  // ========== 统一的Standard保存处理函数 ==========
  
  const handleStandardSave = async (values?: any) => {
    try {
      // 如果是从StandardEditModal调用，使用传入的values
      // 如果是从原有Modal调用，使用form验证
      const formValues = values || await (editModalType === 'efficient_star' ? efficientStarForm : starPointForm).validateFields();
      
      // 根据awardType获取相应的数据源
      let currentAward: any;
      let saveMethod: (award: any) => Promise<string>;
      let setAwardMethod: (award: any) => void;
      let successMessage: string;
      
      if (editModalType === 'efficient_star') {
        currentAward = efficientStarAward;
        saveMethod = awardService.saveEfficientStarAward;
        setAwardMethod = setEfficientStarAward;
        successMessage = editingItem ? '标准更新成功' : '标准创建成功';
        
        if (!currentAward) {
          message.error('Efficient Star奖励数据未加载');
          return;
        }
      } else if (editModalType === 'star_point') {
        currentAward = getCurrentStarPointAward();
        saveMethod = awardService.saveStarPointAward;
        setAwardMethod = (award: any) => {
          const updatedAwards = starPointAwards.map(a => 
            a.starType === selectedStarType ? award : a
          );
          setStarPointAwards(updatedAwards);
        };
        successMessage = editingItem ? '类别更新成功' : '类别创建成功';
        
        if (!currentAward) {
          message.error('Star Point奖励数据未加载');
          return;
        }
      } else {
        message.error('未知的奖励类型');
        return;
      }

      const updatedStandards = [...(currentAward.standards || [])];
      
      if (editingItem) {
        // Update existing standard - 确保包含所有StandardEditModal字段
        const index = updatedStandards.findIndex(s => s.id === editingItem.id);
        if (index >= 0) {
          const updatedStandard = {
            ...formValues,
            id: editingItem.id,
            deadline: globalDateService.formatDate(formValues.deadline, 'YYYY-MM-DD') || editingItem.deadline,
            status: editingItem.status,
            myScore: editingItem.myScore || 0,
            // 确保所有StandardEditModal字段都被保存
            externalLink: formValues.externalLink || editingItem.externalLink,
            scoreSettings: formValues.scoreSettings || editingItem.scoreSettings,
            teamManagement: formValues.teamManagement || editingItem.teamManagement,
            responsiblePerson: formValues.responsiblePerson || editingItem.responsiblePerson,
            team: formValues.team || editingItem.team,
            guidelines: formValues.guidelines || editingItem.guidelines
          };
          
          // Star Point特有的字段
          if (editModalType === 'star_point') {
            updatedStandard.activities = editingItem.activities;
            updatedStandard.myPoints = editingItem.myPoints;
            updatedStandard.objective = formValues.objective || editingItem.objective;
            updatedStandard.note = formValues.note || editingItem.note;
            updatedStandard.points = formValues.points || editingItem.points;
          }
          
          updatedStandards[index] = updatedStandard;
        }
      } else {
        // Create new standard - 确保包含所有StandardEditModal字段
        const newStandard: any = {
          ...formValues,
          id: editModalType === 'efficient_star' ? `standard_${Date.now()}` : `category_${Date.now()}`,
          deadline: globalDateService.formatDate(formValues.deadline, 'YYYY-MM-DD') || '',
          status: 'pending' as const,
          myScore: 0,
          // 包含所有可能的字段
          externalLink: formValues.externalLink,
          scoreSettings: formValues.scoreSettings,
          teamManagement: formValues.teamManagement,
          responsiblePerson: formValues.responsiblePerson,
          team: formValues.team,
          guidelines: formValues.guidelines,
          // 确保基础字段存在
          no: formValues.no || updatedStandards.length + 1,
          score: formValues.score || 0
        };
        
        // Star Point特有的字段
        if (editModalType === 'star_point') {
          newStandard.objective = formValues.objective || '';
          newStandard.note = formValues.note;
          newStandard.points = formValues.points || 0;
          newStandard.score = formValues.score || formValues.points || 0;
        }
        
        updatedStandards.push(newStandard);
      }

      const updatedAward = {
        ...currentAward,
        standards: updatedStandards,
        updatedAt: new Date().toISOString()
      };

      await saveMethod(updatedAward);
      setAwardMethod(updatedAward);
      
      // 关闭相应的Modal
      if (values) {
        // 来自StandardEditModal
        setUnifiedEditModalVisible(false);
      } else {
        // 来自原有Modal
        if (editModalType === 'efficient_star') {
          setEfficientStarModalVisible(false);
        } else {
          setStarPointModalVisible(false);
        }
      }
      
      message.success(successMessage);
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
  
  // 创建空的Star Point类别数据
  const createEmptyStarPointCategory = (): Standard => {
    const currentAward = getCurrentStarPointAward();
    return {
      id: `star-category-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      no: (currentAward?.standards?.length || 0) + 1,
      title: '',
      description: '',
      category: selectedStarType,
      type: selectedStarType,
      objective: '',
      note: '',
      points: 0,
      score: 0,
      deadline: '',
      externalLink: '',
      guidelines: '',
      status: 'pending' as const,
      myScore: 0,
      responsiblePerson: '',
      team: [],
      teamManagement: {
        id: `team-${Date.now()}`,
        awardType: 'star_point' as const,
        awardId: currentAward?.id || '',
        positions: [],
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      scoreSettings: []
    };
  };




  // ========== National & Area Incentive Management ==========
  

  const handleIncentiveAwardCreate = () => {
    setEditingIncentiveAward(null);
    nationalIncentiveForm.resetFields();
    setNationalIncentiveModalVisible(true);
  };

  const handleIncentiveAwardSave = async (values?: any) => {
    try {
      // 如果是从StandardEditModal调用，使用传入的values
      // 如果是从原有Modal调用，使用form验证
      const formValues = values || await nationalIncentiveForm.validateFields();
      
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
            ...formValues,
            id: editingIncentiveAward.id,
            // 确保所有StandardEditModal字段都被保存
            deadline: globalDateService.formatDate(formValues.deadline, 'YYYY-MM-DD') || editingIncentiveAward.deadline,
            externalLink: formValues.externalLink || editingIncentiveAward.externalLink,
            scoreSettings: formValues.scoreSettings || editingIncentiveAward.scoreSettings,
            teamManagement: formValues.teamManagement || editingIncentiveAward.teamManagement,
            nationalAllocation: formValues.nationalAllocation || editingIncentiveAward.nationalAllocation,
            areaAllocation: formValues.areaAllocation || editingIncentiveAward.areaAllocation,
            guidelines: formValues.guidelines || editingIncentiveAward.guidelines,
            status: formValues.status || editingIncentiveAward.status
          };
          }
        }
      } else {
        // Create new award - 确保包含所有StandardEditModal字段
        if (updatedCategories.length > 0) {
          const newAward: IncentiveAward = {
            ...formValues,
            id: `award_${Date.now()}`,
            // 包含所有可能的字段
            deadline: globalDateService.formatDate(formValues.deadline, 'YYYY-MM-DD'),
            externalLink: formValues.externalLink,
            scoreSettings: formValues.scoreSettings,
            teamManagement: formValues.teamManagement,
            nationalAllocation: formValues.nationalAllocation || '',
            areaAllocation: formValues.areaAllocation || '',
            guidelines: formValues.guidelines,
            status: formValues.status || 'open'
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
      
      // 关闭相应的Modal
      if (values) {
        // 来自StandardEditModal
        setUnifiedEditModalVisible(false);
      } else {
        // 来自原有Modal
        setNationalIncentiveModalVisible(false);
      }
      
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
                onClick={() => handleStandardCreate('efficient_star')}
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
                  <ResponsiblePersonDisplay responsiblePerson={record.responsiblePerson} />
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
                        onClick={() => handleUnifiedEdit(record, 'efficient_star')}
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

  const renderStarPointTab = () => {
    const currentAward = getCurrentStarPointAward();
    return (
    <div>
      {/* Star类别选择器 */}
      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>选择Star类别:</Text>
          <Select
            value={selectedStarType}
            onChange={setSelectedStarType}
            style={{ width: 200 }}
          >
            <Option value="network_star">Network Star</Option>
            <Option value="experience_star">Experience Star</Option>
            <Option value="social_star">Social Star</Option>
            <Option value="outreach_star">Outreach Star</Option>
          </Select>
        </Space>
      </Card>

      {currentAward ? (
        <>
          {/* Header Card - 完全符合原始UI */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={24}>
              <Col span={16}>
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ color: '#52c41a', marginBottom: 8 }}>
                    {currentAward.title}
                  </Title>
                  <Text strong style={{ color: '#52c41a' }}>
                    {currentAward.description}
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
                    {currentAward.terms.map((term, index) => (
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
              <Space>
                <Button 
                  type="primary" 
                  icon={<EditOutlined />} 
                  onClick={handleManageCategories}
                >
                  Manage Category
                </Button>
                <Button 
                  type="default" 
                  icon={<PlusOutlined />} 
                  onClick={handleCreateStandardForStarPoint}
                >
                  创建标准
                </Button>
              </Space>
            }
          >
            <Collapse
              defaultActiveKey={['0']} 
              ghost
              items={(currentAward.standards || []).map((category: any, categoryIndex: number) => ({
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
                          <ResponsiblePersonDisplay responsiblePerson={record.responsiblePerson} />
                        )}
                      />
                      
                      <Table.Column
                        title="ACTION"
                        width={160}
                        render={(_, record: StarActivity) => (
                          <Space>
                            <Tooltip title="编辑标准">
                              <Button 
                                type="text" 
                                icon={<EditOutlined />} 
                                onClick={() => handleUnifiedEdit(record, 'star_point')}
                              />
                            </Tooltip>
                            <Popconfirm
                              title="确定删除此活动？"
                              onConfirm={() => handleStarActivityDelete(record.id, category.id)}
                              okText="确定"
                              cancelText="取消"
                            >
                              <Tooltip title="删除活动">
                                <Button type="text" danger icon={<DeleteOutlined />} />
                              </Tooltip>
                            </Popconfirm>
                          </Space>
                        )}
                      />
                    </Table>

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
  };

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
                    <ResponsiblePersonDisplay responsiblePerson={record.responsiblePerson} />
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
                          onClick={() => handleUnifiedEdit(record, 'national_area_incentive')}
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
              <Button 
                type="primary"
                icon={<PlusOutlined />} 
                onClick={showInitializeModal}
                loading={loading}
              >
                初始化奖励配置
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

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'efficient-star',
            label: (
              <span>
                <TrophyOutlined />
                Efficient Star
              </span>
            ),
            children: renderEfficientStarTab()
          },
          {
            key: 'star-point',
            label: (
              <span>
                <StarOutlined />
                Star Point
              </span>
            ),
            children: renderStarPointTab()
          },
          {
            key: 'national-incentive',
            label: (
              <span>
                <GiftOutlined />
                National & Area Incentive
              </span>
            ),
            children: renderNationalIncentiveTab()
          }
        ]}
      />

      {/* Efficient Star Modal */}
      <Modal
        title={editingItem ? '编辑标准' : '创建标准'}
        open={efficientStarModalVisible}
        onOk={() => handleStandardSave()}
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
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
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
            <ResponsiblePersonSelector
              members={members}
              placeholder="选择负责人"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Star Point Modal */}
      <Modal
        title={editingItem ? '编辑类别' : '创建类别'}
        open={starPointModalVisible}
        onOk={() => handleStandardSave()}
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
            <ResponsiblePersonSelector
              members={members}
              placeholder="选择负责人"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Team Management Modal */}
      <TeamManagementModal
        visible={teamManagementModalVisible}
        onClose={() => setTeamManagementModalVisible(false)}
        title="团队管理"
        teamManagement={teamManagement}
        members={members}
        onUpdateTeamManagement={(updatedTeamManagement) => setTeamManagement(updatedTeamManagement)}
      />

      {/* Unified Edit Modal */}
      <StandardEditModal
        visible={unifiedEditModalVisible}
        onClose={() => {
          setUnifiedEditModalVisible(false);
          setEditingStandardId(null);
        }}
        onSave={handleUnifiedSave}
        title={editingItem ? `编辑${editModalType === 'efficient_star' ? '标准' : editModalType === 'star_point' ? '标准' : '奖项'}` : `创建${selectedCategoryForStandard ? ` - ${selectedCategoryForStandard.title}` : ''}`}
        initialValues={editingItem}
        members={members}
        awardType={editModalType}
        showTeamManagement={true}
        showCategorySelection={editModalType === 'star_point' && !selectedCategoryForStandard}
        availableCategories={getCurrentStarPointAward()?.standards || []}
        standardId={editingStandardId || undefined}
      />

      {/* Category Management Modal */}
      <Modal
        title="管理Star Point类别"
        open={categoryManagementModalVisible}
        onCancel={() => {
          setCategoryManagementModalVisible(false);
          setEditingCategoryId(null);
          newCategoryForm.resetFields();
        }}
        width={1000}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setCategoryManagementModalVisible(false);
                setEditingCategoryId(null);
                newCategoryForm.resetFields();
              }}>
                取消
              </Button>
              <Button 
                type="primary" 
                onClick={async () => {
                  try {
                    // 保存所有修改到awards collection
                    const currentAward = getCurrentStarPointAward();
                    if (currentAward) {
                      await awardService.saveStarPointAward(currentAward);
                      message.success('保存成功');
                      // 关闭弹出窗口
                      setCategoryManagementModalVisible(false);
                      setEditingCategoryId(null);
                      newCategoryForm.resetFields();
                    }
                  } catch (error) {
                    message.error('保存失败');
                    console.error(error);
                  }
                }}
              >
                保存
              </Button>
            </Space>
          </div>
        }
      >
        <div>
          <Form 
            form={newCategoryForm} 
            layout="vertical"
            onFinish={() => {
              // 阻止表单自动提交
              return false;
            }}
          >
            <Table
              dataSource={getCurrentStarPointAward()?.standards || []}
              rowKey="id"
              pagination={false}
              size="small"
            >
              <Table.Column
                title="序号"
                dataIndex="no"
                width={60}
                align="center"
                render={(no, record: any) => (
                  editingCategoryId === record.id ? (
                    <Form.Item name="no" style={{ margin: 0 }}>
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  ) : (
                    no
                  )
                )}
              />
              
              <Table.Column
                title="类别类型"
                dataIndex="type"
                width={120}
                render={(type, record: any) => (
                  editingCategoryId === record.id ? (
                    <Form.Item name="type" style={{ margin: 0 }}>
                      <Select placeholder="选择类型">
                        <Option value="network_star">Network Star</Option>
                        <Option value="experience_star">Experience Star</Option>
                        <Option value="social_star">Social Star</Option>
                        <Option value="outreach_star">Outreach Star</Option>
                      </Select>
                    </Form.Item>
                  ) : (
                    (() => {
                      const typeMap: Record<string, string> = {
                        'network_star': 'Network Star',
                        'experience_star': 'Experience Star',
                        'social_star': 'Social Star',
                        'outreach_star': 'Outreach Star'
                      };
                      return typeMap[type] || type;
                    })()
                  )
                )}
              />
              
              <Table.Column
                title="标题"
                dataIndex="title"
                render={(title, record: any) => (
                  editingCategoryId === record.id ? (
                    <Form.Item name="title" style={{ margin: 0 }}>
                      <Input placeholder="请输入标题" />
                    </Form.Item>
                  ) : (
                    title
                  )
                )}
              />
              
              <Table.Column
                title="描述"
                dataIndex="description"
                width={200}
                render={(description, record: any) => (
                  editingCategoryId === record.id ? (
                    <Form.Item name="description" style={{ margin: 0 }}>
                      <Input placeholder="请输入描述" />
                    </Form.Item>
                  ) : (
                    <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {description}
                    </div>
                  )
                )}
              />
              
              <Table.Column
                title="目标"
                dataIndex="objective"
                width={150}
                render={(objective, record: any) => (
                  editingCategoryId === record.id ? (
                    <Form.Item name="objective" style={{ margin: 0 }}>
                      <Input placeholder="请输入目标" />
                    </Form.Item>
                  ) : (
                    <div style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {objective}
                    </div>
                  )
                )}
              />
              
              <Table.Column
                title="分数"
                dataIndex="points"
                width={80}
                align="center"
                render={(points, record: any) => (
                  editingCategoryId === record.id ? (
                    <Form.Item name="points" style={{ margin: 0 }}>
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  ) : (
                    points
                  )
                )}
              />
              
              <Table.Column
                title="截止日期"
                dataIndex="deadline"
                width={120}
                render={(deadline, record: any) => (
                  editingCategoryId === record.id ? (
                    <Form.Item name="deadline" style={{ margin: 0 }}>
                      <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                    </Form.Item>
                  ) : (
                    deadline
                  )
                )}
              />
              
              <Table.Column
                title="操作"
                width={120}
                align="center"
                render={(_, record: any) => (
                  <Space>
                    {editingCategoryId === record.id ? (
                      <>
                        <Tooltip title="保存">
                          <Button 
                            type="primary" 
                            size="small"
                            icon={<CheckCircleOutlined />} 
                            onClick={handleSaveInlineCategory}
                          />
                        </Tooltip>
                        <Tooltip title="取消">
                          <Button 
                            size="small"
                            icon={<ExclamationCircleOutlined />} 
                            onClick={handleCancelEditingCategory}
                          />
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="编辑">
                          <Button 
                            type="text" 
                            size="small"
                            icon={<EditOutlined />} 
                            onClick={() => {
                              setEditingCategoryId(record.id);
                              newCategoryForm.setFieldsValue({
                                no: record.no,
                                type: record.type,
                                title: record.title,
                                description: record.description,
                                objective: record.objective,
                                points: record.points,
                                deadline: record.deadline ? globalDateService.parseDate(record.deadline) : null
                              });
                            }}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="确定删除此类别？"
                          onConfirm={() => handleDeleteInlineCategory(record.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Tooltip title="删除">
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                          </Tooltip>
                        </Popconfirm>
                      </>
                    )}
                  </Space>
                )}
              />
            </Table>
            
          </Form>
        </div>
      </Modal>

      {/* 初始化奖励配置模态框 */}
      <Modal
        title="初始化奖励配置"
        open={initializeModalVisible}
        onOk={handleInitializeAward}
        onCancel={() => setInitializeModalVisible(false)}
        width={500}
        okText="创建"
        cancelText="取消"
      >
        <Alert
          message="初始化说明"
          description="此功能将根据您选择的参考年份，创建新年份的所有奖励配置（Efficient Star、Star Point、National & Area Incentive、E-Awards）"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
        
        <Form layout="vertical">
          <Form.Item
            label="参考年份"
            required
            help="选择要复制的奖励配置年份"
          >
            <Select
              placeholder="请选择参考年份"
              value={sourceYear}
              onChange={setSourceYear}
              style={{ width: '100%' }}
            >
              {availableYearsForInit.map(year => (
                <Option key={year} value={year}>
                  {year} 年
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            label="目标年份"
            required
            help="要创建的新年份"
          >
            <InputNumber
              min={2020}
              max={2030}
              value={targetYear}
              onChange={(value) => setTargetYear(value || new Date().getFullYear())}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
        
        <Alert
          message="注意事项"
          description="初始化后，新年份的奖励配置将完全复制参考年份的设置，包括所有标准和分数设置。"
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  );
};

export default AwardIndicatorManagement;
