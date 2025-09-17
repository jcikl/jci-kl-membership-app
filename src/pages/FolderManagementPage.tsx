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
  Spin,
  Empty,
  Modal,
  Form,
  ColorPicker,
  Upload,
  Breadcrumb,
  Tag,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  FolderOutlined,
  FileOutlined,
  UploadOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderAddOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { FolderInfo, FileInfo, FileType, FileStats, folderManagementService } from '@/services/folderManagementService';
import { globalComponentService } from '@/config/globalComponentSettings';
import { useAuthStore } from '@/store/authStore';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const FolderManagementPage: React.FC = () => {
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('folders');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<FolderInfo[]>([]);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // 搜索和筛选
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileType | ''>('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  
  // Modal状态
  const [createFolderModalVisible, setCreateFolderModalVisible] = useState(false);
  const [editFolderModalVisible, setEditFolderModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<FolderInfo | null>(null);
  
  // 表单
  const [createFolderForm] = Form.useForm();
  const [editFolderForm] = Form.useForm();

  // 认证状态
  const { member } = useAuthStore();

  // 初始化数据
  useEffect(() => {
    loadData();
  }, []);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [foldersData, statsData] = await Promise.all([
        folderManagementService.getFolders({ parentId: currentFolderId || undefined }),
        folderManagementService.getFileStats()
      ]);
      
      setFolders(foldersData);
      setStats(statsData);
      
      // 如果有选中的文件夹，加载该文件夹的文件
      if (currentFolderId) {
        await loadFolderFiles(currentFolderId);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载文件夹文件
  const loadFolderFiles = async (folderId: string) => {
    setLoading(true);
    try {
      const folderFiles = await folderManagementService.getFiles({ folderId });
      setFiles(folderFiles);
    } catch (error) {
      console.error('加载文件夹文件失败:', error);
      message.error('加载文件夹文件失败');
    } finally {
      setLoading(false);
    }
  };

  // 进入文件夹
  const enterFolder = async (folder: FolderInfo) => {
    setCurrentFolderId(folder.id);
    setSearchTerm('');
    setFileTypeFilter('');
    setSelectedItems([]);
    await loadData();
  };

  // 返回上级文件夹
  const goBack = async () => {
    if (!currentFolderId) return;

    try {
      const currentFolder = await folderManagementService.getFolderById(currentFolderId);
      if (currentFolder?.parentId) {
        setCurrentFolderId(currentFolder.parentId);
      } else {
        setCurrentFolderId(null);
      }
      await loadData();
    } catch (error) {
      console.error('返回上级文件夹失败:', error);
      message.error('返回上级文件夹失败');
    }
  };

  // 搜索文件
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      if (currentFolderId) {
        await loadFolderFiles(currentFolderId);
      } else {
        setFiles([]);
      }
      return;
    }

    setLoading(true);
    try {
      const searchOptions = {
        folderId: currentFolderId || undefined,
        fileType: fileTypeFilter || undefined
      };
      
      const searchResults = await folderManagementService.searchFiles(searchTerm, searchOptions);
      setFiles(searchResults);
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建文件夹
  const handleCreateFolder = async (values: any) => {
    try {
      if (!member) {
        message.error('请先登录');
        return;
      }

      const folderData = {
        name: values.name,
        description: values.description,
        parentId: currentFolderId || undefined,
        path: '', // 将在服务中自动生成
        color: values.color,
        icon: values.icon,
        isPublic: values.isPublic || false,
        createdBy: member.id,
        createdByName: member.name || member.email || '未知用户'
      };

      await folderManagementService.createFolder(folderData);
      message.success('文件夹创建成功');
      setCreateFolderModalVisible(false);
      createFolderForm.resetFields();
      await loadData();
    } catch (error) {
      console.error('创建文件夹失败:', error);
      message.error(error instanceof Error ? error.message : '创建文件夹失败');
    }
  };

  // 编辑文件夹
  const handleEditFolder = async (values: any) => {
    if (!selectedFolder) return;

    try {
      await folderManagementService.updateFolder(selectedFolder.id, {
        name: values.name,
        description: values.description,
        color: values.color,
        icon: values.icon,
        isPublic: values.isPublic
      });

      message.success('文件夹更新成功');
      setEditFolderModalVisible(false);
      setSelectedFolder(null);
      editFolderForm.resetFields();
      await loadData();
    } catch (error) {
      console.error('更新文件夹失败:', error);
      message.error('更新文件夹失败');
    }
  };

  // 删除文件夹
  const handleDeleteFolder = async (folderId: string) => {
    try {
      await folderManagementService.deleteFolder(folderId);
      message.success('文件夹删除成功');
      await loadData();
    } catch (error) {
      console.error('删除文件夹失败:', error);
      message.error(error instanceof Error ? error.message : '删除文件夹失败');
    }
  };

  // 处理项目选择
  const handleItemSelect = (itemId: string, selected: boolean) => {
    if (selected) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };


  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedItems.length === 0) {
      message.warning('请选择要删除的项目');
      return;
    }

    try {
      const folderIds = selectedItems.filter(id => folders.some(f => f.id === id));
      const fileIds = selectedItems.filter(id => files.some(f => f.id === id));

      if (folderIds.length > 0) {
        const deleteFolderPromises = folderIds.map(id => folderManagementService.deleteFolder(id));
        await Promise.all(deleteFolderPromises);
      }

      if (fileIds.length > 0) {
        await folderManagementService.batchDeleteFiles(fileIds);
      }

      message.success(`成功删除 ${selectedItems.length} 个项目`);
      setSelectedItems([]);
      await loadData();
    } catch (error) {
      console.error('批量删除失败:', error);
      message.error('批量删除失败');
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    return folderManagementService.formatFileSize(bytes);
  };

  // 获取文件类型图标
  const getFileTypeIcon = (fileType: FileType): string => {
    const iconMap: Record<FileType, string> = {
      [FileType.IMAGE]: '🖼️',
      [FileType.DOCUMENT]: '📄',
      [FileType.VIDEO]: '🎥',
      [FileType.AUDIO]: '🎵',
      [FileType.ARCHIVE]: '📦',
      [FileType.OTHER]: '📎'
    };
    return iconMap[fileType] || '📎';
  };

  // 构建面包屑导航
  const buildBreadcrumb = () => {
    const breadcrumbItems = [
      {
        title: (
          <Button 
            type="link" 
            icon={<HomeOutlined />} 
            onClick={() => {
              setCurrentFolderId(null);
              loadData();
            }}
          >
            根目录
          </Button>
        )
      }
    ];

    // 如果有当前文件夹，显示其路径
    if (currentFolderId) {
      breadcrumbItems.push({
        title: (
          <Button 
            type="link" 
            onClick={() => {
              loadData();
            }}
          >
            当前文件夹
          </Button>
        )
      });
    }

    return breadcrumbItems;
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题 */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <FolderOutlined style={{ marginRight: 8 }} />
          文件夹管理
        </Title>
        <Text type="secondary">
          管理系统中的文件夹和文件，支持创建、编辑、删除等操作
        </Text>
      </div>

      {/* 面包屑导航 */}
      <Card style={{ marginBottom: 16 }}>
        <Breadcrumb items={buildBreadcrumb()} />
      </Card>

      {/* 统计信息 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总文件数"
                value={stats.totalFiles}
                prefix={<FileOutlined />}
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
                icon={<FolderAddOutlined />}
                onClick={() => setCreateFolderModalVisible(true)}
              >
                新建文件夹
              </Button>
              <Button
                icon={<UploadOutlined />}
                onClick={() => setUploadModalVisible(true)}
              >
                上传文件
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadData}
                loading={loading}
              >
                刷新
              </Button>
              {currentFolderId && (
                <Button
                  icon={<FolderOpenOutlined />}
                  onClick={goBack}
                >
                  返回上级
                </Button>
              )}
              {selectedItems.length > 0 && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleBatchDelete}
                >
                  删除选中 ({selectedItems.length})
                </Button>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              <Search
                placeholder="搜索文件..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 200 }}
              />
              <Select
                placeholder="文件类型"
                value={fileTypeFilter}
                onChange={setFileTypeFilter}
                style={{ width: 120 }}
                allowClear
              >
                <Option value={FileType.IMAGE}>图片</Option>
                <Option value={FileType.DOCUMENT}>文档</Option>
                <Option value={FileType.VIDEO}>视频</Option>
                <Option value={FileType.AUDIO}>音频</Option>
                <Option value={FileType.ARCHIVE}>压缩包</Option>
                <Option value={FileType.OTHER}>其他</Option>
              </Select>
              <Select
                placeholder="排序方式"
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 120 }}
              >
                <Option value="name">按名称</Option>
                <Option value="date">按日期</Option>
                <Option value="size">按大小</Option>
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
                <div>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>加载中...</div>
                    </div>
                  ) : folders.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无文件夹"
                      style={{ padding: '50px 0' }}
                    >
                      <Button
                        type="primary"
                        icon={<FolderAddOutlined />}
                        onClick={() => setCreateFolderModalVisible(true)}
                      >
                        创建第一个文件夹
                      </Button>
                    </Empty>
                  ) : (
                    <Row gutter={[16, 16]}>
                      {folders.map((folder) => (
                        <Col key={folder.id} xs={24} sm={12} md={8} lg={6}>
                          <Card
                            hoverable
                            className={selectedItems.includes(folder.id) ? 'selected-item' : ''}
                            onClick={() => handleItemSelect(folder.id, !selectedItems.includes(folder.id))}
                            style={{
                              border: selectedItems.includes(folder.id) ? '2px solid #1890ff' : '1px solid #d9d9d9',
                              borderRadius: 8,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            bodyStyle={{ padding: '16px' }}
                            actions={[
                              <Tooltip title="进入文件夹">
                                <FolderOpenOutlined 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    enterFolder(folder);
                                  }}
                                />
                              </Tooltip>,
                              <Tooltip title="编辑">
                                <EditOutlined 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFolder(folder);
                                    editFolderForm.setFieldsValue({
                                      name: folder.name,
                                      description: folder.description,
                                      color: folder.color,
                                      icon: folder.icon,
                                      isPublic: folder.isPublic
                                    });
                                    setEditFolderModalVisible(true);
                                  }}
                                />
                              </Tooltip>,
                              <Popconfirm
                                title="确定要删除这个文件夹吗？"
                                description="删除后无法恢复"
                                onConfirm={(e) => {
                                  e?.stopPropagation();
                                  handleDeleteFolder(folder.id);
                                }}
                                okText="确定"
                                cancelText="取消"
                              >
                                <DeleteOutlined 
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </Popconfirm>
                            ]}
                          >
                            <div style={{ textAlign: 'center' }}>
                              {/* 文件夹图标 */}
                              <div style={{ fontSize: '48px', marginBottom: 12 }}>
                                <span style={{ fontSize: '48px', color: folder.color || '#1890ff' }}>
                                  {folder.icon || folderManagementService.getFolderIcon(folder.name)}
                                </span>
                              </div>

                              {/* 文件夹名称 */}
                              <Title level={5} style={{ margin: '0 0 8px 0', color: folder.color || '#1890ff' }}>
                                {folder.name}
                              </Title>

                              {/* 文件夹信息 */}
                              <div style={{ marginBottom: 12 }}>
                                <Tag color={folder.color || '#1890ff'} style={{ marginBottom: 4 }}>
                                  <FileOutlined style={{ marginRight: 4 }} />
                                  {folder.fileCount} 个文件
                                </Tag>
                                <div style={{ fontSize: 12, color: '#666' }}>
                                  {formatFileSize(folder.totalSize)}
                                </div>
                              </div>

                              {/* 描述 */}
                              {folder.description && (
                                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                                  {folder.description}
                                </div>
                              )}

                              {/* 权限标识 */}
                              <div style={{ fontSize: 10, color: '#ccc' }}>
                                {folder.isPublic ? '公开' : '私有'}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              )
            },
            {
              key: 'files',
              label: '文件列表',
              children: (
                <div>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                      <Spin size="large" />
                      <div style={{ marginTop: 16 }}>加载中...</div>
                    </div>
                  ) : files.length === 0 ? (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="暂无文件"
                      style={{ padding: '50px 0' }}
                    >
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={() => setUploadModalVisible(true)}
                      >
                        上传第一个文件
                      </Button>
                    </Empty>
                  ) : (
                    <Row gutter={[16, 16]}>
                      {files.map((file) => (
                        <Col key={file.id} xs={24} sm={12} md={8} lg={6}>
                          <Card
                            hoverable
                            className={selectedItems.includes(file.id) ? 'selected-item' : ''}
                            onClick={() => handleItemSelect(file.id, !selectedItems.includes(file.id))}
                            style={{
                              border: selectedItems.includes(file.id) ? '2px solid #1890ff' : '1px solid #d9d9d9',
                              borderRadius: 8,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            bodyStyle={{ padding: '16px' }}
                            actions={[
                              <Tooltip title="预览">
                                <EyeOutlined />
                              </Tooltip>,
                              <Tooltip title="下载">
                                <DownloadOutlined />
                              </Tooltip>,
                              <Tooltip title="删除">
                                <DeleteOutlined 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    folderManagementService.deleteFile(file.id).then(() => {
                                      message.success('文件删除成功');
                                      loadData();
                                    }).catch(() => {
                                      message.error('文件删除失败');
                                    });
                                  }}
                                />
                              </Tooltip>
                            ]}
                          >
                            <div style={{ textAlign: 'center' }}>
                              {/* 文件图标 */}
                              <div style={{ fontSize: '48px', marginBottom: 12 }}>
                                <span style={{ fontSize: '48px' }}>
                                  {getFileTypeIcon(file.fileType)}
                                </span>
                              </div>

                              {/* 文件名称 */}
                              <Title level={5} style={{ margin: '0 0 8px 0' }}>
                                {file.fileName}
                              </Title>

                              {/* 文件信息 */}
                              <div style={{ marginBottom: 12 }}>
                                <Tag color="blue" style={{ marginBottom: 4 }}>
                                  {formatFileSize(file.fileSize)}
                                </Tag>
                                <div style={{ fontSize: 12, color: '#666' }}>
                                  下载 {file.downloadCount} 次
                                </div>
                              </div>

                              {/* 描述 */}
                              {file.description && (
                                <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                                  {file.description}
                                </div>
                              )}

                              {/* 上传时间 */}
                              <div style={{ fontSize: 10, color: '#ccc' }}>
                                {file.createdAt.toDate().toLocaleDateString()}
                              </div>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </div>
              )
            }
          ]}
        />
      </Card>

      {/* 创建文件夹Modal */}
      <Modal
        title="创建文件夹"
        open={createFolderModalVisible}
        onCancel={() => {
          setCreateFolderModalVisible(false);
          createFolderForm.resetFields();
        }}
        footer={null}
        {...globalComponentService.getModalConfig()}
      >
        <Form
          form={createFolderForm}
          layout="vertical"
          onFinish={handleCreateFolder}
          {...globalComponentService.getFormConfig()}
        >
          <Form.Item
            name="name"
            label="文件夹名称"
            rules={[{ required: true, message: '请输入文件夹名称' }]}
          >
            <Input placeholder="请输入文件夹名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入文件夹描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="color"
            label="文件夹颜色"
          >
            <ColorPicker />
          </Form.Item>

          <Form.Item
            name="icon"
            label="文件夹图标"
          >
            <Input placeholder="请输入图标（如：📁）" />
          </Form.Item>

          <Form.Item
            name="isPublic"
            label="公开设置"
            valuePropName="checked"
          >
            <input type="checkbox" /> 公开文件夹
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => {
                setCreateFolderModalVisible(false);
                createFolderForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑文件夹Modal */}
      <Modal
        title="编辑文件夹"
        open={editFolderModalVisible}
        onCancel={() => {
          setEditFolderModalVisible(false);
          setSelectedFolder(null);
          editFolderForm.resetFields();
        }}
        footer={null}
        {...globalComponentService.getModalConfig()}
      >
        <Form
          form={editFolderForm}
          layout="vertical"
          onFinish={handleEditFolder}
          {...globalComponentService.getFormConfig()}
        >
          <Form.Item
            name="name"
            label="文件夹名称"
            rules={[{ required: true, message: '请输入文件夹名称' }]}
          >
            <Input placeholder="请输入文件夹名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="请输入文件夹描述" rows={3} />
          </Form.Item>

          <Form.Item
            name="color"
            label="文件夹颜色"
          >
            <ColorPicker />
          </Form.Item>

          <Form.Item
            name="icon"
            label="文件夹图标"
          >
            <Input placeholder="请输入图标（如：📁）" />
          </Form.Item>

          <Form.Item
            name="isPublic"
            label="公开设置"
            valuePropName="checked"
          >
            <input type="checkbox" /> 公开文件夹
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
              <Button onClick={() => {
                setEditFolderModalVisible(false);
                setSelectedFolder(null);
                editFolderForm.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 上传文件Modal */}
      <Modal
        title="上传文件"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
        {...globalComponentService.getModalConfig()}
      >
        <Upload.Dragger
          name="file"
          multiple
          action="/api/upload"
          onChange={(info) => {
            if (info.file.status === 'done') {
              message.success(`${info.file.name} 上传成功`);
              setUploadModalVisible(false);
              loadData();
            } else if (info.file.status === 'error') {
              message.error(`${info.file.name} 上传失败`);
            }
          }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个或批量上传。支持图片、文档、视频等格式
          </p>
        </Upload.Dragger>
      </Modal>

      {/* 样式 */}
      <style>{`
        .selected-item {
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

export default FolderManagementPage;
