import React, { useState } from 'react';
import { Card, Form, Button, message, Space, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import ChapterLogoUpload from './ChapterLogoUpload';

const { Title, Text } = Typography;

/**
 * ChapterLogoUpload 使用示例
 * 展示如何在表单中使用新的分会Logo上传组件
 */
const ChapterLogoUploadExample: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      console.log('表单数据:', values);
      message.success('分会设置保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Title level={3}>分会Logo上传组件示例</Title>
      <Text type="secondary">
        这个示例展示了如何使用新的ChapterLogoUpload组件，它集成了GlobalImageUploadModal和图片管理系统。
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 24 }}
      >
        <Form.Item
          name="logoUrl"
          label="分会Logo"
          extra="支持上传新Logo或从已有Logo中选择"
        >
          <ChapterLogoUpload
            placeholder="点击上传分会Logo"
            maxSize={5}
            enableCompression={true}
            targetSize={{ width: 200, height: 200 }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              保存设置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
        <Title level={4}>功能特性</Title>
        <ul>
          <li>✅ 集成GlobalImageUploadModal，支持多种上传服务</li>
          <li>✅ 自动保存到图片管理系统，便于统一管理</li>
          <li>✅ 支持从已有Logo中选择，避免重复上传</li>
          <li>✅ 图片压缩和尺寸优化</li>
          <li>✅ 预览和删除功能</li>
          <li>✅ 响应式设计，适配不同屏幕尺寸</li>
          <li>✅ 完整的错误处理和用户反馈</li>
        </ul>
      </div>
    </Card>
  );
};

export default ChapterLogoUploadExample;
