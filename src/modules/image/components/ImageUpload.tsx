import React, { useState } from 'react';
import {
  Button,
  Image,
  Modal,
  message,
  Space,
  Typography,
  Card,
  Row,
  Col,
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import CloudinaryUpload from './CloudinaryUpload';

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
  placeholder = '点击上传图片',
  enableCompression = true,
  targetSize = { width: 400, height: 400 },
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 处理Cloudinary上传成功
  const handleCloudinarySuccess = (url: string) => {
    onChange?.(url);
    message.success('图片上传成功');
  };


  // 删除图片
  const handleRemove = () => {
    onChange?.(null);
    message.success('图片已删除');
  };

  // 预览图片
  const handlePreview = () => {
    if (value) {
      setPreviewImage(value);
      setPreviewVisible(true);
    }
  };

  // 上传配置

  return (
    <div>
      <Row gutter={16} align="middle">
        <Col span={12}>
          <CloudinaryUpload
            value={value || ''}
            onChange={handleCloudinarySuccess}
            placeholder={placeholder}
            maxSize={maxSize}
            enableCompression={enableCompression}
            targetSize={targetSize}
          />
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              支持 JPG、PNG、GIF 格式，大小不超过 {maxSize}MB，系统会自动压缩优化
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
