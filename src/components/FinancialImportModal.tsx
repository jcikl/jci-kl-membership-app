import React, { useState, useEffect } from 'react';
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
  Progress,
  Spin,
} from 'antd';
import { 
  CopyOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  TableOutlined,
  DollarOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { FinancialImportData, BankAccount } from '@/types/finance';
import dayjs from 'dayjs';
import { parseDateToDDMMMYYYY } from '@/utils/dateParser';

const { Text } = Typography;
const { Option } = Select;

interface FinancialImportModalProps {
  visible: boolean;
  onCancel: () => void;
  onImport: (
    transactions: FinancialImportData[], 
    bankAccountId: string,
    progressCallback?: (progress: { completed: number; total: number; percentage: number }) => void
  ) => Promise<{ 
    success: number; 
    failed: number; 
    errors: string[] 
  }>;
  bankAccounts: BankAccount[];
}

interface ParsedTransaction {
  id: string;
  transactionDate: string;
  mainDescription: string;
  subDescription?: string;
  expense: number;
  income: number;
  payerPayee?: string;
  transactionPurpose?: string;
  projectAccount?: string;
  accountType?: string;
  inputBy?: string;
  paymentDescription?: string;
  rowIndex: number;
  isValid: boolean;
  errors: string[];
}

const FinancialImportModal: React.FC<FinancialImportModalProps> = ({
  visible,
  onCancel,
  onImport,
  bankAccounts,
}) => {
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ 
    success: number; 
    failed: number; 
    errors: string[] 
  } | null>(null);
  const [activeTab, setActiveTab] = useState('manual');
  const [developerMode, setDeveloperMode] = useState(false);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('');
  
  // 进度相关状态
  const [importProgress, setImportProgress] = useState<{
    completed: number;
    total: number;
    percentage: number;
    currentStep: string;
    estimatedTimeRemaining?: number;
  } | null>(null);

  // 创建空行数据
  const createEmptyTransaction = (): ParsedTransaction => ({
    id: `transaction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    transactionDate: dayjs().format('DD-MMM-YYYY'),
    mainDescription: '',
    subDescription: '',
    expense: 0,
    income: 0,
    payerPayee: '',
    transactionPurpose: '',
    projectAccount: '',
    accountType: '',
    inputBy: '',
    paymentDescription: '',
    rowIndex: 1,
    isValid: false,
    errors: ['请填写必填字段'],
  });

  // 当模态框打开时，自动添加一行空数据
  useEffect(() => {
    if (visible && transactions.length === 0) {
      setTransactions([createEmptyTransaction()]);
    }
  }, [visible]);

  // 当模态框关闭时，清理所有数据
  useEffect(() => {
    if (!visible) {
      setTransactions([]);
      setImportResult(null);
      setSelectedBankAccountId('');
      setActiveTab('manual');
      setDeveloperMode(false);
      setImportProgress(null);
    }
  }, [visible]);

  // 验证单个交易数据
  const validateTransaction = (transaction: Omit<ParsedTransaction, 'id' | 'rowIndex' | 'isValid' | 'errors'>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // 检查必填字段（开发者模式可以绕过）
    if (!developerMode) {
      if (!transaction.transactionDate || !String(transaction.transactionDate).trim()) {
        errors.push('交易日期不能为空');
      }
      if (!transaction.mainDescription || !String(transaction.mainDescription).trim()) {
        errors.push('主描述不能为空');
      }
    }
    
    // 验证支出和收入规则
    const expense = Number(transaction.expense) || 0;
    const income = Number(transaction.income) || 0;
    
    if (expense > 0 && income > 0) {
      errors.push('支出和收入不能同时大于0');
    } else if (expense === 0 && income === 0) {
      errors.push('支出或收入必须有一项大于0');
    }

    // 验证日期格式 - 使用智能日期解析器
    if (transaction.transactionDate && String(transaction.transactionDate).trim()) {
      const parsedDate = parseDateToDDMMMYYYY(transaction.transactionDate);
      if (!parsedDate) {
        errors.push('日期格式不正确，支持多种格式：YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, 中文日期等');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  // 重新验证所有交易（当开发者模式切换时）
  const revalidateAllTransactions = () => {
    const newTransactions = transactions.map(transaction => {
      const validation = validateTransaction(transaction);
      return {
        ...transaction,
        isValid: validation.isValid,
        errors: validation.errors,
      };
    });
    setTransactions(newTransactions);
  };

  // 监听开发者模式变化，重新验证所有交易
  useEffect(() => {
    if (transactions.length > 0) {
      revalidateAllTransactions();
    }
  }, [developerMode]);

  // 解析粘贴的数据
  const parsePastedData = (data: string): ParsedTransaction[] => {
    const lines = data.trim().split('\n');
    if (lines.length < 1) return [];

    const parsedTransactions: ParsedTransaction[] = [];

    for (let i = 0; i < lines.length; i++) {
      const values = lines[i].split('\t');
      const transactionData = {
        transactionDate: values[0] ? parseDateToDDMMMYYYY(String(values[0]).trim()) : '',
        mainDescription: values[1] ? String(values[1]).trim() : '',
        subDescription: values[2] ? String(values[2]).trim() : '',
        expense: values[3] ? Number(values[3]) || 0 : 0,
        income: values[4] ? Number(values[4]) || 0 : 0,
        payerPayee: values[5] ? String(values[5]).trim() : '',
        transactionPurpose: values[6] ? String(values[6]).trim() : '',
        projectAccount: values[7] ? String(values[7]).trim() : '',
        accountType: values[9] ? String(values[9]).trim() : '',
        inputBy: values[10] ? String(values[10]).trim() : '',
        paymentDescription: values[11] ? String(values[11]).trim() : '',
      };

      const validation = validateTransaction(transactionData);
      
      const transaction: ParsedTransaction = {
        ...transactionData,
        id: `transaction-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        rowIndex: i + 1,
        isValid: validation.isValid,
        errors: validation.errors,
      };

      parsedTransactions.push(transaction);
    }

    return parsedTransactions;
  };

  // 处理粘贴事件
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    // 检查数据格式
    const lines = pastedData.trim().split('\n');
    if (lines.length >= 1) {
      const firstLineFields = lines[0].split('\t');
      
      if (firstLineFields.length < 12) {
        message.warning(`检测到只有 ${firstLineFields.length} 个字段，预期 12 个字段。请确保使用制表符分隔数据。`);
      }
    }
    
    const parsedTransactions = parsePastedData(pastedData);
    setTransactions(prevTransactions => [...prevTransactions, ...parsedTransactions]);
    setImportResult(null);
  };

  // 添加新行
  const addNewRow = () => {
    const newTransaction = createEmptyTransaction();
    newTransaction.rowIndex = transactions.length + 1;
    setTransactions([...transactions, newTransaction]);
  };

  // 删除行
  const deleteRow = (index: number) => {
    const newTransactions = transactions.filter((_, i) => i !== index);
    if (newTransactions.length === 0) {
      const emptyTransaction = createEmptyTransaction();
      setTransactions([emptyTransaction]);
    } else {
      setTransactions(newTransactions);
    }
  };

  // 更新交易数据
  const updateTransaction = (index: number, field: keyof ParsedTransaction, value: any) => {
    const newTransactions = [...transactions];
    newTransactions[index] = { ...newTransactions[index], [field]: value };
    
    // 重新验证
    const validation = validateTransaction(newTransactions[index]);
    newTransactions[index].isValid = validation.isValid;
    newTransactions[index].errors = validation.errors;
    
    setTransactions(newTransactions);
  };

  const handleImport = async () => {
    if (transactions.length === 0) {
      message.warning('请先添加数据');
      return;
    }

    if (!selectedBankAccountId) {
      message.error('请选择银行户口');
      return;
    }

    const validTransactions = developerMode ? transactions : transactions.filter(t => t.isValid);
    if (validTransactions.length === 0) {
      message.error('没有有效的数据可以导入');
      return;
    }

    setIsImporting(true);
    setImportProgress({
      completed: 0,
      total: validTransactions.length,
      percentage: 0,
      currentStep: '准备导入数据...',
    });

    const startTime = Date.now();

    try {
      // 创建优化的进度回调函数
      const progressCallback = (progress: { completed: number; total: number; percentage: number }) => {
        const elapsed = Date.now() - startTime;
        
        // 更精确的时间估算算法
        let estimatedRemaining = 0;
        if (progress.completed > 0 && progress.completed < progress.total) {
          const avgTimePerRecord = elapsed / progress.completed;
          const remainingRecords = progress.total - progress.completed;
          estimatedRemaining = Math.max(0, avgTimePerRecord * remainingRecords);
        }

        // 计算处理速度
        const speed = progress.completed > 0 ? Math.round((progress.completed / elapsed) * 1000) : 0;

        setImportProgress({
          completed: progress.completed,
          total: progress.total,
          percentage: progress.percentage,
          currentStep: `正在导入交易记录... (${progress.completed}/${progress.total}) - ${speed}条/秒`,
          estimatedTimeRemaining: Math.round(estimatedRemaining / 1000), // 转换为秒
        });
      };

      const result = await onImport(validTransactions.map(t => ({
        transactionDate: t.transactionDate,
        mainDescription: t.mainDescription,
        subDescription: t.subDescription || '',
        expense: t.expense,
        income: t.income,
        payer: t.payerPayee || '', // 将 payerPayee 映射到 payer
        payee: '', // payee 字段留空
        transactionPurpose: t.transactionPurpose || '',
        projectAccount: t.projectAccount || '',
        accountType: t.accountType || '',
        inputBy: t.inputBy || '',
        paymentDescription: t.paymentDescription || '',
        bankAccountId: selectedBankAccountId,
      })), selectedBankAccountId, progressCallback);
      
      setImportResult(result);
      
      // 如果导入成功，清理已导入的记录
      if (result.success > 0) {
        const successIds = validTransactions.slice(0, result.success).map(t => t.id);
        setTransactions(prevTransactions => 
          prevTransactions.filter(t => !successIds.includes(t.id))
        );
      }
      
      let messageText = `导入完成！成功: ${result.success} 条`;
      if (result.failed > 0) {
        messageText += `，失败: ${result.failed} 条`;
      }
      
      message.success(messageText);
    } catch (error) {
      message.error('导入失败');
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const handleClear = () => {
    setTransactions([createEmptyTransaction()]);
    setImportResult(null);
    setImportProgress(null);
  };

  const handleLoadExample = () => {
    const exampleData = `15-JAN-2024\t会员费收入\t2024年会员费\t0\t500\t张三\tJCI KL\t会员费\t正式会员\t储蓄\t财务部\t会员费收入
20-JAN-2024\t活动报名费\t新年聚会报名\t0\t50\t李四\tJCI KL\t报名费\t活动户口\t储蓄\t活动部\t活动报名费
25-JAN-2024\t办公用品采购\t文具用品\t25\t0\tJCI KL\t文具店\t办公支出\t办公户口\t储蓄\t行政部\t办公用品采购
30-JAN-2024\t银行手续费\t转账手续费\t5\t0\tJCI KL\t银行\t银行费用\t储蓄户口\t储蓄\t财务部\t银行手续费`;
    
    const parsedTransactions = parsePastedData(exampleData);
    setTransactions(parsedTransactions);
  };

  const handleCopyTemplate = () => {
    const template = `交易日期\t主描述\t副描述\t支出\t收入\t付款人\t收款人\t交易用途\t项目户口\t户口类型\t输入人\t付款描述`;
    navigator.clipboard.writeText(template).then(() => {
      message.success('模板已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败');
    });
  };

  const columns = [
    {
      title: '状态',
      key: 'status',
      width: 60,
      fixed: 'left' as const,
      render: (_: any, record: ParsedTransaction) => (
        record.isValid ? 
          <Tag color="green" icon={<CheckCircleOutlined />}>有效</Tag> : 
          <Tag color="red" icon={<CloseCircleOutlined />}>无效</Tag>
      ),
    },
    {
      title: '交易日期',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 120,
      render: (text: string, _: ParsedTransaction, index: number) => (
        <Input
          value={text}
          onChange={(e) => {
            const inputValue = e.target.value;
            // 实时转换日期格式
            const parsedDate = parseDateToDDMMMYYYY(inputValue);
            updateTransaction(index, 'transactionDate', parsedDate || inputValue);
          }}
          placeholder="支持多种格式: 2024-01-15, 01/15/2024, 15/01/2024, 2024年1月15日"
          size="small"
        />
      ),
    },
    {
      title: '主描述',
      dataIndex: 'mainDescription',
      key: 'mainDescription',
      width: 150,
      render: (text: string, _: ParsedTransaction, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateTransaction(index, 'mainDescription', e.target.value)}
          placeholder="主描述"
          size="small"
        />
      ),
    },
    {
      title: '副描述',
      dataIndex: 'subDescription',
      key: 'subDescription',
      width: 120,
      render: (text: string, _: ParsedTransaction, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateTransaction(index, 'subDescription', e.target.value)}
          placeholder="副描述"
          size="small"
        />
      ),
    },
    {
      title: '支出',
      dataIndex: 'expense',
      key: 'expense',
      width: 100,
      render: (value: number, _: ParsedTransaction, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateTransaction(index, 'expense', val || 0)}
          placeholder="支出"
          size="small"
          style={{ width: '100%' }}
          min={0}
          precision={2}
        />
      ),
    },
    {
      title: '收入',
      dataIndex: 'income',
      key: 'income',
      width: 100,
      render: (value: number, _: ParsedTransaction, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateTransaction(index, 'income', val || 0)}
          placeholder="收入"
          size="small"
          style={{ width: '100%' }}
          min={0}
          precision={2}
        />
      ),
    },
    {
      title: '付款人/收款人',
      dataIndex: 'payerPayee',
      key: 'payerPayee',
      width: 150,
      render: (text: string, _: ParsedTransaction, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateTransaction(index, 'payerPayee', e.target.value)}
          placeholder="付款人/收款人"
          size="small"
        />
      ),
    },
    {
      title: '交易用途',
      dataIndex: 'transactionPurpose',
      key: 'transactionPurpose',
      width: 120,
      render: (text: string, _: ParsedTransaction, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateTransaction(index, 'transactionPurpose', e.target.value)}
          placeholder="交易用途"
          size="small"
        />
      ),
    },
    {
      title: '项目户口',
      dataIndex: 'projectAccount',
      key: 'projectAccount',
      width: 120,
      render: (text: string, _: ParsedTransaction, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateTransaction(index, 'projectAccount', e.target.value)}
          placeholder="项目户口"
          size="small"
        />
      ),
    },
    {
      title: '户口类型',
      dataIndex: 'accountType',
      key: 'accountType',
      width: 100,
      render: (text: string, _: ParsedTransaction, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateTransaction(index, 'accountType', e.target.value)}
          placeholder="户口类型"
          size="small"
        />
      ),
    },
    {
      title: '输入人',
      dataIndex: 'inputBy',
      key: 'inputBy',
      width: 100,
      render: (text: string, _: ParsedTransaction, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateTransaction(index, 'inputBy', e.target.value)}
          placeholder="输入人"
          size="small"
        />
      ),
    },
    {
      title: '付款描述',
      dataIndex: 'paymentDescription',
      key: 'paymentDescription',
      width: 120,
      render: (text: string, _: ParsedTransaction, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateTransaction(index, 'paymentDescription', e.target.value)}
          placeholder="付款描述"
          size="small"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, _record: ParsedTransaction, index: number) => (
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
      render: (_: any, record: ParsedTransaction) => (
        record.errors.length > 0 ? (
          <Tooltip title={record.errors.join(', ')}>
            <Tag color="red" style={{ fontSize: '10px' }}>{record.errors.length}</Tag>
          </Tooltip>
        ) : null
      ),
    },
  ];

  const validCount = transactions.filter(t => t.isValid).length;
  const invalidCount = transactions.filter(t => !t.isValid).length;

  const tabItems = [
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
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            
            {/* 取消和导入按钮 */}
            <Space>
              <Button onClick={onCancel}>取消</Button>
              <Button 
                type="primary" 
                loading={isImporting}
                onClick={handleImport}
                disabled={validCount === 0 || !selectedBankAccountId}
                icon={isImporting ? <LoadingOutlined /> : <DollarOutlined />}
              >
                {isImporting && importProgress ? (
                  `导入中... ${importProgress.completed}/${importProgress.total} (${importProgress.percentage}%)`
                ) : (
                  `导入 ${validCount} 条有效记录`
                )}
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
              dataSource={transactions}
              pagination={false}
              size="small"
              scroll={{ x: 1500, y: 400 }}
              rowKey={(record) => record.id}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="批量导入交易记录"
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
                <p style={{ textAlign: 'left', margin: '4px 0' }}><strong>交易记录导入功能：</strong></p>
                <ul style={{ textAlign: 'left', margin: '4px 0', paddingLeft: '20px' }}>
                  <li><strong>必填字段：</strong>交易日期、主描述</li>
                  <li><strong>金额规则：</strong>支出或收入必须有一项大于0，且不能同时大于0</li>
                  <li><strong>日期格式：</strong>支持多种格式，自动转换为 DD-MMM-YYYY（如：2024-01-15, 01/15/2024, 15/01/2024, 2024年1月15日）</li>
                </ul>
                <p style={{ textAlign: 'left', margin: '4px 0' }}><strong>操作步骤：</strong></p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>1. 选择银行户口</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>2. 您可以直接在表格中编辑数据</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>3. 也可以从Excel复制数据粘贴到此处</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>4. 点击"加载示例数据"查看数据格式示例</p>
                <p style={{ textAlign: 'left', margin: '4px 0' }}>5. 点击"复制模板"获取Excel模板</p>
                {developerMode && (
                  <p style={{ color: '#fa8c16', fontWeight: 'bold', textAlign: 'left', margin: '4px 0' }}>
                    ⚠️ 开发者模式已启用：必填字段验证已绕过，所有字段变为选填
                  </p>
                )}
                <details style={{ marginTop: 8, textAlign: 'left' }}>
                  <summary style={{ textAlign: 'left' }}><strong>字段列表：</strong></summary>
                  <div style={{ marginTop: 8, fontSize: '12px', lineHeight: '1.4', textAlign: 'left' }}>
                    1.交易日期 2.主描述 3.副描述 4.支出 5.收入 6.付款人 7.收款人 8.交易用途 9.项目户口 10.户口类型 11.输入人 12.付款描述
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
        {/* 银行户口选择 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space>
            <Text strong>选择银行户口：</Text>
            <Select
              value={selectedBankAccountId}
              onChange={setSelectedBankAccountId}
              placeholder="请选择银行户口"
              style={{ width: 300 }}
            >
              {bankAccounts.map(account => (
                <Option key={account.id} value={account.id}>
                  {account.accountName} ({account.accountType})
                </Option>
              ))}
            </Select>
          </Space>
        </Card>

        {/* 导入进度显示 */}
        {importProgress && (
          <Card style={{ marginBottom: 16, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                  <Text strong style={{ marginLeft: 8, fontSize: '16px' }}>
                    {importProgress.currentStep}
                  </Text>
                </div>
                
                <Progress
                  percent={importProgress.percentage}
                  status="active"
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                  style={{ margin: '8px 0' }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#666' }}>
                  <span>已完成: {importProgress.completed}/{importProgress.total}</span>
                  <span>进度: {importProgress.percentage}%</span>
                  {importProgress.estimatedTimeRemaining && (
                    <span>预计剩余: {importProgress.estimatedTimeRemaining}秒</span>
                  )}
                </div>
              </Space>
            </div>
          </Card>
        )}

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

      </div>
    </Modal>
  );
};

export default FinancialImportModal;
