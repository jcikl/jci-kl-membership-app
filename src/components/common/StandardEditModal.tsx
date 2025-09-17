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
  Card,
  Row,
  Col,
  Tabs,
  Popconfirm,
  Alert,
  Table
} from 'antd';
import {
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { TeamManagement, TeamPosition, TeamMember } from '../../types/awards';
import { awardService } from '@/modules/award/services/awardService';

const { TextArea } = Input;
const { Option } = Select;

interface StandardEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (values: any) => void;
  title: string;
  initialValues?: any;
  members: any[];
  awardType: 'efficient_star' | 'star_point' | 'national_area_incentive';
  showTeamManagement?: boolean;
  showCategorySelection?: boolean;
  availableCategories?: any[];
  standardId?: string; // 新增：通过document ID读取standard
}

const StandardEditModal: React.FC<StandardEditModalProps> = ({
  visible,
  onClose,
  onSave,
  title,
  initialValues,
  members,
  awardType,
  showTeamManagement = false,
  showCategorySelection = false,
  availableCategories = [],
  standardId
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

  // 可编辑表格状态
  const [editingPositionId, setEditingPositionId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // 分数设置状态 - 新的数据结构
  const [scoreRules, setScoreRules] = useState<any[]>([]);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editingConditionId, setEditingConditionId] = useState<string | null>(null);


  // 创建空分数规则数据
  const createEmptyScoreRule = (): any => ({
    id: `score_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: '',
    baseScore: 0,
    description: '',
    enabled: true,
    conditions: []
  });

  // 创建空分数条件数据
  const createEmptyScoreCondition = (): any => ({
    id: `score_condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: 'memberCount', // 默认类型
    memberCount: undefined,
    nonMemberCount: undefined,
    totalCount: undefined,
    activityCount: undefined,
    activityType: '',
    activityCategory: '',
    specificActivity: '',
    partnerCount: undefined,
    partnerType: '',
    calculationMethod: 'perPerson', // 每人/总计
    points: 0,
    description: ''
  });



  useEffect(() => {
    const loadStandardData = async () => {
      console.log('🔄 StandardEditModal数据加载开始:', {
        visible,
        hasInitialValues: !!initialValues,
        hasStandardId: !!standardId,
        initialValuesKeys: initialValues ? Object.keys(initialValues) : [],
        standardId
      });

      if (visible && initialValues) {
        // 🥇 优先级1: 使用传入的初始值（最快，无需网络请求）
        console.log('📥 使用initialValues加载数据:', initialValues);
        const processedValues = { ...initialValues };
        
        // 处理日期字段，将字符串转换为dayjs对象
        if (processedValues.deadline && typeof processedValues.deadline === 'string') {
          processedValues.deadline = dayjs(processedValues.deadline);
        }
        
        form.setFieldsValue(processedValues);
        console.log('✅ initialValues数据已设置到表单');
        

        // 初始化新的分数规则数据
        if (initialValues.scoreRules) {
          setScoreRules(initialValues.scoreRules);
          console.log('📊 分数规则数据已加载:', initialValues.scoreRules.length, '项');
        } else {
          setScoreRules([]);
        }
      } else if (visible && standardId) {
        // 🥈 优先级2: 通过ID从存储系统读取（适用于需要最新数据的场景）
        console.log('🌐 通过standardId加载数据:', standardId);
        try {
          const standardData = await awardService.getStandardById(standardId);
          if (standardData) {
            console.log('📥 从存储系统获取到数据:', standardData);
            
            // 处理日期字段，将字符串转换为dayjs对象
            const processedValues = { ...standardData };
            if (processedValues.deadline && typeof processedValues.deadline === 'string') {
              (processedValues as any).deadline = dayjs(processedValues.deadline);
            }
            
            form.setFieldsValue(processedValues);
            console.log('✅ standardId数据已设置到表单');
            

            // 初始化新的分数规则数据
            if ((standardData as any).scoreRules) {
              setScoreRules((standardData as any).scoreRules);
              console.log('📊 分数规则数据已加载:', (standardData as any).scoreRules.length, '项');
        } else {
              setScoreRules([]);
            }
          } else {
            console.warn('⚠️ 未找到standardId对应的数据:', standardId);
            form.resetFields();
            setScoreRules([]);
          }
        } catch (error) {
          console.error('❌ 加载standard数据失败:', error);
          form.resetFields();
          setScoreRules([]);
        }
      } else if (visible) {
        // 🥉 优先级3: 重置表单（新建模式）
        console.log('🆕 重置表单（新建模式）');
        form.resetFields();
        setScoreRules([]);
      }
    };

    loadStandardData();
    
    // 初始化团队管理数据
    if (visible && showTeamManagement) {
      const defaultPositions: TeamPosition[] = [
        {
          id: 'position_leader',
          name: '项目负责人',
          description: '负责整个项目的统筹管理和决策',
          responsibilities: [],
          requiredSkills: [],
          isRequired: true,
          maxMembers: undefined,
          order: 1
        },
        {
          id: 'position_coordinator',
          name: '协调员',
          description: '协助负责人进行日常协调工作',
          responsibilities: [],
          requiredSkills: [],
          isRequired: false,
          maxMembers: undefined,
          order: 2
        },
        {
          id: 'position_executor',
          name: '执行员',
          description: '负责具体任务的执行和落实',
          responsibilities: [],
          requiredSkills: [],
          isRequired: false,
          maxMembers: undefined,
          order: 3
        }
      ];

      const initialTeamManagement: TeamManagement = {
        id: `team_${Date.now()}`,
        awardType,
        awardId: initialValues?.id || '',
        positions: defaultPositions,
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setTeamManagement(initialTeamManagement);
    }
  }, [visible, initialValues, form, showTeamManagement, awardType]);

  // 移除undefined值的工具函数
  const removeUndefinedFields = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => removeUndefinedFields(item));
    }
    
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = removeUndefinedFields(value);
        }
      }
      return cleaned;
    }
    
    return obj;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      
      // 处理日期字段，确保deadline是字符串格式
      const processedValues = { ...values };
      if (processedValues.deadline) {
        // 如果deadline是dayjs对象，转换为字符串
        if (processedValues.deadline.format && typeof processedValues.deadline.format === 'function') {
          processedValues.deadline = processedValues.deadline.format('YYYY-MM-DD');
        }
        // 如果deadline是其他格式，使用全局日期工具处理
        else if (typeof processedValues.deadline === 'string') {
          processedValues.deadline = processedValues.deadline;
        }
        // 如果是其他类型，尝试转换为字符串
        else {
          processedValues.deadline = String(processedValues.deadline);
        }
      }
      
      // 包含分数设置数据
      const dataToSave = {
        ...processedValues,
        scoreRules: scoreRules, // 新的分数规则数据
        teamManagement: teamManagement
      };
      
      // 清理undefined值
      const cleanDataToSave = removeUndefinedFields(dataToSave);
      
      onSave(cleanDataToSave);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };


  const handleCreatePosition = () => {
    if (!teamManagement) return;
    
    const newPosition: TeamPosition = {
      id: `position_${Date.now()}`,
      name: positionForm.name,
      description: positionForm.description,
      responsibilities: [],
      requiredSkills: [],
      isRequired: positionForm.isRequired,
      maxMembers: undefined,
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

  // 可编辑表格相关函数
  const isEditingPosition = (record: TeamPosition) => record.id === editingPositionId;
  const isEditingMember = (record: TeamMember) => record.id === editingMemberId;

  const editPosition = (record: TeamPosition) => {
    setEditingPositionId(record.id);
  };

  const cancelEditPosition = () => {
    setEditingPositionId(null);
  };

  const savePosition = () => {
    // 这里可以添加保存逻辑
    setEditingPositionId(null);
  };

  const editMember = (record: TeamMember) => {
    setEditingMemberId(record.id);
  };

  const cancelEditMember = () => {
    setEditingMemberId(null);
  };

  const saveMember = () => {
    // 这里可以添加保存逻辑
    setEditingMemberId(null);
  };

  // 职位表格列定义
  const positionColumns = [
    {
      title: '职位名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: TeamPosition) => {
        if (isEditingPosition(record)) {
          return (
            <Input
              defaultValue={text}
              onChange={(e) => handleUpdatePosition(record.id, { name: e.target.value })}
            />
          );
        }
        return text;
      },
    },
    {
      title: '职位描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string, record: TeamPosition) => {
        if (isEditingPosition(record)) {
          return (
            <Input
              defaultValue={text}
              onChange={(e) => handleUpdatePosition(record.id, { description: e.target.value })}
            />
          );
        }
        return text;
      },
    },
    {
      title: '是否必需',
      dataIndex: 'isRequired',
      key: 'isRequired',
      render: (isRequired: boolean, record: TeamPosition) => {
        if (isEditingPosition(record)) {
          return (
            <Select
              defaultValue={isRequired}
              onChange={(value) => handleUpdatePosition(record.id, { isRequired: value })}
              style={{ width: '100%' }}
            >
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          );
        }
        return isRequired ? '是' : '否';
      },
    },
    {
      title: '最大成员数',
      dataIndex: 'maxMembers',
      key: 'maxMembers',
      render: (maxMembers: number | undefined, record: TeamPosition) => {
        if (isEditingPosition(record)) {
          return (
            <InputNumber
              defaultValue={maxMembers}
              onChange={(value) => handleUpdatePosition(record.id, { maxMembers: value || undefined })}
              min={1}
              style={{ width: '100%' }}
            />
          );
        }
        return maxMembers || '无限制';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TeamPosition) => {
        if (isEditingPosition(record)) {
          return (
            <Space>
              <Button type="link" onClick={savePosition}>
                保存
              </Button>
              <Button type="link" onClick={cancelEditPosition}>
                取消
              </Button>
            </Space>
          );
        }
        return (
          <Space>
            <Button type="link" onClick={() => editPosition(record)}>
              编辑
            </Button>
            <Popconfirm
              title="确定删除此职位？"
              onConfirm={() => handleDeletePosition(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger>
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // 成员表格列定义
  const memberColumns = [
    {
      title: '成员姓名',
      dataIndex: 'memberName',
      key: 'memberName',
      render: (text: string, record: TeamMember) => {
        if (isEditingMember(record)) {
          const availableMembers = getAvailableMembers(record.positionId);
          return (
            <Select
              defaultValue={record.memberId}
              onChange={(value) => {
                const member = members.find(m => m.id === value);
                if (member) {
                  handleUpdateMember(record.id, { memberId: value, memberName: member.name });
                }
              }}
              style={{ width: '100%' }}
            >
              {availableMembers.map(member => (
                <Option key={member.id} value={member.id}>
                  {member.name}
                </Option>
              ))}
            </Select>
          );
        }
        return text;
      },
    },
    {
      title: '职位',
      dataIndex: 'positionName',
      key: 'positionName',
      render: (text: string, record: TeamMember) => {
        if (isEditingMember(record)) {
          return (
            <Select
              defaultValue={record.positionId}
              onChange={(value) => {
                const position = teamManagement?.positions.find(p => p.id === value);
                if (position) {
                  handleUpdateMember(record.id, { positionId: value, positionName: position.name });
                }
              }}
              style={{ width: '100%' }}
            >
              {teamManagement?.positions.map(position => (
                <Option key={position.id} value={position.id}>
                  {position.name}
                </Option>
              ))}
            </Select>
          );
        }
        return text;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: TeamMember) => {
        if (isEditingMember(record)) {
          return (
            <Select
              defaultValue={status}
              onChange={(value) => handleUpdateMember(record.id, { status: value as "active" | "inactive" })}
              style={{ width: '100%' }}
            >
              <Option value="active">活跃</Option>
              <Option value="inactive">非活跃</Option>
            </Select>
          );
        }
        return status === 'active' ? '活跃' : '非活跃';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: TeamMember) => {
        if (isEditingMember(record)) {
          return (
            <Space>
              <Button type="link" onClick={saveMember}>
                保存
              </Button>
              <Button type="link" onClick={cancelEditMember}>
                取消
              </Button>
            </Space>
          );
        }
        return (
          <Space>
            <Button type="link" onClick={() => editMember(record)}>
              编辑
            </Button>
            <Button type="link" danger onClick={() => handleRemoveMember(record.id)}>
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  // 更新成员信息的函数
  const handleUpdateMember = (memberId: string, updates: Partial<TeamMember>) => {
    if (!teamManagement) return;
    
    const updatedMembers = teamManagement.members.map(member => 
      member.id === memberId ? { ...member, ...updates } : member
    );
    
    const updatedTeamManagement = {
      ...teamManagement,
      members: updatedMembers,
      updatedAt: new Date().toISOString()
    };
    
    setTeamManagement(updatedTeamManagement);
  };

  // ========== 新的分数规则管理函数 ==========
  
  // 添加新分数规则
  const addNewScoreRule = () => {
    const newRule = createEmptyScoreRule();
    setScoreRules([...scoreRules, newRule]);
    setEditingRuleId(newRule.id);
  };

  // 删除分数规则
  const deleteScoreRule = (ruleId: string) => {
    setScoreRules(scoreRules.filter(rule => rule.id !== ruleId));
  };

  // 更新分数规则
  const updateScoreRule = (ruleId: string, updates: any) => {
    setScoreRules(scoreRules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  // 编辑分数规则
  const editScoreRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
  };

  // 保存分数规则
  const saveScoreRule = () => {
    setEditingRuleId(null);
  };

  // 取消编辑分数规则
  const cancelEditScoreRule = () => {
    setEditingRuleId(null);
  };

  // 添加分数条件
  const addScoreCondition = (ruleId: string) => {
    const newCondition = createEmptyScoreCondition();
    updateScoreRule(ruleId, {
      conditions: [...scoreRules.find(r => r.id === ruleId)?.conditions || [], newCondition]
    });
    setEditingConditionId(newCondition.id);
  };

  // 删除分数条件
  const deleteScoreCondition = (ruleId: string, conditionId: string) => {
    const rule = scoreRules.find(r => r.id === ruleId);
    if (rule) {
      updateScoreRule(ruleId, {
        conditions: rule.conditions.filter((c: any) => c.id !== conditionId)
      });
    }
  };

  // 更新分数条件
  const updateScoreCondition = (ruleId: string, conditionId: string, updates: any) => {
    const rule = scoreRules.find(r => r.id === ruleId);
    if (rule) {
      const updatedConditions = rule.conditions.map((c: any) => 
        c.id === conditionId ? { ...c, ...updates } : c
      );
      updateScoreRule(ruleId, { conditions: updatedConditions });
    }
  };

  // 编辑分数条件
  const editScoreCondition = (conditionId: string) => {
    setEditingConditionId(conditionId);
  };

  // 保存分数条件
  const saveScoreCondition = () => {
    setEditingConditionId(null);
  };

  // 取消编辑分数条件
  const cancelEditScoreCondition = () => {
    setEditingConditionId(null);
  };


  // 新的分数规则表格列定义
  const scoreRuleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (text: string, record: any) => {
        if (editingRuleId === record.id) {
          return (
            <Input
              defaultValue={text}
              onChange={(e) => updateScoreRule(record.id, { name: e.target.value })}
              placeholder="请输入规则名称"
              size="small"
            />
          );
        }
        return text || '未命名规则';
      },
    },
    {
      title: '基础积分',
      dataIndex: 'baseScore',
      key: 'baseScore',
      width: 100,
      render: (value: number, record: any) => {
        if (editingRuleId === record.id) {
          return (
            <InputNumber
              defaultValue={value}
              onChange={(val) => updateScoreRule(record.id, { baseScore: val || 0 })}
              placeholder="基础积分"
              size="small"
              min={0}
              style={{ width: '100%' }}
            />
          );
        }
        return value || 0;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (text: string, record: any) => {
        if (editingRuleId === record.id) {
          return (
            <Input
              defaultValue={text}
              onChange={(e) => updateScoreRule(record.id, { description: e.target.value })}
              placeholder="请输入描述"
              size="small"
            />
          );
        }
        return text || '暂无描述';
      },
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean, record: any) => {
        if (editingRuleId === record.id) {
          return (
            <Select
              defaultValue={enabled}
              onChange={(value) => updateScoreRule(record.id, { enabled: value })}
              size="small"
              style={{ width: '100%' }}
            >
              <Option value={true}>启用</Option>
              <Option value={false}>禁用</Option>
            </Select>
          );
        }
        return enabled ? '启用' : '禁用';
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => {
        if (editingRuleId === record.id) {
          return (
            <Space>
              <Button type="link" size="small" onClick={saveScoreRule}>
                保存
              </Button>
              <Button type="link" size="small" onClick={cancelEditScoreRule}>
                取消
              </Button>
            </Space>
          );
        }
        return (
          <Space>
            <Button type="link" size="small" onClick={() => editScoreRule(record.id)}>
              编辑
            </Button>
            <Popconfirm
              title="确定删除此规则？"
              onConfirm={() => deleteScoreRule(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger size="small">
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  // 分数条件表格列定义（动态列）
  const getScoreConditionColumns = (ruleId: string) => {
    const rule = scoreRules.find(r => r.id === ruleId);
    if (!rule) return [];

    return [
      {
        title: '条件类型',
        dataIndex: 'type',
        key: 'type',
        width: 120,
        render: (type: string, record: any) => {
          if (editingConditionId === record.id) {
            return (
              <Select
                defaultValue={type}
                onChange={(value) => updateScoreCondition(ruleId, record.id, { type: value })}
                size="small"
                style={{ width: '100%' }}
              >
                <Option value="memberCount">会员人数</Option>
                <Option value="nonMemberCount">非会员人数</Option>
                <Option value="totalCount">总人数</Option>
                <Option value="activityCount">活动场数</Option>
                <Option value="activityType">指定活动类型</Option>
                <Option value="activityCategory">指定活动类别</Option>
                <Option value="specificActivity">指定活动</Option>
                <Option value="partnerCount">合作伙伴数量</Option>
              </Select>
            );
          }
          const typeMap: { [key: string]: string } = {
            memberCount: '会员人数',
            nonMemberCount: '非会员人数',
            totalCount: '总人数',
            activityCount: '活动场数',
            activityType: '指定活动类型',
            activityCategory: '指定活动类别',
            specificActivity: '指定活动',
            partnerCount: '合作伙伴数量'
          };
          return typeMap[type] || type;
        },
      },
      {
        title: '条件参数',
        key: 'conditionParams',
        width: 200,
        render: (_: any, record: any) => {
          if (editingConditionId === record.id) {
            return renderConditionParams(ruleId, record);
          }
          return renderConditionDisplay(record);
        },
      },
      {
        title: '达成积分',
        dataIndex: 'points',
        key: 'points',
        width: 100,
        render: (value: number, record: any) => {
          if (editingConditionId === record.id) {
            return (
              <InputNumber
                defaultValue={value}
                onChange={(val) => updateScoreCondition(ruleId, record.id, { points: val || 0 })}
                placeholder="积分"
                size="small"
                min={0}
                style={{ width: '100%' }}
              />
            );
          }
          return value || 0;
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        render: (_: any, record: any) => {
          if (editingConditionId === record.id) {
            return (
              <Space>
                <Button type="link" size="small" onClick={saveScoreCondition}>
                  保存
                </Button>
                <Button type="link" size="small" onClick={cancelEditScoreCondition}>
                  取消
                </Button>
              </Space>
            );
          }
          return (
            <Space>
              <Button type="link" size="small" onClick={() => editScoreCondition(record.id)}>
                编辑
              </Button>
              <Popconfirm
                title="确定删除此条件？"
                onConfirm={() => deleteScoreCondition(ruleId, record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button type="link" danger size="small">
                  删除
                </Button>
              </Popconfirm>
            </Space>
          );
        },
      },
    ];
  };

  // 渲染条件参数输入控件
  const renderConditionParams = (ruleId: string, record: any) => {
    const { type } = record;
    
    switch (type) {
      case 'memberCount':
      case 'nonMemberCount':
      case 'totalCount':
        return (
          <InputNumber
            defaultValue={record[type]}
            onChange={(val) => updateScoreCondition(ruleId, record.id, { [type]: val })}
            placeholder={`${type === 'memberCount' ? '会员' : type === 'nonMemberCount' ? '非会员' : '总'}人数`}
            size="small"
            min={0}
            style={{ width: '100%' }}
          />
        );
      case 'activityCount':
        return (
          <InputNumber
            defaultValue={record.activityCount}
            onChange={(val) => updateScoreCondition(ruleId, record.id, { activityCount: val })}
            placeholder="活动场数"
            size="small"
            min={1}
            style={{ width: '100%' }}
          />
        );
      case 'activityType':
        return (
          <Select
            defaultValue={record.activityType}
            onChange={(val) => updateScoreCondition(ruleId, record.id, { activityType: val })}
            placeholder="选择活动类型"
            size="small"
            style={{ width: '100%' }}
          >
            <Option value="workshop">工作坊</Option>
            <Option value="seminar">研讨会</Option>
            <Option value="conference">会议</Option>
            <Option value="training">培训</Option>
            <Option value="networking">网络活动</Option>
            <Option value="social">社交活动</Option>
            <Option value="volunteer">志愿活动</Option>
            <Option value="other">其他</Option>
          </Select>
        );
      case 'activityCategory':
        return (
          <Select
            defaultValue={record.activityCategory}
            onChange={(val) => updateScoreCondition(ruleId, record.id, { activityCategory: val })}
            placeholder="选择活动类别"
            size="small"
            style={{ width: '100%' }}
          >
            <Option value="leadership">领导力发展</Option>
            <Option value="community">社区服务</Option>
            <Option value="international">国际关系</Option>
            <Option value="business">商业发展</Option>
            <Option value="environment">环境保护</Option>
            <Option value="education">教育培训</Option>
            <Option value="other">其他</Option>
          </Select>
        );
      case 'specificActivity':
        return (
          <Input
            defaultValue={record.specificActivity}
            onChange={(e) => updateScoreCondition(ruleId, record.id, { specificActivity: e.target.value })}
            placeholder="输入具体活动名称"
            size="small"
          />
        );
      case 'partnerCount':
        return (
          <div style={{ display: 'flex', gap: 4 }}>
            <InputNumber
              defaultValue={record.partnerCount}
              onChange={(val) => updateScoreCondition(ruleId, record.id, { partnerCount: val })}
              placeholder="数量"
              size="small"
              min={1}
              style={{ width: '60%' }}
            />
            <Select
              defaultValue={record.partnerType}
              onChange={(val) => updateScoreCondition(ruleId, record.id, { partnerType: val })}
              placeholder="类型"
              size="small"
              style={{ width: '40%' }}
            >
              <Option value="enterprise">企业</Option>
              <Option value="government">政府机构</Option>
              <Option value="ngo">非营利组织</Option>
              <Option value="academic">学术机构</Option>
              <Option value="other">其他</Option>
            </Select>
          </div>
        );
      default:
        return <span>未知类型</span>;
    }
  };

  // 渲染条件显示
  const renderConditionDisplay = (record: any) => {
    const { type } = record;
    
    switch (type) {
      case 'memberCount':
        return record.memberCount ? `会员人数 >= ${record.memberCount}` : '未设置';
      case 'nonMemberCount':
        return record.nonMemberCount ? `非会员人数 >= ${record.nonMemberCount}` : '未设置';
      case 'totalCount':
        return record.totalCount ? `总人数 >= ${record.totalCount}` : '未设置';
      case 'activityCount':
        return record.activityCount ? `活动场数 >= ${record.activityCount}` : '未设置';
      case 'activityType':
        return record.activityType ? `活动类型: ${record.activityType}` : '未设置';
      case 'activityCategory':
        return record.activityCategory ? `活动类别: ${record.activityCategory}` : '未设置';
      case 'specificActivity':
        return record.specificActivity ? `活动: ${record.specificActivity}` : '未设置';
      case 'partnerCount':
        return record.partnerCount ? `${record.partnerType || '合作伙伴'} >= ${record.partnerCount}` : '未设置';
      default:
        return '未知类型';
    }
  };


  const getFormFields = () => {
    const baseFields: Array<{
      name: string;
      label: string;
      rules?: Array<{ required: boolean; message: string }>;
      element: JSX.Element;
    }> = [];

    // 类别选择 - 仅在Star Point且需要选择类别时显示，放在标题之前
    if (awardType === 'star_point' && showCategorySelection && availableCategories.length > 0) {
      baseFields.push({
        name: 'categoryId',
        label: '选择类别',
        rules: [{ required: true, message: '请选择类别' }],
        element: (
          <Select placeholder="请选择类别">
            {availableCategories.map((category) => (
              <Option key={category.id} value={category.id}>
                {category.title} ({category.type})
              </Option>
            ))}
          </Select>
        )
      });
    }

    // Star Point 类别类型字段 - 移到标题之前
    if (awardType === 'star_point' && !showCategorySelection) {
      baseFields.push({
        name: 'category',
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
      });
    }

    baseFields.push(
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
        element: (
          <TextArea 
            rows={3} 
            placeholder="请输入描述（支持符号和emoji）" 
            style={{ 
              fontFamily: 'inherit',
              lineHeight: '1.5'
            }}
          />
        )
      },
      {
        name: 'deadline',
        label: '截至日期',
        rules: [{ required: true, message: '请选择截至日期' }],
        element: <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
      },
      {
        name: 'externalLink',
        label: '外部资料链接',
        rules: [
          {
            validator: (_: any, value: any) => {
              if (!value || value.trim() === '') {
                return Promise.resolve(); // 允许为空
              }
              
              // URL验证正则表达式 - 支持有或没有http://前缀
              const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
              
              if (!urlPattern.test(value.trim())) {
                return Promise.reject(new Error('请输入有效的URL地址（支持无http://前缀）'));
              }
              
              return Promise.resolve();
            }
          } as any
        ],
        element: (
          <Input 
            placeholder="请输入外部资料链接（如：example.com 或 https://example.com）" 
            style={{ fontFamily: 'inherit' }}
          />
        )
      }
    );

    // Efficient Star 专用字段
    if (awardType === 'efficient_star') {
      baseFields.push(
        {
          name: 'no',
          label: '序号',
          rules: [{ required: true, message: '请输入序号' }],
          element: <InputNumber placeholder="请输入序号" min={1} style={{ width: '100%' }} />
        },
        {
          name: 'guidelines',
          label: '指导原则',
          element: <Input placeholder="请输入指导原则链接" />
        }
      );
    }


    if (awardType === 'star_point') {
      // Star Point 专用字段
      baseFields.push(
        {
          name: 'objective',
          label: '目标分数',
          rules: [{ required: true, message: '请输入目标分数' }],
          element: <InputNumber placeholder="请输入目标分数" min={0} style={{ width: '100%' }} />
        },
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
        destroyOnHidden
      >

        <Tabs 
          defaultActiveKey="edit" 
          type="card"
          items={[
            {
              key: 'edit',
              label: '编辑',
              children: (
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

                </Form>
              )
            },
            {
              key: 'score',
              label: '分数设置',
              children: (
                <div>
                  <Alert
                    message="新的分数设置系统"
                    description="您可以使用新的分数规则系统来定义更灵活的得分条件。每个规则可以包含多个具体的得分条件。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />

                  {/* 新的分数规则管理 */}
                  <Card title="分数规则管理" size="small" style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <Button 
                        type="primary" 
                          icon={<PlusOutlined />}
                          onClick={addNewScoreRule}
                        >
                          添加规则
                        </Button>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          规则总数: {scoreRules.length} | 启用规则: {scoreRules.filter(r => r.enabled).length}
                        </span>
                      </Space>
                    </div>
                    
                    <Table
                      columns={scoreRuleColumns}
                      dataSource={scoreRules}
                      pagination={false}
                      size="small"
                      scroll={{ x: 800 }}
                      rowKey="id"
                      expandable={{
                        expandedRowRender: (record) => (
                          <div style={{ margin: 0 }}>
                            <div style={{ marginBottom: 12 }}>
                              <Space>
                                <Button 
                                  type="dashed" 
                                  size="small"
                                  icon={<PlusOutlined />}
                                  onClick={() => addScoreCondition(record.id)}
                                >
                                  添加条件
                                </Button>
                                <span style={{ fontSize: '12px', color: '#666' }}>
                                  条件数量: {record.conditions?.length || 0}
                                </span>
                              </Space>
                            </div>
                            
                            <Table
                              columns={getScoreConditionColumns(record.id)}
                              dataSource={record.conditions || []}
                              pagination={false}
                              size="small"
                              scroll={{ x: 600 }}
                              rowKey="id"
                            />
                          </div>
                        ),
                        rowExpandable: () => true,
                      }}
                    />
                  </Card>

                </div>
              )
            },
            ...(showTeamManagement ? [{
              key: 'team',
              label: '团队管理',
              children: (
                <div>
                  {teamManagement && (
                <div>
                  <Alert
                    message="团队管理功能说明"
                    description="您可以在此创建自定义职位，并将会员分配到特定职位，实现更精细的团队管理。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                  />

                      {/* 创建新职位 */}
                      <Card title="创建新职位" size="small" style={{ marginBottom: 16 }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Row gutter={16}>
                            <Col span={8}>
                            <Input
                              placeholder="职位名称"
                              value={positionForm.name}
                              onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
                            />
                            </Col>
                            <Col span={8}>
                              <Input
                              placeholder="职位描述"
                              value={positionForm.description}
                              onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                            />
                            </Col>
                            <Col span={8}>
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
                      </Card>

                      {/* 职位管理表格 */}
                      <Card title="职位管理" size="small" style={{ marginBottom: 16 }}>
                        <Table
                          columns={positionColumns}
                          dataSource={teamManagement.positions}
                          pagination={false}
                          size="small"
                          rowKey="id"
                          scroll={{ x: 800 }}
                        />
                            </Card>

                      {/* 成员管理表格 */}
                      <Card title="成员管理" size="small">
                        <div style={{ marginBottom: 16 }}>
                          <Space>
                            <Button 
                              type="primary" 
                              icon={<PlusOutlined />}
                              onClick={() => {
                                // 添加新成员逻辑
                                const firstPosition = teamManagement.positions[0];
                                if (firstPosition && members.length > 0) {
                                  const firstMember = members[0];
                                  handleAssignMember(firstMember.id, firstMember.name, firstPosition.id, firstPosition.name);
                                }
                              }}
                            >
                              添加成员
                            </Button>
                          </Space>
                            </div>
                        
                        <Table
                          columns={memberColumns}
                          dataSource={teamManagement.members}
                          pagination={false}
                          size="small"
                          rowKey="id"
                          scroll={{ x: 800 }}
                        />
                          </Card>
                </div>
                  )}
                </div>
              )
            }] : [])
          ]}
        />
      </Modal>


    </>
  );
};

export default StandardEditModal;
