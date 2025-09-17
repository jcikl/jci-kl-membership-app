import React from 'react';
import { Form, InputNumber, Select, Switch, Card, Row, Col, Typography, Checkbox, Alert } from 'antd';
import { DollarOutlined, CreditCardOutlined } from '@ant-design/icons';
import { useEventForm } from '@/contexts/EventFormContext';

const { Title, Text } = Typography;
const { Option } = Select;

// 货币选项
const CURRENCY_OPTIONS = [
  { value: 'MYR', label: '马来西亚林吉特 (MYR)' },
  { value: 'USD', label: '美元 (USD)' },
  { value: 'SGD', label: '新加坡元 (SGD)' },
  { value: 'EUR', label: '欧元 (EUR)' },
  { value: 'CNY', label: '人民币 (CNY)' }
];

// 支付方式选项
const PAYMENT_METHOD_OPTIONS = [
  { value: 'bank_transfer', label: '银行转账' },
  { value: 'credit_card', label: '信用卡' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cash', label: '现金' },
  { value: 'check', label: '支票' },
  { value: 'online_payment', label: '在线支付' }
];

interface EventPricingProps {
  onFieldChange?: (field: string, value: any) => void;
}

const EventPricing: React.FC<EventPricingProps> = ({ onFieldChange }) => {
  const { state, updateFormData } = useEventForm();
  const { formData } = state;

  // 处理字段变化
  const handleFieldChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
    onFieldChange?.(field, value);
  };

  // 处理免费活动开关变化
  const handleFreeToggle = (checked: boolean) => {
    handleFieldChange('isFree', checked);
    if (checked) {
      handleFieldChange('price', 0);
      handleFieldChange('paymentMethods', []);
    }
  };

  // 处理支付方式变化
  const handlePaymentMethodsChange = (checkedValues: string[]) => {
    handleFieldChange('paymentMethods', checkedValues);
  };

  // 格式化价格显示
  const formatPrice = (value: number | undefined) => {
    if (value === undefined || value === null) return '';
    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 解析价格输入

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <DollarOutlined style={{ marginRight: 8 }} />
          定价设置
        </Title>
        <Text type="secondary">
          设置活动的费用和支付方式
        </Text>
      </div>

      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <Form.Item label="免费活动">
            <Switch
              checked={formData.isFree}
              onChange={handleFreeToggle}
              checkedChildren="免费"
              unCheckedChildren="收费"
            />
            <Text type="secondary" style={{ marginLeft: 8 }}>
              是否为免费活动
            </Text>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="货币类型"
            required
            validateStatus={state.validationErrors.find(e => e.field === 'currency') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'currency')?.message}
          >
            <Select
              placeholder="请选择货币类型"
              value={formData.currency}
              onChange={(value) => handleFieldChange('currency', value)}
              disabled={formData.isFree}
            >
              {CURRENCY_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      {!formData.isFree && (
        <>
          <Form.Item
            label="活动费用"
            required
            validateStatus={state.validationErrors.find(e => e.field === 'price') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'price')?.message}
          >
            <InputNumber
              placeholder="请输入活动费用"
              value={formData.price}
              onChange={(value) => handleFieldChange('price', value || 0)}
              style={{ width: '100%' }}
              min={0}
              precision={2}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => parseFloat(value!.replace(/[^\d.]/g, '')) || 0}
              addonBefore={formData.currency}
            />
          </Form.Item>

          <Form.Item
            label="支付方式"
            required
            validateStatus={state.validationErrors.find(e => e.field === 'paymentMethods') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'paymentMethods')?.message}
          >
            <Checkbox.Group
              value={formData.paymentMethods}
              onChange={handlePaymentMethodsChange}
            >
              <Row gutter={[16, 8]}>
                {PAYMENT_METHOD_OPTIONS.map(option => (
                  <Col key={option.value} span={8}>
                    <Checkbox value={option.value}>
                      <CreditCardOutlined style={{ marginRight: 4 }} />
                      {option.label}
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </Checkbox.Group>
          </Form.Item>
        </>
      )}

      {formData.isFree && (
        <Alert
          message="免费活动"
          description="选择免费活动后，参与者无需支付任何费用即可参加活动。"
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {!formData.isFree && formData.price > 0 && (
        <Alert
          message="费用信息"
          description={`活动费用：${formData.currency} ${formatPrice(formData.price)}`}
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}

      {/* 费用建议 */}
      {!formData.isFree && (
        <Alert
          message="费用设置建议"
          description={
            <div>
              <p>• 考虑活动成本、场地费用、讲师费用等因素</p>
              <p>• 建议提供多种支付方式以方便参与者</p>
              <p>• 可以设置早鸟价格或团体优惠</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Card>
  );
};

export default EventPricing;
