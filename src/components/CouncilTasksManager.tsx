import React from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Switch, message } from 'antd';
import { ChapterTask, createTask, listActiveTasks, TaskType } from '@/services/taskService';

const TASK_TYPES: { label: string; value: TaskType }[] = [
  { label: '活动参与', value: 'event_participation' },
  { label: '活动筹委', value: 'committee_role' },
  { label: '理事会议', value: 'council_meeting' },
  { label: '指定课程', value: 'course_completion' },
  { label: '其他', value: 'other' },
];

const CouncilTasksManager: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [tasks, setTasks] = React.useState<ChapterTask[]>([]);
  const [visible, setVisible] = React.useState(false);
  const [form] = Form.useForm();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await listActiveTasks();
      setTasks(data);
    } catch (e) {
      message.error('加载任务失败');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchTasks();
  }, []);

  const onCreate = async () => {
    try {
      const values = await form.validateFields();
      await createTask({
        title: values.title,
        type: values.type,
        description: values.description,
        criteria: values.criteria ? JSON.parse(values.criteria) : null,
        isActive: values.isActive,
        createdBy: 'admin',
      } as any);
      message.success('创建成功');
      setVisible(false);
      form.resetFields();
      fetchTasks();
    } catch (e) {
      // ignore
    }
  };

  return (
    <Card title="理事团任务管理" extra={<Button type="primary" onClick={() => setVisible(true)}>新建任务</Button>}>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={tasks}
        columns={[
          { title: '标题', dataIndex: 'title' },
          { title: '类型', dataIndex: 'type' },
          { title: '描述', dataIndex: 'description' },
          { title: '启用', dataIndex: 'isActive', render: (v: boolean) => (v ? '是' : '否') },
        ]}
      />

      <Modal
        title="新建任务"
        open={visible}
        onOk={onCreate}
        onCancel={() => setVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }] }>
            <Select options={TASK_TYPES} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="criteria" label="条件(JSON)">
            <Input.TextArea rows={3} placeholder='{"eventId":"abc"}' />
          </Form.Item>
          <Form.Item name="isActive" label="启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CouncilTasksManager;


