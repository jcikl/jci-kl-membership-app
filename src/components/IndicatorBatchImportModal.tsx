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
  Select,
  InputNumber,
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
import { Indicator, AwardLevel, AwardCategoryType } from '@/types/awardIndicators';
import IndicatorExcelUpload from './IndicatorExcelUpload';
import { parseDateToDDMMMYYYY } from '@/utils/dateParser';

const { Text } = Typography;
const { Option } = Select;

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

interface IndicatorBatchImportModalProps {
  visible: boolean;
  onCancel: () => void;
  onImport: (indicators: Omit<Indicator, 'id' | 'createdAt' | 'updatedAt'>[], developerMode: boolean) => Promise<{ 
    success: number; 
    failed: number; 
    created: number; 
    updated: number; 
    errors: string[] 
  }>;
  awardLevel: AwardLevel;
  availableCategories: AwardCategoryType[];
}

interface ParsedIndicator {
  // 唯一标识符
  id: string;
  
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
  
  // 系统字段
  rowIndex: number;
  isValid: boolean;
  errors: string[];
}

const IndicatorBatchImportModal: React.FC<IndicatorBatchImportModalProps> = ({
  visible,
  onCancel,
  onImport,
  awardLevel,
  availableCategories,
}) => {
  const [indicators, setIndicators] = useState<ParsedIndicator[]>([]);
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
  const createEmptyIndicator = (): ParsedIndicator => ({
    // 唯一标识符
    id: `indicator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    
    // 基本信息
    no: 1,
    title: '',
    description: '',
    deadline: '',
    externalLink: '',
    score: 0,
    myScore: 0,
    status: 'pending',
    guidelines: '',
    responsiblePerson: '',
    team: [],
    
    // Star Point 特有字段
    objective: '',
    note: '',
    points: 0,
    
    // National & Area Incentive 特有字段
    nationalAllocation: '',
    areaAllocation: '',
    
    // E-Awards 特有字段
    submissionPeriodStart: '',
    submissionPeriodEnd: '',
    requirements: '',
    
    // 类别信息
    category: availableCategories[0] || 'efficient_star',
    
    // 系统字段
    rowIndex: 1,
    isValid: false,
    errors: ['请填写必填字段'],
  });

  // 当模态框打开时，自动添加一行空数据
  React.useEffect(() => {
    if (visible && indicators.length === 0) {
      setIndicators([createEmptyIndicator()]);
    }
  }, [visible]);

  // 验证单个指标数据
  const validateIndicator = (indicator: Omit<ParsedIndicator, 'id' | 'rowIndex' | 'isValid' | 'errors'>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // 检查必填字段（开发者模式可以绕过）
    if (!developerMode) {
      if (!indicator.title || !String(indicator.title).trim()) errors.push('标题不能为空');
      if (!indicator.description || !String(indicator.description).trim()) errors.push('描述不能为空');
      if (!indicator.deadline || !String(indicator.deadline).trim()) errors.push('截止日期不能为空');
      if (!indicator.score || indicator.score <= 0) errors.push('分数必须大于0');
      if (!indicator.category || !String(indicator.category).trim()) errors.push('类别不能为空');
    }
    
    // 验证类别
    if (indicator.category && !availableCategories.includes(indicator.category)) {
      errors.push(`类别必须是: ${availableCategories.join(', ')}`);
    }

    // 验证状态
    const validStatuses: ('pending' | 'completed' | 'overdue')[] = ['pending', 'completed', 'overdue'];
    if (indicator.status && !validStatuses.includes(indicator.status)) {
      errors.push('状态必须是: pending(待完成), completed(已完成), overdue(已逾期)');
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

  // 重新验证所有指标（当开发者模式切换时）
  const revalidateAllIndicators = () => {
    const newIndicators = indicators.map(indicator => {
      const validation = validateIndicator(indicator);
      return {
        ...indicator,
        isValid: validation.isValid,
        errors: validation.errors,
      };
    });
    setIndicators(newIndicators);
  };

  // 监听开发者模式变化，重新验证所有指标
  React.useEffect(() => {
    if (indicators.length > 0) {
      revalidateAllIndicators();
    }
  }, [developerMode]);

  // 解析粘贴的数据
  const parsePastedData = (data: string): ParsedIndicator[] => {
    const lines = data.trim().split('\n');
    if (lines.length < 1) return [];

    const indicators: ParsedIndicator[] = [];

    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const indicatorData = {
        // 基本信息
        no: values[0] ? parseInt(String(values[0]).trim()) || 1 : 1,
        title: values[1] ? String(values[1]).trim() : '',
        description: values[2] ? String(values[2]).trim() : '',
        deadline: values[3] ? parseDateToDDMMMYYYY(String(values[3]).trim()) : '',
        externalLink: values[4] ? String(values[4]).trim() : '',
        score: values[5] ? parseFloat(String(values[5]).trim()) || 0 : 0,
        myScore: values[6] ? parseFloat(String(values[6]).trim()) || 0 : 0,
        status: values[7] ? (() => {
          const statusValue = String(values[7]).trim();
          const statusMapping: Record<string, 'pending' | 'completed' | 'overdue'> = {
            '待完成': 'pending',
            '已完成': 'completed',
            '已逾期': 'overdue',
            'pending': 'pending',
            'completed': 'completed',
            'overdue': 'overdue'
          };
          return statusMapping[statusValue] || 'pending';
        })() : 'pending',
        guidelines: values[8] ? String(values[8]).trim() : '',
        responsiblePerson: values[9] ? String(values[9]).trim() : '',
        team: values[10] ? (String(values[10]).trim() ? String(values[10]).split(',').map(s => s.trim()).filter(s => s) : []) : [],
        
        // Star Point 特有字段
        objective: values[11] ? String(values[11]).trim() : '',
        note: values[12] ? String(values[12]).trim() : '',
        points: values[13] ? parseFloat(String(values[13]).trim()) || 0 : 0,
        
        // National & Area Incentive 特有字段
        nationalAllocation: values[14] ? String(values[14]).trim() : '',
        areaAllocation: values[15] ? String(values[15]).trim() : '',
        
        // E-Awards 特有字段
        submissionPeriodStart: values[16] ? parseDateToDDMMMYYYY(String(values[16]).trim()) : '',
        submissionPeriodEnd: values[17] ? parseDateToDDMMMYYYY(String(values[17]).trim()) : '',
        requirements: values[18] ? String(values[18]).trim() : '',
        
        // 类别信息
        category: values[19] ? (String(values[19]).trim() as AwardCategoryType) : availableCategories[0] || 'efficient_star',
      };

      const validation = validateIndicator(indicatorData);
      
      const indicator: ParsedIndicator = {
        ...indicatorData,
        id: `indicator-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        rowIndex: i,
        isValid: validation.isValid,
        errors: validation.errors,
      };

      indicators.push(indicator);
    }

    return indicators;
  };

  // 处理粘贴事件
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // 检查数据格式
    const lines = pastedData.trim().split('\n');
    if (lines.length >= 1) {
      const firstLineFields = lines[0].split('\t');
      
      if (firstLineFields.length < 20) {
        message.warning(`检测到只有 ${firstLineFields.length} 个字段，预期 20 个字段。请确保使用制表符分隔数据，不是空格。`);
      }
    }
    
    const parsedIndicators = parsePastedData(pastedData);
    // 追加到现有数据，而不是替换
    setIndicators(prevIndicators => [...prevIndicators, ...parsedIndicators]);
    setImportResult(null);
  };

  // 添加新行
  const addNewRow = () => {
    const newIndicator = createEmptyIndicator();
    newIndicator.rowIndex = indicators.length + 1;
    setIndicators([...indicators, newIndicator]);
  };

  // 删除行
  const deleteRow = (index: number) => {
    const newIndicators = indicators.filter((_, i) => i !== index);
    // 如果删除后表格为空，自动添加一行
    if (newIndicators.length === 0) {
      const emptyIndicator = createEmptyIndicator();
      setIndicators([emptyIndicator]);
    } else {
      setIndicators(newIndicators);
    }
  };

  // 更新指标数据
  const updateIndicator = (index: number, field: keyof ParsedIndicator, value: any) => {
    const newIndicators = [...indicators];
    newIndicators[index] = { ...newIndicators[index], [field]: value };
    
    // 重新验证
    const validation = validateIndicator(newIndicators[index]);
    newIndicators[index].isValid = validation.isValid;
    newIndicators[index].errors = validation.errors;
    
    setIndicators(newIndicators);
  };

  const handleImport = async () => {
    if (indicators.length === 0) {
      message.warning('请先添加数据');
      return;
    }

    // 在开发者模式下，允许导入所有记录（忽略isValid检查）
    const validIndicators = developerMode ? indicators : indicators.filter(i => i.isValid);
    if (validIndicators.length === 0) {
      message.error('没有有效的数据可以导入');
      return;
    }

    setIsImporting(true);
    try {
      const result = await onImport(validIndicators.map(i => ({
        // 基本信息
        no: i.no,
        title: i.title,
        description: i.description,
        deadline: i.deadline,
        externalLink: i.externalLink,
        score: i.score,
        myScore: i.myScore,
        status: i.status,
        guidelines: i.guidelines,
        responsiblePerson: i.responsiblePerson,
        team: i.team,
        
        // Star Point 特有字段
        objective: i.objective,
        note: i.note,
        points: i.points,
        
        // National & Area Incentive 特有字段
        nationalAllocation: i.nationalAllocation,
        areaAllocation: i.areaAllocation,
        
        // E-Awards 特有字段
        submissionPeriod: i.submissionPeriodStart && i.submissionPeriodEnd ? {
          start: i.submissionPeriodStart,
          end: i.submissionPeriodEnd
        } : undefined,
        requirements: i.requirements ? [{
          id: `req-${Date.now()}`,
          title: '导入的要求',
          description: i.requirements,
          required: true,
          completed: false
        }] : undefined,
        
        // 系统字段
        createdBy: 'system', // TODO: 从用户上下文获取
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
    setIndicators([createEmptyIndicator()]);
    setImportResult(null);
  };

  const handleLoadExample = () => {
    const exampleData = `1\t示例指标标题\t这是一个示例指标的描述\t2024-12-31\thttps://example.com\t100\t0\tpending\t完成指南\t负责人\t团队成员1,团队成员2\t目标描述\t备注信息\t50\t国家分配\t地区分配\t2024-01-01\t2024-12-31\t要求描述\tefficient_star`;
    const parsedIndicators = parsePastedData(exampleData);
    setIndicators(parsedIndicators);
  };

  const handleCopyTemplate = () => {
    const template = `序号\t标题\t描述\t截止日期\t外部链接\t分数\t我的分数\t状态\t完成指南\t负责人\t团队成员\t目标描述\t备注信息\t积分\t国家分配\t地区分配\t提交期开始\t提交期结束\t要求描述\t类别`;
    navigator.clipboard.writeText(template).then(() => {
      message.success('模板已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  // 处理Excel数据导入
  const handleExcelDataParsed = (excelIndicators: any[]) => {
    // 为Excel数据添加唯一ID和rowIndex
    const indicatorsWithIds = excelIndicators.map((indicator, index) => ({
      ...indicator,
      id: `excel-indicator-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      rowIndex: index + 1,
      isValid: true, // Excel数据假设是有效的，后续会重新验证
      errors: [],
    }));
    
    setIndicators(indicatorsWithIds);
    setImportResult(null);
    setActiveTab('manual'); // 切换到手动编辑标签页
    message.success(`成功导入 ${excelIndicators.length} 条记录，请检查数据后点击导入`);
  };

  const columns = [
    {
      title: '状态',
      key: 'status',
      width: 60,
      fixed: 'left' as const,
      render: (_: any, record: ParsedIndicator) => (
        record.isValid ? 
          <Tag color="green" icon={<CheckCircleOutlined />}>有效</Tag> : 
          <Tag color="red" icon={<CloseCircleOutlined />}>无效</Tag>
      ),
    },
    {
      title: '序号',
      dataIndex: 'no',
      key: 'no',
      width: 60,
      fixed: 'left' as const,
      render: (value: number, _: ParsedIndicator, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateIndicator(index, 'no', val || 1)}
          placeholder="序号"
          size="small"
          min={1}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 150,
      fixed: 'left' as const,
      render: (text: string, _: ParsedIndicator, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateIndicator(index, 'title', e.target.value)}
          placeholder="标题"
          size="small"
        />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string, _: ParsedIndicator, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateIndicator(index, 'description', e.target.value)}
          placeholder="描述"
          size="small"
        />
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (text: string, _: ParsedIndicator, index: number) => (
        <DateInput
          value={text}
          onChange={(value) => updateIndicator(index, 'deadline', value)}
          placeholder="截止日期"
        />
      ),
    },
    {
      title: '外部链接',
      dataIndex: 'externalLink',
      key: 'externalLink',
      width: 150,
      render: (text: string, _: ParsedIndicator, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateIndicator(index, 'externalLink', e.target.value)}
          placeholder="外部链接"
          size="small"
        />
      ),
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (value: number, _: ParsedIndicator, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateIndicator(index, 'score', val || 0)}
          placeholder="分数"
          size="small"
          min={0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '我的分数',
      dataIndex: 'myScore',
      key: 'myScore',
      width: 80,
      render: (value: number, _: ParsedIndicator, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateIndicator(index, 'myScore', val || 0)}
          placeholder="我的分数"
          size="small"
          min={0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: 'pending' | 'completed' | 'overdue', _: ParsedIndicator, index: number) => (
        <Select
          value={status}
          onChange={(value) => updateIndicator(index, 'status', value)}
          size="small"
          style={{ width: '100%' }}
        >
          <Option value="pending">待完成</Option>
          <Option value="completed">已完成</Option>
          <Option value="overdue">已逾期</Option>
        </Select>
      ),
    },
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: AwardCategoryType, _: ParsedIndicator, index: number) => (
        <Select
          value={category}
          onChange={(value) => updateIndicator(index, 'category', value)}
          size="small"
          style={{ width: '100%' }}
        >
          {availableCategories.map(cat => (
            <Option key={cat} value={cat}>{cat}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: '负责人',
      dataIndex: 'responsiblePerson',
      key: 'responsiblePerson',
      width: 100,
      render: (text: string, _: ParsedIndicator, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateIndicator(index, 'responsiblePerson', e.target.value)}
          placeholder="负责人"
          size="small"
        />
      ),
    },
    {
      title: '目标描述',
      dataIndex: 'objective',
      key: 'objective',
      width: 120,
      render: (text: string, _: ParsedIndicator, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateIndicator(index, 'objective', e.target.value)}
          placeholder="目标描述"
          size="small"
        />
      ),
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 80,
      render: (value: number, _: ParsedIndicator, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateIndicator(index, 'points', val || 0)}
          placeholder="积分"
          size="small"
          min={0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, _record: ParsedIndicator, index: number) => (
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
      render: (_: any, record: ParsedIndicator) => (
        record.errors.length > 0 ? (
          <Tooltip title={record.errors.join(', ')}>
            <Tag color="red" style={{ fontSize: '10px' }}>{record.errors.length}</Tag>
          </Tooltip>
        ) : null
      ),
    },
  ];

  const validCount = indicators.filter(i => i.isValid).length;
  const invalidCount = indicators.filter(i => !i.isValid).length;

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
        <IndicatorExcelUpload 
          onDataParsed={handleExcelDataParsed}
          onTemplateDownload={handleCopyTemplate}
          awardLevel={awardLevel}
          availableCategories={availableCategories}
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
              dataSource={indicators}
              pagination={false}
              size="small"
              scroll={{ x: 1500, y: 400 }}
              rowKey="id"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={`批量导入${awardLevel === 'star_point' ? 'Star Point' : awardLevel === 'national_area_incentive' ? 'National & Area Incentive' : 'E-Awards'}指标`}
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
                <p style={{ textAlign: 'left', margin: '4px 0' }}><strong>智能导入功能：</strong>系统将根据指标标题自动判断操作类型</p>
                <ul style={{ textAlign: 'left', margin: '4px 0', paddingLeft: '20px' }}>
                  <li><strong>新建记录</strong>：如果指标标题不存在，将创建新的指标记录</li>
                  <li><strong>更新记录</strong>：如果指标标题已存在，将更新现有指标的信息</li>
                </ul>
                <p style={{ textAlign: 'left', margin: '4px 0' }}><strong>操作步骤：</strong></p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>1. 您可以直接在表格中编辑数据</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>2. 也可以从Excel复制数据粘贴到此处</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>3. 点击"加载示例数据"查看数据格式示例</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>4. 点击"复制模板"获取Excel模板</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>5. 支持添加新行和删除行操作，删除所有行后会自动添加一行空数据</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}><strong>注意事项：</strong></p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>• 粘贴数据时请确保使用制表符分隔，不是空格。如果只有10个字段，请检查数据格式。</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>• <strong>状态值：</strong>支持中文(待完成/已完成/已逾期)或英文(pending/completed/overdue)</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>• <strong>类别值：</strong>必须是: {availableCategories.join(', ')}</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>• <strong>日期格式：</strong>支持多种格式: 2024-01-15, 01/15/2024, 15/01/2024, 2024年1月15日</p>
                {developerMode && (
                  <p style={{ color: '#fa8c16', fontWeight: 'bold', textAlign: 'left', margin: '4px 0' }}>
                    ⚠️ 开发者模式已启用：必填字段验证已绕过，所有字段变为选填
                  </p>
                )}
                <details style={{ marginTop: 8, textAlign: 'left' }}>
                  <summary style={{ textAlign: 'left' }}><strong>字段列表：</strong></summary>
                  <div style={{ marginTop: 8, fontSize: '12px', lineHeight: '1.4', textAlign: 'left' }}>
                    <strong>基本信息：</strong><br/>
                    1.序号 2.标题 3.描述 4.截止日期 5.外部链接 6.分数 7.我的分数 8.状态 9.完成指南 10.负责人<br/>
                    <strong>Star Point 特有字段：</strong><br/>
                    11.目标描述 12.备注信息 13.积分<br/>
                    <strong>National & Area Incentive 特有字段：</strong><br/>
                    14.国家分配 15.地区分配<br/>
                    <strong>E-Awards 特有字段：</strong><br/>
                    16.提交期开始 17.提交期结束 18.要求描述<br/>
                    <strong>其他：</strong><br/>
                    19.团队成员 20.类别
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

export default IndicatorBatchImportModal;
