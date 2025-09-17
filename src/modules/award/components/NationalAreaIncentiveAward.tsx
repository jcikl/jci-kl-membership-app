import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  message,
  Alert,
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SendOutlined
} from '@ant-design/icons';
import { NationalAreaIncentiveAward, IncentiveAward } from '@/types/awards';
import { awardService } from '@/modules/award/services/awardService';

const { Title, Text, Paragraph } = Typography;

interface NationalAreaIncentiveAwardProps {
  year?: number;
  memberId?: string;
  isAdmin?: boolean;
}

const NationalAreaIncentiveAwardComponent: React.FC<NationalAreaIncentiveAwardProps> = ({
  year = new Date().getFullYear()
}) => {
  const [award, setAward] = useState<NationalAreaIncentiveAward | null>(null);
  const [loading, setLoading] = useState(true);
  const [guidelineModalVisible, setGuidelineModalVisible] = useState(false);
  const [selectedAward, setSelectedAward] = useState<IncentiveAward | null>(null);

  useEffect(() => {
    loadAward();
  }, [year]);

  const loadAward = async () => {
    try {
      setLoading(true);
      const awardData = await awardService.getNationalAreaIncentiveAward(year);
      setAward(awardData);
    } catch (error) {
      message.error('加载National & Area Incentive奖励失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'completed':
        return <Tag color="green" icon={<CheckCircleOutlined />}>已完成</Tag>;
      case 'closed':
        return <Tag color="red" icon={<ExclamationCircleOutlined />}>已关闭</Tag>;
      default:
        return <Tag color="blue" icon={<ClockCircleOutlined />}>开放中</Tag>;
    }
  };

  const getNationalAllocationColor = (allocation: string) => {
    if (allocation.includes('**')) return '#52c41a'; // 绿色 - 特殊标记
    if (allocation.includes('*')) return '#1890ff'; // 蓝色 - 星号标记
    if (allocation === '-') return '#d9d9d9'; // 灰色 - 无分配
    return '#722ed1'; // 紫色 - 普通分配
  };

  const getAreaAllocationColor = (allocation: string) => {
    if (allocation.includes('*')) return '#fa8c16'; // 橙色 - 星号标记
    if (allocation === '-') return '#d9d9d9'; // 灰色 - 无分配
    return '#eb2f96'; // 粉色 - 普通分配
  };

  if (loading) {
    return <Card loading />;
  }

  const initializeAward = async () => {
    try {
      setLoading(true);
      const awardData = {
        title: `${year} JCI Malaysia National & Area Incentive Awards`,
        description: `The ${year} JCI Malaysia National & Area Incentive Awards have been updated based on the ${year} JCI Plan of Action & ${year} JCI Malaysia Plan of Action.`,
        category: 'national_area_incentive' as const,
        year: year,
        status: 'active' as const,
        deadline: '2025-12-31',
        submissionGuideline: 'https://example.com/submission-guideline',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        awardCategories: [
          {
            id: 'individual_awards',
            category: 'Category A: Individual Awards',
            awards: [
              {
                id: 'a01',
                no: 'A01',
                title: 'Most Outstanding Young Person',
                nationalAllocation: '1',
                areaAllocation: '1',
                status: 'open' as const,
                guidelines: 'Recognition for outstanding young individuals who have made significant contributions to society.'
              },
              {
                id: 'a02',
                no: 'A02',
                title: 'Most Outstanding Young Entrepreneur',
                nationalAllocation: '1',
                areaAllocation: '1',
                status: 'open' as const,
                guidelines: 'Recognition for young entrepreneurs who have demonstrated excellence in business.'
              }
            ]
          },
          {
            id: 'local_org_awards',
            category: 'Category B: Local Organisation Awards',
            awards: [
              {
                id: 'b01',
                no: 'B01',
                title: 'Most Outstanding Local Organisation',
                nationalAllocation: '1',
                areaAllocation: '1',
                status: 'open' as const,
                guidelines: 'Recognition for the most outstanding local organization in terms of activities and member development.'
              }
            ]
          }
        ]
      };
      
      await awardService.saveNationalAreaIncentiveAward(awardData);
      message.success('National & Area Incentive奖励配置初始化成功');
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
          message="暂无National & Area Incentive奖励配置"
          description="请点击下方按钮初始化当年的National & Area Incentive奖励标准"
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

  return (
    <div>
      {/* 奖励概览 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col span={24}>
            <div style={{ marginBottom: 16 }}>
              <Text type="secondary">Home &gt; Awards</Text>
            </div>
            
            <Title level={2} style={{ marginBottom: 8 }}>
              National & Area Incentive
            </Title>
            
            <Title level={3} style={{ color: '#722ed1', marginBottom: 16 }}>
              {year} JCI Malaysia National & Area Incentive Awards
            </Title>
            
            <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
              The {year} JCI Malaysia National & Area Incentive Awards have been updated based on the {year} JCI Plan of Action & {year} JCI Malaysia Plan of Action. The Award categories are divided into:
            </Paragraph>

            {/* 奖励类别 */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ color: '#13c2c2' }}>A. Individual Awards</Text><br />
              <Text strong style={{ color: '#13c2c2' }}>B. Local Organisation Awards</Text><br />
              <Text strong style={{ color: '#13c2c2' }}>C. Area Awards</Text><br />
              <Text strong style={{ color: '#13c2c2' }}>D. Special Awards</Text><br />
              <Text strong style={{ color: '#13c2c2' }}>E. JCI Junior, Youth Awards</Text>
            </div>

            {/* 提交指南 */}
            {award.submissionGuideline && (
              <div style={{ marginBottom: 24 }}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2' }}
                >
                  Submission Guideline
                </Button>
              </div>
            )}
          </Col>
        </Row>
      </Card>

      {/* 奖励列表 */}
      {award.awardCategories.map((category) => (
        <Card key={category.id} style={{ marginBottom: 24 }}>
          <Title level={4} style={{ color: '#52c41a', marginBottom: 16 }}>
            {category.category}
          </Title>
          
          <Table
            dataSource={category.awards}
            rowKey="id"
            pagination={false}
            scroll={{ x: 800 }}
          >
            <Table.Column
              title="NO."
              dataIndex="no"
              width={80}
              align="center"
            />
            
            <Table.Column
              title="AWARDS"
              dataIndex="title"
              render={(title, record: IncentiveAward) => (
                <div>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong>{title}</Text>
                    {record.guidelines && (
                      <Button
                        type="link"
                        size="small"
                        icon={<FileTextOutlined />}
                        style={{ marginLeft: 8 }}
                        onClick={() => {
                          setSelectedAward(record);
                          setGuidelineModalVisible(true);
                        }}
                      >
                        Guideline
                      </Button>
                    )}
                  </div>
                  <div>
                    {getStatusTag(record.status)}
                  </div>
                </div>
              )}
            />
            
            <Table.Column
              title="NATIONAL"
              dataIndex="nationalAllocation"
              width={100}
              align="center"
              render={(allocation) => (
                <Text 
                  strong 
                  style={{ 
                    color: getNationalAllocationColor(allocation),
                    fontSize: 16
                  }}
                >
                  {allocation}
                </Text>
              )}
            />
            
            <Table.Column
              title="AREA"
              dataIndex="areaAllocation"
              width={100}
              align="center"
              render={(allocation) => (
                <Text 
                  strong 
                  style={{ 
                    color: getAreaAllocationColor(allocation),
                    fontSize: 16
                  }}
                >
                  {allocation}
                </Text>
              )}
            />
            
            <Table.Column
              title="ACTION"
              width={120}
              align="center"
              render={(_, record: IncentiveAward) => (
                <Space>
                  <Button
                    type="primary"
                    size="small"
                    disabled={record.status === 'closed'}
                  >
                    Apply
                  </Button>
                  {record.guidelines && (
                    <Button
                      size="small"
                      icon={<FileTextOutlined />}
                      onClick={() => {
                        setSelectedAward(record);
                        setGuidelineModalVisible(true);
                      }}
                    >
                      View
                    </Button>
                  )}
                </Space>
              )}
            />
          </Table>
        </Card>
      ))}

      {/* 指南模态框 */}
      <Modal
        title={`Guideline - ${selectedAward?.title}`}
        open={guidelineModalVisible}
        onCancel={() => setGuidelineModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setGuidelineModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedAward?.guidelines && (
          <div>
            <Title level={5}>Guideline Details</Title>
            <Paragraph>{selectedAward.guidelines}</Paragraph>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NationalAreaIncentiveAwardComponent;
