import React, { useState, useCallback } from 'react';
import {
  Button,
  Image,
  Space,
  Card,
  Row,
  Col,
  message,
  Modal,
  List,
  Avatar,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import GlobalImageUploadModal, { ImageType } from '@/modules/image/components/GlobalImageUploadModal';
import { useImageUpload } from '@/hooks/useImageUpload';
import { imageManagementService, ImageInfo } from '@/modules/image/services/imageManagementService';
import { uploadServiceConfig } from '@/modules/image/services/uploadServiceConfig';

// const { Text } = Typography;

interface ChapterLogoUploadProps {
  value?: string;
  onChange?: (url: string | null) => void;
  maxSize?: number; // MB
  disabled?: boolean;
  placeholder?: string;
  enableCompression?: boolean;
  targetSize?: { width: number; height: number };
}

const ChapterLogoUpload: React.FC<ChapterLogoUploadProps> = ({
  value,
  onChange,
  maxSize = 5,
  disabled = false,
  placeholder = '点击上传分会Logo',
  enableCompression = true,
  targetSize = { width: 200, height: 200 },
}) => {
  // 使用图片上传Hook
  const imageUpload = useImageUpload({
    initialImageUrl: value || '',
    onImageChange: (url: string) => {
      console.log('ChapterLogoUpload: onImageChange 被调用，URL:', url);
      onChange?.(url);
    },
    onImageDelete: () => {
      console.log('ChapterLogoUpload: onImageDelete 被调用');
      onChange?.(null);
    },
    uploadService: uploadServiceConfig.getDefaultUploadService(),
    imageType: ImageType.GENERAL,
    maxSize,
    targetSize,
    enableCompression,
    placeholder,
    accept: 'image/*'
  });

  // 调试：监听value变化
  React.useEffect(() => {
    console.log('ChapterLogoUpload: value prop 变化:', value);
    console.log('ChapterLogoUpload: imageUpload.currentImageUrl:', imageUpload.currentImageUrl);
  }, [value, imageUpload.currentImageUrl]);

  // 处理上传成功，保存到图片管理系统
  const handleUploadSuccess = useCallback(async (url: string) => {
    console.log('ChapterLogoUpload: 上传成功，URL:', url);
    console.log('ChapterLogoUpload: 当前图片URL:', imageUpload.currentImageUrl);
    
    // 先更新UI状态
    imageUpload.handleUploadSuccess(url);
    
    console.log('ChapterLogoUpload: 调用handleUploadSuccess后，当前图片URL:', imageUpload.currentImageUrl);
    
    // 然后异步保存到图片管理系统
    try {
      // 保存图片信息到图片管理系统
      const imageData = {
        url,
        fileName: `chapter_logo_${Date.now()}`,
        fileSize: 0, // 需要从上传结果获取
        mimeType: 'image/jpeg',
        imageType: ImageType.GENERAL,
        uploadSource: 'chapter_logo',
        uploadSourceName: '分会Logo',
        tags: ['logo', 'chapter'],
        description: '分会Logo图片',
        isPublic: true,
        uploadedBy: 'current_user_id', // 需要从认证状态获取
        uploadedByName: '当前用户' // 需要从认证状态获取
      };

      await imageManagementService.uploadImageInfo(imageData);
      message.success('分会Logo已保存到图片管理系统');
    } catch (error) {
      console.error('保存图片信息失败:', error);
      message.warning('图片上传成功，但保存到图片管理系统失败');
    }
  }, [imageUpload]);

  // 状态管理
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [availableImages, setAvailableImages] = useState<ImageInfo[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // 加载可用的logo图片
  const loadAvailableImages = useCallback(async () => {
    setLoadingImages(true);
    try {
      const images = await imageManagementService.getAllImages({
        source: 'chapter_logo',
        limit: 20,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      });
      setAvailableImages(images);
    } catch (error) {
      console.error('加载图片失败:', error);
      message.error('加载图片失败');
    } finally {
      setLoadingImages(false);
    }
  }, []);

  // 打开图片选择器
  const openImageSelector = useCallback(() => {
    setShowImageSelector(true);
    loadAvailableImages();
  }, [loadAvailableImages]);

  // 选择图片
  const selectImage = useCallback((image: ImageInfo) => {
    onChange?.(image.url);
    imageUpload.setImageUrl(image.url);
    setShowImageSelector(false);
    message.success('已选择分会Logo');
  }, [onChange, imageUpload]);

  return (
    <div>
      <Row gutter={16} align="middle">
        <Col span={12}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={imageUpload.openUploadModal}
                disabled={disabled}
                style={{ flex: 1 }}
              >
                上传新Logo
              </Button>
              <Button
                icon={<FolderOutlined />}
                onClick={openImageSelector}
                disabled={disabled}
                style={{ flex: 1 }}
              >
                选择已有Logo
              </Button>
            </Space>
            
            <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
              支持 JPG、PNG、GIF 格式，大小不超过 {maxSize}MB
              {enableCompression && '，系统会自动压缩优化'}
            </div>
          </Space>
        </Col>
        
        {imageUpload.currentImageUrl && (
          <Col span={12}>
            <Card
              size="small"
              style={{ textAlign: 'center' }}
              styles={{ body: { padding: 8 } }}
            >
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Image
                  src={imageUpload.currentImageUrl}
                  alt="分会Logo预览"
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: 'contain',
                    borderRadius: 8,
                    border: '2px solid #f0f0f0',
                    background: '#fafafa'
                  }}
                  preview={{
                    mask: <EyeOutlined style={{ fontSize: 16 }} />
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '0 8px 0 8px',
                  }}
                >
                  <Space size={4}>
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        // 触发图片预览
                        const img = new window.Image();
                        img.src = imageUpload.currentImageUrl;
                        img.onload = () => {
                          // 这里可以打开一个更大的预览Modal
                          message.info('点击图片可查看大图');
                        };
                      }}
                      style={{ color: 'white', padding: '2px 4px' }}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={imageUpload.handleDeleteImage}
                      style={{ color: 'white', padding: '2px 4px' }}
                    />
                  </Space>
                </div>
              </div>
              
              <div style={{ marginTop: 8, fontSize: 11, color: '#666' }}>
                分会Logo
              </div>
            </Card>
          </Col>
        )}
      </Row>

      {/* 全局图片上传Modal */}
      <GlobalImageUploadModal
        visible={imageUpload.isModalVisible}
        onClose={imageUpload.closeUploadModal}
        onSuccess={handleUploadSuccess}
        title="上传分会Logo"
        imageType={ImageType.GENERAL}
        uploadService={uploadServiceConfig.getDefaultUploadService()}
        maxSize={maxSize}
        targetSize={targetSize}
        enableCompression={enableCompression}
        currentImageUrl={imageUpload.currentImageUrl}
        placeholder={placeholder}
        accept="image/*"
      />

      {/* 图片选择器Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <FolderOutlined style={{ marginRight: 8 }} />
            选择分会Logo
          </div>
        }
        open={showImageSelector}
        onCancel={() => setShowImageSelector(false)}
        width={600}
        footer={null}
      >
        <List
          loading={loadingImages}
          dataSource={availableImages}
          renderItem={(image) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  size="small"
                  onClick={() => selectImage(image)}
                >
                  选择
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    shape="square"
                    size={64}
                    src={image.url}
                    style={{ objectFit: 'cover' }}
                  />
                }
                title={image.fileName}
                description={
                  <div>
                    <div>上传时间: {image.createdAt?.toDate?.()?.toLocaleDateString() || '未知'}</div>
                    <div>来源: {image.uploadSourceName}</div>
                    {image.description && <div>描述: {image.description}</div>}
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: '暂无可用的分会Logo' }}
        />
      </Modal>
    </div>
  );
};

export default ChapterLogoUpload;
