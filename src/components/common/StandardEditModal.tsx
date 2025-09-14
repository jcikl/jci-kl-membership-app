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
  Typography
} from 'antd';
import { TeamManagement } from '../../types/awards';
import TeamManagementModal from './TeamManagementModal';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

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
  const [teamManagementModalVisible, setTeamManagementModalVisible] = useState(false);
  const [teamManagement, setTeamManagement] = useState<TeamManagement | null>(null);

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, initialValues, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
      form.resetFields();
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  const handleTeamManagementOpen = () => {
    // 初始化团队管理数据
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
    setTeamManagementModalVisible(true);
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
        width={800}
        destroyOnClose
      >
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

          {showTeamManagement && (
            <>
              <Divider />
              <Card size="small" title="团队管理">
                <Space>
                  <Button 
                    type="primary" 
                    onClick={handleTeamManagementOpen}
                  >
                    管理团队
                  </Button>
                  <Text type="secondary">
                    点击管理团队来设置项目团队结构和成员分配
                  </Text>
                </Space>
              </Card>
            </>
          )}
        </Form>
      </Modal>

      {/* Team Management Modal */}
      <TeamManagementModal
        visible={teamManagementModalVisible}
        onClose={() => setTeamManagementModalVisible(false)}
        title={`团队管理 - ${title}`}
        teamManagement={teamManagement}
        members={members}
        onUpdateTeamManagement={(updatedTeamManagement) => setTeamManagement(updatedTeamManagement)}
      />
    </>
  );
};

export default StandardEditModal;
