import React from 'react';
import { Card, Radio, Space, Typography, Tag, Tooltip } from 'antd';
import { 
  RobotOutlined, 
  GoogleOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';

const { Text } = Typography;

export interface AIService {
  id: 'chatgpt' | 'gemini';
  name: string;
  icon: React.ReactNode;
  description: string;
  isConfigured: boolean;
  isRecommended?: boolean;
}

interface AIServiceSelectorProps {
  selectedService: 'chatgpt' | 'gemini';
  onServiceChange: (service: 'chatgpt' | 'gemini') => void;
  chatGPTConfigured: boolean;
  geminiConfigured: boolean;
}

const AIServiceSelector: React.FC<AIServiceSelectorProps> = ({
  selectedService,
  onServiceChange,
  chatGPTConfigured,
  geminiConfigured
}) => {
  const services: AIService[] = [
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      icon: <RobotOutlined />,
      description: 'OpenAI GPT-3.5-turbo模型',
      isConfigured: chatGPTConfigured,
      isRecommended: true
    },
    {
      id: 'gemini',
      name: 'Gemini',
      icon: <GoogleOutlined />,
      description: 'Google Gemini 1.5 Flash模型',
      isConfigured: geminiConfigured
    }
  ];

  return (
    <Card title="🤖 AI服务选择" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Text type="secondary">
          选择用于PDF解读的AI服务。系统会自动回退到默认响应如果所选服务不可用。
        </Text>
        
        <Radio.Group 
          value={selectedService} 
          onChange={(e) => onServiceChange(e.target.value)}
          style={{ width: '100%' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            {services.map((service) => (
              <Radio key={service.id} value={service.id} style={{ width: '100%' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 0'
                }}>
                  <Space>
                    <span style={{ fontSize: '18px' }}>{service.icon}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text strong>{service.name}</Text>
                        {service.isRecommended && (
                          <Tag color="blue">推荐</Tag>
                        )}
                        {service.isConfigured ? (
                          <Tooltip title="API密钥已配置">
                            <CheckCircleOutlined style={{ color: '#52c41a' }} />
                          </Tooltip>
                        ) : (
                          <Tooltip title="API密钥未配置，将使用默认响应">
                            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                          </Tooltip>
                        )}
                      </div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {service.description}
                      </Text>
                    </div>
                  </Space>
                </div>
              </Radio>
            ))}
          </Space>
        </Radio.Group>

        {!chatGPTConfigured && !geminiConfigured && (
          <div style={{ 
            padding: '12px', 
            background: '#fff7e6', 
            border: '1px solid #ffd591',
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            <Space>
              <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
              <div>
                <Text style={{ color: '#fa8c16', fontSize: '13px' }}>
                  <strong>提示：</strong>未配置任何AI服务API密钥
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  系统将使用默认响应，您可以手动填写表单字段。如需AI解读功能，请配置相应的API密钥。
                </Text>
              </div>
            </Space>
          </div>
        )}

        {selectedService === 'chatgpt' && !chatGPTConfigured && (
          <div style={{ 
            padding: '12px', 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <div>
                <Text style={{ color: '#52c41a', fontSize: '13px' }}>
                  <strong>ChatGPT配置：</strong>在.env文件中设置VITE_OPENAI_API_KEY
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  获取免费API密钥：访问 platform.openai.com 注册账户
                </Text>
              </div>
            </Space>
          </div>
        )}

        {selectedService === 'gemini' && !geminiConfigured && (
          <div style={{ 
            padding: '12px', 
            background: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <div>
                <Text style={{ color: '#52c41a', fontSize: '13px' }}>
                  <strong>Gemini配置：</strong>在.env文件中设置VITE_GEMINI_API_KEY
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  获取免费API密钥：访问 makersuite.google.com 注册账户
                </Text>
              </div>
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};

export default AIServiceSelector;
