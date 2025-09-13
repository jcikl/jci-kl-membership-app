import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  CalendarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  TeamOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { Member } from '@/types';
import { updateMember } from '@/services/memberService';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface ActivityParticipationManagerProps {
  member: Member;
  onUpdate: (updatedMember: Member) => void;
  isAdmin?: boolean;
}

const ActivityParticipationManager: React.FC<ActivityParticipationManagerProps> = ({
  member,
  onUpdate,
  isAdmin = false
}) => {
  const [activityModalVisible, setActivityModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);
  const [form] = Form.useForm();

  const activities = member.profile?.activityParticipation || [];

  // 统计信息
  const statistics = {
    total: activities.length,
    attended: activities.filter(a => a.status === 'attended').length,
    absent: activities.filter(a => a.status === 'absent').length,
    excused: activities.filter(a => a.status === 'excused').length,
    totalPoints: activities.reduce((sum, a) => sum + (a.points || 0), 0)
  };

  // 活动类型配置
  const activityTypes = [
    { value: 'meeting', label: '会议', color: 'blue' },
    { value: 'event', label: '活动', color: 'green' },
    { value: 'training', label: '培训', color: 'orange' },
    { value: 'volunteer', label: '志愿服务', color: 'purple' },
    { value: 'other', label: '其他', color: 'default' }
  ];

  // 参与状态配置
  const statusConfig = {
    attended: { color: 'green', text: '出席', icon: <CheckCircleOutlined /> },
    absent: { color: 'red', text: '缺席', icon: <CloseCircleOutlined /> },
    excused: { color: 'orange', text: '请假', icon: <ExclamationCircleOutlined /> }
  };

  // 表格列定义
  const columns = [
    {
      title: '活动名称',
      dataIndex: 'activityName',
      key: 'activityName',
      width: 150,
      render: (name: string) => (
        <Text style={{ fontSize: '12px' }}>{name}</Text>
      )
    },
    {
      title: '类型',
      dataIndex: 'activityType',
      key: 'activityType',
      width: 80,
      render: (type: string) => {
        const typeConfig = activityTypes.find(t => t.value === type);
        return (
          <Tag color={typeConfig?.color}>
            {typeConfig?.label}
          </Tag>
        );
      }
    },
    {
      title: '日期',
      dataIndex: 'participationDate',
      key: 'participationDate',
      width: 100,
      render: (date: string) => (
        <Text style={{ fontSize: '12px' }}>
          {dayjs(date).format('MM-DD')}
        </Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      }
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 60,
      render: (points: number) => (
        <Text style={{ fontSize: '12px', color: points > 0 ? '#52c41a' : '#666' }}>
          {points || 0}
        </Text>
      )
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => (
        <Text style={{ fontSize: '12px', color: '#666' }}>{notes || '-'}</Text>
      )
    },
    ...(isAdmin ? [{
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEditActivity(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这条活动记录吗？"
            onConfirm={() => onDeleteActivity(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }] : [])
  ];

  const onAddActivity = () => {
    setEditingActivity(null);
    form.resetFields();
    setActivityModalVisible(true);
  };

  const onEditActivity = (activity: any) => {
    setEditingActivity(activity);
    form.setFieldsValue({
      activityName: activity.activityName,
      activityType: activity.activityType,
      participationDate: dayjs(activity.participationDate),
      status: activity.status,
      points: activity.points,
      notes: activity.notes
    });
    setActivityModalVisible(true);
  };

  const onDeleteActivity = async (activityId: string) => {
    try {
      const updatedActivities = activities.filter(activity => activity.id !== activityId);
      
      await updateMember(member.id, {
        profile: {
          ...member.profile,
          activityParticipation: updatedActivities
        }
      });

      message.success('活动记录已删除');
      onUpdate({
        ...member,
        profile: {
          ...member.profile,
          activityParticipation: updatedActivities
        }
      });
    } catch (error) {
      message.error('删除失败');
    }
  };

  const onSaveActivity = async () => {
    try {
      const values = await form.validateFields();
      const newActivity = {
        id: editingActivity?.id || `activity_${Date.now()}`,
        activityName: values.activityName,
        activityType: values.activityType,
        participationDate: values.participationDate.format('YYYY-MM-DD'),
        status: values.status,
        points: values.points || 0,
        notes: values.notes
      };

      let updatedActivities;
      if (editingActivity) {
        // 编辑现有记录
        updatedActivities = activities.map(activity => 
          activity.id === editingActivity.id ? newActivity : activity
        );
      } else {
        // 添加新记录
        updatedActivities = [...activities, newActivity];
      }

      await updateMember(member.id, {
        profile: {
          ...member.profile,
          activityParticipation: updatedActivities
        }
      });

      message.success(editingActivity ? '活动记录已更新' : '活动记录已添加');
      setActivityModalVisible(false);
      onUpdate({
        ...member,
        profile: {
          ...member.profile,
          activityParticipation: updatedActivities
        }
      });
    } catch (error) {
      message.error('保存失败');
    }
  };

  return (
    <Card size="small" title={<><CalendarOutlined /> 活动参与管理</>}>
      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic
            title="总活动"
            value={statistics.total}
            prefix={<TeamOutlined />}
            valueStyle={{ fontSize: '16px' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="出席"
            value={statistics.attended}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ fontSize: '16px', color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="缺席"
            value={statistics.absent}
            prefix={<CloseCircleOutlined />}
            valueStyle={{ fontSize: '16px', color: '#ff4d4f' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="总积分"
            value={statistics.totalPoints}
            prefix={<TrophyOutlined />}
            valueStyle={{ fontSize: '16px', color: '#1890ff' }}
          />
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Space style={{ marginBottom: 16 }}>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddActivity}
          >
            添加活动
          </Button>
        )}
      </Space>

      {/* 活动记录表格 */}
      <Table
        dataSource={activities}
        columns={columns}
        rowKey="id"
        size="small"
        pagination={{
          pageSize: 8,
          size: 'small',
          showSizeChanger: false,
          showTotal: (total) => `共 ${total} 条记录`
        }}
        scroll={{ x: 600 }}
      />

      {/* 添加/编辑活动模态框 */}
      <Modal
        title={editingActivity ? '编辑活动记录' : '添加活动记录'}
        open={activityModalVisible}
        onCancel={() => setActivityModalVisible(false)}
        onOk={onSaveActivity}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="activityName"
            label="活动名称"
            rules={[{ required: true, message: '请输入活动名称' }]}
          >
            <Input placeholder="例如：月度例会、培训课程等" />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="activityType"
                label="活动类型"
                rules={[{ required: true, message: '请选择活动类型' }]}
              >
                <Select placeholder="选择活动类型">
                  {activityTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="participationDate"
                label="参与日期"
                rules={[{ required: true, message: '请选择参与日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="参与状态"
                rules={[{ required: true, message: '请选择参与状态' }]}
              >
                <Select placeholder="选择参与状态">
                  <Option value="attended">出席</Option>
                  <Option value="absent">缺席</Option>
                  <Option value="excused">请假</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="points"
                label="积分"
              >
                <Input
                  type="number"
                  placeholder="获得的积分"
                  min={0}
                  max={100}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea
              rows={3}
              placeholder="可选的备注信息"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ActivityParticipationManager;
