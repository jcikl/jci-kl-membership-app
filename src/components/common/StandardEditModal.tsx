import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Space,
  Divider,
  Card,
  Row,
  Col,
  Typography,
  Tabs,
  Tag,
  Popconfirm,
  Alert
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { TeamManagement, TeamPosition, TeamMember } from '../../types/awards';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;

interface StandardEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
  title: string;
  initialValues?: any;
  members: any[];
  awardType: 'efficient_star' | 'star_point' | 'national_area_incentive';
  showTargetScore?: boolean;
  showTeamManagement?: boolean;
}

const StandardEditModal: React.FC<StandardEditModalProps> = ({
  visible,
  onClose,
  onSave,
  title,
  initialValues,
  members,
  awardType,
  showTargetScore = false,
  showTeamManagement = false
}) => {
  const [form] = Form.useForm();
  const [teamManagement, setTeamManagement] = useState<TeamManagement | null>(null);
  const [positionForm, setPositionForm] = useState({
    name: '',
    description: '',
    responsibilities: '',
    requiredSkills: '',
    isRequired: false,
    maxMembers: undefined as number | undefined
  });

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    } else if (visible) {
      form.resetFields();
    }
    
    // 初始化团队管理数据
    if (visible && showTeamManagement) {
      const initialTeamManagement: TeamManagement = {
        id: `team_${Date.now()}`,
        awardType,
        awardId: initialValues?.id || '',
        positions: [],
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTeamManagement(initialTeamManagement);
    }
  }, [visible, initialValues, form, showTeamManagement, awardType]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // 初始化基础职位
  const initializeBasicPositions = () => {
    if (!teamManagement) return;
    
    const basicPositions: TeamPosition[] = [
      {
        id: 'position_leader',
        name: '项目负责人',
        description: '负责整个项目的统筹管理和决策',
        responsibilities: ['项目规划', '团队协调', '进度监控', '质量把控'],
        requiredSkills: ['领导力', '项目管理', '沟通协调'],
        isRequired: true,
        maxMembers: 1,
        order: 1
      },
      {
        id: 'position_coordinator',
        name: '协调员',
        description: '协助负责人进行日常协调工作',
        responsibilities: ['信息传达', '会议组织', '文档整理'],
        requiredSkills: ['组织能力', '沟通技巧', '文档处理'],
        isRequired: false,
        maxMembers: 2,
        order: 2
      },
      {
        id: 'position_executor',
        name: '执行员',
        description: '负责具体任务的执行和落实',
        responsibilities: ['任务执行', '进度汇报', '问题反馈'],
        requiredSkills: ['执行力', '责任心', '学习能力'],
        isRequired: false,
        maxMembers: 5,
        order: 3
      }
    ];

    const updatedTeamManagement = {
      ...teamManagement,
      positions: [...basicPositions, ...teamManagement.positions],
      updatedAt: new Date().toISOString()
    };

    setTeamManagement(updatedTeamManagement);
  };

  const handleCreatePosition = () => {
    if (!teamManagement) return;
    
    const newPosition: TeamPosition = {
      id: `position_${Date.now()}`,
      name: positionForm.name,
      description: positionForm.description,
      responsibilities: positionForm.responsibilities.split('\n').filter(r => r.trim()),
      requiredSkills: positionForm.requiredSkills.split(',').map(s => s.trim()).filter(s => s),
      isRequired: positionForm.isRequired,
      maxMembers: positionForm.maxMembers,
      order: teamManagement.positions.length
    };

    const updatedTeamManagement = {
      ...teamManagement,
      positions: [...teamManagement.positions, newPosition],
      updatedAt: new Date().toISOString()
    };

    setTeamManagement(updatedTeamManagement);
    
    // Reset form
    setPositionForm({
      name: '',
      description: '',
      responsibilities: '',
      requiredSkills: '',
      isRequired: false,
      maxMembers: undefined
    });
  };

  const handleUpdatePosition = (positionId: string, updates: Partial<TeamPosition>) => {
    if (!teamManagement) return;
    
    const updatedPositions = teamManagement.positions.map(position => 
      position.id === positionId ? { ...position, ...updates } : position
    );
    
    const updatedTeamManagement = {
      ...teamManagement,
      positions: updatedPositions,
      updatedAt: new Date().toISOString()
    };
    
    setTeamManagement(updatedTeamManagement);
  };

  const handleDeletePosition = (positionId: string) => {
    if (!teamManagement) return;
    
    const updatedPositions = teamManagement.positions.filter(pos => pos.id !== positionId);
    const updatedMembers = teamManagement.members.filter(member => member.positionId !== positionId);
    
    const updatedTeamManagement = {
      ...teamManagement,
      positions: updatedPositions,
      members: updatedMembers,
      updatedAt: new Date().toISOString()
    };
    
    setTeamManagement(updatedTeamManagement);
  };

  const handleAssignMember = (memberId: string, memberName: string, positionId: string, positionName: string) => {
    if (!teamManagement) return;
    
    const newMember: TeamMember = {
      id: `member_${Date.now()}`,
      memberId,
      memberName,
      positionId,
      positionName,
      assignedAt: new Date().toISOString(),
      assignedBy: 'current_user',
      status: 'active'
    };
    
    const updatedTeamManagement = {
      ...teamManagement,
      members: [...teamManagement.members, newMember],
      updatedAt: new Date().toISOString()
    };
    
    setTeamManagement(updatedTeamManagement);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!teamManagement) return;
    
    const updatedMembers = teamManagement.members.filter(member => member.id !== memberId);
    
    const updatedTeamManagement = {
      ...teamManagement,
      members: updatedMembers,
      updatedAt: new Date().toISOString()
    };
    
    setTeamManagement(updatedTeamManagement);
  };

  const getAssignedMembers = (positionId: string) => {
    return teamManagement?.members.filter(member => member.positionId === positionId) || [];
  };

  const getAvailableMembers = (positionId: string) => {
    const assignedMemberIds = getAssignedMembers(positionId).map(member => member.memberId);
    return members.filter(member => !assignedMemberIds.includes(member.id));
  };

  const getFormFields = () => {
    const baseFields: Array<{
      name: string;
      label: string;
      rules?: Array<{ required: boolean; message: string }>;
      element: JSX.Element;
    }> = [
      {
        name: 'title',
        label: '标题',
        rules: [{ required: true, message: '请输入标题' }],
        element: <Input placeholder="请输入标题" />
      },
      {
        name: 'description',
        label: '描述',
        rules: [{ required: true, message: '请输入描述' }],
        element: <TextArea rows={3} placeholder="请输入描述" />
      }
    ];

    if (awardType === 'efficient_star') {
      baseFields.push(
        {
          name: 'deadline',
          label: '截止日期',
          rules: [{ required: true, message: '请选择截止日期' }],
          element: <DatePicker style={{ width: '100%' }} />
        },
        {
          name: 'guidelines',
          label: '指导原则',
          element: <Input placeholder="输入指导原则或链接" />
        }
      );
    }

    if (awardType === 'star_point') {
      baseFields.push(
        {
          name: 'type',
          label: '类别类型',
          rules: [{ required: true, message: '请选择类别类型' }],
          element: (
            <Select>
              <Option value="network_star">Network Star</Option>
              <Option value="experience_star">Experience Star</Option>
              <Option value="social_star">Social Star</Option>
              <Option value="outreach_star">Outreach Star</Option>
            </Select>
          )
        },
        {
          name: 'objective',
          label: '目标',
          rules: [{ required: true, message: '请输入目标' }],
          element: <TextArea rows={2} placeholder="请输入目标" />
        },
        {
          name: 'points',
          label: '分数',
          rules: [{ required: true, message: '请输入分数' }],
          element: <InputNumber style={{ width: '100%' }} placeholder="请输入分数" />
        }
      );
    }

    if (awardType === 'national_area_incentive') {
      baseFields.push(
        {
          name: 'nationalAllocation',
          label: '国家级分配',
          rules: [{ required: true, message: '请输入国家级分配' }],
          element: <Input placeholder="如: -, 1*, 1" />
        },
        {
          name: 'areaAllocation',
          label: '区域级分配',
          rules: [{ required: true, message: '请输入区域级分配' }],
          element: <Input placeholder="如: -, 1*, 1" />
        },
        {
          name: 'status',
          label: '状态',
          rules: [{ required: true, message: '请选择状态' }],
          element: (
            <Select>
              <Option value="open">开放中</Option>
              <Option value="closed">已关闭</Option>
              <Option value="completed">已完成</Option>
            </Select>
          )
        },
        {
          name: 'guidelines',
          label: '指导原则',
          element: <TextArea rows={3} placeholder="请输入指导原则" />
        }
      );
    }

    return baseFields;
  };

  return (
    <>
      <Modal
        title={title}
        open={visible}
        onOk={handleSave}
        onCancel={onClose}
        width={1000}
        destroyOnClose
      >
        <Tabs defaultActiveKey="edit" type="card">
          <TabPane tab="编辑" key="edit">
            <Form form={form} layout="vertical">
              {getFormFields().map((field, index) => (
                <Form.Item
                  key={index}
                  name={field.name}
                  label={field.label}
                  rules={field.rules}
                >
                  {field.element}
                </Form.Item>
              ))}

              {showTargetScore && (
                <>
                  <Divider />
                  <Card size="small" title="目标分数设置">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="targetScore"
                          label="目标分数"
                        >
                          <InputNumber 
                            style={{ width: '100%' }} 
                            placeholder="请输入目标分数"
                            min={0}
                            max={100}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="scoreWeight"
                          label="分数权重"
                        >
                          <InputNumber 
                            style={{ width: '100%' }} 
                            placeholder="请输入分数权重"
                            min={0}
                            max={1}
                            step={0.1}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      目标分数用于评估完成度，分数权重用于计算总分占比
                    </Text>
                  </Card>
                </>
              )}
            </Form>
          </TabPane>

          {showTeamManagement && (
            <TabPane tab="团队管理" key="team">
              {teamManagement && (
                <div>
                  <Alert
                    message="团队管理功能说明"
                    description="您可以在此创建自定义职位，并将会员分配到特定职位，实现更精细的团队管理。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />

                  <Row gutter={24}>
                    {/* 职位管理 */}
                    <Col span={12}>
                      <Card title="职位管理" size="small">
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ marginBottom: 12 }}>
                            <Button 
                              type="dashed" 
                              onClick={initializeBasicPositions}
                              style={{ width: '100%' }}
                            >
                              初始化基础职位
                            </Button>
                          </div>
                          <Text strong style={{ fontSize: 14 }}>创建新职位</Text>
                          <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                            <Input
                              placeholder="职位名称"
                              value={positionForm.name}
                              onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
                            />
                            <TextArea
                              placeholder="职位描述"
                              rows={2}
                              value={positionForm.description}
                              onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                            />
                            <TextArea
                              placeholder="职责（每行一个）"
                              rows={3}
                              value={positionForm.responsibilities}
                              onChange={(e) => setPositionForm({ ...positionForm, responsibilities: e.target.value })}
                            />
                            <Input
                              placeholder="所需技能（用逗号分隔）"
                              value={positionForm.requiredSkills}
                              onChange={(e) => setPositionForm({ ...positionForm, requiredSkills: e.target.value })}
                            />
                            <Row gutter={8}>
                              <Col span={12}>
                                <Input
                                  type="number"
                                  placeholder="最大成员数"
                                  value={positionForm.maxMembers}
                                  onChange={(e) => setPositionForm({ 
                                    ...positionForm, 
                                    maxMembers: e.target.value ? parseInt(e.target.value) : undefined 
                                  })}
                                />
                              </Col>
                              <Col span={12}>
                                <Button
                                  type="primary"
                                  icon={<PlusOutlined />}
                                  onClick={handleCreatePosition}
                                  disabled={!positionForm.name.trim()}
                                  style={{ width: '100%' }}
                                >
                                  创建职位
                                </Button>
                              </Col>
                            </Row>
                          </Space>
                        </div>

                        <Divider />

                        <div>
                          <Text strong style={{ fontSize: 14 }}>现有职位</Text>
                          {teamManagement.positions.map((position) => (
                            <Card key={position.id} size="small" style={{ marginBottom: 8, marginTop: 8 }}>
                              <Row gutter={8}>
                                <Col span={8}>
                                  <Input
                                    placeholder="职位名称"
                                    value={position.name}
                                    onChange={(e) => handleUpdatePosition(position.id, { name: e.target.value })}
                                  />
                                </Col>
                                <Col span={8}>
                                  <Input
                                    placeholder="职位描述"
                                    value={position.description}
                                    onChange={(e) => handleUpdatePosition(position.id, { description: e.target.value })}
                                  />
                                </Col>
                                <Col span={8}>
                                  <Space>
                                    <Popconfirm
                                      title="确定删除此职位？"
                                      onConfirm={() => handleDeletePosition(position.id)}
                                      okText="确定"
                                      cancelText="取消"
                                    >
                                      <Button type="text" danger icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                  </Space>
                                </Col>
                              </Row>
                              
                              {position.responsibilities.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    职责: {position.responsibilities.join(', ')}
                                  </Text>
                                </div>
                              )}
                              
                              {position.requiredSkills && position.requiredSkills.length > 0 && (
                                <div style={{ marginTop: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    技能: {position.requiredSkills.join(', ')}
                                  </Text>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </Card>
                    </Col>

                    {/* 成员分配 */}
                    <Col span={12}>
                      <Card title="成员分配" size="small">
                        {teamManagement.positions.map((position) => (
                          <Card key={position.id} size="small" style={{ marginBottom: 16 }}>
                            <Text strong style={{ fontSize: 14 }}>{position.name}</Text>
                            
                            {/* 已分配成员 */}
                            <div style={{ marginBottom: 12, marginTop: 8 }}>
                              <Text strong style={{ fontSize: 12 }}>已分配成员:</Text>
                              <div style={{ marginTop: 4 }}>
                                {getAssignedMembers(position.id).map((member) => (
                                  <Tag
                                    key={member.id}
                                    closable
                                    onClose={() => handleRemoveMember(member.id)}
                                    style={{ marginBottom: 4 }}
                                  >
                                    {member.memberName}
                                  </Tag>
                                ))}
                                {getAssignedMembers(position.id).length === 0 && (
                                  <Text type="secondary" style={{ fontSize: 12 }}>暂无成员</Text>
                                )}
                              </div>
                            </div>

                            {/* 分配新成员 */}
                            <div>
                              <Text strong style={{ fontSize: 12 }}>分配新成员:</Text>
                              <Select
                                placeholder="选择成员"
                                style={{ width: '100%', marginTop: 4 }}
                                showSearch
                                filterOption={(input, option) =>
                                  String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                                }
                                onSelect={(value) => {
                                  const member = members.find(m => m.id === value);
                                  if (member) {
                                    handleAssignMember(member.id, member.name, position.id, position.name);
                                  }
                                }}
                              >
                                {getAvailableMembers(position.id).map(member => (
                                  <Option key={member.id} value={member.id}>
                                    {member.name}
                                  </Option>
                                ))}
                              </Select>
                            </div>
                          </Card>
                        ))}
                      </Card>
                    </Col>
                  </Row>
                </div>
              )}
            </TabPane>
          )}
        </Tabs>
      </Modal>

    </>
  );
};

export default StandardEditModal;
