import React, { useState } from 'react';
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
  Alert
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { Survey, SurveyQuestion, QuestionType } from '@/types';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface SurveyPreviewProps {
  survey: Partial<Survey>;
  mode?: 'preview' | 'answer';
  onSubmit?: (answers: any) => void;
}

const SurveyPreview: React.FC<SurveyPreviewProps> = ({
  survey,
  mode = 'preview',
  onSubmit
}) => {
  const [form] = Form.useForm();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions = survey.questions || [];
  const settings = survey.settings || {};
  const currentQuestion = questions[currentQuestionIndex];

  // 计算进度
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

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
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  // 提交问卷
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      
      if (onSubmit) {
        await onSubmit(values);
      } else {
        console.log('问卷答案:', values);
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 渲染问题
  const renderQuestion = (question: SurveyQuestion) => {
    const { id, type, title, description, required, options, validation } = question;

    const commonProps = {
      value: answers[id],
      onChange: (value: any) => handleAnswerChange(id, value),
      disabled: mode === 'preview'
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

      case 'matrix':
        return (
          <div>
            <Text>矩阵题预览 - 实际实现需要根据具体需求设计</Text>
          </div>
        );

      case 'ranking':
        return (
          <div>
            <Text>排序题预览 - 实际实现需要根据具体需求设计</Text>
          </div>
        );

      default:
        return (
          <div>
            <Text>不支持的问题类型: {type}</Text>
          </div>
        );
    }
  };

  if (!survey.title) {
    return (
      <Card>
        <Alert
          message="问卷预览"
          description="请先填写问卷基本信息"
          type="info"
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
            message="暂无问题"
            description="请先添加问题到问卷中"
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
                  
                  {currentQuestionIndex < questions.length - 1 ? (
                    <Button
                      type="primary"
                      icon={<RightOutlined />}
                      onClick={handleNext}
                    >
                      下一题
                    </Button>
                  ) : (
                    <Button
                      type="primary"
                      onClick={handleSubmit}
                      loading={isSubmitting}
                    >
                      提交问卷
                    </Button>
                  )}
                </Space>
              </Col>
              
              <Col>
                <Text type="secondary">
                  第 {currentQuestionIndex + 1} 题，共 {questions.length} 题
                </Text>
              </Col>
            </Row>
          </Form>
        </Card>
      )}

      {/* 问卷设置信息 */}
      {mode === 'preview' && (
        <Card title="问卷设置" size="small" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>允许返回上一题: </Text>
              <Text>{settings.allowBackNavigation ? '是' : '否'}</Text>
            </Col>
            <Col span={8}>
              <Text strong>显示进度条: </Text>
              <Text>{settings.showProgressBar ? '是' : '否'}</Text>
            </Col>
            <Col span={8}>
              <Text strong>显示题号: </Text>
              <Text>{settings.showQuestionNumbers ? '是' : '否'}</Text>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 8 }}>
            <Col span={8}>
              <Text strong>随机问题顺序: </Text>
              <Text>{settings.randomizeQuestions ? '是' : '否'}</Text>
            </Col>
            <Col span={8}>
              <Text strong>随机选项顺序: </Text>
              <Text>{settings.randomizeOptions ? '是' : '否'}</Text>
            </Col>
            <Col span={8}>
              <Text strong>自动保存: </Text>
              <Text>{settings.autoSave ? '是' : '否'}</Text>
            </Col>
          </Row>
          {settings.timeLimit && (
            <Row style={{ marginTop: 8 }}>
              <Col span={8}>
                <Text strong>时间限制: </Text>
                <Text>{settings.timeLimit} 分钟</Text>
              </Col>
            </Row>
          )}
          {settings.maxAttempts && (
            <Row style={{ marginTop: 8 }}>
              <Col span={8}>
                <Text strong>最大尝试次数: </Text>
                <Text>{settings.maxAttempts}</Text>
              </Col>
            </Row>
          )}
        </Card>
      )}
    </div>
  );
};

export default SurveyPreview;
