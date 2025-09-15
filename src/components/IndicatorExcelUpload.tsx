import React, { useState } from 'react';
import { Upload, Button, message, Alert, Progress } from 'antd';
import { FileExcelOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { AwardCategoryType } from '@/types/awardIndicators';
import { parseDateToDDMMMYYYY } from '@/utils/dateParser';

const { Dragger } = Upload;

interface IndicatorExcelUploadProps {
  onDataParsed: (indicators: ParsedIndicator[]) => void;
  onTemplateDownload?: () => void;
  awardLevel: 'star_point' | 'national_area_incentive' | 'e_awards';
  availableCategories: AwardCategoryType[];
}

interface ParsedIndicator {
  // 基本信息
  no: number;
  title: string;
  description: string;
  deadline: string;
  externalLink?: string;
  score: number;
  myScore?: number;
  status: 'pending' | 'completed' | 'overdue';
  guidelines?: string;
  responsiblePerson?: string;
  team?: string[];
  
  // Star Point 特有字段
  objective?: string;
  note?: string;
  points?: number;
  
  // National & Area Incentive 特有字段
  nationalAllocation?: string;
  areaAllocation?: string;
  
  // E-Awards 特有字段
  submissionPeriodStart?: string;
  submissionPeriodEnd?: string;
  requirements?: string;
  
  // 类别信息
  category: AwardCategoryType;
  
  rowIndex: number;
  isValid: boolean;
  errors: string[];
}

const IndicatorExcelUpload: React.FC<IndicatorExcelUploadProps> = ({ 
  onDataParsed, 
  onTemplateDownload, 
  awardLevel,
  availableCategories 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Excel列映射配置
  const columnMapping = {
    '序号': 'no',
    '标题': 'title',
    '描述': 'description',
    '截止日期': 'deadline',
    '外部链接': 'externalLink',
    '分数': 'score',
    '我的分数': 'myScore',
    '状态': 'status',
    '完成指南': 'guidelines',
    '负责人': 'responsiblePerson',
    '团队成员': 'team',
    '目标描述': 'objective',
    '备注信息': 'note',
    '积分': 'points',
    '国家分配': 'nationalAllocation',
    '地区分配': 'areaAllocation',
    '提交期开始': 'submissionPeriodStart',
    '提交期结束': 'submissionPeriodEnd',
    '要求描述': 'requirements',
    '类别': 'category',
  };

  // 验证单个指标数据
  const validateIndicator = (indicator: Omit<ParsedIndicator, 'rowIndex' | 'isValid' | 'errors'>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // 检查必填字段
    if (!indicator.title?.trim()) errors.push('标题不能为空');
    if (!indicator.description?.trim()) errors.push('描述不能为空');
    if (!indicator.deadline?.trim()) errors.push('截止日期不能为空');
    if (!indicator.score || indicator.score <= 0) errors.push('分数必须大于0');
    if (!indicator.category?.trim()) errors.push('类别不能为空');
    
    // 验证类别
    if (indicator.category && !availableCategories.includes(indicator.category)) {
      errors.push(`类别必须是: ${availableCategories.join(', ')}`);
    }

    // 验证状态
    const validStatuses: ('pending' | 'completed' | 'overdue')[] = ['pending', 'completed', 'overdue'];
    if (indicator.status && !validStatuses.includes(indicator.status)) {
      errors.push('状态必须是: pending, completed, overdue');
    }

    // 验证外部链接格式
    if (indicator.externalLink && String(indicator.externalLink).trim()) {
      const url = String(indicator.externalLink).trim();
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('www.')) {
        // 允许没有协议前缀的URL
        if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(url)) {
          errors.push('外部链接格式不正确');
        }
      }
    }

    // 验证日期格式
    if (indicator.deadline && String(indicator.deadline).trim()) {
      const parsedDate = parseDateToDDMMMYYYY(String(indicator.deadline).trim());
      if (!parsedDate) {
        errors.push('截止日期格式不正确');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // 解析Excel数据
  const parseExcelData = (data: any[][]): ParsedIndicator[] => {
    if (data.length < 2) {
      throw new Error('Excel文件至少需要包含标题行和一行数据');
    }

    const headers = data[0];
    const rows = data.slice(1);
    const indicators: ParsedIndicator[] = [];

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
      const indicatorData: any = {};

      // 根据列映射提取数据
      Object.entries(columnIndexMap).forEach(([field, columnIndex]) => {
        const value = row[columnIndex];
        if (value !== undefined && value !== null && value !== '') {
          indicatorData[field] = value;
        }
      });

      // 处理特殊字段
      if (indicatorData.team && typeof indicatorData.team === 'string') {
        indicatorData.team = indicatorData.team.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      }

      // 处理数字字段
      if (indicatorData.no !== undefined) {
        indicatorData.no = parseInt(String(indicatorData.no)) || 1;
      }
      if (indicatorData.score !== undefined) {
        indicatorData.score = parseFloat(String(indicatorData.score)) || 0;
      }
      if (indicatorData.myScore !== undefined) {
        indicatorData.myScore = parseFloat(String(indicatorData.myScore)) || 0;
      }
      if (indicatorData.points !== undefined) {
        indicatorData.points = parseFloat(String(indicatorData.points)) || 0;
      }

      // 处理状态映射
      if (indicatorData.status) {
        const statusMapping: Record<string, 'pending' | 'completed' | 'overdue'> = {
          '待完成': 'pending',
          '已完成': 'completed',
          '已逾期': 'overdue',
          'pending': 'pending',
          'completed': 'completed',
          'overdue': 'overdue'
        };
        indicatorData.status = statusMapping[String(indicatorData.status)] || 'pending';
      }

      // 处理日期字段
      if (indicatorData.deadline) {
        indicatorData.deadline = parseDateToDDMMMYYYY(String(indicatorData.deadline));
      }
      if (indicatorData.submissionPeriodStart) {
        indicatorData.submissionPeriodStart = parseDateToDDMMMYYYY(String(indicatorData.submissionPeriodStart));
      }
      if (indicatorData.submissionPeriodEnd) {
        indicatorData.submissionPeriodEnd = parseDateToDDMMMYYYY(String(indicatorData.submissionPeriodEnd));
      }

      // 设置默认值
      if (!indicatorData.no) indicatorData.no = 1;
      if (!indicatorData.score) indicatorData.score = 0;
      if (!indicatorData.myScore) indicatorData.myScore = 0;
      if (!indicatorData.status) indicatorData.status = 'pending';
      if (!indicatorData.category) indicatorData.category = availableCategories[0] || 'efficient_star';

      const validation = validateIndicator(indicatorData);
      
      const indicator: ParsedIndicator = {
        ...indicatorData,
        rowIndex: rowIndex + 2, // Excel行号从2开始（标题行是1）
        isValid: validation.isValid,
        errors: validation.errors,
      };

      indicators.push(indicator);
    });

    return indicators;
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
      const indicators = parseExcelData(data);
      
      setTimeout(() => {
        onDataParsed(indicators);
        setIsUploading(false);
        setUploadProgress(0);
        message.success(`成功解析 ${indicators.length} 条记录`);
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
      [
        1, 
        '示例指标标题', 
        '这是一个示例指标的描述', 
        '2024-12-31', 
        'https://example.com', 
        100, 
        0, 
        'pending', 
        '完成指南', 
        '负责人', 
        '团队成员1,团队成员2', 
        '目标描述', 
        '备注信息', 
        50, 
        '国家分配', 
        '地区分配', 
        '2024-01-01', 
        '2024-12-31', 
        '要求描述', 
        availableCategories[0] || 'efficient_star'
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '指标数据');

    const fileName = `${awardLevel === 'star_point' ? 'StarPoint' : awardLevel === 'national_area_incentive' ? 'NationalArea' : 'EAwards'}指标导入模板.xlsx`;
    XLSX.writeFile(workbook, fileName);
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
            <p>2. 确保必填字段（标题、描述、截止日期、分数、类别）不为空</p>
            <p>3. 支持的文件格式：.xlsx, .xls</p>
            <p>4. 文件大小限制：10MB</p>
            <p>5. 第一行必须是标题行，数据从第二行开始</p>
            <p>6. 类别必须是: {availableCategories.join(', ')}</p>
            <p>7. 状态支持: pending(待完成), completed(已完成), overdue(已逾期)</p>
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

export default IndicatorExcelUpload;
