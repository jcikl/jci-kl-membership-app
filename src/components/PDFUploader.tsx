import React, { useState, useCallback } from 'react';
import { Upload, Button, Progress, Alert, Space, Typography, Card, message } from 'antd';
import { FilePdfOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;
const { Text } = Typography;

interface PDFUploaderProps {
  onFileUpload: (file: File) => void;
  onFileRemove: () => void;
  uploadedFile: File | null;
  isProcessing: boolean;
  maxSize?: number; // MB
  allowedTypes?: string[];
}

const PDFUploader: React.FC<PDFUploaderProps> = ({
  onFileUpload,
  onFileRemove,
  uploadedFile,
  isProcessing,
  maxSize = 10,
  allowedTypes = ['application/pdf']
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleUpload = useCallback((file: File) => {
    console.log('📁 文件上传:', file.name, file.size);
    
    // 验证文件类型
    if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      message.error('请上传PDF格式的文件');
      return false;
    }

    // 验证文件大小
    if (file.size > maxSize * 1024 * 1024) {
      message.error(`文件大小不能超过 ${maxSize}MB`);
      return false;
    }

    // 直接调用上传处理函数，避免重复调用
    onFileUpload(file);

    return false; // 阻止默认上传行为
  }, [onFileUpload, maxSize, allowedTypes]);

  const handleRemove = useCallback(() => {
    setUploadProgress(0);
    onFileRemove();
  }, [onFileRemove]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf,application/pdf',
    beforeUpload: handleUpload,
    showUploadList: false,
    disabled: isProcessing
  };

  return (
    <Card title="📄 PDF文件上传" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* 文件上传区域 */}
        <Dragger {...uploadProps} style={{ 
          backgroundColor: uploadedFile ? '#f6ffed' : '#fafafa',
          borderColor: uploadedFile ? '#52c41a' : '#d9d9d9'
        }}>
          <p className="ant-upload-drag-icon">
            <FilePdfOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">
            {uploadedFile ? '文件已上传，点击或拖拽更换文件' : '点击或拖拽PDF文件到此区域上传'}
          </p>
          <p className="ant-upload-hint">
            支持单个PDF文件，文件大小不超过 {maxSize}MB
          </p>
        </Dragger>

        {/* 上传进度 */}
        {isProcessing && uploadProgress > 0 && uploadProgress < 100 && (
          <div>
            <Text>文件上传中...</Text>
            <Progress percent={uploadProgress} status="active" />
          </div>
        )}

        {/* 已上传文件信息 */}
        {uploadedFile && (
          <Card 
            size="small" 
            style={{ 
              backgroundColor: '#f6ffed',
              border: '1px solid #52c41a'
            }}
          >
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <FilePdfOutlined style={{ color: '#52c41a' }} />
                <div>
                  <Text strong style={{ color: '#52c41a' }}>
                    {uploadedFile.name}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {formatFileSize(uploadedFile.size)} | 已上传
                  </Text>
                </div>
              </Space>
              
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleRemove}
                disabled={isProcessing}
                size="small"
              >
                移除
              </Button>
            </Space>
          </Card>
        )}

        {/* 使用说明 */}
        <Alert
          message="使用说明"
          description={
            <div>
              <Text>
                • 请上传包含JCI奖励指标信息的PDF文件<br />
                • 系统将自动解读PDF内容并生成标准表单数据<br />
                • 支持的文件格式：PDF<br />
                • 最大文件大小：{maxSize}MB
              </Text>
            </div>
          }
          type="info"
          showIcon
          style={{ textAlign: 'left' }}
        />

        {/* 处理状态提示 */}
        {isProcessing && (
          <Alert
            message="正在处理文件..."
            description="系统正在解析PDF内容并通过AI解读，请稍候..."
            type="warning"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default PDFUploader;
