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
  UploadOutlined,
  DatabaseOutlined,
  BankOutlined,
  FilterOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  SearchOutlined,
  SplitCellsOutlined,
  TransactionOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Transaction, BankAccount, TransactionPurpose, TransactionSplit } from '@/types/finance';
import { ProjectAccount } from '@/types/event';
import { useAuthStore } from '@/store/authStore';
import { transactionSplitService, balanceCalculationService } from '@/modules/finance/services/financeService';
import dayjs from 'dayjs';
import GlobalYearFilterModal from './GlobalYearFilterModal';
import FinancialImportModal from './FinancialImportModal';
import TransactionBatchSettingsModal from './TransactionBatchSettingsModal';
import TransactionSplitModal from './TransactionSplitModal';
import AccountBalanceDisplay from './AccountBalanceDisplay';
import BalanceInconsistencyDebugger from './BalanceInconsistencyDebugger';
import BalanceSyncManager from './BalanceSyncManager';
import { BalanceCacheManager } from './BalanceCacheManager';
import { useFinanceYear } from '@/contexts/FinanceYearContext';

// Global Settings Integration
import { globalSystemService } from '@/config/globalSystemSettings';
import { globalComponentService } from '@/config/globalComponentSettings';
import { GLOBAL_VALIDATION_CONFIG, globalValidationService } from '@/config/globalValidationSettings';

const { Title, Text } = Typography;
const { Option } = Select;

interface TransactionManagementProps {
  onCreateTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onDeleteTransactions: (
    ids: string[], 
    options?: {
      onProgress?: (progress: { completed: number; total: number; percentage: number; currentStep: string }) => void;
    }
  ) => Promise<{ success: number; failed: number; errors: string[] }>;
  onImportTransactions: (
    transactions: any[], 
    bankAccountId: string,
    progressCallback?: (progress: { completed: number; total: number; percentage: number }) => void
  ) => Promise<{ success: number; failed: number; errors: string[] }>;
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  purposes: TransactionPurpose[];
  projectAccounts?: ProjectAccount[]; // 新增：项目户口列表
  loading?: boolean;
}

