import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Card, Row, Col, Typography, Table, Space, Popconfirm, message, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, UserOutlined, MailOutlined, DollarOutlined } from '@ant-design/icons';
import { useEventForm } from '@/contexts/EventFormContext';
import { EventTrainer } from '@/types/event';

const { Title, Text } = Typography;

interface EventTrainersProps {
  onFieldChange?: (field: string, value: any) => void;
}

const EventTrainers: React.FC<EventTrainersProps> = ({ onFieldChange }) => {
  const { state, updateFormData } = useEventForm();
  const { formData } = state;
  const [editingTrainer, setEditingTrainer] = useState<EventTrainer | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 处理字段变化
  const handleFieldChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
    onFieldChange?.(field, value);
  };

  // 添加新讲师
  const handleAddTrainer = () => {
    setEditingTrainer(null);
    setIsModalVisible(true);
  };

  // 编辑讲师
  const handleEditTrainer = (trainer: EventTrainer) => {
    setEditingTrainer(trainer);
    setIsModalVisible(true);
  };

  // 删除讲师
  const handleDeleteTrainer = (index: number) => {
    const newTrainers = formData.trainers.filter((_, i) => i !== index);
    handleFieldChange('trainers', newTrainers);
    message.success('讲师删除成功');
  };

  // 保存讲师
  const handleSaveTrainer = (trainerData: Partial<EventTrainer>) => {
    const newTrainers = [...formData.trainers];
    
    if (editingTrainer) {
      // 编辑现有讲师
      const index = newTrainers.findIndex(t => t.id === editingTrainer.id);
      if (index !== -1) {
        newTrainers[index] = { ...newTrainers[index], ...trainerData };
      }
    } else {
      // 添加新讲师
      const newTrainer: EventTrainer = {
        id: `trainer_${Date.now()}`,
        eventId: '',
        fullName: trainerData.fullName || '',
        title: trainerData.title || '',
        contact: '',
        email: trainerData.email || '',
        sequence: 0,
        company: trainerData.company || '',
        phone: trainerData.phone || '',
        bio: trainerData.bio || '',
        expertise: trainerData.expertise || '',
        fee: trainerData.fee || 0,
        currency: trainerData.currency || 'MYR',
        photoUrl: trainerData.photoUrl || '',
        socialLinks: trainerData.socialLinks || {},
        notes: trainerData.notes || '',
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      };
      newTrainers.push(newTrainer);
    }
    
    handleFieldChange('trainers', newTrainers);
    setIsModalVisible(false);
    setEditingTrainer(null);
    message.success(editingTrainer ? '讲师更新成功' : '讲师添加成功');
  };

  // 表格列定义
  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: any, _record: any, index: number) => index + 1
    },
    {
      title: '姓名',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 120,
      ellipsis: true
    },
    {
      title: '头衔',
      dataIndex: 'title',
      key: 'title',
      width: 120,
      ellipsis: true
    },
    {
      title: '公司',
      dataIndex: 'company',
      key: 'company',
      width: 120,
      ellipsis: true
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 150,
      ellipsis: true
    },
    {
      title: '费用',
      key: 'fee',
      width: 100,
      render: (_: any, record: EventTrainer) => (
        <span>
          {record.fee > 0 ? `${record.currency} ${record.fee}` : '免费'}
        </span>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: EventTrainer, index: number) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTrainer(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个讲师吗？"
            onConfirm={() => handleDeleteTrainer(index)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <UserOutlined style={{ marginRight: 8 }} />
          讲师管理
        </Title>
        <Text type="secondary">
          设置活动讲师信息及其专业背景
        </Text>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddTrainer}
        >
          添加讲师
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={formData.trainers}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 1000 }}
        locale={{ emptyText: '暂无讲师信息，请点击"添加讲师"按钮添加' }}
      />

      {formData.trainers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>暂无讲师信息</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>
            请点击"添加讲师"按钮开始设置讲师信息
          </div>
        </div>
      )}

      {/* 讲师编辑模态框 */}
      <TrainerEditModal
        visible={isModalVisible}
        trainer={editingTrainer}
        onSave={handleSaveTrainer}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingTrainer(null);
        }}
      />
    </Card>
  );
};

// 讲师编辑模态框组件
interface TrainerEditModalProps {
  visible: boolean;
  trainer: EventTrainer | null;
  onSave: (data: Partial<EventTrainer>) => void;
  onCancel: () => void;
}

const TrainerEditModal: React.FC<TrainerEditModalProps> = ({
  visible,
  trainer,
  onSave,
  onCancel
}) => {
  const [form] = Form.useForm();

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 重置表单
  const resetForm = () => {
    form.resetFields();
  };

  // 当模态框打开时设置表单值
  React.useEffect(() => {
    if (visible) {
      if (trainer) {
        form.setFieldsValue({
          fullName: trainer.fullName,
          title: trainer.title,
          company: trainer.company,
          email: trainer.email,
          phone: trainer.phone,
          bio: trainer.bio,
          expertise: trainer.expertise,
          fee: trainer.fee,
          currency: trainer.currency,
          photoUrl: trainer.photoUrl,
          notes: trainer.notes
        });
      } else {
        resetForm();
      }
    }
  }, [visible, trainer, form]);

  return (
    <Modal
      title={trainer ? '编辑讲师' : '添加讲师'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={800}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="fullName"
              label="姓名"
              rules={[
                { required: true, message: '请输入姓名' },
                { max: 50, message: '姓名不能超过50个字符' }
              ]}
            >
              <Input placeholder="请输入姓名" prefix={<UserOutlined />} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="title"
              label="头衔/职位"
              rules={[
                { required: true, message: '请输入头衔或职位' },
                { max: 100, message: '头衔不能超过100个字符' }
              ]}
            >
              <Input placeholder="请输入头衔或职位" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="company"
              label="公司/机构"
              rules={[
                { max: 100, message: '公司名称不能超过100个字符' }
              ]}
            >
              <Input placeholder="请输入公司或机构名称" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' },
                { max: 100, message: '邮箱不能超过100个字符' }
              ]}
            >
              <Input placeholder="请输入邮箱" prefix={<MailOutlined />} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="phone"
          label="联系电话"
          rules={[
            { max: 20, message: '联系电话不能超过20个字符' }
          ]}
        >
          <Input placeholder="请输入联系电话" />
        </Form.Item>

        <Form.Item
          name="bio"
          label="个人简介"
          rules={[
            { max: 500, message: '个人简介不能超过500个字符' }
          ]}
        >
          <Input.TextArea
            placeholder="请输入个人简介"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="expertise"
          label="专业领域"
          rules={[
            { max: 200, message: '专业领域不能超过200个字符' }
          ]}
        >
          <Input placeholder="请输入专业领域，用逗号分隔" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="fee"
              label="费用"
              rules={[
                { type: 'number', min: 0, message: '费用不能小于0' }
              ]}
            >
              <InputNumber
                placeholder="请输入费用"
                style={{ width: '100%' }}
                min={0}
                precision={2}
                addonBefore={<DollarOutlined />}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="currency"
              label="货币"
            >
              <Input placeholder="货币类型" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="photoUrl"
              label="头像"
            >
              <Input placeholder="头像URL" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="notes"
          label="备注"
          rules={[
            { max: 200, message: '备注不能超过200个字符' }
          ]}
        >
          <Input.TextArea
            placeholder="请输入备注信息"
            rows={2}
            maxLength={200}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EventTrainers;
