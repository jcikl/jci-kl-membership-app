import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Modal,
  Select,
  Input,
  message,
  Row,
  Col,
  Statistic,
  Tooltip,
  Checkbox,
  Divider,
  Alert,
  Badge,
} from 'antd';
import {
  UserOutlined,
  DollarOutlined,
  CalendarOutlined,
  TagOutlined,
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  ExportOutlined,
  FileTextOutlined,
  SplitCellsOutlined,
} from '@ant-design/icons';
import { Transaction, TransactionPurpose, TransactionSplit } from '@/types/finance';
import { Member } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { getMembers } from '@/services/memberService';
import { transactionSplitService } from '@/services/financeService';

const { Title, Text } = Typography;
const { Option } = Select;

interface MembershipFeeManagementProps {
  onUpdateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  transactions: Transaction[];
  purposes: TransactionPurpose[];
  loading?: boolean;
}

interface MemberMatch {
  transactionId: string;
  splitId?: string; // 如果是拆分记录匹配，记录拆分ID
  memberIds: string[]; // 保持memberIds字段名不变，用于内部逻辑
  matchedAt: string;
  matchedBy: string;
  membershipType: 'renewal' | 'new' | 'mixed';
  renewalAccountIds?: string[]; // 续费用户户口系统ID列表
  newAccountIds?: string[]; // 新用户户口系统ID列表
}

