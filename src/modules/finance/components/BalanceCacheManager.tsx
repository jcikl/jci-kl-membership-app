import React, { useState } from 'react';
import { Card, Button, Space, Alert, Progress, Typography, Divider, Row, Col, Statistic } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, ExclamationCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
import { balanceCalculationService } from '../services/financeService';
import { BankAccount } from '@/types/finance';

const { Text } = Typography;

interface BalanceCacheManagerProps {
  bankAccounts: BankAccount[];
  onRefresh?: () => void;
}

export const BalanceCacheManager: React.FC<BalanceCacheManagerProps> = ({ bankAccounts, onRefresh }) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] } | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');

  // 初始化年末余额缓存
  const handleInitializeCache = async () => {
    setIsInitializing(true);
    setProgress(0);
    setStatus('正在初始化年末余额缓存...');

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await balanceCalculationService.initializeYearEndBalanceCache();
      
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('年末余额缓存初始化完成！');
      
      // 刷新数据
      if (onRefresh) {
        onRefresh();
      }
      
      setTimeout(() => {
        setIsInitializing(false);
        setProgress(0);
        setStatus('');
      }, 2000);
      
    } catch (error) {
      setStatus(`初始化失败: ${error}`);
      setIsInitializing(false);
      setProgress(0);
    }
  };

  // 验证年末余额缓存
  const handleValidateCache = async () => {
    setIsValidating(true);
    setStatus('正在验证年末余额缓存...');

    try {
      const result = await balanceCalculationService.validateYearEndBalanceCache();
      setValidationResult(result);
      setStatus(result.isValid ? '验证完成：缓存数据准确' : '验证完成：发现数据不一致');
    } catch (error) {
      setStatus(`验证失败: ${error}`);
    } finally {
      setIsValidating(false);
    }
  };

  // 统计缓存状态
  const getCacheStats = () => {
    const totalAccounts = bankAccounts.length;
    const accountsWithCache = bankAccounts.filter(account => account.yearEndBalances && Object.keys(account.yearEndBalances).length > 0).length;
    const totalCachedYears = bankAccounts.reduce((sum, account) => {
      return sum + (account.yearEndBalances ? Object.keys(account.yearEndBalances).length : 0);
    }, 0);
    
    return {
      totalAccounts,
      accountsWithCache,
      totalCachedYears,
      cacheCoverage: totalAccounts > 0 ? Math.round((accountsWithCache / totalAccounts) * 100) : 0
    };
  };

  const stats = getCacheStats();

  return (
    <Card title="年末余额缓存管理" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        
        {/* 缓存状态统计 */}
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="总户口数"
              value={stats.totalAccounts}
              prefix={<DatabaseOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="已缓存户口"
              value={stats.accountsWithCache}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: stats.accountsWithCache === stats.totalAccounts ? '#52c41a' : '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="缓存覆盖率"
              value={stats.cacheCoverage}
              suffix="%"
              valueStyle={{ color: stats.cacheCoverage === 100 ? '#52c41a' : '#faad14' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="总缓存年份"
              value={stats.totalCachedYears}
              prefix={<ReloadOutlined />}
            />
          </Col>
        </Row>

        <Divider />

        {/* 操作按钮 */}
        <Space>
          <Button
            type="primary"
            icon={<DatabaseOutlined />}
            onClick={handleInitializeCache}
            loading={isInitializing}
            disabled={isValidating}
          >
            初始化年末余额缓存
          </Button>
          
          <Button
            icon={<CheckCircleOutlined />}
            onClick={handleValidateCache}
            loading={isValidating}
            disabled={isInitializing}
          >
            验证缓存准确性
          </Button>
        </Space>

        {/* 进度显示 */}
        {isInitializing && (
          <div>
            <Text>{status}</Text>
            <Progress percent={progress} status="active" />
          </div>
        )}

        {/* 状态显示 */}
        {status && !isInitializing && (
          <Alert
            message={status}
            type={validationResult?.isValid ? 'success' : 'warning'}
            icon={validationResult?.isValid ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
            showIcon
          />
        )}

        {/* 验证结果 */}
        {validationResult && !validationResult.isValid && (
          <Alert
            message="发现数据不一致"
            description={
              <div>
                <Text strong>错误详情：</Text>
                <ul style={{ marginTop: 8, marginBottom: 0 }}>
                  {validationResult.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            }
            type="error"
            icon={<ExclamationCircleOutlined />}
            showIcon
          />
        )}

        {/* 使用说明 */}
        <Alert
          message="年末余额缓存优化说明"
          description={
            <div>
              <p><strong>优化效果：</strong></p>
              <ul>
                <li>✅ 大幅提升累计余额计算速度</li>
                <li>✅ 减少跨年分数据查询开销</li>
                <li>✅ 提高系统响应性能</li>
                <li>✅ 确保数据一致性</li>
              </ul>
              <p><strong>使用建议：</strong></p>
              <ul>
                <li>首次使用请先"初始化年末余额缓存"</li>
                <li>定期使用"验证缓存准确性"确保数据正确</li>
                <li>新增交易记录后会自动更新相关缓存</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
        />
      </Space>
    </Card>
  );
};

export default BalanceCacheManager;
