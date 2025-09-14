import React, { useState } from 'react';
import {
  Modal,
  Button,
  Table,
  Space,
  Typography,
  Alert,
  message,
  Card,
  Tag,
  Tooltip,
  Input,
  Tabs,
  Switch,
} from 'antd';
import { 
  CopyOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  FileExcelOutlined,
  TableOutlined
} from '@ant-design/icons';
import { Member, MemberStatus, MemberLevel } from '@/types';
import ExcelUpload from './ExcelUpload';
import { parseDateToDDMMMYYYY } from '@/utils/dateParser';

const { Text } = Typography;

// 通用日期输入组件
const DateInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "支持多种格式: 2024-01-15, 01/15/2024, 15/01/2024, 2024年1月15日" }) => (
  <Input
    value={value}
    onChange={(e) => {
      const inputValue = e.target.value;
      // 实时转换日期格式
      const parsedDate = parseDateToDDMMMYYYY(inputValue);
      onChange(parsedDate || inputValue);
    }}
    placeholder={placeholder}
    size="small"
  />
);

interface BatchImportModalProps {
  visible: boolean;
  onCancel: () => void;
  onImport: (members: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[], developerMode: boolean) => Promise<{ 
    success: number; 
    failed: number; 
    created: number; 
    updated: number; 
    errors: string[] 
  }>;
}

interface ParsedMember {
  // 唯一标识符
  id: string;
  
  // ========== 基本信息标签页 ==========
  
  // 个人身份信息
  name: string;
  fullNameNric?: string;
  gender?: 'Male' | 'Female' | null;
  race?: 'Chinese' | 'Malay' | 'Indian' | 'Other' | null;
  nationality?: string;
  birthDate?: string;
  nricOrPassport?: string;
  address?: string;
  
  // 联系方式
  email: string;
  phone: string;
  whatsappGroup?: boolean | null;
  
  // 个人兴趣
  hobbies?: string[];
  
  // 文件资料
  profilePhotoUrl?: string;
  
  // ========== 职业信息标签页 ==========
  
  // 公司信息
  company?: string;
  departmentAndPosition?: string;
  industryDetail?: string;
  categories?: string[];
  ownIndustry?: string[];
  companyIntro?: string;
  acceptInternationalBusiness?: 'Yes' | 'No' | 'Willing to explore' | null;
  interestedIndustries?: string[];
  
  // 社交网络
  linkedin?: string;
  companyWebsite?: string;
  
  // ========== JCI 相关标签页 ==========
  
  // 入会信息
  accountType?: string;
  status: MemberStatus;
  level: MemberLevel;
  senatorId?: string;
  memberId: string;
  introducerName?: string;
  jciEventInterests?: string;
  jciBenefitsExpectation?: string;
  activeMemberHow?: string;
  fiveYearsVision?: string;
  
  // 服装信息
  nameToBeEmbroidered?: string;
  shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | null;
  jacketSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | null;
  cutting?: 'Unisex' | 'Lady' | null;
  tshirtReceivingStatus?: 'Pending' | 'Requested' | 'Processing' | 'Delivered' | null;
  
  // ========== JCI职位标签页 ==========
  
  // 职位信息
  jciPosition?: string;
  positionStartDate?: string;
  positionEndDate?: string;
  
  // 其他字段
  joinedDate?: string;
  paymentDate?: string;
  endorsementDate?: string;
  paymentVerifiedDate?: string;
  paymentSlipUrl?: string;
  termStartDate?: string;
  termEndDate?: string;
  
