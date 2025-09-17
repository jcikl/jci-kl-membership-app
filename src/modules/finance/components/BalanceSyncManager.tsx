import React, { useState } from 'react';
import { Card, Button, Space, Typography, Row, Col, Statistic, Alert, Progress, message } from 'antd';
import { SyncOutlined, CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { transactionService } from '@/modules/finance/services/financeService';

const { Title, Text } = Typography;

interface BalanceSyncManagerProps {
  onSyncComplete?: () => void;
}

const BalanceSyncManager: React.FC<BalanceSyncManagerProps> = ({
  onSyncComplete
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncResult, setSyncResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleSyncAllBalances = async () => {
    setIsSyncing(true);
    setSyncProgress(0);
    setSyncResult(null);

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const result = await transactionService.syncAllAccountBalances();
      
      clearInterval(progressInterval);
      setSyncProgress(100);
      setSyncResult(result);

      if (result.failed === 0) {
        message.success(`余额同步完成！成功同步 ${result.success} 个银行户口`);
      } else {
        message.warning(`余额同步完成！成功 ${result.success} 个，失败 ${result.failed} 个`);
      }

      // 通知父组件同步完成
      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (error) {
      console.error('余额同步失败:', error);
      message.error('余额同步失败，请重试');
      setSyncResult({
        success: 0,
        failed: 0,
        errors: [`同步失败: ${error}`]
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReset = () => {
    setSyncProgress(0);
    setSyncResult(null);
  };

  return (
    <Card title="银行户口余额同步管理">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 操作按钮 */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Space>
              <Button
                type="primary"
                icon={<SyncOutlined />}
                onClick={handleSyncAllBalances}
                loading={isSyncing}
                disabled={isSyncing}
                size="large"
              >
                {isSyncing ? '同步中...' : '同步所有银行户口余额'}
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                disabled={isSyncing}
              >
                重置
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 进度显示 */}
        {isSyncing && (
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>同步进度</Text>
              <Progress
                percent={Math.round(syncProgress)}
                status={syncProgress >= 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <Text type="secondary">
                {syncProgress < 100 ? '正在同步银行户口余额...' : '同步完成！'}
              </Text>
            </Space>
          </Card>
        )}

        {/* 同步结果 */}
        {syncResult && (
          <Card size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={5}>同步结果</Title>
              
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title="成功"
                    value={syncResult.success}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="失败"
                    value={syncResult.failed}
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="总计"
                    value={syncResult.success + syncResult.failed}
                    prefix={<SyncOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>

              {/* 错误信息 */}
              {syncResult.errors.length > 0 && (
                <Alert
                  message="同步错误"
                  description={
                    <div>
                      {syncResult.errors.map((error, index) => (
                        <div key={index} style={{ marginBottom: 4 }}>
                          • {error}
                        </div>
                      ))}
                    </div>
                  }
                  type="error"
                  showIcon
                />
              )}

              {/* 成功提示 */}
              {syncResult.failed === 0 && syncResult.success > 0 && (
                <Alert
                  message="同步成功"
                  description={`所有 ${syncResult.success} 个银行户口的余额已成功同步！`}
                  type="success"
                  showIcon
                />
              )}
            </Space>
          </Card>
        )}

        {/* 说明信息 */}
        <Card size="small" style={{ backgroundColor: '#f6ffed' }}>
          <Space direction="vertical" size="small">
            <Title level={5} style={{ margin: 0, color: '#52c41a' }}>
              <CheckCircleOutlined /> 功能说明
            </Title>
            <Text type="secondary">
              • <strong>自动同步</strong>: 创建、更新、删除交易记录时会自动更新相关银行户口的余额
            </Text>
            <Text type="secondary">
              • <strong>手动同步</strong>: 使用此工具可以手动同步所有银行户口的余额，确保数据一致性
            </Text>
            <Text type="secondary">
              • <strong>计算逻辑</strong>: 基于银行户口的初始金额和所有交易记录的净额计算累计余额
            </Text>
            <Text type="secondary">
              • <strong>排序规则</strong>: 优先按交易序号排序，无序号时按交易日期排序
            </Text>
          </Space>
        </Card>
      </Space>
    </Card>
  );
};

export default BalanceSyncManager;
