import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Card,
  Row,
  Col,
  Typography,
  message,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SplitCellsOutlined,
} from '@ant-design/icons';
import { Transaction, TransactionSplit, TransactionPurpose } from '@/types/finance';

const { Text } = Typography;
const { Option } = Select;

interface TransactionSplitModalProps {
  visible: boolean;
  transaction: Transaction | null;
  purposes: TransactionPurpose[];
  onCancel: () => void;
  onSplit: (transactionId: string, splits: Omit<TransactionSplit, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

const TransactionSplitModal: React.FC<TransactionSplitModalProps> = ({
  visible,
  transaction,
  purposes,
  onCancel,
  onSplit,
}) => {
  const [form] = Form.useForm();
  const [splits, setSplits] = useState<Array<{
    amount: number;
    transactionPurpose?: string;
    projectAccount?: string;
    description?: string;
    notes?: string;
    mainCategory?: string; // 主要分类
    businessCategory?: string; // 业务分类
    specificPurpose?: string; // 具体用途
  }>>([]);

  // 获取主要分类选项（0级目录）
  const getMainCategoryOptions = () => {
    return purposes
      .filter(purpose => purpose.level === 0)
      .map(purpose => ({
        value: purpose.id,
        label: purpose.name
      }));
  };

  // 获取业务分类选项（1级目录，根据主要分类筛选）
  const getBusinessCategoryOptions = (mainCategoryId: string) => {
    if (!mainCategoryId) return [];
    return purposes
      .filter(purpose => purpose.level === 1 && purpose.parentId === mainCategoryId)
      .map(purpose => ({
        value: purpose.id,
        label: purpose.name
      }));
  };

  // 获取具体用途选项（2级目录，根据业务分类筛选）
  const getSpecificPurposeOptions = (businessCategoryId: string) => {
    if (!businessCategoryId) return [];
    return purposes
      .filter(purpose => purpose.level === 2 && purpose.parentId === businessCategoryId)
      .map(purpose => ({
        value: purpose.id,
        label: purpose.name
      }));
  };

  useEffect(() => {
    if (visible && transaction) {
      // 初始化拆分记录，默认拆分为2项
      const defaultSplits = [
        { 
          amount: 0, 
          transactionPurpose: '', 
          projectAccount: '', 
          description: '', 
          notes: '',
          mainCategory: '',
          businessCategory: '',
          specificPurpose: ''
        },
        { 
          amount: 0, 
          transactionPurpose: '', 
          projectAccount: '', 
          description: '', 
          notes: '',
          mainCategory: '',
          businessCategory: '',
          specificPurpose: ''
        }
      ];
      setSplits(defaultSplits);
      form.setFieldsValue({ splits: defaultSplits });
    }
  }, [visible, transaction, form]);

  const handleAddSplit = () => {
    const newSplit = { 
      amount: 0, 
      transactionPurpose: '', 
      projectAccount: '', 
      description: '', 
      notes: '',
      mainCategory: '',
      businessCategory: '',
      specificPurpose: ''
    };
    const newSplits = [...splits, newSplit];
    setSplits(newSplits);
    form.setFieldsValue({ splits: newSplits });
  };

  const handleRemoveSplit = (index: number) => {
    if (splits.length <= 2) {
      message.warning('至少需要保留2个拆分项');
      return;
    }
    const newSplits = splits.filter((_, i) => i !== index);
    setSplits(newSplits);
    form.setFieldsValue({ splits: newSplits });
  };

  const handleMainCategoryChange = (value: string, index: number) => {
    const newSplits = [...splits];
    newSplits[index] = {
      ...newSplits[index],
      mainCategory: value,
      businessCategory: '', // 清空业务分类
      specificPurpose: '', // 清空具体用途
      transactionPurpose: '' // 清空交易用途
    };
    setSplits(newSplits);
    form.setFieldsValue({ splits: newSplits });
  };

  const handleBusinessCategoryChange = (value: string, index: number) => {
    const newSplits = [...splits];
    newSplits[index] = {
      ...newSplits[index],
      businessCategory: value,
      specificPurpose: '', // 清空具体用途
      transactionPurpose: '' // 清空交易用途
    };
    setSplits(newSplits);
    form.setFieldsValue({ splits: newSplits });
  };

  const handleSpecificPurposeChange = (value: string, index: number) => {
    const newSplits = [...splits];
    newSplits[index] = {
      ...newSplits[index],
      specificPurpose: value,
      transactionPurpose: value // 设置交易用途
    };
    setSplits(newSplits);
    form.setFieldsValue({ splits: newSplits });
  };

  const handlePurposeChange = (value: string, index: number) => {
    const newSplits = [...splits];
    newSplits[index] = {
      ...newSplits[index],
      transactionPurpose: value
    };
    setSplits(newSplits);
    form.setFieldsValue({ splits: newSplits });
  };

  const handleAmountChange = (value: number | null, index: number) => {
    const newSplits = [...splits];
    newSplits[index] = {
      ...newSplits[index],
      amount: value || 0
    };
    setSplits(newSplits);
    form.setFieldsValue({ splits: newSplits });
  };

  const calculateTotalAmount = () => {
    return splits.reduce((total, split) => total + (split.amount || 0), 0);
  };

  const getRemainingAmount = () => {
    if (!transaction) return 0;
    const totalAmount = transaction.expense + transaction.income;
    return totalAmount - calculateTotalAmount();
  };

  const handleOk = async () => {
    try {
      await form.validateFields();
      
      // 验证拆分金额总和
      const totalAmount = calculateTotalAmount();
      const transactionTotal = transaction ? transaction.expense + transaction.income : 0;
      
      if (Math.abs(totalAmount - transactionTotal) > 0.01) {
        message.error(`拆分金额总和 (${totalAmount.toFixed(2)}) 必须等于交易总金额 (${transactionTotal.toFixed(2)})`);
        return;
      }

      // 验证必填字段 - 至少需要选择交易用途（通过级联选择或直接选择）
      const hasEmptyPurpose = splits.some(split => !split.transactionPurpose);
      if (hasEmptyPurpose) {
        message.error('所有拆分项都必须选择交易用途（可通过级联选择或直接选择）');
        return;
      }

      // 准备拆分数据，自动复制主交易的分类信息到拆分记录
      const splitData = splits.map((split, index) => ({
        transactionId: transaction!.id,
        splitIndex: index + 1,
        amount: split.amount,
        transactionPurpose: split.transactionPurpose,
        projectAccount: split.projectAccount,
        payerPayee: transaction!.payerPayee, // 从主交易记录复制付款人/收款人
        transactionType: transaction!.transactionType, // 从主交易记录复制主要分类
        description: split.description,
        notes: split.notes,
      }));

      await onSplit(transaction!.id, splitData);
      message.success('交易拆分成功');
      onCancel();
    } catch (error) {
      message.error('拆分失败');
    }
  };

  if (!transaction) return null;

  const totalAmount = transaction.expense + transaction.income;

  return (
    <Modal
      title={
        <Space>
          <SplitCellsOutlined />
          <span>拆分交易记录</span>
        </Space>
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      width={800}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Card size="small">
          <Row gutter={16}>
            <Col span={8}>
              <Text strong>交易日期：</Text>
              <Text>{new Date(transaction.transactionDate).toLocaleDateString('zh-CN')}</Text>
            </Col>
            <Col span={8}>
              <Text strong>交易描述：</Text>
              <Text>{transaction.mainDescription}</Text>
            </Col>
            <Col span={8}>
              <Text strong>交易金额：</Text>
              <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                RM {totalAmount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
              </Text>
            </Col>
          </Row>
        </Card>
      </div>

      <Form form={form} layout="vertical">
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Text strong>拆分记录：</Text>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={handleAddSplit}
            >
              添加拆分项
            </Button>
          </Space>
        </div>

        {splits.map((split, index) => (
          <Card key={index} size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col span={2}>
                <Text strong>#{index + 1}</Text>
              </Col>
              <Col span={6}>
                <Form.Item
                  name={['splits', index, 'amount']}
                  label="拆分金额"
                  rules={[{ required: true, message: '请输入拆分金额' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    precision={2}
                    min={0}
                    value={split.amount}
                    onChange={(value) => handleAmountChange(value, index)}
                    prefix="RM"
                  />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label=" ">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveSplit(index)}
                    disabled={splits.length <= 2}
                  />
                </Form.Item>
              </Col>
            </Row>
            
            {/* 级联选择区域 */}
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name={['splits', index, 'mainCategory']}
                  label="主要分类"
                >
                  <Select
                    placeholder="请选择主要分类"
                    value={split.mainCategory}
                    onChange={(value) => handleMainCategoryChange(value, index)}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                  >
                    {getMainCategoryOptions().map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['splits', index, 'businessCategory']}
                  label="业务分类"
                >
                  <Select
                    placeholder="请选择业务分类"
                    value={split.businessCategory}
                    onChange={(value) => handleBusinessCategoryChange(value, index)}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    disabled={!split.mainCategory}
                  >
                    {getBusinessCategoryOptions(split.mainCategory || '').map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name={['splits', index, 'specificPurpose']}
                  label="具体用途"
                >
                  <Select
                    placeholder="请选择具体用途"
                    value={split.specificPurpose}
                    onChange={(value) => handleSpecificPurposeChange(value, index)}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    disabled={!split.businessCategory}
                  >
                    {getSpecificPurposeOptions(split.businessCategory || '').map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* 传统交易用途选择（作为备选） */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['splits', index, 'transactionPurpose']}
                  label="交易用途（备选）"
                  tooltip="如果上面的级联选择无法满足需求，可以直接选择交易用途"
                >
                  <Select
                    placeholder="请选择交易用途"
                    value={split.transactionPurpose}
                    onChange={(value) => handlePurposeChange(value, index)}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                  >
                    {purposes.map(purpose => (
                      <Option key={purpose.id} value={purpose.id}>
                        {purpose.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['splits', index, 'projectAccount']}
                  label="项目户口"
                >
                  <Input placeholder="请输入项目户口" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name={['splits', index, 'description']}
                  label="拆分描述"
                >
                  <Input placeholder="请输入拆分描述" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name={['splits', index, 'notes']}
                  label="备注"
                >
                  <Input placeholder="请输入备注" />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}

        <Divider />
        
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>拆分总金额：</Text>
            <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
              RM {calculateTotalAmount().toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </Text>
          </Col>
          <Col span={8}>
            <Text strong>剩余金额：</Text>
            <Text style={{ 
              color: getRemainingAmount() === 0 ? '#52c41a' : '#ff4d4f', 
              fontWeight: 'bold' 
            }}>
              RM {getRemainingAmount().toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </Text>
          </Col>
          <Col span={8}>
            <Text strong>拆分项数：</Text>
            <Text style={{ fontWeight: 'bold' }}>{splits.length} 项</Text>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default TransactionSplitModal;