  // 系统字段
  rowIndex: number;
  isValid: boolean;
  errors: string[];
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({
  visible,
  onCancel,
  onImport,
}) => {
  const [members, setMembers] = useState<ParsedMember[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ 
    success: number; 
    failed: number; 
    created: number; 
    updated: number; 
    errors: string[] 
  } | null>(null);
  const [activeTab, setActiveTab] = useState('manual');
  const [developerMode, setDeveloperMode] = useState(false);

  // 创建空行数据
  const createEmptyMember = (): ParsedMember => ({
    // 唯一标识符
    id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    
    // ========== 基本信息标签页 ==========
    
    // 个人身份信息
    name: '',
    fullNameNric: '',
    gender: null,
    race: null,
    nationality: '',
    birthDate: '',
    nricOrPassport: '',
    address: '',
    
    // 联系方式
    email: '',
    phone: '',
    whatsappGroup: null,
    
    // 个人兴趣
    hobbies: [],
    
    // 文件资料
    profilePhotoUrl: '',
    
    // ========== 职业信息标签页 ==========
    
    // 公司信息
    company: '',
    departmentAndPosition: '',
    industryDetail: '',
    categories: [],
    ownIndustry: [],
    companyIntro: '',
    acceptInternationalBusiness: null,
    interestedIndustries: [],
    
    // 社交网络
    linkedin: '',
    companyWebsite: '',
    
    // ========== JCI 相关标签页 ==========
    
    // 入会信息
    accountType: '',
    status: 'pending',
    level: 'bronze',
    senatorId: '',
    memberId: '',
    introducerName: '',
    jciEventInterests: '',
    jciBenefitsExpectation: '',
    activeMemberHow: '',
    fiveYearsVision: '',
    
    // 服装信息
    nameToBeEmbroidered: '',
    shirtSize: null,
    jacketSize: null,
    cutting: null,
    tshirtReceivingStatus: null,
    
    // ========== JCI职位标签页 ==========
    
    // 职位信息
    jciPosition: '',
    positionStartDate: '',
    positionEndDate: '',
    
    // 其他字段
    joinedDate: '',
    paymentDate: '',
    endorsementDate: '',
    paymentVerifiedDate: '',
    paymentSlipUrl: '',
    termStartDate: '',
    termEndDate: '',
    
    // 系统字段
    rowIndex: 1,
    isValid: false,
    errors: ['请填写必填字段'],
  });

  // 当模态框打开时，自动添加一行空数据
  React.useEffect(() => {
    if (visible && members.length === 0) {
      setMembers([createEmptyMember()]);
    }
  }, [visible]);

  // 验证单个会员数据
  const validateMember = (member: Omit<ParsedMember, 'id' | 'rowIndex' | 'isValid' | 'errors'>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // 检查必填字段（开发者模式可以绕过）
    if (!developerMode) {
      if (!member.name || !String(member.name).trim()) errors.push('姓名不能为空');
      if (!member.email || !String(member.email).trim()) errors.push('邮箱不能为空');
      if (!member.phone || !String(member.phone).trim()) errors.push('手机号不能为空');
      if (!member.memberId || !String(member.memberId).trim()) errors.push('会员编号不能为空');
    }
    
    // 验证邮箱格式
    if (member.email && String(member.email).trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(member.email).trim())) {
      errors.push('邮箱格式不正确');
    }

    // 验证状态
    const validStatuses: MemberStatus[] = ['active', 'inactive', 'pending', 'suspended'];
    
    // 状态值映射（中文到英文）
    const statusMapping: Record<string, MemberStatus> = {
      '活跃': 'active',
      '不活跃': 'inactive', 
      '待审核': 'pending',
      '暂停': 'suspended',
      'active': 'active',
      'inactive': 'inactive',
      'pending': 'pending',
      'suspended': 'suspended'
    };
    
    if (member.status) {
      const normalizedStatus = statusMapping[member.status] || member.status;
      if (!validStatuses.includes(normalizedStatus)) {
        errors.push('状态必须是: active(活跃), inactive(不活跃), pending(待审核), suspended(暂停)');
      }
    }

    // 验证等级
    const validLevels: MemberLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    
    // 等级值映射（中文到英文）
    const levelMapping: Record<string, MemberLevel> = {
      '铜牌': 'bronze',
      '银牌': 'silver',
      '金牌': 'gold',
      '白金': 'platinum',
      '钻石': 'diamond',
      'bronze': 'bronze',
      'silver': 'silver',
      'gold': 'gold',
      'platinum': 'platinum',
      'diamond': 'diamond'
    };
    
    if (member.level) {
      const normalizedLevel = levelMapping[member.level] || member.level;
      if (!validLevels.includes(normalizedLevel)) {
        errors.push('等级必须是: bronze(铜牌), silver(银牌), gold(金牌), platinum(白金), diamond(钻石)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // 重新验证所有成员（当开发者模式切换时）
  const revalidateAllMembers = () => {
    const newMembers = members.map(member => {
      const validation = validateMember(member);
      return {
        ...member,
        isValid: validation.isValid,
        errors: validation.errors,
      };
    });
    setMembers(newMembers);
  };

  // 监听开发者模式变化，重新验证所有成员
  React.useEffect(() => {
    if (members.length > 0) {
      revalidateAllMembers();
    }
  }, [developerMode]);

  // 解析粘贴的数据
  const parsePastedData = (data: string): ParsedMember[] => {
    const lines = data.trim().split('\n');
    if (lines.length < 1) return [];

    const members: ParsedMember[] = [];

    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const memberData = {
        // ========== 基本信息标签页 ==========
        
        // 个人身份信息
        name: values[0] ? String(values[0]).trim() : '',
        fullNameNric: values[1] ? String(values[1]).trim() : '',
        gender: values[2] ? (String(values[2]).trim() as 'Male' | 'Female') : null,
        race: values[3] ? (String(values[3]).trim() as 'Chinese' | 'Malay' | 'Indian' | 'Other') : null,
        nationality: values[4] ? String(values[4]).trim() : '',
        birthDate: values[5] ? parseDateToDDMMMYYYY(String(values[5]).trim()) : '',
        nricOrPassport: values[6] ? String(values[6]).trim() : '',
        address: values[7] ? String(values[7]).trim() : '',
        
        // 联系方式
        email: values[8] ? String(values[8]).trim() : '',
        phone: values[9] ? String(values[9]).trim() : '',
        whatsappGroup: values[10] ? (String(values[10]).trim() === 'true' || String(values[10]).trim() === '是') : false,
        
        // 个人兴趣
        hobbies: values[11] ? (String(values[11]).trim() ? String(values[11]).split(',').map(s => s.trim()).filter(s => s) : []) : [],
        
        // 文件资料
        profilePhotoUrl: values[12] ? String(values[12]).trim() : '',
        
        // ========== 职业信息标签页 ==========
        
        // 公司信息
        company: values[13] ? String(values[13]).trim() : '',
        departmentAndPosition: values[14] ? String(values[14]).trim() : '',
        industryDetail: values[15] ? String(values[15]).trim() : '',
        categories: values[16] ? (String(values[16]).trim() ? String(values[16]).split(',').map(s => s.trim()).filter(s => s) : []) : [],
        ownIndustry: values[17] ? (String(values[17]).trim() ? String(values[17]).split(',').map(s => s.trim()).filter(s => s) : []) : [],
        companyIntro: values[18] ? String(values[18]).trim() : '',
        acceptInternationalBusiness: values[19] ? (String(values[19]).trim() as 'Yes' | 'No' | 'Willing to explore') : null,
        interestedIndustries: values[20] ? (String(values[20]).trim() ? String(values[20]).split(',').map(s => s.trim()).filter(s => s) : []) : [],
        
        // 社交网络
        linkedin: values[21] ? String(values[21]).trim() : '',
        companyWebsite: values[22] ? String(values[22]).trim() : '',
        
        // ========== JCI 相关标签页 ==========
        
        // 入会信息
        accountType: values[23] ? String(values[23]).trim() : '',
        status: values[24] ? (() => {
          const statusValue = String(values[24]).trim();
          const statusMapping: Record<string, MemberStatus> = {
            '活跃': 'active',
            '不活跃': 'inactive', 
            '待审核': 'pending',
            '暂停': 'suspended',
            'active': 'active',
            'inactive': 'inactive',
            'pending': 'pending',
            'suspended': 'suspended'
          };
          return statusMapping[statusValue] || statusValue as MemberStatus;
        })() : 'pending',
        level: values[25] ? (() => {
          const levelValue = String(values[25]).trim();
          const levelMapping: Record<string, MemberLevel> = {
            '铜牌': 'bronze',
            '银牌': 'silver',
            '金牌': 'gold',
            '白金': 'platinum',
            '钻石': 'diamond',
            'bronze': 'bronze',
            'silver': 'silver',
            'gold': 'gold',
            'platinum': 'platinum',
            'diamond': 'diamond'
          };
          return levelMapping[levelValue] || levelValue as MemberLevel;
        })() : 'bronze',
        senatorId: values[25] ? String(values[25]).trim() : '',
        memberId: values[26] ? String(values[26]).trim() : '',
        introducerName: values[27] ? String(values[27]).trim() : '',
        jciEventInterests: values[28] ? String(values[28]).trim() : '',
        jciBenefitsExpectation: values[29] ? String(values[29]).trim() : '',
        activeMemberHow: values[30] ? String(values[30]).trim() : '',
        fiveYearsVision: values[31] ? String(values[31]).trim() : '',
        
        // 服装信息
        nameToBeEmbroidered: values[32] ? String(values[32]).trim() : '',
        shirtSize: values[33] ? (String(values[33]).trim() as 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL') : null,
        jacketSize: values[34] ? (String(values[34]).trim() as 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL') : null,
        cutting: values[35] ? (String(values[35]).trim() as 'Unisex' | 'Lady') : null,
        tshirtReceivingStatus: values[36] ? (String(values[36]).trim() as 'Pending' | 'Requested' | 'Processing' | 'Delivered') : null,
        
        // ========== JCI职位标签页 ==========
        
        // 职位信息
        jciPosition: values[37] ? String(values[37]).trim() : '',
        positionStartDate: values[38] ? parseDateToDDMMMYYYY(String(values[38]).trim()) : '',
        positionEndDate: values[39] ? parseDateToDDMMMYYYY(String(values[39]).trim()) : '',
        
        // 其他字段
        joinedDate: values[40] ? parseDateToDDMMMYYYY(String(values[40]).trim()) : '',
        paymentDate: values[41] ? parseDateToDDMMMYYYY(String(values[41]).trim()) : '',
        endorsementDate: values[42] ? parseDateToDDMMMYYYY(String(values[42]).trim()) : '',
        paymentVerifiedDate: values[43] ? parseDateToDDMMMYYYY(String(values[43]).trim()) : '',
        paymentSlipUrl: values[44] ? String(values[44]).trim() : '',
        termStartDate: values[45] ? parseDateToDDMMMYYYY(String(values[45]).trim()) : '',
        termEndDate: values[46] ? parseDateToDDMMMYYYY(String(values[46]).trim()) : '',
      };

      const validation = validateMember(memberData);
      
      const member: ParsedMember = {
        ...memberData,
        id: `member-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        rowIndex: i,
        isValid: validation.isValid,
        errors: validation.errors,
      };

      members.push(member);
    }

    return members;
  };

  // 处理粘贴事件
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // 检查数据格式
    const lines = pastedData.trim().split('\n');
    if (lines.length >= 1) {
      const firstLineFields = lines[0].split('\t');
      // console.log(`粘贴数据字段数量: ${firstLineFields.length}`);
      
      if (firstLineFields.length < 47) {
        message.warning(`检测到只有 ${firstLineFields.length} 个字段，预期 47 个字段。请确保使用制表符分隔数据，不是空格。`);
      }
    }
    
    const parsedMembers = parsePastedData(pastedData);
    // 追加到现有数据，而不是替换
    setMembers(prevMembers => [...prevMembers, ...parsedMembers]);
    setImportResult(null);
  };

  // 添加新行
  const addNewRow = () => {
    const newMember = createEmptyMember();
    newMember.rowIndex = members.length + 1;
    setMembers([...members, newMember]);
  };

  // 删除行
  const deleteRow = (index: number) => {
    const newMembers = members.filter((_, i) => i !== index);
    // 如果删除后表格为空，自动添加一行
    if (newMembers.length === 0) {
      const emptyMember = createEmptyMember();
      setMembers([emptyMember]);
    } else {
      setMembers(newMembers);
    }
  };

  // 更新会员数据
  const updateMember = (index: number, field: keyof ParsedMember, value: any) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    
    // 重新验证
    const validation = validateMember(newMembers[index]);
    newMembers[index].isValid = validation.isValid;
    newMembers[index].errors = validation.errors;
    
    setMembers(newMembers);
  };

  const handleImport = async () => {
    if (members.length === 0) {
      message.warning('请先添加数据');
      return;
    }

    // 在开发者模式下，允许导入所有记录（忽略isValid检查）
    const validMembers = developerMode ? members : members.filter(m => m.isValid);
    if (validMembers.length === 0) {
      message.error('没有有效的数据可以导入');
      return;
    }

    setIsImporting(true);
    try {
      const result = await onImport(validMembers.map(m => ({
        // ========== 基本信息标签页 ==========
        
        // 个人身份信息
        name: m.name,
        phone: m.phone,
        joinDate: new Date().toISOString(),
        profile: {
          // 个人身份信息
          fullNameNric: m.fullNameNric || '',
          gender: m.gender === 'Male' ? 'Male' : m.gender === 'Female' ? 'Female' : null,
          race: m.race,
          nationality: m.nationality || '',
          birthDate: m.birthDate || '',
          nricOrPassport: m.nricOrPassport || '',
          address: m.address || '',
          
          // 联系方式
          whatsappGroup: m.whatsappGroup,
          
          // 个人兴趣
          hobbies: (m.hobbies || []) as any,
          
          // 文件资料
          profilePhotoUrl: m.profilePhotoUrl || '',
          
          // ========== 职业信息标签页 ==========
          
          // 公司信息
          company: m.company || '',
          departmentAndPosition: m.departmentAndPosition || '',
          industryDetail: m.industryDetail || '',
          categories: (m.categories || []) as any,
          ownIndustry: (m.ownIndustry || []) as any,
          companyIntro: m.companyIntro || '',
          acceptInternationalBusiness: m.acceptInternationalBusiness,
          interestedIndustries: (m.interestedIndustries || []) as any,
          
          // 社交网络
          linkedin: m.linkedin || '',
          companyWebsite: m.companyWebsite || '',
          
          // ========== JCI 相关标签页 ==========
          
          // 入会信息
          senatorId: m.senatorId || '',
          introducerName: m.introducerName || '',
          jciEventInterests: m.jciEventInterests || '',
          jciBenefitsExpectation: m.jciBenefitsExpectation || '',
          activeMemberHow: m.activeMemberHow || '',
          fiveYearsVision: m.fiveYearsVision || '',
          
          // 服装信息
          nameToBeEmbroidered: m.nameToBeEmbroidered || '',
          shirtSize: m.shirtSize,
          jacketSize: m.jacketSize,
          cutting: m.cutting,
          tshirtReceivingStatus: m.tshirtReceivingStatus,
          
          // ========== JCI职位标签页 ==========
          
          // 职位信息
          jciPosition: m.jciPosition as any || '',
          positionStartDate: m.positionStartDate || '',
          positionEndDate: m.positionEndDate || '',
          
          // 其他字段
          accountType: m.accountType || '',
          joinedDate: m.joinedDate || '',
          paymentDate: m.paymentDate || '',
          endorsementDate: m.endorsementDate || '',
          paymentVerifiedDate: m.paymentVerifiedDate || '',
          paymentSlipUrl: m.paymentSlipUrl || '',
          termStartDate: m.termStartDate || '',
          termEndDate: m.termEndDate || '',
        },
        // 系统字段
        email: m.email,
        memberId: m.memberId,
        status: m.status,
        level: m.level,
      })), developerMode);
      
      setImportResult(result);
      
      // 显示详细的导入结果
      let messageText = `导入完成！成功: ${result.success} 条`;
      if (result.created > 0) {
        messageText += `（新建 ${result.created} 条`;
      }
      if (result.updated > 0) {
        messageText += result.created > 0 ? `，更新 ${result.updated} 条` : `（更新 ${result.updated} 条`;
      }
      messageText += '）';
      if (result.failed > 0) {
        messageText += `，失败: ${result.failed} 条`;
      }
      
      message.success(messageText);
    } catch (error) {
      message.error('导入失败');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClear = () => {
    setMembers([createEmptyMember()]);
    setImportResult(null);
  };

  const handleLoadExample = () => {
    // 示例数据已清空
    const exampleData = `姓名\t完整姓名(NRIC)\t性别\t种族\t国籍\t出生日期\tNRIC/护照号\t地址\t邮箱\t手机号\tWhatsApp群组\t兴趣爱好\t头像链接\t公司\t职位\t行业详情\t类别\t自身行业\t公司简介\t接受国际商务\t关注行业\tLinkedIn\t公司网站\t户口类别\t状态\t等级\t参议员编号\t会员编号\t介绍人\tJCI活动兴趣\tJCI期望收益\t如何成为活跃会员\t五年愿景\t刺绣姓名\tT恤尺码\t外套尺码\tT恤版型\tT恤领取状态\tJCI职位\t职位开始日期\t职位结束日期\t入会日期\t付款日期\t背书日期\t核验日期\t付款凭证链接\t任期开始日期\t任期结束日期`;
    const parsedMembers = parsePastedData(exampleData);
    setMembers(parsedMembers);
  };

  const handleCopyTemplate = () => {
    const template = `姓名\t完整姓名(NRIC)\t性别\t种族\t国籍\t出生日期\tNRIC/护照号\t地址\t邮箱\t手机号\tWhatsApp群组\t兴趣爱好\t头像链接\t公司\t职位\t行业详情\t类别\t自身行业\t公司简介\t接受国际商务\t关注行业\tLinkedIn\t公司网站\t户口类别\t状态\t等级\t参议员编号\t会员编号\t介绍人\tJCI活动兴趣\tJCI期望收益\t如何成为活跃会员\t五年愿景\t刺绣姓名\tT恤尺码\t外套尺码\tT恤版型\tT恤领取状态\tJCI职位\t职位开始日期\t职位结束日期\t入会日期\t付款日期\t背书日期\t核验日期\t付款凭证链接\t任期开始日期\t任期结束日期`;
    navigator.clipboard.writeText(template).then(() => {
      message.success('模板已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 处理Excel数据导入
  const handleExcelDataParsed = (excelMembers: any[]) => {
    // 为Excel数据添加唯一ID和rowIndex
    const membersWithIds = excelMembers.map((member, index) => ({
      ...member,
      id: `excel-member-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      rowIndex: index + 1,
      isValid: true, // Excel数据假设是有效的，后续会重新验证
      errors: [],
    }));
    
    setMembers(membersWithIds);
    setImportResult(null);
    setActiveTab('manual'); // 切换到手动编辑标签页
    message.success(`成功导入 ${excelMembers.length} 条记录，请检查数据后点击导入`);
  };

  const columns = [
    {
      title: '状态',
      key: 'status',
      width: 60,
      fixed: 'left' as const,
      render: (_: any, record: ParsedMember) => (
        record.isValid ? 
          <Tag color="green" icon={<CheckCircleOutlined />}>有效</Tag> : 
          <Tag color="red" icon={<CloseCircleOutlined />}>无效</Tag>
      ),
    },
    // ========== 基本信息标签页 ==========
    
    // 个人身份信息
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      fixed: 'left' as const,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'name', e.target.value)}
          placeholder="姓名"
          size="small"
        />
      ),
    },
    {
      title: '完整姓名(NRIC)',
      dataIndex: 'fullNameNric',
      key: 'fullNameNric',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'fullNameNric', e.target.value)}
          placeholder="完整姓名(NRIC)"
          size="small"
        />
      ),
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
      render: (gender: 'Male' | 'Female' | null, _: ParsedMember, index: number) => (
        <select
          value={gender || ''}
          onChange={(e) => updateMember(index, 'gender', e.target.value as 'Male' | 'Female' | null)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="">请选择</option>
          <option value="Male">男</option>
          <option value="Female">女</option>
        </select>
      ),
    },
    {
      title: '种族',
      dataIndex: 'race',
      key: 'race',
      width: 80,
      render: (race: 'Chinese' | 'Malay' | 'Indian' | 'Other' | null, _: ParsedMember, index: number) => (
        <select
          value={race || ''}
          onChange={(e) => updateMember(index, 'race', e.target.value as 'Chinese' | 'Malay' | 'Indian' | 'Other' | null)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="">请选择</option>
          <option value="Chinese">华人</option>
          <option value="Malay">马来人</option>
          <option value="Indian">印度人</option>
          <option value="Other">其他</option>
        </select>
      ),
    },
    {
      title: '国籍',
      dataIndex: 'nationality',
      key: 'nationality',
      width: 80,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'nationality', e.target.value)}
          placeholder="国籍"
          size="small"
        />
      ),
    },
    {
      title: '出生日期',
      dataIndex: 'birthDate',
      key: 'birthDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <DateInput
          value={text}
          onChange={(value) => updateMember(index, 'birthDate', value)}
          placeholder="支持多种格式: 1990-01-15, 01/15/1990, 15/01/1990, 1990年1月15日"
        />
      ),
    },
    {
      title: 'NRIC/护照号',
      dataIndex: 'nricOrPassport',
      key: 'nricOrPassport',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'nricOrPassport', e.target.value)}
          placeholder="NRIC/护照号"
          size="small"
        />
      ),
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'address', e.target.value)}
          placeholder="地址"
          size="small"
        />
      ),
    },
    
    // 联系方式
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 150,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'email', e.target.value)}
          placeholder="邮箱"
          size="small"
        />
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'phone', e.target.value)}
          placeholder="手机号"
          size="small"
        />
      ),
    },
    {
      title: 'WhatsApp群组',
      dataIndex: 'whatsappGroup',
      key: 'whatsappGroup',
      width: 100,
      render: (value: boolean | null, _: ParsedMember, index: number) => (
        <select
          value={value === true ? 'true' : value === false ? 'false' : ''}
          onChange={(e) => updateMember(index, 'whatsappGroup', e.target.value === 'true' ? true : e.target.value === 'false' ? false : null)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="">请选择</option>
          <option value="true">是</option>
          <option value="false">否</option>
        </select>
      ),
    },
    
    // 个人兴趣
    {
      title: '兴趣爱好',
      dataIndex: 'hobbies',
      key: 'hobbies',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'hobbies', e.target.value)}
          placeholder="兴趣爱好"
          size="small"
        />
      ),
    },
    
    // 文件资料
    {
      title: '头像链接',
      dataIndex: 'profilePhotoUrl',
      key: 'profilePhotoUrl',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'profilePhotoUrl', e.target.value)}
          placeholder="头像链接"
          size="small"
        />
      ),
    },
    // ========== 职业信息标签页 ==========
    
    // 公司信息
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'company', e.target.value)}
          placeholder="公司"
          size="small"
        />
      ),
    },
    {
      title: '职位',
      dataIndex: 'departmentAndPosition',
      key: 'departmentAndPosition',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'departmentAndPosition', e.target.value)}
          placeholder="职位"
          size="small"
        />
      ),
    },
    {
      title: '行业详情',
      dataIndex: 'industryDetail',
      key: 'industryDetail',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'industryDetail', e.target.value)}
          placeholder="行业详情"
          size="small"
        />
      ),
    },
    {
      title: '类别',
      dataIndex: 'categories',
      key: 'categories',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'categories', e.target.value)}
          placeholder="类别"
          size="small"
        />
      ),
    },
    {
      title: '自身行业',
      dataIndex: 'ownIndustry',
      key: 'ownIndustry',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'ownIndustry', e.target.value)}
          placeholder="自身行业"
          size="small"
        />
      ),
    },
    {
      title: '公司简介',
      dataIndex: 'companyIntro',
      key: 'companyIntro',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'companyIntro', e.target.value)}
          placeholder="公司简介"
          size="small"
        />
      ),
    },
    {
      title: '接受国际商务',
      dataIndex: 'acceptInternationalBusiness',
      key: 'acceptInternationalBusiness',
      width: 120,
      render: (value: 'Yes' | 'No' | 'Willing to explore' | null, _: ParsedMember, index: number) => (
        <select
          value={value || ''}
          onChange={(e) => updateMember(index, 'acceptInternationalBusiness', e.target.value as 'Yes' | 'No' | 'Willing to explore' | null)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="">请选择</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
          <option value="Willing to explore">Willing to explore</option>
        </select>
      ),
    },
    {
      title: '关注行业',
      dataIndex: 'interestedIndustries',
      key: 'interestedIndustries',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'interestedIndustries', e.target.value)}
          placeholder="关注行业"
          size="small"
        />
      ),
    },
    
    // 社交网络
    {
      title: 'LinkedIn',
      dataIndex: 'linkedin',
      key: 'linkedin',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'linkedin', e.target.value)}
          placeholder="LinkedIn"
          size="small"
        />
      ),
    },
    {
      title: '公司网站',
      dataIndex: 'companyWebsite',
      key: 'companyWebsite',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'companyWebsite', e.target.value)}
          placeholder="公司网站"
          size="small"
        />
      ),
    },
    // ========== JCI 相关标签页 ==========
    
    // 入会信息
    {
      title: '户口类别',
      dataIndex: 'accountType',
      key: 'accountType',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'accountType', e.target.value)}
          placeholder="户口类别"
          size="small"
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: MemberStatus, _: ParsedMember, index: number) => (
        <select
          value={status}
          onChange={(e) => updateMember(index, 'status', e.target.value as MemberStatus)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="active">活跃</option>
          <option value="inactive">非活跃</option>
          <option value="pending">待审核</option>
          <option value="suspended">已暂停</option>
        </select>
      ),
    },
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: MemberLevel, _: ParsedMember, index: number) => (
        <select
          value={level}
          onChange={(e) => updateMember(index, 'level', e.target.value as MemberLevel)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="bronze">铜牌</option>
          <option value="silver">银牌</option>
          <option value="gold">金牌</option>
          <option value="platinum">白金</option>
          <option value="diamond">钻石</option>
        </select>
      ),
    },
    {
      title: '参议员编号',
      dataIndex: 'senatorId',
      key: 'senatorId',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'senatorId', e.target.value)}
          placeholder="参议员编号"
          size="small"
        />
      ),
    },
    {
      title: '会员编号',
      dataIndex: 'memberId',
      key: 'memberId',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'memberId', e.target.value)}
          placeholder="会员编号"
          size="small"
        />
      ),
    },
    {
      title: '介绍人',
      dataIndex: 'introducerName',
      key: 'introducerName',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'introducerName', e.target.value)}
          placeholder="介绍人"
          size="small"
        />
      ),
    },
    {
      title: 'JCI活动兴趣',
      dataIndex: 'jciEventInterests',
      key: 'jciEventInterests',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'jciEventInterests', e.target.value)}
          placeholder="JCI活动兴趣"
          size="small"
        />
      ),
    },
    {
      title: 'JCI期望收益',
      dataIndex: 'jciBenefitsExpectation',
      key: 'jciBenefitsExpectation',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'jciBenefitsExpectation', e.target.value)}
          placeholder="JCI期望收益"
          size="small"
        />
      ),
    },
    {
      title: '如何成为活跃会员',
      dataIndex: 'activeMemberHow',
      key: 'activeMemberHow',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'activeMemberHow', e.target.value)}
          placeholder="如何成为活跃会员"
          size="small"
        />
      ),
    },
    {
      title: '五年愿景',
      dataIndex: 'fiveYearsVision',
      key: 'fiveYearsVision',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'fiveYearsVision', e.target.value)}
          placeholder="五年愿景"
          size="small"
        />
      ),
    },
    // 服装信息
    {
      title: '刺绣姓名',
      dataIndex: 'nameToBeEmbroidered',
      key: 'nameToBeEmbroidered',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'nameToBeEmbroidered', e.target.value)}
          placeholder="刺绣姓名"
          size="small"
        />
      ),
    },
    {
      title: 'T恤尺码',
      dataIndex: 'shirtSize',
      key: 'shirtSize',
      width: 80,
      render: (size: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | null, _: ParsedMember, index: number) => (
        <select
          value={size || ''}
          onChange={(e) => updateMember(index, 'shirtSize', e.target.value as 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | null)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="">请选择</option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="2XL">2XL</option>
          <option value="3XL">3XL</option>
        </select>
      ),
    },
    {
      title: '外套尺码',
      dataIndex: 'jacketSize',
      key: 'jacketSize',
      width: 80,
      render: (size: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | null, _: ParsedMember, index: number) => (
        <select
          value={size || ''}
          onChange={(e) => updateMember(index, 'jacketSize', e.target.value as 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | null)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="">请选择</option>
          <option value="XS">XS</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
          <option value="2XL">2XL</option>
          <option value="3XL">3XL</option>
        </select>
      ),
    },
    {
      title: 'T恤版型',
      dataIndex: 'cutting',
      key: 'cutting',
      width: 80,
      render: (cutting: 'Unisex' | 'Lady' | null, _: ParsedMember, index: number) => (
        <select
          value={cutting || ''}
          onChange={(e) => updateMember(index, 'cutting', e.target.value as 'Unisex' | 'Lady' | null)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="">请选择</option>
          <option value="Unisex">Unisex</option>
          <option value="Lady">Lady</option>
        </select>
      ),
    },
    {
      title: 'T恤领取状态',
      dataIndex: 'tshirtReceivingStatus',
      key: 'tshirtReceivingStatus',
      width: 100,
      render: (status: 'Pending' | 'Requested' | 'Processing' | 'Delivered' | null, _: ParsedMember, index: number) => (
        <select
          value={status || ''}
          onChange={(e) => updateMember(index, 'tshirtReceivingStatus', e.target.value as 'Pending' | 'Requested' | 'Processing' | 'Delivered' | null)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="">请选择</option>
          <option value="Pending">Pending</option>
          <option value="Requested">Requested</option>
          <option value="Processing">Processing</option>
          <option value="Delivered">Delivered</option>
        </select>
      ),
    },
    
    // ========== JCI职位标签页 ==========
    
    // 职位信息
    {
      title: 'JCI职位',
      dataIndex: 'jciPosition',
      key: 'jciPosition',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'jciPosition', e.target.value)}
          placeholder="JCI职位"
          size="small"
        />
      ),
    },
    {
      title: '职位开始日期',
      dataIndex: 'positionStartDate',
      key: 'positionStartDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <DateInput
          value={text}
          onChange={(value) => updateMember(index, 'positionStartDate', value)}
          placeholder="职位开始日期"
        />
      ),
    },
    {
      title: '职位结束日期',
      dataIndex: 'positionEndDate',
      key: 'positionEndDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <DateInput
          value={text}
          onChange={(value) => updateMember(index, 'positionEndDate', value)}
          placeholder="职位结束日期"
        />
      ),
    },
    // 其他字段
    {
      title: '入会日期',
      dataIndex: 'joinedDate',
      key: 'joinedDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <DateInput
          value={text}
          onChange={(value) => updateMember(index, 'joinedDate', value)}
          placeholder="入会日期"
        />
      ),
    },
    {
      title: '付款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <DateInput
          value={text}
          onChange={(value) => updateMember(index, 'paymentDate', value)}
          placeholder="付款日期"
        />
      ),
    },
    {
      title: '背书日期',
      dataIndex: 'endorsementDate',
      key: 'endorsementDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <DateInput
          value={text}
          onChange={(value) => updateMember(index, 'endorsementDate', value)}
          placeholder="背书日期"
        />
      ),
    },
    {
      title: '核验日期',
      dataIndex: 'paymentVerifiedDate',
      key: 'paymentVerifiedDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <DateInput
          value={text}
          onChange={(value) => updateMember(index, 'paymentVerifiedDate', value)}
          placeholder="核验日期"
        />
      ),
    },
    {
      title: '付款凭证链接',
      dataIndex: 'paymentSlipUrl',
      key: 'paymentSlipUrl',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'paymentSlipUrl', e.target.value)}
          placeholder="付款凭证链接"
          size="small"
        />
      ),
    },
    {
      title: '任期开始日期',
      dataIndex: 'termStartDate',
      key: 'termStartDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <DateInput
          value={text}
          onChange={(value) => updateMember(index, 'termStartDate', value)}
          placeholder="任期开始日期"
        />
      ),
    },
    {
      title: '任期结束日期',
      dataIndex: 'termEndDate',
      key: 'termEndDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <DateInput
          value={text}
          onChange={(value) => updateMember(index, 'termEndDate', value)}
          placeholder="任期结束日期"
        />
      ),
    },
    // 操作和错误列
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, _record: ParsedMember, index: number) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => deleteRow(index)}
        >
          删除
        </Button>
      ),
    },
    {
      title: '错误',
      key: 'errors',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, record: ParsedMember) => (
        record.errors.length > 0 ? (
          <Tooltip title={record.errors.join(', ')}>
            <Tag color="red" style={{ fontSize: '10px' }}>{record.errors.length}</Tag>
          </Tooltip>
        ) : null
      ),
    },
  ];

  const validCount = members.filter(m => m.isValid).length;
  const invalidCount = members.filter(m => !m.isValid).length;

  const tabItems = [
    {
      key: 'excel',
      label: (
        <span>
          <FileExcelOutlined />
          Excel导入
        </span>
      ),
      children: (
        <ExcelUpload 
          onDataParsed={handleExcelDataParsed}
          onTemplateDownload={handleCopyTemplate}
        />
      ),
    },
    {
      key: 'manual',
      label: (
        <span>
          <TableOutlined />
          手动编辑
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={addNewRow}
              >
                添加新行
              </Button>
              <Button 
                onClick={handleLoadExample}
              >
                加载示例数据
              </Button>
              <Button 
                onClick={handleCopyTemplate}
                icon={<CopyOutlined />}
              >
                复制模板
              </Button>
              <Button 
                onClick={handleClear}
                icon={<DeleteOutlined />}
                danger
              >
                清空数据
              </Button>
            </Space>
          </div>
          
          {/* 开发者模式开关 */}
          <Card 
            size="small" 
            style={{ 
              marginBottom: 16, 
              background: developerMode ? '#fff7e6' : '#f6ffed',
              border: developerMode ? '1px solid #ffd591' : '1px solid #b7eb8f'
            }}
          >
            <Space align="center">
              <Switch
                checked={developerMode}
                onChange={setDeveloperMode}
                checkedChildren="开发者模式"
                unCheckedChildren="正常模式"
              />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {developerMode ? '已绕过必填字段验证，所有字段变为选填' : '启用必填字段验证'}
              </Text>
            </Space>
          </Card>


          <div style={{ marginBottom: 16 }}>
            <Space>
              <Text strong>有效记录: {validCount}</Text>
              <Text strong>无效记录: {invalidCount}</Text>
            </Space>
          </div>

          <div style={{ marginBottom: 16, fontSize: '12px', color: '#666' }}>
                可以直接在表格中编辑，或从Excel复制数据粘贴到此处
              </div>
              <div onPaste={handlePaste}>
                <Table
                  columns={columns}
                  dataSource={members}
                  pagination={false}
                  size="small"
                  scroll={{ x: 2000, y: 400 }}
                  rowKey={(record) => record.id}
                />
              </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="批量导入会员"
      open={visible}
      onCancel={onCancel}
      width={1600}
      style={{ top: 20 }}
      footer={
        <div style={{ padding: '16px 0', textAlign: 'left' }}>
          <Alert
            message="使用说明"
            description={
              <div style={{ textAlign: 'left' }}>
                <p style={{ textAlign: 'left', margin: '4px 0' }}><strong>智能导入功能：</strong>系统将根据NRIC/护照号自动判断操作类型</p>
                <ul style={{ textAlign: 'left', margin: '4px 0', paddingLeft: '20px' }}>
                  <li><strong>新建记录</strong>：如果NRIC/护照号不存在，将创建新的会员记录</li>
                  <li><strong>更新记录</strong>：如果NRIC/护照号已存在，将更新现有会员的信息</li>
                  <li><strong>无NRIC/护照号</strong>：将直接创建新记录</li>
                </ul>
                <p style={{ textAlign: 'left', margin: '4px 0' }}><strong>操作步骤：</strong></p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>1. 您可以直接在表格中编辑数据</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>2. 也可以从Excel复制数据粘贴到此处</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>3. 点击"加载示例数据"查看数据格式示例</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>4. 点击"复制模板"获取Excel模板</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>5. 支持添加新行和删除行操作，删除所有行后会自动添加一行空数据</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}><strong>注意事项：</strong></p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>• 粘贴数据时请确保使用制表符分隔，不是空格。如果只有14个字段，请检查数据格式。</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>• <strong>状态值：</strong>支持中文(待审核/活跃/不活跃/暂停)或英文(pending/active/inactive/suspended)</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>• <strong>等级值：</strong>支持中文(铜牌/银牌/金牌/白金/钻石)或英文(bronze/silver/gold/platinum/diamond)</p>
                {developerMode && (
                  <p style={{ color: '#fa8c16', fontWeight: 'bold', textAlign: 'left', margin: '4px 0' }}>
                    ⚠️ 开发者模式已启用：必填字段验证已绕过，所有字段变为选填
                  </p>
                )}
                <details style={{ marginTop: 8, textAlign: 'left' }}>
                  <summary style={{ textAlign: 'left' }}><strong>字段列表（按ProfileEditForm顺序）：</strong></summary>
                  <div style={{ marginTop: 8, fontSize: '12px', lineHeight: '1.4', textAlign: 'left' }}>
                    <strong>基本信息标签页：</strong><br/>
                    1.姓名 2.完整姓名(NRIC) 3.性别 4.种族 5.国籍 6.出生日期 7.NRIC/护照号 8.地址 9.邮箱 10.手机号 11.WhatsApp群组 12.兴趣爱好 13.头像链接<br/>
                    <strong>职业信息标签页：</strong><br/>
                    14.公司 15.职位 16.行业详情 17.类别 18.自身行业 19.公司简介 20.接受国际商务 21.关注行业 22.LinkedIn 23.公司网站<br/>
                    <strong>JCI 相关标签页：</strong><br/>
                    24.户口类别 25.状态 26.等级 27.参议员编号 28.会员编号 29.介绍人 30.JCI活动兴趣 31.JCI期望收益 32.如何成为活跃会员 33.五年愿景<br/>
                    <strong>服装信息标签页：</strong><br/>
                    34.刺绣姓名 35.T恤尺码 36.外套尺码 37.T恤版型 38.T恤领取状态<br/>
                    <strong>JCI职位标签页：</strong><br/>
                    39.JCI职位 40.职位开始日期 41.职位结束日期<br/>
                    <strong>其他字段：</strong><br/>
                    42.入会日期 43.付款日期 44.背书日期 45.核验日期 46.付款凭证链接 47.任期开始日期 48.任期结束日期
                  </div>
                </details>
              </div>
            }
            type="info"
            showIcon
          />
        </div>
      }
      destroyOnHidden
    >
      <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={tabItems}
        />

        {importResult && (
          <Card style={{ marginTop: 16 }}>
            <Alert
              message={
                <div>
                  <div>导入完成：成功 {importResult.success} 条</div>
                  {importResult.created > 0 && (
                    <div style={{ fontSize: '12px', color: '#52c41a', marginTop: 4 }}>
                      ✓ 新建 {importResult.created} 条记录
                    </div>
                  )}
                  {importResult.updated > 0 && (
                    <div style={{ fontSize: '12px', color: '#1890ff', marginTop: 4 }}>
                      ↻ 更新 {importResult.updated} 条记录
                    </div>
                  )}
                  {importResult.failed > 0 && (
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: 4 }}>
                      ✗ 失败 {importResult.failed} 条记录
                    </div>
                  )}
                </div>
              }
              type={importResult.failed > 0 ? 'warning' : 'success'}
              showIcon
            />
            {importResult.errors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>错误详情：</Text>
                <ul>
                  {importResult.errors.map((error, index) => (
                    <li key={index} style={{ color: 'red', fontSize: '12px' }}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}

        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button 
              type="primary" 
              loading={isImporting}
              onClick={handleImport}
              disabled={validCount === 0}
            >
              导入 {validCount} 条有效记录
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default BatchImportModal;
