import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Select, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col,
  message,
  Divider,
  Alert,
  Tag,
  DatePicker
} from 'antd';
import { 
  SettingOutlined, 
  CheckOutlined
} from '@ant-design/icons';
import { Member } from '@/types';
import { getAccountTypeFormOptions } from '@/utils/accountType';

const { Title, Text } = Typography;
const { Option, OptGroup } = Select;
const { TextArea } = Input;

export interface BatchSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (settings: BatchSettings) => Promise<void>;
  selectedMembers: Member[];
  title?: string;
}

export interface BatchSettings {
  field: string;
  value: any;
  reason?: string;
}

const BatchSettingsModal: React.FC<BatchSettingsModalProps> = ({
  visible,
  onClose,
  onConfirm,
  selectedMembers,
  title = "批量设置"
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedField, setSelectedField] = useState<string>('');

  // 可批量设置的字段配置
  const batchFields = [
    {
      key: 'status',
      label: '状态',
      type: 'select',
      options: [
        { value: 'active', label: '活跃' },
        { value: 'inactive', label: '不活跃' },
        { value: 'suspended', label: '暂停' },
        { value: 'pending', label: '待审核' }
      ],
      description: '设置会员的活跃状态'
    },
    {
      key: 'level',
      label: '等级',
      type: 'select',
      options: [
        { value: 'bronze', label: '铜牌' },
        { value: 'silver', label: '银牌' },
        { value: 'gold', label: '金牌' },
        { value: 'platinum', label: '白金' },
        { value: 'diamond', label: '钻石' }
      ],
      description: '设置会员等级'
    },
    {
      key: 'accountType',
      label: '用户户口类别',
      type: 'select',
      options: getAccountTypeFormOptions(),
      description: '设置用户户口类别'
    },
    {
      key: 'joinDate',
      label: '加入时间',
      type: 'date',
      description: '设置会员加入时间'
    },
    {
      key: 'profile.gender',
      label: '性别',
      type: 'select',
      options: [
        { value: 'Male', label: '男' },
        { value: 'Female', label: '女' }
      ],
      description: '设置会员性别'
    },
    {
      key: 'profile.race',
      label: '种族',
      type: 'select',
      options: [
        { value: 'Chinese', label: '华人' },
        { value: 'Malay', label: '马来人' },
        { value: 'Indian', label: '印度人' },
        { value: 'Other', label: '其他' }
      ],
      description: '设置会员种族'
    },
    {
      key: 'profile.nationality',
      label: '国籍',
      type: 'select',
      options: [
        { value: 'Malaysia', label: '马来西亚' },
        { value: 'Singapore', label: '新加坡' },
        { value: 'China', label: '中国' },
        { value: 'India', label: '印度' },
        { value: 'Indonesia', label: '印度尼西亚' },
        { value: 'Thailand', label: '泰国' },
        { value: 'Philippines', label: '菲律宾' },
        { value: 'Vietnam', label: '越南' },
        { value: 'Other', label: '其他' }
      ],
      description: '设置会员国籍'
    },
    {
      key: 'profile.introducerName',
      label: '介绍人姓名',
      type: 'input',
      description: '设置介绍人姓名'
    },
    {
      key: 'profile.whatsappGroup',
      label: 'WhatsApp群组',
      type: 'select',
      options: [
        { value: true, label: '是' },
        { value: false, label: '否' }
      ],
      description: '设置是否加入WhatsApp群组'
    },
    {
      key: 'profile.tshirtReceivingStatus',
      label: 'T恤接收状态',
      type: 'select',
      options: [
        { value: 'Pending', label: '待处理' },
        { value: 'Requested', label: '已申请' },
        { value: 'Processing', label: '处理中' },
        { value: 'Delivered', label: '已送达' }
      ],
      description: '设置T恤接收状态'
    },
    {
      key: 'profile.acceptInternationalBusiness',
      label: '接受国际业务',
      type: 'select',
      options: [
        { value: 'Yes', label: '是' },
        { value: 'No', label: '否' },
        { value: 'Willing to explore', label: '愿意探索' }
      ],
      description: '设置是否接受国际业务'
    },
    {
      key: 'profile.jciPosition',
      label: 'JCI职位',
      type: 'select',
      options: [
        { value: 'president', label: '会长' },
        { value: 'acting_president', label: '代理会长' },
        { value: 'secretary_general', label: '秘书长' },
        { value: 'treasurer', label: '财务' },
        { value: 'advisor_president', label: '顾问会长' },
        { value: 'vice_president', label: '副会长' },
        { value: 'department_head', label: '部门主管' },
        { value: 'official_member', label: '正式会员' },
        { value: 'associate_member', label: '准会员' },
        { value: 'honorary_member', label: '荣誉会员' }
      ],
      description: '设置JCI职位'
    },
    {
      key: 'profile.vpDivision',
      label: '副总裁部门',
      type: 'select',
      options: [
        { value: 'personal_dev', label: '个人发展' },
        { value: 'business_dev', label: '商业发展' },
        { value: 'international_dev', label: '国际发展' },
        { value: 'chapter_admin', label: '分会管理' },
        { value: 'community_dev', label: '社区发展' }
      ],
      description: '设置副总裁部门'
    },
    {
      key: 'profile.isActingPosition',
      label: '代理职位',
      type: 'select',
      options: [
        { value: true, label: '是' },
        { value: false, label: '否' }
      ],
      description: '设置是否为代理职位'
    }
  ];

  useEffect(() => {
    if (visible) {
      form.resetFields();
      setSelectedField('');
    }
  }, [visible, form]);

  const handleFieldChange = (field: string) => {
    setSelectedField(field);
    form.setFieldsValue({ value: undefined });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const settings: BatchSettings = {
        field: values.field,
        value: values.value,
        reason: values.reason
      };
      
      await onConfirm(settings);
      message.success(`成功批量设置 ${selectedMembers.length} 个会员`);
      onClose();
    } catch (error) {
      console.error('Batch settings error:', error);
      message.error('批量设置失败');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentFieldConfig = () => {
    return batchFields.find(field => field.key === selectedField);
  };

  const renderFieldInput = () => {
    const fieldConfig = getCurrentFieldConfig();
    if (!fieldConfig) return null;

    switch (fieldConfig.type) {
      case 'select':
        return (
          <Select
            placeholder={`请选择${fieldConfig.label}`}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) => {
              const text = String(option?.children || '');
              return text.toLowerCase().includes(input.toLowerCase());
            }}
            optionFilterProp="children"
            allowClear
            size="large"
          >
            {fieldConfig.options?.map(option => (
              <Option key={String(option.value)} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
      case 'multiSelect':
        return (
          <Select
            mode="multiple"
            placeholder={`请选择${fieldConfig.label}（可多选）`}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) => {
              const text = String(option?.children || '');
              return text.toLowerCase().includes(input.toLowerCase());
            }}
            optionFilterProp="children"
            allowClear
            size="large"
            maxTagCount="responsive"
          >
            {fieldConfig.options?.map(option => (
              <Option key={String(option.value)} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
      case 'date':
        return (
          <DatePicker
            placeholder={`请选择${fieldConfig.label}`}
            style={{ width: '100%' }}
            format="YYYY-MM-DD"
            size="large"
            allowClear
          />
        );
      case 'input':
        return (
          <Input
            placeholder={`请输入${fieldConfig.label}`}
            size="large"
            allowClear
          />
        );
      case 'textarea':
        return (
          <TextArea
            placeholder={`请输入${fieldConfig.label}`}
            rows={3}
            size="large"
            allowClear
          />
        );
      default:
        return (
          <Input
            placeholder={`请输入${fieldConfig.label}`}
            size="large"
            allowClear
          />
        );
    }
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>{title}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button 
          key="confirm" 
          type="primary" 
          icon={<CheckOutlined />} 
          onClick={handleSubmit}
          loading={loading}
          disabled={!selectedField}
        >
          确认设置
        </Button>
      ]}
    >
      <Alert
        message={`已选择 ${selectedMembers.length} 个会员`}
        description="请选择要批量设置的字段和新值"
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* 快速字段预设 */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ marginBottom: 12, display: 'block' }}>快速选择常用字段：</Text>
        <Space wrap>
          <Button 
            size="small" 
            onClick={() => {
              setSelectedField('status');
              form.setFieldsValue({ field: 'status' });
            }}
          >
            状态
          </Button>
          <Button 
            size="small" 
            onClick={() => {
              setSelectedField('level');
              form.setFieldsValue({ field: 'level' });
            }}
          >
            等级
          </Button>
          <Button 
            size="small" 
            onClick={() => {
              setSelectedField('accountType');
              form.setFieldsValue({ field: 'accountType' });
            }}
          >
            用户户口类别
          </Button>
          <Button 
            size="small" 
            onClick={() => {
              setSelectedField('profile.gender');
              form.setFieldsValue({ field: 'profile.gender' });
            }}
          >
            性别
          </Button>
          <Button 
            size="small" 
            onClick={() => {
              setSelectedField('profile.race');
              form.setFieldsValue({ field: 'profile.race' });
            }}
          >
            种族
          </Button>
          <Button 
            size="small" 
            onClick={() => {
              setSelectedField('profile.nationality');
              form.setFieldsValue({ field: 'profile.nationality' });
            }}
          >
            国籍
          </Button>
        </Space>
      </div>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="field"
          label="选择字段"
          rules={[{ required: true, message: '请选择要设置的字段' }]}
        >
          <Select
            placeholder="请选择要批量设置的字段"
            onChange={handleFieldChange}
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) => {
              const field = batchFields.find(f => f.key === option?.value);
              return field ? 
                field.label.toLowerCase().includes(input.toLowerCase()) ||
                field.description.toLowerCase().includes(input.toLowerCase())
                : false;
            }}
            optionFilterProp="children"
            size="large"
          >
            <OptGroup label="基本信息">
              {batchFields.filter(field => 
                ['status', 'level', 'accountType', 'joinDate'].includes(field.key)
              ).map(field => (
                <Option key={field.key} value={field.key}>
                  <div>
                    <div>{field.label}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {field.description}
                    </Text>
                  </div>
                </Option>
              ))}
            </OptGroup>
            
            <OptGroup label="个人资料">
              {batchFields.filter(field => 
                ['profile.gender', 'profile.race', 'profile.nationality', 'profile.introducerName'].includes(field.key)
              ).map(field => (
                <Option key={field.key} value={field.key}>
                  <div>
                    <div>{field.label}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {field.description}
                    </Text>
                  </div>
                </Option>
              ))}
            </OptGroup>
            
            <OptGroup label="JCI信息">
              {batchFields.filter(field => 
                ['profile.jciPosition', 'profile.vpDivision', 'profile.isActingPosition'].includes(field.key)
              ).map(field => (
                <Option key={field.key} value={field.key}>
                  <div>
                    <div>{field.label}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {field.description}
                    </Text>
                  </div>
                </Option>
              ))}
            </OptGroup>
            
            <OptGroup label="其他设置">
              {batchFields.filter(field => 
                ['profile.whatsappGroup', 'profile.tshirtReceivingStatus', 'profile.acceptInternationalBusiness'].includes(field.key)
              ).map(field => (
                <Option key={field.key} value={field.key}>
                  <div>
                    <div>{field.label}</div>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {field.description}
                    </Text>
                  </div>
                </Option>
              ))}
            </OptGroup>
          </Select>
        </Form.Item>

        {selectedField && (
          <>
            {/* 字段信息预览 */}
            <div style={{ 
              marginBottom: 16, 
              padding: 12, 
              background: '#f0f9ff', 
              borderRadius: 6,
              border: '1px solid #e6f7ff'
            }}>
              <Text strong style={{ color: '#1890ff' }}>
                {getCurrentFieldConfig()?.label}
              </Text>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {getCurrentFieldConfig()?.description}
                </Text>
              </div>
            </div>

            <Form.Item
              name="value"
              label={`设置${getCurrentFieldConfig()?.label}`}
              rules={[{ required: true, message: '请设置新值' }]}
            >
              {renderFieldInput()}
            </Form.Item>

            <Form.Item
              name="reason"
              label="设置原因"
              rules={[{ required: true, message: '请说明设置原因' }]}
            >
              <TextArea
                placeholder="请说明批量设置的原因..."
                rows={3}
                maxLength={200}
                showCount
              />
            </Form.Item>
          </>
        )}

        {selectedMembers.length > 0 && (
          <div>
            <Divider />
            <Title level={5}>将影响的会员：</Title>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <Row gutter={[8, 8]}>
                {selectedMembers.map(member => (
                  <Col span={12} key={member.id}>
                    <Tag color="blue" style={{ marginBottom: '4px' }}>
                      {member.name}
                    </Tag>
                  </Col>
                ))}
              </Row>
            </div>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default BatchSettingsModal;
