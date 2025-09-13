import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Table,
  Typography,
  message,
  Card,
  Alert,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  CalculatorOutlined,
} from '@ant-design/icons';
import { Transaction, TransactionPurpose, ExpenseSplit } from '@/types/finance';

const { Text } = Typography;
const { Option } = Select;

interface ExpenseSplittingModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (transactionId: string, splits: Omit<ExpenseSplit, 'id' | 'createdAt'>[]) => Promise<void>;
  transaction: Transaction | null;
  purposes: TransactionPurpose[];
}

interface SplitItem {
  id: string;
  purposeId: string;
  purposeName: string;
  amount: number;
  description: string;
}

const ExpenseSplittingModal: React.FC<ExpenseSplittingModalProps> = ({
  visible,
  onCancel,
  onSave,
  transaction,
  purposes,
}) => {
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && transaction) {
      // 重置拆分数据
      setSplits([]);
      form.resetFields();
    }
  }, [visible, transaction]);

  const addSplit = () => {
    const newSplit: SplitItem = {
      id: `split-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      purposeId: '',
      purposeName: '',
      amount: 0,
      description: '',
    };
    setSplits([...splits, newSplit]);
  };

  const removeSplit = (id: string) => {
    setSplits(splits.filter(split => split.id !== id));
  };

  const updateSplit = (id: string, field: keyof SplitItem, value: any) => {
    setSplits(splits.map(split => {
      if (split.id === id) {
        const updatedSplit = { ...split, [field]: value };
        
        // 如果更新的是用途ID，同时更新用途名称
        if (field === 'purposeId') {
          const purpose = purposes.find(p => p.id === value);
          updatedSplit.purposeName = purpose?.name || '';
        }
        
        return updatedSplit;
      }
      return split;
    }));
  };

  const calculateTotal = (): number => {
    return splits.reduce((sum, split) => sum + split.amount, 0);
  };

  const calculateRemaining = (): number => {
    if (!transaction) return 0;
    const totalAmount = transaction.expense > 0 ? transaction.expense : transaction.income;
    return totalAmount - calculateTotal();
  };

  const handleSave = async () => {
    if (!transaction) return;

    const totalAmount = transaction.expense > 0 ? transaction.expense : transaction.income;
    const splitTotal = calculateTotal();

    if (Math.abs(totalAmount - splitTotal) > 0.01) {
      message.error(`拆分总额 (${splitTotal.toFixed(2)}) 必须等于交易金额 (${totalAmount.toFixed(2)})`);
      return;
    }

    if (splits.length === 0) {
      message.error('请至少添加一个拆分项');
      return;
    }

    try {
      const splitData = splits.map(split => ({
        transactionId: transaction.id,
        purposeId: split.purposeId,
        purposeName: split.purposeName,
        amount: split.amount,
        description: split.description,
      }));

      await onSave(transaction.id, splitData);
      message.success('费用拆分保存成功');
      onCancel();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '交易用途',
      dataIndex: 'purposeId',
      key: 'purposeId',
      width: 200,
      render: (purposeId: string, record: SplitItem) => (
        <Select
          value={purposeId}
          onChange={(value) => updateSplit(record.id, 'purposeId', value)}
          placeholder="选择交易用途"
          style={{ width: '100%' }}
        >
          {purposes.filter(p => p.isActive).map(purpose => (
            <Option key={purpose.id} value={purpose.id}>
              {purpose.name}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: '拆分金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number, record: SplitItem) => (
        <InputNumber
          value={amount}
          onChange={(value) => updateSplit(record.id, 'amount', value || 0)}
          placeholder="拆分金额"
          style={{ width: '100%' }}
          min={0}
          precision={2}
          formatter={(value) => value ? `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
          parser={(value) => (value || '').replace(/RM\s?|(,*)/g, '')}
        />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (description: string, record: SplitItem) => (
        <Input
          value={description}
          onChange={(e) => updateSplit(record.id, 'description', e.target.value)}
          placeholder="描述"
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: any, record: SplitItem) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeSplit(record.id)}
        />
      ),
    },
  ];

  if (!transaction) return null;

  const totalAmount = transaction.expense > 0 ? transaction.expense : transaction.income;
  const splitTotal = calculateTotal();
  const remaining = calculateRemaining();
  const isBalanced = Math.abs(remaining) < 0.01;

  return (
    <Modal
      title="费用拆分"
      open={visible}
      onCancel={onCancel}
      onOk={handleSave}
      width={800}
      destroyOnHidden
      okText="保存拆分"
      cancelText="取消"
    >
      <div>
        {/* 交易信息 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>交易信息：</Text>
            </div>
            <div>
              <Text>日期：{transaction.transactionDate}</Text>
            </div>
            <div>
              <Text>描述：{transaction.mainDescription}</Text>
            </div>
            <div>
              <Text strong style={{ 
                color: transaction.expense > 0 ? '#ff4d4f' : '#52c41a',
                fontSize: '16px'
              }}>
                {transaction.expense > 0 ? '支出' : '收入'}：RM {totalAmount.toLocaleString('en-MY', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </Text>
            </div>
          </Space>
        </Card>

        {/* 拆分说明 */}
        <Alert
          message="费用拆分说明"
          description={
            <div>
              <p>• 单笔交易可以拆分为多个交易用途</p>
              <p>• 拆分总额必须等于交易金额</p>
              <p>• 示例：500 MYR → 300 会员费 + 50 报名费 + 75 Jacket + 75 T-shirt</p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* 拆分统计 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">交易金额</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                  RM {totalAmount.toLocaleString('en-MY', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">已拆分</Text>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                  RM {splitTotal.toLocaleString('en-MY', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">剩余</Text>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: isBalanced ? '#52c41a' : '#ff4d4f'
                }}>
                  RM {remaining.toLocaleString('en-MY', { 
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 拆分列表 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <Space>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addSplit}
              >
                添加拆分项
              </Button>
              <Text type="secondary">
                共 {splits.length} 个拆分项
              </Text>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={splits}
            pagination={false}
            size="small"
            rowKey="id"
            locale={{ emptyText: '暂无拆分项，请点击"添加拆分项"' }}
          />
        </div>

        {/* 平衡检查 */}
        {!isBalanced && (
          <Alert
            message="拆分不平衡"
            description={`拆分总额 (RM ${splitTotal.toFixed(2)}) 与交易金额 (RM ${totalAmount.toFixed(2)}) 不匹配，剩余 RM ${remaining.toFixed(2)}`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {isBalanced && splits.length > 0 && (
          <Alert
            message="拆分平衡"
            description="拆分总额与交易金额匹配，可以保存"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
      </div>
    </Modal>
  );
};

export default ExpenseSplittingModal;
