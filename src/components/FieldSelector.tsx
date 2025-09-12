import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Checkbox, 
  Button, 
  Space, 
  Divider, 
  Typography, 
  Row, 
  Col,
  message
} from 'antd';
import { 
  SettingOutlined, 
  ReloadOutlined,
  CheckOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

export interface FieldOption {
  key: string;
  label: string;
  description?: string;
  category?: string;
  required?: boolean; // 是否必选字段
}

export interface FieldPreset {
  name: string;
  description: string;
  fields: string[];
}

export interface FieldSelectorProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedFields: string[]) => void;
  availableFields: FieldOption[];
  selectedFields: string[];
  title?: string;
  presets?: FieldPreset[];
}

const FieldSelector: React.FC<FieldSelectorProps> = ({
  visible,
  onClose,
  onConfirm,
  availableFields,
  selectedFields,
  title = "选择显示字段",
  presets = []
}) => {
  const [tempSelectedFields, setTempSelectedFields] = useState<string[]>(selectedFields);
  const [categoryExpanded, setCategoryExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setTempSelectedFields(selectedFields);
  }, [selectedFields, visible]);

  // 按类别分组字段
  const fieldsByCategory = availableFields.reduce((acc, field) => {
    const category = field.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(field);
    return acc;
  }, {} as Record<string, FieldOption[]>);

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    if (checked) {
      setTempSelectedFields(prev => [...prev, fieldKey]);
    } else {
      // 检查是否为必选字段
      const field = availableFields.find(f => f.key === fieldKey);
      if (field?.required) {
        message.warning('此字段为必选字段，无法取消选择');
        return;
      }
      setTempSelectedFields(prev => prev.filter(key => key !== fieldKey));
    }
  };

  const handleSelectAll = (category: string) => {
    const categoryFields = fieldsByCategory[category];
    const categoryFieldKeys = categoryFields.map(f => f.key);
    const requiredFields = categoryFields.filter(f => f.required).map(f => f.key);
    
    // 检查是否所有字段都已选中
    const allSelected = categoryFieldKeys.every(key => tempSelectedFields.includes(key));
    
    if (allSelected) {
      // 取消选择所有非必选字段
      setTempSelectedFields(prev => [
        ...prev.filter(key => !categoryFieldKeys.includes(key)),
        ...requiredFields
      ]);
    } else {
      // 选择所有字段
      setTempSelectedFields(prev => [
        ...prev.filter(key => !categoryFieldKeys.includes(key)),
        ...categoryFieldKeys
      ]);
    }
  };

  const handleSelectAllFields = () => {
    const allFieldKeys = availableFields.map(f => f.key);
    setTempSelectedFields(allFieldKeys);
  };

  const handleDeselectAllFields = () => {
    const requiredFields = availableFields.filter(f => f.required).map(f => f.key);
    setTempSelectedFields(requiredFields);
  };

  const handleReset = () => {
    const defaultFields = availableFields.filter(f => f.required).map(f => f.key);
    setTempSelectedFields(defaultFields);
  };

  const handlePresetSelect = (preset: FieldPreset) => {
    // 验证预设中的字段是否仍然有效
    const validFields = preset.fields.filter(fieldKey => 
      availableFields.some(field => field.key === fieldKey)
    );
    setTempSelectedFields(validFields);
  };

  const handleConfirm = () => {
    if (tempSelectedFields.length === 0) {
      message.warning('请至少选择一个字段');
      return;
    }
    onConfirm(tempSelectedFields);
    onClose();
  };

  const toggleCategory = (category: string) => {
    setCategoryExpanded(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryStatus = (category: string) => {
    const categoryFields = fieldsByCategory[category];
    const selectedCount = categoryFields.filter(f => tempSelectedFields.includes(f.key)).length;
    const totalCount = categoryFields.length;
    const requiredCount = categoryFields.filter(f => f.required).length;
    
    if (selectedCount === totalCount) return 'all';
    if (selectedCount === requiredCount) return 'none';
    return 'partial';
  };

  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          <span>{title}</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="reset" icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button key="confirm" type="primary" icon={<CheckOutlined />} onClick={handleConfirm}>
          确认
        </Button>
      ]}
    >
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button size="small" onClick={handleSelectAllFields}>
            全选
          </Button>
          <Button size="small" onClick={handleDeselectAllFields}>
            全不选
          </Button>
          <Button size="small" onClick={handleReset}>
            重置
          </Button>
        </Space>
        <Text type="secondary" style={{ marginLeft: 16 }}>
          已选择 {tempSelectedFields.length} / {availableFields.length} 个字段
        </Text>
      </div>

      {/* 预设选择 */}
      {presets.length > 0 && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text strong>快速预设：</Text>
            <Space wrap style={{ marginTop: 8 }}>
              {presets.map((preset, index) => (
                <Button
                  key={index}
                  size="small"
                  onClick={() => handlePresetSelect(preset)}
                  title={preset.description}
                >
                  {preset.name}
                </Button>
              ))}
            </Space>
          </div>
          <Divider />
        </>
      )}

      <Divider />

      {Object.entries(fieldsByCategory).map(([category, fields]) => {
        const categoryStatus = getCategoryStatus(category);
        const isExpanded = categoryExpanded[category] !== false; // 默认展开
        
        return (
          <div key={category} style={{ marginBottom: 24 }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 12,
                cursor: 'pointer',
                padding: '8px 0'
              }}
              onClick={() => toggleCategory(category)}
            >
              <Checkbox
                checked={categoryStatus === 'all'}
                indeterminate={categoryStatus === 'partial'}
                onChange={() => handleSelectAll(category)}
                style={{ marginRight: 8 }}
              />
              <Title level={5} style={{ margin: 0, flex: 1 }}>
                {category}
              </Title>
              <Text type="secondary">
                {fields.filter(f => tempSelectedFields.includes(f.key)).length} / {fields.length}
              </Text>
            </div>

            {isExpanded && (
              <Row gutter={[16, 8]}>
                {fields.map(field => (
                  <Col span={12} key={field.key}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      padding: '4px 0'
                    }}>
                      <Checkbox
                        checked={tempSelectedFields.includes(field.key)}
                        onChange={(e) => handleFieldToggle(field.key, e.target.checked)}
                        disabled={field.required}
                        style={{ marginRight: 8 }}
                      />
                      <div style={{ flex: 1 }}>
                        <Text strong={field.required}>
                          {field.label}
                          {field.required && (
                            <Text type="danger" style={{ marginLeft: 4 }}>*</Text>
                          )}
                        </Text>
                        {field.description && (
                          <div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {field.description}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
            )}
          </div>
        );
      })}
    </Modal>
  );
};

export default FieldSelector;
