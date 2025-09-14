import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  Typography,
  Space,
  Button,
  Spin,
  Alert,
  Tabs,
  List,
  Tag
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { surveyAnalyticsService } from '@/services/surveyService';
import { SurveyAnalytics as SurveyAnalyticsType, QuestionAnalytics } from '@/types';

const { Title, Text } = Typography;

interface SurveyAnalyticsProps {
  surveyId: string;
}

const SurveyAnalytics: React.FC<SurveyAnalyticsProps> = ({ surveyId }) => {
  const [analytics, setAnalytics] = useState<SurveyAnalyticsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // 加载分析数据
  useEffect(() => {
    loadAnalytics();
  }, [surveyId]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await surveyAnalyticsService.getSurveyAnalytics(surveyId);
      if (result.success && result.data) {
        setAnalytics(result.data);
      } else {
        console.error('加载分析数据失败:', result.error);
      }
    } catch (error) {
      console.error('加载分析数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 渲染问题分析
  const renderQuestionAnalytics = (questionAnalytics: QuestionAnalytics) => {
    const { questionId, questionTitle, questionType, totalAnswers, completionRate, averageRating, distribution, textAnswers } = questionAnalytics;

    return (
      <Card key={questionId} style={{ marginBottom: 16 }}>
        <Title level={5}>{questionTitle}</Title>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic title="回答数" value={totalAnswers} />
          </Col>
          <Col span={6}>
            <Statistic 
              title="完成率" 
              value={completionRate} 
              suffix="%" 
              precision={1}
            />
          </Col>
          {averageRating !== undefined && (
            <Col span={6}>
              <Statistic 
                title="平均分" 
                value={averageRating} 
                precision={1}
              />
            </Col>
          )}
        </Row>

        {/* 根据问题类型渲染不同的图表 */}
        {questionType === 'single_choice' || questionType === 'multiple_choice' ? (
          distribution && (
            <div>
              <Title level={5}>选项分布</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 4 }}>
                    <Text type="secondary">饼图组件需要安装图表库</Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 4 }}>
                    <Text type="secondary">柱状图组件需要安装图表库</Text>
                  </div>
                </Col>
              </Row>
            </div>
          )
        ) : questionType === 'rating' || questionType === 'nps' ? (
          <div>
            <Title level={5}>评分分布</Title>
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 4 }}>
              <Text type="secondary">柱状图组件需要安装图表库</Text>
            </div>
          </div>
        ) : questionType === 'text' || questionType === 'textarea' ? (
          textAnswers && textAnswers.length > 0 && (
            <div>
              <Title level={5}>文本回答示例</Title>
              <List
                size="small"
                dataSource={textAnswers.slice(0, 5)}
                renderItem={(answer) => (
                  <List.Item>
                    <Text>{answer}</Text>
                  </List.Item>
                )}
              />
            </div>
          )
        ) : null}
      </Card>
    );
  };

  // 渲染趋势图表
  const renderTrendChart = () => {
    if (!analytics?.responseTrends || analytics.responseTrends.length === 0) {
      return null;
    }

    return (
      <Card title="回答趋势">
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 4 }}>
          <Text type="secondary">趋势图组件需要安装图表库</Text>
        </div>
      </Card>
    );
  };

  // 导出数据
  const handleExport = () => {
    // 实现导出功能
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>加载分析数据中...</Text>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Alert
        message="暂无分析数据"
        description="问卷还没有足够的回答数据进行分析"
        type="info"
        showIcon
      />
    );
  }

  return (
    <div>
      {/* 概览统计 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总回答数"
              value={analytics.totalResponses}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={analytics.completionRate}
              suffix="%"
              precision={1}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均用时"
              value={analytics.averageTimeSpent}
              suffix="秒"
              precision={0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="问题数量"
              value={analytics.questionAnalytics.length}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                导出数据
              </Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<EyeOutlined />}
                onClick={loadAnalytics}
              >
                刷新数据
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 分析内容 */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'overview',
            label: '概览',
            children: (
              <Row gutter={16}>
                <Col span={12}>
                  <Card title="完成率">
                    <Progress
                      type="circle"
                      percent={analytics.completionRate}
                      format={(percent) => `${percent}%`}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  {renderTrendChart()}
                </Col>
              </Row>
            )
          },
          {
            key: 'questions',
            label: '问题分析',
            children: (
              <div>
                {analytics.questionAnalytics.map(renderQuestionAnalytics)}
              </div>
            )
          },
          {
            key: 'trends',
            label: '趋势分析',
            children: renderTrendChart()
          },
          {
            key: 'details',
            label: '详细数据',
            children: (
              <Card title="回答详情">
                <Table
                  dataSource={analytics.questionAnalytics}
                  columns={[
                    {
                      title: '问题',
                      dataIndex: 'questionTitle',
                      key: 'questionTitle',
                      ellipsis: true
                    },
                    {
                      title: '类型',
                      dataIndex: 'questionType',
                      key: 'questionType',
                      render: (type) => (
                        <Tag>{type}</Tag>
                      )
                    },
                    {
                      title: '回答数',
                      dataIndex: 'totalAnswers',
                      key: 'totalAnswers'
                    },
                    {
                      title: '完成率',
                      dataIndex: 'completionRate',
                      key: 'completionRate',
                      render: (rate) => `${rate.toFixed(1)}%`
                    },
                    {
                      title: '平均分',
                      dataIndex: 'averageRating',
                      key: 'averageRating',
                      render: (rating) => rating ? rating.toFixed(1) : '-'
                    }
                  ]}
                  pagination={false}
                />
              </Card>
            )
          }
        ]}
      />
    </div>
  );
};

export default SurveyAnalytics;
