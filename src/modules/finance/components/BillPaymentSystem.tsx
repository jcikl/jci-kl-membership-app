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
  DatePicker,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Tooltip,
  Tabs,
  Steps,
  Divider,
  Input as AntInput,
  DatePicker as AntDatePicker,
  Select as AntSelect,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
  BankOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EyeOutlined,
  SearchOutlined,
  ExportOutlined,
  ReloadOutlined,
  UploadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { BillPaymentRequest, BillPaymentStatus, BillDetail, BankAccount } from '@/types/finance';
import { useAuthStore } from '@/store/authStore';
import { DateFilter } from '@/hooks/useFinanceDateFilter';
import { useBillPaymentPermissions } from '@/hooks/useBillPaymentPermissions';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface BillPaymentSystemProps {
  onCreateRequest: (request: Omit<BillPaymentRequest, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdateRequest: (id: string, request: Partial<BillPaymentRequest>) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
  onApproveRequest: (id: string, notes?: string) => Promise<void>;
  onRejectRequest: (id: string, notes?: string) => Promise<void>;
  onPayRequest: (id: string) => Promise<void>;
  requests: BillPaymentRequest[];
  bankAccounts: BankAccount[];
  loading?: boolean;
  dateFilter?: DateFilter;
}

const BillPaymentSystem: React.FC<BillPaymentSystemProps> = ({
  onCreateRequest,
  onUpdateRequest,
  onDeleteRequest,
  onApproveRequest,
  onRejectRequest,
  onPayRequest,
  requests,
  bankAccounts,
  loading = false,
}) => {
  const { user } = useAuthStore();
  const permissions = useBillPaymentPermissions();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [editingRequest, setEditingRequest] = useState<BillPaymentRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<BillPaymentRequest | null>(null);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('requests');
  const [billDetails, setBillDetails] = useState<BillDetail[]>([]);
  
  // 搜索和筛选状态
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillPaymentStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const billStatusOptions: { value: BillPaymentStatus; label: string; color: string }[] = [
    { value: 'pending', label: '待审批', color: 'orange' },
    { value: 'approved', label: '已审批', color: 'green' },
    { value: 'rejected', label: '已拒绝', color: 'red' },
    { value: 'paid', label: '已支付', color: 'blue' },
    { value: 'cancelled', label: '已取消', color: 'default' },
  ];

  const getStatusTagColor = (status: BillPaymentStatus): string => {
    const option = billStatusOptions.find(opt => opt.value === status);
    return option?.color || 'default';
  };

  const getStatusLabel = (status: BillPaymentStatus): string => {
    const option = billStatusOptions.find(opt => opt.value === status);
    return option?.label || status;
  };

  const getStatusIcon = (status: BillPaymentStatus) => {
    switch (status) {
      case 'pending': return <ClockCircleOutlined />;
      case 'approved': return <CheckCircleOutlined />;
      case 'rejected': return <CloseCircleOutlined />;
      case 'paid': return <DollarOutlined />;
      case 'cancelled': return <CloseCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const handleCreateRequest = () => {
    setEditingRequest(null);
    setBillDetails([]);
    setIsModalVisible(true);
    // 延迟重置表单字段，确保模态框已渲染
    setTimeout(() => {
      form.resetFields();
      form.setFieldsValue({
        submitDate: dayjs(),
        projectYear: new Date().getFullYear(),
        currency: 'MYR',
      });
    }, 0);
  };

  const handleEditRequest = (request: BillPaymentRequest) => {
    setEditingRequest(request);
    setBillDetails(request.billDetails);
    setIsModalVisible(true);
    // 延迟设置表单字段，确保模态框已渲染
    setTimeout(() => {
      form.setFieldsValue({
        ...request,
        submitDate: dayjs(request.submitDate),
      });
    }, 0);
  };

  const handleViewRequest = (request: BillPaymentRequest) => {
    setViewingRequest(request);
    setIsDetailModalVisible(true);
  };

  const handleDeleteRequest = async (id: string) => {
    try {
      await onDeleteRequest(id);
      message.success('账单付款申请删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleApproveRequest = async (id: string) => {
    try {
      await onApproveRequest(id);
      message.success('账单付款申请审批通过');
    } catch (error) {
      console.error('审批失败:', error);
      const errorMessage = error instanceof Error ? error.message : '审批失败，请稍后重试';
      message.error(errorMessage);
    }
  };

  const handleRejectRequest = async (id: string) => {
    Modal.confirm({
      title: '拒绝申请',
      content: '请输入拒绝原因：',
      onOk: async (close) => {
        const notes = (document.querySelector('.ant-modal-confirm-content input') as HTMLInputElement)?.value;
        try {
          await onRejectRequest(id, notes);
          message.success('账单付款申请已拒绝');
          close();
        } catch (error) {
          console.error('拒绝申请失败:', error);
          const errorMessage = error instanceof Error ? error.message : '操作失败，请稍后重试';
          message.error(errorMessage);
        }
      },
    });
  };

  const handlePayRequest = async (id: string) => {
    try {
      await onPayRequest(id);
      message.success('账单付款完成');
    } catch (error) {
      message.error('支付失败');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      // 验证账单明细
      if (billDetails.length === 0) {
        message.error('请至少添加一个账单明细');
        return;
      }

      // 验证明细总金额
      const totalDetailAmount = billDetails.reduce((sum, detail) => sum + (detail.amount || 0), 0);
      if (Math.abs(totalDetailAmount - values.totalAmount) > 0.01) {
        message.error('账单明细总金额必须等于总账单金额');
        return;
      }

      // 验证明细描述
      const hasEmptyDescription = billDetails.some(detail => !detail.description.trim());
      if (hasEmptyDescription) {
        message.error('所有账单明细都必须填写描述');
        return;
      }
      
      const requestData = {
        submitterId: user?.uid || 'unknown-user',
        submitterName: values.submitterName,
        submitterAccount: values.submitterAccount,
        submitDate: dayjs(values.submitDate).format('YYYY-MM-DD'),
        projectYear: values.projectYear,
        totalAmount: values.totalAmount,
        currency: values.currency || 'MYR',
        recipientBank: values.recipientBank,
        recipientName: values.recipientName,
        recipientAccount: values.recipientAccount,
        paymentAccountId: values.paymentAccountId,
        paymentAccountName: bankAccounts.find(acc => acc.id === values.paymentAccountId)?.accountName || '',
        billDetails: billDetails,
        status: 'pending' as BillPaymentStatus,
      };

      if (editingRequest) {
        await onUpdateRequest(editingRequest.id, requestData);
        message.success('账单付款申请更新成功');
      } else {
        await onCreateRequest(requestData);
        message.success('账单付款申请创建成功');
      }

      setIsModalVisible(false);
      form.resetFields();
      setBillDetails([]);
    } catch (error) {
      message.error('操作失败');
    }
  };

  const addBillDetail = () => {
    const newDetail: BillDetail = {
      id: `detail-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: '',
      amount: 0,
      notes: '',
    };
    setBillDetails([...billDetails, newDetail]);
  };

  const removeBillDetail = (id: string) => {
    setBillDetails(billDetails.filter(detail => detail.id !== id));
  };

  const updateBillDetail = (id: string, field: keyof BillDetail, value: any) => {
    setBillDetails(billDetails.map(detail => 
      detail.id === id ? { ...detail, [field]: value } : detail
    ));
  };

  const calculateTotalAmount = (): number => {
    return billDetails.reduce((sum, detail) => sum + detail.amount, 0);
  };

  // 筛选和搜索逻辑
  const filteredRequests = requests.filter(request => {
    // 搜索筛选
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      const matchesSearch = 
        request.submitterName.toLowerCase().includes(searchLower) ||
        request.submitterAccount.toLowerCase().includes(searchLower) ||
        request.recipientName.toLowerCase().includes(searchLower) ||
        request.recipientBank.toLowerCase().includes(searchLower) ||
        request.id.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // 状态筛选
    if (statusFilter !== 'all' && request.status !== statusFilter) {
      return false;
    }

    // 日期筛选
    if (dateRange && dateRange[0] && dateRange[1]) {
      const requestDate = dayjs(request.submitDate);
      const startDate = dateRange[0];
      const endDate = dateRange[1];
      
      if (!requestDate.isAfter(startDate.subtract(1, 'day')) || !requestDate.isBefore(endDate.add(1, 'day'))) {
        return false;
      }
    }

    return true;
  });

  // 批量操作
  const handleBulkApprove = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要审批的申请');
      return;
    }

    try {
      for (const id of selectedRowKeys) {
        await onApproveRequest(id as string);
      }
      message.success(`成功审批 ${selectedRowKeys.length} 个申请`);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('批量审批失败');
    }
  };

  const handleBulkReject = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要拒绝的申请');
      return;
    }

    Modal.confirm({
      title: '批量拒绝申请',
      content: '请输入拒绝原因：',
      onOk: async (close) => {
        const notes = (document.querySelector('.ant-modal-confirm-content input') as HTMLInputElement)?.value;
        try {
          for (const id of selectedRowKeys) {
            await onRejectRequest(id as string, notes);
          }
          message.success(`成功拒绝 ${selectedRowKeys.length} 个申请`);
          setSelectedRowKeys([]);
          close();
        } catch (error) {
          message.error('批量拒绝失败');
        }
      },
    });
  };

  const handleExport = () => {
    // 导出功能实现
    message.info('导出功能开发中...');
  };

  const handleRefresh = () => {
    // 刷新数据
    window.location.reload();
  };

  // 获取状态对应的步骤
  const getStatusStep = (status: BillPaymentStatus): number => {
    switch (status) {
      case 'pending': return 0;
      case 'approved': return 1;
      case 'paid': return 2;
      case 'rejected': return 1; // 拒绝也是审批步骤
      case 'cancelled': return 0; // 取消回到初始状态
      default: return 0;
    }
  };

  // 获取操作标签
  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'submit': return '提交申请';
      case 'approve': return '审批通过';
      case 'reject': return '审批拒绝';
      case 'pay': return '确认支付';
      case 'cancel': return '取消申请';
      default: return action;
    }
  };

  const columns = [
    {
      title: '申请编号',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (id: string) => (
        <Text code>{id.slice(-8)}</Text>
      ),
    },
    {
      title: '提交人',
      dataIndex: 'submitterName',
      key: 'submitterName',
      width: 120,
      render: (text: string) => (
        <Space>
          <UserOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '提交日期',
      dataIndex: 'submitDate',
      key: 'submitDate',
      width: 120,
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{dayjs(date).format('DD-MMM-YYYY')}</Text>
        </Space>
      ),
    },
    {
      title: '总金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number, record: BillPaymentRequest) => (
        <Text strong>
          <DollarOutlined /> {amount.toLocaleString('en-MY', { 
            style: 'currency', 
            currency: record.currency || 'MYR'
          })}
        </Text>
      ),
    },
    {
      title: '收款人',
      dataIndex: 'recipientName',
      key: 'recipientName',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: '支付户口',
      dataIndex: 'paymentAccountName',
      key: 'paymentAccountName',
      width: 150,
      render: (text: string) => (
        <Space>
          <BankOutlined />
          <Text>{text}</Text>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: BillPaymentStatus) => (
        <Tag color={getStatusTagColor(status)} icon={getStatusIcon(status)}>
          {getStatusLabel(status)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: BillPaymentRequest) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewRequest(record)}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <>
              {permissions.canEdit && (
                <Tooltip title="编辑">
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEditRequest(record)}
                  />
                </Tooltip>
              )}
              {permissions.canApprove && (
                <Tooltip title="审批通过">
                  <Button
                    type="link"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleApproveRequest(record.id)}
                  />
                </Tooltip>
              )}
              {permissions.canReject && (
                <Tooltip title="拒绝">
                  <Button
                    type="link"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleRejectRequest(record.id)}
                  />
                </Tooltip>
              )}
            </>
          )}
          {record.status === 'approved' && permissions.canPay && (
            <Tooltip title="确认支付">
              <Button
                type="link"
                icon={<DollarOutlined />}
                onClick={() => handlePayRequest(record.id)}
              />
            </Tooltip>
          )}
          {permissions.canDelete && (
            <Popconfirm
              title="确定要删除这个账单付款申请吗？"
              description="删除后将无法恢复，请谨慎操作。"
              onConfirm={() => handleDeleteRequest(record.id)}
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
          )}
        </Space>
      ),
    },
  ];

  // 计算统计信息
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const paidRequests = requests.filter(r => r.status === 'paid').length;
  // const totalAmount = requests.reduce((sum, r) => sum + r.totalAmount, 0);

  const tabItems = [
    {
      key: 'requests',
      label: '付款申请',
      children: (
        <div>
          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总申请数"
                  value={totalRequests}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="待审批"
                  value={pendingRequests}
                  prefix={<ClockCircleOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="已审批"
                  value={approvedRequests}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="已支付"
                  value={paidRequests}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 搜索和筛选控件 */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col span={8}>
                <AntInput
                  placeholder="搜索申请编号、提交人、收款人等"
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={4}>
                <AntSelect
                  placeholder="状态筛选"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="all">全部状态</Option>
                  {billStatusOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </AntSelect>
              </Col>
              <Col span={6}>
                <AntDatePicker.RangePicker
                  placeholder={['开始日期', '结束日期']}
                  value={dateRange}
                  onChange={setDateRange}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={6}>
                <Space>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={handleRefresh}
                    title="刷新数据"
                  >
                    刷新
                  </Button>
                  {permissions.canExport && (
                    <Button 
                      icon={<ExportOutlined />} 
                      onClick={handleExport}
                      title="导出数据"
                    >
                      导出
                    </Button>
                  )}
                  {permissions.canBulkApprove && selectedRowKeys.length > 0 && (
                    <Button 
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={handleBulkApprove}
                    >
                      批量审批 ({selectedRowKeys.length})
                    </Button>
                  )}
                  {permissions.canBulkReject && selectedRowKeys.length > 0 && (
                    <Button 
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={handleBulkReject}
                    >
                      批量拒绝 ({selectedRowKeys.length})
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          <Table
            columns={columns}
            dataSource={filteredRequests}
            loading={loading}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              getCheckboxProps: (record) => ({
                disabled: record.status !== 'pending',
              }),
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            }}
            scroll={{ x: 1500 }}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                <FileTextOutlined /> 账单付款申请系统
              </Title>
            </Col>
            <Col>
              {permissions.canCreate && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateRequest}
                >
                  新建申请
                </Button>
              )}
            </Col>
          </Row>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={editingRequest ? '编辑账单付款申请' : '新建账单付款申请'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="submitterName"
                label="提交人姓名"
                rules={[
                  { required: true, message: '请输入提交人姓名' },
                  { min: 2, message: '提交人姓名至少2个字符' },
                  { max: 50, message: '提交人姓名不能超过50个字符' },
                  { pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/, message: '提交人姓名只能包含中文、英文字母和空格' }
                ]}
              >
                <Input placeholder="请输入提交人姓名" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="submitterAccount"
                label="提交用户户口"
                rules={[
                  { required: true, message: '请输入提交用户户口' },
                  { min: 3, message: '用户户口至少3个字符' },
                  { max: 30, message: '用户户口不能超过30个字符' },
                  { pattern: /^[a-zA-Z0-9_-]+$/, message: '用户户口只能包含字母、数字、下划线和连字符' }
                ]}
              >
                <Input placeholder="请输入提交用户户口" maxLength={30} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="submitDate"
                label="提交日期"
                rules={[{ required: true, message: '请选择提交日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  format="YYYY-MM-DD"
                  placeholder="请选择提交日期"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="totalAmount"
                label="总账单金额"
                rules={[
                  { required: true, message: '请输入总账单金额' },
                  { type: 'number', min: 0.01, message: '金额必须大于0' },
                  { type: 'number', max: 999999999.99, message: '金额不能超过999,999,999.99' }
                ]}
              >
                <InputNumber
                  placeholder="请输入总账单金额"
                  style={{ width: '100%' }}
                  min={0.01}
                  max={999999999.99}
                  precision={2}
                  step={0.01}
                  formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value!.replace(/RM\s?|(,*)/g, '') as any}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="账单货币"
                rules={[{ required: true, message: '请选择账单货币' }]}
              >
                <Select placeholder="请选择账单货币">
                  <Option value="MYR">马来西亚令吉 (MYR)</Option>
                  <Option value="USD">美元 (USD)</Option>
                  <Option value="SGD">新加坡元 (SGD)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>收款信息</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="recipientBank"
                label="收款银行"
                rules={[
                  { required: true, message: '请输入收款银行' },
                  { min: 2, message: '银行名称至少2个字符' },
                  { max: 100, message: '银行名称不能超过100个字符' }
                ]}
              >
                <Input placeholder="请输入收款银行" maxLength={100} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="recipientName"
                label="收款人"
                rules={[
                  { required: true, message: '请输入收款人' },
                  { min: 2, message: '收款人姓名至少2个字符' },
                  { max: 50, message: '收款人姓名不能超过50个字符' },
                  { pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/, message: '收款人姓名只能包含中文、英文字母和空格' }
                ]}
              >
                <Input placeholder="请输入收款人" maxLength={50} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="recipientAccount"
                label="收款账号"
                rules={[
                  { required: true, message: '请输入收款账号' },
                  { min: 8, message: '账号至少8位数字' },
                  { max: 20, message: '账号不能超过20位数字' },
                  { pattern: /^[0-9]+$/, message: '账号只能包含数字' }
                ]}
              >
                <Input placeholder="请输入收款账号" maxLength={20} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="paymentAccountId"
            label="支付户口"
            rules={[{ required: true, message: '请选择支付户口' }]}
          >
            <Select placeholder="请选择支付户口">
              {bankAccounts.filter(acc => acc.isActive).map(account => (
                <Option key={account.id} value={account.id}>
                  {account.accountName} ({account.accountType})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>账单明细</Divider>

          <div style={{ marginBottom: 16 }}>
            <Space style={{ marginBottom: 8 }}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addBillDetail}
              >
                添加账单明细
              </Button>
              <Text type="secondary">
                明细总额：{calculateTotalAmount().toLocaleString('en-MY', { 
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </Text>
            </Space>

            {billDetails.map((detail) => (
              <Card key={detail.id} size="small" style={{ marginBottom: 8 }}>
                <Row gutter={8}>
                  <Col span={8}>
                    <Input
                      placeholder="描述"
                      value={detail.description}
                      onChange={(e) => updateBillDetail(detail.id, 'description', e.target.value)}
                    />
                  </Col>
                  <Col span={6}>
                    <InputNumber
                      placeholder="金额"
                      value={detail.amount}
                      onChange={(value) => updateBillDetail(detail.id, 'amount', value || 0)}
                      style={{ width: '100%' }}
                      min={0}
                      precision={2}
                      formatter={(value) => `RM ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value!.replace(/RM\s?|(,*)/g, '') as any}
                    />
                  </Col>
                  <Col span={6}>
                    <Input
                      placeholder="备注"
                      value={detail.notes}
                      onChange={(e) => updateBillDetail(detail.id, 'notes', e.target.value)}
                    />
                  </Col>
                  <Col span={4}>
                    <Upload
                      beforeUpload={() => false}
                      onChange={(info) => {
                        if (info.file.status === 'done') {
                          updateBillDetail(detail.id, 'receiptUrl', info.file.response?.url || '');
                        }
                      }}
                      showUploadList={false}
                    >
                      <Button size="small" icon={<UploadOutlined />}>
                        上传单据
                      </Button>
                    </Upload>
                    {detail.receiptUrl && (
                      <div style={{ marginTop: 4 }}>
                        <Button 
                          size="small" 
                          type="link" 
                          icon={<DownloadOutlined />}
                          onClick={() => window.open(detail.receiptUrl, '_blank')}
                        >
                          查看单据
                        </Button>
                      </div>
                    )}
                  </Col>
                  <Col span={2}>
                    <Button
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeBillDetail(detail.id)}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </div>
        </Form>
      </Modal>

      {/* 详情查看模态框 */}
      <Modal
        title="账单付款申请详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {viewingRequest && (
          <div>
            <Steps
              current={
                viewingRequest.status === 'pending' ? 0 :
                viewingRequest.status === 'approved' ? 1 :
                viewingRequest.status === 'paid' ? 2 : 0
              }
              items={[
                { title: '提交申请', description: '申请已提交，等待审批' },
                { title: '审批通过', description: '申请已审批通过' },
                { title: '支付完成', description: '款项已支付' },
              ]}
              style={{ marginBottom: 24 }}
            />

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="基本信息">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><Text strong>申请编号：</Text><Text code>{viewingRequest.id.slice(-8)}</Text></div>
                    <div><Text strong>提交人：</Text><Text>{viewingRequest.submitterName}</Text></div>
                    <div><Text strong>提交日期：</Text><Text>{dayjs(viewingRequest.submitDate).format('DD-MMM-YYYY')}</Text></div>
                    <div><Text strong>项目年份：</Text><Text>{viewingRequest.projectYear}</Text></div>
                    <div><Text strong>总金额：</Text><Text strong style={{ color: '#1890ff' }}>
                      {viewingRequest.totalAmount.toLocaleString('en-MY', { 
                        style: 'currency', 
                        currency: viewingRequest.currency || 'MYR'
                      })}
                    </Text></div>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="收款信息">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><Text strong>收款银行：</Text><Text>{viewingRequest.recipientBank}</Text></div>
                    <div><Text strong>收款人：</Text><Text>{viewingRequest.recipientName}</Text></div>
                    <div><Text strong>收款账号：</Text><Text code>{viewingRequest.recipientAccount}</Text></div>
                    <div><Text strong>支付户口：</Text><Text>{viewingRequest.paymentAccountName}</Text></div>
                  </Space>
                </Card>
              </Col>
            </Row>

            {/* 状态流转步骤 */}
            <Card size="small" title="申请状态" style={{ marginTop: 16 }}>
              <Steps
                current={getStatusStep(viewingRequest.status)}
                size="small"
                items={[
                  {
                    title: '提交申请',
                    description: `提交人：${viewingRequest.submitterName}`,
                    icon: <UserOutlined />,
                  },
                  {
                    title: '审批处理',
                    description: viewingRequest.approvedBy ? `审批人：${viewingRequest.approvedBy}` : '待审批',
                    icon: <CheckCircleOutlined />,
                  },
                  {
                    title: '支付确认',
                    description: viewingRequest.paidAt ? `支付时间：${dayjs(viewingRequest.paidAt).format('DD-MMM-YYYY HH:mm')}` : '待支付',
                    icon: <DollarOutlined />,
                  },
                ]}
              />
              {viewingRequest.approvalNotes && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>审批备注：</Text>
                  <Text>{viewingRequest.approvalNotes}</Text>
                </div>
              )}
            </Card>

            <Card size="small" title="账单明细" style={{ marginTop: 16 }}>
              <Table
                dataSource={viewingRequest.billDetails}
                columns={[
                  { title: '描述', dataIndex: 'description', key: 'description' },
                  { 
                    title: '金额', 
                    dataIndex: 'amount', 
                    key: 'amount',
                    align: 'right' as const,
                    render: (amount: number) => (
                      <Text strong>
                        {amount.toLocaleString('en-MY', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </Text>
                    )
                  },
                  { title: '备注', dataIndex: 'notes', key: 'notes' },
                  {
                    title: '单据',
                    dataIndex: 'receiptUrl',
                    key: 'receiptUrl',
                    render: (url: string) => (
                      url ? (
                        <Button 
                          size="small" 
                          type="link" 
                          icon={<DownloadOutlined />}
                          onClick={() => window.open(url, '_blank')}
                        >
                          查看单据
                        </Button>
                      ) : (
                        <Text type="secondary">无单据</Text>
                      )
                    )
                  },
                ]}
                pagination={false}
                size="small"
                rowKey="id"
              />
            </Card>

            {/* 审批历史记录 */}
            {viewingRequest.approvalHistory && viewingRequest.approvalHistory.length > 0 && (
              <Card size="small" title="审批历史" style={{ marginTop: 16 }}>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {viewingRequest.approvalHistory.map((history, index) => (
                    <div key={history.id} style={{ 
                      padding: '12px 0', 
                      borderBottom: index < viewingRequest.approvalHistory!.length - 1 ? '1px solid #f0f0f0' : 'none' 
                    }}>
                      <Row justify="space-between" align="top">
                        <Col span={16}>
                          <Space direction="vertical" size="small">
                            <div>
                              <Text strong>{getActionLabel(history.action)}</Text>
                              <Text type="secondary" style={{ marginLeft: 8 }}>
                                {history.actorName}
                              </Text>
                            </div>
                            {history.notes && (
                              <Text type="secondary">{history.notes}</Text>
                            )}
                          </Space>
                        </Col>
                        <Col span={8}>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {dayjs(history.timestamp).format('DD-MMM-YYYY HH:mm')}
                          </Text>
                        </Col>
                      </Row>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BillPaymentSystem;
