import React, { useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Typography,
  Select,
  DatePicker,
  message,
  Row,
  Col,
  Statistic,
  Tabs,
  Tooltip,
  Modal,
  Descriptions,
  Divider,
} from 'antd';
import {
  FileTextOutlined,
  BarChartOutlined,
  DownloadOutlined,
  CalendarOutlined,
  DollarOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { 
  FinancialReport, 
  FinancialReportType, 
  BankAccount,
  Transaction,
  Budget,
  BudgetAllocation,
  TransactionPurpose
} from '@/types/finance';
import { DateFilter } from '@/hooks/useFinanceDateFilter';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface FinancialReportsProps {
  onGenerateReport: (reportType: FinancialReportType, startDate: string, endDate: string, auditYear: number) => Promise<FinancialReport>;
  onExportReport: (reportId: string, format: 'pdf' | 'excel') => Promise<void>;
  reports: FinancialReport[];
  bankAccounts: BankAccount[];
  transactions: Transaction[];
  budgets: Budget[];
  allocations: BudgetAllocation[];
  purposes: TransactionPurpose[];
  loading?: boolean;
  dateFilter?: DateFilter;
}

const FinancialReports: React.FC<FinancialReportsProps> = ({
  onGenerateReport,
  onExportReport,
  reports,
  // bankAccounts, // Unused for now
  transactions,
  budgets,
  // allocations, // Unused for now
  // purposes, // Unused for now
  loading = false,
  // dateFilter, // Unused for now
}) => {
  const { fiscalYear } = useFiscalYear();
  const [selectedReportType, setSelectedReportType] = useState<FinancialReportType>('income_statement');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('year'),
    dayjs().endOf('year')
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [viewingReport, setViewingReport] = useState<FinancialReport | null>(null);
  const [activeTab, setActiveTab] = useState('generate');

  const reportTypeOptions: { value: FinancialReportType; label: string; description: string }[] = [
    { value: 'income_statement', label: '损益表', description: '显示收入和支出情况' },
    { value: 'balance_sheet', label: '资产负债表', description: '显示资产和负债情况' },
    { value: 'cash_flow', label: '现金流量表', description: '显示现金流入和流出' },
    { value: 'bank_reconciliation', label: '银行对账单', description: '银行账户余额对账' },
    { value: 'monthly_summary', label: '月度收支报告', description: '月度财务汇总' },
    { value: 'project_summary', label: '项目收支报告', description: '按项目统计收支' },
    { value: 'general_ledger', label: '总账', description: '所有交易记录汇总' },
  ];

  const getReportTypeLabel = (type: FinancialReportType): string => {
    const option = reportTypeOptions.find(opt => opt.value === type);
    return option?.label || type;
  };

  const getReportStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'green';
      case 'generating': return 'blue';
      case 'failed': return 'red';
      default: return 'default';
    }
  };

  const handleGenerateReport = async () => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      message.error('请选择报告期间');
      return;
    }

    setIsGenerating(true);
    try {
      await onGenerateReport(
        selectedReportType,
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
        fiscalYear
      );
      message.success('报告生成成功');
    } catch (error) {
      message.error('报告生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewReport = (report: FinancialReport) => {
    setViewingReport(report);
    setIsDetailModalVisible(true);
  };

  const handleExportReport = async (reportId: string, format: 'pdf' | 'excel') => {
    try {
      await onExportReport(reportId, format);
      message.success(`报告导出成功 (${format.toUpperCase()})`);
    } catch (error) {
      message.error('报告导出失败');
    }
  };

  // 计算统计信息
  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === 'completed').length;
  const generatingReports = reports.filter(r => r.status === 'generating').length;
  const failedReports = reports.filter(r => r.status === 'failed').length;

  // 计算财务概览
  const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
  const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);
  const netIncome = totalIncome - totalExpense;
  const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);

  const reportColumns = [
    {
      title: '报告名称',
      dataIndex: 'reportName',
      key: 'reportName',
      width: 200,
      render: (text: string) => (
        <Space>
          <FileTextOutlined />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: '报告类型',
      dataIndex: 'reportType',
      key: 'reportType',
      width: 120,
      render: (type: FinancialReportType) => (
        <Tag color="blue">{getReportTypeLabel(type)}</Tag>
      ),
    },
    {
      title: '报告期间',
      dataIndex: 'reportPeriod',
      key: 'reportPeriod',
      width: 150,
      render: (period: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{period}</Text>
        </Space>
      ),
    },
    {
      title: '财政年度',
      dataIndex: 'auditYear',
      key: 'auditYear',
      width: 100,
      render: (year: number) => (
        <Text>{year}</Text>
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      width: 150,
      render: (date: string) => dayjs(date).format('DD-MMM-YYYY HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getReportStatusColor(status)}>
          {status === 'completed' ? '已完成' : 
           status === 'generating' ? '生成中' : 
           status === 'failed' ? '失败' : status}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: FinancialReport) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => handleViewReport(record)}
            />
          </Tooltip>
          {record.status === 'completed' && (
            <>
              <Tooltip title="导出PDF">
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => handleExportReport(record.id, 'pdf')}
                />
              </Tooltip>
              <Tooltip title="导出Excel">
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => handleExportReport(record.id, 'excel')}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'generate',
      label: '生成报告',
      children: (
        <div>
          {/* 财务概览 */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总收入"
                  value={totalIncome}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总支出"
                  value={totalExpense}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="净收入"
                  value={netIncome}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: netIncome >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="预算使用率"
                  value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}
                  suffix="%"
                  precision={1}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          {/* 报告生成 */}
          <Card title="生成财务报告">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>报告类型：</Text>
                </div>
                <Select
                  value={selectedReportType}
                  onChange={setSelectedReportType}
                  style={{ width: '100%' }}
                >
                  {reportTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {reportTypeOptions.find(opt => opt.value === selectedReportType)?.description}
                  </Text>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>报告期间：</Text>
                </div>
                <RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={8}>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>财政年度：</Text>
                </div>
                <div style={{ paddingTop: '32px' }}>
                  <Text>{fiscalYear}</Text>
                </div>
              </Col>
            </Row>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={handleGenerateReport}
              loading={isGenerating}
              size="large"
            >
              生成报告
            </Button>
          </Card>
        </div>
      ),
    },
    {
      key: 'reports',
      label: '历史报告',
      children: (
        <div>
          {/* 报告统计 */}
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="总报告数"
                  value={totalReports}
                  prefix={<FileTextOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="已完成"
                  value={completedReports}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="生成中"
                  value={generatingReports}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="失败"
                  value={failedReports}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          <Table
            columns={reportColumns}
            dataSource={reports}
            loading={loading}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            }}
            scroll={{ x: 1000 }}
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
                <BarChartOutlined /> 财务报告
              </Title>
              <Text type="secondary">生成和管理财务报告</Text>
            </Col>
          </Row>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* 报告详情模态框 */}
      <Modal
        title="财务报告详情"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={1000}
      >
        {viewingReport && (
          <div>
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="报告名称">{viewingReport.reportName}</Descriptions.Item>
              <Descriptions.Item label="报告类型">{getReportTypeLabel(viewingReport.reportType)}</Descriptions.Item>
              <Descriptions.Item label="报告期间">{viewingReport.reportPeriod}</Descriptions.Item>
              <Descriptions.Item label="财政年度">{viewingReport.auditYear}</Descriptions.Item>
              <Descriptions.Item label="生成时间">{dayjs(viewingReport.generatedAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getReportStatusColor(viewingReport.status)}>
                  {viewingReport.status === 'completed' ? '已完成' : 
                   viewingReport.status === 'generating' ? '生成中' : 
                   viewingReport.status === 'failed' ? '失败' : viewingReport.status}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {viewingReport.status === 'completed' && viewingReport.data && (
              <div style={{ marginTop: 24 }}>
                <Divider>财务数据</Divider>
                
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title="总收入"
                        value={viewingReport.data.totalIncome}
                        prefix={<DollarOutlined />}
                        precision={2}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title="总支出"
                        value={viewingReport.data.totalExpense}
                        prefix={<DollarOutlined />}
                        precision={2}
                        valueStyle={{ color: '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                  <Col span={8}>
                    <Card size="small">
                      <Statistic
                        title="净收入"
                        value={viewingReport.data.netIncome}
                        prefix={<DollarOutlined />}
                        precision={2}
                        valueStyle={{ color: (viewingReport.data.netIncome || 0) >= 0 ? '#52c41a' : '#ff4d4f' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* 银行余额 */}
                <Card size="small" title="银行余额" style={{ marginBottom: 16 }}>
                  <Table
                    dataSource={viewingReport.data.bankBalances}
                    columns={[
                      { title: '账户名称', dataIndex: 'accountName', key: 'accountName' },
                      { 
                        title: '余额', 
                        dataIndex: 'balance', 
                        key: 'balance',
                        align: 'right' as const,
                        render: (amount: number) => (
                          <Text strong style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
                            RM {amount.toLocaleString('en-MY', { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </Text>
                        )
                      },
                      { 
                        title: '最后更新', 
                        dataIndex: 'lastUpdated', 
                        key: 'lastUpdated',
                        render: (date: string) => dayjs(date).format('DD-MMM-YYYY HH:mm')
                      },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey="accountId"
                  />
                </Card>

                {/* 预算对比 */}
                {viewingReport.data.budgetComparison && viewingReport.data.budgetComparison.length > 0 && (
                  <Card size="small" title="预算对比">
                    <Table
                      dataSource={viewingReport.data.budgetComparison}
                      columns={[
                        { title: '用途', dataIndex: 'purposeName', key: 'purposeName' },
                        { 
                          title: '预算金额', 
                          dataIndex: 'budgetedAmount', 
                          key: 'budgetedAmount',
                          align: 'right' as const,
                          render: (amount: number) => (
                            <Text>RM {amount.toLocaleString('en-MY', { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}</Text>
                          )
                        },
                        { 
                          title: '实际金额', 
                          dataIndex: 'actualAmount', 
                          key: 'actualAmount',
                          align: 'right' as const,
                          render: (amount: number) => (
                            <Text>RM {amount.toLocaleString('en-MY', { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}</Text>
                          )
                        },
                        { 
                          title: '差异', 
                          dataIndex: 'variance', 
                          key: 'variance',
                          align: 'right' as const,
                          render: (amount: number) => (
                            <Text style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
                              RM {amount.toLocaleString('en-MY', { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </Text>
                          )
                        },
                        { 
                          title: '差异率', 
                          dataIndex: 'variancePercentage', 
                          key: 'variancePercentage',
                          align: 'right' as const,
                          render: (percentage: number) => (
                            <Text style={{ color: percentage >= 0 ? '#52c41a' : '#ff4d4f' }}>
                              {percentage.toFixed(1)}%
                            </Text>
                          )
                        },
                      ]}
                      pagination={false}
                      size="small"
                      rowKey="purposeId"
                    />
                  </Card>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FinancialReports;
