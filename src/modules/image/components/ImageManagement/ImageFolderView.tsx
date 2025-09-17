import React from 'react';
import { Card, Row, Col, Typography, Empty, Spin, Tag, Tooltip } from 'antd';
import { FolderOutlined, FileImageOutlined, CalendarOutlined, DatabaseOutlined } from '@ant-design/icons';
import { ImageFolder } from '@/modules/image/services/imageManagementService';

const { Title, Text } = Typography;

interface ImageFolderViewProps {
  folders: ImageFolder[];
  onFolderSelect: (source: string) => void;
  selectedFolder: string;
  loading: boolean;
}

const ImageFolderView: React.FC<ImageFolderViewProps> = ({
  folders,
  onFolderSelect,
  selectedFolder,
  loading
}) => {
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取文件夹图标
  const getFolderIcon = (source: string) => {
    const iconMap: Record<string, string> = {
      'event_form': '📅',
      'member_profile': '👤',
      'document_upload': '📄',
      'award_submission': '🏆',
      'survey_response': '📊',
      'manual_upload': '📁'
    };
    return iconMap[source] || '📁';
  };

  // 获取文件夹颜色
  const getFolderColor = (source: string) => {
    const colorMap: Record<string, string> = {
      'event_form': '#1890ff',
      'member_profile': '#52c41a',
      'document_upload': '#fa8c16',
      'award_submission': '#eb2f96',
      'survey_response': '#722ed1',
      'manual_upload': '#13c2c2'
    };
    return colorMap[source] || '#666';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载文件夹中...</div>
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="暂无图片文件夹"
        style={{ padding: '50px 0' }}
      >
        <Text type="secondary">
          系统中还没有上传任何图片，请先上传一些图片
        </Text>
      </Empty>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <FolderOutlined style={{ marginRight: 8 }} />
          图片文件夹 ({folders.length})
        </Title>
        <Text type="secondary">
          点击文件夹查看其中的图片
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {folders.map((folder) => (
          <Col key={folder.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              className={selectedFolder === folder.source ? 'selected-folder' : ''}
              onClick={() => onFolderSelect(folder.source)}
              style={{
                border: selectedFolder === folder.source ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ textAlign: 'center' }}>
                {/* 文件夹图标 */}
                <div style={{ fontSize: '48px', marginBottom: 12 }}>
                  {folder.thumbnail ? (
                    <img
                      src={folder.thumbnail}
                      alt={folder.name}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '2px solid #f0f0f0'
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '48px' }}>
                      {getFolderIcon(folder.source)}
                    </span>
                  )}
                </div>

                {/* 文件夹名称 */}
                <Title level={5} style={{ margin: '0 0 8px 0', color: getFolderColor(folder.source) }}>
                  {folder.name}
                </Title>

                {/* 文件夹信息 */}
                <div style={{ marginBottom: 12 }}>
                  <Tag color={getFolderColor(folder.source)} style={{ marginBottom: 4 }}>
                    <FileImageOutlined style={{ marginRight: 4 }} />
                    {folder.imageCount} 张图片
                  </Tag>
                  <div style={{ fontSize: 12, color: '#666' }}>
                    <DatabaseOutlined style={{ marginRight: 4 }} />
                    {formatFileSize(folder.totalSize)}
                  </div>
                </div>

                {/* 最后更新时间 */}
                <div style={{ fontSize: 12, color: '#999' }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {formatDate(folder.lastUpdated)}
                </div>

                {/* 来源标识 */}
                <Tooltip title={`来源: ${folder.source}`}>
                  <div style={{ 
                    fontSize: 10, 
                    color: '#ccc', 
                    marginTop: 8,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}>
                    {folder.source}
                  </div>
                </Tooltip>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 样式 */}
      <style>{`
        .selected-folder {
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.15);
        }
        
        .ant-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default ImageFolderView;
