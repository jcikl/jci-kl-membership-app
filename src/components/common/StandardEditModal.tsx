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
  Alert,
  Table,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { TeamManagement, TeamPosition, TeamMember } from '../../types/awards';
import { awardService } from '../../services/awardService';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

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

  // 分数设置状态
  const [scoreSettings, setScoreSettings] = useState<any[]>([]);

  // 创建空分数设置数据
  const createEmptyScoreSetting = (): any => ({
    id: `score_setting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sequenceNumber: '',
    participantCount: undefined,
    eventCount: undefined,
    partners: '',
    eventType: '',
    memberCount: undefined,
    nonMemberCount: undefined,
    score: undefined,
    description: '',
    isValid: false,
    errors: ['请填写必填字段'],
  });

  // 验证分数设置数据
  const validateScoreSetting = (setting: any): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // 必填字段验证
    if (!setting.description || !String(setting.description).trim()) {
      errors.push('描述不能为空');
    }
    if (!setting.score || setting.score <= 0) {
      errors.push('得分必须大于0');
    }
    
    // 序号唯一性验证
    if (setting.sequenceNumber && String(setting.sequenceNumber).trim()) {
      const duplicateCount = scoreSettings.filter(s => 
        s.sequenceNumber === setting.sequenceNumber && s.id !== setting.id
      ).length;
      if (duplicateCount > 0) {
        errors.push('序号不能重复');
      }
    }
    
    // 选填字段验证（如果填写了值，则验证格式）
    if (setting.participantCount !== undefined && setting.participantCount !== null && setting.participantCount <= 0) {
      errors.push('活动人数必须大于0');
    }
    if (setting.eventCount !== undefined && setting.eventCount !== null && setting.eventCount <= 0) {
      errors.push('活动场数必须大于0');
    }
    if (setting.memberCount !== undefined && setting.memberCount !== null && setting.memberCount < 0) {
      errors.push('会员人数不能小于0');
    }
    if (setting.nonMemberCount !== undefined && setting.nonMemberCount !== null && setting.nonMemberCount < 0) {
      errors.push('非会员人数不能小于0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  useEffect(() => {
    const loadStandardData = async () => {
      if (visible && standardId) {
        try {
          // 通过document ID加载standard数据
          const standardData = await awardService.getStandardById(standardId);
          if (standardData) {
            // 处理日期字段，将字符串转换为dayjs对象
            const processedValues = { ...standardData };
            if (processedValues.deadline && typeof processedValues.deadline === 'string') {
              (processedValues as any).deadline = dayjs(processedValues.deadline);
            }
            form.setFieldsValue(processedValues);
            
            // 初始化分数设置数据
            if (standardData.scoreSettings) {
              setScoreSettings(standardData.scoreSettings);
            } else {
              setScoreSettings([]);
            }
          }
        } catch (error) {
          console.error('加载standard数据失败:', error);
        }
      } else if (visible && initialValues) {
        // 处理日期字段，将字符串转换为dayjs对象
        const processedValues = { ...initialValues };
        if (processedValues.deadline && typeof processedValues.deadline === 'string') {
          processedValues.deadline = dayjs(processedValues.deadline);
        }
        form.setFieldsValue(processedValues);
        
        // 初始化分数设置数据
        if (initialValues.scoreSettings) {
          setScoreSettings(initialValues.scoreSettings);
        } else {
          setScoreSettings([]);
        }
      } else if (visible) {
        form.resetFields();
        setScoreSettings([]);
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
        scoreSettings: scoreSettings,
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

  // ========== 分数设置相关函数 ==========
  
  // 生成序号
  const generateSequenceNumber = (categoryType?: string) => {
    if (!categoryType) return '';
    
    const categoryPrefix = categoryType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const existingNumbers = scoreSettings
      .filter(s => s.sequenceNumber && s.sequenceNumber.startsWith(categoryPrefix))
      .map(s => {
        const match = s.sequenceNumber.match(/- S(\d+)$/);
        return match ? parseInt(match[1]) : 0;
      });
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    return `${categoryPrefix} - S${nextNumber}`;
  };
  
  // 添加新行
  const addNewScoreSetting = () => {
    const newSetting = createEmptyScoreSetting();
    // 获取当前选中的类别类型
    const categoryType = form.getFieldValue('type') || 'network_star';
    newSetting.sequenceNumber = generateSequenceNumber(categoryType);
    setScoreSettings([...scoreSettings, newSetting]);
  };

  // 删除行
  const deleteScoreSetting = (index: number) => {
    const newSettings = scoreSettings.filter((_, i) => i !== index);
    setScoreSettings(newSettings);
  };

  // 更新分数设置数据
  const updateScoreSetting = (index: number, field: string, value: any) => {
    const newSettings = [...scoreSettings];
    newSettings[index] = { ...newSettings[index], [field]: value };
    
    // 重新验证
    const validation = validateScoreSetting(newSettings[index]);
    newSettings[index].isValid = validation.isValid;
    newSettings[index].errors = validation.errors;
    
    setScoreSettings(newSettings);
  };

  // 分数设置表格列定义
  const scoreSettingColumns = [
    {
      title: '状态',
      key: 'status',
      width: 60,
      fixed: 'left' as const,
      render: (_: any, record: any) => (
        record.isValid ? 
          <Tag color="green" icon={<CheckCircleOutlined />}>有效</Tag> : 
          <Tag color="red" icon={<CloseCircleOutlined />}>无效</Tag>
      ),
    },
    {
      title: '序号',
      dataIndex: 'sequenceNumber',
      key: 'sequenceNumber',
      width: 150,
      fixed: 'left' as const,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateScoreSetting(index, 'sequenceNumber', e.target.value)}
          placeholder="自动生成，可编辑"
          size="small"
        />
      ),
    },
    {
      title: '描述 *',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      fixed: 'left' as const,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateScoreSetting(index, 'description', e.target.value)}
          placeholder="描述（必填）"
          size="small"
        />
      ),
    },
    {
      title: '活动人数（可选）',
      dataIndex: 'participantCount',
      key: 'participantCount',
      width: 120,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateScoreSetting(index, 'participantCount', val)}
          placeholder="活动人数（可选）"
          size="small"
          min={1}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '活动场数（可选）',
      dataIndex: 'eventCount',
      key: 'eventCount',
      width: 120,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateScoreSetting(index, 'eventCount', val)}
          placeholder="活动场数（可选）"
          size="small"
          min={1}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '合作伙伴（可选）',
      dataIndex: 'partners',
      key: 'partners',
      width: 140,
      render: (text: string, _: any, index: number) => (
        <Input
          value={text}
          onChange={(e) => updateScoreSetting(index, 'partners', e.target.value)}
          placeholder="合作伙伴（可选）"
          size="small"
        />
      ),
    },
    {
      title: '活动类型（可选）',
      dataIndex: 'eventType',
      key: 'eventType',
      width: 120,
      render: (value: string, _: any, index: number) => (
        <Select
          value={value}
          onChange={(val) => updateScoreSetting(index, 'eventType', val)}
          placeholder="活动类型（可选）"
          size="small"
          style={{ width: '100%' }}
          allowClear
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
      ),
    },
    {
      title: '会员人数（可选）',
      dataIndex: 'memberCount',
      key: 'memberCount',
      width: 120,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateScoreSetting(index, 'memberCount', val)}
          placeholder="会员人数（可选）"
          size="small"
          min={0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '非会员人数（可选）',
      dataIndex: 'nonMemberCount',
      key: 'nonMemberCount',
      width: 140,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateScoreSetting(index, 'nonMemberCount', val)}
          placeholder="非会员人数（可选）"
          size="small"
          min={0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '得分 *',
      dataIndex: 'score',
      key: 'score',
      width: 100,
      render: (value: number, _: any, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateScoreSetting(index, 'score', val)}
          placeholder="得分（必填）"
          size="small"
          min={1}
          max={100}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, _record: any, index: number) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => deleteScoreSetting(index)}
        >
          删除
        </Button>
      ),
    },
    {
      title: '错误',
      key: 'errors',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        record.errors.length > 0 ? (
          <Tooltip title={record.errors.join(', ')}>
            <Tag color="red" style={{ fontSize: '10px' }}>{record.errors.length}</Tag>
          </Tooltip>
        ) : null
      ),
    },
  ];

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
        element: <TextArea rows={3} placeholder="请输入描述" />
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
        element: <Input placeholder="请输入外部资料链接" />
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
          name: 'score',
          label: '分数',
          rules: [{ required: true, message: '请输入分数' }],
          element: <InputNumber placeholder="请输入分数" min={0} max={100} style={{ width: '100%' }} />
        },
        {
          name: 'guidelines',
          label: '指导原则',
          element: <Input placeholder="请输入指导原则链接" />
        }
      );
    }


    if (awardType === 'star_point') {
      if (!showCategorySelection) {
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
          }
        );
      }
      
      // Star Point 专用字段
      baseFields.push(
        {
          name: 'objective',
          label: '目标',
          rules: [{ required: true, message: '请输入目标' }],
          element: <Input placeholder="请输入目标" />
        },
        {
          name: 'note',
          label: '备注',
          element: <Input placeholder="请输入备注" />
        },
        {
          name: 'points',
          label: '分数',
          rules: [{ required: true, message: '请输入分数' }],
          element: <InputNumber placeholder="请输入分数" min={0} style={{ width: '100%' }} />
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
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <Button 
                        type="primary" 
                        icon={<PlusOutlined />}
                        onClick={addNewScoreSetting}
                      >
                        添加新行
                      </Button>
                    </Space>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <Space>
                      <Typography.Text strong>有效记录: {scoreSettings.filter(s => s.isValid).length}</Typography.Text>
                      <Typography.Text strong>无效记录: {scoreSettings.filter(s => !s.isValid).length}</Typography.Text>
                    </Space>
                  </div>

                  <div style={{ marginBottom: 16, fontSize: '12px', color: '#666' }}>
                    可以直接在表格中编辑分数设置
                  </div>
                  
                  <Table
                    columns={scoreSettingColumns}
                    dataSource={scoreSettings}
                    pagination={false}
                    size="small"
                    scroll={{ x: 1600, y: 300 }}
                    rowKey={(record) => record.id}
                  />
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

                  <Row gutter={24}>
                    {/* 职位管理 */}
                    <Col span={12}>
                      <Card title="职位管理" size="small">
                        <div style={{ marginBottom: 16 }}>
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
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={handleCreatePosition}
                              disabled={!positionForm.name.trim()}
                              style={{ width: '100%' }}
                            >
                              创建职位
                            </Button>
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
