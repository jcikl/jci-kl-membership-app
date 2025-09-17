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
  Table,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SplitCellsOutlined,
} from '@ant-design/icons';
import { Transaction, TransactionSplit, TransactionPurpose } from '@/types/finance';
import { transactionSplitService } from '@/services/financeService';

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
    const loadExistingSplits = async () => {
      if (visible && transaction) {
        try {
          // 首先尝试加载现有的拆分记录
          const existingSplits = await transactionSplitService.getSplitsByTransaction(transaction.id);
          
          if (existingSplits.length > 0) {
            // 如果有现有拆分记录，加载它们
            const loadedSplits = existingSplits.map(split => {
              // 根据交易用途ID查找对应的层级信息
              const purpose = purposes.find(p => p.id === split.transactionPurpose);
              let mainCategory = '';
              let businessCategory = '';
              let specificPurpose = split.transactionPurpose || '';
              
              if (purpose) {
                if (purpose.level === 2) {
                  // 具体用途
                  specificPurpose = purpose.id;
                  const businessPurpose = purposes.find(p => p.id === purpose.parentId);
                  if (businessPurpose) {
                    businessCategory = businessPurpose.id;
                    if (businessPurpose.level === 1) {
                      const mainPurpose = purposes.find(p => p.id === businessPurpose.parentId);
                      if (mainPurpose) {
                        mainCategory = mainPurpose.id;
                      }
                    }
                  }
                } else if (purpose.level === 1) {
                  // 业务分类
                  businessCategory = purpose.id;
                  const mainPurpose = purposes.find(p => p.id === purpose.parentId);
                  if (mainPurpose) {
                    mainCategory = mainPurpose.id;
                  }
                } else if (purpose.level === 0) {
                  // 主要分类
                  mainCategory = purpose.id;
                }
              }
              
              return {
                amount: split.amount || 0,
                transactionPurpose: split.transactionPurpose || '',
                projectAccount: split.projectAccount || '',
                description: split.description || '',
                notes: split.notes || '',
                mainCategory,
                businessCategory,
                specificPurpose,
              };
            });
            
            setSplits(loadedSplits);
            form.setFieldsValue({ splits: loadedSplits });
            console.log('✅ 已加载现有拆分记录:', existingSplits.length, '项');
          } else {
            // 如果没有现有拆分记录，创建默认的2项拆分
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
            console.log('📝 创建默认拆分记录');
          }
        } catch (error) {
          console.error('❌ 加载拆分记录失败:', error);
          // 出错时使用默认拆分
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
      }
    };
    
    loadExistingSplits();
  }, [visible, transaction, form, purposes]);

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
        transactionNumber: `${transaction!.transactionNumber}-${String(index + 1).padStart(2, '0')}`, // 生成拆分记录序号
        splitIndex: index + 1,
        amount: split.amount,
        transactionDate: transaction!.transactionDate, // 从主交易记录复制交易日期
        mainDescription: transaction!.mainDescription, // 从主交易记录复制主描述
        subDescription: transaction!.subDescription, // 从主交易记录复制副描述
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
      width={1200}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <Card size="small">
          <Row gutter={16}>
            <Col span={6}>
              <Text strong>交易日期：</Text>
              <Text>{new Date(transaction.transactionDate).toLocaleDateString('zh-CN')}</Text>
            </Col>
            <Col span={6}>
              <Text strong>交易描述：</Text>
              <Text>{transaction.mainDescription}</Text>
            </Col>
            <Col span={6}>
              <Text strong>交易类型：</Text>
              <Text style={{ 
                color: transaction.income > 0 ? '#52c41a' : '#ff4d4f', 
                fontWeight: 'bold' 
              }}>
                {transaction.income > 0 ? '收入' : '支出'}
              </Text>
            </Col>
            <Col span={6}>
              <Text strong>交易金额：</Text>
              <Text style={{ 
                color: transaction.income > 0 ? '#52c41a' : '#ff4d4f', 
                fontWeight: 'bold' 
              }}>
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

        <Table
          dataSource={splits.map((split, index) => ({ ...split, key: index }))}
          columns={[
            {
              title: '序号',
              dataIndex: 'key',
              key: 'key',
              width: 60,
              render: (key: number) => `#${key + 1}`,
            },
            {
              title: '交易序号',
              dataIndex: 'transactionNumber',
              key: 'transactionNumber',
              width: 150,
              render: (_, _record: any, index: number) => {
                const splitNumber = `${transaction?.transactionNumber}-${String(index + 1).padStart(2, '0')}`;
                return (
                  <Text code style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {splitNumber}
                  </Text>
                );
              },
            },
            {
              title: '拆分金额',
              dataIndex: 'amount',
              key: 'amount',
              width: 120,
              render: (amount: number, _record: any, index: number) => (
                <Form.Item
                  name={['splits', index, 'amount']}
                  rules={[{ required: true, message: '请输入拆分金额' }]}
                  style={{ margin: 0 }}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="0.00"
                    precision={2}
                    min={0}
                    value={amount}
                    onChange={(value) => handleAmountChange(value, index)}
                    prefix="RM"
                  />
                </Form.Item>
              ),
            },
            {
              title: '主要分类',
              dataIndex: 'mainCategory',
              key: 'mainCategory',
              width: 120,
              render: (mainCategory: string, _record: any, index: number) => (
                <Form.Item
                  name={['splits', index, 'mainCategory']}
                  style={{ margin: 0 }}
                >
                  <Select
                    placeholder="主要分类"
                    value={mainCategory}
                    onChange={(value) => handleMainCategoryChange(value, index)}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    size="small"
                  >
                    {getMainCategoryOptions().map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ),
            },
            {
              title: '业务分类',
              dataIndex: 'businessCategory',
              key: 'businessCategory',
              width: 120,
              render: (businessCategory: string, record: any, index: number) => (
                <Form.Item
                  name={['splits', index, 'businessCategory']}
                  style={{ margin: 0 }}
                >
                  <Select
                    placeholder="业务分类"
                    value={businessCategory}
                    onChange={(value) => handleBusinessCategoryChange(value, index)}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    disabled={!record.mainCategory}
                    size="small"
                  >
                    {getBusinessCategoryOptions(record.mainCategory || '').map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ),
            },
            {
              title: '具体用途',
              dataIndex: 'specificPurpose',
              key: 'specificPurpose',
              width: 120,
              render: (specificPurpose: string, record: any, index: number) => (
                <Form.Item
                  name={['splits', index, 'specificPurpose']}
                  style={{ margin: 0 }}
                >
                  <Select
                    placeholder="具体用途"
                    value={specificPurpose}
                    onChange={(value) => handleSpecificPurposeChange(value, index)}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    disabled={!record.businessCategory}
                    size="small"
                  >
                    {getSpecificPurposeOptions(record.businessCategory || '').map(option => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ),
            },
            {
              title: '交易用途',
              dataIndex: 'transactionPurpose',
              key: 'transactionPurpose',
              width: 150,
              render: (transactionPurpose: string, _record: any, index: number) => (
                <Form.Item
                  name={['splits', index, 'transactionPurpose']}
                  style={{ margin: 0 }}
                >
                  <Select
                    placeholder="交易用途"
                    value={transactionPurpose}
                    onChange={(value) => handlePurposeChange(value, index)}
                    showSearch
                    optionFilterProp="children"
                    allowClear
                    size="small"
                  >
                    {purposes.map(purpose => (
                      <Option key={purpose.id} value={purpose.id}>
                        {purpose.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ),
            },
            {
              title: '拆分描述',
              dataIndex: 'description',
              key: 'description',
              width: 150,
              render: (description: string, _record: any, index: number) => (
                <Form.Item
                  name={['splits', index, 'description']}
                  style={{ margin: 0 }}
                >
                  <Input
                    placeholder="拆分描述"
                    value={description}
                    onChange={(e) => {
                      const newSplits = [...splits];
                      newSplits[index] = { ...newSplits[index], description: e.target.value };
                      setSplits(newSplits);
                      form.setFieldsValue({ splits: newSplits });
                    }}
                    size="small"
                  />
                </Form.Item>
              ),
            },
            {
              title: '备注',
              dataIndex: 'notes',
              key: 'notes',
              width: 120,
              render: (notes: string, _record: any, index: number) => (
                <Form.Item
                  name={['splits', index, 'notes']}
                  style={{ margin: 0 }}
                >
                  <Input
                    placeholder="备注"
                    value={notes}
                    onChange={(e) => {
                      const newSplits = [...splits];
                      newSplits[index] = { ...newSplits[index], notes: e.target.value };
                      setSplits(newSplits);
                      form.setFieldsValue({ splits: newSplits });
                    }}
                    size="small"
                  />
                </Form.Item>
              ),
            },
            {
              title: '操作',
              key: 'action',
              width: 80,
              render: (_, _record: any, index: number) => (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemoveSplit(index)}
                  disabled={splits.length <= 2}
                  size="small"
                />
              ),
            },
          ]}
          pagination={false}
          size="small"
          scroll={{ x: 1000 }}
        />

        <Divider />
        
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>拆分总金额：</Text>
            <Text style={{ color: '#1890ff', fontWeight: 'bold' }}>
              {calculateTotalAmount().toLocaleString('en-MY', { minimumFractionDigits: 2 })}
            </Text>
          </Col>
          <Col span={8}>
            <Text strong>剩余金额：</Text>
            <Text style={{ 
              color: getRemainingAmount() === 0 ? '#52c41a' : '#ff4d4f', 
              fontWeight: 'bold' 
            }}>
              {getRemainingAmount().toLocaleString('en-MY', { minimumFractionDigits: 2 })}
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
