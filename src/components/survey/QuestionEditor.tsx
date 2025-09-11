import React, { useState } from 'react';
import {
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Radio,
  Checkbox,
  Row,
  Col,
  message,
  Popconfirm,
  Tooltip,
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  UpOutlined,
  DownOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { SurveyQuestion, QuestionType, SurveyQuestionOption } from '@/types';

const { TextArea } = Input;
const { Option } = Select;

interface QuestionEditorProps {
  questions: SurveyQuestion[];
  onChange: (questions: SurveyQuestion[]) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ questions, onChange }) => {
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // 问题类型选项
  const questionTypeOptions: { value: QuestionType; label: string; description: string }[] = [
    { value: 'text', label: '单行文本', description: '用于收集简短文本信息' },
    { value: 'textarea', label: '多行文本', description: '用于收集较长文本信息' },
    { value: 'single_choice', label: '单选题', description: '从多个选项中选择一个' },
    { value: 'multiple_choice', label: '多选题', description: '从多个选项中选择多个' },
    { value: 'rating', label: '评分题', description: '对某个方面进行评分' },
    { value: 'date', label: '日期', description: '选择日期' },
    { value: 'time', label: '时间', description: '选择时间' },
    { value: 'datetime', label: '日期时间', description: '选择日期和时间' },
    { value: 'email', label: '邮箱', description: '收集邮箱地址' },
    { value: 'phone', label: '电话', description: '收集电话号码' },
    { value: 'number', label: '数字', description: '收集数字信息' },
    { value: 'url', label: '网址', description: '收集网址链接' },
    { value: 'file_upload', label: '文件上传', description: '上传文件' },
    { value: 'matrix', label: '矩阵题', description: '多行多列的选择题' },
    { value: 'ranking', label: '排序题', description: '对选项进行排序' },
    { value: 'nps', label: 'NPS评分', description: '净推荐值评分' },
    { value: 'slider', label: '滑块', description: '使用滑块选择数值' }
  ];

  // 生成问题ID
  const generateQuestionId = () => `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 生成选项ID
  const generateOptionId = () => `o_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 添加新问题
  const handleAddQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: generateQuestionId(),
      type: 'text',
      title: '',
      required: false,
      order: questions.length + 1,
      options: []
    };
    setEditingQuestion(newQuestion);
    form.setFieldsValue(newQuestion);
    setIsModalVisible(true);
  };

  // 编辑问题
  const handleEditQuestion = (question: SurveyQuestion) => {
    setEditingQuestion(question);
    form.setFieldsValue(question);
    setIsModalVisible(true);
  };

  // 复制问题
  const handleCopyQuestion = (question: SurveyQuestion) => {
    const newQuestion: SurveyQuestion = {
      ...question,
      id: generateQuestionId(),
      title: `${question.title} (副本)`,
      order: questions.length + 1,
      options: question.options?.map(option => ({
        ...option,
        id: generateOptionId()
      })) || []
    };
    
    const newQuestions = [...questions, newQuestion].map((q, index) => ({
      ...q,
      order: index + 1
    }));
    onChange(newQuestions);
    message.success('问题复制成功');
  };

  // 删除问题
  const handleDeleteQuestion = (questionId: string) => {
    const newQuestions = questions
      .filter(q => q.id !== questionId)
      .map((q, index) => ({ ...q, order: index + 1 }));
    onChange(newQuestions);
    message.success('问题删除成功');
  };

  // 移动问题
  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...questions];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // 交换位置
    [newQuestions[currentIndex], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[currentIndex]
    ];

    // 更新顺序
    newQuestions.forEach((q, index) => {
      q.order = index + 1;
    });

    onChange(newQuestions);
  };

  // 保存问题
  const handleSaveQuestion = async () => {
    try {
      const values = await form.validateFields();
      
      let newQuestion: SurveyQuestion = {
        ...values,
        id: editingQuestion?.id || generateQuestionId(),
        order: editingQuestion?.order || questions.length + 1
      };

      // 处理选项
      if (values.options && values.options.length > 0) {
        newQuestion.options = values.options.map((option: any, index: number) => ({
          id: option.id || generateOptionId(),
          label: option.label,
          value: option.value || option.label,
          order: index + 1,
          isOther: option.isOther || false
        }));
      }

      let newQuestions;
      if (editingQuestion) {
        // 更新现有问题
        newQuestions = questions.map(q => q.id === editingQuestion.id ? newQuestion : q);
      } else {
        // 添加新问题
        newQuestions = [...questions, newQuestion];
      }

      onChange(newQuestions);
      setIsModalVisible(false);
      setEditingQuestion(null);
      form.resetFields();
      message.success('问题保存成功');
    } catch (error) {
      message.error('请检查表单填写');
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingQuestion(null);
    form.resetFields();
  };

  // 添加选项
  const handleAddOption = () => {
    const currentOptions = form.getFieldValue('options') || [];
    const newOption = {
      id: generateOptionId(),
      label: '',
      value: '',
      order: currentOptions.length + 1,
      isOther: false
    };
    form.setFieldValue('options', [...currentOptions, newOption]);
  };

  // 删除选项
  const handleDeleteOption = (index: number) => {
    const currentOptions = form.getFieldValue('options') || [];
    const newOptions = currentOptions.filter((_: any, i: number) => i !== index);
    form.setFieldValue('options', newOptions);
  };

  // 是否需要选项的问题类型
  const needsOptions = (type: QuestionType) => {
    return ['single_choice', 'multiple_choice', 'matrix', 'ranking'].includes(type);
  };

  // 渲染问题卡片
  const renderQuestionCard = (question: SurveyQuestion, index: number) => (
    <Card
      key={question.id}
      size="small"
      style={{ marginBottom: 8 }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            {index + 1}. {question.title || '未命名问题'}
            {question.required && <span style={{ color: 'red' }}> *</span>}
          </span>
          <Space>
            <Tooltip title="上移">
              <Button
                type="text"
                size="small"
                icon={<UpOutlined />}
                disabled={index === 0}
                onClick={() => handleMoveQuestion(question.id, 'up')}
              />
            </Tooltip>
            <Tooltip title="下移">
              <Button
                type="text"
                size="small"
                icon={<DownOutlined />}
                disabled={index === questions.length - 1}
                onClick={() => handleMoveQuestion(question.id, 'down')}
              />
            </Tooltip>
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleEditQuestion(question)}
              />
            </Tooltip>
            <Tooltip title="复制">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopyQuestion(question)}
              />
            </Tooltip>
            <Popconfirm
              title="确定要删除这个问题吗？"
              onConfirm={() => handleDeleteQuestion(question.id)}
              okText="确定"
              cancelText="取消"
            >
              <Tooltip title="删除">
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        </div>
      }
    >
      <div style={{ color: '#666', fontSize: '12px', marginBottom: 8 }}>
        类型: {questionTypeOptions.find(opt => opt.value === question.type)?.label}
      </div>
      
      {question.description && (
        <div style={{ color: '#666', fontSize: '12px', marginBottom: 8 }}>
          {question.description}
        </div>
      )}

      {/* 预览问题内容 */}
      <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
        {question.type === 'text' && (
          <Input placeholder="请输入答案" disabled />
        )}
        {question.type === 'textarea' && (
          <TextArea rows={3} placeholder="请输入答案" disabled />
        )}
        {question.type === 'single_choice' && question.options && (
          <Radio.Group disabled>
            {question.options.map(option => (
              <Radio key={option.id} value={option.value}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        )}
        {question.type === 'multiple_choice' && question.options && (
          <Checkbox.Group disabled>
            {question.options.map(option => (
              <Checkbox key={option.id} value={option.value}>
                {option.label}
              </Checkbox>
            ))}
          </Checkbox.Group>
        )}
        {question.type === 'rating' && (
          <div>评分: 1-5 星</div>
        )}
        {question.type === 'date' && (
          <Input placeholder="选择日期" disabled />
        )}
        {question.type === 'email' && (
          <Input placeholder="请输入邮箱" disabled />
        )}
        {question.type === 'phone' && (
          <Input placeholder="请输入电话" disabled />
        )}
        {question.type === 'number' && (
          <InputNumber placeholder="请输入数字" disabled style={{ width: '100%' }} />
        )}
      </div>
    </Card>
  );

  return (
    <div>
      {/* 问题列表 */}
      <div style={{ marginBottom: 16 }}>
        {questions.length === 0 ? (
          <Card style={{ textAlign: 'center', color: '#999' }}>
            还没有添加任何问题，点击下方按钮开始添加
          </Card>
        ) : (
          questions.map((question, index) => renderQuestionCard(question, index))
        )}
      </div>

      {/* 添加问题按钮 */}
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAddQuestion}
        style={{ width: '100%' }}
      >
        添加问题
      </Button>

      {/* 问题编辑模态框 */}
      <Modal
        title={editingQuestion ? '编辑问题' : '添加问题'}
        open={isModalVisible}
        onOk={handleSaveQuestion}
        onCancel={handleCancel}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            required: false,
            options: []
          }}
        >
          <Form.Item
            name="type"
            label="问题类型"
            rules={[{ required: true, message: '请选择问题类型' }]}
          >
            <Select
              placeholder="选择问题类型"
              onChange={(value) => {
                // 清空选项
                form.setFieldValue('options', []);
              }}
            >
              {questionTypeOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div>
                    <div>{option.label}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {option.description}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="问题标题"
            rules={[{ required: true, message: '请输入问题标题' }]}
          >
            <Input placeholder="请输入问题标题" />
          </Form.Item>

          <Form.Item
            name="description"
            label="问题描述"
          >
            <TextArea
              rows={2}
              placeholder="请输入问题描述（可选）"
            />
          </Form.Item>

          <Form.Item
            name="required"
            valuePropName="checked"
          >
            <Switch checkedChildren="必填" unCheckedChildren="选填" />
            <span style={{ marginLeft: 8 }}>是否必填</span>
          </Form.Item>

          {/* 选项设置 */}
          <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) => {
              const questionType = getFieldValue('type');
              
              if (!needsOptions(questionType)) {
                return null;
              }

              return (
                <Form.Item label="选项设置">
                  <Form.List name="options">
                    {(fields, { add, remove }) => (
                      <div>
                        {fields.map((field, index) => (
                          <Card key={field.key} size="small" style={{ marginBottom: 8 }}>
                            <Row gutter={8} align="middle">
                              <Col span={2}>
                                <span>{index + 1}.</span>
                              </Col>
                              <Col span={16}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'label']}
                                  rules={[{ required: true, message: '请输入选项文本' }]}
                                >
                                  <Input placeholder="选项文本" />
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item
                                  {...field}
                                  name={[field.name, 'isOther']}
                                  valuePropName="checked"
                                >
                                  <Checkbox>其他</Checkbox>
                                </Form.Item>
                              </Col>
                              <Col span={2}>
                                <Button
                                  type="text"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => remove(field.name)}
                                />
                              </Col>
                            </Row>
                          </Card>
                        ))}
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => add()}
                          style={{ width: '100%' }}
                        >
                          添加选项
                        </Button>
                      </div>
                    )}
                  </Form.List>
                </Form.Item>
              );
            }}
          </Form.Item>

          {/* 验证规则 */}
          <Form.Item
            name={['validation', 'minLength']}
            label="最小长度"
          >
            <InputNumber placeholder="最小字符数" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name={['validation', 'maxLength']}
            label="最大长度"
          >
            <InputNumber placeholder="最大字符数" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name={['validation', 'minValue']}
            label="最小值"
          >
            <InputNumber placeholder="最小值" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name={['validation', 'maxValue']}
            label="最大值"
          >
            <InputNumber placeholder="最大值" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuestionEditor;
