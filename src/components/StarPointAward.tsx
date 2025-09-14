import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  Input,
  Typography,
  Row,
  Col,
  Progress,
  message,
  Alert,
  Collapse,
} from 'antd';
import {
  StarOutlined,
  GlobalOutlined,
  ExperimentOutlined,
  TeamOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { StarPointAward, StarCategory, StarActivity } from '@/types/awards';
import { awardService } from '@/services/awardService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface StarPointAwardProps {
  year?: number;
  memberId?: string;
  isAdmin?: boolean;
}

const StarPointAwardComponent: React.FC<StarPointAwardProps> = ({
  year = new Date().getFullYear(),
  memberId
}) => {
  const [award, setAward] = useState<StarPointAward | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<StarActivity | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StarCategory | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAward();
  }, [year]);

  const loadAward = async () => {
    try {
      setLoading(true);
      const awardData = await awardService.getStarPointAward(year);
      setAward(awardData);
    } catch (error) {
      message.error('加载Star Point奖励失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedActivity && selectedCategory && memberId) {
        await awardService.updateStarPointScore(
          award!.id,
          memberId,
          values.score,
          values.evidence ? [values.evidence] : []
        );
        
        message.success('分数提交成功');
        setScoreModalVisible(false);
        form.resetFields();
        loadAward(); // 重新加载数据
      }
    } catch (error) {
      message.error('提交分数失败');
      console.error(error);
    }
  };

  const getStarIcon = (type: string) => {
    switch (type) {
      case 'network_star':
        return <GlobalOutlined style={{ color: '#1890ff' }} />;
      case 'experience_star':
        return <ExperimentOutlined style={{ color: '#52c41a' }} />;
      case 'outreach_star':
        return <TeamOutlined style={{ color: '#fa8c16' }} />;
      case 'social_star':
        return <HeartOutlined style={{ color: '#eb2f96' }} />;
      default:
        return <StarOutlined />;
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


  if (loading) {
    return <Card loading />;
  }

  const initializeAward = async () => {
    try {
      setLoading(true);
      const awardData = {
        title: `${year} JCI Malaysia Star Point Award`,
        description: 'The JCI Malaysia Star Point Award recognizes members who excel in various areas of personal and professional development.',
        category: 'star_point' as const,
        year: year,
        status: 'active' as const,
        totalScore: 100,
        currentScore: 0,
        deadline: '2025-12-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        terms: [
          'Members must be active JCI members',
          'Points are awarded based on participation and achievement',
          'Minimum 50 points required for qualification',
          'All activities must be documented with evidence'
        ],
        starCategories: [
          {
            id: 'network_star',
            type: 'network_star' as const,
            title: 'Network Star',
            description: 'Recognition for networking excellence',
            objective: 'To encourage members to build professional networks',
            points: 25,
            myPoints: 0,
            note: 'Points awarded for networking events and professional connections',
            activities: [
              {
                id: 'net_1',
                no: 1,
                title: 'Attend networking events',
                description: 'Participate in professional networking events',
                score: '5 points',
                guidelines: 'https://example.com/networking',
                status: 'pending' as const
              },
              {
                id: 'net_2',
                no: 2,
                title: 'Professional connections',
                description: 'Make meaningful professional connections',
                score: '10 points',
                guidelines: 'https://example.com/connections',
                status: 'pending' as const
              }
            ]
          },
          {
            id: 'experience_star',
            type: 'experience_star' as const,
            title: 'Experience Star',
            description: 'Recognition for experiential learning',
            objective: 'To promote hands-on learning experiences',
            points: 25,
            myPoints: 0,
            note: 'Points awarded for experiential learning activities',
            activities: [
              {
                id: 'exp_1',
                no: 1,
                title: 'Workshop participation',
                description: 'Participate in skill development workshops',
                score: '15 points',
                guidelines: 'https://example.com/workshops',
                status: 'pending' as const
              },
              {
                id: 'exp_2',
                no: 2,
                title: 'Mentorship program',
                description: 'Participate in mentorship activities',
                score: '10 points',
                guidelines: 'https://example.com/mentorship',
                status: 'pending' as const
              }
            ]
          }
        ]
      };
      
      await awardService.saveStarPointAward(awardData);
      message.success('Star Point奖励配置初始化成功');
      loadAward();
    } catch (error) {
      message.error('初始化奖励配置失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!award) {
    return (
      <Card>
        <Alert
          message="暂无Star Point奖励配置"
          description="请点击下方按钮初始化当年的Star Point奖励标准"
          type="info"
          showIcon
          action={
            <Button type="primary" onClick={initializeAward} loading={loading}>
              初始化奖励配置
            </Button>
          }
        />
      </Card>
    );
  }

  const totalPoints = award.starCategories.reduce((sum, category) => sum + category.points, 0);
  const currentPoints = award.starCategories.reduce((sum, category) => sum + category.myPoints, 0);
  const currentPercentage = totalPoints > 0 ? (currentPoints / totalPoints) * 100 : 0;

  return (
    <div>
      {/* 奖励概览 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={16}>
            <Title level={2} style={{ marginBottom: 16 }}>
              {year} JCI Malaysia Star Point Award
            </Title>
            
            {/* 介绍 */}
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ marginBottom: 8 }}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                Introduction
              </Title>
              <Paragraph>
                {award.description}
              </Paragraph>
            </Card>

            {/* 条款和条件 */}
            <Card size="small">
              <Title level={5} style={{ marginBottom: 8 }}>
                Terms & Condition
              </Title>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {award.terms.map((term, index) => (
                  <li key={index} style={{ marginBottom: 8 }}>
                    <Text>{term}</Text>
                  </li>
                ))}
              </ul>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card style={{ textAlign: 'center' }}>
              <Title level={4}>Total Score</Title>
              <Progress
                type="circle"
                percent={Math.round(currentPercentage)}
                strokeColor="#722ed1"
                format={() => `${Math.round(currentPercentage)}%`}
                size={120}
              />
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ color: '#722ed1' }}>
                  {currentPoints} / {totalPoints} Points
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Star Categories */}
      <Collapse 
        defaultActiveKey={['0']} 
        ghost
        items={award.starCategories.map((category, categoryIndex) => ({
          key: categoryIndex.toString(),
          label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {getStarIcon(category.type)}
                <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                  {getStarTitle(category.type)} - [{category.myPoints} point{category.myPoints !== 1 ? 's' : ''}]
                </span>
              </div>
              <div>
                <Text type="secondary">
                  {category.myPoints} / {category.points} Points
                </Text>
              </div>
            </div>
          ),
          children: (
            <>
              <Card size="small" style={{ marginBottom: 16 }}>
                <Paragraph style={{ marginBottom: 8 }}>
                  <Text strong>Description:</Text> {category.description}
                </Paragraph>
                <Paragraph style={{ marginBottom: 8 }}>
                  <Text strong>Objective:</Text> {category.objective}
                </Paragraph>
                {category.note && (
                  <Alert
                    message="Note"
                    description={category.note}
                    type="warning"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Card>

              <Table
                dataSource={category.activities}
                rowKey="id"
                pagination={false}
                size="small"
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
                      <Text type="secondary">{record.description}</Text>
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
                    record.myScore !== undefined ? (
                      <Text strong style={{ color: '#52c41a' }}>
                        {record.myScore}
                      </Text>
                    ) : (
                      <Text type="secondary">-</Text>
                    )
                  )}
                />
                
                <Table.Column
                  title="ACTION"
                  width={100}
                  align="center"
                  render={(_, record: StarActivity) => (
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
                  )}
                />
              </Table>
            </>
          )
        }))}
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

export default StarPointAwardComponent;
