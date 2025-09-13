import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Row,
  Col,
  Tooltip,
  Alert,
  Progress,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  SettingOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { TransactionPurpose } from '@/types/finance';
import { useAuthStore } from '@/store/authStore';
import { transactionPurposeInitService } from '@/services/transactionPurposeInitService';

const { Title, Text } = Typography;
const { Option } = Select;

interface TransactionPurposeManagementProps {
  onCreatePurpose: (purpose: Omit<TransactionPurpose, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdatePurpose: (id: string, purpose: Partial<TransactionPurpose>) => Promise<void>;
  onDeletePurpose: (id: string) => Promise<void>;
  purposes: TransactionPurpose[];
  loading?: boolean;
}

const TransactionPurposeManagement: React.FC<TransactionPurposeManagementProps> = ({
  onCreatePurpose,
  onUpdatePurpose,
  onDeletePurpose,
  purposes,
  loading = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isInitModalVisible, setIsInitModalVisible] = useState(false);
  const [editingPurpose, setEditingPurpose] = useState<TransactionPurpose | null>(null);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  
  // 初始化状态
  const [isInitialized, setIsInitialized] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  
  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [levelFilter, setLevelFilter] = useState<'all' | '0' | '1' | '2'>('all');
  
  // 表单状态
  const [selectedTransactionType, setSelectedTransactionType] = useState<string>('');

  // 检查初始化状态
  useEffect(() => {
    const checkInitialization = async () => {
      try {
        const initialized = await transactionPurposeInitService.checkInitialized();
        setIsInitialized(initialized);
      } catch (error) {
        console.error('检查初始化状态失败:', error);
      }
    };
    
    checkInitialization();
  }, [purposes]);

  // 获取各层级用途
  const rootPurposes = purposes.filter(p => p.level === 0);
  const businessPurposes = purposes.filter(p => p.level === 1);
  const specificPurposes = purposes.filter(p => p.level === 2);

  // 筛选数据
  const filteredPurposes = purposes.filter(purpose => {
    // 搜索文本筛选
    if (searchText && !purpose.name.toLowerCase().includes(searchText.toLowerCase()) && 
        !purpose.description?.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    
    // 分类筛选
    if (categoryFilter !== 'all' && purpose.category !== categoryFilter) {
      return false;
    }
    
    // 状态筛选
    if (statusFilter === 'active' && !purpose.isActive) return false;
    if (statusFilter === 'inactive' && purpose.isActive) return false;
    
    // 层级筛选
    if (levelFilter !== 'all' && purpose.level !== parseInt(levelFilter)) return false;
    
    return true;
  });

  // 构建3层级树形结构数据
  const buildTreeData = () => {
    const treeData: (TransactionPurpose & { children?: (TransactionPurpose & { children?: TransactionPurpose[] })[] })[] = [];
    
    // 获取筛选后的根目录
    const filteredRootPurposes = filteredPurposes.filter(p => p.level === 0);
    
    // 添加根目录及其子级
    filteredRootPurposes.forEach(root => {
      const businessChildren = filteredPurposes.filter(p => p.parentId === root.id && p.level === 1);
      const businessChildrenWithSpecific = businessChildren.map(business => ({
        ...business,
        children: filteredPurposes.filter(p => p.parentId === business.id && p.level === 2)
      }));
      
      if (businessChildrenWithSpecific.length > 0 || levelFilter === 'all') {
        treeData.push({
          ...root,
          children: businessChildrenWithSpecific
        });
      }
    });
    
    return treeData;
  };

  const treeData = buildTreeData();

  // 分类参数为1级目录的记录
  const purposeCategoryOptions = businessPurposes.map(purpose => ({
    value: purpose.id,
    label: purpose.name
  }));

  // 根据交易类别筛选分类选项（1级目录记录）
  const getFilteredCategoryOptions = (transactionTypeId?: string) => {
    if (!transactionTypeId) {
      return []; // 没有主要分类时，不显示任何业务分类选项
    }

    // 筛选出属于该交易类别的1级目录记录
    const filteredBusinessPurposes = businessPurposes.filter(purpose => 
      purpose.parentId === transactionTypeId
    );

    return filteredBusinessPurposes.map(purpose => ({
      value: purpose.id,
      label: purpose.name
    }));
  };

  const getCategoryTagColor = (categoryId: string): string => {
    // 根据分类ID获取颜色，使用循环颜色
    const colors = ['green', 'blue', 'orange', 'purple', 'cyan', 'magenta', 'gold', 'lime', 'red', 'default'];
    const index = businessPurposes.findIndex(p => p.id === categoryId);
    return colors[index % colors.length];
  };

  const getCategoryLabel = (categoryId: string): string => {
    const purpose = businessPurposes.find(p => p.id === categoryId);
    return purpose?.name || categoryId;
  };

  const getParentName = (parentId?: string): string => {
    if (!parentId) return '-';
    const parent = purposes.find(p => p.id === parentId);
    return parent?.name || '-';
  };


  const handleEditPurpose = (purpose: TransactionPurpose) => {
    setEditingPurpose(purpose);
    setSelectedTransactionType(purpose.parentId || '');
    setIsModalVisible(true);
    // 延迟设置表单字段，确保模态框已渲染
    setTimeout(() => {
      form.setFieldsValue(purpose);
    }, 0);
  };

  const handleDeletePurpose = async (id: string) => {
    try {
      await onDeletePurpose(id);
      message.success('交易用途删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 根据3层级管理体系决定层级和父级关系
      let level = 0;
      let parentId = undefined;
      
      if (!values.parentId && !values.category) {
        // 无父级分类和业务分类，创建顶级分类（0级）
        level = 0;
        parentId = undefined;
      } else if (values.parentId && !values.category) {
        // 有父级分类但无业务分类，创建业务分类（1级）
        level = 1;
        parentId = values.parentId;
      } else if (values.parentId && values.category) {
        // 有父级分类和业务分类，创建具体用途（2级）
        level = 2;
        parentId = values.category;
      } else {
        // 其他情况，默认为顶级分类
        level = 0;
        parentId = undefined;
      }
      
      const purposeData: any = {
        name: values.name,
        description: values.description || '',
        level: level,
        isActive: values.isActive !== undefined ? values.isActive : true,
        createdBy: user?.uid || 'unknown-user',
      };

      // 只有当parentId有值时才添加到数据中
      if (parentId) {
        purposeData.parentId = parentId;
      }

      // 只有当category有值时才添加到数据中
      if (values.category) {
        purposeData.category = values.category;
      }

      if (editingPurpose) {
        await onUpdatePurpose(editingPurpose.id, purposeData);
        message.success('用途记录更新成功');
      } else {
        await onCreatePurpose(purposeData);
        message.success('用途记录创建成功');
      }

      setIsModalVisible(false);
      form.resetFields();
      setSelectedTransactionType('');
    } catch (error) {
      console.error('保存交易用途失败:', error);
      message.error(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingPurpose(null);
    setSelectedTransactionType('');
  };







  // 初始化3层级交易用途
  const handleInitializeThreeTier = async () => {
    if (!user?.uid) {
      message.error('用户未登录');
      return;
    }

    setInitLoading(true);
    setInitProgress(0);

    try {
      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setInitProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await transactionPurposeInitService.initializeThreeTierPurposes(user.uid);
      
      clearInterval(progressInterval);
      setInitProgress(100);

      if (result.success) {
        message.success(result.message);
        setIsInitialized(true);
        setIsInitModalVisible(false);
        // 刷新页面数据
        window.location.reload();
      } else {
        message.warning(result.message);
        if (result.errors.length > 0) {
          console.error('初始化错误:', result.errors);
        }
      }
    } catch (error) {
      message.error(`初始化失败: ${error}`);
    } finally {
      setInitLoading(false);
      setInitProgress(0);
    }
  };

  // 重置3层级交易用途
  const handleResetThreeTier = async () => {
    if (!user?.uid) {
      message.error('用户未登录');
      return;
    }

    Modal.confirm({
      title: '确认重置',
      content: '此操作将删除所有现有的交易用途并重新创建3层级体系，是否继续？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setInitLoading(true);
        setInitProgress(0);

        try {
          const progressInterval = setInterval(() => {
            setInitProgress(prev => {
              if (prev >= 90) {
                clearInterval(progressInterval);
                return 90;
              }
              return prev + 10;
            });
          }, 200);

          const result = await transactionPurposeInitService.resetThreeTierPurposes(user.uid);
          
          clearInterval(progressInterval);
          setInitProgress(100);

          if (result.success) {
            message.success(result.message);
            setIsInitialized(true);
            // 刷新页面数据
            window.location.reload();
          } else {
            message.error(result.message);
          }
        } catch (error) {
          message.error(`重置失败: ${error}`);
        } finally {
          setInitLoading(false);
          setInitProgress(0);
        }
      },
    });
  };

  const columns = [
    {
      title: '用途名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: (a: TransactionPurpose, b: TransactionPurpose) => a.name.localeCompare(b.name),
      render: (text: string, record: TransactionPurpose) => (
        <Space>
          <TagOutlined />
          <Text strong>{text}</Text>
          {!record.isActive && <Tag color="red">已停用</Tag>}
        </Space>
      ),
    },
    {
      title: '层级',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: number) => (
        <Tag color={level === 0 ? 'blue' : 'green'}>
          {level === 0 ? '根目录' : '子目录'}
        </Tag>
      ),
    },
    {
      title: '父目录',
      dataIndex: 'parentId',
      key: 'parentId',
      width: 120,
      render: (parentId: string) => (
        <Text>{getParentName(parentId)}</Text>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      sorter: (a: TransactionPurpose, b: TransactionPurpose) => {
        const categoryA = a.category || '';
        const categoryB = b.category || '';
        return categoryA.localeCompare(categoryB);
      },
      render: (category: string | undefined) => (
        <Tag color={getCategoryTagColor(category || '')}>
          {getCategoryLabel(category || '')}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (text: string) => (
        <Text ellipsis={{ tooltip: text }}>
          {text || '-'}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        isActive ? 
          <Tag color="green" icon={<CheckCircleOutlined />}>启用</Tag> : 
          <Tag color="red" icon={<CloseCircleOutlined />}>停用</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      sorter: (a: TransactionPurpose, b: TransactionPurpose) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: TransactionPurpose) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditPurpose(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个交易用途吗？"
            description="删除后将无法恢复，请谨慎操作。"
            onConfirm={() => handleDeletePurpose(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 计算统计信息
  const totalPurposes = purposes.length;
  const activePurposes = purposes.filter(p => p.isActive).length;
  const rootPurposesCount = rootPurposes.length;
  const businessPurposesCount = businessPurposes.length;
  const specificPurposesCount = specificPurposes.length;
  const categoryCounts = purposes.reduce((acc, purpose) => {
    const categoryKey = purpose.category || '未分类';
    acc[categoryKey] = (acc[categoryKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      {/* 初始化提示 */}
      {!isInitialized && (
        <Alert
          message="3层级交易用途体系未初始化"
          description="建议初始化3层级交易用途管理体系，以便更好地管理财务交易分类。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Space>
              <Button size="small" onClick={() => setIsInitModalVisible(true)}>
                立即初始化
              </Button>
            </Space>
          }
        />
      )}

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <TagOutlined /> 交易用途管理
              </Title>
              <Text type="secondary">管理财务交易用途分类 - 3层级体系</Text>
            </Col>
            <Col>
              <Space>
                {!isInitialized && (
                  <Button
                    type="primary"
                    icon={<SettingOutlined />}
                    onClick={() => setIsInitModalVisible(true)}
                  >
                    初始化3层级体系
                  </Button>
                )}
                <Button
                  type="default"
                  icon={<ReloadOutlined />}
                  onClick={handleResetThreeTier}
                  disabled={!isInitialized}
                >
                  重置体系
                </Button>
                <Button
                  type="primary"
                  icon={<SettingOutlined />}
                  onClick={() => setIsModalVisible(true)}
                >
                  创建用途记录
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={4}>
            <Card size="small">
              <Space>
                <TagOutlined />
                <Text strong>总用途数：{totalPurposes}</Text>
              </Space>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                <Text strong>启用用途：{activePurposes}</Text>
              </Space>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Space>
                <Tag color="blue">主要分类</Tag>
                <Text strong>主要分类：{rootPurposesCount}</Text>
              </Space>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Space>
                <Tag color="orange">业务分类</Tag>
                <Text strong>业务分类：{businessPurposesCount}</Text>
              </Space>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Space>
                <Tag color="green">具体用途</Tag>
                <Text strong>具体用途：{specificPurposesCount}</Text>
              </Space>
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Space>
                <Tag color={isInitialized ? 'green' : 'red'}>
                  {isInitialized ? '已初始化' : '未初始化'}
                </Tag>
                <Text strong>体系状态</Text>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 搜索和筛选 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col span={6}>
              <Input
                placeholder="搜索用途名称或描述"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="分类筛选"
                value={categoryFilter}
                onChange={setCategoryFilter}
                style={{ width: '100%' }}
              >
                <Option value="all">全部分类</Option>
                {purposeCategoryOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="状态筛选"
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
              >
                <Option value="all">全部状态</Option>
                <Option value="active">启用</Option>
                <Option value="inactive">停用</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="层级筛选"
                value={levelFilter}
                onChange={setLevelFilter}
                style={{ width: '100%' }}
              >
                <Option value="all">全部层级</Option>
                <Option value="0">主要分类</Option>
                <Option value="1">业务分类</Option>
                <Option value="2">具体用途</Option>
              </Select>
            </Col>
            <Col span={6}>
              <Space>
                <Button 
                  icon={<FilterOutlined />}
                  onClick={() => {
                    setSearchText('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setLevelFilter('all');
                  }}
                >
                  清除筛选
                </Button>
                <Text type="secondary">
                  显示 {filteredPurposes.length} / {purposes.length} 条记录
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 分类统计 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Text strong>分类统计：</Text>
          <Space wrap style={{ marginTop: 8 }}>
            {Object.entries(categoryCounts).map(([category, count]) => (
              <Tag key={category} color={getCategoryTagColor(category)}>
                {getCategoryLabel(category)}: {count}
              </Tag>
            ))}
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={treeData}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          scroll={{ x: 800 }}
          expandable={{
            defaultExpandAllRows: true,
            childrenColumnName: 'children',
          }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingPurpose ? '编辑用途记录' : '创建用途记录'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isActive: true,
          }}
        >
          <Form.Item
            name="name"
            label="用途名称"
            rules={[{ required: true, message: '请输入用途名称' }]}
          >
            <Input placeholder="请输入用途名称" />
          </Form.Item>

          <Form.Item
            name="parentId"
            label="父级分类"
            tooltip="选择父级分类将创建子级用途，不选择将创建顶级分类"
          >
            <Select 
              placeholder="请选择父级分类（可选）"
              allowClear
              showSearch
              optionFilterProp="children"
              value={selectedTransactionType}
              onChange={(value) => {
                setSelectedTransactionType(value);
                // 清空业务分类选择
                form.setFieldsValue({ category: undefined });
              }}
            >
              {rootPurposes.map(purpose => (
                <Option key={purpose.id} value={purpose.id}>
                  {purpose.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="category"
            label="业务分类"
            tooltip="选择业务分类将创建具体用途"
          >
            <Select 
              placeholder="请选择业务分类（可选）"
              allowClear
              showSearch
              optionFilterProp="children"
              disabled={!selectedTransactionType}
            >
              {getFilteredCategoryOptions(selectedTransactionType).map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              placeholder="请输入描述"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="停用"
            />
          </Form.Item>
        </Form>
      </Modal>



      {/* 初始化3层级体系模态框 */}
      <Modal
        title="初始化3层级交易用途体系"
        open={isInitModalVisible}
        onCancel={() => setIsInitModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsInitModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="init"
            type="primary"
            loading={initLoading}
            onClick={handleInitializeThreeTier}
          >
            开始初始化
          </Button>,
        ]}
        width={600}
        destroyOnHidden
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>3层级交易用途体系说明：</Text>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Text>第一层级 - 主要分类：</Text>
          <ul>
            <li>收入类</li>
            <li>支出类</li>
            <li>其他账户</li>
            <li>银行转账</li>
          </ul>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text>第二层级 - 业务分类：</Text>
          <ul>
            <li>会员费、项目收入、赞助收入、其他收入</li>
            <li>办公支出、项目支出、差旅费、其他支出</li>
            <li>OP/OR、JCIM、其他账户</li>
            <li>银行转账</li>
          </ul>
        </div>

        <div style={{ marginBottom: 16 }}>
          <Text>第三层级 - 具体用途：</Text>
          <ul>
            <li>按年份和具体业务细分的用途</li>
            <li>如：2025新会员费、2025项目收入等</li>
          </ul>
        </div>

        {initLoading && (
          <div style={{ marginTop: 16 }}>
            <Text>正在初始化...</Text>
            <Progress percent={initProgress} />
          </div>
        )}

        <Alert
          message="注意事项"
          description="初始化过程将创建完整的3层级交易用途体系，如果已存在部分数据，系统会跳过重复的用途。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Modal>
    </div>
  );
};

export default TransactionPurposeManagement;
