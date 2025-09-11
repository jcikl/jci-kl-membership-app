import React, { useState } from 'react';
import {
  Modal,
  Button,
  Table,
  Space,
  Typography,
  Alert,
  message,
  Divider,
  Card,
  Tag,
  Tooltip,
  Input,
} from 'antd';
import { 
  CopyOutlined, 
  DeleteOutlined, 
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { Member, MemberStatus, MemberLevel } from '@/types';

const { Text } = Typography;

interface BatchImportModalProps {
  visible: boolean;
  onCancel: () => void;
  onImport: (members: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<{ success: number; failed: number; errors: string[] }>;
}

interface ParsedMember {
  name: string;
  email: string;
  phone: string;
  memberId: string;
  status: MemberStatus;
  level: MemberLevel;
  senatorId?: string;
  // 个人基本信息
  fullNameNric?: string;
  nicknameWithSurname?: string;
  gender?: 'male' | 'female';
  race?: 'Chinese' | 'Malay' | 'Indian' | 'Other';
  birthDate?: string;
  address?: string;
  nricOrPassport?: string;
  // 职业信息
  company?: string;
  departmentAndPosition?: string;
  industryDetail?: string;
  linkedin?: string;
  companyWebsite?: string;
  // JCI相关
  introducerName?: string;
  fiveYearsVision?: string;
  activeMemberHow?: string;
  jciEventInterests?: string;
  jciBenefitsExpectation?: string;
  nameToBeEmbroidered?: string;
  shirtSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  jacketSize?: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';
  cutting?: 'Unisex' | 'Lady';
  tshirtReceivingStatus?: 'Pending' | 'Requested' | 'Processing' | 'Delivered';
  acceptInternationalBusiness?: 'Yes' | 'No' | 'Willing to explore';
  whatsappGroup?: boolean;
  // 日期
  paymentDate?: string;
  endorsementDate?: string;
  paymentVerifiedDate?: string;
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
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // 创建空行数据
  const createEmptyMember = (): ParsedMember => ({
    name: '',
    email: '',
    phone: '',
    memberId: '',
    status: 'pending',
    level: 'bronze',
    senatorId: '',
    // 个人基本信息
    fullNameNric: '',
    nicknameWithSurname: '',
    gender: undefined,
    race: undefined,
    birthDate: '',
    address: '',
    nricOrPassport: '',
    // 职业信息
    company: '',
    departmentAndPosition: '',
    industryDetail: '',
    linkedin: '',
    companyWebsite: '',
    // JCI相关
    introducerName: '',
    fiveYearsVision: '',
    activeMemberHow: '',
    jciEventInterests: '',
    jciBenefitsExpectation: '',
    nameToBeEmbroidered: '',
    shirtSize: undefined,
    jacketSize: undefined,
    cutting: undefined,
    tshirtReceivingStatus: undefined,
    acceptInternationalBusiness: undefined,
    whatsappGroup: false,
    // 日期
    paymentDate: '',
    endorsementDate: '',
    paymentVerifiedDate: '',
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
  const validateMember = (member: Omit<ParsedMember, 'rowIndex' | 'isValid' | 'errors'>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // 检查必填字段
    if (!member.name?.trim()) errors.push('姓名不能为空');
    if (!member.email?.trim()) errors.push('邮箱不能为空');
    if (!member.phone?.trim()) errors.push('手机号不能为空');
    if (!member.memberId?.trim()) errors.push('会员编号不能为空');
    
    // 验证邮箱格式
    if (member.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email.trim())) {
      errors.push('邮箱格式不正确');
    }

    // 验证状态
    const validStatuses: MemberStatus[] = ['active', 'inactive', 'pending', 'suspended'];
    if (member.status && !validStatuses.includes(member.status)) {
      errors.push('状态必须是: active, inactive, pending, suspended');
    }

    // 验证等级
    const validLevels: MemberLevel[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    if (member.level && !validLevels.includes(member.level)) {
      errors.push('等级必须是: bronze, silver, gold, platinum, diamond');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // 解析粘贴的数据
  const parsePastedData = (data: string): ParsedMember[] => {
    const lines = data.trim().split('\n');
    if (lines.length < 2) return [];

    const members: ParsedMember[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const memberData = {
        name: values[0]?.trim() || '',
        email: values[1]?.trim() || '',
        phone: values[2]?.trim() || '',
        memberId: values[3]?.trim() || '',
        status: (values[4]?.trim() as MemberStatus) || 'pending',
        level: (values[5]?.trim() as MemberLevel) || 'bronze',
        senatorId: values[6]?.trim() || '',
        // 个人基本信息
        fullNameNric: values[7]?.trim() || '',
        nicknameWithSurname: values[8]?.trim() || '',
        gender: values[9]?.trim() as 'male' | 'female' || undefined,
        race: values[10]?.trim() as 'Chinese' | 'Malay' | 'Indian' | 'Other' || undefined,
        birthDate: values[11]?.trim() || '',
        address: values[12]?.trim() || '',
        nricOrPassport: values[13]?.trim() || '',
        // 职业信息
        company: values[14]?.trim() || '',
        departmentAndPosition: values[15]?.trim() || '',
        industryDetail: values[16]?.trim() || '',
        linkedin: values[17]?.trim() || '',
        companyWebsite: values[18]?.trim() || '',
        // JCI相关
        introducerName: values[19]?.trim() || '',
        fiveYearsVision: values[20]?.trim() || '',
        activeMemberHow: values[21]?.trim() || '',
        jciEventInterests: values[22]?.trim() || '',
        jciBenefitsExpectation: values[23]?.trim() || '',
        nameToBeEmbroidered: values[24]?.trim() || '',
        shirtSize: values[25]?.trim() as 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' || undefined,
        jacketSize: values[26]?.trim() as 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' || undefined,
        cutting: values[27]?.trim() as 'Unisex' | 'Lady' || undefined,
        tshirtReceivingStatus: values[28]?.trim() as 'Pending' | 'Requested' | 'Processing' | 'Delivered' || undefined,
        acceptInternationalBusiness: values[29]?.trim() as 'Yes' | 'No' | 'Willing to explore' || undefined,
        whatsappGroup: values[30]?.trim() === 'true' || values[30]?.trim() === '是' || false,
        // 日期
        paymentDate: values[31]?.trim() || '',
        endorsementDate: values[32]?.trim() || '',
        paymentVerifiedDate: values[33]?.trim() || '',
      };

      const validation = validateMember(memberData);
      
      const member: ParsedMember = {
        ...memberData,
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
      console.log(`粘贴数据字段数量: ${firstLineFields.length}`);
      
      if (firstLineFields.length < 34) {
        message.warning(`检测到只有 ${firstLineFields.length} 个字段，预期 34 个字段。请确保使用制表符分隔数据，不是空格。`);
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

    const validMembers = members.filter(m => m.isValid);
    if (validMembers.length === 0) {
      message.error('没有有效的数据可以导入');
      return;
    }

    setIsImporting(true);
    try {
      const result = await onImport(validMembers.map(m => ({
        name: m.name,
        email: m.email,
        phone: m.phone,
        memberId: m.memberId,
        status: m.status,
        level: m.level,
        joinDate: new Date().toISOString(),
        profile: {
          senatorId: m.senatorId || undefined,
          // 个人基本信息
          fullNameNric: m.fullNameNric || undefined,
          nicknameWithSurname: m.nicknameWithSurname || undefined,
          gender: m.gender,
          race: m.race,
          birthDate: m.birthDate || undefined,
          address: m.address || undefined,
          nricOrPassport: m.nricOrPassport || undefined,
          // 职业信息
          company: m.company || undefined,
          departmentAndPosition: m.departmentAndPosition || undefined,
          industryDetail: m.industryDetail || undefined,
          linkedin: m.linkedin || undefined,
          companyWebsite: m.companyWebsite || undefined,
          // JCI相关
          introducerName: m.introducerName || undefined,
          fiveYearsVision: m.fiveYearsVision || undefined,
          activeMemberHow: m.activeMemberHow || undefined,
          jciEventInterests: m.jciEventInterests || undefined,
          jciBenefitsExpectation: m.jciBenefitsExpectation || undefined,
          nameToBeEmbroidered: m.nameToBeEmbroidered || undefined,
          shirtSize: m.shirtSize,
          jacketSize: m.jacketSize,
          cutting: m.cutting,
          tshirtReceivingStatus: m.tshirtReceivingStatus,
          acceptInternationalBusiness: m.acceptInternationalBusiness,
          whatsappGroup: m.whatsappGroup,
          // 日期
          paymentDate: m.paymentDate || undefined,
          endorsementDate: m.endorsementDate || undefined,
          paymentVerifiedDate: m.paymentVerifiedDate || undefined,
        },
      })));
      
      setImportResult(result);
      message.success(`导入完成！成功: ${result.success} 条，失败: ${result.failed} 条`);
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
    const exampleData = `姓名\t邮箱\t手机号\t会员编号\t状态\t等级\t参议员编号\t全名\t昵称\t性别\t种族\t出生日期\t地址\t身份证\t公司\t职位\t行业\tLinkedIn\t网站\t介绍人\t五年愿景\t活跃方式\t活动兴趣\t期望收益\t刺绣名\tT恤尺码\t外套尺码\t版型\tT恤状态\t国际商务\tWhatsApp\t付款日期\t背书日期\t核验日期
张三\tzhangsan@example.com\t13800138001\tM001\tactive\tbronze\tSN001\tZHANG SAN\t小张\tmale\tChinese\t15-JAN-1990\t北京市朝阳区\t1234567890123456\tABC公司\t软件工程师\tIT\thttps://linkedin.com/in/zhangsan\thttps://abc.com\t李四\t成为技术专家\t参与技术分享\t技术交流\t技术提升\t张三\tM\tL\tUnisex\tDelivered\tYes\ttrue\t15-JAN-2024\t20-JAN-2024\t25-JAN-2024
李四\tlisi@example.com\t13800138002\tM002\tactive\tsilver\tSN002\tLI SI\t小李\tfemale\tChinese\t20-MAR-1988\t上海市浦东区\t1234567890123457\tXYZ公司\t产品经理\t互联网\thttps://linkedin.com/in/lisi\thttps://xyz.com\t王五\t成为产品总监\t参与产品设计\t产品创新\t产品管理\t李四\tL\tXL\tLady\tProcessing\tWilling to explore\tfalse\t20-MAR-2024\t25-MAR-2024\t30-MAR-2024
王五\twangwu@example.com\t13800138003\tpending\tgold\tSN003\tWANG WU\t小王\tmale\tMalay\t10-DEC-1992\t广州市天河区\t1234567890123458\tDEF公司\t销售经理\t金融\thttps://linkedin.com/in/wangwu\thttps://def.com\t赵六\t成为销售总监\t参与销售培训\t销售技巧\t销售业绩\t王五\tXL\t2XL\tUnisex\tRequested\tNo\ttrue\t10-DEC-2024\t15-DEC-2024\t20-DEC-2024`;
    const parsedMembers = parsePastedData(exampleData);
    setMembers(parsedMembers);
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
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
      render: (gender: 'male' | 'female' | undefined, _: ParsedMember, index: number) => (
        <select
          value={gender || ''}
          onChange={(e) => updateMember(index, 'gender', e.target.value as 'male' | 'female' | undefined)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="">请选择</option>
          <option value="male">男</option>
          <option value="female">女</option>
        </select>
      ),
    },
    {
      title: '种族',
      dataIndex: 'race',
      key: 'race',
      width: 80,
      render: (race: 'Chinese' | 'Malay' | 'Indian' | 'Other' | undefined, _: ParsedMember, index: number) => (
        <select
          value={race || ''}
          onChange={(e) => updateMember(index, 'race', e.target.value as 'Chinese' | 'Malay' | 'Indian' | 'Other' | undefined)}
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
      title: 'T恤尺码',
      dataIndex: 'shirtSize',
      key: 'shirtSize',
      width: 80,
      render: (size: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | undefined, _: ParsedMember, index: number) => (
        <select
          value={size || ''}
          onChange={(e) => updateMember(index, 'shirtSize', e.target.value as 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | undefined)}
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
      title: '全名',
      dataIndex: 'fullNameNric',
      key: 'fullNameNric',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'fullNameNric', e.target.value)}
          placeholder="全名"
          size="small"
        />
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nicknameWithSurname',
      key: 'nicknameWithSurname',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'nicknameWithSurname', e.target.value)}
          placeholder="昵称"
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
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'birthDate', e.target.value)}
          placeholder="出生日期"
          size="small"
        />
      ),
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      width: 150,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'address', e.target.value)}
          placeholder="地址"
          size="small"
        />
      ),
    },
    {
      title: '身份证',
      dataIndex: 'nricOrPassport',
      key: 'nricOrPassport',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'nricOrPassport', e.target.value)}
          placeholder="身份证"
          size="small"
        />
      ),
    },
    {
      title: '行业',
      dataIndex: 'industryDetail',
      key: 'industryDetail',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'industryDetail', e.target.value)}
          placeholder="行业"
          size="small"
        />
      ),
    },
    {
      title: 'LinkedIn',
      dataIndex: 'linkedin',
      key: 'linkedin',
      width: 150,
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
      title: '网站',
      dataIndex: 'companyWebsite',
      key: 'companyWebsite',
      width: 150,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'companyWebsite', e.target.value)}
          placeholder="网站"
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
    {
      title: '活跃方式',
      dataIndex: 'activeMemberHow',
      key: 'activeMemberHow',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'activeMemberHow', e.target.value)}
          placeholder="活跃方式"
          size="small"
        />
      ),
    },
    {
      title: '活动兴趣',
      dataIndex: 'jciEventInterests',
      key: 'jciEventInterests',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'jciEventInterests', e.target.value)}
          placeholder="活动兴趣"
          size="small"
        />
      ),
    },
    {
      title: '期望收益',
      dataIndex: 'jciBenefitsExpectation',
      key: 'jciBenefitsExpectation',
      width: 120,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'jciBenefitsExpectation', e.target.value)}
          placeholder="期望收益"
          size="small"
        />
      ),
    },
    {
      title: '刺绣名',
      dataIndex: 'nameToBeEmbroidered',
      key: 'nameToBeEmbroidered',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'nameToBeEmbroidered', e.target.value)}
          placeholder="刺绣名"
          size="small"
        />
      ),
    },
    {
      title: '外套尺码',
      dataIndex: 'jacketSize',
      key: 'jacketSize',
      width: 80,
      render: (jacketSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | undefined, _: ParsedMember, index: number) => (
        <select
          value={jacketSize || ''}
          onChange={(e) => updateMember(index, 'jacketSize', e.target.value as 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | undefined)}
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
      title: '版型',
      dataIndex: 'cutting',
      key: 'cutting',
      width: 80,
      render: (cutting: 'Unisex' | 'Lady' | undefined, _: ParsedMember, index: number) => (
        <select
          value={cutting || ''}
          onChange={(e) => updateMember(index, 'cutting', e.target.value as 'Unisex' | 'Lady' | undefined)}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="">请选择</option>
          <option value="Unisex">Unisex</option>
          <option value="Lady">Lady</option>
        </select>
      ),
    },
    {
      title: 'T恤状态',
      dataIndex: 'tshirtReceivingStatus',
      key: 'tshirtReceivingStatus',
      width: 80,
      render: (status: 'Pending' | 'Requested' | 'Processing' | 'Delivered' | undefined, _: ParsedMember, index: number) => (
        <select
          value={status || ''}
          onChange={(e) => updateMember(index, 'tshirtReceivingStatus', e.target.value as 'Pending' | 'Requested' | 'Processing' | 'Delivered' | undefined)}
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
    {
      title: '国际商务',
      dataIndex: 'acceptInternationalBusiness',
      key: 'acceptInternationalBusiness',
      width: 100,
      render: (accept: 'Yes' | 'No' | 'Willing to explore' | undefined, _: ParsedMember, index: number) => (
        <select
          value={accept || ''}
          onChange={(e) => updateMember(index, 'acceptInternationalBusiness', e.target.value as 'Yes' | 'No' | 'Willing to explore' | undefined)}
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
      title: 'WhatsApp',
      dataIndex: 'whatsappGroup',
      key: 'whatsappGroup',
      width: 80,
      render: (whatsapp: boolean, _: ParsedMember, index: number) => (
        <select
          value={whatsapp ? 'true' : 'false'}
          onChange={(e) => updateMember(index, 'whatsappGroup', e.target.value === 'true')}
          style={{ width: '100%', padding: '2px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
        >
          <option value="false">否</option>
          <option value="true">是</option>
        </select>
      ),
    },
    {
      title: '付款日期',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'paymentDate', e.target.value)}
          placeholder="付款日期"
          size="small"
        />
      ),
    },
    {
      title: '背书日期',
      dataIndex: 'endorsementDate',
      key: 'endorsementDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'endorsementDate', e.target.value)}
          placeholder="背书日期"
          size="small"
        />
      ),
    },
    {
      title: '核验日期',
      dataIndex: 'paymentVerifiedDate',
      key: 'paymentVerifiedDate',
      width: 100,
      render: (text: string, _: ParsedMember, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateMember(index, 'paymentVerifiedDate', e.target.value)}
          placeholder="核验日期"
          size="small"
        />
      ),
    },
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

  return (
    <Modal
      title="批量导入会员"
      open={visible}
      onCancel={onCancel}
      width={1600}
      style={{ top: 20 }}
      footer={null}
      destroyOnClose
    >
      <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Alert
          message="使用说明"
          description={
            <div>
              <p>1. 表格会自动添加一行空数据，可以直接开始输入</p>
              <p>2. 可以直接在表格中编辑数据，或从Excel/其他表格复制粘贴数据</p>
              <p>3. 必填字段：姓名、邮箱、手机号、会员编号</p>
              <p>4. 支持34个字段的完整会员信息导入，包括个人基本信息、职业信息、JCI相关等</p>
              <p>5. 粘贴数据会追加到现有数据，不会覆盖已输入的内容</p>
              <p>6. 支持添加新行和删除行操作，删除所有行后会自动添加一行空数据</p>
              <p><strong>注意：</strong>粘贴数据时请确保使用制表符分隔，不是空格。如果只有14个字段，请检查数据格式。</p>
              <details style={{ marginTop: 8 }}>
                <summary><strong>34个字段列表：</strong></summary>
                <div style={{ marginTop: 8, fontSize: '12px', lineHeight: '1.4' }}>
                  1.姓名 2.邮箱 3.手机号 4.会员编号 5.状态 6.等级 7.参议员编号 8.全名 9.昵称 10.性别 11.种族 12.出生日期 13.地址 14.身份证 15.公司 16.职位 17.行业 18.LinkedIn 19.网站 20.介绍人 21.五年愿景 22.活跃方式 23.活动兴趣 24.期望收益 25.刺绣名 26.T恤尺码 27.外套尺码 28.版型 29.T恤状态 30.国际商务 31.WhatsApp 32.付款日期 33.背书日期 34.核验日期
                </div>
              </details>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Card 
          title={
            <Space>
              <span>会员数据编辑</span>
              <Space>
                <Text>总计: {members.length} 条</Text>
                <Tag color="green">有效: {validCount}</Tag>
                <Tag color="red">无效: {invalidCount}</Tag>
              </Space>
            </Space>
          }
          extra={
            <Space>
              <Button 
                icon={<CopyOutlined />}
                onClick={handleLoadExample}
              >
                加载示例
              </Button>
              <Button 
                icon={<PlusOutlined />}
                onClick={addNewRow}
              >
                添加行
              </Button>
              <Button 
                icon={<DeleteOutlined />}
                onClick={handleClear}
              >
                清空
              </Button>
            </Space>
          }
        >
          <div 
            onPaste={handlePaste}
            style={{ 
              minHeight: 400,
              border: '2px dashed #d9d9d9',
              borderRadius: '6px',
              padding: '16px',
              backgroundColor: '#fafafa'
            }}
          >
            <div style={{ marginBottom: 16, textAlign: 'center', color: '#666' }}>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              可以直接在表格中编辑，或从Excel复制数据粘贴到此处
            </div>
            <Table
              columns={columns}
              dataSource={members}
              pagination={false}
              size="small"
              rowKey={(_, index) => `${index}`}
              scroll={{ x: 4000, y: 400 }}
              bordered
            />
          </div>
        </Card>

        {importResult && (
          <Card title="导入结果" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>成功导入: <Tag color="green">{importResult.success}</Tag> 条</Text>
                <Text style={{ marginLeft: 16 }}>导入失败: <Tag color="red">{importResult.failed}</Tag> 条</Text>
              </div>
              {importResult.errors.length > 0 && (
                <div>
                  <Text strong>错误详情:</Text>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {importResult.errors.map((error, index) => (
                      <li key={index} style={{ color: 'red' }}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Space>
          </Card>
        )}

        <Divider />

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button 
              type="primary" 
              onClick={handleImport}
              loading={isImporting}
              disabled={validCount === 0}
            >
              导入 {validCount} 条数据
            </Button>
          </Space>
        </div>
      </div>
    </Modal>
  );
};

export default BatchImportModal;
