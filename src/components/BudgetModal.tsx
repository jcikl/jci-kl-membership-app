import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Alert,
} from 'antd';
import { Budget, BudgetMainCategory, BudgetSubCategory } from '@/types/finance';
import { 
  BUDGET_MAIN_CATEGORY_OPTIONS, 
  getSubCategoryOptions, 
  generateItemCode, 
  getItemTemplates,
} from '@/config/budgetCategories';

const { Option } = Select;
const { TextArea } = Input;

interface BudgetModalProps {
  visible: boolean;
  mode: 'create' | 'edit';
  budget?: Budget | null;
  onOk: (budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  selectedYear?: number;
}

const BudgetModal: React.FC<BudgetModalProps> = ({
  visible,
  mode,
  budget,
  onOk,
  onCancel,
  loading = false,
  selectedYear = new Date().getFullYear(),
}) => {
  const [form] = Form.useForm();
  const [selectedMainCategory, setSelectedMainCategory] = useState<BudgetMainCategory | undefined>(undefined);
  const [selectedSubCategory, setSelectedSubCategory] = useState<BudgetSubCategory | undefined>(undefined);

  // 重置表单状态
  const resetForm = () => {
    form.resetFields();
    setSelectedMainCategory(undefined);
    setSelectedSubCategory(undefined);
  };

  // 当模态框打开时，设置表单值
  useEffect(() => {
    if (visible) {
      if (mode === 'edit' && budget) {
        form.setFieldsValue({
          projectName: budget.projectName,
          totalBudget: budget.totalBudget,
          description: budget.description,
          mainCategory: budget.mainCategory,
          subCategory: budget.subCategory,
          itemCode: budget.itemCode,
          note: budget.note,
          budgetYear: budget.budgetYear,
        });
        setSelectedMainCategory(budget.mainCategory);
        setSelectedSubCategory(budget.subCategory);
      } else {
        resetForm();
        // 在创建模式下设置预算年份为选中的年份
        form.setFieldsValue({
          budgetYear: selectedYear,
        });
      }
    }
  }, [visible, mode, budget, form, selectedYear]);

  // 处理确认
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 生成项目代码
      const itemCode = values.itemCode || generateItemCode(selectedSubCategory!, 0);
      
      const budgetData: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'> = {
        projectName: values.projectName,
        budgetYear: values.budgetYear || selectedYear,
        totalBudget: values.totalBudget,
        allocatedAmount: budget?.allocatedAmount || 0,
        spentAmount: budget?.spentAmount || 0,
        remainingAmount: values.totalBudget - (budget?.allocatedAmount || 0),
        status: budget?.status || 'draft',
        description: values.description,
        createdBy: budget?.createdBy || 'current-user', // TODO: 从认证状态获取
        mainCategory: values.mainCategory,
        subCategory: values.subCategory,
        itemCode: itemCode,
        note: values.note,
      };

      await onOk(budgetData);
      resetForm();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <Modal
      title={mode === 'create' ? '创建JCI预算项目' : '编辑预算项目'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={800}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="mainCategory"
              label="主要分类"
              rules={[{ required: true, message: '请选择主要分类' }]}
            >
              <Select 
                placeholder="请选择主要分类"
                onChange={(value: BudgetMainCategory) => {
                  setSelectedMainCategory(value);
                  setSelectedSubCategory(undefined);
                  form.setFieldsValue({ subCategory: undefined, itemTemplate: undefined });
                }}
              >
                {BUDGET_MAIN_CATEGORY_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="subCategory"
              label="子分类"
              rules={[{ required: true, message: '请选择子分类' }]}
            >
              <Select 
                placeholder="请选择子分类"
                disabled={!selectedMainCategory}
                onChange={(value: BudgetSubCategory) => {
                  setSelectedSubCategory(value);
                  form.setFieldsValue({ itemTemplate: undefined });
                }}
              >
                {selectedMainCategory && getSubCategoryOptions(selectedMainCategory).map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="itemTemplate"
              label="项目模板"
              rules={[{ required: true, message: '请选择项目模板' }]}
            >
              <Select 
                placeholder="请选择项目模板"
                disabled={!selectedSubCategory}
                onChange={(value: string) => {
                  const template = getItemTemplates(selectedSubCategory!).find(t => t.name === value);
                  form.setFieldsValue({ 
                    projectName: value,
                    note: template?.note || ''
                  });
                }}
              >
                {selectedSubCategory && getItemTemplates(selectedSubCategory).map(template => (
                  <Option key={template.name} value={template.name}>
                    {template.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="itemCode"
              label="项目代码"
            >
              <Input 
                placeholder="自动生成" 
                disabled 
                value={selectedSubCategory ? 
                  generateItemCode(selectedSubCategory, 0) : ''}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="projectName"
          label="项目名称"
          rules={[{ required: true, message: '请输入项目名称' }]}
        >
          <Input placeholder="请输入项目名称" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="totalBudget"
              label="总预算 (RM)"
              rules={[{ required: true, message: '请输入总预算' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入总预算"
                min={0}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value: string | undefined) => parseFloat(value ? value.replace(/RM\s?|(,*)/g, '') : '0') || 0}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="budgetYear"
              label="预算年份"
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="预算年份"
                value={selectedYear}
                disabled
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="note"
          label="备注"
        >
          <TextArea rows={2} placeholder="请输入备注" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <TextArea rows={3} placeholder="请输入预算描述" />
        </Form.Item>

        {mode === 'edit' && budget && (
          <Alert
            message="编辑预算信息"
            description={`当前预算状态: ${budget.status} | 已分配: RM ${budget.allocatedAmount.toLocaleString()} | 已支出: RM ${budget.spentAmount.toLocaleString()}`}
            type="info"
            style={{ marginTop: 16 }}
          />
        )}
      </Form>
    </Modal>
  );
};

export default BudgetModal;
