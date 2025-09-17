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
  message,
  Alert,
  Space,
  Tooltip,
  Statistic,
  Upload,
  DatePicker,
  Select,
  Progress,
  Divider
} from 'antd';
import {
  FileTextOutlined,
  StarOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  EyeOutlined,
  EditOutlined,
  UploadOutlined,
  DownloadOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { EfficientStarAward, EfficientStarStandard } from '@/types/awards';
import { awardService } from '@/modules/award/services/awardService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface EfficientStarAwardProps {
  year?: number;
  memberId?: string;
  isAdmin?: boolean;
}

const EfficientStarAwardComponent: React.FC<EfficientStarAwardProps> = ({
  year = new Date().getFullYear(),
  memberId,
  isAdmin = false
}) => {
  const [award, setAward] = useState<EfficientStarAward | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<EfficientStarStandard | null>(null);
  const [form] = Form.useForm();
  // const [submissionHistory, setSubmissionHistory] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadAward();
  }, [year]);

  const loadAward = async () => {
    try {
      setLoading(true);
      // 从awards collection获取基础奖励信息
      const awardData = await awardService.getEfficientStarAward(year);
      
      // 从standards collection获取standards数据
      const standardsData = await awardService.getStandardsByCategoryAndYear('efficient_star', year);
      
      // 合并数据
      if (awardData) {
        const updatedAward = {
          ...awardData,
          standards: standardsData,
          categories: ['efficient_star', 'network_star', 'experience_star', 'outreach_star', 'social_star']
        };
        setAward(updatedAward);
      } else {
        setAward(null);
      }
    } catch (error) {
      message.error('加载Efficient Star奖励失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (selectedStandard && memberId) {
        await awardService.updateEfficientStarScore(
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


  const getScoreColor = (percentage: number) => {
    if (percentage >= 135) return '#52c41a'; // 绿色 - Ultra Efficient
    if (percentage >= 120) return '#1890ff'; // 蓝色 - Super Efficient
    if (percentage >= 100) return '#722ed1'; // 紫色 - Efficient
    if (percentage >= 90) return '#fa8c16'; // 橙色 - Good
    return '#f5222d'; // 红色 - 低于90%
  };

  const getAwardLevel = (percentage: number) => {
    if (percentage >= 135) return 'Ultra Efficient Local Organization Management';
    if (percentage >= 120) return 'Super Efficient Local Organization Management';
    if (percentage >= 100) return 'Efficient Local Organization Management';
    if (percentage >= 90) return 'Good Local Organization Management';
    return 'Below Standard';
  };

  if (loading) {
    return <Card loading />;
  }

  const initializeAward = async () => {
    try {
      setLoading(true);
      const awardData = {
        title: `${year} Efficient Star`,
        description: `This program will recognize Local Organization with the achievement as follows:`,
        category: 'efficient_star' as const,
        year: year,
        status: 'active' as const,
        totalScore: 100,
        currentScore: 0,
        deadline: '2025-12-31',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        criteria: {
          tiers: [
            { score: '90%-99%', award: 'Good Local Organization Management' },
            { score: '100%-119%', award: 'Efficient Local Organization Management' },
            { score: '120%-134%', award: 'Super Efficient Local Organization Management' },
            { score: '135%-140%', award: 'Ultra Efficient Local Organization Management' }
          ]
        },
        standards: [
          {
            id: 'standard_1',
            no: 1,
            title: 'Update Local Officer\'s information at jvc.cc and JCI Malaysia Roadmap',
            description: 'Ensure all local officer information is up to date',
            score: 10,
            deadline: '2025-03-31',
            guidelines: 'https://jvc.cc',
            status: 'pending' as const
          },
          {
            id: 'standard_2',
            no: 2,
            title: 'Submit Annual Plan of Action',
            description: 'Submit comprehensive annual plan',
            score: 15,
            deadline: '2025-04-30',
            guidelines: 'https://example.com/annual-plan',
            status: 'pending' as const
          },
          {
            id: 'standard_3',
            no: 3,
            title: 'Submit Annual Report',
            description: 'Submit detailed annual report',
            score: 15,
            deadline: '2025-05-31',
            guidelines: 'https://example.com/annual-report',
            status: 'pending' as const
          },
          {
            id: 'standard_4',
            no: 4,
            title: 'Member Development Programs',
            description: 'Conduct member development activities',
            score: 20,
            deadline: '2025-08-31',
            guidelines: 'https://example.com/member-development',
            status: 'pending' as const
          },
          {
            id: 'standard_5',
            no: 5,
            title: 'Community Service Projects',
            description: 'Organize community service initiatives',
            score: 20,
            deadline: '2025-10-31',
            guidelines: 'https://example.com/community-service',
            status: 'pending' as const
          },
          {
            id: 'standard_6',
            no: 6,
            title: 'Financial Management',
            description: 'Maintain proper financial records',
            score: 10,
            deadline: '2025-11-30',
            guidelines: 'https://example.com/financial-management',
            status: 'pending' as const
          },
          {
            id: 'standard_7',
            no: 7,
            title: 'Leadership Development',
            description: 'Promote leadership development',
            score: 10,
            deadline: '2025-12-31',
            guidelines: 'https://example.com/leadership-development',
            status: 'pending' as const
          }
        ]
      };
      
      await awardService.saveEfficientStarAward(awardData);
      message.success('Efficient Star奖励配置初始化成功');
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
          message="暂无Efficient Star奖励配置"
          description="请点击下方按钮初始化当年的Efficient Star奖励标准"
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

  const currentPercentage = award.currentScore > 0 ? (award.currentScore / award.totalScore) * 100 : 0;

  // 计算统计信息
  const completedStandards = award.standards.filter(standard => standard.myScore !== undefined).length;
  const totalStandards = award.standards.length;
  const completionRate = totalStandards > 0 ? (completedStandards / totalStandards) * 100 : 0;
  const averageScore = completedStandards > 0 
    ? award.standards.reduce((sum, standard) => sum + (standard.myScore || 0), 0) / completedStandards 
    : 0;

  return (
    <div>
      {/* 页面标题和筛选器 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={2} style={{ marginBottom: 0 }}>
              <StarOutlined style={{ marginRight: 8, color: '#722ed1' }} />
              {year} Efficient Star
            </Title>
            <Text type="secondary">高效本地组织管理奖励计划</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 150 }}
              >
                <Select.Option value="all">All Standards</Select.Option>
                <Select.Option value="completed">Completed</Select.Option>
                <Select.Option value="pending">Pending</Select.Option>
              </Select>
              <Button icon={<DownloadOutlined />}>
                Export Report
              </Button>
              {isAdmin && (
                <Button icon={<EditOutlined />}>
                  Manage Standards
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计概览 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Score"
              value={award.currentScore}
              suffix={`/ ${award.totalScore}`}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
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
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Completed Standards"
              value={completedStandards}
              suffix={`/ ${totalStandards}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average Score"
              value={averageScore}
              precision={1}
              suffix="%"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 奖励概览 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={16}>
            <Title level={3} style={{ marginBottom: 16 }}>
              Award Overview
            </Title>
            <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
              {award.description}
            </Paragraph>
            
            {/* 评分标准 */}
            <Card size="small" style={{ backgroundColor: '#f0f9ff', border: '1px solid #91d5ff' }}>
              <Text strong style={{ color: '#1890ff' }}>
                此计划将根据以下成就认可本地组织：
              </Text>
              <Table
                size="small"
                dataSource={award.criteria.tiers}
                rowKey={(record) => record.score || `tier-${record.award}`}
                pagination={false}
                showHeader={false}
                style={{ marginTop: 12 }}
              >
                <Table.Column
                  dataIndex="score"
                  render={(score) => (
                    <Text strong style={{ color: '#1890ff' }}>{score}</Text>
                  )}
                />
                <Table.Column
                  dataIndex="award"
                  render={(award) => (
                    <Text>{award}</Text>
                  )}
                />
              </Table>
            </Card>
          </Col>
          
          <Col span={8}>
            <Card style={{ textAlign: 'center' }}>
              <Title level={4}>Current Achievement</Title>
              <Progress
                type="circle"
                percent={Math.round(currentPercentage)}
                strokeColor={getScoreColor(currentPercentage)}
                format={() => `${Math.round(currentPercentage)}%`}
                size={120}
              />
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ color: getScoreColor(currentPercentage) }}>
                  {getAwardLevel(currentPercentage)}
                </Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">
                  {award.currentScore} / {award.totalScore} 分
                </Text>
              </div>
              <Divider />
              <Space direction="vertical" size="small">
                <Button type="primary" icon={<FileTextOutlined />}>
                  Submit Score
                </Button>
                <Button icon={<EyeOutlined />}>
                  View History
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 标准列表 */}
      <Card title="Standards and Tasks">
        <Table
          dataSource={award.standards}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
        >
          <Table.Column
            title="NO."
            dataIndex="no"
            width={60}
            align="center"
          />
          
          <Table.Column
            title="STANDARDS"
            dataIndex="title"
            render={(title, record: EfficientStarStandard) => (
              <div>
                <div style={{ marginBottom: 8 }}>
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
                
                {/* 子标准 */}
                {record.subStandards && record.subStandards.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {record.subStandards.map((subStandard) => (
                      <div key={subStandard.id} style={{ marginBottom: 8, paddingLeft: 16 }}>
                        <div style={{ marginBottom: 4 }}>
                          <Text strong>{subStandard.no} {subStandard.title}</Text>
                          {subStandard.guidelines && (
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
                        <Text type="secondary">{subStandard.description}</Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
          
          <Table.Column
            title="DEADLINE/CRITERIA"
            dataIndex="deadline"
            width={120}
            align="center"
          />
          
          <Table.Column
            title="SCORE"
            dataIndex="score"
            width={80}
            align="center"
            render={(score) => (
              <Text strong>{score}%</Text>
            )}
          />
          
          <Table.Column
            title="MY SCORE"
            width={120}
            align="center"
            render={(_, record: EfficientStarStandard) => (
              <div>
                {record.myScore !== undefined ? (
                  <div>
                    <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                      {record.myScore}%
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      <Progress 
                        percent={record.myScore} 
                        size="small"
                        status={record.myScore >= 80 ? 'success' : record.myScore >= 60 ? 'normal' : 'exception'}
                        showInfo={false}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Text type="secondary">-</Text>
                    <div style={{ marginTop: 4 }}>
                      <Progress 
                        percent={0} 
                        size="small"
                        status="exception"
                        showInfo={false}
                      />
                    </div>
                  </div>
                )}
                {record.subStandards && record.subStandards.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {record.subStandards.map((subStandard) => (
                      <div key={subStandard.id} style={{ marginBottom: 4 }}>
                        <div style={{ fontSize: 12, marginBottom: 2 }}>
                          {subStandard.myScore !== undefined ? (
                            <Text strong style={{ color: '#52c41a' }}>
                              {subStandard.myScore}%
                            </Text>
                          ) : (
                            <Text type="secondary">-</Text>
                          )}
                        </div>
                        <Progress 
                          percent={subStandard.myScore || 0} 
                          size="small"
                          status={subStandard.myScore && subStandard.myScore >= 80 ? 'success' : 'normal'}
                          showInfo={false}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
          
          <Table.Column
            title="ACTION"
            width={150}
            align="center"
            render={(_, record: EfficientStarStandard) => (
              <Space>
                <Tooltip title="View Details">
                  <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setSelectedStandard(record);
                      setScoreModalVisible(true);
                    }}
                    disabled={!memberId}
                  >
                    View
                  </Button>
                </Tooltip>
                {record.myScore !== undefined && (
                  <Tooltip title="Edit Score">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => {
                        setSelectedStandard(record);
                        form.setFieldsValue({ score: record.myScore });
                        setScoreModalVisible(true);
                      }}
                      disabled={!memberId}
                    />
                  </Tooltip>
                )}
              </Space>
            )}
          />
        </Table>
      </Card>

      {/* 分数提交模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <StarOutlined style={{ marginRight: 8, color: '#722ed1' }} />
            {selectedStandard ? `Submit Score - ${selectedStandard.title}` : 'Submit Score'}
          </div>
        }
        open={scoreModalVisible}
        onOk={handleScoreSubmit}
        onCancel={() => {
          setScoreModalVisible(false);
          form.resetFields();
        }}
        width={700}
        okText="Submit"
        cancelText="Cancel"
      >
        {selectedStandard && (
          <div style={{ marginBottom: 16 }}>
            <Card size="small" style={{ backgroundColor: '#f0f9ff', border: '1px solid #91d5ff' }}>
              <Text strong style={{ color: '#1890ff' }}>Standard Details:</Text>
              <div style={{ marginTop: 8 }}>
                <Text>{selectedStandard.description}</Text>
              </div>
              {selectedStandard.guidelines && (
                <div style={{ marginTop: 8 }}>
                  <Button type="link" size="small" icon={<FileTextOutlined />}>
                    View Guidelines
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}
        
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="score"
                label="Score"
                rules={[{ required: true, message: '请输入分数' }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: '100%' }}
                  placeholder="请输入分数 (0-100)"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="submissionDate"
                label="Submission Date"
                rules={[{ required: true, message: '请选择提交日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="evidence"
            label="Evidence/Supporting Documents"
            rules={[{ required: true, message: '请提供证据或说明' }]}
          >
            <TextArea
              rows={4}
              placeholder="请提供相关证据、说明或成就描述"
            />
          </Form.Item>
          
          <Form.Item
            name="supportingFiles"
            label="Supporting Files"
          >
            <Upload
              multiple
              beforeUpload={() => false}
              onChange={(_info) => {
                // 处理文件上传
              }}
            >
              <Button icon={<UploadOutlined />}>Upload Files</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <TextArea
              rows={3}
              placeholder="额外说明或备注"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EfficientStarAwardComponent;
