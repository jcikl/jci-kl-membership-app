import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Alert,
  Progress,
  Row,
  Col,
  Statistic,
  Divider,
  List,
  Tag,
} from 'antd';
import {
  SettingOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { transactionPurposeInitService } from '@/services/transactionPurposeInitService';
import { TransactionPurpose } from '@/types/finance';

const { Title, Text, Paragraph } = Typography;

const TransactionPurposeInitPage: React.FC = () => {
  const { user } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [structure, setStructure] = useState<{
    mainCategories: TransactionPurpose[];
    businessCategories: TransactionPurpose[];
    specificPurposes: TransactionPurpose[];
  }>({
    mainCategories: [],
    businessCategories: [],
    specificPurposes: [],
  });

  // 检查初始化状态
  useEffect(() => {
    checkInitializationStatus();
  }, []);

  const checkInitializationStatus = async () => {
    try {
      const initialized = await transactionPurposeInitService.checkInitialized();
      setIsInitialized(initialized);
      
      if (initialized) {
        const structureData = await transactionPurposeInitService.getThreeTierStructure();
        setStructure(structureData);
      }
    } catch (error) {
      console.error('检查初始化状态失败:', error);
    }
  };

  // 初始化3层级体系
  const handleInitialize = async () => {
    if (!user?.uid) {
      return;
    }

    setInitLoading(true);
    setInitProgress(0);

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setInitProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await transactionPurposeInitService.initializeThreeTierPurposes(user.uid);
      
      clearInterval(progressInterval);
      setInitProgress(100);

      if (result.success) {
        setIsInitialized(true);
        await checkInitializationStatus();
      }
    } catch (error) {
      console.error('初始化失败:', error);
    } finally {
      setInitLoading(false);
      setInitProgress(0);
    }
  };

  // 重置3层级体系
  const handleReset = async () => {
    if (!user?.uid) {
      return;
    }

    setResetLoading(true);

    try {
      const result = await transactionPurposeInitService.resetThreeTierPurposes(user.uid);
      
      if (result.success) {
        await checkInitializationStatus();
      }
    } catch (error) {
      console.error('重置失败:', error);
    } finally {
      setResetLoading(false);
    }
  };

  const totalPurposes = structure.mainCategories.length + 
                       structure.businessCategories.length + 
                       structure.specificPurposes.length;

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>
            <SettingOutlined /> 3层级交易用途体系管理
          </Title>
          <Paragraph>
            此页面用于管理财务系统的3层级交易用途体系。该体系包含主要分类、业务分类和具体用途三个层级，
            能够更好地组织和分类财务交易记录。
          </Paragraph>
        </div>

        {/* 状态显示 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="体系状态"
                value={isInitialized ? '已初始化' : '未初始化'}
                prefix={isInitialized ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <ExclamationCircleOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: isInitialized ? '#52c41a' : '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="总用途数"
                value={totalPurposes}
                prefix={<InfoCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="主要分类"
                value={structure.mainCategories.length}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card>
              <Statistic
                title="业务分类"
                value={structure.businessCategories.length}
                suffix="个"
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="具体用途"
                value={structure.specificPurposes.length}
                suffix="个"
              />
            </Card>
          </Col>
        </Row>

        {/* 操作按钮 */}
        <Card style={{ marginBottom: 24 }}>
          <Title level={4}>操作</Title>
          <Space>
            {!isInitialized ? (
              <Button
                type="primary"
                size="large"
                icon={<SettingOutlined />}
                loading={initLoading}
                onClick={handleInitialize}
              >
                初始化3层级体系
              </Button>
            ) : (
              <Button
                type="default"
                size="large"
                icon={<ReloadOutlined />}
                loading={resetLoading}
                onClick={handleReset}
              >
                重置体系
              </Button>
            )}
            <Button
              type="default"
              size="large"
              onClick={checkInitializationStatus}
            >
              刷新状态
            </Button>
          </Space>
        </Card>

        {/* 进度显示 */}
        {initLoading && (
          <Card style={{ marginBottom: 24 }}>
            <Title level={4}>初始化进度</Title>
            <Progress percent={initProgress} />
            <Text type="secondary">正在创建3层级交易用途体系...</Text>
          </Card>
        )}

        {/* 体系结构显示 */}
        {isInitialized && (
          <Card>
            <Title level={4}>3层级体系结构</Title>
            
            <div style={{ marginBottom: 16 }}>
              <Title level={5}>第一层级 - 主要分类</Title>
              <List
                size="small"
                dataSource={structure.mainCategories}
                renderItem={(item) => (
                  <List.Item>
                    <Tag color="blue">{item.name}</Tag>
                    <Text type="secondary">{item.description}</Text>
                  </List.Item>
                )}
              />
            </div>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <Title level={5}>第二层级 - 业务分类</Title>
              <List
                size="small"
                dataSource={structure.businessCategories}
                renderItem={(item) => (
                  <List.Item>
                    <Tag color="orange">{item.name}</Tag>
                    <Text type="secondary">{item.description}</Text>
                  </List.Item>
                )}
              />
            </div>

            <Divider />

            <div>
              <Title level={5}>第三层级 - 具体用途</Title>
              <List
                size="small"
                dataSource={structure.specificPurposes.slice(0, 10)} // 只显示前10个
                renderItem={(item) => (
                  <List.Item>
                    <Tag color="green">{item.name}</Tag>
                    <Text type="secondary">{item.description}</Text>
                  </List.Item>
                )}
              />
              {structure.specificPurposes.length > 10 && (
                <Text type="secondary">
                  还有 {structure.specificPurposes.length - 10} 个具体用途...
                </Text>
              )}
            </div>
          </Card>
        )}

        {/* 说明信息 */}
        <Card style={{ marginTop: 24 }}>
          <Title level={4}>体系说明</Title>
          <Alert
            message="3层级交易用途体系"
            description={
              <div>
                <Paragraph>
                  <strong>第一层级 - 主要分类：</strong> 收入类、支出类、其他账户、银行转账
                </Paragraph>
                <Paragraph>
                  <strong>第二层级 - 业务分类：</strong> 在主要分类下的具体业务类型，如会员费、项目收入、办公支出等
                </Paragraph>
                <Paragraph>
                  <strong>第三层级 - 具体用途：</strong> 最细粒度的用途分类，如2025新会员费、2025项目收入等
                </Paragraph>
              </div>
            }
            type="info"
            showIcon
          />
        </Card>
      </Card>
    </div>
  );
};

export default TransactionPurposeInitPage;
