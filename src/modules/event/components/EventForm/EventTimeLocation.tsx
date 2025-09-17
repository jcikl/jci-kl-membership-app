import React from 'react';
import { Form, Input, DatePicker, Switch, Card, Row, Col, Typography, Alert } from 'antd';
import { CalendarOutlined, EnvironmentOutlined, GlobalOutlined } from '@ant-design/icons';
import { useEventForm } from '@/contexts/EventFormContext';

const { Title, Text } = Typography;

interface EventTimeLocationProps {
  onFieldChange?: (field: string, value: any) => void;
}

const EventTimeLocation: React.FC<EventTimeLocationProps> = ({ onFieldChange }) => {
  const { state, updateFormData } = useEventForm();
  const { formData } = state;

  // 处理字段变化
  const handleFieldChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
    onFieldChange?.(field, value);
  };

  // 处理虚拟活动开关变化
  const handleVirtualToggle = (checked: boolean) => {
    handleFieldChange('isVirtual', checked);
    if (!checked) {
      handleFieldChange('virtualLink', '');
    }
  };

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <CalendarOutlined style={{ marginRight: 8 }} />
          时间地点
        </Title>
        <Text type="secondary">
          设置活动的时间安排和地点信息
        </Text>
      </div>

      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动开始时间"
            required
            validateStatus={state.validationErrors.find(e => e.field === 'startDate') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'startDate')?.message}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择活动开始时间"
              value={formData.startDate}
              onChange={(date) => handleFieldChange('startDate', date)}
              disabledDate={(current) => {
                const endDate = formData.endDate;
                if (!endDate) return false;
                return current && current.isAfter(endDate, 'day');
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动结束时间"
            required
            validateStatus={state.validationErrors.find(e => e.field === 'endDate') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'endDate')?.message}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="请选择活动结束时间"
              value={formData.endDate}
              onChange={(date) => handleFieldChange('endDate', date)}
              disabledDate={(current) => {
                const startDate = formData.startDate;
                if (!startDate) return false;
                return current && current.isBefore(startDate, 'day');
              }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动地点"
            required
            validateStatus={state.validationErrors.find(e => e.field === 'location') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'location')?.message}
          >
            <Input
              placeholder="请输入活动地点"
              value={formData.location}
              onChange={(e) => handleFieldChange('location', e.target.value)}
              prefix={<EnvironmentOutlined />}
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="虚拟活动">
            <Switch
              checked={formData.isVirtual}
              onChange={handleVirtualToggle}
              checkedChildren="是"
              unCheckedChildren="否"
            />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              是否为在线虚拟活动
            </Text>
          </Form.Item>
        </Col>
      </Row>

      {formData.isVirtual && (
        <Form.Item
          label="虚拟活动链接"
          validateStatus={state.validationErrors.find(e => e.field === 'virtualLink') ? 'error' : ''}
          help={state.validationErrors.find(e => e.field === 'virtualLink')?.message}
        >
          <Input
            placeholder="请输入虚拟活动链接（如Zoom、Teams等）"
            value={formData.virtualLink}
            onChange={(e) => handleFieldChange('virtualLink', e.target.value)}
            prefix={<GlobalOutlined />}
            maxLength={500}
            showCount
          />
        </Form.Item>
      )}

      {formData.isVirtual && (
        <Alert
          message="虚拟活动提示"
          description="选择虚拟活动后，请确保提供有效的在线会议链接，并提前测试链接的有效性。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 时间冲突检查 */}
      {formData.startDate && formData.endDate && (
        <Alert
          message="活动时长"
          description={`活动将持续 ${formData.endDate.diff(formData.startDate, 'hour')} 小时 ${formData.endDate.diff(formData.startDate, 'minute') % 60} 分钟`}
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};

export default EventTimeLocation;
