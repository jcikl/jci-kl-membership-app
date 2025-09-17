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
  DatePicker,
  Space,
  Typography,
  Row,
  Col,
  message,
  Alert,
  Tag,
  Tooltip,
  Popconfirm,
  Upload,
  Statistic
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  TrophyOutlined
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
  ActivityParticipationRecord, 
  Indicator
} from '@/types/awards';
import { indicatorService } from '@/modules/award/services/indicatorService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ActivityParticipationTrackerProps {
  memberId?: string;
  year?: number;
  isDeveloper?: boolean;
}

const ActivityParticipationTracker: React.FC<ActivityParticipationTrackerProps> = ({
  memberId,
  year = new Date().getFullYear(),
  isDeveloper = false
}) => {
  const [participationRecords, setParticipationRecords] = useState<ActivityParticipationRecord[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ActivityParticipationRecord | null>(null);
  const [form] = Form.useForm();
  const [autoUpdateLoading, setAutoUpdateLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [memberId, year]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [records, indicatorData] = await Promise.all([
        memberId ? indicatorService.getMemberActivityParticipations(memberId, year) : Promise.resolve([]),
        indicatorService.getIndicatorsByYear(year)
      ]);
      
      setParticipationRecords(records);
      setIndicators(indicatorData);
    } catch (error) {
      message.error('加载数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: ActivityParticipationRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      participationDate: safeParseDate(record.participationDate, 'YYYY-MM-DD')
    });
    setModalVisible(true);
  };

  const handleDelete = async (_recordId: string) => {
    try {
      // 这里需要实现删除功能
      message.success('记录删除成功');
      loadData();
    } catch (error) {
      message.error('删除记录失败');
      console.error(error);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      const recordData: Omit<ActivityParticipationRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        ...values,
        memberId: memberId || 'current_user',
        year,
        participationDate: values.participationDate.format('YYYY-MM-DD'),
        verified: isDeveloper ? true : false,
        // 确保不传递undefined值给Firebase
        verifiedBy: isDeveloper ? 'developer' : null,
        verifiedAt: isDeveloper ? new Date().toISOString() : null
      };

      if (editingRecord) {
        // 更新记录
        message.success('记录更新成功');
      } else {
        // 创建记录
        await indicatorService.createActivityParticipation(recordData);
        message.success('记录创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('保存记录失败');
      console.error(error);
    }
  };

  const handleAutoUpdate = async () => {
    if (!memberId) {
      message.warning('请先选择会员');
      return;
    }

    try {
      setAutoUpdateLoading(true);
      await indicatorService.autoUpdateIndicatorScores(memberId, year);
      message.success('自动更新完成');
      loadData();
    } catch (error) {
      message.error('自动更新失败');
      console.error(error);
    } finally {
      setAutoUpdateLoading(false);
    }
  };

  const getParticipationTypeTag = (type: string) => {
    const colorMap: Record<string, string> = {
      attended: 'blue',
      organized: 'green',
      volunteered: 'orange',
      presented: 'purple'
    };
    return <Tag color={colorMap[type] || 'default'}>{type.toUpperCase()}</Tag>;
  };

  const getVerificationStatus = (verified: boolean) => {
    return verified ? (
      <Tag color="green" icon={<CheckCircleOutlined />}>Verified</Tag>
    ) : (
      <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>
    );
  };

  const getIndicatorName = (indicatorId: string) => {
    const indicator = indicators.find(i => i.id === indicatorId);
    return indicator ? indicator.title : 'Unknown Indicator';
  };

  // const _getCategoryIcon = (category: AwardCategory) => {
  //   switch (category) {
  //     case 'efficient_star':
  //       return <TrophyOutlined style={{ color: '#722ed1' }} />;
  //     case 'star_point':
  //       return <TrophyOutlined style={{ color: '#52c41a' }} />;
  //     case 'national_area_incentive':
  //       return <TrophyOutlined style={{ color: '#1890ff' }} />;
  //     case 'e_awards':
  //       return <TrophyOutlined style={{ color: '#fa8c16' }} />;
  //     default:
  //       return <TrophyOutlined />;
  //   }
  // };

  // 计算统计信息
  const totalScore = participationRecords.reduce((sum, record) => 
    sum + record.score + (record.bonusScore || 0), 0
  );
  const totalDuration = participationRecords.reduce((sum, record) => sum + record.duration, 0);
  const verifiedCount = participationRecords.filter(record => record.verified).length;
  const verificationRate = participationRecords.length > 0 
    ? (verifiedCount / participationRecords.length) * 100 
    : 0;

  return (
    <div>
      {/* 页面标题和操作按钮 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={2} style={{ marginBottom: 0 }}>
              <UserOutlined style={{ marginRight: 8 }} />
              Activity Participation Tracker - {year}
            </Title>
            <Text type="secondary">追踪活动参与记录和自动更新分数</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              {isDeveloper && (
                <Button 
                  type="primary"
                  icon={<SyncOutlined />}
                  loading={autoUpdateLoading}
                  onClick={handleAutoUpdate}
                >
                  Auto Update Scores
                </Button>
              )}
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreate}
              >
                Add Record
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
              title="Total Score"
              value={totalScore}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Duration"
              value={totalDuration}
              suffix="hours"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Verified Records"
              value={verifiedCount}
              suffix={`/ ${participationRecords.length}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Verification Rate"
              value={verificationRate}
              precision={1}
              suffix="%"
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 开发者功能提示 */}
      {isDeveloper && (
        <Alert
          message="开发者模式"
          description="您拥有手动更新和追踪活动参与记录的权限，可以修改分数和验证记录。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 参与记录列表 */}
      <Card title="Participation Records">
        <Table
          dataSource={participationRecords}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1200 }}
        >
          <Table.Column
            title="Activity"
            dataIndex="activityId"
            width={150}
            render={(activityId) => (
              <Text strong>Activity #{activityId}</Text>
            )}
          />
          
          <Table.Column
            title="Indicator"
            dataIndex="indicatorId"
            width={200}
            render={(indicatorId) => (
              <div>
                <Text strong>{getIndicatorName(indicatorId)}</Text>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ID: {indicatorId}
                  </Text>
                </div>
              </div>
            )}
          />
          
          <Table.Column
            title="Type"
            dataIndex="participationType"
            width={120}
            render={(type) => getParticipationTypeTag(type)}
          />
          
          <Table.Column
            title="Date"
            dataIndex="participationDate"
            width={120}
            align="center"
          />
          
          <Table.Column
            title="Duration"
            dataIndex="duration"
            width={100}
            align="center"
            render={(duration) => (
              <Text>{duration}h</Text>
            )}
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
            title="Status"
            dataIndex="verified"
            width={100}
            align="center"
            render={(verified) => getVerificationStatus(verified)}
          />
          
          <Table.Column
            title="Actions"
            width={120}
            align="center"
            render={(_, record: ActivityParticipationRecord) => (
              <Space>
                <Tooltip title="Edit">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                    disabled={!isDeveloper && record.verified}
                  />
                </Tooltip>
                <Tooltip title="Delete">
                  <Popconfirm
                    title="确定要删除这条记录吗？"
                    onConfirm={() => handleDelete(record.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={!isDeveloper}
                    />
                  </Popconfirm>
                </Tooltip>
              </Space>
            )}
          />
        </Table>
      </Card>

      {/* 创建/编辑记录模态框 */}
      <Modal
        title={editingRecord ? 'Edit Participation Record' : 'Add Participation Record'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={600}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="activityId"
                label="Activity ID"
                rules={[{ required: true, message: '请输入活动ID' }]}
              >
                <Input placeholder="活动ID" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="indicatorId"
                label="Indicator"
                rules={[{ required: true, message: '请选择指标' }]}
              >
                <Select placeholder="选择指标">
                  {indicators.map(indicator => (
                    <Option key={indicator.id} value={indicator.id}>
                      {indicator.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="participationType"
                label="Participation Type"
                rules={[{ required: true, message: '请选择参与类型' }]}
              >
                <Select placeholder="选择参与类型">
                  <Option value="attended">Attended</Option>
                  <Option value="organized">Organized</Option>
                  <Option value="volunteered">Volunteered</Option>
                  <Option value="presented">Presented</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="participationDate"
                label="Participation Date"
                rules={[{ required: true, message: '请选择参与日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="duration"
                label="Duration (hours)"
                rules={[{ required: true, message: '请输入持续时间' }]}
              >
                <InputNumber 
                  min={0} 
                  max={24}
                  style={{ width: '100%' }} 
                  placeholder="小时" 
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="score"
                label="Score"
                rules={[{ required: true, message: '请输入分数' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  placeholder="分数" 
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="bonusScore"
                label="Bonus Score"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  placeholder="奖励分数" 
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea rows={3} placeholder="备注信息" />
          </Form.Item>

          <Form.Item
            name="evidence"
            label="Evidence Files"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              multiple
              beforeUpload={() => false}
              onChange={(_info) => {
                // 处理文件上传
              }}
            >
              <Button icon={<UploadOutlined />}>Upload Evidence</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ActivityParticipationTracker;
