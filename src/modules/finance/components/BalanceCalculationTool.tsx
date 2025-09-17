import React, { useState, useMemo } from 'react';
import { Card, Button, InputNumber, Table, Space, Typography, Alert, Row, Col } from 'antd';
import { CalculatorOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Transaction, BankAccount } from '@/types/finance';
import { balanceCalculationService } from '@/modules/finance/services/financeService';

const { Text } = Typography;

interface BalanceCalculationToolProps {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
}

interface CalculationStep {
  step: number;
  transactionId: string;
  transactionNumber: string;
  description: string;
  income: number;
  expense: number;
  netAmount: number;
  runningBalance: number;
}

const BalanceCalculationTool: React.FC<BalanceCalculationToolProps> = ({
  transactions,
  bankAccounts
}) => {
  const [initialBalance, setInitialBalance] = useState<number>(0);
  const [showCalculation, setShowCalculation] = useState<boolean>(false);

  // 计算步骤
  const calculationSteps = useMemo(() => {
    if (!showCalculation) return [];

    // 按银行户口分组并排序交易
    const transactionsByAccount: { [accountId: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      if (!transactionsByAccount[transaction.bankAccountId]) {
        transactionsByAccount[transaction.bankAccountId] = [];
      }
      transactionsByAccount[transaction.bankAccountId].push(transaction);
    });

    const steps: CalculationStep[] = [];
    let stepCounter = 1;

    Object.entries(transactionsByAccount).forEach(([accountId, accountTransactions]) => {
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

      const account = bankAccounts.find(acc => acc.id === accountId);
      let runningBalance = (account?.initialAmount || 0) + initialBalance;

      sortedTransactions.forEach(transaction => {
        const netAmount = balanceCalculationService.calculateNetAmount(transaction);
        runningBalance += netAmount;

        steps.push({
          step: stepCounter++,
          transactionId: transaction.id,
          transactionNumber: transaction.transactionNumber || 'N/A',
          description: transaction.mainDescription || 'N/A',
          income: transaction.income || 0,
          expense: transaction.expense || 0,
          netAmount,
          runningBalance
        });
      });
    });

    return steps;
  }, [transactions, bankAccounts, initialBalance, showCalculation]);

  // 计算汇总
  const summary = useMemo(() => {
    if (calculationSteps.length === 0) return null;

    const totalIncome = calculationSteps.reduce((sum, step) => sum + step.income, 0);
    const totalExpense = calculationSteps.reduce((sum, step) => sum + step.expense, 0);
    const totalNetAmount = calculationSteps.reduce((sum, step) => sum + step.netAmount, 0);
    const finalBalance = calculationSteps[calculationSteps.length - 1]?.runningBalance || 0;

    return {
      totalIncome,
      totalExpense,
      totalNetAmount,
      finalBalance,
      transactionCount: calculationSteps.length
    };
  }, [calculationSteps]);

  const columns = [
    {
      title: '步骤',
      dataIndex: 'step',
      key: 'step',
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
          <CalculatorOutlined />
          <span>累计余额计算工具</span>
        </Space>
      }
      extra={
        <Space>
          <Text type="secondary">银行户口开创金额调整:</Text>
          <InputNumber
            value={initialBalance}
            onChange={(value) => setInitialBalance(value || 0)}
            precision={2}
            style={{ width: 120 }}
            placeholder="0.00"
          />
          <Button
            type="primary"
            icon={<CalculatorOutlined />}
            onClick={() => setShowCalculation(!showCalculation)}
          >
            {showCalculation ? '隐藏计算' : '显示计算'}
          </Button>
        </Space>
      }
    >
      {showCalculation && (
        <>
          {/* 计算说明 */}
          <Alert
            message="累计余额计算说明"
            description={
              <div>
                <p><strong>计算公式:</strong> 累计余额 = 银行户口开创金额 + Σ(每笔交易的净额)</p>
                <p><strong>净额计算:</strong> 净额 = 收入金额 - 支出金额</p>
                <p><strong>排序规则:</strong> 优先按交易序号排序，无序号时按日期排序</p>
              </div>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            style={{ marginBottom: 16 }}
          />

          {/* 汇总信息 */}
          {summary && (
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6ffed' }}>
              <Row gutter={[16, 8]}>
                <Col span={6}>
                  <Text strong>总交易数: </Text>
                  <Text>{summary.transactionCount}</Text>
                </Col>
                <Col span={6}>
                  <Text strong>总收入: </Text>
                  <Text style={{ color: '#52c41a' }}>
                    {summary.totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </Text>
                </Col>
                <Col span={6}>
                  <Text strong>总支出: </Text>
                  <Text style={{ color: '#ff4d4f' }}>
                    {summary.totalExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </Text>
                </Col>
                <Col span={6}>
                  <Text strong>最终余额: </Text>
                  <Text strong style={{ 
                    color: summary.finalBalance >= 0 ? '#52c41a' : '#ff4d4f',
                    fontSize: '16px'
                  }}>
                    {summary.finalBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </Text>
                </Col>
              </Row>
            </Card>
          )}

          {/* 计算步骤表格 */}
          <Table
            columns={columns}
            dataSource={calculationSteps}
            rowKey="step"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `显示 ${range[0]}-${range[1]} 条，共 ${total} 条记录`
            }}
            scroll={{ x: 800 }}
            size="small"
          />
        </>
      )}
    </Card>
  );
};

export default BalanceCalculationTool;
