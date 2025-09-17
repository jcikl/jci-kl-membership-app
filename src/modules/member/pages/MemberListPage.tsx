import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Button, 
  Input, 
  Space, 
  Tag, 
  Card, 
  Typography, 
  Row, 
  Col,
  Select,
  Modal,
  Form,
  message,
  Tabs,
  Badge,
  Statistic
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  UserOutlined,
  UploadOutlined,
  TeamOutlined,
  FilterOutlined,
  CrownOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useMemberStore } from '@/store/memberStore';
import { Member, MemberLevel } from '@/types';
import { getAccountTypeTagProps, getAccountTypeFormOptions, isValidAccountType } from '@/utils/accountType';
import { updateMembersBatch, smartImportMembersBatch, deleteMembersBatch } from '@/modules/member/services/memberService';
import { transactionService, transactionPurposeService } from '@/modules/finance/services/financeService';
import { Transaction, TransactionPurpose } from '@/types/finance';
import ProfileEditForm from '@/modules/member/components/ProfileEditForm';
import BatchImportModal from '@/components/BatchImportModal';
import SenatorManagement from '@/modules/award/components/SenatorManagement';
import VisitingMembershipManager from '@/modules/member/components/VisitingMembershipManager';
import AssociateMembershipManager from '@/modules/member/components/AssociateMembershipManager';
import OfficialMembershipManager from '@/modules/member/components/OfficialMembershipManager';
import FieldSelector, { FieldOption, FieldPreset } from '@/modules/permission/components/FieldSelector';
import BatchSettingsModal, { BatchSettings } from '@/components/BatchSettingsModal';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

const memberFormSchema = yup.object({
  name: yup.string().required('请输入姓名'),
  email: yup.string().email('请输入有效的邮箱').required('请输入邮箱'),
  phone: yup.string().required('请输入手机号'),
  memberId: yup.string().required('请输入会员编号'),
  accountType: yup.string().test('is-valid-account-type', '请选择有效的用户户口类别', (value) => value ? isValidAccountType(value) : false).required('请选择用户户口类别'),
  level: yup.string().required('请选择等级'),
  chapterId: yup.string().optional(),
  chapterName: yup.string().optional(),
  countryName: yup.string().optional(),
  worldRegion: yup.string().optional(),
});

type MemberFormData = yup.InferType<typeof memberFormSchema>;


