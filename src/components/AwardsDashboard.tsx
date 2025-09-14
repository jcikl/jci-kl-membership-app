import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Space,
  Tag,
  Button,
  message,
  Timeline,
  List,
  Avatar,
  Badge,
  Alert,
  Table,
  Select,
  Tabs,
  Empty
} from 'antd';
import {
  TrophyOutlined,
  StarOutlined,
  GiftOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  RiseOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  SettingOutlined,
  UserOutlined,
  DownloadOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { AwardStatistics, AwardScoreRecord, Indicator, ActivityParticipationRecord } from '@/types/awards';
import { awardService } from '@/services/awardService';
import { indicatorService } from '@/services/indicatorService';

const { Title, Text, Paragraph } = Typography;

interface AwardsDashboardProps {
  memberId?: string;
  year?: number;
  isAdmin?: boolean;
}

const AwardsDashboard: React.FC<AwardsDashboardProps> = ({
  memberId,
  year = new Date().getFullYear(),
  isAdmin = false
}) => {
  const [statistics, setStatistics] = useState<AwardStatistics | null>(null);
  const [recentScores, setRecentScores] = useState<AwardScoreRecord[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [activityRecords, setActivityRecords] = useState<ActivityParticipationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('current');

  useEffect(() => {
    loadDashboardData();
  }, [memberId, year]);

  const loadDashboardData = async () => {
    if (!memberId) return;
    
    try {
      setLoading(true);
      const [stats, scores, indicatorData, activityData] = await Promise.all([
        awardService.getAwardStatistics(memberId, year),
        awardService.getMemberAwardScores(memberId),
        indicatorService.getIndicatorsByYear(year),
        indicatorService.getMemberActivityParticipations(memberId, year)
      ]);
      
      setStatistics(stats);
      setRecentScores(scores.slice(0, 5)); // 最近5条记录
      setIndicators(indicatorData);
      setActivityRecords(activityData);
    } catch (error) {
      message.error('加载仪表板数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
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
        return <GiftOutlined />;
    }
  };

  const getCategoryName = (category: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'pending':
        return 'orange';
      case 'rejected':
        return 'red';
      default:
        return 'blue';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleOutlined />;
      case 'pending':
        return <ClockCircleOutlined />;
      case 'rejected':
        return <ExclamationCircleOutlined />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getOverallGrade = (averageScore: number) => {
    if (averageScore >= 135) return { grade: 'Ultra Efficient', color: '#52c41a' };
    if (averageScore >= 120) return { grade: 'Super Efficient', color: '#1890ff' };
    if (averageScore >= 100) return { grade: 'Efficient', color: '#722ed1' };
    if (averageScore >= 90) return { grade: 'Good', color: '#fa8c16' };
    return { grade: 'Below Standard', color: '#f5222d' };
  };

  if (loading) {
    return <Card loading />;
  }

  if (!statistics) {
    return (
      <Alert
        message="暂无奖励数据"
        description="请先参与奖励活动或联系管理员"
        type="info"
        showIcon
      />
    );
  }

  const overallGrade = getOverallGrade(statistics.averageScore);

  // 计算额外统计信息
  const totalIndicators = indicators.length;
  const completedIndicators = indicators.filter(indicator => 
    activityRecords.some(record => record.indicatorId === indicator.id)
  ).length;
  const completionRate = totalIndicators > 0 ? (completedIndicators / totalIndicators) * 100 : 0;
  const totalActivityScore = activityRecords.reduce((sum, record) => sum + record.score + (record.bonusScore || 0), 0);

  return (
    <div>
      {/* 筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Text strong>Category Filter:</Text>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Select.Option value="all">All Categories</Select.Option>
              <Select.Option value="efficient_star">Efficient Star</Select.Option>
              <Select.Option value="star_point">Star Point</Select.Option>
              <Select.Option value="national_area_incentive">National & Area Incentive</Select.Option>
              <Select.Option value="e_awards">E-Awards</Select.Option>
            </Select>
          </Col>
          <Col span={8}>
            <Text strong>Time Range:</Text>
            <Select
              value={selectedTimeRange}
              onChange={setSelectedTimeRange}
              style={{ width: '100%', marginTop: 8 }}
            >
              <Select.Option value="current">Current Year</Select.Option>
              <Select.Option value="quarter">This Quarter</Select.Option>
              <Select.Option value="month">This Month</Select.Option>
              <Select.Option value="all">All Time</Select.Option>
            </Select>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<DownloadOutlined />}>
                Export Report
              </Button>
              <Button icon={<FilterOutlined />}>
                Advanced Filter
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 总体统计 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Awards"
              value={statistics.totalAwards}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Awards"
              value={statistics.activeAwards}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Score"
              value={statistics.totalScore}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={statistics.averageScore}
              precision={1}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: overallGrade.color }}
            />
          </Card>
        </Col>
      </Row>

      {/* 指标和活动统计 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Indicators"
              value={totalIndicators}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed Indicators"
              value={completedIndicators}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completion Rate"
              value={completionRate}
              precision={1}
              suffix="%"
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Activity Score"
              value={totalActivityScore}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 总体评级 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={3}>Overall Performance</Title>
            <Paragraph>
              Based on your current performance across all award categories, 
              you have achieved the following rating:
            </Paragraph>
            <div style={{ marginTop: 16 }}>
              <Tag 
                color={overallGrade.color} 
                style={{ fontSize: 16, padding: '8px 16px' }}
              >
                {overallGrade.grade}
              </Tag>
            </div>
          </Col>
          <Col span={12} style={{ textAlign: 'center' }}>
            <Progress
              type="circle"
              percent={Math.round(statistics.averageScore)}
              strokeColor={overallGrade.color}
              format={() => `${Math.round(statistics.averageScore)}%`}
              size={120}
            />
          </Col>
        </Row>
      </Card>

      {/* 分类统计 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Category Performance">
            <Row gutter={16}>
              {statistics.categoryBreakdown.map((category, index) => (
                <Col span={6} key={index}>
                  <Card 
                    size="small" 
                    style={{ 
                      textAlign: 'center',
                      border: category.score > 0 ? '2px solid #52c41a' : '1px solid #d9d9d9'
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      {getCategoryIcon(category.category)}
                    </div>
                    <Title level={5} style={{ marginBottom: 8 }}>
                      {getCategoryName(category.category)}
                    </Title>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">{category.count} awards</Text>
                    </div>
                    <div>
                      <Text strong style={{ color: '#1890ff', fontSize: 18 }}>
                        {category.score} points
                      </Text>
                    </div>
                    {category.score > 0 && (
                      <Badge 
                        status="success" 
                        text="Active" 
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 详细视图标签页 */}
      <Tabs defaultActiveKey="overview" items={[
        {
          key: 'overview',
          label: 'Overview',
          children: (
            <Row gutter={24}>
              <Col span={12}>
                <Card title="Recent Score Submissions">
                  <Timeline>
                    {recentScores.map((score) => (
                      <Timeline.Item
                        key={score.id}
                        color={getStatusColor(score.status)}
                        dot={getStatusIcon(score.status)}
                      >
                        <div>
                          <Text strong>{getCategoryName(score.awardId)}</Text>
                          <Tag 
                            color={getStatusColor(score.status)} 
                            style={{ marginLeft: 8 }}
                          >
                            {score.status}
                          </Tag>
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <Text type="secondary">
                            Score: {score.score} / {score.maxScore} ({score.percentage.toFixed(1)}%)
                          </Text>
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {new Date(score.submittedAt).toLocaleDateString()}
                          </Text>
                        </div>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Card>
              </Col>

              <Col span={12}>
                <Card title="Achievement Summary">
                  <List
                    dataSource={statistics.categoryBreakdown.filter(cat => cat.score > 0)}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={getCategoryIcon(item.category)} />}
                          title={getCategoryName(item.category)}
                          description={`${item.count} awards completed`}
                        />
                        <div>
                          <Text strong style={{ color: '#52c41a' }}>
                            {item.score} points
                          </Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          )
        },
        {
          key: 'indicators',
          label: 'Indicators Progress',
          children: (
            <Card title="Indicators Progress">
              <Table
                dataSource={indicators}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
              >
                <Table.Column
                  title="Indicator"
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
                  title="Target Score"
                  dataIndex="targetScore"
                  width={100}
                  align="center"
                  render={(score) => (
                    <Text strong style={{ color: '#1890ff' }}>{score}</Text>
                  )}
                />
                <Table.Column
                  title="Progress"
                  width={150}
                  render={(_, record: Indicator) => {
                    const recordForIndicator = activityRecords.find(r => r.indicatorId === record.id);
                    const currentScore = recordForIndicator ? recordForIndicator.score : 0;
                    const percentage = record.targetScore > 0 ? (currentScore / record.targetScore) * 100 : 0;
                    return (
                      <div>
                        <Progress 
                          percent={Math.round(percentage)} 
                          size="small"
                          status={percentage >= 100 ? 'success' : percentage >= 80 ? 'normal' : 'exception'}
                        />
                        <Text style={{ fontSize: 12 }}>
                          {currentScore} / {record.targetScore}
                        </Text>
                      </div>
                    );
                  }}
                />
                <Table.Column
                  title="Status"
                  width={100}
                  render={(_, record: Indicator) => {
                    const hasRecord = activityRecords.some(r => r.indicatorId === record.id);
                    return hasRecord ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>Completed</Tag>
                    ) : (
                      <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>
                    );
                  }}
                />
              </Table>
            </Card>
          )
        },
        {
          key: 'activities',
          label: 'Activity Records',
          children: (
            <Card title="Activity Participation Records">
              <Table
                dataSource={activityRecords}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
              >
                <Table.Column
                  title="Activity"
                  dataIndex="activityId"
                  width={120}
                  render={(activityId) => (
                    <Text strong>Activity #{activityId}</Text>
                  )}
                />
                <Table.Column
                  title="Indicator"
                  dataIndex="indicatorId"
                  width={200}
                  render={(indicatorId) => {
                    const indicator = indicators.find(i => i.id === indicatorId);
                    return indicator ? (
                      <Text strong>{indicator.title}</Text>
                    ) : 'Unknown Indicator';
                  }}
                />
                <Table.Column
                  title="Type"
                  dataIndex="participationType"
                  width={120}
                  render={(type) => (
                    <Tag color="blue">{type.toUpperCase()}</Tag>
                  )}
                />
                <Table.Column
                  title="Date"
                  dataIndex="participationDate"
                  width={120}
                  align="center"
                />
                <Table.Column
                  title="Score"
                  dataIndex="score"
                  width={100}
                  align="center"
                  render={(score, record: ActivityParticipationRecord) => (
                    <div>
                      <Text strong style={{ color: '#1890ff' }}>{score}</Text>
                      {record.bonusScore && (
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            +{record.bonusScore} bonus
                          </Text>
                        </div>
                      )}
                    </div>
                  )}
                />
                <Table.Column
                  title="Verified"
                  dataIndex="verified"
                  width={100}
                  align="center"
                  render={(verified) => (
                    verified ? (
                      <Tag color="green" icon={<CheckCircleOutlined />}>Verified</Tag>
                    ) : (
                      <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>
                    )
                  )}
                />
              </Table>
            </Card>
          )
        },
        {
          key: 'analytics',
          label: 'Analytics',
          children: (
            <Row gutter={24}>
              <Col span={12}>
                <Card title="Performance Trends">
                  <Empty description="Performance trends chart will be implemented here" />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Category Comparison">
                  <List
                    dataSource={statistics.categoryBreakdown}
                    renderItem={(item) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={getCategoryIcon(item.category)} />}
                          title={getCategoryName(item.category)}
                          description={`${item.count} awards`}
                        />
                        <div>
                          <Progress 
                            percent={Math.round((item.score / Math.max(...statistics.categoryBreakdown.map(c => c.score))) * 100)} 
                            size="small"
                            showInfo={false}
                          />
                          <Text strong style={{ color: '#1890ff' }}>
                            {item.score} points
                          </Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          )
        }
      ]} />

      {/* 快速操作 */}
      <Card title="Quick Actions" style={{ marginTop: 24 }}>
        <Space>
          <Button type="primary" icon={<FileTextOutlined />}>
            Submit New Score
          </Button>
          <Button icon={<BarChartOutlined />}>
            View Detailed Reports
          </Button>
          <Button icon={<CalendarOutlined />}>
            View Calendar
          </Button>
          {isAdmin && (
            <Button icon={<TeamOutlined />}>
              Manage Awards
            </Button>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default AwardsDashboard;
