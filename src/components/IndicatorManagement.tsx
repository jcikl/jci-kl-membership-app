import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Modal,
  Table,
  Space,
  Typography,
  Row,
  Col,
  message,
  Popconfirm,
  Tree,
  Alert,
  Tag,
  Tooltip
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  TrophyOutlined,
  StarOutlined,
  GiftOutlined,
  SendOutlined
} from '@ant-design/icons';

// Helper function to safely parse dates
const safeParseDate = (dateString: string | undefined, format?: string): dayjs.Dayjs | undefined => {
  if (!dateString) return undefined;
  try {
    const parsed = format ? dayjs(dateString, format) : dayjs(dateString);
    return parsed.isValid() ? parsed : undefined;
  } catch (error) {
    return undefined;
  }
};
import { 
  Indicator, 
  AwardCategory,
  IndicatorLevel,
  IndicatorType,
  IndicatorStatus 
} from '@/types/awards';
import { indicatorService } from '@/services/indicatorService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface IndicatorManagementProps {
  year?: number;
}

const IndicatorManagement: React.FC<IndicatorManagementProps> = ({
  year = new Date().getFullYear()
}) => {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(null);
  const [form] = Form.useForm();
  const [treeData, setTreeData] = useState<any[]>([]);

  useEffect(() => {
    loadIndicators();
  }, [year]);

  const loadIndicators = async () => {
    try {
      setLoading(true);
      const [flatIndicators, hierarchyIndicators] = await Promise.all([
        indicatorService.getIndicatorsByYear(year),
        indicatorService.getIndicatorHierarchy(year)
      ]);
      
      setIndicators(flatIndicators);
      buildTreeData(hierarchyIndicators);
    } catch (error) {
      message.error('加载指标数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const buildTreeData = (hierarchy: Indicator[]) => {
    const buildNode = (indicator: Indicator): any => ({
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Text strong>{indicator.title}</Text>
            <div style={{ marginTop: 4 }}>
              <Tag color="blue">Level {indicator.level}</Tag>
              <Tag color="green">{indicator.type}</Tag>
              <Tag color={indicator.status === 'active' ? 'green' : 'default'}>
                {indicator.status}
              </Tag>
            </div>
          </div>
          <Space>
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEdit(indicator)}
              />
            </Tooltip>
            <Tooltip title="Delete">
              <Popconfirm
                title="确定要删除这个指标吗？"
                onConfirm={() => handleDelete(indicator.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </Tooltip>
          </Space>
        </div>
      ),
      key: indicator.id,
      children: indicator.children?.map(child => buildNode(child))
    });

    setTreeData(hierarchy.map(indicator => buildNode(indicator)));
  };

  const handleCreate = () => {
    setEditingIndicator(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (indicator: Indicator) => {
    setEditingIndicator(indicator);
    form.setFieldsValue({
      ...indicator,
      deadline: safeParseDate(indicator.deadline, 'YYYY-MM-DD')
    });
    setModalVisible(true);
  };

  const handleDelete = async (indicatorId: string) => {
    try {
      await indicatorService.deleteIndicator(indicatorId);
      message.success('指标删除成功');
      loadIndicators();
    } catch (error) {
      message.error('删除指标失败');
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const indicatorData: Omit<Indicator, 'id' | 'createdAt' | 'updatedAt'> = {
        // 基本字段
        title: values.title || '',
        description: values.description || '',
        detailedExplanation: values.detailedExplanation || '',
        scoringConditions: values.scoringConditions || '',
        responsiblePerson: values.responsiblePerson || '',
        deadline: values.deadline ? values.deadline.format('YYYY-MM-DD') : '',
        year,
        category: values.category || 'efficient_star',
        level: values.level || 1,
        type: values.type || 'participation',
        status: values.status || 'draft',
        
        // 分数设置
        targetScore: values.targetScore || 0,
        maxScore: values.maxScore || 0,
        participationScore: values.participationScore || 0,
        attendanceScore: 0, // 默认值
        
        // 层级关系 - 确保不传递undefined
        parentId: values.parentId || null,
        children: [],
        relatedActivities: [],
        
        // 元数据
        createdBy: 'current_user',
        updatedBy: 'current_user'
      };

      if (editingIndicator) {
        await indicatorService.updateIndicator(editingIndicator.id, indicatorData);
        message.success('指标更新成功');
      } else {
        await indicatorService.createIndicator(indicatorData);
        message.success('指标创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadIndicators();
    } catch (error) {
      message.error('保存指标失败');
      console.error(error);
    }
  };

  const getCategoryIcon = (category: AwardCategory) => {
    switch (category) {
      case 'efficient_star':
        return <StarOutlined style={{ color: '#722ed1' }} />;
      case 'star_point':
        return <GiftOutlined style={{ color: '#52c41a' }} />;
      case 'national_area_incentive':
        return <SendOutlined style={{ color: '#1890ff' }} />;
      case 'e_awards':
        return <TrophyOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <TrophyOutlined />;
    }
  };

  const getCategoryName = (category: AwardCategory) => {
    switch (category) {
      case 'efficient_star':
        return 'Efficient Star';
      case 'star_point':
        return 'Star Point';
      case 'national_area_incentive':
        return 'National & Area Incentive';
      case 'e_awards':
        return 'E-Awards';
      default:
        return category;
    }
  };

  const getLevelTag = (level: IndicatorLevel) => {
    const colors = ['#f50', '#2db7f5', '#87d068', '#108ee9'];
    return <Tag color={colors[level - 1]}>Level {level}</Tag>;
  };

  const getTypeTag = (type: IndicatorType) => {
    const colorMap: Record<IndicatorType, string> = {
      participation: 'blue',
      attendance: 'green',
      leadership: 'purple',
      community_service: 'orange',
      networking: 'cyan',
      training: 'magenta',
      project: 'red',
      other: 'default'
    };
    return <Tag color={colorMap[type]}>{type.replace('_', ' ').toUpperCase()}</Tag>;
  };

  const getStatusTag = (status: IndicatorStatus) => {
    const colorMap: Record<IndicatorStatus, string> = {
      draft: 'default',
      active: 'green',
      completed: 'blue',
      archived: 'gray',
      cancelled: 'red'
    };
    return <Tag color={colorMap[status]}>{status.toUpperCase()}</Tag>;
  };

  // 移除权限检查，允许所有用户访问

  return (
    <div>
      {/* 移除权限提示，允许所有用户进行CRUD操作 */}
      {/* 页面标题和操作按钮 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={2} style={{ marginBottom: 0 }}>
              <SettingOutlined style={{ marginRight: 8 }} />
              Indicator Management - {year}
            </Title>
            <Text type="secondary">管理年度指标和层级结构</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Create Indicator
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 层级结构视图 */}
      <Card title="Indicator Hierarchy" style={{ marginBottom: 24 }}>
        <Alert
          message="层级结构说明"
          description="Level 1: 主要类别 | Level 2: 子类别 | Level 3: 具体指标 | Level 4: 详细任务"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Tree
          treeData={treeData}
          defaultExpandAll
          showLine={{ showLeafIcon: false }}
        />
      </Card>

      {/* 指标列表 */}
      <Card title="All Indicators">
        <Table
          dataSource={indicators}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1400 }}
        >
          <Table.Column
            title="Level"
            dataIndex="level"
            width={80}
            align="center"
            render={(level) => getLevelTag(level)}
          />
          
          <Table.Column
            title="Category"
            dataIndex="category"
            width={120}
            render={(category) => (
              <Space>
                {getCategoryIcon(category)}
                <Text>{getCategoryName(category)}</Text>
              </Space>
            )}
          />
          
          <Table.Column
            title="Title"
            dataIndex="title"
            render={(title, record: Indicator) => (
              <div>
                <Text strong>{title}</Text>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {record.description}
                  </Text>
                </div>
              </div>
            )}
          />
          
          <Table.Column
            title="Type"
            dataIndex="type"
            width={120}
            render={(type) => getTypeTag(type)}
          />
          
          <Table.Column
            title="Status"
            dataIndex="status"
            width={100}
            render={(status) => getStatusTag(status)}
          />
          
          <Table.Column
            title="Target Score"
            dataIndex="targetScore"
            width={100}
            align="center"
            render={(score) => (
              <Text strong style={{ color: '#1890ff' }}>{score}</Text>
            )}
          />
          
          <Table.Column
            title="Max Score"
            dataIndex="maxScore"
            width={100}
            align="center"
            render={(score) => (
              <Text style={{ color: '#52c41a' }}>{score}</Text>
            )}
          />
          
          <Table.Column
            title="Responsible"
            dataIndex="responsiblePerson"
            width={120}
          />
          
          <Table.Column
            title="Deadline"
            dataIndex="deadline"
            width={120}
            align="center"
          />
          
          <Table.Column
            title="Actions"
            width={120}
            align="center"
            render={(_, record: Indicator) => (
              <Space>
                <Tooltip title="View Details">
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      // 查看详情功能
                      message.info('查看详情功能开发中...');
                    }}
                  />
                </Tooltip>
                <Tooltip title="Edit">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <Popconfirm
                    title="确定要删除这个指标吗？"
                    onConfirm={() => handleDelete(record.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                    />
                  </Popconfirm>
                </Tooltip>
              </Space>
            )}
          />
        </Table>
      </Card>

      {/* 创建/编辑指标模态框 */}
      <Modal
        title={editingIndicator ? 'Edit Indicator' : 'Create Indicator'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={800}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: '请输入指标标题' }]}
              >
                <Input placeholder="指标标题" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: '请选择奖励类别' }]}
              >
                <Select placeholder="选择奖励类别">
                  <Option value="efficient_star">Efficient Star</Option>
                  <Option value="star_point">Star Point</Option>
                  <Option value="national_area_incentive">National & Area Incentive</Option>
                  <Option value="e_awards">E-Awards</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="level"
                label="Level"
                rules={[{ required: true, message: '请选择指标层级' }]}
              >
                <Select placeholder="选择层级">
                  <Option value={1}>Level 1 - 主要类别</Option>
                  <Option value={2}>Level 2 - 子类别</Option>
                  <Option value={3}>Level 3 - 具体指标</Option>
                  <Option value={4}>Level 4 - 详细任务</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: '请选择指标类型' }]}
              >
                <Select placeholder="选择类型">
                  <Option value="participation">Participation</Option>
                  <Option value="attendance">Attendance</Option>
                  <Option value="leadership">Leadership</Option>
                  <Option value="community_service">Community Service</Option>
                  <Option value="networking">Networking</Option>
                  <Option value="training">Training</Option>
                  <Option value="project">Project</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="选择状态">
                  <Option value="draft">Draft</Option>
                  <Option value="active">Active</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="archived">Archived</Option>
                  <Option value="cancelled">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: '请输入指标描述' }]}
          >
            <TextArea rows={3} placeholder="指标简要描述" />
          </Form.Item>

          <Form.Item
            name="detailedExplanation"
            label="Detailed Explanation"
          >
            <TextArea rows={4} placeholder="详细解释和说明" />
          </Form.Item>

          <Form.Item
            name="scoringConditions"
            label="Scoring Conditions"
            rules={[{ required: true, message: '请输入得分条件' }]}
          >
            <TextArea rows={3} placeholder="得分条件和规则" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="targetScore"
                label="Target Score"
                rules={[{ required: true, message: '请输入目标分数' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  placeholder="目标分数" 
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="maxScore"
                label="Max Score"
                rules={[{ required: true, message: '请输入最高分数' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  placeholder="最高分数" 
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="participationScore"
                label="Participation Score"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  placeholder="参与分数" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="responsiblePerson"
                label="Responsible Person"
                rules={[{ required: true, message: '请输入负责人' }]}
              >
                <Input placeholder="负责人姓名" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="deadline"
                label="Deadline"
                rules={[{ required: true, message: '请选择截止日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="parentId"
            label="Parent Indicator"
          >
            <Select 
              placeholder="选择父级指标（可选）"
              allowClear
            >
              {indicators
                .filter(indicator => indicator.level < 4)
                .map(indicator => (
                  <Option key={indicator.id} value={indicator.id}>
                    Level {indicator.level}: {indicator.title}
                  </Option>
                ))
              }
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IndicatorManagement;
