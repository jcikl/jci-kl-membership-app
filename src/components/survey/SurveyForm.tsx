import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Space,
  message,
  Divider,
  InputNumber,
  Tabs
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { surveyService } from '@/services/surveyService';
import { Survey, SurveyType, SurveyTargetAudience, SurveySettings } from '@/types';
import QuestionEditor from './QuestionEditor';
import SurveyPreview from './SurveyPreview';

const { TextArea } = Input;
const { Option } = Select;

interface SurveyFormProps {
  mode: 'create' | 'edit';
}

const SurveyForm: React.FC<SurveyFormProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  // 问卷类型选项
  const surveyTypeOptions = [
    { value: 'feedback', label: '反馈问卷' },
    { value: 'evaluation', label: '评估问卷' },
    { value: 'registration', label: '报名表单' },
    { value: 'poll', label: '投票问卷' },
    { value: 'assessment', label: '测评问卷' },
    { value: 'custom', label: '自定义问卷' }
  ];

  // 目标受众选项
  const targetAudienceOptions = [
    { value: 'all_members', label: '所有会员' },
    { value: 'official_members', label: '正式会员' },
    { value: 'associate_members', label: '准会员' },
    { value: 'honorary_members', label: '荣誉会员' },
    { value: 'affiliate_members', label: '联合会员' },
    { value: 'visitor_members', label: '拜访会员' },
    { value: 'specific_roles', label: '特定角色' },
    { value: 'custom', label: '自定义受众' }
  ];

  // 加载问卷数据（编辑模式）
  useEffect(() => {
    if (mode === 'edit' && id) {
      loadSurvey();
    }
  }, [mode, id]);

  const loadSurvey = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const result = await surveyService.getSurvey(id);
      if (result.success && result.data) {
        setSurvey(result.data);
        form.setFieldsValue({
          ...result.data,
          settings: {
            allowBackNavigation: true,
            showProgressBar: true,
            randomizeQuestions: false,
            randomizeOptions: false,
            showQuestionNumbers: true,
            autoSave: true,
            ...result.data.settings
          }
        });
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

  // 保存问卷
  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const surveyData = {
        ...values,
        questions: values.questions || [],
        settings: {
          allowBackNavigation: true,
          showProgressBar: true,
          randomizeQuestions: false,
          randomizeOptions: false,
          showQuestionNumbers: true,
          autoSave: true,
          ...values.settings
        },
        createdBy: 'current-user', // 实际应用中从用户状态获取
        isAnonymous: false,
        allowMultipleResponses: false,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : []
      };

      let result;
      if (mode === 'create') {
        result = await surveyService.createSurvey(surveyData);
      } else {
        result = await surveyService.updateSurvey(id!, surveyData);
      }

      if (result.success) {
        message.success(result.message || '保存成功');
        if (mode === 'create') {
          navigate(`/surveys/${result.data?.id}/edit`);
        }
      } else {
        message.error(result.error || '保存失败');
      }
    } catch (error) {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 发布问卷
  const handlePublish = async () => {
    try {
      const values = await form.validateFields();
      await handleSave(values);
      
      if (mode === 'edit' && id) {
        const result = await surveyService.publishSurvey(id);
        if (result.success) {
          message.success('问卷发布成功');
          navigate('/surveys');
        } else {
          message.error(result.error || '发布失败');
        }
      }
    } catch (error) {
      message.error('请先完善问卷信息');
    }
  };

  // 预览问卷
  const handlePreview = () => {
    setActiveTab('preview');
  };

  return (
    <div>
      <Card title={mode === 'create' ? '创建问卷' : '编辑问卷'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            type: 'custom',
            targetAudience: 'all_members',
            status: 'draft',
            settings: {
              allowBackNavigation: true,
              showProgressBar: true,
              randomizeQuestions: false,
              randomizeOptions: false,
              showQuestionNumbers: true,
              autoSave: true
            }
          }}
        >
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <Row gutter={24}>
                    <Col span={16}>
                      <Form.Item
                        name="title"
                        label="问卷标题"
                        rules={[{ required: true, message: '请输入问卷标题' }]}
                      >
                        <Input placeholder="请输入问卷标题" />
                      </Form.Item>

                      <Form.Item
                        name="description"
                        label="问卷描述"
                      >
                        <TextArea
                          rows={3}
                          placeholder="请输入问卷描述（可选）"
                        />
                      </Form.Item>

                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="type"
                            label="问卷类型"
                            rules={[{ required: true, message: '请选择问卷类型' }]}
                          >
                            <Select options={surveyTypeOptions} />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Form.Item
                            name="targetAudience"
                            label="目标受众"
                            rules={[{ required: true, message: '请选择目标受众' }]}
                          >
                            <Select options={targetAudienceOptions} />
                          </Form.Item>
                        </Col>
                      </Row>

                      <Form.Item
                        name="tags"
                        label="标签"
                        help="用逗号分隔多个标签"
                      >
                        <Input placeholder="例如：活动反馈,满意度调查" />
                      </Form.Item>
                    </Col>

                    <Col span={8}>
                      <Card title="问卷设置" size="small">
                        <Form.Item
                          name={['settings', 'allowBackNavigation']}
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="允许" unCheckedChildren="禁止" />
                          <span style={{ marginLeft: 8 }}>允许返回上一题</span>
                        </Form.Item>

                        <Form.Item
                          name={['settings', 'showProgressBar']}
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                          <span style={{ marginLeft: 8 }}>显示进度条</span>
                        </Form.Item>

                        <Form.Item
                          name={['settings', 'randomizeQuestions']}
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="随机" unCheckedChildren="顺序" />
                          <span style={{ marginLeft: 8 }}>随机问题顺序</span>
                        </Form.Item>

                        <Form.Item
                          name={['settings', 'randomizeOptions']}
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="随机" unCheckedChildren="顺序" />
                          <span style={{ marginLeft: 8 }}>随机选项顺序</span>
                        </Form.Item>

                        <Form.Item
                          name={['settings', 'showQuestionNumbers']}
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
                          <span style={{ marginLeft: 8 }}>显示题号</span>
                        </Form.Item>

                        <Form.Item
                          name={['settings', 'autoSave']}
                          valuePropName="checked"
                        >
                          <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                          <span style={{ marginLeft: 8 }}>自动保存</span>
                        </Form.Item>

                        <Divider />

                        <Form.Item
                          name={['settings', 'timeLimit']}
                          label="时间限制（分钟）"
                        >
                          <InputNumber
                            min={0}
                            placeholder="无限制"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>

                        <Form.Item
                          name={['settings', 'maxAttempts']}
                          label="最大尝试次数"
                        >
                          <InputNumber
                            min={0}
                            placeholder="无限制"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>

                        <Form.Item
                          name={['settings', 'thankYouMessage']}
                          label="感谢信息"
                        >
                          <TextArea
                            rows={2}
                            placeholder="问卷完成后的感谢信息"
                          />
                        </Form.Item>
                      </Card>
                    </Col>
                  </Row>
                )
              },
              {
                key: 'questions',
                label: '问题设计',
                children: (
                  <QuestionEditor
                    questions={survey?.questions || []}
                    onChange={(questions) => form.setFieldValue('questions', questions)}
                  />
                )
              },
              {
                key: 'preview',
                label: '预览',
                children: (
                  <SurveyPreview
                    survey={{
                      ...form.getFieldsValue(),
                      questions: form.getFieldValue('questions') || []
                    }}
                  />
                )
              }
            ]}
          />

          <Divider />

          <Space>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              {mode === 'create' ? '创建问卷' : '保存修改'}
            </Button>

            {mode === 'edit' && survey?.status === 'draft' && (
              <Button
                type="primary"
                onClick={handlePublish}
                loading={loading}
              >
                发布问卷
              </Button>
            )}

            <Button onClick={handlePreview}>
              预览问卷
            </Button>

            <Button onClick={() => navigate('/surveys')}>
              取消
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default SurveyForm;
