import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Row,
  Col,
  Typography,
  Space,
  Divider,
} from 'antd';
import {
  SaveOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { Switch } from 'antd';
import ImageUpload from './ImageUpload';
import { getChapterSettings, saveChapterSettings, getDefaultChapterSettings } from '@/services/chapterSettingsService';
import type { ChapterSettings } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ChapterSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ChapterSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 加载分会设置
  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getChapterSettings();
      if (data) {
        setSettings(data);
        form.setFieldsValue(data);
      } else {
        // 如果没有设置，使用默认值
        const defaultSettings = getDefaultChapterSettings();
        form.setFieldsValue(defaultSettings);
      }
      setHasUnsavedChanges(false); // 重置修改状态
    } catch (error) {
      message.error('加载分会设置失败');
      console.error('加载分会设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // 保存设置
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      await saveChapterSettings(values);
      message.success('分会设置保存成功');
      setHasUnsavedChanges(false); // 重置修改状态
      await loadSettings(); // 重新加载设置
    } catch (error) {
      message.error('保存分会设置失败');
      console.error('保存分会设置失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 检查表单是否有修改
  const hasChanges = () => {
    const currentValues = form.getFieldsValue();
    if (!settings) return false;
    
    return Object.keys(currentValues).some(key => {
      const currentValue = currentValues[key];
      const originalValue = settings[key as keyof ChapterSettings];
      return currentValue !== originalValue;
    });
  };

  // 处理表单值变化
  const handleValuesChange = () => {
    setHasUnsavedChanges(hasChanges());
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            分会基本信息设置
            {hasUnsavedChanges && (
              <Text type="warning" style={{ marginLeft: 8, fontSize: 14 }}>
                (有未保存的修改)
              </Text>
            )}
          </Title>
          <Text type="secondary">
            配置分会的基本信息，包括分会名字、成立年份等
          </Text>
        </div>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          onValuesChange={handleValuesChange}
          disabled={loading}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="chapterName"
                label="分会名字"
                rules={[
                  { required: true, message: '请输入分会名字' },
                  { max: 100, message: '分会名字不能超过100个字符' }
                ]}
              >
                <Input placeholder="请输入分会名字，如：JCI Kuala Lumpur" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="establishmentYear"
                label="成立年份"
                rules={[
                  { required: true, message: '请输入成立年份' },
                  { type: 'number', min: 1900, max: new Date().getFullYear(), message: '请输入有效的年份' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入成立年份"
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="description"
                label="分会简介"
                rules={[
                  { max: 500, message: '分会简介不能超过500个字符' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="请输入分会简介，描述分会的使命、愿景等"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">用户户口类别晋升条件</Divider>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item name={["promotionRules", "minAgeForActive"]} label="最低年龄（活跃/晋升参考）">
                <InputNumber style={{ width: '100%' }} min={0} max={120} placeholder="如：21" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={["promotionRules", "requirePaymentVerified"]} label="需付款核验">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name={["promotionRules", "requireSenatorIdForHonorary"]} label="荣誉需参议员编号">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item name={["promotionRules", "nationalityWhitelist"]} label="国籍白名单（逗号分隔）">
                <Input placeholder="例如：MY, SG, CN" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">联系信息</Divider>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="contactEmail"
                label="联系邮箱"
                rules={[
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入联系邮箱" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="contactPhone"
                label="联系电话"
                rules={[
                  { max: 20, message: '联系电话不能超过20个字符' }
                ]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="address"
                label="分会地址"
                rules={[
                  { max: 200, message: '分会地址不能超过200个字符' }
                ]}
              >
                <Input placeholder="请输入分会地址" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="website"
                label="官方网站"
                rules={[
                  { type: 'url', message: '请输入有效的网址' }
                ]}
              >
                <Input placeholder="请输入官方网站地址" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">分会标识</Divider>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="logoUrl"
                label="分会Logo"
                extra="支持 JPG、PNG、GIF 格式，最大 5MB，系统会根据比例自动缩放到合适尺寸"
              >
                <ImageUpload
                  placeholder="点击上传分会Logo"
                  maxSize={5}
                  accept="image/*"
                  storagePath="chapter-logos"
                  enableCompression={true}
                  targetSize={{ width: 200, height: 200 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              disabled={loading || !hasUnsavedChanges}
            >
              {hasUnsavedChanges ? '保存修改' : '已保存'}
            </Button>
          </Form.Item>
        </Form>
      </Space>
    </Card>
  );
};

export default ChapterSettings;
