import React, { useState, useMemo } from 'react';
import { Card, Table, Space, Typography, Row, Col, Button, Alert, Collapse, Tag } from 'antd';
import { BankOutlined } from '@ant-design/icons';
import { Transaction, BankAccount } from '@/types/finance';
import { balanceCalculationService } from '@/modules/finance/services/financeService';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Panel } = Collapse;

interface BalanceInconsistencyDebuggerProps {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  filteredTransactions: Transaction[];
  yearFilter?: number;
}

const BalanceInconsistencyDebugger: React.FC<BalanceInconsistencyDebuggerProps> = ({
  transactions,
  bankAccounts,
  filteredTransactions,
  yearFilter
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // 计算余额报告
  const balanceReport = useMemo(() => {
    if (yearFilter) {
      return balanceCalculationService.generateOptimizedCrossYearBalanceReport(
        filteredTransactions, 
        transactions, 
        bankAccounts, 
        yearFilter
      );
    }
    
    return balanceCalculationService.generateCrossYearBalanceReport(
      filteredTransactions, 
      transactions, 
      bankAccounts, 
      yearFilter
    );
  }, [filteredTransactions, transactions, bankAccounts, yearFilter]);

  // 分析不一致性
  const inconsistencyAnalysis = useMemo(() => {
    const analysis = bankAccounts.map(account => {
      const calculatedBalance = balanceReport.accountDetails.find(acc => acc.accountId === account.id)?.runningBalance || 0;
      const storedBalance = account.currentBalance;
      const difference = Math.abs(calculatedBalance - storedBalance);
      const isInconsistent = difference > 0.01;

      // 获取该户口的交易详情
      const accountTransactions = filteredTransactions.filter(t => t.bankAccountId === account.id);
      const sortedTransactions = [...accountTransactions].sort((a, b) => {
        if (a.transactionNumber && b.transactionNumber) {
          return a.transactionNumber.localeCompare(b.transactionNumber);
        }
        
        const parseDate = (dateStr: string) => {
          let date = dayjs(dateStr, 'DD-MMM-YYYY');
          if (!date.isValid()) {
            date = dayjs(dateStr, 'YYYY-MM-DD');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr, 'DD/MM/YYYY');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr, 'MM/DD/YYYY');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr);
          }
          return date.isValid() ? date.toDate().getTime() : 0;
        };
        
        const dateA = typeof a.transactionDate === 'string' 
          ? parseDate(a.transactionDate)
          : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
        const dateB = typeof b.transactionDate === 'string' 
          ? parseDate(b.transactionDate)
          : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
        
        return dateA - dateB;
      });

      // 计算年初余额
      let yearStartBalance = 0;
      if (yearFilter) {
        yearStartBalance = balanceCalculationService.getYearStartBalance(account, yearFilter, transactions);
      } else {
        yearStartBalance = account.initialAmount || 0;
      }

      // 计算累计余额
      let runningBalance = yearStartBalance;
      const transactionBalances = sortedTransactions.map(transaction => {
        const netAmount = balanceCalculationService.calculateNetAmount(transaction);
        runningBalance += netAmount;
        return {
          transactionId: transaction.id,
          transactionNumber: transaction.transactionNumber || 'N/A',
          transactionDate: transaction.transactionDate,
          description: transaction.mainDescription || 'N/A',
          income: transaction.income || 0,
          expense: transaction.expense || 0,
          netAmount,
          runningBalance
        };
      });

      return {
        accountId: account.id,
        accountName: account.accountName,
        initialAmount: account.initialAmount || 0,
        currentBalance: storedBalance,
        calculatedBalance,
        yearStartBalance,
        difference,
        isInconsistent,
        transactionCount: accountTransactions.length,
        transactionBalances,
        yearEndBalances: account.yearEndBalances || {}
      };
    });

    return analysis;
  }, [bankAccounts, balanceReport, filteredTransactions, transactions, yearFilter]);

  // 获取选中的户口详情
  const selectedAccount = selectedAccountId ? inconsistencyAnalysis.find(acc => acc.accountId === selectedAccountId) : null;

  // 统计信息
  const stats = useMemo(() => {
    const totalAccounts = bankAccounts.length;
    const inconsistentAccounts = inconsistencyAnalysis.filter(acc => acc.isInconsistent).length;
    const totalDifference = inconsistencyAnalysis.reduce((sum, acc) => sum + acc.difference, 0);
    const maxDifference = Math.max(...inconsistencyAnalysis.map(acc => acc.difference));

    return {
      totalAccounts,
      inconsistentAccounts,
      consistentAccounts: totalAccounts - inconsistentAccounts,
      totalDifference,
      maxDifference,
      inconsistencyRate: totalAccounts > 0 ? (inconsistentAccounts / totalAccounts) * 100 : 0
    };
  }, [bankAccounts.length, inconsistencyAnalysis]);

  // 汇总表格列
  const summaryColumns = [
    {
      title: '户口名称',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (text: string, record: any) => (
        <Space>
          <BankOutlined />
          <Text strong={record.isInconsistent}>{text}</Text>
          {record.isInconsistent && <Tag color="red">不一致</Tag>}
        </Space>
      ),
    },
    {
      title: '初始金额',
      dataIndex: 'initialAmount',
      key: 'initialAmount',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text>{value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</Text>
      ),
    },
    {
      title: '年初余额',
      dataIndex: 'yearStartBalance',
      key: 'yearStartBalance',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ color: '#1890ff' }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '存储余额',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ color: '#722ed1' }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '计算余额',
      dataIndex: 'calculatedBalance',
      key: 'calculatedBalance',
      width: 120,
      align: 'right' as const,
      render: (value: number) => (
        <Text style={{ color: '#13c2c2' }}>
          {value.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '差异',
      dataIndex: 'difference',
      key: 'difference',
      width: 100,
      align: 'right' as const,
      render: (value: number, record: any) => (
        <Text style={{ 
          color: record.isInconsistent ? '#ff4d4f' : '#52c41a',
          fontWeight: 'bold'
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
          onClick={() => setSelectedAccountId(record.accountId)}
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

  return (
    <Card title="银行户口余额不一致性分析">
      {/* 统计信息 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Typography.Text type="secondary">总户口数</Typography.Text>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
              {stats.totalAccounts}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Typography.Text type="secondary">不一致户口</Typography.Text>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff4d4f' }}>
              {stats.inconsistentAccounts}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Typography.Text type="secondary">一致户口</Typography.Text>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
              {stats.consistentAccounts}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Typography.Text type="secondary">不一致率</Typography.Text>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
              {stats.inconsistencyRate.toFixed(1)}%
            </div>
          </Card>
        </Col>
      </Row>

      {/* 警告信息 */}
      {stats.inconsistentAccounts > 0 && (
        <Alert
          message="发现余额不一致"
          description={`有 ${stats.inconsistentAccounts} 个银行户口的存储余额与计算余额不一致，总差异为 ${stats.totalDifference.toFixed(2)}，最大差异为 ${stats.maxDifference.toFixed(2)}`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 汇总表格 */}
      <Table
        columns={summaryColumns}
        dataSource={inconsistencyAnalysis}
        rowKey="accountId"
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
        style={{ marginBottom: 16 }}
      />

      {/* 选中户口的详细信息 */}
      {selectedAccount && (
        <Collapse>
          <Panel 
            header={
              <Space>
                <BankOutlined />
                <span>{selectedAccount.accountName} - 详细分析</span>
                {selectedAccount.isInconsistent && <Tag color="red">不一致</Tag>}
              </Space>
            } 
            key="1"
          >
            {/* 户口基本信息 */}
            <Row gutter={[16, 8]} style={{ marginBottom: 16 }}>
              <Col span={6}>
                <Card size="small">
                  <Typography.Text type="secondary">初始金额</Typography.Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {selectedAccount.initialAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Typography.Text type="secondary">年初余额</Typography.Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                    {selectedAccount.yearStartBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Typography.Text type="secondary">存储余额</Typography.Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
                    {selectedAccount.currentBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </div>
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Typography.Text type="secondary">计算余额</Typography.Text>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#13c2c2' }}>
                    {selectedAccount.calculatedBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 年末余额缓存信息 */}
            {Object.keys(selectedAccount.yearEndBalances).length > 0 && (
              <Card size="small" style={{ marginBottom: 16 }}>
                <Typography.Text strong>年末余额缓存:</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  {Object.entries(selectedAccount.yearEndBalances).map(([year, balance]) => (
                    <Tag key={year} color="blue">
                      {year}年: {balance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </Tag>
                  ))}
                </div>
              </Card>
            )}

            {/* 交易详情表格 */}
            <Table
              columns={detailColumns}
              dataSource={selectedAccount.transactionBalances}
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
          </Panel>
        </Collapse>
      )}
    </Card>
  );
};

export default BalanceInconsistencyDebugger;
