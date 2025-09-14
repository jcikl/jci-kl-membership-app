import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';

const { Dragger } = Upload;

interface FinanceExcelUploadProps {
  onUpload: (file: File) => Promise<void>;
  accept?: string;
  loading?: boolean;
}

const FinanceExcelUpload: React.FC<FinanceExcelUploadProps> = ({
  onUpload,
  accept = '.xlsx,.xls,.csv',
  loading = false,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      message.error('文件上传失败');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept,
    beforeUpload: (file: File) => {
      handleUpload(file);
      return false; // 阻止自动上传
    },
    showUploadList: false,
  };

  return (
    <Dragger {...uploadProps} disabled={loading || uploading}>
      <p className="ant-upload-drag-icon">
        <FileExcelOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
      </p>
      <p className="ant-upload-text">
        {loading || uploading ? '处理中...' : '点击或拖拽Excel文件到此区域上传'}
      </p>
      <p className="ant-upload-hint">
        支持 .xlsx, .xls, .csv 格式文件
      </p>
    </Dragger>
  );
};

export default FinanceExcelUpload;
