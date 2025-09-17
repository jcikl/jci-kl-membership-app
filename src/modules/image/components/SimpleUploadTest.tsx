import React, { useState } from 'react';
import { Card, Button, Space, Typography, message, Image } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import GlobalImageUploadModal, { ImageType } from './GlobalImageUploadModal';

const { Title, Text } = Typography;

/**
 * 简单上传测试组件
 * 直接测试GlobalImageUploadModal组件
 */
const SimpleUploadTest: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');

  const handleUploadSuccess = (url: string) => {
    console.log('SimpleUploadTest: 上传成功，URL:', url);
    setUploadedImageUrl(url);
    setModalVisible(false);
    message.success('图片上传成功！');
  };

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>简单上传测试</Title>
      <Text type="secondary">
        直接测试GlobalImageUploadModal组件的上传功能
      </Text>

      <Card style={{ marginTop: 24 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={openModal}
            style={{ width: '100%' }}
          >
            上传图片
          </Button>

          {uploadedImageUrl && (
            <div style={{ textAlign: 'center' }}>
              <Title level={4}>上传结果</Title>
              <Image
                src={uploadedImageUrl}
                alt="上传的图片"
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
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
          )}
        </Space>
      </Card>

      {/* 调试信息 */}
      <Card style={{ marginTop: 24 }}>
        <Title level={4}>调试信息</Title>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <pre style={{ margin: 0, fontSize: 12 }}>
            {JSON.stringify({
              modalVisible,
              uploadedImageUrl,
              hasImage: !!uploadedImageUrl,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </div>
      </Card>

      {/* 上传Modal */}
      <GlobalImageUploadModal
        visible={modalVisible}
        onClose={closeModal}
        onSuccess={handleUploadSuccess}
        title="测试图片上传"
        imageType={ImageType.GENERAL}
        maxSize={10}
        enableCompression={true}
        placeholder="选择要上传的图片"
      />
    </div>
  );
};

export default SimpleUploadTest;
