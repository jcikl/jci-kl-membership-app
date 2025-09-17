import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Checkbox,
  Button,
  Empty,
  Spin,
  Typography,
  Tag,
  Space,
  Image,
  Modal
} from 'antd';
import {
  EyeOutlined,
  DownloadOutlined,
  CalendarOutlined,
  UserOutlined,
  FileImageOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { ImageInfo } from '@/modules/image/services/imageManagementService';

const { Title, Text } = Typography;

interface ImageGridViewProps {
  images: ImageInfo[];
  selectedImages: string[];
  onImageSelect: (imageId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onViewImage: (image: ImageInfo) => void;
  loading: boolean;
}

const ImageGridView: React.FC<ImageGridViewProps> = ({
  images,
  selectedImages,
  onImageSelect,
  onSelectAll,
  onViewImage,
  loading
}) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化日期
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return '未知';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // 获取图片类型标签颜色
  const getImageTypeColor = (imageType: string) => {
    const colorMap: Record<string, string> = {
      'event_poster': 'blue',
      'member_avatar': 'green',
      'document': 'orange',
      'general': 'default'
    };
    return colorMap[imageType] || 'default';
  };

  // 获取图片类型标签文本
  const getImageTypeText = (imageType: string) => {
    const textMap: Record<string, string> = {
      'event_poster': '活动海报',
      'member_avatar': '会员头像',
      'document': '文档',
      'general': '通用'
    };
    return textMap[imageType] || '未知';
  };

  // 处理图片预览
  const handlePreview = (image: ImageInfo) => {
    setPreviewImage(image.url);
    setPreviewVisible(true);
  };

  // 处理图片下载
  const handleDownload = (image: ImageInfo) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 全选状态
  const isAllSelected = images.length > 0 && selectedImages.length === images.length;
  const isIndeterminate = selectedImages.length > 0 && selectedImages.length < images.length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载图片中...</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无图片"
        style={{ padding: '50px 0' }}
      >
        <Text type="secondary">
          当前文件夹中没有图片，或者搜索结果为空
        </Text>
      </Empty>
    );
  }

  return (
    <div>
      {/* 工具栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <FileImageOutlined style={{ marginRight: 8 }} />
            图片列表 ({images.length})
          </Title>
        </div>
        <div>
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={(e) => onSelectAll(e.target.checked)}
          >
            全选 ({selectedImages.length}/{images.length})
          </Checkbox>
        </div>
      </div>

      {/* 图片网格 */}
      <Row gutter={[16, 16]}>
        {images.map((image) => (
          <Col key={image.id} xs={12} sm={8} md={6} lg={4} xl={3}>
            <Card
              hoverable
              style={{
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative'
              }}
              bodyStyle={{ padding: 0 }}
            >
              {/* 选择框 */}
              <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 10 }}>
                <Checkbox
                  checked={selectedImages.includes(image.id)}
                  onChange={(e) => onImageSelect(image.id, e.target.checked)}
                />
              </div>

              {/* 图片 */}
              <div
                style={{
                  height: 200,
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => handlePreview(image)}
              >
                <Image
                  src={image.url}
                  alt={image.fileName}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'cover'
                  }}
                  preview={false}
                />
                
                {/* 悬停遮罩 */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                  className="image-overlay"
                >
                  <Space>
                    <Button
                      type="primary"
                      shape="circle"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewImage(image);
                      }}
                    />
                    <Button
                      shape="circle"
                      icon={<DownloadOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image);
                      }}
                    />
                  </Space>
                </div>
              </div>

              {/* 图片信息 */}
              <div style={{ padding: 12 }}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong style={{ fontSize: 12 }} ellipsis={{ tooltip: image.fileName }}>
                    {image.fileName}
                  </Text>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <Tag color={getImageTypeColor(image.imageType)}>
                    {getImageTypeText(image.imageType)}
                  </Tag>
                  {image.isPublic && (
                    <Tag color="green">
                      公开
                    </Tag>
                  )}
                </div>

                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                  <DatabaseOutlined style={{ marginRight: 4 }} />
                  {formatFileSize(image.fileSize)}
                </div>

                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {formatDate(image.createdAt)}
                </div>

                <div style={{ fontSize: 11, color: '#666' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {image.uploadedByName}
                </div>

                {/* 标签 */}
                {image.tags.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Space wrap size={[4, 4]}>
                      {image.tags.slice(0, 3).map((tag, index) => (
                        <Tag key={index} color="blue">
                          {tag}
                        </Tag>
                      ))}
                      {image.tags.length > 3 && (
                        <Tag color="default">
                          +{image.tags.length - 3}
                        </Tag>
                      )}
                    </Space>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 图片预览Modal */}
      <Modal
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width="auto"
        style={{ maxWidth: '90vw' }}
      >
        <Image
          src={previewImage}
          alt="预览图片"
          style={{ maxWidth: '100%', maxHeight: '80vh' }}
        />
      </Modal>

      {/* 样式 */}
      <style>{`
        .ant-card:hover .image-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

export default ImageGridView;
