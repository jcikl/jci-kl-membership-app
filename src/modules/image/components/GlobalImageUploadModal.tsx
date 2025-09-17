import React, { useState, useCallback } from 'react';
import { Modal, Button, message, Progress, Typography, Space, Alert } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import CloudinaryUpload from '@/modules/image/components/CloudinaryUpload';
// import { uploadServiceConfig } from '@/modules/image/services/uploadServiceConfig';

const { Title, Text } = Typography;

// 上传服务类型
export enum UploadServiceType {
  CLOUDINARY = 'cloudinary'
}

// 图片类型
export enum ImageType {
  EVENT_POSTER = 'event_poster',
  MEMBER_AVATAR = 'member_avatar',
  DOCUMENT = 'document',
  GENERAL = 'general'
}

// 组件属性接口
interface GlobalImageUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (url: string) => void;
  title?: string;
  imageType?: ImageType;
  uploadService?: UploadServiceType;
  maxSize?: number; // MB
  targetSize?: { width: number; height: number };
  enableCompression?: boolean;
  currentImageUrl?: string;
  placeholder?: string;
  accept?: string;
}

// 上传状态
interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
}

const GlobalImageUploadModal: React.FC<GlobalImageUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
  title = '上传图片',
  uploadService: _uploadService,
  maxSize = 10,
  targetSize = { width: 800, height: 600 },
  enableCompression = true,
  currentImageUrl,
  placeholder = '点击上传图片',
  accept: _accept
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null
  });
  const [previewImage, setPreviewImage] = useState<string | null>(currentImageUrl || null);

  // 重置状态
  const resetState = useCallback(() => {
    setUploadState({
      uploading: false,
      progress: 0,
      error: null
    });
    setPreviewImage(currentImageUrl || null);
  }, [currentImageUrl]);

  // 处理Modal关闭
  const handleClose = () => {
    resetState();
    onClose();
  };

  // 处理上传成功
  const handleUploadSuccess = (url: string) => {
    setPreviewImage(url);
    setUploadState(prev => ({ ...prev, uploading: false, progress: 100 }));
    message.success('图片上传成功');
    onSuccess(url);
  };



  // 处理Cloudinary上传
  const handleCloudinaryUpload = (url: string) => {
    handleUploadSuccess(url);
  };

  // 删除当前图片
  const handleDeleteImage = () => {
    setPreviewImage(null);
    message.success('图片已删除');
  };

  // 重新上传
  const handleReupload = () => {
    setPreviewImage(null);
    resetState();
  };


  return (
    <Modal
      title={title}
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          取消
        </Button>,
        previewImage && (
          <Button key="delete" danger onClick={handleDeleteImage}>
            删除图片
          </Button>
        ),
        previewImage && (
          <Button key="reupload" onClick={handleReupload}>
            重新上传
          </Button>
        ),
        previewImage && (
          <Button key="confirm" type="primary" onClick={handleClose}>
            确认
          </Button>
        )
      ]}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 上传区域 */}
        <div>
          <Title level={5}>选择图片</Title>
          
          <CloudinaryUpload
            onChange={handleCloudinaryUpload}
            value={previewImage || ''}
            placeholder={placeholder}
            maxSize={maxSize}
            enableCompression={enableCompression}
            targetSize={targetSize}
          />

          {/* 上传进度 */}
          {uploadState.uploading && (
            <div style={{ marginTop: 16 }}>
              <Progress percent={uploadState.progress} status="active" />
              <Text type="secondary">正在上传...</Text>
            </div>
          )}

          {/* 错误信息 */}
          {uploadState.error && (
            <Alert
              message="上传失败"
              description={uploadState.error}
              type="error"
              style={{ marginTop: 16 }}
            />
          )}
        </div>

        {/* 图片预览 */}
        {previewImage && (
          <div>
            <Title level={5}>图片预览</Title>
            <div style={{ textAlign: 'center' }}>
              <img
                src={previewImage}
                alt="预览图片"
                style={{
                  maxWidth: '100%',
                  maxHeight: 300,
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Space>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => window.open(previewImage, '_blank')}
                  >
                    查看原图
                  </Button>
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={handleReupload}
                  >
                    重新上传
                  </Button>
                </Space>
              </div>
            </div>
          </div>
        )}

        {/* 图片要求说明 */}
        <Alert
          message="图片要求"
          description={
            <div>
              <p>• 支持格式：JPG、PNG、GIF</p>
              <p>• 文件大小：不超过 {maxSize}MB</p>
              {targetSize && (
                <p>• 建议尺寸：{targetSize.width} × {targetSize.height} 像素</p>
              )}
              {enableCompression && <p>• 系统会自动压缩图片以优化加载速度</p>}
            </div>
          }
          type="info"
          showIcon
        />
      </Space>
    </Modal>
  );
};

export default GlobalImageUploadModal;
