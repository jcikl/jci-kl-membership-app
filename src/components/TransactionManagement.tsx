import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tooltip,
  Tabs,
  TreeSelect,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
  TagOutlined,
  UploadOutlined,
  BankOutlined,
  FilterOutlined,
  SearchOutlined,
  SplitCellsOutlined,
  TransactionOutlined,
} from '@ant-design/icons';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Transaction, BankAccount, TransactionPurpose, TransactionSplit } from '@/types/finance';
import { useAuthStore } from '@/store/authStore';
import { transactionSplitService } from '@/services/financeService';
import dayjs from 'dayjs';
import FinancialImportModal from './FinancialImportModal';
import TransactionBatchSettingsModal from './TransactionBatchSettingsModal';
import TransactionSplitModal from './TransactionSplitModal';

const { Title, Text } = Typography;
const { Option } = Select;

interface TransactionManagementProps {
  onCreateTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onImportTransactions: (transactions: any[], bankAccountId: string) => Promise<{ success: number; failed: number; errors: string[] }>;
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  purposes: TransactionPurpose[];
  loading?: boolean;
}

const TransactionManagement: React.FC<TransactionManagementProps> = ({
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onImportTransactions,
  transactions,
  bankAccounts,
  purposes,
  loading = false,
}) => {
  const { fiscalYear } = useFiscalYear();
  const { user } = useAuthStore();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isBatchSettingsVisible, setIsBatchSettingsVisible] = useState(false);
  
  // 拆分相关状态
  const [isSplitModalVisible, setIsSplitModalVisible] = useState(false);
  const [splittingTransaction, setSplittingTransaction] = useState<Transaction | null>(null);
  const [transactionSplits, setTransactionSplits] = useState<TransactionSplit[]>([]);

  // 3层级交易用途相关状态
  const [purposeFilter, setPurposeFilter] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  
  // 级联选择器状态
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState<string>('');

  // 设置默认标签页为第一个银行户口
  useEffect(() => {
    if (bankAccounts.length > 0 && !activeTab) {
      setActiveTab(bankAccounts[0].id);
    }
  }, [bankAccounts, activeTab]);

  // 加载拆分数据
  useEffect(() => {
    const loadSplits = async () => {
      try {
        const splits = await transactionSplitService.getAllSplits();
        setTransactionSplits(splits);
      } catch (error) {
        console.error('加载拆分数据失败:', error);
      }
    };
    
    loadSplits();
  }, []);

  // 构建3层级交易用途树形数据（用于筛选）
  const buildPurposeTreeData = () => {
    const treeData: any[] = [];
    
    // 获取各层级用途
    const mainCategories = purposes.filter(p => p.level === 0 && p.isActive);
    const businessCategories = purposes.filter(p => p.level === 1 && p.isActive);
    const specificPurposes = purposes.filter(p => p.level === 2 && p.isActive);
    
    mainCategories.forEach(main => {
      const businessChildren = businessCategories.filter(b => b.parentId === main.id);
      const businessChildrenWithSpecific = businessChildren.map(business => ({
        title: business.name,
        value: business.id,
        key: business.id,
        children: specificPurposes.filter(s => s.parentId === business.id).map(specific => ({
          title: specific.name,
          value: specific.id,
          key: specific.id,
        }))
      }));
      
      // 只添加有具体用途的主要分类
      if (businessChildrenWithSpecific.some(b => b.children.length > 0)) {
        treeData.push({
          title: main.name,
          value: main.id,
          key: main.id,
          children: businessChildrenWithSpecific
        });
      }
    });
    
    return treeData;
  };

  // 获取交易用途的完整路径
  const getPurposePath = (purposeId: string): string[] => {
    const purpose = purposes.find(p => p.id === purposeId);
    if (!purpose) return [];
    
    const path: string[] = [];
    let currentPurpose: TransactionPurpose | undefined = purpose;
    
    // 从当前用途向上查找路径
    while (currentPurpose) {
      path.unshift(currentPurpose.name);
      if (currentPurpose.parentId) {
        const parentPurpose = purposes.find(p => p.id === currentPurpose!.parentId);
        currentPurpose = parentPurpose;
      } else {
        currentPurpose = undefined;
      }
    }
    
    return path;
  };

  // 根据3层级筛选交易记录
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // 按银行户口筛选
    if (activeTab) {
      filtered = filtered.filter(t => t.bankAccountId === activeTab);
    }
    
    // 按交易用途筛选
    if (purposeFilter.length > 0) {
      filtered = filtered.filter(t => {
        if (!t.transactionPurpose) return false;
        return purposeFilter.includes(t.transactionPurpose);
      });
    }
    
    // 按文本搜索筛选
    if (searchText) {
      filtered = filtered.filter(t => 
        t.mainDescription.toLowerCase().includes(searchText.toLowerCase()) ||
        t.subDescription?.toLowerCase().includes(searchText.toLowerCase()) ||
        t.payerPayee?.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // 按日期范围筛选
    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(t => {
        const transactionDate = dayjs(t.transactionDate, 'DD-MMM-YYYY');
        return transactionDate.isAfter(dateRange[0]!.subtract(1, 'day')) && 
               transactionDate.isBefore(dateRange[1]!.add(1, 'day'));
      });
    }
    
    return filtered;
  }, [transactions, activeTab, purposeFilter, searchText, dateRange]);

  const handleCreateTransaction = () => {
    setEditingTransaction(null);
    setIsModalVisible(true);
    // 重置级联选择器状态
    setSelectedMainCategory('');
    setSelectedBusinessCategory('');
    // Reset fields after modal is shown to avoid useForm warning
    setTimeout(() => {
      form.resetFields();
    }, 0);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalVisible(true);
    
    // 根据交易用途找到对应的主要分类和业务分类
    const transactionPurpose = transaction.transactionPurpose || '';
    const purpose = purposes.find(p => p.id === transactionPurpose);
    
    let mainCategoryId = '';
    let businessCategoryId = '';
    
    if (purpose) {
      if (purpose.level === 2 && purpose.parentId) {
        // 具体用途，找到其父级（业务分类）
        const businessCategory = purposes.find(p => p.id === purpose.parentId);
        businessCategoryId = businessCategory?.id || '';
        
        if (businessCategory && businessCategory.parentId) {
          // 找到主要分类
          mainCategoryId = businessCategory.parentId;
        }
      } else if (purpose.level === 1 && purpose.parentId) {
        // 业务分类，找到其父级（主要分类）
        mainCategoryId = purpose.parentId;
        businessCategoryId = purpose.id;
      } else if (purpose.level === 0) {
        // 主要分类
        mainCategoryId = purpose.id;
      }
    }
    
    setSelectedMainCategory(mainCategoryId);
    setSelectedBusinessCategory(businessCategoryId);
    
    // Set form values after modal is shown to avoid useForm warning
    setTimeout(() => {
      form.setFieldsValue({
        ...transaction,
        transactionDate: dayjs(transaction.transactionDate, 'DD-MMM-YYYY'),
        payerPayee: transaction.payerPayee, // 使用合并字段
        transactionType: mainCategoryId,
        projectAccount: businessCategoryId,
        transactionPurpose: transactionPurpose,
      });
    }, 0);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await onDeleteTransaction(id);
      message.success('交易记录删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 拆分处理函数
  const handleSplitTransaction = (transaction: Transaction) => {
    setSplittingTransaction(transaction);
    setIsSplitModalVisible(true);
  };

  const handleSplitModalCancel = () => {
    setIsSplitModalVisible(false);
    setSplittingTransaction(null);
  };

  const handleSplitTransactionConfirm = async (transactionId: string, splits: Omit<TransactionSplit, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      // 先删除该交易的现有拆分记录
      await transactionSplitService.deleteSplitsByTransaction(transactionId);
      
      // 创建新的拆分记录
      await transactionSplitService.createSplits(splits);
      
      // 清空主交易记录的分类信息，因为分类信息已移动到拆分记录中
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        await onUpdateTransaction(transactionId, {
          payerPayee: '', // 清空付款人/收款人
          transactionType: '', // 清空主要分类
          projectAccount: '', // 清空业务分类
          transactionPurpose: '', // 清空交易用途
        });
      }
      
      // 更新本地拆分状态
      const newSplits = await transactionSplitService.getSplitsByTransaction(transactionId);
      setTransactionSplits(prev => [
        ...prev.filter(s => s.transactionId !== transactionId),
        ...newSplits
      ]);
      
      message.success('交易拆分成功');
      setIsSplitModalVisible(false);
      setSplittingTransaction(null);
    } catch (error) {
      console.error('拆分交易失败:', error);
      message.error('拆分失败');
    }
  };


  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      const transactionData = {
        bankAccountId: values.bankAccountId,
        transactionDate: dayjs(values.transactionDate).format('DD-MMM-YYYY'),
        mainDescription: values.mainDescription,
        subDescription: values.subDescription || '',
        expense: values.expense || 0,
        income: values.income || 0,
        payerPayee: values.payerPayee || '', // 付款人/收款人合并字段
        transactionType: values.transactionType || '', // 主要分类ID
        projectAccount: values.projectAccount || '', // 业务分类ID
        transactionPurpose: values.transactionPurpose || '', // 具体用途ID
        inputBy: user?.uid || 'unknown-user', // 设置为当前用户
        notes: values.notes || '',
        auditYear: fiscalYear,
      };

      if (editingTransaction) {
        await onUpdateTransaction(editingTransaction.id, transactionData);
        message.success('交易记录更新成功');
      } else {
        await onCreateTransaction(transactionData);
        message.success('交易记录创建成功');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('交易记录操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      message.error(`交易记录操作失败: ${errorMessage}`);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingTransaction(null);
    // 重置级联选择器状态
    setSelectedMainCategory('');
    setSelectedBusinessCategory('');
  };

  // 批量操作处理函数
  const handleBatchSettings = () => {
    if (selectedTransactions.length === 0) {
      message.warning('请先选择要批量设置的交易记录');
      return;
    }
    setIsBatchSettingsVisible(true);
  };

  const handleBatchSettingsConfirm = async (settings: { transactionPurpose?: string; projectAccount?: string }) => {
    try {
      const updateData: Partial<Transaction> = {};
      
      if (settings.transactionPurpose !== undefined) {
        updateData.transactionPurpose = settings.transactionPurpose;
      }
      if (settings.projectAccount !== undefined) {
        updateData.projectAccount = settings.projectAccount;
      }

      // 批量更新选中的交易记录
      const updatePromises = selectedTransactions.map(transactionId => 
        onUpdateTransaction(transactionId, updateData)
      );

      await Promise.all(updatePromises);
      
      message.success(`成功批量设置 ${selectedTransactions.length} 条交易记录`);
      setSelectedTransactions([]);
      setIsBatchSettingsVisible(false);
    } catch (error) {
      console.error('批量设置失败:', error);
      message.error('批量设置失败');
    }
  };

  const handleSelectChange = (selectedRowKeys: React.Key[]) => {
    setSelectedTransactions(selectedRowKeys as string[]);
  };

  const rowSelection = {
    selectedRowKeys: selectedTransactions,
    onChange: handleSelectChange,
    getCheckboxProps: (record: any) => ({
      name: record.id,
      disabled: record.isSplitRecord, // 禁用拆分记录的选择
    }),
  };



  // 计算余额的函数
  const calculateBalances = useMemo(() => {
    // 按银行户口分组交易
    const transactionsByAccount: { [accountId: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      if (!transactionsByAccount[transaction.bankAccountId]) {
        transactionsByAccount[transaction.bankAccountId] = [];
      }
      transactionsByAccount[transaction.bankAccountId].push(transaction);
    });

    // 为每个银行户口计算余额
    const balances: { [transactionId: string]: number } = {};
    
    Object.entries(transactionsByAccount).forEach(([accountId, accountTransactions]) => {
      // 按日期排序
      const sortedTransactions = [...accountTransactions].sort((a, b) => {
        const dateA = dayjs(a.transactionDate, 'DD-MMM-YYYY');
        const dateB = dayjs(b.transactionDate, 'DD-MMM-YYYY');
        return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
      });

      // 获取银行户口的初始余额
      const account = bankAccounts.find(acc => acc.id === accountId);
      let runningBalance = account?.initialAmount || 0;

      // 计算每笔交易后的余额
      sortedTransactions.forEach(transaction => {
        runningBalance += (transaction.income || 0) - (transaction.expense || 0);
        balances[transaction.id] = runningBalance;
      });
    });

    return balances;
  }, [transactions, bankAccounts]);


  const columns = [
    {
      title: '类型',
      dataIndex: 'isSplitRecord',
      key: 'isSplitRecord',
      width: 80,
      render: (isSplitRecord: boolean) => {
        if (isSplitRecord) {
          return (
            <Tag color="blue" icon={<SplitCellsOutlined />}>
              拆分
            </Tag>
          );
        }
        return (
          <Tag color="green" icon={<TransactionOutlined />}>
            主记录
          </Tag>
        );
      },
    },
    {
      title: '交易日期',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 120,
      render: (date: string, record: any) => {
        if (record.isSplitRecord) {
          return '-';
        }
        return (
          <Space>
            <CalendarOutlined />
            <Text>{date}</Text>
          </Space>
        );
      },
    },
    {
      title: '主描述',
      dataIndex: 'mainDescription',
      key: 'mainDescription',
      width: 200,
      render: (text: string, record: any) => {
        if (record.isSplitRecord) {
          return (
            <Text ellipsis={{ tooltip: record.description || '无描述' }} style={{ color: '#666' }}>
              {record.description || '无描述'}
            </Text>
          );
        }
        return (
          <Text ellipsis={{ tooltip: text }} strong>
            {text}
          </Text>
        );
      },
    },
    {
      title: '副描述',
      dataIndex: 'subDescription',
      key: 'subDescription',
      width: 150,
      render: (text: string, record: any) => {
        if (record.isSplitRecord) {
          return (
            <Text ellipsis={{ tooltip: record.notes || '无备注' }} type="secondary">
              {record.notes || '无备注'}
            </Text>
          );
        }
        return text ? (
          <Text ellipsis={{ tooltip: text }} type="secondary">
            {text}
          </Text>
        ) : '-';
      },
    },
    {
      title: '支出',
      dataIndex: 'expense',
      key: 'expense',
      width: 120,
      align: 'right' as const,
      render: (amount: number, record: any) => {
        if (record.isSplitRecord) {
          return (
            <Text style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
              RM {record.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </Text>
          );
        }
        return amount > 0 ? (
          <Text style={{ color: '#ff4d4f' }}>
            <DollarOutlined /> {amount.toLocaleString('en-MY', { 
              style: 'currency', 
              currency: 'MYR' 
            })}
          </Text>
        ) : '-';
      },
    },
    {
      title: '收入',
      dataIndex: 'income',
      key: 'income',
      width: 120,
      align: 'right' as const,
      render: (amount: number, record: any) => {
        if (record.isSplitRecord) {
          return '-';
        }
        return amount > 0 ? (
          <Text style={{ color: '#52c41a' }}>
            <DollarOutlined /> {amount.toLocaleString('en-MY', { 
              style: 'currency', 
              currency: 'MYR' 
            })}
          </Text>
        ) : '-';
      },
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 140,
      align: 'right' as const,
      render: (_: any, record: any) => {
        if (record.isSplitRecord) {
          return '-';
        }
        const balance = calculateBalances[record.id] || 0;
        const isPositive = balance >= 0;
        return (
          <Text style={{ 
            color: isPositive ? '#52c41a' : '#ff4d4f',
            fontWeight: 'bold'
          }}>
            <DollarOutlined /> {balance.toLocaleString('en-MY', { 
              style: 'currency', 
              currency: 'MYR' 
            })}
          </Text>
        );
      },
    },
    {
      title: '付款人/收款人',
      dataIndex: 'payerPayee',
      key: 'payerPayee',
      width: 150,
      render: (payerPayee: string, record: any) => {
        if (record.isSplitRecord) {
          return (
            <Text ellipsis={{ tooltip: record.payerPayee || '-' }}>
              {record.payerPayee || '-'}
            </Text>
          );
        }
        
        if (payerPayee) {
          return (
            <Text ellipsis={{ tooltip: payerPayee }}>
              {payerPayee}
            </Text>
          );
        }
        return '-';
      },
    },
    {
      title: '业务分类',
      dataIndex: 'projectAccount',
      key: 'projectAccount',
      width: 120,
      render: (businessCategoryId: string, record: any) => {
        if (record.isSplitRecord) {
          // 优先使用存储的业务分类
          if (businessCategoryId) {
            const purpose = purposes.find(p => p.id === businessCategoryId);
            return purpose ? (
              <Tag color="green">{purpose.name}</Tag>
            ) : '-';
          }
          
          // 如果没有存储的业务分类，根据交易用途推断
          if (record.transactionPurpose) {
            const purpose = purposes.find(p => p.id === record.transactionPurpose);
            if (purpose) {
              if (purpose.level === 2 && purpose.parentId) {
                // 具体用途，找到其父级（业务分类）
                const businessCategory = purposes.find(p => p.id === purpose.parentId);
                return businessCategory ? (
                  <Tag color="green">{businessCategory.name}</Tag>
                ) : '-';
              } else if (purpose.level === 1) {
                // 业务分类
                return (
                  <Tag color="green">{purpose.name}</Tag>
                );
              }
            }
          }
          
          return '-';
        }
        
        const purpose = purposes.find(p => p.id === businessCategoryId);
        return purpose ? (
          <Tag color="green">{purpose.name}</Tag>
        ) : '-';
      },
    },
    {
      title: '交易用途',
      dataIndex: 'transactionPurpose',
      key: 'transactionPurpose',
      width: 200,
      render: (purposeId: string, record: any) => {
        if (record.isSplitRecord) {
          if (!purposeId) return <Tag color="blue">未设置</Tag>;
          
          const purpose = purposes.find(p => p.id === purposeId);
          return purpose ? (
            <Tag color="blue">{purpose.name}</Tag>
          ) : (
            <Tag color="blue">未设置</Tag>
          );
        }
        
        if (!purposeId) return '-';
        
        const purposePath = getPurposePath(purposeId);
        const purpose = purposes.find(p => p.id === purposeId);
        
        return (
          <div>
            <Tag color="blue">
              <TagOutlined /> {purpose?.name || purposeId}
            </Tag>
            {purposePath.length > 1 && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                {purposePath.slice(0, -1).join(' > ')}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: '主要分类',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 120,
      render: (typeId: string, record: any) => {
        if (record.isSplitRecord) {
          // 优先使用存储的主要分类
          if (typeId) {
            const purpose = purposes.find(p => p.id === typeId);
            return purpose ? (
              <Tag color="purple">{purpose.name}</Tag>
            ) : '-';
          }
          
          // 如果没有存储的主要分类，根据交易用途推断
          if (record.transactionPurpose) {
            const purpose = purposes.find(p => p.id === record.transactionPurpose);
            if (purpose) {
              if (purpose.level === 2 && purpose.parentId) {
                // 具体用途，找到其父级（业务分类）的父级（主要分类）
                const businessCategory = purposes.find(p => p.id === purpose.parentId);
                if (businessCategory && businessCategory.parentId) {
                  const mainCategory = purposes.find(p => p.id === businessCategory.parentId);
                  return mainCategory ? (
                    <Tag color="purple">{mainCategory.name}</Tag>
                  ) : '-';
                }
              } else if (purpose.level === 1 && purpose.parentId) {
                // 业务分类，找到其父级（主要分类）
                const mainCategory = purposes.find(p => p.id === purpose.parentId);
                return mainCategory ? (
                  <Tag color="purple">{mainCategory.name}</Tag>
                ) : '-';
              } else if (purpose.level === 0) {
                // 主要分类
                return (
                  <Tag color="purple">{purpose.name}</Tag>
                );
              }
            }
          }
          
          return '-';
        }
        
        const purpose = purposes.find(p => p.id === typeId);
        return purpose ? (
          <Tag color="purple">{purpose.name}</Tag>
        ) : '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        if (record.isSplitRecord) {
          return '-';
        }
        
        return (
          <Space>
            <Tooltip title="编辑">
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEditTransaction(record)}
              />
            </Tooltip>
            <Tooltip title="拆分">
              <Button
                type="link"
                icon={<SplitCellsOutlined />}
                onClick={() => handleSplitTransaction(record)}
              />
            </Tooltip>
            <Popconfirm
              title="确定要删除这条交易记录吗？"
              description="删除后将无法恢复，请谨慎操作。"
              onConfirm={() => handleDeleteTransaction(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // 按银行户口分组交易记录（使用筛选后的数据）
  const transactionsByAccount = useMemo(() => {
    const grouped: { [accountId: string]: Transaction[] } = {};
    
    // 为每个银行户口创建分组
    bankAccounts.forEach(account => {
      grouped[account.id] = filteredTransactions.filter(t => t.bankAccountId === account.id);
    });
    
    return grouped;
  }, [filteredTransactions, bankAccounts]);

  // 计算每个银行户口的统计信息
  const getAccountStats = (accountId: string) => {
    const accountTransactions = transactionsByAccount[accountId] || [];
    const totalTransactions = accountTransactions.length;
    const totalIncome = accountTransactions.reduce((sum, t) => sum + t.income, 0);
    const totalExpense = accountTransactions.reduce((sum, t) => sum + t.expense, 0);
    const netIncome = totalIncome - totalExpense;
    
    // 拆分统计（暂时使用模拟数据，后续需要从服务获取）
    const splitTransactions = accountTransactions.filter(t => transactionSplits.some(s => s.transactionId === t.id));
    const splitCount = splitTransactions.length;
    const splitRate = totalTransactions > 0 ? (splitCount / totalTransactions * 100).toFixed(1) : '0.0';
    const averageSplitItems = splitCount > 0 ? (transactionSplits.length / splitCount).toFixed(1) : '0.0';
    
    return { 
      totalTransactions, 
      totalIncome, 
      totalExpense, 
      netIncome,
      splitCount,
      splitRate,
      averageSplitItems
    };
  };

  // 获取银行户口的表格数据
  const getAccountTableData = (accountId: string) => {
    // 筛选出当前银行户口的交易
    const accountTransactions = filteredTransactions.filter(t => t.bankAccountId === accountId);
    
    // 构建表格数据，包含拆分记录
    const tableData: any[] = [];
    
    accountTransactions.forEach(transaction => {
      // 添加主交易记录
      tableData.push({
        ...transaction,
        key: transaction.id,
        isMainRecord: true,
        isSplitRecord: false,
      });
      
      // 添加该交易的拆分记录
      const splits = transactionSplits.filter(split => split.transactionId === transaction.id);
      splits.forEach(split => {
        tableData.push({
          ...split,
          key: `split-${split.id}`,
          isMainRecord: false,
          isSplitRecord: true,
          parentTransactionId: transaction.id,
        });
      });
    });
    
    return tableData;
  };

  // 生成银行户口标签页

  // 生成银行户口标签页
  const tabItems = bankAccounts.map(account => {
    const stats = getAccountStats(account.id);
    
    return {
      key: account.id,
      label: (
        <span>
          <BankOutlined />
          {account.accountName}
          <span style={{ marginLeft: 8, fontSize: '12px', color: '#666' }}>
            ({stats.totalTransactions}笔)
          </span>
        </span>
      ),
      children: (
        <div>
          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="交易数"
                  value={stats.totalTransactions}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="总收入"
                  value={stats.totalIncome}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="总支出"
                  value={stats.totalExpense}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card size="small">
                <Statistic
                  title="净收入"
                  value={stats.netIncome}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: stats.netIncome >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>
          


           <Table
             columns={columns}
             dataSource={getAccountTableData(account.id)}
             loading={loading}
             rowKey="key"
             rowSelection={rowSelection}
             pagination={{
               pageSize: 20,
               showSizeChanger: true,
               showQuickJumper: true,
               showTotal: (total, range) => 
                 `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
             }}
             scroll={{ x: 1500 }}
           />
        </div>
      ),
    };
  });

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <DollarOutlined /> 交易记录管理
              </Title>
              <Text type="secondary">财政年度：{fiscalYear} | 3层级交易用途体系</Text>
            </Col>
             <Col>
               <Space>
                 <Button
                   icon={<UploadOutlined />}
                   onClick={() => setIsImportModalVisible(true)}
                 >
                   批量导入
                 </Button>
                 <Button
                   disabled={selectedTransactions.length === 0}
                   onClick={handleBatchSettings}
                 >
                   批量设置 ({selectedTransactions.length})
                 </Button>
                 <Button
                   type="primary"
                   icon={<PlusOutlined />}
                   onClick={handleCreateTransaction}
                 >
                   新增交易
                 </Button>
               </Space>
             </Col>
          </Row>
        </div>

        {/* 筛选和搜索 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Input
                placeholder="搜索交易描述、付款人/收款人等"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={6}>
              <TreeSelect
                placeholder="筛选交易用途"
                allowClear
                multiple
                treeData={buildPurposeTreeData()}
                value={purposeFilter}
                onChange={setPurposeFilter}
                style={{ width: '100%' }}
                styles={{ popup: { root: { maxHeight: 300, overflow: 'auto' } } }}
                treeCheckable
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
              />
            </Col>
            <Col span={6}>
              <DatePicker.RangePicker
                placeholder={['开始日期', '结束日期']}
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
                style={{ width: '100%' }}
                format="DD-MMM-YYYY"
              />
            </Col>
            <Col span={6}>
              <Space>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setPurposeFilter([]);
                    setDateRange([null, null]);
                  }}
                >
                  清除筛选
                </Button>
                <Text type="secondary">
                  显示 {filteredTransactions.length} / {transactions.length} 条记录
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingTransaction ? '编辑交易记录' : '新增交易记录'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            auditYear: fiscalYear,
            expense: 0,
            income: 0,
            inputBy: user?.uid || 'unknown-user',
          }}
        >
          {/* 第一个卡片：基本信息 */}
          <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="transactionDate"
                  label="交易日期"
                  rules={[{ required: true, message: '请选择交易日期' }]}
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="DD-MMM-YYYY"
                    placeholder="请选择交易日期"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="bankAccountId"
                  label="银行户口"
                  rules={[{ required: true, message: '请选择银行户口' }]}
                >
                  <Select placeholder="请选择银行户口">
                    {bankAccounts.map(account => (
                      <Option key={account.id} value={account.id}>
                        {account.accountName} ({account.accountType})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="mainDescription"
                  label="主描述"
                  rules={[{ required: true, message: '请输入主描述' }]}
                >
                  <Input placeholder="请输入主描述" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="subDescription"
                  label="副描述"
                >
                  <Input placeholder="请输入副描述" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="expense"
                  label="支出金额"
                >
                  <InputNumber
                    placeholder="请输入支出金额"
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => {
                      const num = parseFloat(value!.replace(/RM\s?|(,*)/g, ''));
                      return (isNaN(num) ? 0 : num) as any;
                    }}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="income"
                  label="收入金额"
                >
                  <InputNumber
                    placeholder="请输入收入金额"
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => {
                      const num = parseFloat(value!.replace(/RM\s?|(,*)/g, ''));
                      return (isNaN(num) ? 0 : num) as any;
                    }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 第二个卡片：分类和人员信息 */}
          <Card title="分类和人员信息" size="small">
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="transactionType"
                  label="主要分类"
                  rules={[{ required: true, message: '请选择主要分类' }]}
                >
                  <Select 
                    placeholder="请选择主要分类"
                    onChange={(value) => {
                      setSelectedMainCategory(value);
                      setSelectedBusinessCategory('');
                      form.setFieldsValue({ projectAccount: undefined, transactionPurpose: undefined });
                    }}
                  >
                    {purposes.filter(p => p.level === 0 && p.isActive).map(category => (
                      <Option key={category.id} value={category.id}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="projectAccount"
                  label="业务分类"
                >
                  <Select 
                    placeholder="请选择业务分类" 
                    allowClear
                    onChange={(value) => {
                      setSelectedBusinessCategory(value);
                      form.setFieldsValue({ transactionPurpose: undefined });
                    }}
                    disabled={!selectedMainCategory}
                  >
                    {selectedMainCategory && purposes.filter(p => p.level === 1 && p.parentId === selectedMainCategory && p.isActive).map(category => (
                      <Option key={category.id} value={category.id}>
                        {category.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="transactionPurpose"
                  label="具体用途"
                >
                  <Select
                    placeholder="请选择具体用途"
                    allowClear
                    disabled={!selectedBusinessCategory}
                    showSearch
                    optionFilterProp="children"
                    style={{ width: '100%' }}
                  >
                    {selectedBusinessCategory && purposes.filter(p => p.level === 2 && p.parentId === selectedBusinessCategory && p.isActive).map(purpose => (
                      <Option key={purpose.id} value={purpose.id}>
                        {purpose.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="payerPayee"
                  label="付款人/收款人"
                  tooltip="用于识别收支款项的来源或去向"
                >
                  <Input placeholder="请输入付款人或收款人" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="inputBy"
                  label="输入人"
                >
                  <Input 
                    value={user?.displayName || user?.email || '当前用户'} 
                    disabled 
                    placeholder="当前用户"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="notes"
              label="备注"
            >
              <Input.TextArea
                placeholder="请输入备注"
                rows={2}
              />
            </Form.Item>
          </Card>
        </Form>
      </Modal>

       {/* 批量导入模态框 */}
         <FinancialImportModal
           visible={isImportModalVisible}
           onCancel={() => setIsImportModalVisible(false)}
           onImport={onImportTransactions}
           bankAccounts={bankAccounts}
         />

       {/* 批量设置模态框 */}
       <TransactionBatchSettingsModal
         visible={isBatchSettingsVisible}
         onCancel={() => setIsBatchSettingsVisible(false)}
         onConfirm={handleBatchSettingsConfirm}
         purposes={purposes}
         selectedCount={selectedTransactions.length}
         loading={loading}
       />

      {/* 拆分交易模态框 */}
      <TransactionSplitModal
        visible={isSplitModalVisible}
        transaction={splittingTransaction}
        purposes={purposes}
        onCancel={handleSplitModalCancel}
        onSplit={handleSplitTransactionConfirm}
      />

     </div>
   );
 };
 
 export default TransactionManagement;
