import React, { useState } from 'react';
import {
  Modal,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Input,
  message,
  Divider,
  Descriptions,
  Image,
} from 'antd';
import {
  DownloadOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  CalendarOutlined,
  UserOutlined,
  DatabaseOutlined,
  FileImageOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { ImageInfo } from '@/modules/image/services/imageManagementService';
import { imageManagementService } from '@/modules/image/services/imageManagementService';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface ImageDetailModalProps {
  visible: boolean;
  image: ImageInfo | null;
  onClose: () => void;
  onUpdate: () => void;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  visible,
  image,
  onClose,
  onUpdate
}) => {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ImageInfo>>({});
  const [saving, setSaving] = useState(false);

  // 重置编辑状态
  const resetEditing = () => {
    setEditing(false);
    setEditData({});
  };

  // 开始编辑
  const handleEdit = () => {
    if (image) {
      setEditData({
        description: image.description || '',
        tags: [...image.tags],
        isPublic: image.isPublic
      });
      setEditing(true);
    }
  };

  // 保存编辑
  const handleSave = async () => {
    if (!image) return;

    setSaving(true);
    try {
      await imageManagementService.updateImageInfo(image.id, editData);
      message.success('图片信息更新成功');
      setEditing(false);
      setEditData({});
      onUpdate();
    } catch (error) {
      console.error('更新图片信息失败:', error);
      message.error('更新图片信息失败');
    } finally {
      setSaving(false);
    }
  };

  // 取消编辑
  const handleCancel = () => {
    resetEditing();
  };

  // 处理标签变化
  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setEditData(prev => ({ ...prev, tags }));
  };

  // 处理描述变化
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditData(prev => ({ ...prev, description: e.target.value }));
  };

  // 处理公开状态变化
  const handlePublicChange = (checked: boolean) => {
    setEditData(prev => ({ ...prev, isPublic: checked }));
  };

  // 下载图片
  const handleDownload = () => {
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  if (!image) return null;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FileImageOutlined style={{ marginRight: 8 }} />
          图片详情
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="download" icon={<DownloadOutlined />} onClick={handleDownload}>
          下载图片
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      <Row gutter={24}>
        {/* 左侧：图片预览 */}
        <Col span={12}>
          <div style={{ textAlign: 'center' }}>
            <Image
              src={image.url}
              alt={image.fileName}
              style={{
                maxWidth: '100%',
                maxHeight: 400,
                borderRadius: 8,
                border: '1px solid #d9d9d9'
              }}
            />
            
            <div style={{ marginTop: 16 }}>
              <Space>
                <Tag color={getImageTypeColor(image.imageType)}>
                  {getImageTypeText(image.imageType)}
                </Tag>
                <Tag color={image.isPublic ? 'green' : 'orange'}>
                  {image.isPublic ? '公开' : '私有'}
                </Tag>
              </Space>
            </div>
          </div>
        </Col>

        {/* 右侧：图片信息 */}
        <Col span={12}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              {image.fileName}
            </Title>
            <Text type="secondary">
              {image.uploadSourceName || image.uploadSource}
            </Text>
          </div>

          {/* 基本信息 */}
          <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
            <Descriptions.Item label="文件大小">
              <DatabaseOutlined style={{ marginRight: 4 }} />
              {formatFileSize(image.fileSize)}
            </Descriptions.Item>
            <Descriptions.Item label="文件类型">
              {image.mimeType}
            </Descriptions.Item>
            <Descriptions.Item label="尺寸">
              {image.width && image.height ? `${image.width} × ${image.height}` : '未知'}
            </Descriptions.Item>
            <Descriptions.Item label="上传时间">
              <CalendarOutlined style={{ marginRight: 4 }} />
              {formatDate(image.createdAt)}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              <CalendarOutlined style={{ marginRight: 4 }} />
              {formatDate(image.updatedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="上传者">
              <UserOutlined style={{ marginRight: 4 }} />
              {image.uploadedByName}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* 可编辑信息 */}
          <div>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={5} style={{ margin: 0 }}>
                <TagOutlined style={{ marginRight: 4 }} />
                图片信息
              </Title>
              {!editing && (
                <Button size="small" icon={<EditOutlined />} onClick={handleEdit}>
                  编辑
                </Button>
              )}
            </div>

            {editing ? (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>描述：</Text>
                  <TextArea
                    value={editData.description || ''}
                    onChange={handleDescriptionChange}
                    placeholder="请输入图片描述"
                    rows={3}
                    style={{ marginTop: 8 }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text strong>标签：</Text>
                  <Input
                    value={editData.tags?.join(', ') || ''}
                    onChange={(e) => handleTagsChange(e.target.value)}
                    placeholder="请输入标签，用逗号分隔"
                    style={{ marginTop: 8 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    多个标签用逗号分隔
                  </Text>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <input
                      type="checkbox"
                      checked={editData.isPublic || false}
                      onChange={(e) => handlePublicChange(e.target.checked)}
                    />
                    <Text>公开图片</Text>
                  </Space>
                </div>

                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={saving}
                  >
                    保存
                  </Button>
                  <Button icon={<CloseOutlined />} onClick={handleCancel}>
                    取消
                  </Button>
                </Space>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>描述：</Text>
                  <div style={{ marginTop: 8 }}>
                    {image.description ? (
                      <Text>{image.description}</Text>
                    ) : (
                      <Text type="secondary">暂无描述</Text>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Text strong>标签：</Text>
                  <div style={{ marginTop: 8 }}>
                    {image.tags.length > 0 ? (
                      <Space wrap>
                        {image.tags.map((tag, index) => (
                          <Tag key={index} color="blue">
                            {tag}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      <Text type="secondary">暂无标签</Text>
                    )}
                  </div>
                </div>

                <div>
                  <Text strong>状态：</Text>
                  <div style={{ marginTop: 8 }}>
                    <Tag color={image.isPublic ? 'green' : 'orange'}>
                      {image.isPublic ? '公开' : '私有'}
                    </Tag>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Modal>
  );
};

export default ImageDetailModal;
