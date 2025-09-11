import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Progress,
  Form,
  Input,
  Radio,
  Checkbox,
  Rate,
  DatePicker,
  TimePicker,
  InputNumber,
  Upload,
  Slider,
  Row,
  Col,
  Divider,
  Typography,
  Alert,
  message,
  Modal
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  UploadOutlined,
  SaveOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { surveyService, surveyResponseService } from '@/services/surveyService';
import { Survey, SurveyQuestion, QuestionType, SurveyResponse } from '@/types';

const { TextArea } = Input;
const { Title, Text } = Typography;

const SurveyResponseForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const questions = survey?.questions || [];
  const settings = survey?.settings || {};
  const currentQuestion = questions[currentQuestionIndex];

  // 计算进度
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

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
        
        // 检查问卷状态
        if (result.data.status !== 'published') {
          message.error('问卷未发布或已关闭');
          navigate('/surveys');
          return;
        }

        // 检查是否过期
        if (result.data.expiresAt && new Date(result.data.expiresAt) < new Date()) {
          message.error('问卷已过期');
          navigate('/surveys');
          return;
        }

        // 初始化表单
        form.setFieldsValue({});
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

  // 处理答案变化
  const handleAnswerChange = (questionId: string, value: any) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    form.setFieldValue(questionId, value);
  };

  // 上一题
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // 下一题
  const handleNext = async () => {
    try {
      // 验证当前问题
      await form.validateFields([currentQuestion?.id]);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // 最后一题，显示提交确认
        setShowSubmitModal(true);
      }
    } catch (error) {
      message.error('请先回答当前问题');
    }
  };

  // 提交问卷
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      
      const responseData = {
        surveyId: id!,
        respondentId: 'current-user', // 实际应用中从用户状态获取
        respondentEmail: 'user@example.com', // 实际应用中从用户状态获取
        answers: Object.entries(values).map(([questionId, value]) => ({
          questionId,
          questionType: questions.find(q => q.id === questionId)?.type || 'text',
          value,
          answeredAt: new Date().toISOString()
        })),
        status: 'completed' as const,
        startedAt: startTime.toISOString(),
        timeSpent,
        isAnonymous: survey?.isAnonymous || false
      };

      const result = await surveyResponseService.submitResponse(responseData);
      
      if (result.success) {
        message.success('问卷提交成功！');
        setShowSubmitModal(false);
        
        // 显示感谢信息
        Modal.success({
          title: '提交成功',
          content: settings.thankYouMessage || '感谢您的参与！',
          onOk: () => {
            if (settings.redirectUrl) {
              window.location.href = settings.redirectUrl;
            } else {
              navigate('/surveys');
            }
          }
        });
      } else {
        message.error(result.error || '提交失败');
      }
    } catch (error) {
      message.error('提交失败，请检查表单填写');
    } finally {
      setSubmitting(false);
    }
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    try {
      const values = form.getFieldsValue();
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      
      const responseData = {
        surveyId: id!,
        respondentId: 'current-user',
        respondentEmail: 'user@example.com',
        answers: Object.entries(values).map(([questionId, value]) => ({
          questionId,
          questionType: questions.find(q => q.id === questionId)?.type || 'text',
          value,
          answeredAt: new Date().toISOString()
        })),
        status: 'in_progress' as const,
        startedAt: startTime.toISOString(),
        timeSpent,
        isAnonymous: survey?.isAnonymous || false
      };

      // 这里可以实现保存草稿的逻辑
      message.success('草稿已保存');
    } catch (error) {
      message.error('保存草稿失败');
    }
  };

  // 渲染问题
  const renderQuestion = (question: SurveyQuestion) => {
    const { id, type, title, description, required, options, validation } = question;

    const commonProps = {
      value: answers[id],
      onChange: (value: any) => handleAnswerChange(id, value)
    };

    switch (type) {
      case 'text':
        return (
          <Input
            {...commonProps}
            placeholder="请输入答案"
            maxLength={validation?.maxLength}
            minLength={validation?.minLength}
          />
        );

      case 'textarea':
        return (
          <TextArea
            {...commonProps}
            rows={4}
            placeholder="请输入答案"
            maxLength={validation?.maxLength}
            minLength={validation?.minLength}
          />
        );

      case 'single_choice':
        return (
          <Radio.Group {...commonProps}>
            {options?.map(option => (
              <Radio key={option.id} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        );

      case 'multiple_choice':
        return (
          <Checkbox.Group {...commonProps}>
            {options?.map(option => (
              <Checkbox key={option.id} value={option.value}>
                {option.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        );

      case 'rating':
        return (
          <Rate
            {...commonProps}
            count={5}
            allowHalf={false}
          />
        );

      case 'nps':
        return (
          <div>
            <Text>0 - 非常不可能推荐</Text>
            <Slider
              {...commonProps}
              min={0}
              max={10}
              marks={{
                0: '0',
                5: '5',
                10: '10'
              }}
              style={{ margin: '16px 0' }}
            />
            <Text>10 - 非常可能推荐</Text>
          </div>
        );

      case 'slider':
        return (
          <Slider
            {...commonProps}
            min={validation?.minValue || 0}
            max={validation?.maxValue || 100}
            marks={{
              [validation?.minValue || 0]: validation?.minValue || 0,
              [validation?.maxValue || 100]: validation?.maxValue || 100
            }}
          />
        );

      case 'date':
        return (
          <DatePicker
            {...commonProps}
            style={{ width: '100%' }}
            placeholder="选择日期"
          />
        );

      case 'time':
        return (
          <TimePicker
            {...commonProps}
            style={{ width: '100%' }}
            placeholder="选择时间"
          />
        );

      case 'datetime':
        return (
          <DatePicker
            {...commonProps}
            showTime
            style={{ width: '100%' }}
            placeholder="选择日期和时间"
          />
        );

      case 'email':
        return (
          <Input
            {...commonProps}
            type="email"
            placeholder="请输入邮箱地址"
          />
        );

      case 'phone':
        return (
          <Input
            {...commonProps}
            placeholder="请输入电话号码"
          />
        );

      case 'number':
        return (
          <InputNumber
            {...commonProps}
            style={{ width: '100%' }}
            placeholder="请输入数字"
            min={validation?.minValue}
            max={validation?.maxValue}
          />
        );

      case 'url':
        return (
          <Input
            {...commonProps}
            placeholder="请输入网址"
          />
        );

      case 'file_upload':
        return (
          <Upload
            {...commonProps}
            beforeUpload={() => false}
            multiple={false}
          >
            <Button icon={<UploadOutlined />}>
              选择文件
            </Button>
          </Upload>
        );

      default:
        return (
          <div>
            <Text>不支持的问题类型: {type}</Text>
          </div>
        );
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
      {/* 问卷头部 */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={3}>{survey.title}</Title>
        {survey.description && (
          <Text type="secondary">{survey.description}</Text>
        )}
        
        {settings.showProgressBar && questions.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Progress
              percent={Math.round(progress)}
              status="active"
              format={() => `${currentQuestionIndex + 1}/${questions.length}`}
            />
          </div>
        )}
      </Card>

      {/* 问题内容 */}
      {questions.length === 0 ? (
        <Card>
          <Alert
            message="问卷暂无问题"
            description="请联系问卷创建者"
            type="warning"
            showIcon
          />
        </Card>
      ) : (
        <Card>
          <Form form={form} layout="vertical">
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>
                {settings.showQuestionNumbers && `${currentQuestionIndex + 1}. `}
                {currentQuestion?.title}
                {currentQuestion?.required && <span style={{ color: 'red' }}> *</span>}
              </Title>
              
              {currentQuestion?.description && (
                <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                  {currentQuestion.description}
                </Text>
              )}

              <Form.Item
                name={currentQuestion?.id}
                rules={[
                  {
                    required: currentQuestion?.required,
                    message: '请回答此问题'
                  }
                ]}
              >
                {currentQuestion && renderQuestion(currentQuestion)}
              </Form.Item>
            </div>

            <Divider />

            {/* 导航按钮 */}
            <Row justify="space-between">
              <Col>
                <Space>
                  <Button
                    icon={<LeftOutlined />}
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0 || !settings.allowBackNavigation}
                  >
                    上一题
                  </Button>
                  
                  <Button
                    type="primary"
                    icon={<RightOutlined />}
                    onClick={handleNext}
                  >
                    {currentQuestionIndex < questions.length - 1 ? '下一题' : '提交问卷'}
                  </Button>
                </Space>
              </Col>
              
              <Col>
                <Space>
                  {settings.autoSave && (
                    <Button
                      icon={<SaveOutlined />}
                      onClick={handleSaveDraft}
                    >
                      保存草稿
                    </Button>
                  )}
                  
                  <Text type="secondary">
                    第 {currentQuestionIndex + 1} 题，共 {questions.length} 题
                  </Text>
                </Space>
              </Col>
            </Row>
          </Form>
        </Card>
      )}

      {/* 提交确认模态框 */}
      <Modal
        title="确认提交"
        open={showSubmitModal}
        onOk={handleSubmit}
        onCancel={() => setShowSubmitModal(false)}
        confirmLoading={submitting}
        okText="确认提交"
        cancelText="继续编辑"
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircleOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
          <Title level={4}>您已完成所有问题</Title>
          <Text type="secondary">
            请确认您的答案无误后提交问卷
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default SurveyResponseForm;
