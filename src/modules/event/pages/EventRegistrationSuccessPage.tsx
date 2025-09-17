import React from 'react';
import { Result, Button, Typography, Card, Row, Col, Space } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const EventRegistrationSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  // const { id } = useParams<{ id: string }>();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '50px 20px' }}>
      <Row justify="center">
        <Col xs={24} sm={20} md={16} lg={12}>
          <Card>
            <Result
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              title="注册成功！"
              subTitle="您的活动注册申请已提交，请等待审核。我们会通过邮件或短信通知您审核结果。"
              extra={[
                <Button
                  type="primary"
                  key="events"
                  onClick={() => navigate('/events')}
                >
                  查看更多活动
                </Button>,
                <Button
                  key="home"
                  onClick={() => navigate('/dashboard')}
                >
                  返回首页
                </Button>,
              ]}
            />
            
            <div style={{ marginTop: 32 }}>
              <Title level={4}>接下来会发生什么？</Title>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    background: '#1890ff', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    fontSize: '12px'
                  }}>
                    1
                  </div>
                  <div>
                    <Text strong>审核您的注册申请</Text>
                    <br />
                    <Text type="secondary">我们会在1-2个工作日内审核您的申请</Text>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    background: '#1890ff', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    fontSize: '12px'
                  }}>
                    2
                  </div>
                  <div>
                    <Text strong>发送确认通知</Text>
                    <br />
                    <Text type="secondary">审核通过后，我们会发送确认邮件和活动详情</Text>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    background: '#1890ff', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    fontSize: '12px'
                  }}>
                    3
                  </div>
                  <div>
                    <Text strong>参加活动</Text>
                    <br />
                    <Text type="secondary">按时参加活动，享受精彩体验</Text>
                  </div>
                </div>
              </Space>
            </div>

            <div style={{ 
              marginTop: 32, 
              padding: 16, 
              background: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: 6
            }}>
              <Title level={5} style={{ color: '#389e0d', marginBottom: 8 }}>
                💡 温馨提示
              </Title>
              <Space direction="vertical" size="small">
                <Text>
                  • 请保持手机和邮箱畅通，以便接收重要通知
                </Text>
                <Text>
                  • 如需取消注册，请至少在活动开始前24小时联系我们
                </Text>
                <Text>
                  • 如有任何问题，请联系活动组织者
                </Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default EventRegistrationSuccessPage;
