import React, { useState, useMemo } from 'react';
import { Card, Button, Table, Space, Typography, Alert, Collapse, Row, Col, Statistic } from 'antd';
import { BugOutlined, CalculatorOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Transaction, BankAccount } from '@/types/finance';
import { balanceCalculationService } from '@/modules/finance/services/financeService';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface BalanceDebugToolProps {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
}

const BalanceDebugTool: React.FC<BalanceDebugToolProps> = ({
  transactions,
  bankAccounts
}) => {
  const [showDebug, setShowDebug] = useState<boolean>(false);

  // 调试信息
  const debugInfo = useMemo(() => {
    if (!showDebug) return null;

    // 按银行户口分组
    const transactionsByAccount: { [accountId: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      if (!transactionsByAccount[transaction.bankAccountId]) {
        transactionsByAccount[transaction.bankAccountId] = [];
      }
      transactionsByAccount[transaction.bankAccountId].push(transaction);
    });

    const accountDebugInfo = Object.entries(transactionsByAccount).map(([accountId, accountTransactions]) => {
      const account = bankAccounts.find(acc => acc.id === accountId);
      if (!account) return null;

      // 按交易记录序号排序
      const sortedTransactions = [...accountTransactions].sort((a, b) => {
        if (a.transactionNumber && b.transactionNumber) {
          return a.transactionNumber.localeCompare(b.transactionNumber);
        }
        
        const dateA = typeof a.transactionDate === 'string' 
          ? new Date(a.transactionDate).getTime() 
          : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
        const dateB = typeof b.transactionDate === 'string' 
          ? new Date(b.transactionDate).getTime() 
          : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
        
        return dateA - dateB;
      });

      // 计算该户口的统计信息
      const initialBalance = account.initialAmount || 0;
      const totalIncome = sortedTransactions.reduce((sum, t) => sum + (t.income || 0), 0);
      const totalExpense = sortedTransactions.reduce((sum, t) => sum + (t.expense || 0), 0);
      const totalNetAmount = totalIncome - totalExpense;
      const finalBalance = initialBalance + totalNetAmount;

      // 计算每笔交易的累计余额
      const transactionBalances: any[] = [];
      let runningBalance = initialBalance;
      
      sortedTransactions.forEach((transaction, index) => {
        const netAmount = balanceCalculationService.calculateNetAmount(transaction);
        runningBalance += netAmount;
        
        transactionBalances.push({
          index: index + 1,
          transactionId: transaction.id,
          transactionNumber: transaction.transactionNumber || 'N/A',
          description: transaction.mainDescription || 'N/A',
          income: transaction.income || 0,
          expense: transaction.expense || 0,
          netAmount,
          runningBalance
        });
      });

      return {
        accountId,
        accountName: account.accountName,
        initialBalance,
        totalIncome,
        totalExpense,
        totalNetAmount,
        finalBalance,
        transactionCount: sortedTransactions.length,
        transactionBalances
      };
    }).filter(Boolean);

    // 计算总体统计
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
      transactionCount: transactions.length,
      accountDebugInfo
    };
  }, [transactions, bankAccounts, showDebug]);

  const validationResult = useMemo(() => {
    return balanceCalculationService.validateCalculationConsistency(transactions, bankAccounts);
  }, [transactions, bankAccounts]);

  const transactionColumns = [
    {
      title: '序号',
      dataIndex: 'index',
      key: 'index',
      width: 60,
      align: 'center' as const,
    },
    {
      title: '交易序号',
      dataIndex: 'transactionNumber',
      key: 'transactionNumber',
      width: 120,
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

  return (
    <Card 
      title={
        <Space>
          <BugOutlined />
          <span>累计余额调试工具</span>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<BugOutlined />}
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? '隐藏调试' : '显示调试'}
        </Button>
      }
    >
      {showDebug && (
        <>
          {/* 验证状态 */}
          <Alert
            message={validationResult.isValid ? "计算验证通过" : "计算验证失败"}
            description={
              validationResult.isValid 
                ? "所有户口的累计余额计算都是一致的"
                : `发现 ${validationResult.errors.length} 个错误: ${validationResult.errors.join(', ')}`
            }
            type={validationResult.isValid ? "success" : "error"}
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
          />

          {/* 总体统计 */}
          {debugInfo && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
              <Title level={5}>总体统计</Title>
              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <Statistic
                    title="总银行户口开创金额"
                    value={debugInfo.totalInitialBalance}
                    precision={2}
                    prefix={<CalculatorOutlined />}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="总收入"
                    value={debugInfo.totalIncome}
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="总支出"
                    value={debugInfo.totalExpense}
                    precision={2}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="总最终余额"
                    value={debugInfo.totalFinalBalance}
                    precision={2}
                    valueStyle={{ 
                      color: debugInfo.totalFinalBalance >= 0 ? '#52c41a' : '#ff4d4f',
                      fontWeight: 'bold'
                    }}
                  />
                </Col>
              </Row>
              <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Text strong>户口数量: </Text>
                  <Text>{debugInfo.accountCount}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>交易数量: </Text>
                  <Text>{debugInfo.transactionCount}</Text>
                </Col>
              </Row>
            </Card>
          )}

          {/* 按户口详细调试 */}
          {debugInfo && debugInfo.accountDebugInfo.length > 0 && (
            <Collapse>
              {debugInfo.accountDebugInfo.map((accountInfo: any) => (
                <Panel 
                  header={
                    <Space>
                      <Text strong>{accountInfo?.accountName}</Text>
                      <Text type="secondary">
                        (初始: {accountInfo?.initialBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}, 
                        最终: {accountInfo?.finalBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}, 
                        交易: {accountInfo?.transactionCount})
                      </Text>
                    </Space>
                  } 
                  key={accountInfo?.accountId}
                >
                  <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                      <Statistic
                        title="银行户口开创金额"
                        value={accountInfo?.initialBalance}
                        precision={2}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="总收入"
                        value={accountInfo?.totalIncome}
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="总支出"
                        value={accountInfo?.totalExpense}
                        precision={2}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="最终余额"
                        value={accountInfo?.finalBalance}
                        precision={2}
                        valueStyle={{ 
                          color: (accountInfo?.finalBalance || 0) >= 0 ? '#52c41a' : '#ff4d4f',
                          fontWeight: 'bold'
                        }}
                      />
                    </Col>
                  </Row>
                  
                  <Table
                    columns={transactionColumns}
                    dataSource={accountInfo?.transactionBalances}
                    rowKey="transactionId"
                    pagination={false}
                    size="small"
                    scroll={{ x: 800 }}
                  />
                </Panel>
              ))}
            </Collapse>
          )}
        </>
      )}
    </Card>
  );
};

export default BalanceDebugTool;
