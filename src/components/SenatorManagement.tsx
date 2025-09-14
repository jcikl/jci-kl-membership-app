import React from 'react';
import { Card, Table, Tag, Space, Button, Input, Modal, Form, message, Row, Col, Typography } from 'antd';
import { getMembers, updateMember } from '@/services/memberService';
import { Member } from '@/types';
import { useIsAdmin } from '@/hooks/usePermissions';

const SenatorManagement: React.FC = () => {
  const { isAdmin } = useIsAdmin();
  const [loading, setLoading] = React.useState(false);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [editing, setEditing] = React.useState<{ member: Member | null; visible: boolean }>({ member: null, visible: false });
  const [form] = Form.useForm<{ senatorId: string }>();

  const fetchSenators = React.useCallback(async () => {
    setLoading(true);
    try {
      // 简化：获取全部成员（可根据需要分页/优化）。
      const res = await getMembers({ page: 1, limit: 500 });
      // 过滤出有 senatorId 的成员
      const withSenatorId = res.data.filter(m => m.profile?.senatorId && String(m.profile.senatorId).trim() !== '');
      setMembers(withSenatorId);
    } catch (e) {
      message.error('加载参议员数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSenators();
  }, [fetchSenators]);

  const verified = members.filter(m => m.profile?.senatorVerified === true);
  const unverified = members.filter(m => !m.profile?.senatorVerified);

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '参议员编号', dataIndex: ['profile', 'senatorId'], key: 'senatorId' },
    { 
      title: '状态', 
      key: 'status', 
      render: (_: any, record: Member) => (
        <Tag color={record.profile?.senatorVerified ? 'green' : 'orange'}>
          {record.profile?.senatorVerified ? '已验证' : '未验证'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Member) => (
        <Space>
          <Button size="small" onClick={() => onEditId(record)} disabled={!isAdmin}>编辑编号</Button>
          {record.profile?.senatorVerified ? (
            <Button size="small" danger onClick={() => onVerify(record, false)} disabled={!isAdmin}>取消验证</Button>
          ) : (
            <Button size="small" type="primary" onClick={() => onVerify(record, true)} disabled={!isAdmin}>标记已验证</Button>
          )}
        </Space>
      ),
    }
  ];

  const onEditId = (member: Member) => {
    setEditing({ member, visible: true });
    form.setFieldsValue({ senatorId: member.profile?.senatorId || '' });
  };

  const onVerify = async (member: Member, verified: boolean) => {
    try {
      await updateMember(member.id, { profile: { ...member.profile, senatorVerified: verified } });
      message.success(verified ? '已标记为已验证' : '已取消验证');
      fetchSenators();
    } catch (e) {
      message.error('操作失败');
    }
  };

  const onSaveId = async () => {
    try {
      const values = await form.validateFields();
      if (!editing.member) return;
      await updateMember(editing.member.id, { profile: { ...editing.member.profile, senatorId: values.senatorId } });
      message.success('参议员编号已更新');
      setEditing({ member: null, visible: false });
      fetchSenators();
    } catch (e) {
      // ignore
    }
  };

  return (
    <Card title="参议员管理" extra={<Button onClick={fetchSenators} loading={loading}>刷新</Button>}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <Typography.Title level={5} style={{ margin: 0 }}>未验证参议员</Typography.Title>
                <Tag color="orange">{unverified.length}</Tag>
              </Space>
            }
            size="small"
            style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '12px' } }}
          >
            <Table
              rowKey="id"
              dataSource={unverified}
              columns={columns}
              loading={loading}
              pagination={{ pageSize: 8, size: 'small' }}
              size="small"
              style={{ flex: 1 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <Typography.Title level={5} style={{ margin: 0 }}>已验证参议员</Typography.Title>
                <Tag color="green">{verified.length}</Tag>
              </Space>
            }
            size="small"
            style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', padding: '12px' } }}
          >
            <Table
              rowKey="id"
              dataSource={verified}
              columns={columns}
              loading={loading}
              pagination={{ pageSize: 8, size: 'small' }}
              size="small"
              style={{ flex: 1 }}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="编辑参议员编号"
        open={editing.visible}
        onCancel={() => setEditing({ member: null, visible: false })}
        onOk={onSaveId}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="senatorId" label="参议员编号" rules={[{ required: true, message: '请输入参议员编号' }]}>
            <Input placeholder="例如：JCI Senator #12345" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SenatorManagement;


