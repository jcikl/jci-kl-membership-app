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
  ShareAltOutlined
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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'published': return 'green';
      case 'closed': return 'orange';
      case 'archived': return 'gray';
      default: return 'default';
    }
  };

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
    <div>
      {/* 问卷头部信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="top">
          <Col span={18}>
            <Title level={2}>{survey.title}</Title>
            {survey.description && (
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                {survey.description}
              </Text>
            )}
            
            <Space wrap>
              <Tag color={getStatusColor(survey.status)}>
                {getStatusText(survey.status)}
              </Tag>
              <Tag>{getTypeText(survey.type)}</Tag>
              <Tag>{getTargetAudienceText(survey.targetAudience)}</Tag>
              {survey.tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          </Col>
          
          <Col span={6}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => navigate(`/surveys/${survey.id}/edit`)}
                block
              >
                编辑问卷
              </Button>
              
              {survey.status === 'draft' && (
                <Button
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleAction('publish')}
                  block
                >
                  发布问卷
                </Button>
              )}
              
              {survey.status === 'published' && (
                <Button
                  icon={<PauseCircleOutlined />}
                  onClick={() => handleAction('close')}
                  block
                >
                  关闭问卷
                </Button>
              )}
              
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleAction('duplicate')}
                block
              >
                复制问卷
              </Button>
              
              <Button
                icon={<BarChartOutlined />}
                onClick={() => setActiveTab('analytics')}
                block
              >
                查看分析
              </Button>
              
              <Button
                icon={<ShareAltOutlined />}
                block
              >
                分享问卷
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计信息 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总回答数"
              value={survey.totalResponses}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="问题数量"
              value={survey.questions.length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="创建时间"
              value={new Date(survey.createdAt).toLocaleDateString()}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最后更新"
              value={new Date(survey.updatedAt).toLocaleDateString()}
            />
          </Card>
        </Col>
      </Row>

      {/* 问卷内容 */}
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'preview',
              label: '预览',
              children: <SurveyPreview survey={survey} mode="preview" />
            },
            {
              key: 'responses',
              label: '回答',
              children: (
                <div style={{ textAlign: 'center', padding: '50px 0' }}>
                  <Text>回答管理功能开发中...</Text>
                </div>
              )
            },
            {
              key: 'analytics',
              label: '分析',
              children: <SurveyAnalyticsSimple surveyId={survey.id} />
            },
            {
              key: 'settings',
              label: '设置',
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
