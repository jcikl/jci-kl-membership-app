import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Space,
  Button,
  Tag,
  Row,
  Col,
  Statistic,
  message,
  Tabs,
  Alert
} from 'antd';
import {
  EditOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  CopyOutlined,
  BarChartOutlined,
  EyeOutlined,
  ShareAltOutlined,
  FileTextOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { surveyService } from '@/services/surveyService';
import { Survey } from '@/types';
import SurveyPreview from '@/components/survey/SurveyPreview';
import SurveyAnalyticsSimple from '@/components/survey/SurveyAnalyticsSimple';

const { Title, Text } = Typography;

const SurveyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');

  // 加载问卷数据
  useEffect(() => {
    if (id) {
      loadSurvey();
    }
  }, [id]);

  const loadSurvey = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const result = await surveyService.getSurvey(id);
      if (result.success && result.data) {
        setSurvey(result.data);
      } else {
        message.error(result.error || '加载问卷失败');
        navigate('/surveys');
      }
    } catch (error) {
      message.error('加载问卷失败');
      navigate('/surveys');
    } finally {
      setLoading(false);
    }
  };

  // 处理问卷操作
  const handleAction = async (action: string) => {
    if (!survey) return;

    try {
      let result;
      switch (action) {
        case 'publish':
          result = await surveyService.publishSurvey(survey.id);
          break;
        case 'close':
          result = await surveyService.closeSurvey(survey.id);
          break;
        case 'duplicate':
          result = await surveyService.duplicateSurvey(survey.id, `副本 - ${survey.title}`, 'current-user');
          break;
        default:
          return;
      }

      if (result.success) {
        message.success(result.message || '操作成功');
        loadSurvey();
      } else {
        message.error(result.error || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 获取状态标签颜色
  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'draft': return 'default';
  //     case 'published': return 'green';
  //     case 'closed': return 'orange';
  //     case 'archived': return 'gray';
  //     default: return 'default';
  //   }
  // };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'published': return '已发布';
      case 'closed': return '已关闭';
      case 'archived': return '已归档';
      default: return status;
    }
  };

  // 获取类型文本
  const getTypeText = (type: string) => {
    switch (type) {
      case 'feedback': return '反馈';
      case 'evaluation': return '评估';
      case 'registration': return '报名';
      case 'poll': return '投票';
      case 'assessment': return '测评';
      case 'custom': return '自定义';
      default: return type;
    }
  };

  // 获取目标受众文本
  const getTargetAudienceText = (audience: string) => {
    switch (audience) {
      case 'all_members': return '所有会员';
      case 'official_members': return '正式会员';
      case 'associate_members': return '准会员';
      case 'honorary_members': return '荣誉会员';
      case 'affiliate_members': return '联合会员';
      case 'visitor_members': return '拜访会员';
      case 'specific_roles': return '特定角色';
      case 'custom': return '自定义';
      default: return audience;
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Text>加载问卷中...</Text>
        </div>
      </Card>
    );
  }

  if (!survey) {
    return (
      <Card>
        <Alert
          message="问卷不存在"
          description="请检查问卷链接是否正确"
          type="error"
          showIcon
        />
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* 问卷头部信息 */}
      <Card 
        style={{ 
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none'
        }}
        styles={{ body: { padding: '32px' } }}
      >
        <Row align="middle" justify="space-between">
          <Col span={18}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <FileTextOutlined style={{ fontSize: '32px', marginRight: '16px', color: 'white' }} />
              <div>
                <Title level={2} style={{ margin: 0, color: 'white' }}>
                  {survey.title}
                </Title>
                {survey.description && (
                  <Text style={{ display: 'block', marginTop: '8px', color: 'white', opacity: 0.9 }}>
                    {survey.description}
                  </Text>
                )}
              </div>
            </div>
            
            <Space wrap>
              <Tag color={survey.status === 'published' ? 'green' : 'orange'}>
                {getStatusText(survey.status)}
              </Tag>
              <Tag color="white" style={{ color: '#667eea' }}>
                {getTypeText(survey.type)}
              </Tag>
              <Tag color="white" style={{ color: '#667eea' }}>
                {getTargetAudienceText(survey.targetAudience)}
              </Tag>
              {survey.tags.map(tag => (
                <Tag key={tag} color="white" style={{ color: '#667eea' }}>
                  {tag}
                </Tag>
              ))}
            </Space>
          </Col>
          
          <Col span={6}>
            <Space direction="vertical" align="end" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                style={{ 
                  background: 'rgba(255,255,255,0.9)', 
                  border: '1px solid rgba(255,255,255,0.9)',
                  color: '#667eea'
                }}
                block
              >
                编辑问卷
              </Button>
              
              {survey.status === 'draft' && (
                <Button
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleAction('publish')}
                  style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                  block
                >
                  发布问卷
                </Button>
              )}
              
              {survey.status === 'published' && (
                <Button
                  icon={<PauseCircleOutlined />}
                  onClick={() => handleAction('close')}
                  style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                  block
                >
                  关闭问卷
                </Button>
              )}
              
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleAction('duplicate')}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white'
                }}
                block
              >
                复制问卷
              </Button>
              
              <Button
                icon={<BarChartOutlined />}
                onClick={() => setActiveTab('analytics')}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white'
                }}
                block
              >
                查看分析
              </Button>
              
              <Button
                icon={<ShareAltOutlined />}
                style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white'
                }}
                block
              >
                分享问卷
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计信息 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #52c41a 0%, #3f8600 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic
              title={<span style={{ color: 'white', opacity: 0.9 }}>总回答数</span>}
              value={survey.totalResponses}
              prefix={<BarChartOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              收到的回答总数
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic
              title={<span style={{ color: 'white', opacity: 0.9 }}>问题数量</span>}
              value={survey.questions.length}
              prefix={<FileTextOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              问卷中的问题数
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic
              title={<span style={{ color: 'white', opacity: 0.9 }}>创建时间</span>}
              value={new Date(survey.createdAt).toLocaleDateString()}
              prefix={<ClockCircleOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              问卷创建日期
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)',
              color: 'white',
              border: 'none'
            }}
            styles={{ body: { padding: '24px' } }}
          >
            <Statistic
              title={<span style={{ color: 'white', opacity: 0.9 }}>最后更新</span>}
              value={new Date(survey.updatedAt).toLocaleDateString()}
              prefix={<TrophyOutlined style={{ color: 'white' }} />}
              valueStyle={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}
            />
            <div style={{ marginTop: '8px', color: 'white', opacity: 0.8, fontSize: '14px' }}>
              最近更新日期
            </div>
          </Card>
        </Col>
      </Row>

      {/* 问卷内容 */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          items={[
            {
              key: 'preview',
              label: (
                <span>
                  <EyeOutlined />
                  预览
                </span>
              ),
              children: <SurveyPreview survey={survey} mode="preview" />
            },
            {
              key: 'responses',
              label: (
                <span>
                  <UserOutlined />
                  回答
                </span>
              ),
              children: (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  <Text>回答管理功能开发中...</Text>
                </div>
              )
            },
            {
              key: 'analytics',
              label: (
                <span>
                  <BarChartOutlined />
                  分析
                </span>
              ),
              children: <SurveyAnalyticsSimple surveyId={survey.id} />
            },
            {
              key: 'settings',
              label: (
                <span>
                  <CheckCircleOutlined />
                  设置
                </span>
              ),
              children: (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  <Text>问卷设置功能开发中...</Text>
                </div>
              )
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default SurveyDetailPage;
