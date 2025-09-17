import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag, Button, Alert, Tooltip } from 'antd';
import { CheckCircleOutlined, ExclamationCircleOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { uploadServiceConfig } from '@/modules/image/services/uploadServiceConfig';
import { UploadServiceType } from '@/modules/image/components/GlobalImageUploadModal';

const { Title, Text } = Typography;

interface UploadServiceStatusProps {
  showDetails?: boolean;
  onRefresh?: () => void;
}

const UploadServiceStatus: React.FC<UploadServiceStatusProps> = ({
  showDetails = false,
  onRefresh: _onRefresh
}) => {
  const [config, setConfig] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 加载配置和验证状态
  const loadStatus = async () => {
    setLoading(true);
    try {
      const uploadConfig = uploadServiceConfig.getUploadConfig();
      const validationResult = uploadServiceConfig.validateUploadConfig();
      
      setConfig(uploadConfig);
      setValidation(validationResult);
    } catch (error) {
      console.error('加载上传服务状态失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // 获取服务状态图标
  const getServiceStatusIcon = (service: UploadServiceType) => {
    const isAvailable = uploadServiceConfig.isUploadServiceAvailable(service);
    return isAvailable ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : (
      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    );
  };

  // 获取服务状态颜色
  const getServiceStatusColor = (service: UploadServiceType) => {
    const isAvailable = uploadServiceConfig.isUploadServiceAvailable(service);
    return isAvailable ? 'success' : 'error';
  };

  if (!config || !validation) {
    return (
      <Card loading>
        <Text>加载上传服务状态中...</Text>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <SettingOutlined />
          上传服务状态
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={loadStatus}
            loading={loading}
          >
            刷新
          </Button>
        </Space>
      }
      size="small"
    >
      {/* 默认服务状态 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Text strong>默认服务:</Text>
          <Tag
            color={getServiceStatusColor(uploadServiceConfig.getDefaultUploadService())}
            icon={getServiceStatusIcon(uploadServiceConfig.getDefaultUploadService())}
          >
            {uploadServiceConfig.getUploadServiceDisplayName(uploadServiceConfig.getDefaultUploadService())}
          </Tag>
        </Space>
      </div>

      {/* 验证状态 */}
      {!validation.isValid && (
        <Alert
          message="配置错误"
          description={
            <div>
              {validation.errors.map((error: string, index: number) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {validation.warnings.length > 0 && (
        <Alert
          message="配置警告"
          description={
            <div>
              {validation.warnings.map((warning: string, index: number) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 详细配置信息 */}
      {showDetails && (
        <div>
          <Title level={5}>服务状态</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            {uploadServiceConfig.getAvailableUploadServices().map((service) => (
              <div key={service.value} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>
                  {uploadServiceConfig.getUploadServiceIcon(service.value)}
                </span>
                <Text>{service.label}</Text>
                <Tag
                  color={service.available ? 'success' : 'error'}
                  icon={service.available ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
                >
                  {service.available ? '可用' : '不可用'}
                </Tag>
                <Tooltip title={service.description}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {service.description}
                  </Text>
                </Tooltip>
              </div>
            ))}
          </Space>

          <div style={{ marginTop: 16 }}>
            <Title level={5}>配置信息</Title>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>最大文件大小:</Text>
                <Text style={{ marginLeft: 8 }}>
                  {(config.maxFileSize / (1024 * 1024)).toFixed(1)} MB
                </Text>
              </div>
              <div>
                <Text strong>支持的文件类型:</Text>
                <Text style={{ marginLeft: 8 }}>
                  {config.allowedTypes.length} 种类型
                </Text>
              </div>
              <div>
                <Text strong>压缩设置:</Text>
                <Text style={{ marginLeft: 8 }}>
                  {config.compression.enabled ? '启用' : '禁用'}
                  {config.compression.enabled && ` (质量: ${config.compression.quality})`}
                </Text>
              </div>
            </Space>
          </div>
        </div>
      )}

      {/* 推荐服务 */}
      <div style={{ marginTop: 16, padding: 12, background: '#f6ffed', borderRadius: 6 }}>
        <Space>
          <Text strong>推荐服务:</Text>
          <Tag color="blue">
            {uploadServiceConfig.getUploadServiceDisplayName(uploadServiceConfig.getRecommendedUploadService())}
          </Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {uploadServiceConfig.getUploadServiceDescription(uploadServiceConfig.getRecommendedUploadService())}
          </Text>
        </Space>
      </div>
    </Card>
  );
};

export default UploadServiceStatus;
