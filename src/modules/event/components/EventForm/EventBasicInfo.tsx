import React from 'react';
import { Form, Input, Select, Card, Row, Col, Typography, Button } from 'antd';
import { BookOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEventForm } from '@/contexts/EventFormContext';
import GlobalImageUploadModal, { ImageType, UploadServiceType } from '@/modules/image/components/GlobalImageUploadModal';
import { useImageUpload } from '@/hooks/useImageUpload';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 活动类型选项
const EVENT_TYPE_OPTIONS = [
  { value: 'training', label: '培训活动' },
  { value: 'conference', label: '会议' },
  { value: 'networking', label: '社交活动' },
  { value: 'workshop', label: '工作坊' },
  { value: 'seminar', label: '研讨会' },
  { value: 'other', label: '其他' }
];

// 活动级别选项
const EVENT_LEVEL_OPTIONS = [
  { value: 'local', label: '本地' },
  { value: 'national', label: '国家级' },
  { value: 'regional', label: '区域级' },
  { value: 'international', label: '国际级' }
];

// 活动分类选项
const EVENT_CATEGORY_OPTIONS = [
  { value: 'business', label: '商务' },
  { value: 'education', label: '教育' },
  { value: 'social', label: '社交' },
  { value: 'charity', label: '慈善' },
  { value: 'sports', label: '体育' },
  { value: 'cultural', label: '文化' },
  { value: 'other', label: '其他' }
];

interface EventBasicInfoProps {
  onFieldChange?: (field: string, value: any) => void;
}

const EventBasicInfo: React.FC<EventBasicInfoProps> = ({ onFieldChange }) => {
  const { state, updateFormData } = useEventForm();
  const { formData } = state;

  // 使用图片上传Hook
  const imageUpload = useImageUpload({
    initialImageUrl: formData.imageUrl,
    onImageChange: (url: string) => {
      handleFieldChange('imageUrl', url);
    },
    onImageDelete: () => {
      handleFieldChange('imageUrl', '');
    },
    uploadService: UploadServiceType.CLOUDINARY,
    imageType: ImageType.EVENT_POSTER,
    maxSize: 10,
    targetSize: { width: 800, height: 600 },
    enableCompression: true,
    placeholder: '上传活动海报',
    accept: 'image/*'
  });

  // 处理字段变化
  const handleFieldChange = (field: string, value: any) => {
    updateFormData({ [field]: value });
    onFieldChange?.(field, value);
  };

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          <BookOutlined style={{ marginRight: 8 }} />
          基本信息
        </Title>
        <Text type="secondary">
          填写活动的基本信息，包括名称、描述、类型等
        </Text>
      </div>

      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动名称"
            required
            validateStatus={state.validationErrors.find(e => e.field === 'name') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'name')?.message}
          >
            <Input
              placeholder="请输入活动名称"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              maxLength={100}
              showCount
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动类型"
            required
            validateStatus={state.validationErrors.find(e => e.field === 'type') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'type')?.message}
          >
            <Select
              placeholder="请选择活动类型"
              value={formData.type}
              onChange={(value) => handleFieldChange('type', value)}
            >
              {EVENT_TYPE_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动级别"
            required
            validateStatus={state.validationErrors.find(e => e.field === 'level') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'level')?.message}
          >
            <Select
              placeholder="请选择活动级别"
              value={formData.level}
              onChange={(value) => handleFieldChange('level', value)}
            >
              {EVENT_LEVEL_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item
            label="活动分类"
            required
            validateStatus={state.validationErrors.find(e => e.field === 'category') ? 'error' : ''}
            help={state.validationErrors.find(e => e.field === 'category')?.message}
          >
            <Select
              placeholder="请选择活动分类"
              value={formData.category}
              onChange={(value) => handleFieldChange('category', value)}
            >
              {EVENT_CATEGORY_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        label="活动描述"
        required
        validateStatus={state.validationErrors.find(e => e.field === 'description') ? 'error' : ''}
        help={state.validationErrors.find(e => e.field === 'description')?.message}
      >
        <TextArea
          placeholder="请详细描述活动内容、目标、参与对象等信息"
          value={formData.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          rows={4}
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Form.Item label="活动图片">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={imageUpload.openUploadModal}
          >
            上传活动海报
          </Button>
          
          {imageUpload.currentImageUrl && (
            <>
              <Button
                icon={<DeleteOutlined />}
                onClick={imageUpload.handleDeleteImage}
                danger
              >
                删除图片
              </Button>
              <div style={{ marginLeft: 8 }}>
                <Text type="secondary">当前图片：</Text>
                <img
                  src={imageUpload.currentImageUrl}
                  alt="活动图片"
                  style={{ 
                    maxWidth: 200, 
                    maxHeight: 150, 
                    marginLeft: 8,
                    borderRadius: 4,
                    border: '1px solid #d9d9d9'
                  }}
                />
              </div>
            </>
          )}
        </div>
        
        {!imageUpload.currentImageUrl && (
          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            点击"上传活动海报"按钮选择图片
          </div>
        )}
      </Form.Item>

      {/* 全局图片上传Modal */}
      <GlobalImageUploadModal
        visible={imageUpload.isModalVisible}
        onClose={imageUpload.closeUploadModal}
        onSuccess={imageUpload.handleUploadSuccess}
        title="上传活动海报"
        imageType={ImageType.EVENT_POSTER}
        uploadService={UploadServiceType.CLOUDINARY}
        maxSize={10}
        targetSize={{ width: 800, height: 600 }}
        enableCompression={true}
        currentImageUrl={imageUpload.currentImageUrl}
        placeholder="上传活动海报"
        accept="image/*"
      />
    </Card>
  );
};

export default EventBasicInfo;
