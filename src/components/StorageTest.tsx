import React, { useState } from 'react';
import { Button, Card, message, Typography, Space } from 'antd';
import { storage } from '@/services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const { Title, Text } = Typography;

const StorageTest: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<string>('');

  const testStorageConnection = async () => {
    setTesting(true);
    setResult('');
    
    try {
      console.log('开始测试Firebase Storage连接...');
      
      // 检查storage是否可用
      if (!storage) {
        throw new Error('Firebase Storage 未初始化');
      }
      
      console.log('Storage对象:', storage);
      console.log('Storage app:', storage.app);
      
      // 创建一个测试文件
      const testContent = 'Hello Firebase Storage!';
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      
      console.log('测试文件创建:', testFile);
      
      // 创建存储引用
      const testRef = ref(storage, 'test/test-file.txt');
      console.log('存储引用创建:', testRef);
      
      // 上传文件
      console.log('开始上传测试文件...');
      const snapshot = await uploadBytes(testRef, testFile);
      console.log('上传完成:', snapshot);
      
      // 获取下载URL
      console.log('获取下载URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('下载URL:', downloadURL);
      
      setResult(`✅ 测试成功！\n下载URL: ${downloadURL}`);
      message.success('Firebase Storage 连接正常');
      
    } catch (error) {
      console.error('Storage测试失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setResult(`❌ 测试失败: ${errorMessage}`);
      message.error('Firebase Storage 连接失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <Title level={4}>Firebase Storage 连接测试</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Button 
          type="primary" 
          onClick={testStorageConnection}
          loading={testing}
        >
          {testing ? '测试中...' : '测试Storage连接'}
        </Button>
        
        {result && (
          <Card size="small">
            <Text code style={{ whiteSpace: 'pre-line' }}>
              {result}
            </Text>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default StorageTest;
