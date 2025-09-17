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
import { awardService } from '@/modules/award/services/awardService';

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
      // 从awards collection获取基础奖励信息
      const awardData = await awardService.getStarPointAward('network_star', year);
      
      // 从standards collection获取所有Star Point类别的standards数据
      const starCategories = ['network_star', 'experience_star', 'outreach_star', 'social_star'];
      const allStandards = [];
      
      for (const category of starCategories) {
        const categoryStandards = await awardService.getStandardsByCategoryAndYear(category as any, year);
        allStandards.push(...categoryStandards);
      }
      
      // 合并数据
      if (awardData) {
        const updatedAward = {
          ...awardData,
          standards: allStandards,
          categories: starCategories
        };
        setAward(updatedAward);
      } else {
        setAward(null);
      }
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
        category: 'network_star' as const,
        year: year,
        status: 'active' as const,
        starType: 'network_star' as const,
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
        standards: [
          {
            id: 'network_star_1',
            no: 1,
            title: 'Attend networking events',
            description: 'Participate in professional networking events',
            category: 'network_star',
            type: 'network_star',
            objective: 'To encourage members to build professional networks',
            points: 5,
            score: 5,
            deadline: '2025-12-31',
            guidelines: 'https://example.com/networking',
            status: 'pending' as const
          },
          {
            id: 'network_star_2',
            no: 2,
            title: 'Professional connections',
            description: 'Make meaningful professional connections',
            category: 'network_star',
            type: 'network_star',
            objective: 'To encourage members to build professional networks',
            points: 10,
            score: 10,
            deadline: '2025-12-31',
            guidelines: 'https://example.com/connections',
            status: 'pending' as const
          },
          {
            id: 'experience_star_1',
            no: 1,
            title: 'Workshop participation',
            description: 'Participate in skill development workshops',
            category: 'experience_star',
            type: 'experience_star',
            objective: 'To promote hands-on learning experiences',
            points: 15,
            score: 15,
            deadline: '2025-12-31',
            guidelines: 'https://example.com/workshops',
            status: 'pending' as const
          },
          {
            id: 'experience_star_2',
            no: 2,
            title: 'Mentorship program',
            description: 'Participate in mentorship activities',
            category: 'experience_star',
            type: 'experience_star',
            objective: 'To promote hands-on learning experiences',
            points: 10,
            score: 10,
            deadline: '2025-12-31',
            guidelines: 'https://example.com/mentorship',
            status: 'pending' as const
          }
        ],
        categories: ['network_star', 'experience_star', 'outreach_star', 'social_star']
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

  // 计算总分和当前分数（基于standards）
  const totalPoints = award.standards.reduce((sum, standard) => sum + (standard.points || standard.score || 0), 0);
  const currentPoints = award.standards.reduce((sum, standard) => sum + (standard.myScore || 0), 0);
  const currentPercentage = totalPoints > 0 ? (currentPoints / totalPoints) * 100 : 0;
  
  // 按类别分组standards
  const standardsByCategory = award.standards.reduce((acc, standard) => {
    const category = standard.category || 'unknown';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(standard);
    return acc;
  }, {} as Record<string, any[]>);

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
        items={Object.entries(standardsByCategory).map(([categoryType, standards], categoryIndex) => {
          const categoryPoints = standards.reduce((sum, standard) => sum + (standard.points || standard.score || 0), 0);
          const categoryMyPoints = standards.reduce((sum, standard) => sum + (standard.myScore || 0), 0);
          
          return {
            key: categoryIndex.toString(),
            label: (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {getStarIcon(categoryType)}
                  <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                    {getStarTitle(categoryType)} - [{categoryMyPoints} point{categoryMyPoints !== 1 ? 's' : ''}]
                  </span>
                </div>
                <div>
                  <Text type="secondary">
                    {categoryMyPoints} / {categoryPoints} Points
                  </Text>
                </div>
              </div>
            ),
            children: (
              <>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Paragraph style={{ marginBottom: 8 }}>
                    <Text strong>Category:</Text> {getStarTitle(categoryType)}
                  </Paragraph>
                  {standards[0]?.objective && (
                    <Paragraph style={{ marginBottom: 8 }}>
                      <Text strong>Objective:</Text> {standards[0].objective}
                    </Paragraph>
                  )}
                  {standards[0]?.note && (
                    <Alert
                      message="Note"
                      description={standards[0].note}
                      type="warning"
                      showIcon
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Card>

                <Table
                  dataSource={standards}
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
                    render={(title, record: any) => (
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
                    render={(score, record: any) => (
                      <Text style={{ fontSize: 12 }}>
                        {record.points ? `${record.points} points` : `${score}%`}
                      </Text>
                    )}
                  />
                  
                  <Table.Column
                    title="MY SCORE"
                    width={100}
                    align="center"
                    render={(_, record: any) => (
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
                    render={(_, record: any) => (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          setSelectedActivity(record);
                          setSelectedCategory(null);
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

export default StarPointAwardComponent;
