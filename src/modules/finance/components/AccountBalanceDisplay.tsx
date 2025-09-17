import React, { useState, useMemo } from 'react';
import { Card, Table, Space, Typography, Row, Col, Statistic, Tag, Select, Button } from 'antd';
import { BankOutlined, DollarOutlined, EyeOutlined } from '@ant-design/icons';
import { Transaction, BankAccount } from '@/types/finance';
import { balanceCalculationService } from '@/modules/finance/services/financeService';

const { Text } = Typography;
const { Option } = Select;

interface AccountBalanceDisplayProps {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  title?: string;
}

const AccountBalanceDisplay: React.FC<AccountBalanceDisplayProps> = ({
  transactions,
  bankAccounts,
  title = "银行户口累计余额"
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // 计算每个户口的累计余额信息
  const accountBalances = useMemo(() => {
    return balanceCalculationService.calculateBalancesByAccountSeparately(transactions, bankAccounts);
  }, [transactions, bankAccounts]);

  // 获取选中的户口信息
  const selectedAccountInfo = selectedAccountId ? accountBalances[selectedAccountId] : null;

  // 计算总体统计
  const totalStats = useMemo(() => {
    const totalInitialBalance = bankAccounts.reduce((sum, account) => sum + (account.initialAmount || 0), 0);
    const totalIncome = transactions.reduce((sum, transaction) => sum + (transaction.income || 0), 0);
    const totalExpense = transactions.reduce((sum, transaction) => sum + (transaction.expense || 0), 0);
    const totalNetAmount = totalIncome - totalExpense;
    const totalFinalBalance = totalInitialBalance + totalNetAmount;

    return {
      totalInitialBalance,
      totalIncome,
      totalExpense,
      totalNetAmount,
      totalFinalBalance,
      accountCount: bankAccounts.length,
      transactionCount: transactions.length
    };
  }, [transactions, bankAccounts]);

  // 户口汇总表格列
  const summaryColumns = [
    {
      title: '户口名称',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (text: string) => (
        <Space>
          <BankOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '银行户口开创金额',
      dataIndex: 'initialBalance',
      key: 'initialBalance',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text>{value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</Text>
      ),
    },
    {
      title: '总收入',
      dataIndex: 'totalIncome',
      key: 'totalIncome',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ color: '#52c41a' }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '总支出',
      dataIndex: 'totalExpense',
      key: 'totalExpense',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ color: '#ff4d4f' }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '净额',
      dataIndex: 'netAmount',
      key: 'netAmount',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ 
          color: value >= 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '最终余额',
      dataIndex: 'finalBalance',
      key: 'finalBalance',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ 
          color: value >= 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '交易数',
      dataIndex: 'transactionCount',
      key: 'transactionCount',
      width: 80,
      align: 'center' as const,
      render: (value: number) => (
        <Tag color="blue">{value}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center' as const,
      render: (_: any, record: any) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedAccountId(record.accountId);
            setShowDetails(true);
          }}
        >
          查看详情
        </Button>
      ),
    },
  ];

  // 交易详情表格列
  const detailColumns = [
    {
      title: '交易序号',
      dataIndex: 'transactionNumber',
      key: 'transactionNumber',
      width: 120,
    },
    {
      title: '交易日期',
      dataIndex: 'transactionDate',
      key: 'transactionDate',
      width: 100,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '收入',
      dataIndex: 'income',
      key: 'income',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ color: value > 0 ? '#52c41a' : '#999' }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '支出',
      dataIndex: 'expense',
      key: 'expense',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ color: value > 0 ? '#ff4d4f' : '#999' }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '净额',
      dataIndex: 'netAmount',
      key: 'netAmount',
      width: 100,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ 
          color: value >= 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '累计余额',
      dataIndex: 'runningBalance',
      key: 'runningBalance',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ 
          color: value >= 0 ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold',
          fontSize: '14px'
        }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
  ];

  // 准备汇总数据
  const summaryData = Object.entries(accountBalances).map(([accountId, accountInfo]) => ({
    key: accountId,
    accountId,
    ...accountInfo
  }));

  return (
    <Card title={title}>
      {/* 总体统计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic
            title="总银行户口开创金额"
            value={totalStats.totalInitialBalance}
            prefix={<BankOutlined />}
            precision={2}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="总收入"
            value={totalStats.totalIncome}
            precision={2}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="总支出"
            value={totalStats.totalExpense}
            precision={2}
            valueStyle={{ color: '#ff4d4f' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="总最终余额"
            value={totalStats.totalFinalBalance}
            prefix={<DollarOutlined />}
            precision={2}
            valueStyle={{ 
              color: totalStats.totalFinalBalance >= 0 ? '#52c41a' : '#ff4d4f',
              fontWeight: 'bold'
            }}
          />
        </Col>
      </Row>

      {/* 户口选择器 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Space>
            <Text strong>选择户口查看详情:</Text>
            <Select
              placeholder="选择银行户口"
              style={{ width: 200 }}
              value={selectedAccountId}
              onChange={setSelectedAccountId}
            >
              {bankAccounts.map(account => (
                <Option key={account.id} value={account.id}>
                  {account.accountName}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => setShowDetails(!showDetails)}
              disabled={!selectedAccountId}
            >
              {showDetails ? '隐藏详情' : '显示详情'}
            </Button>
          </Space>
        </Col>
        <Col span={12}>
          <Space>
            <Text type="secondary">户口数量: {totalStats.accountCount}</Text>
            <Text type="secondary">交易数量: {totalStats.transactionCount}</Text>
          </Space>
        </Col>
      </Row>

      {/* 户口汇总表格 */}
      <Table
        columns={summaryColumns}
        dataSource={summaryData}
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
        style={{ marginBottom: 16 }}
      />

      {/* 选中户口的详细信息 */}
      {showDetails && selectedAccountInfo && (
        <Card 
          title={
            <Space>
              <BankOutlined />
              <span>{selectedAccountInfo.accountName} - 交易详情</span>
            </Space>
          }
          size="small"
        >
          {/* 户口统计信息 */}
          <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Statistic
                title="银行户口开创金额"
                value={selectedAccountInfo.initialBalance}
                precision={2}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总收入"
                value={selectedAccountInfo.totalIncome}
                precision={2}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="总支出"
                value={selectedAccountInfo.totalExpense}
                precision={2}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="最终余额"
                value={selectedAccountInfo.finalBalance}
                precision={2}
                valueStyle={{ 
                  color: selectedAccountInfo.finalBalance >= 0 ? '#52c41a' : '#ff4d4f',
                  fontWeight: 'bold'
                }}
              />
            </Col>
          </Row>

          {/* 交易详情表格 */}
          <Table
            columns={detailColumns}
            dataSource={selectedAccountInfo.transactionBalances}
            rowKey="transactionId"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
            }}
            size="small"
            scroll={{ x: 800 }}
          />
        </Card>
      )}
    </Card>
  );
};

export default AccountBalanceDisplay;