const MembershipFeeManagement: React.FC<MembershipFeeManagementProps> = ({
  onUpdateTransaction,
  transactions,
  purposes,
  loading = false,
}) => {
  const { user } = useAuthStore();
  
  // 状态管理
  const [selectedPaymentYear, setSelectedPaymentYear] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);
  const [isMemberModalVisible, setIsMemberModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedSplit, setSelectedSplit] = useState<TransactionSplit | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberMatches, setMemberMatches] = useState<MemberMatch[]>([]);
  const [searchText, setSearchText] = useState('');
  const [transactionSplits, setTransactionSplits] = useState<TransactionSplit[]>([]);

  // 加载所有拆分记录
  const loadTransactionSplits = async () => {
    try {
      const splits = await transactionSplitService.getAllSplits();
      setTransactionSplits(splits);
    } catch (error) {
      console.error('加载拆分记录失败:', error);
    }
  };

  useEffect(() => {
    loadTransactionSplits();
  }, []);

  // 获取会员费相关的交易用途
  const membershipPurposes = useMemo(() => {
    return purposes.filter(p => 
      p.name.includes('会员费') || 
      p.name.includes('新会员') || 
      p.name.includes('续费') ||
      p.name.includes('准会员') ||
      p.name.includes('访问会员')
    );
  }, [purposes]);

  // 获取可选的支付年份
  const availablePaymentYears = useMemo(() => {
    const years = new Set<string>();
    membershipPurposes.forEach(purpose => {
      const yearMatch = purpose.name.match(/(\d{4})/);
      if (yearMatch) {
        years.add(yearMatch[1]);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // 降序排列
  }, [membershipPurposes]);

  // 创建统一的记录数据结构（包含主交易记录和拆分记录）
  const unifiedRecords = useMemo(() => {
    const records: Array<{
      id: string;
      type: 'transaction' | 'split';
      transactionId: string;
      splitId?: string;
      transactionDate: string;
      mainDescription: string;
      subDescription?: string;
      amount: number;
      payerPayee?: string;
      transactionPurpose?: string;
      projectAccount?: string;
      transactionType?: string;
      description?: string;
      notes?: string;
      isMatched: boolean;
    }> = [];

    // 添加主交易记录
    transactions.forEach(transaction => {
      if (!transaction.transactionPurpose) return;
      
      const purpose = purposes.find(p => p.id === transaction.transactionPurpose);
      if (!purpose) return;
      
      // 检查是否为会员费相关用途
      const isMembershipFee = purpose.name.includes('会员费') || 
                              purpose.name.includes('新会员') || 
                              purpose.name.includes('续费') ||
                              purpose.name.includes('准会员') ||
                              purpose.name.includes('访问会员');
      
      if (!isMembershipFee) return;

      // 检查是否有拆分记录
      const hasSplits = transactionSplits.some(split => split.transactionId === transaction.id);
      
      // 如果没有拆分记录，添加主交易记录
      if (!hasSplits) {
        records.push({
          id: transaction.id,
          type: 'transaction',
          transactionId: transaction.id,
          transactionDate: transaction.transactionDate,
          mainDescription: transaction.mainDescription,
          subDescription: transaction.subDescription,
          amount: transaction.income,
          payerPayee: transaction.payerPayee,
          transactionPurpose: transaction.transactionPurpose,
          projectAccount: transaction.projectAccount,
          transactionType: transaction.transactionType,
          isMatched: !!(transaction.payerPayee && transaction.payerPayee.trim() !== ''),
        });
      }
    });

    // 添加拆分记录
    transactionSplits.forEach(split => {
      const transaction = transactions.find(t => t.id === split.transactionId);
      if (!transaction) return;

      const purpose = purposes.find(p => p.id === split.transactionPurpose);
      if (!purpose) return;
      
      // 检查是否为会员费相关用途
      const isMembershipFee = purpose.name.includes('会员费') || 
                              purpose.name.includes('新会员') || 
                              purpose.name.includes('续费') ||
                              purpose.name.includes('准会员') ||
                              purpose.name.includes('访问会员');
      
      if (!isMembershipFee) return;

      records.push({
        id: `${split.transactionId}-${split.id}`,
        type: 'split',
        transactionId: split.transactionId,
        splitId: split.id,
        transactionDate: transaction.transactionDate,
        mainDescription: transaction.mainDescription,
        subDescription: transaction.subDescription,
        amount: split.amount,
        payerPayee: split.payerPayee,
        transactionPurpose: split.transactionPurpose,
        projectAccount: split.projectAccount,
        transactionType: split.transactionType,
        description: split.description,
        notes: split.notes,
        isMatched: !!(split.payerPayee && split.payerPayee.trim() !== ''),
      });
    });

    return records;
  }, [transactions, transactionSplits, purposes]);

  // 根据选择的支付年份筛选记录
  const filteredRecords = useMemo(() => {
    return unifiedRecords.filter(record => {
      if (!record.transactionPurpose) return false;
      
      const purpose = purposes.find(p => p.id === record.transactionPurpose);
      if (!purpose) return false;
      
      // 如果没有选择年份，显示所有会员费记录；如果选择了年份，则按年份筛选
      if (!selectedPaymentYear) {
        return true;
      } else {
        const isSelectedYear = purpose.name.includes(selectedPaymentYear);
        return isSelectedYear;
      }
    });
  }, [unifiedRecords, purposes, selectedPaymentYear]);

  // 上一年的会费交易记录筛选（用于左边卡片）- 仅显示已匹配的记录
  const filteredTransactionsPreviousYear = useMemo(() => {
    if (!selectedPaymentYear) {
      // 如果没有选择年份，显示所有已匹配的会员费交易
      return transactions.filter(transaction => {
      if (!transaction.transactionPurpose) return false;
      
      const purpose = purposes.find(p => p.id === transaction.transactionPurpose);
      if (!purpose) return false;
      
      const isMembershipFee = purpose.name.includes('会员费') || 
                              purpose.name.includes('新会员') || 
                              purpose.name.includes('续费') ||
                              purpose.name.includes('准会员') ||
                              purpose.name.includes('访问会员');
      
        // 检查是否已匹配（有payerPayee字段且不为空）
        const isMatched = transaction.payerPayee && transaction.payerPayee.trim() !== '';
        
        return isMembershipFee && isMatched;
      });
    }
    
    // 计算上一年
    const previousYear = (parseInt(selectedPaymentYear) - 1).toString();
    
    return transactions.filter(transaction => {
      if (!transaction.transactionPurpose) return false;
      
      const purpose = purposes.find(p => p.id === transaction.transactionPurpose);
      if (!purpose) return false;
      
      // 检查是否为会员费相关用途
      const isMembershipFee = purpose.name.includes('会员费') || 
                              purpose.name.includes('新会员') || 
                              purpose.name.includes('续费') ||
                              purpose.name.includes('准会员') ||
                              purpose.name.includes('访问会员');
      
      // 筛选上一年的交易记录
      const isPreviousYear = purpose.name.includes(previousYear);
      
      // 检查是否已匹配（有payerPayee字段且不为空）
      const isMatched = transaction.payerPayee && transaction.payerPayee.trim() !== '';
      
      return isMembershipFee && isPreviousYear && isMatched;
    });
  }, [transactions, purposes, selectedPaymentYear]);







  // 加载会员数据
  const loadMembers = async () => {
    try {
      const response = await getMembers({ page: 1, limit: 1000 });
      setMembers(response.data);
    } catch (error) {
      message.error('加载会员数据失败');
      console.error('加载会员数据失败:', error);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // 从交易记录中加载已有的会员匹配数据
  useEffect(() => {
    const existingMatches: MemberMatch[] = [];
    
    transactions.forEach(transaction => {
      if (transaction.membershipFeeData) {
        const match: MemberMatch = {
          transactionId: transaction.id,
          memberIds: transaction.membershipFeeData.matchedAccountIds || [],
          matchedAt: transaction.membershipFeeData.matchedAt || new Date().toISOString(),
          matchedBy: transaction.membershipFeeData.matchedBy || 'unknown-user',
          membershipType: transaction.membershipFeeData.membershipType || 'renewal',
          renewalAccountIds: transaction.membershipFeeData.renewalAccountIds || undefined,
          newAccountIds: transaction.membershipFeeData.newAccountIds || undefined,
        };
        existingMatches.push(match);
      }
    });
    
    setMemberMatches(existingMatches);
  }, [transactions]);

  // 获取交易用途的完整路径
  const getPurposePath = (purposeId: string): string[] => {
    const purpose = purposes.find(p => p.id === purposeId);
    if (!purpose) return [];
    
    const path: string[] = [];
    let currentPurpose: TransactionPurpose | undefined = purpose;
    
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

  // 获取已匹配的会员信息
  const getMatchedMembers = (transactionId: string, splitId?: string): Member[] => {
    const match = memberMatches.find(m => 
      m.transactionId === transactionId && 
      (splitId ? m.splitId === splitId : !m.splitId)
    );
    if (!match) return [];
    
    return members.filter(member => match.memberIds.includes(member.id));
  };

  // 打开会员匹配模态框
  const handleMatchMembers = (record: { transactionId: string; splitId?: string }) => {
    const transaction = transactions.find(t => t.id === record.transactionId);
    if (!transaction) return;
    
    setSelectedTransaction(transaction);
    setSelectedSplit(record.splitId ? transactionSplits.find(s => s.id === record.splitId) || null : null);
    
    const existingMatch = memberMatches.find(m => 
      m.transactionId === record.transactionId && 
      (record.splitId ? m.splitId === record.splitId : !m.splitId)
    );
    if (existingMatch) {
      setSelectedMembers(existingMatch.memberIds);
    } else {
      setSelectedMembers([]);
    }
    setIsMemberModalVisible(true);
  };

  // 确认会员匹配
  const handleConfirmMatch = async () => {
    if (!selectedTransaction) {
      message.warning('请选择交易记录');
      return;
    }

    try {
      // 确定会员类型（简化为统一类型）
      const membershipType: 'renewal' | 'new' | 'mixed' = 'renewal';

      // 构建会员信息字符串
      const matchedMembersInfo = selectedMembers.length > 0 ? selectedMembers.map(memberId => {
        const member = members.find(m => m.id === memberId);
        if (!member) return '';
        
        // 优先使用fullNameNric字段，如果不存在则使用name字段
        const displayName = member.profile?.fullNameNric || member.name;
        return `${displayName}(${member.memberId})`;
      }).filter(Boolean).join(', ') : '';

      // 构建会员费匹配数据
      const membershipFeeData: any = {
        matchedAccountIds: selectedMembers,
        matchedAt: new Date().toISOString(),
        matchedBy: user?.uid || 'unknown-user',
        membershipType,
      };

      if (selectedSplit) {
        // 如果是拆分记录匹配，更新拆分记录
        await transactionSplitService.updateSplit(selectedSplit.id, {
          payerPayee: matchedMembersInfo,
        });

        // 更新本地拆分记录状态
        setTransactionSplits(prev => prev.map(split => 
          split.id === selectedSplit.id 
            ? { ...split, payerPayee: matchedMembersInfo }
            : split
        ));
      } else {
        // 如果是主交易记录匹配，更新主交易记录
        await onUpdateTransaction(selectedTransaction.id, {
          payerPayee: matchedMembersInfo,
          membershipFeeData: membershipFeeData
        });
      }

      // 更新本地匹配状态
      const newMatch: MemberMatch = {
        transactionId: selectedTransaction.id,
        splitId: selectedSplit?.id,
        memberIds: selectedMembers,
        matchedAt: membershipFeeData.matchedAt,
        matchedBy: membershipFeeData.matchedBy,
        membershipType,
      };

      setMemberMatches(prev => {
        const existingIndex = prev.findIndex(m => 
          m.transactionId === selectedTransaction.id && 
          (selectedSplit ? m.splitId === selectedSplit.id : !m.splitId)
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newMatch;
          return updated;
        } else {
          return [...prev, newMatch];
        }
      });

      const recordType = selectedSplit ? '拆分记录' : '交易记录';
      message.success(`成功匹配 ${selectedMembers.length} 位会员到${recordType}`);
      setIsMemberModalVisible(false);
      setSelectedTransaction(null);
      setSelectedSplit(null);
      setSelectedMembers([]);
    } catch (error) {
      console.error('保存会员匹配数据失败:', error);
      
      if (error instanceof Error) {
        message.error(`保存会员匹配数据失败: ${error.message}`);
      } else {
        message.error('保存会员匹配数据失败，请检查网络连接和权限');
      }
    }
  };

  // 取消会员匹配
  const handleCancelMatch = () => {
    setIsMemberModalVisible(false);
    setSelectedTransaction(null);
    setSelectedSplit(null);
    setSelectedMembers([]);
  };

  // 移除会员匹配
  const handleRemoveMatch = async (record: { transactionId: string; splitId?: string }) => {
    try {
      if (record.splitId) {
        // 如果是拆分记录，清空拆分记录的payerPayee
        await transactionSplitService.updateSplit(record.splitId, {
          payerPayee: '',
        });

        // 更新本地拆分记录状态
        setTransactionSplits(prev => prev.map(split => 
          split.id === record.splitId 
            ? { ...split, payerPayee: '' }
            : split
        ));
      } else {
        // 如果是主交易记录，清空主交易记录的匹配数据
        await onUpdateTransaction(record.transactionId, {
          payerPayee: '',
          membershipFeeData: null as any
        });
      }

      // 同时更新本地状态
      setMemberMatches(prev => prev.filter(m => 
        m.transactionId !== record.transactionId || 
        (record.splitId ? m.splitId !== record.splitId : !!m.splitId)
      ));
      
      const recordType = record.splitId ? '拆分记录' : '交易记录';
      message.success(`已移除${recordType}的会员匹配`);
    } catch (error) {
      console.error('移除会员匹配数据失败:', error);
      message.error('移除会员匹配数据失败');
    }
  };

  // 计算统计信息
  const getStatistics = () => {
    const totalRecords = filteredRecords.length;
    const totalAmount = filteredRecords.reduce((sum, r) => sum + r.amount, 0);
    const matchedRecords = filteredRecords.filter(r => r.isMatched).length;
    const unmatchedRecords = totalRecords - matchedRecords;
    const totalMatchedMembers = memberMatches.reduce((sum, m) => sum + m.memberIds.length, 0);

    return {
      totalTransactions: totalRecords,
      totalAmount,
      matchedTransactions: matchedRecords,
      unmatchedTransactions: unmatchedRecords,
      totalMatchedMembers,
    };
  };

  const stats = getStatistics();

  // 添加样式确保左边卡片文本不自动换行
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .nowrap-column {
        white-space: nowrap !important;
      }
      .nowrap-column .ant-table-cell {
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 表格列定义
  const columns = [
    {
      title: '交易日期',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 120,
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{date}</Text>
        </Space>
      ),
    },
    {
      title: '主描述',
      dataIndex: 'mainDescription',
      key: 'mainDescription',
      width: 200,
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }} strong>
          {text}
        </Text>
      ),
    },
    {
      title: '副描述',
      dataIndex: 'subDescription',
      key: 'subDescription',
      width: 150,
      render: (text: string) => text ? (
        <Text ellipsis={{ tooltip: text }} type="secondary">
          {text}
        </Text>
      ) : '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => amount > 0 ? (
        <Text style={{ color: '#52c41a' }}>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: 'MYR' 
          })}
        </Text>
      ) : '-',
    },
    {
      title: '付款人/收款人',
      dataIndex: 'payerPayee',
      key: 'payerPayee',
      width: 150,
      render: (payerPayee: string) => payerPayee ? (
        <Text ellipsis={{ tooltip: payerPayee }}>
          {payerPayee}
        </Text>
      ) : '-',
    },
    {
      title: '交易用途',
      dataIndex: 'transactionPurpose',
      key: 'transactionPurpose',
      width: 200,
      render: (purposeId: string) => {
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
      title: '记录类型',
      key: 'recordType',
      width: 100,
      render: (_: any, record: any) => {
        if (record.type === 'split') {
          return (
            <Tag color="blue" icon={<SplitCellsOutlined />}>
              拆分记录
            </Tag>
          );
        } else {
          return (
            <Tag color="default">
              主记录
            </Tag>
          );
        }
      },
    },
    {
      title: '会员匹配',
      key: 'memberMatch',
      width: 200,
      render: (_: any, record: any) => {
        const matchedMembers = getMatchedMembers(record.transactionId, record.splitId);
        
        if (matchedMembers.length > 0) {
          return (
            <div>
              <Tag color="green" icon={<CheckCircleOutlined />}>
                已匹配 {matchedMembers.length} 位会员
              </Tag>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                {matchedMembers.map(member => member.name).join(', ')}
              </div>
            </div>
          );
        } else {
          return (
            <Tag color="orange">
              未匹配
            </Tag>
          );
        }
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => {
        const matchedMembers = getMatchedMembers(record.transactionId, record.splitId);
        
        return (
          <Space>
            <Tooltip title="匹配会员">
              <Button
                type="link"
                icon={<TeamOutlined />}
                onClick={() => handleMatchMembers({ transactionId: record.transactionId, splitId: record.splitId })}
              >
                {matchedMembers.length > 0 ? '重新匹配' : '匹配会员'}
              </Button>
            </Tooltip>
            {matchedMembers.length > 0 && (
              <Tooltip title="移除匹配">
                <Button
                  type="link"
                  danger
                  onClick={() => handleRemoveMatch({ transactionId: record.transactionId, splitId: record.splitId })}
                >
                  移除
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  // 左边卡片的列定义（不包含操作列和会员匹配列，禁用自动换行）
  const readOnlyColumns = columns
    .filter(column => 
      column.key !== 'action' && 
      column.key !== 'memberMatch' && 
      column.key !== 'recordType'
    )
    .map(column => ({
      ...column,
      className: 'nowrap-column'
    }));

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <DollarOutlined /> 会费管理
              </Title>
              <Text type="secondary">管理会费交易记录和会员匹配</Text>
            </Col>
          </Row>
        </div>

        {/* 年份选择器和搜索 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Select
                placeholder="选择会费支付年份"
                value={selectedPaymentYear}
                onChange={setSelectedPaymentYear}
                style={{ width: '100%' }}
                allowClear
              >
                <Option key="all" value="">
                  所有年份
                </Option>
                {availablePaymentYears.map(year => (
                  <Option key={year} value={year}>
                    {year}年会费
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Input
                placeholder="搜索会员或交易..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Space>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setSelectedPaymentYear('');
                  }}
                >
                  清除筛选
                </Button>
                <Button icon={<ExportOutlined />}>
                  导出数据
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={3}>
              <Card size="small">
                <Statistic
                  title="总交易数"
                  value={stats.totalTransactions}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            <Col span={3}>
              <Card size="small">
                <Statistic
                  title="总金额"
                  value={stats.totalAmount}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={3}>
              <Card size="small">
                <Statistic
                  title="已匹配"
                  value={stats.matchedTransactions}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={3}>
              <Card size="small">
                <Statistic
                  title="未匹配"
                  value={stats.unmatchedTransactions}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={3}>
              <Card size="small">
                <Statistic
                  title="匹配会员数"
                  value={stats.totalMatchedMembers}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

        {/* 提示信息 */}
        {!selectedPaymentYear && (
          <Alert
            message="显示所有年份的会费交易记录"
            description="当前显示所有年份的会费交易记录。您可以选择特定年份进行筛选。"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 调试信息 */}
          <Alert
            message="调试信息"
            description={
              <div>
              <div><strong>当前选择:</strong> {selectedPaymentYear ? `${selectedPaymentYear}年会费` : '所有年份'}</div>
                <div><strong>总会员数:</strong> {members.length}</div>
                <div><strong>有付费日期的会员数:</strong> {members.filter(m => m.profile?.paymentDate || m.profile?.paymentVerifiedDate).length}</div>
              </div>
            }
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

        {/* 会费交易记录 - 左右并列布局 */}
          <Row gutter={16}>
          {/* 左栏：上一年的已匹配会费交易记录（仅供参考） */}
            <Col span={12}>
              <Card 
                title={
                  <Space>
                  <DollarOutlined />
                  <span>{
                    selectedPaymentYear 
                      ? `${parseInt(selectedPaymentYear) - 1}年已匹配会费交易记录` 
                      : '所有年份已匹配会费交易记录'
                  }</span>
                  <Badge count={filteredTransactionsPreviousYear.length} />
                  </Space>
                }
                extra={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  📖 仅供参考
                </Text>
                }
                style={{ height: '600px' }}
              >
                <div style={{ height: '520px', overflowY: 'auto' }}>
                <Table
                  columns={readOnlyColumns}
                  dataSource={filteredTransactionsPreviousYear.map(transaction => ({
                    ...transaction,
                    key: transaction.id,
                  }))}
                  loading={loading}
                  pagination={false}
                  scroll={{ x: 800 }}
                  size="small"
                  />
                </div>
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Text type="secondary">
                  📊 共 {filteredTransactionsPreviousYear.length} 笔交易记录
                  </Text>
                </div>
              </Card>
            </Col>

          {/* 右栏：当前年份的会费交易记录 */}
            <Col span={12}>
              <Card 
                title={
                  <Space>
                    <DollarOutlined />
                  <span>{selectedPaymentYear ? `${selectedPaymentYear}年会费交易记录` : '所有年份会费交易记录'}</span>
                    <Badge count={filteredRecords.length} />
                  </Space>
                }
                extra={
                  <Space>
                    <Button size="small" icon={<FileTextOutlined />}>
                      生成报告
                    </Button>
                    <Button size="small" icon={<ExportOutlined />}>
                      导出数据
                    </Button>
                  </Space>
                }
                style={{ height: '600px' }}
              >
                <div style={{ height: '520px', overflowY: 'auto' }}>
                  <Table
                    columns={columns}
                    dataSource={filteredRecords.map(record => ({
                      ...record,
                      key: record.id,
                    }))}
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 1000 }}
                    size="small"
                  />
                </div>
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <Text type="secondary">
                    📊 共 {filteredRecords.length} 笔记录（包含拆分记录）
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>
      </Card>

      {/* 会员匹配模态框 */}
      <Modal
        title={`匹配会员 - ${selectedTransaction?.mainDescription}${selectedSplit ? ' (拆分记录)' : ''}`}
        open={isMemberModalVisible}
        onOk={handleConfirmMatch}
        onCancel={handleCancelMatch}
        width={900}
        destroyOnHidden
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>{selectedSplit ? '拆分记录信息：' : '交易信息：'}</Text>
          <div style={{ marginTop: 8 }}>
            <Text>金额：</Text>
            <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
              {(selectedSplit?.amount || selectedTransaction?.income || 0).toLocaleString()}
            </Text>
          </div>
          <div>
            <Text>付款人/收款人：</Text>
            <Text>{selectedSplit?.payerPayee || selectedTransaction?.payerPayee || '未知'}</Text>
          </div>
          <div>
            <Text>交易日期：</Text>
            <Text>{selectedTransaction?.transactionDate}</Text>
          </div>
          <div>
            <Text>交易用途：</Text>
            <Text>{(selectedSplit?.transactionPurpose || selectedTransaction?.transactionPurpose) ? 
              getPurposePath(selectedSplit?.transactionPurpose || selectedTransaction?.transactionPurpose || '').join(' > ') : '未知'}</Text>
          </div>
          {selectedSplit && (
            <div>
              <Text>拆分描述：</Text>
              <Text>{selectedSplit.description || '无'}</Text>
            </div>
          )}
        </div>

        <Divider />

        <div style={{ marginBottom: 16 }}>
          <Text strong>选择匹配的会员：</Text>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            （可多选）
          </Text>
        </div>

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          <Checkbox.Group
            value={selectedMembers}
            onChange={(values) => setSelectedMembers(values as string[])}
            style={{ width: '100%' }}
          >
            {/* 所有会员 */}
            {members.map(member => (
              <div key={member.id} style={{ marginBottom: 8 }}>
                <Checkbox value={member.id}>
                  <div>
                    <Space>
                      <Text strong>{member.name}</Text>
                      <Tag color="blue">{member.memberId}</Tag>
                    </Space>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                      <PhoneOutlined /> {member.phone} | 
                      <CalendarOutlined /> 加入日期: {member.joinDate}
                    </div>
                  </div>
                </Checkbox>
              </div>
            ))}
          </Checkbox.Group>
        </div>

        {selectedMembers.length > 0 && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', borderRadius: 6 }}>
            <Text strong style={{ color: '#52c41a' }}>
              已选择 {selectedMembers.length} 位会员
            </Text>
            <div style={{ marginTop: 4 }}>
              {selectedMembers.map(memberId => {
                const member = members.find(m => m.id === memberId);
                return member ? (
                  <Tag key={memberId} color="green" style={{ margin: '2px' }}>
                    {member.name}
                  </Tag>
                ) : null;
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MembershipFeeManagement;
