import React, { useState, useCallback } from 'react';
import {
  Upload,
  Button,
  Image,
  Modal,
  message,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Spin,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { uploadImageToStorage, deleteImageFromStorage, validateImageFile, smartResizeImage } from '@/services/imageUploadService';

const { Text } = Typography;

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string | null) => void;
  maxSize?: number; // MB
  accept?: string;
  disabled?: boolean;
  placeholder?: string;
  storagePath?: string; // Firebase Storage 路径
  enableCompression?: boolean; // 是否启用图片压缩
  targetSize?: { width: number; height: number }; // 目标尺寸
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  maxSize = 5,
  accept = 'image/*',
  disabled = false,
  placeholder = '点击上传图片',
  storagePath = 'chapter-logos',
  enableCompression = true,
  targetSize = { width: 400, height: 400 },
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [uploading, setUploading] = useState(false);

  // 上传图片到 Firebase Storage
  const uploadToCloud = async (file: File): Promise<string> => {
    try {

      // 验证文件
      const validationError = await validateImageFile(file, maxSize);
      if (validationError) {
        console.error('文件验证失败:', validationError);
        throw new Error(validationError);
      }

      // 智能缩放图片（如果启用）
      let fileToUpload = file;
      if (enableCompression) {
        try {
          fileToUpload = await smartResizeImage(file, targetSize, 0.9);
        } catch (resizeError) {
          console.warn('图片缩放失败，使用原文件:', resizeError);
          fileToUpload = file;
        }
      }

      // 上传到 Firebase Storage
      const url = await uploadImageToStorage(fileToUpload, storagePath);
      return url;
    } catch (error) {
      console.error('上传失败，详细错误:', error);
      throw error;
    }
  };

  // 处理文件上传
  const handleUpload = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const url = await uploadToCloud(file);
        onChange?.(url);
        message.success('图片上传成功');
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '图片上传失败';
        message.error(errorMessage);
        console.error('Upload error:', error);
        return false;
      } finally {
        setUploading(false);
      }
    },
    [maxSize, onChange, enableCompression, storagePath, targetSize]
  );

  // 删除图片
  const handleRemove = async () => {
    if (!value) return;
    
    try {
      // 从 Firebase Storage 删除图片
      await deleteImageFromStorage(value);
      onChange?.(null);
      message.success('图片已删除');
    } catch (error) {
      console.error('Delete error:', error);
      // 即使删除失败，也从表单中移除
      onChange?.(null);
      message.warning('图片已从表单中移除，但云端文件可能未删除');
    }
  };

  // 预览图片
  const handlePreview = () => {
    if (value) {
      setPreviewImage(value);
      setPreviewVisible(true);
    }
  };

  // 上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    accept,
    showUploadList: false,
    beforeUpload: (file) => {
      handleUpload(file);
      return false; // 阻止自动上传
    },
    disabled: disabled || uploading,
  };

  return (
    <div>
      <Row gutter={16} align="middle">
        <Col span={12}>
          <Upload {...uploadProps}>
            <Button
              icon={uploading ? <Spin size="small" /> : <UploadOutlined />}
              disabled={disabled || uploading}
              loading={uploading}
            >
              {uploading ? '上传中...' : placeholder}
            </Button>
          </Upload>
           <div style={{ marginTop: 8 }}>
             <Text type="secondary" style={{ fontSize: '12px' }}>
               支持 JPG、PNG、GIF 格式，大小不超过 {maxSize}MB，系统会根据比例自动缩放
             </Text>
           </div>
        </Col>
        
        {value && (
          <Col span={12}>
            <Card
              size="small"
              style={{ textAlign: 'center' }}
              styles={{ body: { padding: 8 } }}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Image
                  src={value}
                  alt="Logo预览"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: 4,
                  }}
                  preview={false}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '0 4px 0 4px',
                  }}
                >
                  <Space size={4}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={handlePreview}
                      style={{ color: 'white', padding: '2px 4px' }}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleRemove}
                      style={{ color: 'white', padding: '2px 4px' }}
                    />
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* 图片预览模态框 */}
      <Modal
        open={previewVisible}
        title="图片预览"
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={600}
      >
        <Image
          src={previewImage}
          alt="Logo预览"
          style={{ width: '100%' }}
        />
      </Modal>
    </div>
  );
};

export default ImageUpload;
