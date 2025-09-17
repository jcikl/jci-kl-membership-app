import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Space,
  Typography,
  Row,
  Col,
  Progress,
  Tag,
  message,
  Alert,
  Collapse,
  Timeline,
} from 'antd';
import {
  GlobalOutlined,
  ExperimentOutlined,
  TeamOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { StarCategory, StarActivity } from '@/types/awards';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface StarPointCategoriesProps {
  categories: StarCategory[];
  onScoreUpdate?: (categoryId: string, activityId: string, score: number, evidence?: string[]) => void;
  memberId?: string;
  isAdmin?: boolean;
}

const StarPointCategoriesComponent: React.FC<StarPointCategoriesProps> = ({
  categories,
  onScoreUpdate,
  memberId
}) => {
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<StarActivity | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StarCategory | null>(null);
  const [form] = Form.useForm();

  const handleScoreSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedActivity && selectedCategory && onScoreUpdate) {
        await onScoreUpdate(
          selectedCategory.id,
          selectedActivity.id,
          values.score,
          values.evidence ? [values.evidence] : []
        );
        
        message.success('分数提交成功');
        setScoreModalVisible(false);
        form.resetFields();
      }
    } catch (error) {
      message.error('提交分数失败');
      console.error(error);
    }
  };

  const getStarIcon = (type: string) => {
    switch (type) {
      case 'network_star':
        return <GlobalOutlined style={{ color: '#1890ff', fontSize: 20 }} />;
      case 'experience_star':
        return <ExperimentOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
      case 'outreach_star':
        return <TeamOutlined style={{ color: '#fa8c16', fontSize: 20 }} />;
      case 'social_star':
        return <HeartOutlined style={{ color: '#eb2f96', fontSize: 20 }} />;
      default:
        return <TrophyOutlined style={{ fontSize: 20 }} />;
    }
  };

  const getStarTitle = (type: string) => {
    switch (type) {
      case 'network_star':
        return 'NETWORK STAR';
      case 'experience_star':
        return 'EXPERIENCE STAR';
      case 'outreach_star':
        return 'OUTREACH STAR';
      case 'social_star':
        return 'SOCIAL STAR';
      default:
        return 'STAR';
    }
  };

  const getStarDescription = (type: string) => {
    switch (type) {
      case 'network_star':
        return 'Part of becoming an enterprising leader is about being an effective networker. Active participation in JCI, JCI Malaysia and Area events provides members a chance to travel to new places, experience new concepts and become a better leader while meeting other young leaders making a difference all around Malaysia and the world.';
      case 'experience_star':
        return 'Experience is the best teacher. Through various JCI programs and activities, members gain valuable experience that helps them grow as leaders and contribute to their communities.';
      case 'outreach_star':
        return 'Outreach activities help members connect with the community and make a positive impact. These activities demonstrate leadership and social responsibility.';
      case 'social_star':
        return 'Social activities foster camaraderie and build strong relationships among members. These activities create a supportive environment for personal and professional growth.';
      default:
        return '';
    }
  };

  const getStarObjective = (type: string) => {
    switch (type) {
      case 'network_star':
        return 'To encourage members to actively participate in JCI / JCIM events and enhance their networking and social skills throughout the events.';
      case 'experience_star':
        return 'To provide members with diverse experiences that enhance their leadership skills and personal development.';
      case 'outreach_star':
        return 'To engage members in community outreach activities that demonstrate leadership and social responsibility.';
      case 'social_star':
        return 'To foster social connections and build strong relationships among members through various social activities.';
      default:
        return '';
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag>;
      case 'overdue':
        return <Tag color="red" icon={<ExclamationCircleOutlined />}>已逾期</Tag>;
      default:
        return <Tag color="orange" icon={<ClockCircleOutlined />}>进行中</Tag>;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return '#52c41a';
    if (percentage >= 75) return '#1890ff';
    if (percentage >= 50) return '#fa8c16';
    return '#f5222d';
  };

  return (
    <div>
      <Collapse 
        defaultActiveKey={['0']} 
        ghost
        items={categories.map((category, categoryIndex) => {
          const progressPercentage = category.points > 0 ? (category.myPoints / category.points) * 100 : 0;
          
          return {
            key: categoryIndex.toString(),
            label: (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {getStarIcon(category.type)}
                  <span style={{ marginLeft: 12, fontWeight: 'bold', fontSize: 16 }}>
                    {getStarTitle(category.type)} - [{category.myPoints} point{category.myPoints !== 1 ? 's' : ''}]
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Progress
                    type="circle"
                    percent={Math.round(progressPercentage)}
                    size={40}
                    strokeColor={getProgressColor(progressPercentage)}
                    format={() => `${category.myPoints}`}
                  />
                  <span style={{ marginLeft: 8, fontSize: 14 }}>
                    / {category.points} Points
                  </span>
                </div>
              </div>
            ),
            children: (
              <>
                {/* 分类描述和目标 */}
                <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Paragraph style={{ marginBottom: 8 }}>
                        <Text strong>Description:</Text>
                      </Paragraph>
                      <Paragraph style={{ fontSize: 14, color: '#666' }}>
                        {getStarDescription(category.type)}
                      </Paragraph>
                    </Col>
                    <Col span={12}>
                      <Paragraph style={{ marginBottom: 8 }}>
                        <Text strong>Objective:</Text>
                      </Paragraph>
                      <Paragraph style={{ fontSize: 14, color: '#666' }}>
                        {getStarObjective(category.type)}
                      </Paragraph>
                    </Col>
                  </Row>
                  
                  {category.note && (
                    <Alert
                      message="Note"
                      description={category.note}
                      type="warning"
                      showIcon
                      style={{ marginTop: 12 }}
                    />
                  )}
                </Card>

                {/* 活动列表 */}
                <Table
                  dataSource={category.activities}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  scroll={{ x: 1000 }}
                >
                  <Table.Column
                    title="NO."
                    dataIndex="no"
                    width={60}
                    align="center"
                  />
                  
                  <Table.Column
                    title="DETAILS"
                    dataIndex="title"
                    render={(title, record: StarActivity) => (
                      <div>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong>{title}</Text>
                          {record.guidelines && (
                            <Button
                              type="link"
                              size="small"
                              icon={<FileTextOutlined />}
                              style={{ marginLeft: 8 }}
                            >
                              Guideline
                            </Button>
                          )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {record.description}
                        </Text>
                        {record.deadline && (
                          <div style={{ marginTop: 4 }}>
                            <CalendarOutlined style={{ marginRight: 4 }} />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Deadline: {record.deadline}
                            </Text>
                          </div>
                        )}
                      </div>
                    )}
                  />
                  
                  <Table.Column
                    title="SCORE"
                    dataIndex="score"
                    width={200}
                    render={(score) => (
                      <Text style={{ fontSize: 12 }}>{score}</Text>
                    )}
                  />
                  
                  <Table.Column
                    title="MY SCORE"
                    width={100}
                    align="center"
                    render={(_, record: StarActivity) => (
                      <div>
                        {record.myScore !== undefined ? (
                          <div>
                            <Text strong style={{ color: '#52c41a', fontSize: 14 }}>
                              {record.myScore}
                            </Text>
                            <div>
                              {getStatusTag(record.status)}
                            </div>
                          </div>
                        ) : (
                          <Text type="secondary">-</Text>
                        )}
                      </div>
                    )}
                  />
                  
                  <Table.Column
                    title="ACTION"
                    width={120}
                    align="center"
                    render={(_, record: StarActivity) => (
                      <Space>
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => {
                            setSelectedActivity(record);
                            setSelectedCategory(category);
                            setScoreModalVisible(true);
                          }}
                          disabled={!memberId}
                        >
                          View
                        </Button>
                        {record.guidelines && (
                          <Button
                            size="small"
                            icon={<FileTextOutlined />}
                          >
                            Guide
                          </Button>
                        )}
                      </Space>
                    )}
                  />
                </Table>

                {/* 活动时间线 */}
                <Card size="small" style={{ marginTop: 16 }}>
                  <Title level={5}>Activity Timeline</Title>
                  <Timeline>
                    {category.activities.map((activity) => (
                      <Timeline.Item
                        key={activity.id}
                        color={activity.myScore !== undefined ? 'green' : 'blue'}
                        dot={activity.myScore !== undefined ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      >
                        <div>
                          <Text strong>{activity.title}</Text>
                          {activity.myScore !== undefined && (
                            <Tag color="green" style={{ marginLeft: 8 }}>
                              {activity.myScore} points
                            </Tag>
                          )}
                        </div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {activity.description}
                        </Text>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              </>
            )
          };
        })}
      />

      {/* 分数提交模态框 */}
      <Modal
        title={`提交分数 - ${selectedActivity?.title}`}
        open={scoreModalVisible}
        onOk={handleScoreSubmit}
        onCancel={() => {
          setScoreModalVisible(false);
          form.resetFields();
        }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="score"
            label="分数"
            rules={[{ required: true, message: '请输入分数' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="请输入分数"
            />
          </Form.Item>
          
          <Form.Item
            name="evidence"
            label="证据/说明"
          >
            <TextArea
              rows={4}
              placeholder="请提供相关证据或说明"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StarPointCategoriesComponent;
