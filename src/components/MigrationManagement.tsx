import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  Alert,
  Steps,
  Modal,
  message,
  Spin,
  Divider
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { awardDataMigration } from '@/scripts/awardDataMigration';
import { dataValidator } from '@/utils/dataValidator';
import { awardIndicatorService } from '@/services/awardIndicatorService';
import { AwardIndicator } from '@/types/awardIndicators';
import { DataIntegrityReport } from '@/utils/dataValidator';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface MigrationManagementProps {
  onMigrationComplete?: () => void;
}

const MigrationManagement: React.FC<MigrationManagementProps> = ({
  onMigrationComplete
}) => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [sourceYear, setSourceYear] = useState<number | null>(null);
  const [targetYear, setTargetYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [validationReport, setValidationReport] = useState<DataIntegrityReport | null>(null);
  const [migratedData, setMigratedData] = useState<AwardIndicator[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

  // 获取可用年份
  const loadAvailableYears = async () => {
    try {
      // 这里应该从现有系统获取有数据的年份
      // 暂时使用模拟数据
      const years = [2022, 2023, 2024];
      setAvailableYears(years);
    } catch (error) {
      console.error('获取可用年份失败:', error);
    }
  };

  useEffect(() => {
    loadAvailableYears();
  }, []);

  // 步骤配置
  const steps = [
    {
      title: '选择年份',
      description: '选择源年份和目标年份',
      icon: <InfoCircleOutlined />
    },
    {
      title: '数据迁移',
      description: '执行数据迁移',
      icon: <PlayCircleOutlined />
    },
    {
      title: '数据验证',
      description: '验证迁移结果',
      icon: <CheckCircleOutlined />
    },
    {
      title: '完成',
      description: '迁移完成',
      icon: <CheckCircleOutlined />
    }
  ];

  // 执行迁移
  const handleMigration = async () => {
    if (!sourceYear) {
      message.error('请选择源年份');
      return;
    }

    try {
      setLoading(true);
      setCurrentStep(1);

      const result = await awardDataMigration.migrateAllData(sourceYear, targetYear);
      setMigrationResult(result);

      if (result.success) {
        message.success(result.message);
        setCurrentStep(2);
        
        // 加载迁移后的数据进行验证
        await loadMigratedData();
      } else {
        message.error('迁移失败');
        setCurrentStep(0);
      }
    } catch (error) {
      message.error('迁移过程中发生错误');
      console.error(error);
      setCurrentStep(0);
    } finally {
      setLoading(false);
    }
  };

  // 加载迁移后的数据
  const loadMigratedData = async () => {
    try {
      const data = await awardIndicatorService.getAllAwardIndicators(targetYear);
      setMigratedData(data);
    } catch (error) {
      console.error('加载迁移数据失败:', error);
    }
  };

  // 执行数据验证
  const handleValidation = async () => {
    try {
      setLoading(true);
      
      const report = await dataValidator.validateDataIntegrity(migratedData);
      setValidationReport(report);
      setShowValidationModal(true);

      if (report.issues.missingData.length === 0 && 
          report.issues.invalidData.length === 0 && 
          report.issues.inconsistentData.length === 0) {
        setCurrentStep(3);
        message.success('数据验证通过');
        onMigrationComplete?.();
      } else {
        message.warning('数据验证发现问题，请检查');
      }
    } catch (error) {
      message.error('数据验证失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 回滚迁移
  const handleRollback = async () => {
    Modal.confirm({
      title: '确认回滚',
      content: '确定要回滚迁移数据吗？此操作不可撤销。',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await awardDataMigration.rollbackMigration(targetYear);
          
          if (result.success) {
            message.success(result.message);
            setCurrentStep(0);
            setMigrationResult(null);
            setValidationReport(null);
            setMigratedData([]);
          } else {
            message.error(result.message);
          }
        } catch (error) {
          message.error('回滚失败');
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // 重新开始
  const handleRestart = () => {
    setCurrentStep(0);
    setMigrationResult(null);
    setValidationReport(null);
    setMigratedData([]);
  };

  // 渲染年份选择步骤
  const renderYearSelection = () => (
    <Card>
      <Title level={4}>选择迁移年份</Title>
      <Paragraph>
        选择要迁移的源年份和目标年份。系统将从源年份复制数据到目标年份。
      </Paragraph>
      
      <Row gutter={24}>
        <Col span={12}>
          <Text strong>源年份（从现有系统）</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="选择源年份"
            value={sourceYear}
            onChange={setSourceYear}
          >
            {availableYears.map(year => (
              <Option key={year} value={year}>{year}</Option>
            ))}
          </Select>
        </Col>
        <Col span={12}>
          <Text strong>目标年份（新系统）</Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            placeholder="选择目标年份"
            value={targetYear}
            onChange={setTargetYear}
          >
            <Option value={2024}>2024</Option>
            <Option value={2025}>2025</Option>
            <Option value={2026}>2026</Option>
          </Select>
        </Col>
      </Row>

      <Divider />

      <Space>
        <Button 
          type="primary" 
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={handleMigration}
          disabled={!sourceYear}
        >
          开始迁移
        </Button>
        <Button 
          size="large"
          onClick={handleRestart}
        >
          重新开始
        </Button>
      </Space>
    </Card>
  );

  // 渲染迁移结果
  const renderMigrationResult = () => (
    <Card>
      <Title level={4}>迁移结果</Title>
      
      {migrationResult && (
        <div>
          <Alert
            type={migrationResult.success ? 'success' : 'error'}
            message={migrationResult.message}
            description={`共迁移 ${migrationResult.migratedCount} 个奖励指标`}
            showIcon
            style={{ marginBottom: 16 }}
          />

          {migrationResult.errors.length > 0 && (
            <Alert
              type="warning"
              message="迁移过程中的错误"
              description={
                <ul>
                  {migrationResult.errors.map((error: string, index: number) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              }
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          <Space>
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={handleValidation}
            >
              验证数据
            </Button>
            <Button 
              danger
              icon={<CloseCircleOutlined />}
              onClick={handleRollback}
            >
              回滚迁移
            </Button>
          </Space>
        </div>
      )}
    </Card>
  );

  // 渲染验证结果
  const renderValidationResult = () => (
    <Card>
      <Title level={4}>数据验证</Title>
      
      {validationReport && (
        <div>
          <Row gutter={24} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                  {validationReport.totalAwardIndicators}
                </div>
                <Text type="secondary">奖励指标</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                  {validationReport.totalIndicators}
                </div>
                <Text type="secondary">总指标</Text>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fa8c16' }}>
                  {validationReport.issues.missingData.length + 
                   validationReport.issues.invalidData.length + 
                   validationReport.issues.inconsistentData.length}
                </div>
                <Text type="secondary">问题数量</Text>
              </div>
            </Col>
          </Row>

          <Space>
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />}
              onClick={() => setShowValidationModal(true)}
            >
              查看详细报告
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleValidation}
            >
              重新验证
            </Button>
          </Space>
        </div>
      )}
    </Card>
  );

  // 渲染完成步骤
  const renderCompletion = () => (
    <Card>
      <Title level={4}>迁移完成</Title>
      
      <Alert
        type="success"
        message="数据迁移成功完成"
        description="所有数据已成功迁移到新系统，可以开始使用新的奖励指标管理系统。"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Space>
        <Button 
          type="primary" 
          onClick={() => window.location.reload()}
        >
          进入新系统
        </Button>
        <Button 
          onClick={handleRestart}
        >
          重新迁移
        </Button>
      </Space>
    </Card>
  );

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        <Title level={2}>数据迁移管理</Title>
        <Paragraph>
          将现有奖励指标管理系统的数据迁移到新的统一系统中。
        </Paragraph>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          items={steps}
          style={{ marginBottom: 24 }}
        />

        <Spin spinning={loading}>
          {currentStep === 0 && renderYearSelection()}
          {currentStep === 1 && renderMigrationResult()}
          {currentStep === 2 && renderValidationResult()}
          {currentStep === 3 && renderCompletion()}
        </Spin>
      </Card>

      {/* 验证详情模态框 */}
      <Modal
        title="数据验证详细报告"
        open={showValidationModal}
        onCancel={() => setShowValidationModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setShowValidationModal(false)}>
            关闭
          </Button>
        ]}
      >
        {validationReport && (
          <div>
            <Row gutter={24} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
                      {validationReport.totalAwardIndicators}
                    </div>
                    <Text type="secondary">奖励指标总数</Text>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>
                      {validationReport.totalIndicators}
                    </div>
                    <Text type="secondary">指标总数</Text>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fa8c16' }}>
                      {validationReport.issues.missingData.length + 
                       validationReport.issues.invalidData.length + 
                       validationReport.issues.inconsistentData.length}
                    </div>
                    <Text type="secondary">问题总数</Text>
                  </div>
                </Card>
              </Col>
            </Row>

            {validationReport.issues.missingData.length > 0 && (
              <Alert
                type="warning"
                message="缺失数据"
                description={
                  <ul>
                    {validationReport.issues.missingData.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                }
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {validationReport.issues.invalidData.length > 0 && (
              <Alert
                type="error"
                message="无效数据"
                description={
                  <ul>
                    {validationReport.issues.invalidData.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                }
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {validationReport.issues.inconsistentData.length > 0 && (
              <Alert
                type="warning"
                message="数据不一致"
                description={
                  <ul>
                    {validationReport.issues.inconsistentData.map((issue: string, index: number) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                }
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {validationReport.recommendations.length > 0 && (
              <Alert
                type="info"
                message="建议"
                description={
                  <ul>
                    {validationReport.recommendations.map((recommendation: string, index: number) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                }
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MigrationManagement;
