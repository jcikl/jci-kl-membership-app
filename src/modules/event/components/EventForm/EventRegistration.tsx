import React from 'react';
import { Form, InputNumber, DatePicker, Card, Row, Col, Typography, Switch, Alert } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useEventForm } from '@/contexts/EventFormContext';

const { Title, Text } = Typography;

interface EventRegistrationProps {
  onFieldChange?: (field: string, value: any) => void;
}

const EventRegistration: React.FC<EventRegistrationProps> = ({ onFieldChange }) => {
  const { state, updateFormData } = useEventForm();
  const { formData } = state;

  // 处理字段变化
  const handleFieldChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
    onFieldChange?.(field, value);
  };

  // 处理注册时间变化
  const handleRegistrationTimeChange = (field: string, date: any) => {
    handleFieldChange(field, date);
  };

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <UserOutlined style={{ marginRight: 8 }} />
          注册设置
        </Title>
        <Text type="secondary">
          设置活动的注册时间、人数限制和注册表单
        </Text>
      </div>

      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="注册开始时间"
            validateStatus={state.validationErrors.find(e => e.field === 'registrationStartDate') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'registrationStartDate')?.message}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择注册开始时间（可选）"
              value={formData.registrationStartDate}
              onChange={(date) => handleRegistrationTimeChange('registrationStartDate', date)}
              disabledDate={(current) => {
                const startDate = formData.startDate;
                if (!startDate) return false;
                return current && current.isAfter(startDate, 'day');
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="注册结束时间"
            validateStatus={state.validationErrors.find(e => e.field === 'registrationEndDate') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'registrationEndDate')?.message}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择注册结束时间（可选）"
              value={formData.registrationEndDate}
              onChange={(date) => handleRegistrationTimeChange('registrationEndDate', date)}
              disabledDate={(current) => {
                const registrationStartDate = formData.registrationStartDate;
                const startDate = formData.startDate;
                if (!registrationStartDate && !startDate) return false;
                const limitDate = registrationStartDate || startDate;
                return current && current.isBefore(limitDate, 'day');
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="最大参与人数"
            validateStatus={state.validationErrors.find(e => e.field === 'maxParticipants') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'maxParticipants')?.message}
          >
            <InputNumber
              placeholder="请输入最大参与人数"
              value={formData.maxParticipants}
              onChange={(value) => handleFieldChange('maxParticipants', value || 0)}
              style={{ width: '100%' }}
              min={0}
              max={10000}
              addonBefore={<UserOutlined />}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="需要注册表单">
            <Switch
              checked={!!formData.registrationForm}
              onChange={(checked) => handleFieldChange('registrationForm', checked ? {} : null)}
              checkedChildren="需要"
              unCheckedChildren="不需要"
            />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              是否需要参与者填写注册表单
            </Text>
          </Form.Item>
        </Col>
      </Row>

      {formData.registrationForm && (
        <Form.Item label="注册表单字段">
          <Alert
            message="注册表单配置"
            description="注册表单的详细配置将在后续版本中提供，目前使用默认表单。"
            type="info"
            showIcon
            style={{ marginTop: 8 }}
          />
        </Form.Item>
      )}

      {/* 注册时间逻辑检查 */}
      {formData.registrationStartDate && formData.registrationEndDate && (
        <Alert
          message="注册时间"
          description={`注册开放时间：${formData.registrationStartDate.format('YYYY-MM-DD HH:mm')} 至 ${formData.registrationEndDate.format('YYYY-MM-DD HH:mm')}`}
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 人数限制提示 */}
      {formData.maxParticipants > 0 && (
        <Alert
          message="参与人数限制"
          description={`活动最大参与人数：${formData.maxParticipants} 人`}
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 注册设置建议 */}
      <Alert
        message="注册设置建议"
        description={
          <div>
            <p>• 建议设置合理的注册时间，给参与者充足的准备时间</p>
            <p>• 根据场地容量设置最大参与人数</p>
            <p>• 考虑设置注册截止时间，避免临时注册</p>
            <p>• 可以设置早鸟注册优惠或团体注册折扣</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />

      {/* 时间冲突检查 */}
      {formData.startDate && formData.registrationEndDate && 
       formData.registrationEndDate.isAfter(formData.startDate) && (
        <Alert
          message="时间冲突警告"
          description="注册结束时间晚于活动开始时间，建议调整注册时间。"
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};

export default EventRegistration;
