import React, { useState } from 'react';
import { Form, Input, TimePicker, Button, Card, Row, Col, Typography, Table, Space, Popconfirm, message, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, ScheduleOutlined } from '@ant-design/icons';
import { useEventForm } from '@/contexts/EventFormContext';
import { EventProgram } from '@/types/event';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface EventProgramsProps {
  onFieldChange?: (field: string, value: any) => void;
}

const EventPrograms: React.FC<EventProgramsProps> = ({ onFieldChange }) => {
  const { state, updateFormData } = useEventForm();
  const { formData } = state;
  const [editingProgram, setEditingProgram] = useState<EventProgram | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 处理字段变化
  const handleFieldChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
    onFieldChange?.(field, value);
  };

  // 添加新程序
  const handleAddProgram = () => {
    setEditingProgram(null);
    setIsModalVisible(true);
  };

  // 编辑程序
  const handleEditProgram = (program: EventProgram) => {
    setEditingProgram(program);
    setIsModalVisible(true);
  };

  // 删除程序
  const handleDeleteProgram = (index: number) => {
    const newPrograms = formData.programs.filter((_, i) => i !== index);
    handleFieldChange('programs', newPrograms);
    message.success('程序删除成功');
  };

  // 保存程序
  const handleSaveProgram = (programData: Partial<EventProgram>) => {
    const newPrograms = [...formData.programs];
    
    if (editingProgram) {
      // 编辑现有程序
      const index = newPrograms.findIndex(p => p.id === editingProgram.id);
      if (index !== -1) {
        newPrograms[index] = { ...newPrograms[index], ...programData };
      }
    } else {
      // 添加新程序
      const newProgram: EventProgram = {
        id: `program_${Date.now()}`,
        eventId: '',
        date: new Date() as any,
        time: '',
        duration: 30,
        program: programData.title || '',
        sessionChair: '',
        registrationRequired: false,
        maxSeats: undefined,
        isCompetition: false,
        sequence: 0,
        title: programData.title || '',
        description: programData.description || '',
        startTime: programData.startTime || null,
        endTime: programData.endTime || null,
        speaker: programData.speaker || '',
        location: programData.location || '',
        notes: programData.notes || '',
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      };
      newPrograms.push(newProgram);
    }
    
    handleFieldChange('programs', newPrograms);
    setIsModalVisible(false);
    setEditingProgram(null);
    message.success(editingProgram ? '程序更新成功' : '程序添加成功');
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
      title: '程序标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 120,
      render: (time: any) => time ? time.format('HH:mm') : '-'
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 120,
      render: (time: any) => time ? time.format('HH:mm') : '-'
    },
    {
      title: '主讲人',
      dataIndex: 'speaker',
      key: 'speaker',
      width: 120,
      ellipsis: true
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: EventProgram, index: number) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditProgram(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个程序吗？"
            onConfirm={() => handleDeleteProgram(index)}
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
          <ScheduleOutlined style={{ marginRight: 8 }} />
          程序安排
        </Title>
        <Text type="secondary">
          设置活动的详细程序安排和时间表
        </Text>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddProgram}
        >
          添加程序
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={formData.programs}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
        locale={{ emptyText: '暂无程序安排，请点击"添加程序"按钮添加' }}
      />

      {formData.programs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <ScheduleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>暂无程序安排</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>
            请点击"添加程序"按钮开始设置活动程序
          </div>
        </div>
      )}

      {/* 程序编辑模态框 */}
      <ProgramEditModal
        visible={isModalVisible}
        program={editingProgram}
        onSave={handleSaveProgram}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingProgram(null);
        }}
      />
    </Card>
  );
};

// 程序编辑模态框组件
interface ProgramEditModalProps {
  visible: boolean;
  program: EventProgram | null;
  onSave: (data: Partial<EventProgram>) => void;
  onCancel: () => void;
}

const ProgramEditModal: React.FC<ProgramEditModalProps> = ({
  visible,
  program,
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
      if (program) {
        form.setFieldsValue({
          title: program.title,
          description: program.description,
          startTime: program.startTime,
          endTime: program.endTime,
          speaker: program.speaker,
          location: program.location,
          notes: program.notes
        });
      } else {
        resetForm();
      }
    }
  }, [visible, program, form]);

  return (
    <Modal
      title={program ? '编辑程序' : '添加程序'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={600}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          name="title"
          label="程序标题"
          rules={[
            { required: true, message: '请输入程序标题' },
            { max: 100, message: '程序标题不能超过100个字符' }
          ]}
        >
          <Input placeholder="请输入程序标题" />
        </Form.Item>

        <Form.Item
          name="description"
          label="程序描述"
          rules={[
            { max: 500, message: '程序描述不能超过500个字符' }
          ]}
        >
          <TextArea
            placeholder="请输入程序描述"
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="startTime"
              label="开始时间"
              rules={[
                { required: true, message: '请选择开始时间' }
              ]}
            >
              <TimePicker
                style={{ width: '100%' }}
                placeholder="选择开始时间"
                format="HH:mm"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="endTime"
              label="结束时间"
              rules={[
                { required: true, message: '请选择结束时间' }
              ]}
            >
              <TimePicker
                style={{ width: '100%' }}
                placeholder="选择结束时间"
                format="HH:mm"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="speaker"
              label="主讲人"
              rules={[
                { max: 50, message: '主讲人姓名不能超过50个字符' }
              ]}
            >
              <Input placeholder="请输入主讲人姓名" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="location"
              label="地点"
              rules={[
                { max: 100, message: '地点不能超过100个字符' }
              ]}
            >
              <Input placeholder="请输入程序地点" />
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
          <TextArea
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

export default EventPrograms;
