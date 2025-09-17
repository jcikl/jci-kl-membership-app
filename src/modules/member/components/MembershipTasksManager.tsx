import React from 'react';
import { Card, Alert, Form, Input, Select, Switch, Button, Space, Divider, message, Tag, InputNumber, Table, Modal, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useIsAdmin } from '@/hooks/usePermissions';
import { ACCOUNT_TYPE_OPTIONS, MEMBERSHIP_CATEGORY_OPTIONS } from '@/types/rbac';
import { 
  saveMembershipTaskPolicy, 
  getAllMembershipTaskPolicies, 
  deleteMembershipTaskPolicy,
  MembershipTaskPolicy, 
  TaskRequirement 
} from '@/modules/member/services/membershipTaskPolicyService.ts';


const TASK_TYPE_OPTIONS: Array<{ label: string; value: TaskRequirement['type'] }> = [
  { label: '参加活动（指定/任意类型）', value: 'event_participation' },
  { label: '参加课程（指定/任意类型）', value: 'course_completion' },
  { label: '至少一次筹委/主席', value: 'committee_role' },
];

const TARGET_TYPE_OPTIONS = [
  { label: '按户口类别', value: 'accountType' },
  { label: '按会员类别', value: 'membershipCategory' },
];

const MembershipTasksManager: React.FC = () => {
  const { isAdmin, loading } = useIsAdmin();
  const [form] = Form.useForm<MembershipTaskPolicy>();
  // Watch target type unconditionally to keep hooks order stable
  const targetType = Form.useWatch(['target', 'type'], form) as 'accountType' | 'membershipCategory' | undefined;
  const [saving, setSaving] = React.useState(false);
  const [policies, setPolicies] = React.useState<MembershipTaskPolicy[]>([]);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<MembershipTaskPolicy | null>(null);
  const [loadingPolicies, setLoadingPolicies] = React.useState(false);

  const loadPolicies = React.useCallback(async () => {
    try {
      setLoadingPolicies(true);
      const data = await getAllMembershipTaskPolicies();
      setPolicies(data);
    } catch (e) {
      message.error('加载会员管理任务策略失败');
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  React.useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await saveMembershipTaskPolicy({
        ...values,
        id: editingPolicy?.id,
      });
      message.success(editingPolicy ? '已更新' : '已创建');
      setModalVisible(false);
      setEditingPolicy(null);
      form.resetFields();
      loadPolicies();
    } catch (e) {
      console.error('Save error:', e);
      message.error(`保存失败: ${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (policy: MembershipTaskPolicy) => {
    setEditingPolicy(policy);
    form.setFieldsValue(policy);
    setModalVisible(true);
  };

  const onDelete = async (id: string) => {
    try {
      await deleteMembershipTaskPolicy(id);
      message.success('已删除');
      loadPolicies();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const onNew = () => {
    setEditingPolicy(null);
    form.resetFields();
    form.setFieldsValue({ 
      isEnabled: true, 
      target: { type: 'accountType', values: ['member'] }, 
      requirements: [{ type: 'event_participation', anyType: true, minCount: 1 }] 
    });
    setModalVisible(true);
  };

  const isDisabled = loading || !isAdmin;

  const columns = [
    {
      title: '策略名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
    },
    {
      title: '目标类型',
      dataIndex: ['target', 'type'],
      key: 'targetType',
      render: (type: string) => type === 'accountType' ? '户口类别' : '会员类别',
    },
    {
      title: '目标值',
      dataIndex: ['target', 'values'],
      key: 'targetValues',
      render: (values: string[], record: MembershipTaskPolicy) => {
        const options = record.target.type === 'accountType' ? ACCOUNT_TYPE_OPTIONS : MEMBERSHIP_CATEGORY_OPTIONS;
        return values.map(v => options.find(opt => opt.value === v)?.label || v).join(', ');
      },
    },
    {
      title: '任务数量',
      dataIndex: 'requirements',
      key: 'requirementsCount',
      render: (requirements: TaskRequirement[]) => requirements?.length || 0,
    },
    {
      title: '状态',
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: MembershipTaskPolicy) => (
        <Space>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => onEdit(record)}
            disabled={isDisabled}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此策略吗？"
            onConfirm={() => onDelete(record.id)}
            disabled={isDisabled}
          >
            <Button 
              type="link" 
              danger 
              icon={<DeleteOutlined />}
              disabled={isDisabled}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card 
        title="会员管理任务策略" 
        extra={
          <Space>
            <Button onClick={loadPolicies} loading={loadingPolicies}>刷新</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={onNew} disabled={isDisabled}>
              新建策略
            </Button>
          </Space>
        }
      >
        {loading && <Alert type="info" message="加载中..." showIcon style={{ marginBottom: 16 }} />}
        {!loading && !isAdmin && <Alert type="warning" message="仅管理员/开发者可访问此设置" showIcon style={{ marginBottom: 16 }} />}
        
        <Alert
          type="info"
          showIcon
          message="说明"
          description="为不同目标群体创建多个会员管理任务策略。每个策略可设定特定的户口类别或会员类别，并配置相应的任务要求。"
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={columns}
          dataSource={policies}
          rowKey="id"
          loading={loadingPolicies}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingPolicy ? '编辑策略' : '新建策略'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPolicy(null);
          form.resetFields();
        }}
        onOk={onSave}
        confirmLoading={saving}
        width={800}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" disabled={isDisabled}>
          <Form.Item name="name" label="策略名称" rules={[{ required: true, message: '请输入策略名称' }]}>
            <Input placeholder="例如：准会员晋升策略" />
          </Form.Item>
          
          <Form.Item name="description" label="策略描述">
            <Input.TextArea rows={2} placeholder="描述此策略的用途和适用场景" />
          </Form.Item>

          <Form.Item name="isEnabled" label="启用策略" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>

          <Divider>受众设定</Divider>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item name={['target', 'type']} label="目标类型" rules={[{ required: true }]} initialValue={'accountType'}>
              <Select options={TARGET_TYPE_OPTIONS} style={{ width: 260 }} />
            </Form.Item>
            {targetType === 'accountType' && (
              <Form.Item name={['target', 'values']} label="户口类别" rules={[{ required: true }]}> 
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="选择适用的户口类别"
                  options={ACCOUNT_TYPE_OPTIONS.map(opt => ({ label: opt.label, value: opt.value }))}
                />
              </Form.Item>
            )}
            {targetType === 'membershipCategory' && (
              <Form.Item name={['target', 'values']} label="会员类别" rules={[{ required: true }]}> 
                <Select
                  mode="multiple"
                  style={{ width: '100%' }}
                  placeholder="选择适用的会员类别"
                  options={MEMBERSHIP_CATEGORY_OPTIONS.map(opt => ({ label: opt.label, value: opt.value }))}
                />
              </Form.Item>
            )}
          </Space>

          <Divider>任务要求</Divider>
          <Form.List name="requirements">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, idx) => (
                  <Card size="small" key={field.key} style={{ marginBottom: 12 }} title={`任务 ${idx + 1}`}
                    extra={<a onClick={() => remove(field.name)}>删除</a>}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                    <Form.Item 
                      key={field.key}
                      name={[field.name, 'type']} 
                      label="任务类型" 
                      rules={[{ required: true }]}
                    >
                      <Select options={TASK_TYPE_OPTIONS} style={{ width: 320 }} />
                    </Form.Item>
                      <Form.Item shouldUpdate noStyle>
                        {() => {
                          const currentType = form.getFieldValue(['requirements', field.name, 'type']);
                          if (currentType === 'committee_role') {
                            return (
                              <Space wrap>
                            <Form.Item 
                              key={`${field.key}-minCount-committee`}
                              name={[field.name, 'minCount']} 
                              label="最少次数" 
                              initialValue={1}
                            >
                              <InputNumber min={1} style={{ width: 120 }} />
                            </Form.Item>
                                <Tag color="blue">至少一次担任筹委/主席</Tag>
                              </Space>
                            );
                          }
                          return (
                            <Space wrap>
                            <Form.Item 
                              key={`${field.key}-anyType`}
                              name={[field.name, 'anyType']} 
                              label="任意类型" 
                              valuePropName="checked" 
                              initialValue={true}
                            >
                              <Switch />
                            </Form.Item>
                              <Form.Item shouldUpdate noStyle>
                                {() => {
                                  const anyType = form.getFieldValue(['requirements', field.name, 'anyType']);
                                  if (!anyType) {
                                    return (
                                    <Form.Item 
                                      key={`${field.key}-specificTypes`}
                                      name={[field.name, 'specificTypes']} 
                                      label="指定类型(用逗号分隔)"
                                    >
                                      <Input placeholder="例如：训练营, 讲座" />
                                    </Form.Item>
                                    );
                                  }
                                  return null;
                                }}
                              </Form.Item>
                              <Form.Item 
                                key={`${field.key}-minCount-other`}
                                name={[field.name, 'minCount']} 
                                label="最少次数" 
                                initialValue={1}
                              >
                                <InputNumber min={1} style={{ width: 120 }} />
                              </Form.Item>
                            </Space>
                          );
                        }}
                      </Form.Item>
                    </Space>
                  </Card>
                ))}
                <Button onClick={() => add({ type: 'event_participation', anyType: true, minCount: 1 })} type="dashed" block>
                  + 添加任务
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
};

export default MembershipTasksManager;


