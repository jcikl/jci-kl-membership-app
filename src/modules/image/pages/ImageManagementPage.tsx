import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Input,
  Select,
  Tabs,
  Statistic,
  message,
} from 'antd';
import {
  FolderOutlined,
  UploadOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { ImageInfo, ImageFolder, ImageStats, ImageQueryOptions } from '@/modules/image/services/imageManagementService';
import { imageManagementService } from '@/modules/image/services/imageManagementService';
import { ImageType } from '@/modules/image/components/GlobalImageUploadModal';
import ImageFolderView from '@/modules/image/components/ImageManagement/ImageFolderView';
import ImageGridView from '@/modules/image/components/ImageManagement/ImageGridView';
import ImageDetailModal from '@/modules/image/components/ImageManagement/ImageDetailModal';
import GlobalImageUploadModal, { UploadServiceType } from '@/modules/image/components/GlobalImageUploadModal';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ImageManagementPage: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('folders');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [folders, setFolders] = useState<ImageFolder[]>([]);
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [imageTypeFilter, setImageTypeFilter] = useState<ImageType | ''>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');
  
  // Modal状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageInfo | null>(null);

  // 初始化数据
  useEffect(() => {
    loadData();
  }, []);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [foldersData, statsData] = await Promise.all([
        imageManagementService.getImageFolders(),
        imageManagementService.getImageStats()
      ]);
      
      setFolders(foldersData);
      setStats(statsData);
      
      // 如果有选中的文件夹，加载该文件夹的图片
      if (selectedFolder) {
        await loadFolderImages(selectedFolder);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载文件夹图片
  const loadFolderImages = async (source: string) => {
    setLoading(true);
    try {
      const folderImages = await imageManagementService.getImagesBySource(source);
      setImages(folderImages);
    } catch (error) {
      console.error('加载文件夹图片失败:', error);
      message.error('加载文件夹图片失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索图片
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      if (selectedFolder) {
        await loadFolderImages(selectedFolder);
      } else {
        setImages([]);
      }
      return;
    }

    setLoading(true);
    try {
      const searchOptions: ImageQueryOptions = {};
      if (imageTypeFilter) searchOptions.imageType = imageTypeFilter;
      if (sourceFilter) searchOptions.source = sourceFilter;
      
      const searchResults = await imageManagementService.searchImages(searchTerm, searchOptions);
      setImages(searchResults);
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理文件夹选择
  const handleFolderSelect = (source: string) => {
    setSelectedFolder(source);
    setSearchTerm('');
    setImageTypeFilter('');
    setSourceFilter('');
    loadFolderImages(source);
  };

  // 处理图片选择
  const handleImageSelect = (imageId: string, selected: boolean) => {
    if (selected) {
      setSelectedImages(prev => [...prev, imageId]);
    } else {
      setSelectedImages(prev => prev.filter(id => id !== imageId));
    }
  };

  // 处理全选
  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedImages(images.map(img => img.id));
    } else {
      setSelectedImages([]);
    }
  };

  // 查看图片详情
  const handleViewImage = (image: ImageInfo) => {
    setSelectedImage(image);
    setDetailModalVisible(true);
  };

  // 删除图片
  const handleDeleteImages = async () => {
    if (selectedImages.length === 0) {
      message.warning('请选择要删除的图片');
      return;
    }

    try {
      await imageManagementService.batchDeleteImages(selectedImages);
      message.success(`成功删除 ${selectedImages.length} 张图片`);
      setSelectedImages([]);
      await loadData();
    } catch (error) {
      console.error('删除图片失败:', error);
      message.error('删除图片失败');
    }
  };

  // 处理上传成功
  const handleUploadSuccess = async (url: string) => {
    // 这里需要根据实际情况创建图片信息
    // 暂时使用手动上传作为来源
    const imageData = {
      url,
      fileName: `manual_upload_${Date.now()}`,
      fileSize: 0, // 需要从上传结果获取
      mimeType: 'image/jpeg',
      imageType: ImageType.GENERAL,
      uploadSource: 'manual_upload',
      uploadSourceName: '手动上传',
      tags: [],
      description: '',
      isPublic: true,
      uploadedBy: 'current_user_id', // 需要从认证状态获取
      uploadedByName: '当前用户' // 需要从认证状态获取
    };

    try {
      await imageManagementService.uploadImageInfo(imageData);
      message.success('图片上传成功');
      setUploadModalVisible(false);
      await loadData();
    } catch (error) {
      console.error('保存图片信息失败:', error);
      message.error('保存图片信息失败');
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FolderOutlined style={{ marginRight: 8 }} />
          图片管理中心
        </Title>
        <Text type="secondary">
          管理系统中所有上传的图片，按来源分类组织
        </Text>
      </div>

      {/* 统计信息 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总图片数"
                value={stats.totalImages}
                prefix={<EyeOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总大小"
                value={formatFileSize(stats.totalSize)}
                prefix={<DownloadOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="文件夹数"
                value={stats.folderCount}
                prefix={<FolderOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="最近上传"
                value={stats.recentUploads.length}
                prefix={<UploadOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 操作栏 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                上传图片
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadData}
                loading={loading}
              >
                刷新
              </Button>
              {selectedImages.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteImages}
                >
                  删除选中 ({selectedImages.length})
                </Button>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="搜索图片..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 200 }}
              />
              <Select
                placeholder="图片类型"
                value={imageTypeFilter}
                onChange={setImageTypeFilter}
                style={{ width: 120 }}
                allowClear
              >
                <Option value={ImageType.EVENT_POSTER}>活动海报</Option>
                <Option value={ImageType.MEMBER_AVATAR}>会员头像</Option>
                <Option value={ImageType.DOCUMENT}>文档</Option>
                <Option value={ImageType.GENERAL}>通用</Option>
              </Select>
              <Select
                placeholder="来源"
                value={sourceFilter}
                onChange={setSourceFilter}
                style={{ width: 120 }}
                allowClear
              >
                {imageManagementService.getUploadSources().map(source => (
                  <Option key={source.value} value={source.value}>
                    {source.label}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 主要内容 */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'folders',
              label: '文件夹视图',
              children: (
                <ImageFolderView
                  folders={folders}
                  onFolderSelect={handleFolderSelect}
                  selectedFolder={selectedFolder}
                  loading={loading}
                />
              )
            },
            {
              key: 'images',
              label: '图片网格',
              children: (
                <ImageGridView
                  images={images}
                  selectedImages={selectedImages}
                  onImageSelect={handleImageSelect}
                  onSelectAll={handleSelectAll}
                  onViewImage={handleViewImage}
                  loading={loading}
                />
              )
            }
          ]}
        />
      </Card>

      {/* 上传Modal */}
      <GlobalImageUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
        title="上传图片"
        imageType={ImageType.GENERAL}
        uploadService={UploadServiceType.CLOUDINARY}
        maxSize={20}
        enableCompression={true}
        placeholder="上传图片到图片管理中心"
      />

      {/* 图片详情Modal */}
      <ImageDetailModal
        visible={detailModalVisible}
        image={selectedImage}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedImage(null);
        }}
        onUpdate={loadData}
      />
    </div>
  );
};

export default ImageManagementPage;
