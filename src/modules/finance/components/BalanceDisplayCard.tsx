import React from 'react';
import { Card, Statistic, Row, Col, Tag, Tooltip, Typography } from 'antd';
import { DollarOutlined, BankOutlined, RiseOutlined, WarningOutlined } from '@ant-design/icons';
import { Transaction, BankAccount } from '@/types/finance';
import { balanceCalculationService } from '@/modules/finance/services/financeService';

const { Text } = Typography;

interface BalanceDisplayCardProps {
  transactions: Transaction[];
  bankAccounts: BankAccount[];
  title?: string;
  showDetails?: boolean;
}

const BalanceDisplayCard: React.FC<BalanceDisplayCardProps> = ({
  transactions,
  bankAccounts,
  title = "累计余额汇总",
  showDetails = false
}) => {
  // 生成余额报告
  const balanceReport = balanceCalculationService.generateBalanceReport(transactions, bankAccounts);
  const validationResult = balanceCalculationService.validateCalculationConsistency(transactions, bankAccounts);

  return (
    <Card title={title} size="small">
      <Row gutter={[16, 16]}>
        {/* 总累计余额 */}
        <Col span={8}>
          <Statistic
            title="总累计余额"
            value={balanceReport.summary.totalRunningBalance}
            prefix={<DollarOutlined />}
            precision={2}
            valueStyle={{ 
              color: balanceReport.summary.totalRunningBalance >= 0 ? '#52c41a' : '#ff4d4f',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          />
        </Col>

        {/* 总银行户口开创金额 */}
        <Col span={8}>
          <Statistic
            title="总银行户口开创金额"
            value={balanceReport.summary.totalInitialBalance}
            prefix={<BankOutlined />}
            precision={2}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>

        {/* 总净额 */}
        <Col span={8}>
          <Statistic
            title="总净额"
            value={balanceReport.summary.totalNetAmount}
            prefix={<RiseOutlined />}
            precision={2}
            valueStyle={{ 
              color: balanceReport.summary.totalNetAmount >= 0 ? '#52c41a' : '#ff4d4f',
              fontSize: '16px'
            }}
          />
        </Col>

        {/* 验证状态 */}
        <Col span={24}>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            {validationResult.isValid ? (
              <Tag color="green" icon={<RiseOutlined />}>
                ✅ 计算一致
              </Tag>
            ) : (
              <Tooltip title={validationResult.errors.join('\n')}>
                <Tag color="red" icon={<WarningOutlined />}>
                  ⚠️ 计算不一致 ({validationResult.errors.length} 个错误)
                </Tag>
              </Tooltip>
            )}
          </div>
        </Col>

        {/* 详细统计 */}
        {showDetails && (
          <>
            <Col span={12}>
              <Statistic
                title="交易记录数"
                value={balanceReport.summary.transactionCount}
                precision={0}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="银行户口数"
                value={balanceReport.summary.accountCount}
                precision={0}
                valueStyle={{ fontSize: '14px' }}
              />
            </Col>
          </>
        )}
      </Row>

      {/* 按户口详细显示 */}
      {showDetails && balanceReport.accountDetails.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text strong style={{ fontSize: '14px' }}>按户口详细:</Text>
          <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
            {balanceReport.accountDetails.map((account) => (
              <Col span={24} key={account.accountId}>
                <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Row gutter={[16, 8]}>
                    <Col span={8}>
                      <Text strong>{account.accountName}</Text>
                    </Col>
                    <Col span={4}>
                      <Text type="secondary">初始: </Text>
                      <Text>{account.initialBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}</Text>
                    </Col>
                    <Col span={4}>
                      <Text type="secondary">净额: </Text>
                      <Text style={{ color: account.netAmount >= 0 ? '#52c41a' : '#ff4d4f' }}>
                        {account.netAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                      </Text>
                    </Col>
                    <Col span={4}>
                      <Text type="secondary">余额: </Text>
                      <Text strong style={{ color: account.runningBalance >= 0 ? '#52c41a' : '#ff4d4f' }}>
                        {account.runningBalance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                      </Text>
                    </Col>
                    <Col span={4}>
                      <Text type="secondary">交易: </Text>
                      <Text>{account.transactionCount}</Text>
                    </Col>
                  </Row>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Card>
  );
};

export default BalanceDisplayCard;
