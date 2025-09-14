import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  Typography,
  Row,
  Col,
  Progress,
  message,
  Alert,
  Space,
  Button,
  Tag,
  Tooltip,
  Divider
} from 'antd';
import {
  HistoryOutlined,
  TrophyOutlined,
  StarOutlined,
  GiftOutlined,
  DownloadOutlined,
  EyeOutlined,
  SendOutlined
} from '@ant-design/icons';
import { 
  Indicator, 
  HistoricalIndicatorComparison, 
  AwardCategory,
  IndicatorLevel,
  IndicatorType 
} from '@/types/awards';
import { indicatorService } from '@/services/indicatorService';

const { Title, Text } = Typography;
const { Option } = Select;
// const { RangePicker } = DatePicker;

interface HistoricalIndicatorsViewProps {
  memberId?: string;
  isAdmin?: boolean;
}

const HistoricalIndicatorsView: React.FC<HistoricalIndicatorsViewProps> = ({
  memberId: _memberId,
  isAdmin: _isAdmin = false
}) => {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AwardCategory | 'all'>('all');
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [comparisonData, setComparisonData] = useState<HistoricalIndicatorComparison[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailableYears();
  }, []);

  useEffect(() => {
    if (selectedYears.length > 0) {
      loadIndicators();
    }
  }, [selectedYears, selectedCategory]);

  const loadAvailableYears = async () => {
    try {
      const years = await indicatorService.getAvailableYears();
      setAvailableYears(years);
      // 默认选择最近3年
      setSelectedYears(years.slice(0, 3));
    } catch (error) {
      message.error('加载可用年份失败');
      console.error(error);
    }
  };

  const loadIndicators = async () => {
    try {
      setLoading(true);
      const allIndicators: Indicator[] = [];
      
      for (const year of selectedYears) {
        const yearIndicators = await indicatorService.getIndicatorsByYear(
          year, 
          selectedCategory === 'all' ? undefined : selectedCategory
        );
        allIndicators.push(...yearIndicators);
      }
      
      setIndicators(allIndicators);
    } catch (error) {
      message.error('加载指标数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadComparisonData = async (indicatorId: string) => {
    try {
      const comparison = await indicatorService.getHistoricalIndicatorComparison(
        indicatorId, 
        selectedYears
      );
      
      if (comparison) {
        setComparisonData(prev => {
          const existing = prev.find(c => c.indicatorId === indicatorId);
          if (existing) {
            return prev.map(c => c.indicatorId === indicatorId ? comparison : c);
          } else {
            return [...prev, comparison];
          }
        });
      }
    } catch (error) {
      message.error('加载对比数据失败');
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

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      draft: 'default',
      active: 'green',
      completed: 'blue',
      archived: 'gray',
      cancelled: 'red'
    };
    return <Tag color={colorMap[status] || 'default'}>{status.toUpperCase()}</Tag>;
  };

  const handleYearChange = (years: number[]) => {
    setSelectedYears(years);
  };

  const handleCategoryChange = (category: AwardCategory | 'all') => {
    setSelectedCategory(category);
  };

  const exportData = () => {
    // 导出功能实现
    message.info('导出功能开发中...');
  };

  // 按年份和类别分组指标
  const groupedIndicators = indicators.reduce((acc, indicator) => {
    const key = `${indicator.year}-${indicator.category}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(indicator);
    return acc;
  }, {} as Record<string, Indicator[]>);

  return (
    <div>
      {/* 页面标题和筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={2} style={{ marginBottom: 0 }}>
              <HistoryOutlined style={{ marginRight: 8 }} />
              Historical Indicators
            </Title>
            <Text type="secondary">查看历史指标数据和趋势对比</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={exportData}>
                Export Data
              </Button>
            </Space>
          </Col>
        </Row>
        
        <Divider />
        
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>选择年份:</Text>
            <Select
              mode="multiple"
              style={{ width: '100%', marginTop: 8 }}
              placeholder="选择要查看的年份"
              value={selectedYears}
              onChange={handleYearChange}
              maxTagCount={3}
            >
              {availableYears.map(year => (
                <Option key={year} value={year}>{year}</Option>
              ))}
            </Select>
          </Col>
          
          <Col span={8}>
            <Text strong>奖励类别:</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={selectedCategory}
              onChange={handleCategoryChange}
            >
              <Option value="all">All Categories</Option>
              <Option value="efficient_star">Efficient Star</Option>
              <Option value="star_point">Star Point</Option>
              <Option value="national_area_incentive">National & Area Incentive</Option>
              <Option value="e_awards">E-Awards</Option>
            </Select>
          </Col>
          
          <Col span={8}>
            <Text strong>统计概览:</Text>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">
                共 {indicators.length} 个指标，覆盖 {selectedYears.length} 年
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 指标列表 */}
      {Object.keys(groupedIndicators).length > 0 ? (
        Object.entries(groupedIndicators).map(([key, yearIndicators]) => {
          const [year, category] = key.split('-');
          return (
            <Card 
              key={key} 
              title={
                <Space>
                  {getCategoryIcon(category as AwardCategory)}
                  <span>{getCategoryName(category as AwardCategory)} - {year}</span>
                  <Tag color="blue">{yearIndicators.length} indicators</Tag>
                </Space>
              }
              style={{ marginBottom: 24 }}
            >
              <Table
                dataSource={yearIndicators}
                rowKey="id"
                loading={loading}
                pagination={false}
                scroll={{ x: 1200 }}
              >
                <Table.Column
                  title="Level"
                  dataIndex="level"
                  width={80}
                  align="center"
                  render={(level) => getLevelTag(level)}
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
                      <Tooltip title="View Comparison">
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => loadComparisonData(record.id)}
                        />
                      </Tooltip>
                    </Space>
                  )}
                />
              </Table>
            </Card>
          );
        })
      ) : (
        <Card>
          <Alert
            message="暂无历史指标数据"
            description="请选择年份和类别查看历史指标"
            type="info"
            showIcon
          />
        </Card>
      )}

      {/* 对比数据展示 */}
      {comparisonData.length > 0 && (
        <Card title="Historical Comparison" style={{ marginTop: 24 }}>
          {comparisonData.map((comparison) => (
            <Card 
              key={comparison.indicatorId}
              size="small" 
              style={{ marginBottom: 16 }}
              title={comparison.title}
            >
              <Table
                dataSource={comparison.years}
                rowKey="year"
                pagination={false}
                size="small"
              >
                <Table.Column
                  title="Year"
                  dataIndex="year"
                  width={80}
                  align="center"
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
                  title="Average Score"
                  dataIndex="averageScore"
                  width={120}
                  align="center"
                  render={(score) => (
                    <Text style={{ color: '#52c41a' }}>{score.toFixed(1)}</Text>
                  )}
                />
                
                <Table.Column
                  title="Completion Rate"
                  dataIndex="completionRate"
                  width={120}
                  align="center"
                  render={(rate) => (
                    <div>
                      <Progress 
                        percent={Math.round(rate)} 
                        size="small" 
                        status={rate >= 80 ? 'success' : rate >= 60 ? 'normal' : 'exception'}
                      />
                      <Text style={{ fontSize: 12 }}>{rate.toFixed(1)}%</Text>
                    </div>
                  )}
                />
                
                <Table.Column
                  title="Participants"
                  dataIndex="participantCount"
                  width={100}
                  align="center"
                />
              </Table>
            </Card>
          ))}
        </Card>
      )}
    </div>
  );
};

export default HistoricalIndicatorsView;
