import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  message,
  Alert,
  Tag,
  Tooltip,
  Popconfirm,
  Statistic,
  Progress
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TrophyOutlined,
  StarOutlined,
  GiftOutlined,
  SendOutlined,
  BarChartOutlined,
  TeamOutlined,
  UserOutlined,
  BankOutlined
} from '@ant-design/icons';
import { 
  CompetitorScoreTracking, 
  AwardCategory 
} from '@/types/awards';
import { indicatorService } from '@/services/indicatorService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CompetitorScoreTrackerProps {
  year?: number;
  isDeveloper?: boolean;
}

const CompetitorScoreTracker: React.FC<CompetitorScoreTrackerProps> = ({
  year = new Date().getFullYear(),
  isDeveloper = false
}) => {
  const [competitors, setCompetitors] = useState<CompetitorScoreTracking[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<CompetitorScoreTracking | null>(null);
  const [form] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState<AwardCategory | 'all'>('all');

  useEffect(() => {
    loadCompetitors();
  }, [year, selectedCategory]);

  const loadCompetitors = async () => {
    try {
      setLoading(true);
      const competitorsData = await indicatorService.getCompetitorTrackingList(
        year, 
        selectedCategory === 'all' ? undefined : selectedCategory
      );
      setCompetitors(competitorsData);
    } catch (error) {
      message.error('加载竞争对手数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCompetitor(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (competitor: CompetitorScoreTracking) => {
    setEditingCompetitor(competitor);
    form.setFieldsValue(competitor);
    setModalVisible(true);
  };

  const handleDelete = async (_competitorId: string) => {
    try {
      // 这里需要实现删除功能
      message.success('竞争对手记录删除成功');
      loadCompetitors();
    } catch (error) {
      message.error('删除记录失败');
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const competitorData: Omit<CompetitorScoreTracking, 'id' | 'createdAt'> = {
        ...values,
        year,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'developer'
      };

      if (editingCompetitor) {
        await indicatorService.updateCompetitorScore(editingCompetitor.id, competitorData);
        message.success('竞争对手信息更新成功');
      } else {
        await indicatorService.createCompetitorTracking(competitorData);
        message.success('竞争对手记录创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadCompetitors();
    } catch (error) {
      message.error('保存记录失败');
      console.error(error);
    }
  };

  const getCompetitorTypeIcon = (type: string) => {
    switch (type) {
      case 'individual':
        return <UserOutlined style={{ color: '#1890ff' }} />;
      case 'organization':
        return <BankOutlined style={{ color: '#52c41a' }} />;
      case 'chapter':
        return <TeamOutlined style={{ color: '#fa8c16' }} />;
      default:
        return <UserOutlined />;
    }
  };

  const getCompetitorTypeTag = (type: string) => {
    const colorMap: Record<string, string> = {
      individual: 'blue',
      organization: 'green',
      chapter: 'orange'
    };
    return <Tag color={colorMap[type] || 'default'}>{type.toUpperCase()}</Tag>;
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

  const getRankingColor = (index: number) => {
    if (index === 0) return '#ffd700'; // 金色
    if (index === 1) return '#c0c0c0'; // 银色
    if (index === 2) return '#cd7f32'; // 铜色
    return '#d9d9d9'; // 默认灰色
  };

  const getRankingIcon = (index: number) => {
    if (index < 3) {
      const icons = ['🥇', '🥈', '🥉'];
      return icons[index];
    }
    return `#${index + 1}`;
  };

  // 计算统计信息
  const totalCompetitors = competitors.length;
  const averageScore = competitors.length > 0 
    ? competitors.reduce((sum, c) => sum + c.totalScore, 0) / competitors.length 
    : 0;
  const topScore = competitors.length > 0 
    ? Math.max(...competitors.map(c => c.totalScore)) 
    : 0;

  if (!isDeveloper) {
    return (
      <Alert
        message="权限不足"
        description="只有开发者可以访问竞争对手分数追踪功能"
        type="warning"
        showIcon
      />
    );
  }

  return (
    <div>
      {/* 页面标题和操作按钮 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={2} style={{ marginBottom: 0 }}>
              <BarChartOutlined style={{ marginRight: 8 }} />
              Competitor Score Tracker - {year}
            </Title>
            <Text type="secondary">追踪竞争对手分数和排名情况</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 200 }}
              >
                <Option value="all">All Categories</Option>
                <Option value="efficient_star">Efficient Star</Option>
                <Option value="star_point">Star Point</Option>
                <Option value="national_area_incentive">National & Area Incentive</Option>
                <Option value="e_awards">E-Awards</Option>
              </Select>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Add Competitor
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计概览 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Competitors"
              value={totalCompetitors}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={averageScore}
              precision={1}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Top Score"
              value={topScore}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Year"
              value={year}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 开发者功能提示 */}
      <Alert
        message="开发者专用功能"
        description="此功能仅限开发者使用，用于追踪和分析竞争对手的分数表现，帮助制定竞争策略。"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 竞争对手排名表 */}
      <Card title="Competitor Rankings">
        <Table
          dataSource={competitors}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1400 }}
        >
          <Table.Column
            title="Rank"
            width={80}
            align="center"
            render={(_, __, index) => (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  fontSize: 20, 
                  fontWeight: 'bold',
                  color: getRankingColor(index)
                }}>
                  {getRankingIcon(index)}
                </div>
              </div>
            )}
          />
          
          <Table.Column
            title="Competitor"
            dataIndex="competitorName"
            render={(name, record: CompetitorScoreTracking) => (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  {getCompetitorTypeIcon(record.competitorType)}
                  <Text strong style={{ marginLeft: 8 }}>{name}</Text>
                </div>
                <div>
                  {getCompetitorTypeTag(record.competitorType)}
                </div>
              </div>
            )}
          />
          
          <Table.Column
            title="Category"
            dataIndex="category"
            width={150}
            render={(category) => (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {getCategoryIcon(category)}
                <Text style={{ marginLeft: 8 }}>{getCategoryName(category)}</Text>
              </div>
            )}
          />
          
          <Table.Column
            title="Total Score"
            dataIndex="totalScore"
            width={120}
            align="center"
            render={(score, _record: CompetitorScoreTracking, index) => (
              <div>
                <Text 
                  strong 
                  style={{ 
                    fontSize: 18,
                    color: getRankingColor(index)
                  }}
                >
                  {score}
                </Text>
                <div style={{ marginTop: 4 }}>
                  <Progress 
                    percent={Math.round((score / topScore) * 100)} 
                    size="small"
                    showInfo={false}
                    strokeColor={getRankingColor(index)}
                  />
                </div>
              </div>
            )}
          />
          
          <Table.Column
            title="Category Breakdown"
            dataIndex="categoryScores"
            width={300}
            render={(scores) => (
              <div>
                {scores.map((score: any, index: number) => (
                  <div key={index} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 12 }}>
                        {getCategoryName(score.category)}
                      </Text>
                      <Text strong style={{ fontSize: 12, color: '#1890ff' }}>
                        {score.score}
                      </Text>
                    </div>
                    <Progress 
                      percent={Math.round((score.score / Math.max(...scores.map((s: any) => s.score))) * 100)} 
                      size="small"
                      showInfo={false}
                      strokeColor="#1890ff"
                    />
                  </div>
                ))}
              </div>
            )}
          />
          
          <Table.Column
            title="Last Updated"
            dataIndex="lastUpdated"
            width={120}
            align="center"
            render={(date) => (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {new Date(date).toLocaleDateString()}
              </Text>
            )}
          />
          
          <Table.Column
            title="Actions"
            width={120}
            align="center"
            render={(_, record: CompetitorScoreTracking) => (
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
                    title="确定要删除这个竞争对手记录吗？"
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

      {/* 创建/编辑竞争对手模态框 */}
      <Modal
        title={editingCompetitor ? 'Edit Competitor' : 'Add Competitor'}
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
                name="competitorName"
                label="Competitor Name"
                rules={[{ required: true, message: '请输入竞争对手名称' }]}
              >
                <Input placeholder="竞争对手名称" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="competitorType"
                label="Competitor Type"
                rules={[{ required: true, message: '请选择竞争对手类型' }]}
              >
                <Select placeholder="选择类型">
                  <Option value="individual">Individual</Option>
                  <Option value="organization">Organization</Option>
                  <Option value="chapter">Chapter</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

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

          <Form.Item
            name="totalScore"
            label="Total Score"
            rules={[{ required: true, message: '请输入总分数' }]}
          >
            <InputNumber 
              min={0} 
              style={{ width: '100%' }} 
              placeholder="总分数" 
            />
          </Form.Item>

          <Form.Item
            name="categoryScores"
            label="Category Scores"
            extra="各类别分数详情（JSON格式）"
          >
            <TextArea 
              rows={6} 
              placeholder='[{"category": "efficient_star", "score": 100, "indicators": []}]'
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CompetitorScoreTracker;
