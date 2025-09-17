import React, { useState } from 'react';
import { Card, Button, Space, Typography, message, Divider, Row, Col } from 'antd';
import { UploadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import GlobalImageUploadModal, { UploadServiceType, ImageType } from '@/modules/image/components/GlobalImageUploadModal';
import UploadServiceStatus from '@/modules/image/components/UploadServiceStatus';
import { uploadServiceConfig } from '@/modules/image/services/uploadServiceConfig';

const { Title, Text } = Typography;

/**
 * 上传服务测试组件
 * 用于验证Cloudinary默认配置是否正常工作
 */
const UploadServiceTest: React.FC = () => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

  // 处理上传成功
  const handleUploadSuccess = (url: string) => {
    setUploadedImageUrl(url);
    setUploadModalVisible(false);
    message.success('图片上传成功！');
  };

  // 测试服务可用性
  const testServiceAvailability = () => {
    const cloudinaryAvailable = uploadServiceConfig.isUploadServiceAvailable(UploadServiceType.CLOUDINARY);
    // const firebaseAvailable = uploadServiceConfig.isUploadServiceAvailable(UploadServiceType.FIREBASE);
    
    message.info(
      `Cloudinary: ${cloudinaryAvailable ? '可用' : '不可用'}`
    );
  };

  // 获取当前配置信息
  const getConfigInfo = () => {
    const defaultService = uploadServiceConfig.getDefaultUploadService();
    const recommendedService = uploadServiceConfig.getRecommendedUploadService();
    const cloudinaryConfig = uploadServiceConfig.getCloudinaryConfig();
    
    const info = `
默认服务: ${uploadServiceConfig.getUploadServiceDisplayName(defaultService)}
推荐服务: ${uploadServiceConfig.getUploadServiceDisplayName(recommendedService)}
Cloudinary配置: ${cloudinaryConfig.cloudName ? '已配置' : '未配置'}
    `;
    
    message.info(info);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>上传服务测试</Title>
      <Text type="secondary">
        测试Cloudinary作为默认上传服务的配置和功能
      </Text>

      <div style={{ marginTop: 24 }}>
        <Row gutter={24}>
          {/* 左侧：测试功能 */}
          <Col span={12}>
            <Card title="功能测试" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  onClick={() => setUploadModalVisible(true)}
                  style={{ width: '100%' }}
                >
                  测试图片上传
                </Button>
                
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={testServiceAvailability}
                  style={{ width: '100%' }}
                >
                  检查服务可用性
                </Button>
                
                <Button
                  icon={<ExclamationCircleOutlined />}
                  onClick={getConfigInfo}
                  style={{ width: '100%' }}
                >
                  查看配置信息
                </Button>
              </Space>
            </Card>

            {/* 上传结果 */}
            {uploadedImageUrl && (
              <Card title="上传结果" size="small">
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={uploadedImageUrl}
                    alt="上传的图片"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 200,
                      borderRadius: 8,
                      border: '1px solid #d9d9d9'
                    }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {uploadedImageUrl}
                    </Text>
                  </div>
                </div>
              </Card>
            )}
          </Col>

          {/* 右侧：服务状态 */}
          <Col span={12}>
            <UploadServiceStatus showDetails={true} />
          </Col>
        </Row>
      </div>

      {/* 上传Modal */}
      <GlobalImageUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
        title="测试图片上传"
        imageType={ImageType.GENERAL}
        maxSize={10}
        enableCompression={true}
        placeholder="选择要上传的图片"
      />

      {/* 说明文档 */}
      <Card style={{ marginTop: 24 }}>
        <Title level={4}>配置说明</Title>
        <div>
          <p><strong>默认上传服务:</strong> Cloudinary</p>
          <p><strong>备用服务:</strong> Firebase Storage</p>
          <p><strong>自动回退:</strong> 如果Cloudinary不可用，自动使用Firebase</p>
          <p><strong>图片优化:</strong> 自动压缩、格式转换、CDN加速</p>
        </div>
        
        <Divider />
        
        <Title level={5}>Cloudinary 优势</Title>
        <ul>
          <li>✅ 自动图片优化和质量调整</li>
          <li>✅ 全球CDN加速，提升加载速度</li>
          <li>✅ 自动格式转换（WebP、AVIF等）</li>
          <li>✅ 响应式图片生成</li>
          <li>✅ 智能缓存策略</li>
          <li>✅ 丰富的图片处理API</li>
        </ul>
      </Card>
    </div>
  );
};

export default UploadServiceTest;
