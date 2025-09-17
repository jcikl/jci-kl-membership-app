import React, { useState, useEffect, useMemo } from 'react';
import { Table, Card, Tag, Typography, Row, Col, Statistic, Alert } from 'antd';
import { DollarOutlined, CalendarOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Transaction, TransactionSplit, BankAccount } from '@/types/finance';
import { Member } from '@/types';
import { transactionSplitService, bankAccountService } from '@/modules/finance/services/financeService';
// import { useFiscalYear } from '@/contexts/FiscalYearContext';

const { Text } = Typography;

interface MembershipFeeViewerProps {
  member: Member;
  transactions: Transaction[];
  purposes: any[];
}

const MembershipFeeViewer: React.FC<MembershipFeeViewerProps> = ({
  member,
  transactions,
  purposes
}) => {
  const [transactionSplits, setTransactionSplits] = useState<TransactionSplit[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载拆分记录和银行户口数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [splits, accounts] = await Promise.all([
          transactionSplitService.getAllSplits(),
          bankAccountService.getAccounts()
        ]);
        setTransactionSplits(splits);
        setBankAccounts(accounts);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

  // 创建统一的记录数据结构
  const membershipRecords = useMemo(() => {
    const records: any[] = [];
    
    // 添加主交易记录
    transactions.forEach(transaction => {
      const purpose = purposes.find(p => p.id === transaction.transactionPurpose);
      if (purpose && membershipPurposes.includes(purpose)) {
        // 检查是否与当前会员相关（通过会员费匹配数据）
        const isRelatedToMember = transaction.membershipFeeData?.matchedAccountIds?.includes(member.id);
        
        if (isRelatedToMember) {
          const bankAccount = bankAccounts.find(account => account.id === transaction.bankAccountId);
          records.push({
            id: transaction.id,
            type: 'main',
            bankAccountName: bankAccount?.accountName || '未知户口',
            date: transaction.transactionDate,
            amount: transaction.income - transaction.expense,
            purpose: purpose.name,
            description: transaction.mainDescription,
            status: transaction.status || 'paid',
            payer: transaction.payerPayee,
            payee: transaction.payerPayee,
            transactionId: transaction.id,
            splitId: null
          });
        }
      }
    });

    // 添加拆分记录
    transactionSplits.forEach(split => {
      const transaction = transactions.find(t => t.id === split.transactionId);
      if (transaction) {
        const purpose = purposes.find(p => p.id === transaction.transactionPurpose);
        if (purpose && membershipPurposes.includes(purpose)) {
          // 检查是否与当前会员相关（通过会员费匹配数据）
          const isRelatedToMember = transaction.membershipFeeData?.matchedAccountIds?.includes(member.id);

          if (isRelatedToMember) {
            const bankAccount = bankAccounts.find(account => account.id === transaction.bankAccountId);
            records.push({
              id: `${split.transactionId}-${split.id}`,
              type: 'split',
              bankAccountName: bankAccount?.accountName || '未知户口',
              date: transaction.transactionDate,
              amount: split.amount,
              purpose: purpose.name,
              description: split.description || transaction.mainDescription,
              status: split.status || transaction.status || 'paid',
              payer: split.payerPayee || transaction.payerPayee,
              payee: split.payerPayee || transaction.payerPayee,
              transactionId: split.transactionId,
              splitId: split.id
            });
          }
        }
      }
    });

    // 按日期降序排列
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, transactionSplits, purposes, membershipPurposes, member, bankAccounts]);

  // 计算统计信息
  const statistics = useMemo(() => {
    const totalAmount = membershipRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
    const paidAmount = membershipRecords
      .filter(record => record.status === 'paid')
      .reduce((sum, record) => sum + (record.amount || 0), 0);
    const pendingAmount = membershipRecords
      .filter(record => record.status === 'pending')
      .reduce((sum, record) => sum + (record.amount || 0), 0);

    return {
      totalAmount,
      paidAmount,
      pendingAmount,
      recordCount: membershipRecords.length
    };
  }, [membershipRecords]);

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 90,
      render: (date: string) => (
        <Text style={{ fontSize: '12px' }}>
          {new Date(date).toLocaleDateString('zh-CN')}
        </Text>
      )
    },
    {
      title: '银行户口',
      dataIndex: 'bankAccountName',
      key: 'bankAccountName',
      width: 140,
      render: (bankAccountName: string, record: any) => (
        <Tag color={record.type === 'main' ? 'blue' : 'green'}>
          {bankAccountName}
        </Tag>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (amount: number) => (
        <Text strong style={{ color: amount > 0 ? '#52c41a' : '#ff4d4f' }}>
          {amount.toFixed(2)}
        </Text>
      )
    },
    {
      title: '用途',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 150,
      render: (purpose: string) => (
        <Text style={{ fontSize: '12px' }}>{purpose}</Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const statusConfig = {
          paid: { color: 'green', text: '已付', icon: <CheckCircleOutlined /> },
          pending: { color: 'orange', text: '待付', icon: <ExclamationCircleOutlined /> },
          cancelled: { color: 'red', text: '取消', icon: <ExclamationCircleOutlined /> }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      ellipsis: true,
      render: (description: string) => (
        <Text style={{ fontSize: '12px' }}>{description || '-'}</Text>
      )
    }
  ];

  if (membershipRecords.length === 0) {
    return (
      <Card size="small" title={<><DollarOutlined /> 会费记录</>}>
        <Alert
          message="暂无会费记录"
          description="该会员暂无相关的会费交易记录"
          type="info"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card size="small" title={<><DollarOutlined /> 会费记录</>}>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            title="总记录数"
            value={statistics.recordCount}
            prefix={<CalendarOutlined />}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="总金额"
            value={statistics.totalAmount}
            prefix="RM"
            precision={2}
            valueStyle={{ fontSize: '16px', color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="已付金额"
            value={statistics.paidAmount}
            prefix="RM"
            precision={2}
            valueStyle={{ fontSize: '16px', color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="待付金额"
            value={statistics.pendingAmount}
            prefix="RM"
            precision={2}
            valueStyle={{ fontSize: '16px', color: '#faad14' }}
          />
        </Col>
      </Row>

      {/* 记录表格 */}
      <Table
        dataSource={membershipRecords}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{
          pageSize: 5,
          size: 'small',
          showSizeChanger: false,
          showQuickJumper: false,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        loading={loading}
        scroll={{ x: 770 }}
      />
    </Card>
  );
};

export default MembershipFeeViewer;
