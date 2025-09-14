import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  Space,
  Typography,
  Divider,
  Row,
  Col,
  message,
  Tabs,
  Upload,
  Select,
} from 'antd';
import {
  SettingOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const EventSettings: React.FC = () => {
  const [form] = useForm();
  const [loading, setLoading] = useState(false);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // 保存设置逻辑
      console.log('保存设置:', values);
      message.success('设置保存成功');
    } catch (error) {
      console.error('保存设置失败:', error);
      message.error('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <Card title="常规设置">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          autoApprove: false,
          requirePaymentProof: true,
          allowCancellation: true,
          cancellationDeadline: 7,
          defaultCurrency: 'MYR',
          timezone: 'Asia/Kuala_Lumpur',
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="默认货币"
              name="defaultCurrency"
            >
              <Select>
                <Option value="MYR">MYR (马来西亚林吉特)</Option>
                <Option value="USD">USD (美元)</Option>
                <Option value="SGD">SGD (新加坡元)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="时区"
              name="timezone"
            >
              <Select>
                <Option value="Asia/Kuala_Lumpur">Asia/Kuala_Lumpur</Option>
                <Option value="Asia/Singapore">Asia/Singapore</Option>
                <Option value="UTC">UTC</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="自动批准注册"
              name="autoApprove"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="需要付款证明"
              name="requirePaymentProof"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="允许取消注册"
              name="allowCancellation"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="取消截止时间（天）"
              name="cancellationDeadline"
            >
              <Input type="number" min={0} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card title="通知设置">
      <Form
        layout="vertical"
        initialValues={{
          emailNotifications: true,
          smsNotifications: false,
          adminNotifications: true,
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item
              label="邮件通知"
              name="emailNotifications"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="短信通知"
              name="smsNotifications"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              label="管理员通知"
              name="adminNotifications"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Divider />
        <Title level={5}>邮件模板</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item
              label="注册确认邮件模板"
              name="registrationEmailTemplate"
            >
              <TextArea
                rows={6}
                placeholder="请输入注册确认邮件模板内容"
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              label="批准通知邮件模板"
              name="approvalEmailTemplate"
            >
              <TextArea
                rows={6}
                placeholder="请输入批准通知邮件模板内容"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );

  const renderTemplateSettings = () => (
    <Card title="模板设置">
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="活动封面模板" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                listType="picture-card"
                showUploadList={false}
                beforeUpload={() => false}
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传封面模板</div>
                </div>
              </Upload>
              <Button type="link" size="small">
                下载默认模板
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="证书模板" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Upload
                listType="picture-card"
                showUploadList={false}
                beforeUpload={() => false}
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>上传证书模板</div>
                </div>
              </Upload>
              <Button type="link" size="small">
                下载默认模板
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </Card>
  );

  const renderIntegrationSettings = () => (
    <Card title="集成设置">
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Title level={5}>支付网关</Title>
          <Form layout="vertical">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="支付网关类型"
                  name="paymentGateway"
                >
                  <Select placeholder="选择支付网关">
                    <Option value="stripe">Stripe</Option>
                    <Option value="paypal">PayPal</Option>
                    <Option value="razorpay">Razorpay</Option>
                    <Option value="offline">线下支付</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="API密钥"
                  name="paymentApiKey"
                >
                  <Input.Password placeholder="请输入API密钥" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Col>
        <Divider />
        <Col xs={24}>
          <Title level={5}>邮件服务</Title>
          <Form layout="vertical">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="SMTP服务器"
                  name="smtpServer"
                >
                  <Input placeholder="请输入SMTP服务器地址" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="SMTP端口"
                  name="smtpPort"
                >
                  <Input type="number" placeholder="请输入SMTP端口" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="发送邮箱"
                  name="senderEmail"
                >
                  <Input placeholder="请输入发送邮箱" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="邮箱密码"
                  name="emailPassword"
                >
                  <Input.Password placeholder="请输入邮箱密码" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>
          <SettingOutlined style={{ marginRight: 8 }} />
          系统设置
        </Title>
        <Text type="secondary">
          配置活动管理系统的各项设置和参数
        </Text>
      </div>

      <Tabs 
        defaultActiveKey="general" 
        items={[
          {
            key: 'general',
            label: '常规设置',
            children: renderGeneralSettings()
          },
          {
            key: 'notification',
            label: '通知设置',
            children: renderNotificationSettings()
          },
          {
            key: 'template',
            label: '模板设置',
            children: renderTemplateSettings()
          },
          {
            key: 'integration',
            label: '集成设置',
            children: renderIntegrationSettings()
          }
        ]} 
      />

      <Card style={{ marginTop: 24 }}>
        <Row justify="end">
          <Space>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={loading}
            >
              保存设置
            </Button>
          </Space>
        </Row>
      </Card>
    </div>
  );
};

export default EventSettings;
