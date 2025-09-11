import React, { useState } from 'react';
import { Upload, Button, message, Alert, Progress } from 'antd';
import { FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { MemberStatus, MemberLevel } from '@/types';

const { Dragger } = Upload;

interface ExcelUploadProps {
  onDataParsed: (members: ParsedMember[]) => void;
  onTemplateDownload?: () => void;
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
  gender?: 'Male' | 'Female';
  race?: 'Chinese' | 'Malay' | 'Indian' | 'Other';
  birthDate?: string;
  address?: string;
  nricOrPassport?: string;
  whatsappGroup?: boolean;
  hobbies?: string[];
  profilePhotoUrl?: string;
  // 职业信息
  company?: string;
  departmentAndPosition?: string;
  industryDetail?: string;
  linkedin?: string;
  companyWebsite?: string;
  categories?: string[];
  ownIndustry?: string[];
  companyIntro?: string;
  acceptInternationalBusiness?: 'Yes' | 'No' | 'Willing to explore';
  interestedIndustries?: string[];
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
  // JCI职位相关
  jciPosition?: string;
  positionStartDate?: string;
  positionEndDate?: string;
  // 其他字段
  accountType?: string;
  joinedDate?: string;
  // 日期
  paymentDate?: string;
  endorsementDate?: string;
  paymentVerifiedDate?: string;
  // 其他字段
  paymentSlipUrl?: string;
  termStartDate?: string;
  termEndDate?: string;
  rowIndex: number;
  isValid: boolean;
  errors: string[];
}

const ExcelUpload: React.FC<ExcelUploadProps> = ({ onDataParsed, onTemplateDownload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // Excel列映射配置
  const columnMapping = {
    '姓名': 'name',
    '邮箱': 'email',
    '手机号': 'phone',
    '会员编号': 'memberId',
    '状态': 'status',
    '等级': 'level',
    '参议员编号': 'senatorId',
    '完整姓名(NRIC)': 'fullNameNric',
    '性别': 'gender',
    '种族': 'race',
    '出生日期': 'birthDate',
    '地址': 'address',
    'NRIC/护照号': 'nricOrPassport',
    'WhatsApp群组': 'whatsappGroup',
    '兴趣爱好': 'hobbies',
    '头像链接': 'profilePhotoUrl',
    '公司': 'company',
    '职位': 'departmentAndPosition',
    '行业详情': 'industryDetail',
    'LinkedIn': 'linkedin',
    '公司网站': 'companyWebsite',
    '类别': 'categories',
    '自身行业': 'ownIndustry',
    '公司简介': 'companyIntro',
    '接受国际商务': 'acceptInternationalBusiness',
    '关注行业': 'interestedIndustries',
    '介绍人': 'introducerName',
    '五年愿景': 'fiveYearsVision',
    '如何成为活跃会员': 'activeMemberHow',
    'JCI活动兴趣': 'jciEventInterests',
    'JCI期望收益': 'jciBenefitsExpectation',
    '刺绣姓名': 'nameToBeEmbroidered',
    'T恤尺码': 'shirtSize',
    '外套尺码': 'jacketSize',
    'T恤版型': 'cutting',
    'T恤领取状态': 'tshirtReceivingStatus',
    'JCI职位': 'jciPosition',
    '职位开始日期': 'positionStartDate',
    '职位结束日期': 'positionEndDate',
    '户口类别': 'accountType',
    '加入日期': 'joinedDate',
    '付款日期': 'paymentDate',
    '背书日期': 'endorsementDate',
    '核验日期': 'paymentVerifiedDate',
    '付款凭证链接': 'paymentSlipUrl',
    '任期开始日期': 'termStartDate',
    '任期结束日期': 'termEndDate',
  };

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

  // 解析Excel数据
  const parseExcelData = (data: any[][]): ParsedMember[] => {
    if (data.length < 2) {
      throw new Error('Excel文件至少需要包含标题行和一行数据');
    }

    const headers = data[0];
    const rows = data.slice(1);
    const members: ParsedMember[] = [];

    // 创建列索引映射
    const columnIndexMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      if (typeof header === 'string') {
        const mappedField = columnMapping[header as keyof typeof columnMapping];
        if (mappedField) {
          columnIndexMap[mappedField] = index;
        }
      }
    });

    rows.forEach((row, rowIndex) => {
      const memberData: any = {};

      // 根据列映射提取数据
      Object.entries(columnIndexMap).forEach(([field, columnIndex]) => {
        const value = row[columnIndex];
        if (value !== undefined && value !== null && value !== '') {
          memberData[field] = value;
        }
      });

      // 处理特殊字段
      if (memberData.hobbies && typeof memberData.hobbies === 'string') {
        memberData.hobbies = memberData.hobbies.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      }
      if (memberData.categories && typeof memberData.categories === 'string') {
        memberData.categories = memberData.categories.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      }
      if (memberData.ownIndustry && typeof memberData.ownIndustry === 'string') {
        memberData.ownIndustry = memberData.ownIndustry.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      }
      if (memberData.interestedIndustries && typeof memberData.interestedIndustries === 'string') {
        memberData.interestedIndustries = memberData.interestedIndustries.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      }

      // 处理布尔值
      if (memberData.whatsappGroup !== undefined) {
        memberData.whatsappGroup = memberData.whatsappGroup === 'true' || memberData.whatsappGroup === '是' || memberData.whatsappGroup === true;
      }

      const validation = validateMember(memberData);
      
      const member: ParsedMember = {
        ...memberData,
        rowIndex: rowIndex + 2, // Excel行号从2开始（标题行是1）
        isValid: validation.isValid,
        errors: validation.errors,
      };

      members.push(member);
    });

    return members;
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const data = await new Promise<any[][]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            resolve(jsonData as any[][]);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('文件读取失败'));
        reader.readAsBinaryString(file);
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      // 解析数据
      const members = parseExcelData(data);
      
      setTimeout(() => {
        onDataParsed(members);
        setIsUploading(false);
        setUploadProgress(0);
        message.success(`成功解析 ${members.length} 条记录`);
      }, 500);

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      message.error(`文件解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 下载Excel模板
  const handleDownloadTemplate = () => {
    const headers = Object.keys(columnMapping);
    const sampleData = [
      ['张三', 'zhangsan@example.com', '13800138001', 'M001', 'active', 'bronze', 'SN001', 'ZHANG SAN', 'Male', 'Chinese', '15-JAN-1990', '北京市朝阳区', '1234567890123456', 'true', '编程,阅读', 'https://example.com/avatar1.jpg', 'ABC公司', '软件工程师', 'IT', 'https://linkedin.com/in/zhangsan', 'https://abc.com', '技术,创新', '软件开发,人工智能', '专注于AI技术开发', 'Yes', '人工智能,区块链', '李四', '成为技术专家', '参与技术分享', '技术交流', '技术提升', '张三', 'M', 'L', 'Unisex', 'Delivered', '技术总监', '01-JAN-2024', '31-DEC-2024', '正式会员', '15-JAN-2024', '15-JAN-2024', '20-JAN-2024', '25-JAN-2024', 'https://example.com/payment.jpg', '01-JAN-2024', '31-DEC-2024']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '会员数据');

    XLSX.writeFile(workbook, '会员导入模板.xlsx');
    message.success('模板下载成功');
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: (file: File) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.type === 'application/vnd.ms-excel' ||
                     file.name.endsWith('.xlsx') ||
                     file.name.endsWith('.xls');
      
      if (!isExcel) {
        message.error('只能上传Excel文件(.xlsx, .xls)');
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过10MB');
        return false;
      }

      handleFileUpload(file);
      return false; // 阻止自动上传
    },
  };

  return (
    <div>
      <Alert
        message="Excel文件导入说明"
        description={
          <div>
            <p>1. 请使用提供的Excel模板格式</p>
            <p>2. 确保必填字段（姓名、邮箱、手机号、会员编号）不为空</p>
            <p>3. 支持的文件格式：.xlsx, .xls</p>
            <p>4. 文件大小限制：10MB</p>
            <p>5. 第一行必须是标题行，数据从第二行开始</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<DownloadOutlined />} 
          onClick={handleDownloadTemplate}
          style={{ marginRight: 8 }}
        >
          下载Excel模板
        </Button>
        {onTemplateDownload && (
          <Button onClick={onTemplateDownload}>
            查看字段说明
          </Button>
        )}
      </div>

      <Dragger {...uploadProps} disabled={isUploading}>
        <p className="ant-upload-drag-icon">
          <FileExcelOutlined style={{ fontSize: 48, color: '#1890ff' }} />
        </p>
        <p className="ant-upload-text">
          {isUploading ? '正在处理文件...' : '点击或拖拽Excel文件到此区域上传'}
        </p>
        <p className="ant-upload-hint">
          支持单个文件上传，仅支持 .xlsx 和 .xls 格式
        </p>
      </Dragger>

      {isUploading && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={uploadProgress} status="active" />
        </div>
      )}
    </div>
  );
};

export default ExcelUpload;
