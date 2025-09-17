import React, { useState } from 'react';
import { Card, Button, Space, Typography, message } from 'antd';
// import { UploadOutlined } from '@ant-design/icons';
import ChapterLogoUpload from './ChapterLogoUpload';

const { Title, Text } = Typography;

/**
 * 上传测试组件
 * 用于测试ChapterLogoUpload组件的上传和显示功能
 */
const UploadTest: React.FC = () => {
  const [logoUrl, setLogoUrl] = useState<string>('');

  const handleLogoChange = (url: string | null) => {
    console.log('UploadTest: logoUrl 变化:', url);
    setLogoUrl(url || '');
  };

  const clearLogo = () => {
    setLogoUrl('');
    message.info('已清空Logo');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>上传测试</Title>
      <Text type="secondary">
        测试ChapterLogoUpload组件的上传和显示功能
      </Text>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>当前状态</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Logo URL: </Text>
            <Text code>{logoUrl || '无'}</Text>
          </div>
          <div>
            <Text strong>是否有Logo: </Text>
            <Text>{logoUrl ? '是' : '否'}</Text>
          </div>
          <Button onClick={clearLogo} disabled={!logoUrl}>
            清空Logo
          </Button>
        </Space>
      </Card>

      <Card style={{ marginTop: 24 }}>
        <Title level={4}>Logo上传组件</Title>
        <ChapterLogoUpload
          value={logoUrl}
          onChange={handleLogoChange}
          placeholder="测试上传Logo"
          maxSize={5}
          enableCompression={true}
          targetSize={{ width: 200, height: 200 }}
        />
      </Card>

      {/* 调试信息 */}
      <Card style={{ marginTop: 24 }}>
        <Title level={4}>调试信息</Title>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <pre style={{ margin: 0, fontSize: 12 }}>
            {JSON.stringify({
              logoUrl,
              hasLogo: !!logoUrl,
              timestamp: new Date().toISOString()
            }, null, 2)}
          </pre>
        </div>
      </Card>
    </div>
  );
};

export default UploadTest;