const MemberListPage: React.FC = () => {
  const { 
    members, 
    isLoading, 
    pagination, 
    searchQuery,
    filters,
    fetchMembers, 
    addMember, 
    deleteMemberById,
    setSearchQuery,
    setFilters,
    clearFilters,
    applySearchAndFilters
  } = useMemberStore();
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBatchImportVisible, setIsBatchImportVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isFieldSelectorVisible, setIsFieldSelectorVisible] = useState(false);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isBatchSettingsVisible, setIsBatchSettingsVisible] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  
  // 财务数据状态
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purposes, setPurposes] = useState<TransactionPurpose[]>([]);
  
  // 搜索输入状态
  const [searchInput, setSearchInput] = useState(searchQuery);

  // 同步外部搜索查询到输入框（只在清除搜索时）
  useEffect(() => {
    // 只有当searchQuery为空且searchInput不为空时，才同步（清除搜索的情况）
    if (searchQuery === '' && searchInput !== '') {
      setSearchInput('');
    }
  }, [searchQuery]);

  // 定义可用的字段选项
  const availableFields: FieldOption[] = [
    // 基本信息
    { key: 'name', label: '姓名', category: '基本信息', required: true },
    { key: 'email', label: '邮箱', category: '基本信息', required: true },
    { key: 'phone', label: '手机号', category: '基本信息', required: true },
    { key: 'memberId', label: '会员编号', category: '基本信息', required: true },
    { key: 'accountType', label: '用户户口类别', category: '基本信息' },
    { key: 'level', label: '等级', category: '基本信息' },
    { key: 'joinDate', label: '加入时间', category: '基本信息' },
    
    // 分会信息
    { key: 'chapterId', label: '分会Document ID', category: '分会信息' },
    { key: 'chapterName', label: '分会名称', category: '分会信息' },
    { key: 'countryName', label: '国家分会名称', category: '分会信息' },
    { key: 'worldRegion', label: '世界区域', category: '分会信息' },
    
    // 个人资料
    { key: 'profile.birthDate', label: '出生日期', category: '个人资料' },
    { key: 'profile.gender', label: '性别', category: '个人资料' },
    { key: 'profile.race', label: '种族', category: '个人资料' },
    { key: 'profile.nationality', label: '国籍', category: '个人资料' },
    { key: 'profile.address', label: '地址', category: '个人资料' },
    { key: 'profile.fullNameNric', label: '身份证全名', category: '个人资料' },
    { key: 'profile.nricOrPassport', label: '身份证/护照号', category: '个人资料' },
    
    // 职业信息
    { key: 'profile.company', label: '公司名称', category: '职业信息' },
    { key: 'profile.departmentAndPosition', label: '部门职位', category: '职业信息' },
    { key: 'profile.industryDetail', label: '行业详情', category: '职业信息' },
    { key: 'profile.ownIndustry', label: '所属行业', category: '职业信息' },
    { key: 'profile.categories', label: '业务类别', category: '职业信息' },
    { key: 'profile.companyIntro', label: '公司介绍', category: '职业信息' },
    
    // JCI相关信息
    { key: 'profile.senatorId', label: '参议员编号', category: 'JCI信息' },
    { key: 'profile.introducerName', label: '介绍人姓名', category: 'JCI信息' },
    { key: 'profile.jciEventInterests', label: 'JCI活动兴趣', category: 'JCI信息' },
    { key: 'profile.jciBenefitsExpectation', label: 'JCI期望收益', category: 'JCI信息' },
    { key: 'profile.activeMemberHow', label: '活跃会员方式', category: 'JCI信息' },
    { key: 'profile.fiveYearsVision', label: '五年愿景', category: 'JCI信息' },
    
    // 服装信息
    { key: 'profile.nameToBeEmbroidered', label: '刺绣姓名', category: '服装信息' },
    { key: 'profile.shirtSize', label: 'T恤尺寸', category: '服装信息' },
    { key: 'profile.jacketSize', label: '夹克尺寸', category: '服装信息' },
    { key: 'profile.cutting', label: '剪裁', category: '服装信息' },
    { key: 'profile.tshirtReceivingStatus', label: 'T恤接收状态', category: '服装信息' },
    
    // 社交网络
    { key: 'profile.linkedin', label: 'LinkedIn', category: '社交网络' },
    { key: 'profile.companyWebsite', label: '公司网站', category: '社交网络' },
    { key: 'profile.whatsappGroup', label: 'WhatsApp群组', category: '社交网络' },
    
    // 兴趣爱好
    { key: 'profile.hobbies', label: '兴趣爱好', category: '兴趣爱好' },
    { key: 'profile.interestedIndustries', label: '感兴趣的行业', category: '兴趣爱好' },
    { key: 'profile.acceptInternationalBusiness', label: '接受国际业务', category: '兴趣爱好' },
    
    // 职位信息
    { key: 'profile.jciPosition', label: 'JCI职位', category: '职位信息' },
    { key: 'profile.positionStartDate', label: '职位开始日期', category: '职位信息' },
    { key: 'profile.positionEndDate', label: '职位结束日期', category: '职位信息' },
    { key: 'profile.isActingPosition', label: '代理职位', category: '职位信息' },
    { key: 'profile.actingForPosition', label: '代理职位类型', category: '职位信息' },
    
    // 文件资料
    { key: 'profile.profilePhotoUrl', label: '头像', category: '文件资料' },
    { key: 'profile.paymentSlipUrl', label: '付款单', category: '文件资料' },
    
    // 日期信息
    { key: 'profile.paymentDate', label: '付款日期', category: '日期信息' },
    { key: 'profile.endorsementDate', label: '背书日期', category: '日期信息' },
    { key: 'profile.paymentVerifiedDate', label: '付款验证日期', category: '日期信息' },
  ];

  // 定义字段预设
  const fieldPresets: FieldPreset[] = [
    {
      name: '基本信息',
      description: '显示会员的基本信息字段',
      fields: ['name', 'email', 'phone', 'memberId', 'accountType', 'level', 'joinDate']
    },
    {
      name: '分会信息',
      description: '显示分会相关字段',
      fields: [
        'name', 'email', 'phone', 'memberId',
        'chapterId', 'chapterName', 'countryName', 'worldRegion'
      ]
    },
    {
      name: '完整信息',
      description: '显示所有可用字段',
      fields: availableFields.map(field => field.key)
    },
    {
      name: '职业信息',
      description: '显示职业相关字段',
      fields: [
        'name', 'email', 'phone', 'memberId',
        'profile.company', 'profile.departmentAndPosition', 
        'profile.industryDetail', 'profile.ownIndustry',
        'profile.categories', 'profile.companyIntro',
        'profile.linkedin', 'profile.companyWebsite'
      ]
    },
    {
      name: 'JCI信息',
      description: '显示JCI相关字段',
      fields: [
        'name', 'email', 'phone', 'memberId', 'accountType', 'level',
        'profile.senatorId', 'profile.introducerName',
        'profile.jciEventInterests', 'profile.jciBenefitsExpectation',
        'profile.activeMemberHow', 'profile.fiveYearsVision',
        'profile.jciPosition', 'profile.positionStartDate', 'profile.positionEndDate'
      ]
    },
    {
      name: '服装信息',
      description: '显示服装相关字段',
      fields: [
        'name', 'email', 'phone', 'memberId',
        'profile.nameToBeEmbroidered', 'profile.shirtSize',
        'profile.jacketSize', 'profile.cutting', 'profile.tshirtReceivingStatus'
      ]
    }
  ];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: yupResolver(memberFormSchema),
  });

  useEffect(() => {
    fetchMembers({ page: 1, limit: 10 });
    
    // 加载财务数据
    const loadFinanceData = async () => {
      try {
        const [transactionsData, purposesData] = await Promise.all([
          transactionService.getTransactions(),
          transactionPurposeService.getPurposes()
        ]);
        setTransactions(transactionsData);
        setPurposes(purposesData);
      } catch (error) {
        console.error('加载财务数据失败:', error);
        message.error('加载财务数据失败');
      }
    };
    
    loadFinanceData();
    
    // 从本地存储加载字段选择
    const savedFields = localStorage.getItem('memberListSelectedFields');
    if (savedFields) {
      try {
        const parsedFields = JSON.parse(savedFields);
        // 验证保存的字段是否仍然有效
        const validFields = parsedFields.filter((fieldKey: string) => 
          availableFields.some(field => field.key === fieldKey)
        );
        if (validFields.length > 0) {
          setSelectedFields(validFields);
        } else {
          // 如果没有有效字段，使用默认字段
          const defaultFields = availableFields.filter(field => field.required).map(field => field.key);
          setSelectedFields(defaultFields);
        }
      } catch (error) {
        console.error('Failed to parse saved fields:', error);
        const defaultFields = availableFields.filter(field => field.required).map(field => field.key);
        setSelectedFields(defaultFields);
      }
    } else {
      // 初始化默认选中的字段
      const defaultFields = availableFields.filter(field => field.required).map(field => field.key);
      setSelectedFields(defaultFields);
    }
  }, [fetchMembers]);

  // 字段选择处理函数
  const handleFieldSelection = (fields: string[]) => {
    setSelectedFields(fields);
    // 保存到本地存储
    localStorage.setItem('memberListSelectedFields', JSON.stringify(fields));
  };

  const handleOpenFieldSelector = () => {
    setIsFieldSelectorVisible(true);
  };

  // 批量设置处理函数
  const handleBatchSettings = () => {
    if (selectedMembers.length === 0) {
      message.warning('请先选择要批量设置的会员');
      return;
    }
    setIsBatchSettingsVisible(true);
  };

  const handleBatchSettingsConfirm = async (settings: BatchSettings) => {
    try {
      const memberIds = selectedMembers.map(member => member.id);
      
      // 构建更新数据
      let updateData: Partial<Member> = {};
      
      // 处理日期字段
      let processedValue = settings.value;
      if (settings.field === 'joinDate' && settings.value) {
        // 如果是日期选择器，转换为ISO字符串
        processedValue = settings.value.format ? settings.value.format('YYYY-MM-DD') : settings.value;
      }
      
      if (settings.field.startsWith('profile.')) {
        const profileKey = settings.field.replace('profile.', '');
        updateData = {
          profile: {
            [profileKey]: processedValue
          }
        };
      } else {
        updateData = {
          [settings.field]: processedValue
        };
      }
      
      // 调用批量更新API
      const result = await updateMembersBatch(memberIds, updateData, settings.reason);
      
      if (result.success > 0) {
        message.success(`成功批量设置 ${result.success} 个会员`);
        
        // 如果有失败的，显示错误信息
        if (result.failed > 0) {
          message.warning(`${result.failed} 个会员设置失败`);
          console.error('Batch update errors:', result.errors);
        }
        
        // 清空选择
        setSelectedMembers([]);
        
        // 刷新会员列表
        await fetchMembers({ page: pagination.page, limit: pagination.limit });
      } else {
        message.error('批量设置失败');
        throw new Error('没有会员被成功更新');
      }
    } catch (error) {
      console.error('Batch settings error:', error);
      message.error('批量设置失败');
      throw error;
    }
  };

  const handleBatchDelete = async () => {
    if (selectedMembers.length === 0) {
      message.warning('请先选择要删除的会员');
      return;
    }

    try {
      const memberIds = selectedMembers.map(member => member.id);
      
      // 调用批量删除API
      const result = await deleteMembersBatch(memberIds);
      
      if (result.success > 0) {
        message.success(`成功删除 ${result.success} 个会员`);
        
        // 如果有失败的，显示错误信息
        if (result.failed > 0) {
          message.warning(`${result.failed} 个会员删除失败`);
          console.error('Delete errors:', result.errors);
        }
        
        // 清空选择
        setSelectedMembers([]);
        
        // 刷新会员列表
        await fetchMembers({ page: pagination.page, limit: pagination.limit });
      } else {
        message.error('批量删除失败');
        throw new Error('没有会员被成功删除');
      }
    } catch (error) {
      console.error('Batch delete error:', error);
      message.error('批量删除失败');
      throw error;
    }
  };

  const handleRowSelection = {
    selectedRowKeys: selectedMembers.map(member => member.id),
    onChange: (_: React.Key[], selectedRows: Member[]) => {
      setSelectedMembers(selectedRows);
    },
    getCheckboxProps: (record: Member) => ({
      name: record.name,
    }),
  };

  const handleSearch = (value: string) => {
    // 当用户按回车或点击搜索按钮时，立即触发搜索
    setSearchInput(value);
    setSearchQuery(value);
    applySearchAndFilters();
  };

  const handleAccountTypeFilter = async (value: string | 'all') => {
    const newFilters = { ...filters, accountType: value };
    setFilters(newFilters);
    applySearchAndFilters();
  };

  const handleStatusFilter = async (value: string | 'all') => {
    const newFilters = { ...filters, status: value };
    setFilters(newFilters);
    applySearchAndFilters();
  };

  const handleLevelFilter = async (value: string | 'all') => {
    const newFilters = { ...filters, level: value };
    setFilters(newFilters);
    applySearchAndFilters();
  };

  const handleClearFilters = async () => {
    clearFilters();
    setSearchInput('');
    setSearchQuery('');
    applySearchAndFilters();
  };

  const handlePaginationChange = async (page: number, pageSize?: number) => {
    const params = {
      page,
      limit: pageSize || pagination.limit,
      search: searchQuery,
      filters
    };
    await fetchMembers(params);
  };

  const handleAddMember = () => {
    setEditingMember(null);
    reset();
    setIsModalVisible(true);
  };

  const handleBatchImport = () => {
    setIsBatchImportVisible(true);
  };

  const handleBatchImportSubmit = async (membersData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[], developerMode: boolean = false) => {
    try {
      // 使用智能导入功能，根据NRIC/护照号判断创建或更新
      const result = await smartImportMembersBatch(membersData, developerMode);
      
      // 显示详细的导入结果
      if (result.success > 0) {
        let messageText = `成功处理 ${result.success} 个会员`;
        if (result.created > 0) {
          messageText += `（新建 ${result.created} 个`;
        }
        if (result.updated > 0) {
          messageText += result.created > 0 ? `，更新 ${result.updated} 个` : `（更新 ${result.updated} 个`;
        }
        messageText += '）';
        
        message.success(messageText);
        
        // 如果有失败的，显示错误信息
        if (result.failed > 0) {
          message.warning(`${result.failed} 个会员处理失败`);
          console.error('Import errors:', result.errors);
        }
      } else {
        message.error('批量导入失败');
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleEditMember = (member: Member) => {
    setEditingMember(member);
    reset(member);
    setIsModalVisible(true);
  };

  const handleDeleteMember = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个会员吗？此操作不可撤销。',
      onOk: async () => {
        try {
          await deleteMemberById(id);
          message.success('删除成功');
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const onSubmit = async (data: MemberFormData) => {
    try {
      if (editingMember) {
        // 更新会员
        // await updateMemberById(editingMember.id, data);
        message.success('更新成功');
      } else {
        // 添加新会员 - 创建完整的会员对象
        const memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'> = {
          name: data.name,
          email: data.email,
          phone: data.phone,
          memberId: data.memberId,
          joinDate: new Date().toISOString(),
          status: 'active', // 默认状态
          level: data.level as any,
          // 分会相关字段
          chapterId: data.chapterId,
          chapterName: data.chapterName,
          countryName: data.countryName,
          worldRegion: data.worldRegion,
          profile: {
            // 基本档案信息
          }
        };
        
        await addMember(memberData);
        
        // 如果设置了账户类型，需要单独创建分类记录
        if (data.accountType && data.accountType !== 'member') {
          // 这里需要调用 categoryService 来创建分类记录
          // 由于需要 memberId，我们需要先获取新创建的会员ID
          message.info('会员已创建，请稍后在分类管理中设置用户户口类别');
        }
        
        message.success('添加成功');
      }
      setIsModalVisible(false);
      reset();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 获取字段值
  const getFieldValue = (member: Member, fieldKey: string) => {
    if (fieldKey.startsWith('profile.')) {
      const profileKey = fieldKey.replace('profile.', '');
      return member.profile?.[profileKey as keyof typeof member.profile];
    }
    return member[fieldKey as keyof Member];
  };

  // 渲染字段值
  const renderFieldValue = (member: Member, fieldKey: string): React.ReactNode => {
    const value = getFieldValue(member, fieldKey);
    
    switch (fieldKey) {
      case 'name':
        return (
          <Space>
            <UserOutlined />
            {value as string}
          </Space>
        );
      case 'accountType':
        const tagProps = getAccountTypeTagProps(value as string);
        return <Tag {...tagProps} />;
      case 'level':
        const levelMap = {
          bronze: { color: '#cd7f32', text: '铜牌' },
          silver: { color: '#c0c0c0', text: '银牌' },
          gold: { color: '#ffd700', text: '金牌' },
          platinum: { color: '#e5e4e2', text: '白金' },
          diamond: { color: '#b9f2ff', text: '钻石' },
        };
        const config = levelMap[value as MemberLevel];
        return config ? <Tag color={config.color}>{config.text}</Tag> : (value as string);
      case 'joinDate':
        return value ? new Date(value as string).toLocaleDateString() : '-';
      case 'chapterId':
        return (
          <Space>
            <Tag color="blue">{value as string || '-'}</Tag>
          </Space>
        );
      case 'chapterName':
        return (
          <Space>
            <TeamOutlined />
            <span>{value as string || '-'}</span>
          </Space>
        );
      case 'countryName':
        return (
          <Space>
            <Tag color="green">{value as string || '-'}</Tag>
          </Space>
        );
      case 'worldRegion':
        return (
          <Space>
            <Tag color="purple">{value as string || '-'}</Tag>
          </Space>
        );
      case 'profile.birthDate':
      case 'profile.paymentDate':
      case 'profile.endorsementDate':
      case 'profile.paymentVerifiedDate':
      case 'profile.positionStartDate':
      case 'profile.positionEndDate':
        return value ? new Date(value as string).toLocaleDateString() : '-';
      case 'profile.gender':
        return value === 'Male' ? '男' : value === 'Female' ? '女' : (value as string) || '-';
      case 'profile.race':
        return value === 'Chinese' ? '华人' : 
               value === 'Malay' ? '马来人' : 
               value === 'Indian' ? '印度人' : 
               value === 'Other' ? '其他' : (value as string) || '-';
      case 'profile.tshirtReceivingStatus':
        const statusMap = {
          'Pending': '待处理',
          'Requested': '已申请',
          'Processing': '处理中',
          'Delivered': '已送达'
        };
        return statusMap[value as keyof typeof statusMap] || (value as string) || '-';
      case 'profile.acceptInternationalBusiness':
        return value === 'Yes' ? '是' : 
               value === 'No' ? '否' : 
               value === 'Willing to explore' ? '愿意探索' : (value as string) || '-';
      case 'profile.whatsappGroup':
        return value === true ? '是' : value === false ? '否' : '-';
      case 'profile.isActingPosition':
        return value === true ? '是' : value === false ? '否' : '-';
      case 'profile.ownIndustry':
      case 'profile.categories':
      case 'profile.interestedIndustries':
      case 'profile.hobbies':
        return Array.isArray(value) ? value.join(', ') : (value as string) || '-';
      default:
        return (value as string) || '-';
    }
  };

  // 动态生成表格列
  const generateColumns = () => {
    const visibleFields = selectedFields.length > 0 ? selectedFields : 
      availableFields.filter(field => field.required).map(field => field.key);
    
    const columns: any[] = visibleFields.map(fieldKey => {
      const field = availableFields.find(f => f.key === fieldKey);
      return {
        title: field?.label || fieldKey,
        dataIndex: fieldKey,
        key: fieldKey,
        render: (_: any, record: Member) => renderFieldValue(record, fieldKey),
        width: fieldKey === 'name' ? 120 : 
               fieldKey === 'email' ? 200 : 
               fieldKey === 'phone' ? 120 : 
               fieldKey === 'memberId' ? 120 : 
               fieldKey === 'chapterId' ? 150 : 
               fieldKey === 'chapterName' ? 150 : 
               fieldKey === 'countryName' ? 120 : 
               fieldKey === 'worldRegion' ? 120 : 
               fieldKey === 'profile.company' ? 150 : 
               fieldKey === 'profile.departmentAndPosition' ? 150 : 
               fieldKey === 'profile.address' ? 200 : 
               fieldKey === 'profile.companyIntro' ? 200 : 
               fieldKey === 'profile.jciEventInterests' ? 200 : 
               fieldKey === 'profile.jciBenefitsExpectation' ? 200 : 
               fieldKey === 'profile.activeMemberHow' ? 200 : 
               fieldKey === 'profile.fiveYearsVision' ? 200 : 
               fieldKey === 'profile.linkedin' ? 150 : 
               fieldKey === 'profile.companyWebsite' ? 150 : 100,
      };
    });

    // 添加操作列
    columns.push({
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 120,
      render: (_: any, record: Member) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEditMember(record)}
            size="small"
          >
            编辑
          </Button>
          <Button 
            type="link" 
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteMember(record.id)}
            size="small"
          >
            删除
          </Button>
        </Space>
      ),
    });

    return columns;
  };

  const columns = generateColumns();

  const MemberListContent = () => (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 头部标题卡片 */}
      <Card 
        style={{ 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none'
        }}
        styles={{ body: { padding: '24px' } }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TeamOutlined style={{ fontSize: '32px', marginRight: '16px', color: 'white' }} />
              <div>
                <Title level={2} style={{ margin: 0, color: 'white' }}>
                  会员管理
                </Title>
                <p style={{ margin: '8px 0 0 0', fontSize: '16px', opacity: 0.9 }}>
                  管理所有会员信息、状态和权限
                </p>
              </div>
            </div>
          </Col>
          <Col>
            <Space direction="vertical" align="end">
              <Space>
                <Button 
                  icon={<SettingOutlined />}
                  onClick={handleOpenFieldSelector}
                  style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                >
                  字段设置
                </Button>
                <Button 
                  icon={<SettingOutlined />}
                  onClick={handleBatchSettings}
                  disabled={selectedMembers.length === 0}
                  style={{ 
                    background: selectedMembers.length > 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: selectedMembers.length > 0 ? 'white' : 'rgba(255,255,255,0.5)'
                  }}
                >
                  批量设置 {selectedMembers.length > 0 && `(${selectedMembers.length})`}
                </Button>
                <Button 
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: '确认批量删除',
                      content: `确定要删除选中的 ${selectedMembers.length} 个会员吗？此操作不可撤销。`,
                      okText: '确认删除',
                      okType: 'danger',
                      cancelText: '取消',
                      onOk: handleBatchDelete,
                    });
                  }}
                  disabled={selectedMembers.length === 0}
                  style={{ 
                    background: selectedMembers.length > 0 ? 'rgba(255,77,79,0.2)' : 'rgba(255,255,255,0.1)', 
                    border: '1px solid rgba(255,77,79,0.3)',
                    color: selectedMembers.length > 0 ? '#ff4d4f' : 'rgba(255,255,255,0.5)'
                  }}
                >
                  批量删除 {selectedMembers.length > 0 && `(${selectedMembers.length})`}
                </Button>
                <Button 
                  icon={<UploadOutlined />}
                  onClick={handleBatchImport}
                  style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                >
                  批量导入
                </Button>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleAddMember}
                  style={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    border: '1px solid rgba(255,255,255,0.9)',
                    color: '#667eea'
                  }}
                >
                  添加会员
                </Button>
              </Space>
              <div style={{ textAlign: 'right', color: 'white', opacity: 0.9 }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>会员总数</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{pagination.total}</div>
              </div>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #52c41a 0%, #3f8600 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic 
              title={<span style={{ color: 'white', opacity: 0.9 }}>总会员数</span>}
              value={pagination.total} 
              prefix={<UserOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              全部注册会员
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic 
              title={<span style={{ color: 'white', opacity: 0.9 }}>活跃会员</span>}
              value={members.filter(m => m.status === 'active').length} 
              prefix={<CheckCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              当前活跃状态
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic 
              title={<span style={{ color: 'white', opacity: 0.9 }}>待审核</span>}
              value={members.filter(m => m.status === 'pending').length} 
              prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              等待审核通过
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic 
              title={<span style={{ color: 'white', opacity: 0.9 }}>本月新增</span>}
              value={members.filter(m => {
                const joinDate = new Date(m.joinDate);
                const now = new Date();
                return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
              }).length} 
              prefix={<TrophyOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              本月新加入会员
            </div>
          </Card>
        </Col>
      </Row>

      {/* 搜索和筛选区域 */}
      <Card 
        title={
          <Space>
            <FilterOutlined style={{ color: '#1890ff' }} />
            <span>搜索和筛选</span>
          </Space>
        }
        style={{ marginBottom: '24px' }}
        extra={
          <Button 
            onClick={handleClearFilters}
            type="default"
            size="small"
          >
            清除筛选
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="搜索姓名、邮箱、手机号或会员编号"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择用户户口类别"
              style={{ width: '100%' }}
              size="large"
              value={filters.accountType || 'all'}
              onChange={handleAccountTypeFilter}
            >
              <Option value="all">全部类别</Option>
              {getAccountTypeFormOptions().map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择状态"
              style={{ width: '100%' }}
              size="large"
              value={filters.status || 'all'}
              onChange={handleStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">活跃</Option>
              <Option value="inactive">不活跃</Option>
              <Option value="pending">待审核</Option>
              <Option value="suspended">暂停</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择等级"
              style={{ width: '100%' }}
              size="large"
              value={filters.level || 'all'}
              onChange={handleLevelFilter}
            >
              <Option value="all">全部等级</Option>
              <Option value="bronze">铜牌</Option>
              <Option value="silver">银牌</Option>
              <Option value="gold">金牌</Option>
              <Option value="platinum">白金</Option>
              <Option value="diamond">钻石</Option>
            </Select>
          </Col>
        </Row>
        
        {/* 筛选结果显示 */}
        {(searchQuery || Object.values(filters).some(v => v && v !== 'all')) && (
          <div style={{ marginTop: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '6px' }}>
            <Space wrap>
              <span style={{ fontWeight: 'bold', color: '#1890ff' }}>当前筛选：</span>
              {searchQuery && (
                <Tag closable onClose={() => handleSearch('')} color="blue">
                  搜索: {searchQuery}
                </Tag>
              )}
              {filters.accountType && filters.accountType !== 'all' && (
                <Tag closable onClose={() => handleAccountTypeFilter('all')} color="green">
                  类别: {getAccountTypeFormOptions().find(opt => opt.value === filters.accountType)?.label}
                </Tag>
              )}
              {filters.status && filters.status !== 'all' && (
                <Tag closable onClose={() => handleStatusFilter('all')} color="orange">
                  状态: {filters.status === 'active' ? '活跃' : filters.status === 'inactive' ? '不活跃' : filters.status === 'pending' ? '待审核' : '暂停'}
                </Tag>
              )}
              {filters.level && filters.level !== 'all' && (
                <Tag closable onClose={() => handleLevelFilter('all')} color="purple">
                  等级: {filters.level === 'bronze' ? '铜牌' : filters.level === 'silver' ? '银牌' : filters.level === 'gold' ? '金牌' : filters.level === 'platinum' ? '白金' : '钻石'}
                </Tag>
              )}
            </Space>
          </div>
        )}
      </Card>

      {/* 会员列表表格 */}
      <Card 
        title={
          <Space>
            <TeamOutlined style={{ color: '#1890ff' }} />
            <span>会员列表</span>
            <Badge count={pagination.total} style={{ backgroundColor: '#52c41a' }} />
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={members}
          loading={isLoading}
          rowKey="id"
          rowSelection={handleRowSelection}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
            size: 'default',
            onChange: handlePaginationChange,
            onShowSizeChange: handlePaginationChange,
          }}
          rowClassName={(_, index) => 
            index % 2 === 0 ? 'table-row-light' : 'table-row-dark'
          }
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 添加自定义样式 */}
      <style>{`
        .table-row-light {
          background-color: #fafafa;
        }
        .table-row-dark {
          background-color: #ffffff;
        }
        .ant-table-tbody > tr:hover > td {
          background-color: #e6f7ff !important;
        }
      `}</style>
    </div>
  );

  return (
    <div>
      <Card>
        <Title level={3} style={{ marginBottom: 16 }}>会员管理</Title>
        <Tabs
          defaultActiveKey="member-list"
          size="large"
          items={[
            {
              key: 'member-list',
              label: (
                <span>
                  <TeamOutlined />
                  会员列表
                </span>
              ),
              children: <MemberListContent />
            },
            {
              key: 'senators',
              label: (
                <span>
                  <CheckCircleOutlined />
                  参议员管理
                </span>
              ),
              children: <SenatorManagement />
            },
            {
              key: 'visiting-membership',
              label: (
                <span>
                  <TrophyOutlined />
                  拜访会员管理
                </span>
              ),
              children: <VisitingMembershipManager />
            },
            {
              key: 'associate-membership',
              label: (
                <span>
                  <UserOutlined />
                  准会员管理
                </span>
              ),
              children: <AssociateMembershipManager />
            },
            {
              key: 'official-membership',
              label: (
                <span>
                  <CrownOutlined />
                  正式会员管理
                </span>
              ),
              children: <OfficialMembershipManager />
            }
          ]}
        />
      </Card>

      {/* 添加/编辑会员模态框 */}
      <Modal
        title={editingMember ? '编辑会员' : '添加会员'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          reset();
        }}
        footer={null}
        width={editingMember ? 1200 : 600}
        destroyOnHidden
        style={{ top: 20 }}
      >
        {editingMember ? (
          <ProfileEditForm
            member={editingMember}
            transactions={transactions}
            purposes={purposes}
            onSubmit={async (updated) => {
              // 通过 store 执行更新
              const { updateMemberById, fetchMembers } = useMemberStore.getState();
              await updateMemberById(editingMember.id, updated as Partial<Member>);
              await fetchMembers({ page: 1, limit: pagination.limit });
              setIsModalVisible(false);
            }}
            onCancel={() => {
              setIsModalVisible(false);
            }}
          />
        ) : (
          <Form onSubmitCapture={handleSubmit(onSubmit)} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="姓名"
                validateStatus={errors.name ? 'error' : ''}
                help={errors.name?.message}
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入姓名" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                validateStatus={errors.email ? 'error' : ''}
                help={errors.email?.message}
              >
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入邮箱" />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="手机号"
                validateStatus={errors.phone ? 'error' : ''}
                help={errors.phone?.message}
              >
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入手机号" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="会员编号"
                validateStatus={errors.memberId ? 'error' : ''}
                help={errors.memberId?.message}
              >
                <Controller
                  name="memberId"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入会员编号" />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户户口类别"
                validateStatus={errors.accountType ? 'error' : ''}
                help={errors.accountType?.message}
              >
                <Controller
                  name="accountType"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} placeholder="请选择用户户口类别">
                      {getAccountTypeFormOptions().map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="等级"
                validateStatus={errors.level ? 'error' : ''}
                help={errors.level?.message}
              >
                <Controller
                  name="level"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} placeholder="请选择等级">
                      <Option value="bronze">铜牌</Option>
                      <Option value="silver">银牌</Option>
                      <Option value="gold">金牌</Option>
                      <Option value="platinum">白金</Option>
                      <Option value="diamond">钻石</Option>
                    </Select>
                  )}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="分会Document ID"
                validateStatus={errors.chapterId ? 'error' : ''}
                help={errors.chapterId?.message}
              >
                <Controller
                  name="chapterId"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入分会Document ID" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="分会名称"
                validateStatus={errors.chapterName ? 'error' : ''}
                help={errors.chapterName?.message}
              >
                <Controller
                  name="chapterName"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入分会名称" />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="国家分会名称"
                validateStatus={errors.countryName ? 'error' : ''}
                help={errors.countryName?.message}
              >
                <Controller
                  name="countryName"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入国家分会名称" />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="世界区域"
                validateStatus={errors.worldRegion ? 'error' : ''}
                help={errors.worldRegion?.message}
              >
                <Controller
                  name="worldRegion"
                  control={control}
                  render={({ field }) => <Input {...field} placeholder="请输入世界区域" />}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
        )}
      </Modal>

      {/* 批量导入模态框 */}
      <BatchImportModal
        visible={isBatchImportVisible}
        onCancel={() => setIsBatchImportVisible(false)}
        onImport={handleBatchImportSubmit}
      />


      {/* 字段选择器 */}
      <FieldSelector
        visible={isFieldSelectorVisible}
        onClose={() => setIsFieldSelectorVisible(false)}
        onConfirm={handleFieldSelection}
        availableFields={availableFields}
        selectedFields={selectedFields}
        presets={fieldPresets}
        title="选择显示字段"
      />

      {/* 批量设置模态框 */}
      <BatchSettingsModal
        visible={isBatchSettingsVisible}
        onClose={() => setIsBatchSettingsVisible(false)}
        onConfirm={handleBatchSettingsConfirm}
        selectedMembers={selectedMembers}
        title="批量设置"
      />
    </div>
  );
};

export default MemberListPage;