const TransactionManagement: React.FC<TransactionManagementProps> = ({
  onCreateTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onDeleteTransactions,
  onImportTransactions,
  transactions,
  bankAccounts,
  purposes,
  projectAccounts = [], // 新增：项目户口列表，默认为空数组
  loading = false,
}) => {
  const { user, member } = useAuthStore();
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isBatchSettingsVisible, setIsBatchSettingsVisible] = useState(false);
  
  // 批量删除进度状态
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{
    completed: number;
    total: number;
    percentage: number;
  } | null>(null);
  
  // 拆分相关状态
  const [isSplitModalVisible, setIsSplitModalVisible] = useState(false);
  const [splittingTransaction, setSplittingTransaction] = useState<Transaction | null>(null);
  const [transactionSplits, setTransactionSplits] = useState<TransactionSplit[]>([]);
  
  // 拆分记录缓存和加载状态
  const [splitsCache, setSplitsCache] = useState<Map<string, TransactionSplit[]>>(new Map());
  const [loadedTransactionIds, setLoadedTransactionIds] = useState<Set<string>>(new Set());
  const [isLoadingSplits, setIsLoadingSplits] = useState(false);

  // 3层级交易用途相关状态
  const [purposeFilter, setPurposeFilter] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  // 使用全局年份和月份状态
  const { selectedYear: yearFilter, setSelectedYear: setYearFilter, selectedMonth: monthFilter, setSelectedMonth: setMonthFilter, availableYears, refreshAvailableYears } = useFinanceYear();
  
  // 级联选择器状态
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('');
  const [selectedBusinessCategory, setSelectedBusinessCategory] = useState<string>('');
  
  // 分页状态
  const [pageSize, setPageSize] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // 设置默认标签页为第一个银行户口
  useEffect(() => {
    if (bankAccounts.length > 0 && !activeTab) {
      setActiveTab(bankAccounts[0].id);
    }
  }, [bankAccounts, activeTab]);

  // 更新全局可用年份 - 现在由 FinanceYearContext 统一管理
  useEffect(() => {
    if (transactions.length > 0) {
      // 触发年份范围刷新
      refreshAvailableYears();
    }
  }, [transactions, refreshAvailableYears]);

  // 切换银行户口时重置分页状态
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // 智能加载拆分数据 - 只在需要时加载
  const loadSplitsOnDemand = async (transactionIds: string[]) => {
    if (isLoadingSplits) return; // 防止重复加载
    
    setIsLoadingSplits(true);
    try {
      // 过滤出尚未加载的交易ID
      const unloadedIds = transactionIds.filter(id => !loadedTransactionIds.has(id));
      
      if (unloadedIds.length === 0) {
        console.log('📦 所有拆分记录已缓存，跳过加载');
        return;
      }
      
      // 智能预筛选：只加载可能有拆分记录的交易
      const likelyToHaveSplits = unloadedIds.filter(id => {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return false;
        
        // 检查是否有拆分记录的迹象
        return transaction.transactionType && 
               transaction.projectAccount && 
               transaction.transactionPurpose &&
               transaction.amount !== undefined && 
               transaction.amount > 0;
      });
      
      if (likelyToHaveSplits.length === 0) {
        // 如果没有可能包含拆分记录的交易，直接标记为已加载
        const newLoadedIds = new Set(loadedTransactionIds);
        unloadedIds.forEach(id => newLoadedIds.add(id));
        setLoadedTransactionIds(newLoadedIds);
        
        // 更新缓存（空数组表示已检查但无拆分记录）
        const newCache = new Map(splitsCache);
        unloadedIds.forEach(id => newCache.set(id, []));
        setSplitsCache(newCache);
        
        console.log(`📦 跳过 ${unloadedIds.length} 个无拆分记录的交易`);
        return;
      }
      
      console.log(`🔄 加载 ${likelyToHaveSplits.length} 个可能有拆分记录的交易...`);
      const splits = await transactionSplitService.getSplitsByTransactions(likelyToHaveSplits);
      
      // 更新缓存
      const newCache = new Map(splitsCache);
      const newLoadedIds = new Set(loadedTransactionIds);
      
      // 按交易ID分组拆分记录
      const splitsByTransaction = new Map<string, TransactionSplit[]>();
      splits.forEach(split => {
        const existing = splitsByTransaction.get(split.transactionId) || [];
        existing.push(split);
        splitsByTransaction.set(split.transactionId, existing);
      });
      
      // 更新缓存
      unloadedIds.forEach(id => {
        if (likelyToHaveSplits.includes(id)) {
          newCache.set(id, splitsByTransaction.get(id) || []);
        } else {
          newCache.set(id, []); // 标记为已检查但无拆分记录
        }
        newLoadedIds.add(id);
      });
      
      setSplitsCache(newCache);
      setLoadedTransactionIds(newLoadedIds);
      
      // 更新当前显示的拆分记录
      const allCurrentSplits = transactionIds.flatMap(id => newCache.get(id) || []);
      setTransactionSplits(allCurrentSplits);
      
      console.log(`✅ 已加载拆分记录: ${splits.length} 项 (缓存: ${newCache.size} 个交易)`);
    } catch (error) {
      console.error('❌ 加载拆分数据失败:', error);
    } finally {
      setIsLoadingSplits(false);
    }
  };

  // 检查是否需要加载拆分记录
  useEffect(() => {
    if (transactions.length > 0) {
      const transactionIds = transactions.map(t => t.id);
      const needsLoading = transactionIds.some(id => !loadedTransactionIds.has(id));
      
      if (needsLoading) {
        // 使用防抖机制，避免频繁调用
        const timeoutId = setTimeout(() => {
          loadSplitsOnDemand(transactionIds);
        }, 300);
        
        return () => clearTimeout(timeoutId);
      } else {
        // 如果所有记录都已缓存，直接更新显示
        const allCurrentSplits = transactionIds.flatMap(id => splitsCache.get(id) || []);
        setTransactionSplits(allCurrentSplits);
        console.log('📦 使用缓存的拆分记录:', allCurrentSplits.length, '项');
      }
    }
  }, [transactions]); // 依赖transactions变化

  // 清理拆分记录缓存
  const clearSplitsCache = (transactionIds?: string[]) => {
    if (transactionIds) {
      // 清理特定交易的缓存
      const newCache = new Map(splitsCache);
      const newLoadedIds = new Set(loadedTransactionIds);
      
      transactionIds.forEach(id => {
        newCache.delete(id);
        newLoadedIds.delete(id);
      });
      
      setSplitsCache(newCache);
      setLoadedTransactionIds(newLoadedIds);
      console.log(`🧹 清理了 ${transactionIds.length} 个交易的拆分缓存`);
    } else {
      // 清理所有缓存
      setSplitsCache(new Map());
      setLoadedTransactionIds(new Set());
      setTransactionSplits([]);
      console.log('🧹 清理了所有拆分记录缓存');
    }
  };

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
    
    
    // 按年份筛选
    if (yearFilter) {
      filtered = filtered.filter(t => {
        const transactionDate = dayjs(t.transactionDate, 'DD-MMM-YYYY');
        return transactionDate.year() === yearFilter;
      });
    }
    
    // 按月份筛选
    if (monthFilter) {
      filtered = filtered.filter(t => {
        const transactionDate = dayjs(t.transactionDate, 'DD-MMM-YYYY');
        return transactionDate.month() + 1 === monthFilter;
      });
    }
    
    return filtered;
  }, [transactions, activeTab, purposeFilter, searchText, yearFilter, monthFilter]);

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
        projectAccountId: transaction.projectAccountId || '', // 项目户口ID
        transactionPurpose: transactionPurpose,
      });
    }, 0);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await onDeleteTransaction(id);
      // 清理该交易的拆分记录缓存
      clearSplitsCache([id]);
      message.success('交易记录删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 批量删除处理函数
  const handleBatchDelete = async () => {
    if (selectedTransactions.length === 0) {
      message.warning('请先选择要删除的交易记录');
      return;
    }

    // 权限检查 - 只有管理员、财务长和开发员可以批量删除交易记录
    const allowedRoles = ['president', 'treasurer', 'secretary_general', 'developer'];
    const userRole = member?.accountType || '';
    
    // 调试信息
    console.log('🔍 权限检查:', {
      user: !!user,
      member: !!member,
      userRole,
      allowedRoles,
      hasPermission: allowedRoles.includes(userRole)
    });
    
    if (!user || !member || !allowedRoles.includes(userRole)) {
      message.error('您没有权限执行批量删除操作');
      return;
    }

    // 检查是否有拆分记录的交易
    const transactionsWithSplits = transactions.filter(t => 
      selectedTransactions.includes(t.id) && 
      transactionSplits.some(split => split.transactionId === t.id)
    );

    let confirmContent = `确定要删除选中的 ${selectedTransactions.length} 条交易记录吗？此操作不可撤销。`;
    
    if (transactionsWithSplits.length > 0) {
      confirmContent += `\n\n⚠️ 注意：其中 ${transactionsWithSplits.length} 条交易记录包含拆分记录，删除时将一并清理。`;
    }

    Modal.confirm({
      title: '确认批量删除',
      content: confirmContent,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      width: 500,
      onOk: () => {
        // 立即关闭模态框
        // 在后台执行删除操作
        executeBatchDelete();
        return Promise.resolve(); // 立即返回，关闭模态框
      }
    });
  };

  // 执行批量删除的后台操作
  const executeBatchDelete = async () => {
    setIsDeleting(true);
    setDeleteProgress({
      completed: 0,
      total: selectedTransactions.length,
      percentage: 0,
    });
    
    try {
      console.log(`🗑️ 开始批量删除 ${selectedTransactions.length} 条交易记录`);
      
      // 模拟进度更新（因为实际的deleteTransactions方法没有进度回调）
      const progressInterval = setInterval(() => {
        setDeleteProgress(prev => {
          if (!prev) return null;
          const newCompleted = Math.min(prev.completed + Math.floor(prev.total / 10), prev.total);
          const newPercentage = Math.round((newCompleted / prev.total) * 100);
          return {
            ...prev,
            completed: newCompleted,
            percentage: newPercentage,
          };
        });
      }, 200);
      
      const result = await onDeleteTransactions(selectedTransactions, {
        onProgress: (progress) => {
          setDeleteProgress({
            completed: progress.completed,
            total: progress.total,
            percentage: progress.percentage,
          });
          console.log(`📊 删除进度: ${progress.currentStep} - ${progress.completed}/${progress.total} (${progress.percentage}%)`);
        }
      });
      
      clearInterval(progressInterval);
      
      // 显示详细的结果信息
      if (result.success > 0 && result.failed === 0) {
        message.success({
          content: `✅ 成功删除 ${result.success} 条交易记录`,
          duration: 3
        });
      } else if (result.success > 0 && result.failed > 0) {
        message.warning({
          content: `⚠️ 部分删除成功：${result.success} 条成功，${result.failed} 条失败`,
          duration: 5
        });
        
        // 显示错误详情
        if (result.errors.length > 0) {
          Modal.error({
            title: '删除失败详情',
            content: (
              <div>
                <p>以下交易记录删除失败：</p>
                <ul>
                  {result.errors.slice(0, 10).map((error, index) => (
                    <li key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
                      {error}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li style={{ fontSize: '12px', color: '#666' }}>
                      ... 还有 {result.errors.length - 10} 个错误
                    </li>
                  )}
                </ul>
              </div>
            ),
            width: 600,
            okText: '确定'
          });
        }
      } else {
        message.error({
          content: `❌ 删除失败：${result.failed} 条交易记录均删除失败`,
          duration: 5
        });
        
        // 显示所有错误
        if (result.errors.length > 0) {
          Modal.error({
            title: '删除失败详情',
            content: (
              <div>
                <p>所有交易记录删除失败：</p>
                <ul>
                  {result.errors.slice(0, 15).map((error, index) => (
                    <li key={index} style={{ fontSize: '12px', marginBottom: '4px' }}>
                      {error}
                    </li>
                  ))}
                  {result.errors.length > 15 && (
                    <li style={{ fontSize: '12px', color: '#666' }}>
                      ... 还有 {result.errors.length - 15} 个错误
                    </li>
                  )}
                </ul>
              </div>
            ),
            width: 700,
            okText: '确定'
          });
        }
      }
      
      // 清空选择
      setSelectedTransactions([]);
      
      // 清理已删除交易的拆分记录缓存
      if (result.success > 0) {
        clearSplitsCache(selectedTransactions);
      }
      
    } catch (error) {
      console.error('批量删除失败:', error);
      
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error({
        content: `❌ 批量删除失败：${errorMessage}`,
        duration: 5
      });
    } finally {
      setIsDeleting(false);
      setDeleteProgress(null);
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
      
      // 更新缓存中的拆分记录
      const newSplits = await transactionSplitService.getSplitsByTransaction(transactionId);
      const newCache = new Map(splitsCache);
      newCache.set(transactionId, newSplits);
      setSplitsCache(newCache);
      
      // 更新当前显示的拆分记录
      const currentTransactionIds = transactions.map(t => t.id);
      const allCurrentSplits = currentTransactionIds.flatMap(id => newCache.get(id) || []);
      setTransactionSplits(allCurrentSplits);
      
      // 刷新交易列表以显示更新后的拆分状态
      console.log('🔄 拆分完成，更新缓存和显示');
      
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
      
      // 验证收入和支出不能同时有数额
      const expense = values.expense || 0;
      const income = values.income || 0;
      
      if (expense > 0 && income > 0) {
        message.error('收入和支出不能同时有数额，请选择其中一项');
        return;
      }
      
      if (expense === 0 && income === 0) {
        message.error('请输入收入或支出金额');
        return;
      }
      
      const transactionData = {
        bankAccountId: values.bankAccountId,
        transactionDate: dayjs(values.transactionDate).format('DD-MMM-YYYY'),
        mainDescription: values.mainDescription,
        subDescription: values.subDescription || '',
        expense: expense,
        income: income,
        payerPayee: values.payerPayee || '', // 付款人/收款人合并字段
        transactionType: values.transactionType || '', // 主要分类ID
        projectAccount: values.projectAccount || '', // 业务分类ID
        projectAccountId: values.projectAccountId || '', // 项目户口ID
        transactionPurpose: values.transactionPurpose || '', // 具体用途ID
        inputBy: user?.uid || 'unknown-user', // 设置为当前用户
        notes: values.notes || '',
        // 编辑时保持原有交易序号，新建时由服务层自动生成
        ...(editingTransaction ? { transactionNumber: editingTransaction.transactionNumber } : { transactionNumber: '' }),
      };

      if (editingTransaction) {
        // 检查是否设置了主要分类
        const hasMainCategory = values.transactionType && values.transactionType.trim() !== '';
        
        if (hasMainCategory) {
          // 如果设置了主要分类，删除相关的拆分记录
          try {
            await transactionSplitService.deleteSplitsByTransaction(editingTransaction.id);
            console.log(`🗑️ 已删除交易 ${editingTransaction.id} 的拆分记录，因为设置了主要分类`);
            
            // 更新本地拆分状态
            setTransactionSplits(prev => prev.filter(s => s.transactionId !== editingTransaction.id));
          } catch (error) {
            console.warn('删除拆分记录时出错:', error);
            // 拆分记录删除失败不影响主记录更新
          }
        }
        
        await onUpdateTransaction(editingTransaction.id, transactionData);
        message.success('交易记录更新成功');
      } else {
        await onCreateTransaction(transactionData);
        message.success('交易记录创建成功');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      // 使用全局系统服务记录错误
      globalSystemService.logError(error as Error, { 
        context: 'transaction_modal_operation',
        transactionData: editingTransaction ? 'update' : 'create',
        userId: user?.uid 
      });
      
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
      const updatePromises = selectedTransactions.map(async (transactionId) => {
        // 检查是否设置了主要分类（通过transactionPurpose推断）
        const hasMainCategory = settings.transactionPurpose && settings.transactionPurpose.trim() !== '';
        
        if (hasMainCategory) {
          // 如果设置了主要分类，删除相关的拆分记录
          try {
            await transactionSplitService.deleteSplitsByTransaction(transactionId);
            console.log(`🗑️ 已删除交易 ${transactionId} 的拆分记录，因为批量设置了主要分类`);
          } catch (error) {
            console.warn(`删除交易 ${transactionId} 拆分记录时出错:`, error);
            // 拆分记录删除失败不影响主记录更新
          }
        }
        
        return onUpdateTransaction(transactionId, updateData);
      });

      await Promise.all(updatePromises);
      
      // 更新本地拆分状态
      if (settings.transactionPurpose && settings.transactionPurpose.trim() !== '') {
        setTransactionSplits(prev => prev.filter(s => !selectedTransactions.includes(s.transactionId)));
      }
      
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



  // 计算余额的函数 - 使用优化的累计余额计算（优先使用缓存）
  const calculateBalances = useMemo(() => {
    // 优先使用优化的计算方法
    if (yearFilter) {
      return balanceCalculationService.calculateOptimizedBalances(
        filteredTransactions, 
        transactions, 
        bankAccounts, 
        yearFilter
      );
    }
    
    // 没有年份筛选时，使用标准计算
    return balanceCalculationService.calculateBalancesByAccount(
      filteredTransactions, 
      bankAccounts
    );
  }, [filteredTransactions, transactions, bankAccounts, yearFilter]);

  // 获取累计余额报告 - 使用优化的跨年分余额报告
  const balanceReport = useMemo(() => {
    // 优先使用优化的计算方法
    if (yearFilter) {
      return balanceCalculationService.generateOptimizedCrossYearBalanceReport(
        filteredTransactions, 
        transactions, 
        bankAccounts, 
        yearFilter
      );
    }
    
    // 没有年份筛选时，使用标准计算
    return balanceCalculationService.generateCrossYearBalanceReport(
      filteredTransactions, 
      transactions, 
      bankAccounts, 
      yearFilter
    );
  }, [filteredTransactions, transactions, bankAccounts, yearFilter]);



  const columns = [
    {
      title: '交易序号',
      dataIndex: 'transactionNumber',
      key: 'transactionNumber',
      width: 150,
      render: (transactionNumber: string, record: any) => {
        if (record.isSplitRecord) {
          return (
            <div>
              <Text code style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                {record.transactionNumber || '-'}
              </Text>
              <div style={{ marginTop: '2px' }}>
                <Tag color="blue" icon={<SplitCellsOutlined />} style={{ fontSize: '10px' }}>
                  拆分
                </Tag>
              </div>
            </div>
          );
        }
        return (
          <div>
            <Text code style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
              {transactionNumber || 'N/A'}
            </Text>
            <div style={{ marginTop: '2px' }}>
              <Tag color="green" icon={<TransactionOutlined />} style={{ fontSize: '10px' }}>
                主记录
              </Tag>
            </div>
          </div>
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
          return (
            <Space style={{ whiteSpace: 'nowrap' }}>
              <CalendarOutlined />
              <Text>{record.transactionDate || '-'}</Text>
            </Space>
          );
        }
        return (
          <Space style={{ whiteSpace: 'nowrap' }}>
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
          // 拆分记录显示主交易记录的主描述和副描述
          const mainDesc = record.mainDescription || '';
          const subDesc = record.subDescription || '';
          const combinedDesc = subDesc ? `${mainDesc} - ${subDesc}` : mainDesc;
          
          return (
            <div>
              <Text ellipsis={{ tooltip: combinedDesc }} strong>
                {mainDesc}
              </Text>
              {subDesc && (
                <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                  <Text ellipsis={{ tooltip: subDesc }} type="secondary">
                    {subDesc}
                  </Text>
                </div>
              )}
            </div>
          );
        }
        
        // 合并主描述和副描述显示
        const mainDesc = text || '';
        const subDesc = record.subDescription || '';
        const combinedDesc = subDesc ? `${mainDesc} - ${subDesc}` : mainDesc;
        
        return (
          <div>
            <Text ellipsis={{ tooltip: combinedDesc }} strong>
              {mainDesc}
            </Text>
            {subDesc && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                <Text ellipsis={{ tooltip: subDesc }} type="secondary">
                  {subDesc}
                </Text>
              </div>
            )}
          </div>
        );
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
          // 拆分记录：如果是收入类型的拆分，不显示在支出列
          const parentTransaction = transactions.find(t => t.id === record.transactionId);
          if (parentTransaction && parentTransaction.income > 0) {
            return '-'; // 收入类型的拆分不显示在支出列
          }
          // 支出类型的拆分显示在支出列
            return (
              <Text style={{ color: '#999999' }}>
                {record.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </Text>
            );
        }
        return amount > 0 ? (
          <Text style={{ color: '#ff4d4f' }}>
            {amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
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
          // 拆分记录：如果是收入类型的拆分，显示在收入列
          const parentTransaction = transactions.find(t => t.id === record.transactionId);
          if (parentTransaction && parentTransaction.income > 0) {
            return (
              <Text style={{ color: '#999999' }}>
                {record.amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </Text>
            );
          }
          // 支出类型的拆分不显示在收入列
          return '-';
        }
        return amount > 0 ? (
          <Text style={{ color: '#52c41a' }}>
            {amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </Text>
        ) : '-';
      },
    },
    {
      title: '净额',
      dataIndex: 'netAmount',
      key: 'netAmount',
      width: 120,
      align: 'right' as const,
      render: (_: any, record: any) => {
        if (record.isSplitRecord) {
          return '-';
        }
        const netAmount = balanceCalculationService.calculateNetAmount(record);
        const isPositive = netAmount >= 0;
        return (
          <Tooltip title={`净额: ${balanceCalculationService.formatNetAmount(record)}`}>
            <Text style={{ 
              color: isPositive ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              {netAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </Text>
          </Tooltip>
        );
      },
    },
    {
      title: '累计余额',
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
          <Tooltip title={`累计余额: ${balance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}>
          <Text style={{ 
            color: isPositive ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold',
              fontSize: '13px'
          }}>
            {balance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </Text>
          </Tooltip>
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
      title: '付款描述',
      dataIndex: 'paymentDescription',
      key: 'paymentDescription',
      width: 150,
      render: (paymentDescription: string, record: any) => {
        if (record.isSplitRecord) {
          return (
            <Text ellipsis={{ tooltip: record.paymentDescription || '-' }}>
              {record.paymentDescription || '-'}
            </Text>
          );
        }
        
        if (paymentDescription) {
          return (
            <Text ellipsis={{ tooltip: paymentDescription }}>
              {paymentDescription}
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
      width: 200,
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
        
        // 获取业务分类和交易用途信息
        const getBusinessCategoryInfo = () => {
          // 优先使用存储的业务分类
          if (businessCategoryId) {
            const purpose = purposes.find(p => p.id === businessCategoryId);
            return purpose ? purpose.name : '未分类';
          }
          
          // 如果没有存储的业务分类，根据交易用途推断
          if (record.transactionPurpose) {
            const purpose = purposes.find(p => p.id === record.transactionPurpose);
            if (purpose) {
              if (purpose.level === 2 && purpose.parentId) {
                // 具体用途，找到其父级（业务分类）
                const businessCategory = purposes.find(p => p.id === purpose.parentId);
                return businessCategory ? businessCategory.name : '未分类';
              } else if (purpose.level === 1) {
                // 业务分类
                return purpose.name;
              }
            }
          }
          
          return '未分类';
        };
        
        const getTransactionPurposeInfo = () => {
          if (!record.transactionPurpose) return null;
          
          const purpose = purposes.find(p => p.id === record.transactionPurpose);
          if (purpose) {
            return {
              name: purpose.name
            };
          }
          
          return null;
        };
        
        const businessCategory = getBusinessCategoryInfo();
        const transactionPurpose = getTransactionPurposeInfo();
        
        return (
          <div>
            <Tag color="green" style={{ fontSize: '12px' }}>
              {businessCategory}
            </Tag>
            {transactionPurpose && (
              <div style={{ marginTop: '2px' }}>
                <Tag color="blue" style={{ fontSize: '10px' }}>
                  {transactionPurpose.name}
                </Tag>
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
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      render: (notes: string, record: any) => {
        if (record.isSplitRecord) {
          return (
            <Text ellipsis={{ tooltip: record.notes || '无备注' }} type="secondary">
              {record.notes || '无备注'}
            </Text>
          );
        }
        return notes ? (
          <Text ellipsis={{ tooltip: notes }} type="secondary">
            {notes}
          </Text>
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
    {
      title: '世界区域',
      dataIndex: 'worldRegion',
      key: 'worldRegion',
      width: 100,
      render: (worldRegion: string, record: any) => {
        if (record.isSplitRecord) {
          return '-';
        }
        return worldRegion ? (
          <Tag color="purple">{worldRegion}</Tag>
        ) : '-';
      },
    },
    {
      title: '国家',
      dataIndex: 'country',
      key: 'country',
      width: 100,
      render: (country: string, record: any) => {
        if (record.isSplitRecord) {
          return '-';
        }
        return country ? (
          <Tag color="green">{country}</Tag>
        ) : '-';
      },
    },
    {
      title: '国家区域',
      dataIndex: 'countryRegion',
      key: 'countryRegion',
      width: 120,
      render: (countryRegion: string, record: any) => {
        if (record.isSplitRecord) {
          return '-';
        }
        return countryRegion ? (
          <Tag color="orange">{countryRegion}</Tag>
        ) : '-';
      },
    },
    {
      title: '分会',
      dataIndex: 'chapter',
      key: 'chapter',
      width: 120,
      render: (chapter: string, record: any) => {
        if (record.isSplitRecord) {
          return '-';
        }
        return chapter ? (
          <Text ellipsis={{ tooltip: chapter }}>
            {chapter}
          </Text>
        ) : '-';
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
  const tabItems = [
    // 添加累计余额汇总标签页
    {
      key: 'balance-summary',
      label: (
        <span>
          <DollarOutlined />
          累计余额汇总
        </span>
      ),
      children: (
        <AccountBalanceDisplay
          transactions={transactions}
          bankAccounts={bankAccounts}
          title="银行户口累计余额汇总"
        />
      ),
    },
    {
      key: 'balance-sync',
      label: (
        <span>
          <SyncOutlined />
          余额同步管理
        </span>
      ),
      children: (
        <BalanceSyncManager
          onSyncComplete={() => {
            // 刷新数据
            window.location.reload();
          }}
        />
      ),
    },
    {
      key: 'balance-debugger',
      label: (
        <span>
          <ExclamationCircleOutlined />
          余额不一致性分析
        </span>
      ),
      children: (
        <BalanceInconsistencyDebugger
          transactions={transactions}
          bankAccounts={bankAccounts}
          filteredTransactions={filteredTransactions}
          yearFilter={yearFilter}
        />
      ),
    },
    {
      key: 'cache-manager',
      label: (
        <span>
          <DatabaseOutlined />
          余额缓存管理
        </span>
      ),
      children: (
        <BalanceCacheManager
          bankAccounts={bankAccounts}
          onRefresh={() => {
            // 刷新数据
            window.location.reload();
          }}
        />
      ),
    },
    // 原有的银行户口标签页
    ...bankAccounts.map(account => {
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
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="交易数"
                  value={stats.totalTransactions}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
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
            <Col span={6}>
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
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="户口余额"
                  value={balanceReport.accountDetails.find(acc => acc.accountId === account.id)?.runningBalance || account.currentBalance}
                  prefix={<BankOutlined />}
                  precision={2}
                  valueStyle={{ color: (balanceReport.accountDetails.find(acc => acc.accountId === account.id)?.runningBalance || account.currentBalance) >= 0 ? '#52c41a' : '#ff4d4f' }}
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
               current: currentPage,
               pageSize: pageSize,
               showSizeChanger: true,
               showQuickJumper: true,
               pageSizeOptions: ['10', '20', '50', '100'],
               showTotal: (total, range) => 
                 `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
               onChange: (page, size) => {
                 setCurrentPage(page);
                 if (size !== pageSize) {
                   setPageSize(size);
                   setCurrentPage(1); // 重置到第一页
                 }
               },
               onShowSizeChange: (_, size) => {
                 setPageSize(size);
                 setCurrentPage(1); // 重置到第一页
               },
             }}
             scroll={{ x: 2000 }}
           />
        </div>
      ),
    };
    })
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <DollarOutlined /> 交易记录管理
              </Title>
              <Text type="secondary">3层级交易用途体系</Text>
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
                   danger
                   icon={isDeleting ? <LoadingOutlined /> : <DeleteOutlined />}
                   loading={isDeleting}
                   disabled={selectedTransactions.length === 0 || !user || !member || !['president', 'treasurer', 'secretary_general', 'developer'].includes(member?.accountType || '') || isDeleting}
                   onClick={handleBatchDelete}
                   title={!user ? '请先登录' : !member ? '正在加载用户信息...' : selectedTransactions.length === 0 ? '请先选择要删除的记录' : '批量删除交易记录'}
                 >
                   {isDeleting && deleteProgress ? (
                     `删除中... ${deleteProgress.completed}/${deleteProgress.total} (${deleteProgress.percentage}%)`
                   ) : (
                     `批量删除 (${selectedTransactions.length})`
                   )}
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
            <Col span={5}>
              <Input
                placeholder="搜索交易描述、付款人/收款人等"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={5}>
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
            <Col span={3}>
              <GlobalYearFilterModal
                value={yearFilter}
                onChange={(year) => setYearFilter(year || new Date().getFullYear())}
                availableYears={availableYears}
                placeholder="选择年份"
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={3}>
              <Select
                value={monthFilter}
                onChange={setMonthFilter}
                style={{ width: '100%' }}
                placeholder="选择月份"
                allowClear
              >
                <Option key="all" value={null}>
                  全年
                </Option>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = i + 1;
                  return (
                    <Option key={month} value={month}>
                      {month}月
                    </Option>
                  );
                })}
              </Select>
            </Col>
            <Col span={4}>
              <Space>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setPurposeFilter([]);
                    setYearFilter(new Date().getFullYear());
                    setMonthFilter(null);
                  }}
                >
                  清除筛选
                </Button>
              </Space>
            </Col>
          </Row>
          <Row style={{ marginTop: 8 }}>
            <Col span={24}>
              <Text type="secondary">
                显示 {filteredTransactions.length} / {transactions.length} 条记录
                {yearFilter && ` | 已筛选年份: ${yearFilter}年`}
                {monthFilter ? ` | 已筛选月份: ${monthFilter}月` : yearFilter ? ` | 已筛选月份: 全年` : ''}
                {purposeFilter.length > 0 && ` | 已筛选用途: ${purposeFilter.length}个`}
                {yearFilter && ` | 累计余额基于${yearFilter}年数据计算`}
              </Text>
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
        {...globalComponentService.getModalConfig({
          width: 1000, // Increased width for better form layout
          centered: true,
          destroyOnHidden: true,
          maskClosable: false,
          keyboard: true
        })}
      >
        <Form
          form={form}
          {...globalComponentService.getFormConfig({
            layout: 'horizontal',
            labelCol: { span: 6 },
            wrapperCol: { span: 18 },
            validateTrigger: 'onBlur',
            scrollToFirstError: true
          })}
          initialValues={{
            expense: 0,
            income: 0,
            inputBy: user?.uid || 'unknown-user',
          }}
        >
          <Row gutter={16}>
            {/* 第一个卡片：基本信息 */}
            <Col span={12}>
              <Card title="基本信息" size="small" style={{ marginBottom: 16, height: '100%' }}>
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

                <Form.Item
                  name="mainDescription"
                  label="主描述"
                  rules={[
                    { required: true, message: '请输入主描述' },
                    {
                      validator: (_, value) => {
                        if (value) {
                          const lengthValidation = globalValidationService.validateFieldLength(value, 'description');
                          if (!lengthValidation.valid) {
                            return Promise.reject(new Error(lengthValidation.error));
                          }
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input 
                    placeholder="请输入主描述" 
                    maxLength={GLOBAL_VALIDATION_CONFIG.FIELD_LIMITS.description.max}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="subDescription"
                  label="副描述"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (value) {
                          const lengthValidation = globalValidationService.validateFieldLength(value, 'description');
                          if (!lengthValidation.valid) {
                            return Promise.reject(new Error(lengthValidation.error));
                          }
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input 
                    placeholder="请输入副描述" 
                    maxLength={GLOBAL_VALIDATION_CONFIG.FIELD_LIMITS.description.max}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="expense"
                  label="支出金额"
                  rules={[
                    {
                      validator: (_, value) => {
                        // 使用全局验证服务验证金额范围
                        if (value && value > 0) {
                          const amountValidation = globalValidationService.validateNumberRange(value, 'amount');
                          if (!amountValidation.valid) {
                            return Promise.reject(new Error(amountValidation.error));
                          }
                        }
                        
                        const income = form.getFieldValue('income');
                        if (value > 0 && income > 0) {
                          return Promise.reject(new Error('收入和支出不能同时有数额'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    placeholder="请输入支出金额"
                    style={{ width: '100%' }}
                    min={GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES.amount.min}
                    max={GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES.amount.max}
                    precision={2}
                    formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => {
                      const num = parseFloat(value!.replace(/RM\s?|(,*)/g, ''));
                      return (isNaN(num) ? 0 : num) as any;
                    }}
                    onChange={() => {
                      // 当支出金额变化时，验证收入字段
                      form.validateFields(['income']);
                    }}
                  />
                </Form.Item>

                <Form.Item
                  name="income"
                  label="收入金额"
                  rules={[
                    {
                      validator: (_, value) => {
                        // 使用全局验证服务验证金额范围
                        if (value && value > 0) {
                          const amountValidation = globalValidationService.validateNumberRange(value, 'amount');
                          if (!amountValidation.valid) {
                            return Promise.reject(new Error(amountValidation.error));
                          }
                        }
                        
                        const expense = form.getFieldValue('expense');
                        if (value > 0 && expense > 0) {
                          return Promise.reject(new Error('收入和支出不能同时有数额'));
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <InputNumber
                    placeholder="请输入收入金额"
                    style={{ width: '100%' }}
                    min={GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES.amount.min}
                    max={GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES.amount.max}
                    precision={2}
                    formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => {
                      const num = parseFloat(value!.replace(/RM\s?|(,*)/g, ''));
                      return (isNaN(num) ? 0 : num) as any;
                    }}
                    onChange={() => {
                      // 当收入金额变化时，验证支出字段
                      form.validateFields(['expense']);
                    }}
                  />
                </Form.Item>
              </Card>
            </Col>

            {/* 第二个卡片：分类和人员信息 */}
            <Col span={12}>
              <Card title="分类和人员信息" size="small" style={{ marginBottom: 16, height: '100%' }}>
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

                <Form.Item
                  name="projectAccountId"
                  label="项目户口"
                  tooltip="选择对应的项目户口，交易记录将载入到该项目的交易记录标签中"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (value) {
                          // 验证项目户口ID是否存在于活跃的项目户口列表中
                          const isValidProjectAccount = projectAccounts.some(
                            account => account.id === value && account.status === 'active'
                          );
                          if (!isValidProjectAccount) {
                            return Promise.reject(new Error('请选择有效的项目户口'));
                          }
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Select
                    placeholder="请选择项目户口"
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    style={{ width: '100%' }}
                    filterOption={(input, option) =>
                      String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {projectAccounts.filter(account => account.status === 'active').map(account => (
                      <Option key={account.id} value={account.id}>
                        {account.name} ({account.status === 'active' ? '活跃' : account.status === 'inactive' ? '停用' : '已完成'})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

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

                <Form.Item
                  name="payerPayee"
                  label="付款人/收款人"
                  tooltip="用于识别收支款项的来源或去向"
                  rules={[
                    {
                      validator: (_, value) => {
                        if (value) {
                          const lengthValidation = globalValidationService.validateFieldLength(value, 'name');
                          if (!lengthValidation.valid) {
                            return Promise.reject(new Error(lengthValidation.error));
                          }
                        }
                        return Promise.resolve();
                      }
                    }
                  ]}
                >
                  <Input 
                    placeholder="请输入付款人或收款人" 
                    maxLength={GLOBAL_VALIDATION_CONFIG.FIELD_LIMITS.name.max}
                    showCount
                  />
                </Form.Item>

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
              </Card>
            </Col>
          </Row>


          <Card title="备注信息" size="small" style={{ marginTop: 16, marginBottom: 16 }}>
            <Form.Item
              name="notes"
              rules={[
                {
                  validator: (_, value) => {
                    if (value) {
                      const lengthValidation = globalValidationService.validateFieldLength(value, 'notes');
                      if (!lengthValidation.valid) {
                        return Promise.reject(new Error(lengthValidation.error));
                      }
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input.TextArea
                placeholder="请输入备注"
                rows={3}
                style={{ width: '100%' }}
                maxLength={GLOBAL_VALIDATION_CONFIG.FIELD_LIMITS.notes.max}
                showCount
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
