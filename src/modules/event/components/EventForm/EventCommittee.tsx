import React, { useState } from 'react';
import { Form, Input, Button, Card, Row, Col, Typography, Table, Space, Popconfirm, message, Modal, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, TeamOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useEventForm } from '@/contexts/EventFormContext';
import { CommitteeMember } from '@/types/event';

const { Title, Text } = Typography;

interface EventCommitteeProps {
  onFieldChange?: (field: string, value: any) => void;
}

const EventCommittee: React.FC<EventCommitteeProps> = ({ onFieldChange }) => {
  const { state, updateFormData } = useEventForm();
  const { formData } = state;
  const [editingMember, setEditingMember] = useState<CommitteeMember | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // 处理字段变化
  const handleFieldChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
    onFieldChange?.(field, value);
  };

  // 添加新成员
  const handleAddMember = () => {
    setEditingMember(null);
    setIsModalVisible(true);
  };

  // 编辑成员
  const handleEditMember = (member: CommitteeMember) => {
    setEditingMember(member);
    setIsModalVisible(true);
  };

  // 删除成员
  const handleDeleteMember = (index: number) => {
    const newCommittee = formData.committee.filter((_, i) => i !== index);
    handleFieldChange('committee', newCommittee);
    message.success('委员会成员删除成功');
  };

  // 保存成员
  const handleSaveMember = (memberData: Partial<CommitteeMember>) => {
    const newCommittee = [...formData.committee];
    
    if (editingMember) {
      // 编辑现有成员
      const index = newCommittee.findIndex(m => m.id === editingMember.id);
      if (index !== -1) {
        newCommittee[index] = { ...newCommittee[index], ...memberData };
      }
    } else {
      // 添加新成员
      const newMember: CommitteeMember = {
        id: `member_${Date.now()}`,
        eventId: '',
        fullName: memberData.fullName || '',
        position: memberData.position || '',
        contact: memberData.contact || '',
        email: memberData.email || '',
        canEditEvent: memberData.canEditEvent || false,
        canApproveTickets: memberData.canApproveTickets || false,
        sequence: 0,
        canManageParticipants: memberData.canManageParticipants || false,
        notes: memberData.notes || '',
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      };
      newCommittee.push(newMember);
    }
    
    handleFieldChange('committee', newCommittee);
    setIsModalVisible(false);
    setEditingMember(null);
    message.success(editingMember ? '委员会成员更新成功' : '委员会成员添加成功');
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
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      ellipsis: true
    },
    {
      title: '联系方式',
      dataIndex: 'contact',
      key: 'contact',
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
      title: '编辑权限',
      dataIndex: 'canEditEvent',
      key: 'canEditEvent',
      width: 80,
      render: (canEdit: boolean) => (
        <Switch size="small" checked={canEdit} disabled />
      )
    },
    {
      title: '票务权限',
      dataIndex: 'canApproveTickets',
      key: 'canApproveTickets',
      width: 80,
      render: (canApprove: boolean) => (
        <Switch size="small" checked={canApprove} disabled />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: CommitteeMember, index: number) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditMember(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个委员会成员吗？"
            onConfirm={() => handleDeleteMember(index)}
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
          <TeamOutlined style={{ marginRight: 8 }} />
          委员会管理
        </Title>
        <Text type="secondary">
          设置活动委员会成员及其权限
        </Text>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddMember}
        >
          添加委员会成员
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={formData.committee}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 1000 }}
        locale={{ emptyText: '暂无委员会成员，请点击"添加委员会成员"按钮添加' }}
      />

      {formData.committee.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
          <TeamOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>暂无委员会成员</div>
          <div style={{ fontSize: 12, marginTop: 8 }}>
            请点击"添加委员会成员"按钮开始设置委员会
          </div>
        </div>
      )}

      {/* 成员编辑模态框 */}
      <CommitteeMemberModal
        visible={isModalVisible}
        member={editingMember}
        onSave={handleSaveMember}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingMember(null);
        }}
      />
    </Card>
  );
};

// 委员会成员编辑模态框组件
interface CommitteeMemberModalProps {
  visible: boolean;
  member: CommitteeMember | null;
  onSave: (data: Partial<CommitteeMember>) => void;
  onCancel: () => void;
}

const CommitteeMemberModal: React.FC<CommitteeMemberModalProps> = ({
  visible,
  member,
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
      if (member) {
        form.setFieldsValue({
          fullName: member.fullName,
          position: member.position,
          contact: member.contact,
          email: member.email,
          canEditEvent: member.canEditEvent,
          canApproveTickets: member.canApproveTickets,
          canManageParticipants: member.canManageParticipants,
          notes: member.notes
        });
      } else {
        resetForm();
      }
    }
  }, [visible, member, form]);

  return (
    <Modal
      title={member ? '编辑委员会成员' : '添加委员会成员'}
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
              name="position"
              label="职位"
              rules={[
                { required: true, message: '请输入职位' },
                { max: 50, message: '职位不能超过50个字符' }
              ]}
            >
              <Input placeholder="请输入职位" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contact"
              label="联系方式"
              rules={[
                { max: 50, message: '联系方式不能超过50个字符' }
              ]}
            >
              <Input placeholder="请输入联系方式" prefix={<PhoneOutlined />} />
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

        <Form.Item label="权限设置">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="canEditEvent"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch />
                <Text style={{ marginLeft: 8 }}>编辑活动</Text>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="canApproveTickets"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch />
                <Text style={{ marginLeft: 8 }}>票务批准</Text>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="canManageParticipants"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch />
                <Text style={{ marginLeft: 8 }}>管理参与者</Text>
              </Form.Item>
            </Col>
          </Row>
        </Form.Item>

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

export default EventCommittee;
