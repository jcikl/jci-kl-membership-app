import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Tag,
  Space,
  Alert,
  Typography,
  Divider,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { TeamManagement, TeamPosition, TeamMember } from '../../types/awards';

const { TextArea } = Input;
const { Option } = Select;
const { Text, Title } = Typography;

interface TeamManagementModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  teamManagement: TeamManagement | null;
  members: any[];
  onUpdateTeamManagement: (teamManagement: TeamManagement) => void;
}

const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  visible,
  onClose,
  title,
  teamManagement,
  members,
  onUpdateTeamManagement
}) => {
  const [positionForm, setPositionForm] = useState({
    name: '',
    description: '',
    responsibilities: '',
    requiredSkills: '',
    isRequired: false,
    maxMembers: undefined as number | undefined
  });

  useEffect(() => {
    if (teamManagement) {
      setPositionForm({
        name: '',
        description: '',
        responsibilities: '',
        requiredSkills: '',
        isRequired: false,
        maxMembers: undefined
      });
    }
  }, [teamManagement]);

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

    onUpdateTeamManagement(updatedTeamManagement);
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

    onUpdateTeamManagement(updatedTeamManagement);
    
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
    
    onUpdateTeamManagement(updatedTeamManagement);
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
    
    onUpdateTeamManagement(updatedTeamManagement);
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
    
    onUpdateTeamManagement(updatedTeamManagement);
  };

  const handleRemoveMember = (memberId: string) => {
    if (!teamManagement) return;
    
    const updatedMembers = teamManagement.members.filter(member => member.id !== memberId);
    
    const updatedTeamManagement = {
      ...teamManagement,
      members: updatedMembers,
      updatedAt: new Date().toISOString()
    };
    
    onUpdateTeamManagement(updatedTeamManagement);
  };

  const getAssignedMembers = (positionId: string) => {
    return teamManagement?.members.filter(member => member.positionId === positionId) || [];
  };

  const getAvailableMembers = (positionId: string) => {
    const assignedMemberIds = getAssignedMembers(positionId).map(member => member.memberId);
    return members.filter(member => !assignedMemberIds.includes(member.id));
  };

  if (!teamManagement) return null;

  return (
    <Modal
      title={`团队管理 - ${title}`}
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
    >
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
              <Title level={5}>创建新职位</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
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
              <Title level={5}>现有职位</Title>
              {teamManagement.positions.map((position) => (
                <Card key={position.id} size="small" style={{ marginBottom: 8 }}>
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
                <Title level={5}>{position.name}</Title>
                
                {/* 已分配成员 */}
                <div style={{ marginBottom: 12 }}>
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
    </Modal>
  );
};

export default TeamManagementModal;
