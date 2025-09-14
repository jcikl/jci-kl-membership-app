import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useAuthStore } from '@/store/authStore';
import { BankAccount, BankAccountType } from '@/types/finance';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface BankAccountManagementProps {
  onCreateAccount: (account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateAccount: (id: string, account: Partial<BankAccount>) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  bankAccounts: BankAccount[];
  loading?: boolean;
}

const BankAccountManagement: React.FC<BankAccountManagementProps> = ({
  onCreateAccount,
  onUpdateAccount,
  onDeleteAccount,
  bankAccounts,
  loading = false,
}) => {
  const { fiscalYear } = useFiscalYear();
  const { user } = useAuthStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [form] = Form.useForm();

  const bankAccountTypeOptions: { value: BankAccountType; label: string }[] = [
    { value: 'savings', label: '储蓄户口' },
    { value: 'current', label: '往来户口' },
    { value: 'fixed_deposit', label: '定期存款' },
    { value: 'investment', label: '投资户口' },
    { value: 'other', label: '其他' },
  ];

  const getAccountTypeTagColor = (type: BankAccountType): string => {
    const colorMap: Record<BankAccountType, string> = {
      savings: 'green',
      current: 'blue',
      fixed_deposit: 'orange',
      investment: 'purple',
      other: 'default',
    };
    return colorMap[type] || 'default';
  };

  const getAccountTypeLabel = (type: BankAccountType): string => {
    const option = bankAccountTypeOptions.find(opt => opt.value === type);
    return option?.label || type;
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setIsModalVisible(true);
    // Reset fields after modal is shown to avoid useForm warning
    setTimeout(() => {
      form.resetFields();
    }, 0);
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setIsModalVisible(true);
    // Set form values after modal is shown to avoid useForm warning
    setTimeout(() => {
      form.setFieldsValue({
        ...account,
        initialAmount: account.initialAmount,
      });
    }, 0);
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await onDeleteAccount(id);
      message.success('银行户口删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      const accountData = {
        accountName: values.accountName,
        accountType: values.accountType,
        initialAmount: values.initialAmount,
        currentBalance: editingAccount ? editingAccount.currentBalance : values.initialAmount,
        auditYear: fiscalYear,
        bankName: values.bankName || '',
        accountNumber: values.accountNumber || '',
        description: values.description || '',
        isActive: values.isActive !== undefined ? values.isActive : true,
        createdBy: user?.uid || 'unknown-user',
      };

      if (editingAccount) {
        await onUpdateAccount(editingAccount.id, accountData);
        message.success('银行户口更新成功');
      } else {
        await onCreateAccount(accountData);
        message.success('银行户口创建成功');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('银行户口操作失败:', error);
      const errorMessage = error instanceof Error ? error.message : '操作失败';
      message.error(`银行户口操作失败: ${errorMessage}`);
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingAccount(null);
  };

  const columns = [
    {
      title: '户口名称',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 150,
      render: (text: string, record: BankAccount) => (
        <Space>
          <BankOutlined />
          <Text strong>{text}</Text>
          {!record.isActive && <Tag color="red">已停用</Tag>}
        </Space>
      ),
    },
    {
      title: '户口类型',
      dataIndex: 'accountType',
      key: 'accountType',
      width: 120,
      render: (type: BankAccountType) => (
        <Tag color={getAccountTypeTagColor(type)}>
          {getAccountTypeLabel(type)}
        </Tag>
      ),
    },
    {
      title: '银行名称',
      dataIndex: 'bankName',
      key: 'bankName',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '账号',
      dataIndex: 'accountNumber',
      key: 'accountNumber',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: '初始金额',
      dataIndex: 'initialAmount',
      key: 'initialAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: 'MYR' 
          })}
        </Text>
      ),
    },
    {
      title: '当前余额',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => (
        <Text strong style={{ 
          color: amount >= 0 ? '#52c41a' : '#ff4d4f' 
        }}>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: 'MYR' 
          })}
        </Text>
      ),
    },
    {
      title: '财政年度',
      dataIndex: 'auditYear',
      key: 'auditYear',
      width: 100,
      render: (year: number) => (
        <Space>
          <CalendarOutlined />
          <Text>{year}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        isActive ? 
          <Tag color="green" icon={<CheckCircleOutlined />}>启用</Tag> : 
          <Tag color="red" icon={<CloseCircleOutlined />}>停用</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD-MMM-YYYY'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: BankAccount) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditAccount(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个银行户口吗？"
            description="删除后将无法恢复，请谨慎操作。"
            onConfirm={() => handleDeleteAccount(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 计算统计信息
  const totalAccounts = bankAccounts.length;
  const activeAccounts = bankAccounts.filter(acc => acc.isActive).length;
  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const totalInitialAmount = bankAccounts.reduce((sum, acc) => sum + acc.initialAmount, 0);

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <BankOutlined /> 银行户口管理
              </Title>
              <Text type="secondary">财政年度：{fiscalYear}</Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateAccount}
              >
                创建新户口
              </Button>
            </Col>
          </Row>
        </div>

        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总户口数"
                value={totalAccounts}
                prefix={<BankOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="启用户口"
                value={activeAccounts}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总余额"
                value={totalBalance}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: totalBalance >= 0 ? '#52c41a' : '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="总初始金额"
                value={totalInitialAmount}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={bankAccounts}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingAccount ? '编辑银行户口' : '创建银行户口'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isActive: true,
                auditYear: fiscalYear,
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="accountName"
                label="户口名称"
                rules={[{ required: true, message: '请输入户口名称' }]}
              >
                <Input placeholder="请输入户口名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="accountType"
                label="户口类型"
                rules={[{ required: true, message: '请选择户口类型' }]}
              >
                <Select placeholder="请选择户口类型">
                  {bankAccountTypeOptions.map(option => (
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
                name="bankName"
                label="银行名称"
              >
                <Input placeholder="请输入银行名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="accountNumber"
                label="账号"
              >
                <Input placeholder="请输入账号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="initialAmount"
                label="初始金额"
                rules={[{ required: true, message: '请输入初始金额' }]}
              >
                <InputNumber
                  placeholder="请输入初始金额"
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => (parseFloat(value!.replace(/RM\s?|(,*)/g, '')) || 0) as any}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="auditYear"
                label="财政年度"
                rules={[{ required: true, message: '请输入财政年度' }]}
              >
                <InputNumber
                  placeholder="请输入财政年度"
                  style={{ width: '100%' }}
                  min={2020}
                  max={2030}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea
              placeholder="请输入描述"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="状态"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="停用"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BankAccountManagement;
