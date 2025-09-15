import React, { useState, useMemo } from 'react';
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
  Progress,
  Tooltip,
  Modal,
  Descriptions,
  Divider,
  Input,
  Dropdown,
} from 'antd';
import {
  FileTextOutlined,
  BarChartOutlined,
  DownloadOutlined,
  CalendarOutlined,
  DollarOutlined,
  EyeOutlined,
  SearchOutlined,
  MoreOutlined,
  DeleteOutlined,
  ReloadOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { 
  FinancialReport, 
  FinancialReportType,
  Transaction,
  Budget,
} from '@/types/finance';
import { financialReportService } from '@/services/financeService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface FinancialReportsProps {
  onGenerateReport: (reportType: FinancialReportType, startDate: string, endDate: string, auditYear: number) => Promise<FinancialReport>;
  onExportReport: (reportId: string, format: 'pdf' | 'excel') => Promise<void>;
  onRefreshReports?: () => void; // 新增：刷新报告列表的回调
  reports: FinancialReport[];
  transactions: Transaction[];
  budgets: Budget[];
  loading?: boolean;
}

const FinancialReports: React.FC<FinancialReportsProps> = ({
  onGenerateReport,
  onExportReport,
  onRefreshReports,
  reports,
  transactions,
  budgets,
  loading = false,
}) => {
  const { fiscalYear } = useFiscalYear();
  const [selectedReportType, setSelectedReportType] = useState<FinancialReportType>('statement_of_financial_position');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('year'),
    dayjs().endOf('year')
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [viewingReport, setViewingReport] = useState<FinancialReport | null>(null);
  
  // 历史报告筛选和搜索状态
  const [searchText, setSearchText] = useState('');
  const [filterReportType, setFilterReportType] = useState<FinancialReportType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string | 'all'>('all');
  const [filterAuditYear, setFilterAuditYear] = useState<number | 'all'>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [sortField, setSortField] = useState<string>('generatedAt');
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');

  const reportTypeOptions: { value: FinancialReportType; label: string; description: string }[] = [
    { value: 'statement_of_financial_position', label: '财务状况表', description: '显示资产、负债和权益状况' },
    { value: 'income_statement', label: '损益表', description: '显示收入和支出情况' },
    { value: 'detailed_income_statement', label: '详细损益表', description: '详细的收入和支出明细' },
    { value: 'notes_to_financial_statements', label: '财务报表附注', description: '财务报表的详细说明和附注' },
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
      console.error('生成财务报告失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      message.error(`报告生成失败: ${errorMessage}`);
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

  const handleDeleteReport = async (reportId: string, reportName: string) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除报告 "${reportName}" 吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await financialReportService.deleteReport(reportId);
          message.success('报告删除成功');
          // 通过回调函数更新报告列表，保持当前标签
          if (onRefreshReports) {
            onRefreshReports();
          }
        } catch (error) {
          console.error('删除报告失败:', error);
          message.error('报告删除失败');
        }
      },
    });
  };

  // 筛选和搜索逻辑
  const filteredReports = useMemo(() => {
    let filtered = reports;

    // 按搜索文本筛选
    if (searchText) {
      filtered = filtered.filter(report => 
        report.reportName.toLowerCase().includes(searchText.toLowerCase()) ||
        report.reportPeriod.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // 按报告类型筛选
    if (filterReportType !== 'all') {
      filtered = filtered.filter(report => report.reportType === filterReportType);
    }

    // 按状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter(report => report.status === filterStatus);
    }

    // 按财政年度筛选
    if (filterAuditYear !== 'all') {
      filtered = filtered.filter(report => report.auditYear === filterAuditYear);
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'generatedAt':
          aValue = new Date(a.generatedAt).getTime();
          bValue = new Date(b.generatedAt).getTime();
          break;
        case 'reportType':
          aValue = a.reportType;
          bValue = b.reportType;
          break;
        case 'reportName':
          aValue = a.reportName;
          bValue = b.reportName;
          break;
        case 'auditYear':
          aValue = a.auditYear;
          bValue = b.auditYear;
          break;
        default:
          aValue = a.generatedAt;
          bValue = b.generatedAt;
      }

      if (sortOrder === 'ascend') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [reports, searchText, filterReportType, filterStatus, filterAuditYear, sortField, sortOrder]);

  // 获取可用的财政年度列表
  const availableAuditYears = useMemo(() => {
    const years = [...new Set(reports.map(report => report.auditYear))].sort((a, b) => b - a);
    return years;
  }, [reports]);

  // 批量操作处理
  const handleBatchExport = async (format: 'pdf' | 'excel') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要导出的报告');
      return;
    }

    try {
      for (const reportId of selectedRowKeys) {
        await onExportReport(reportId as string, format);
      }
      message.success(`成功导出 ${selectedRowKeys.length} 个报告 (${format.toUpperCase()})`);
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('批量导出失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的报告');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 个报告吗？此操作不可撤销。`,
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 批量删除报告
          const deletePromises = selectedRowKeys.map(reportId => 
            financialReportService.deleteReport(reportId as string)
          );
          await Promise.all(deletePromises);
          
          message.success(`成功删除 ${selectedRowKeys.length} 个报告`);
          setSelectedRowKeys([]);
          // 通过回调函数更新报告列表，保持当前标签
          if (onRefreshReports) {
            onRefreshReports();
          }
        } catch (error) {
          console.error('批量删除失败:', error);
          message.error('批量删除失败');
        }
      },
    });
  };

  const handleRefresh = () => {
    if (onRefreshReports) {
      onRefreshReports();
      message.success('数据已刷新');
    }
  };

  // 计算报告统计图表数据
  const reportChartData = useMemo(() => {
    // 按月份统计报告生成数量
    const monthlyData = reports.reduce((acc, report) => {
      const month = dayjs(report.generatedAt).format('YYYY-MM');
      if (!acc[month]) {
        acc[month] = { completed: 0, generating: 0, failed: 0 };
      }
      acc[month][report.status as keyof typeof acc[typeof month]]++;
      return acc;
    }, {} as Record<string, { completed: number; generating: number; failed: number }>);

    const chartData = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        completed: data.completed,
        generating: data.generating,
        failed: data.failed,
        total: data.completed + data.generating + data.failed,
      }));

    return chartData;
  }, [reports]);

  // 按报告类型统计
  const reportTypeStats = useMemo(() => {
    const stats = reports.reduce((acc, report) => {
      if (!acc[report.reportType]) {
        acc[report.reportType] = 0;
      }
      acc[report.reportType]++;
      return acc;
    }, {} as Record<FinancialReportType, number>);

    return Object.entries(stats).map(([type, count]) => ({
      type: getReportTypeLabel(type as FinancialReportType),
      count,
      percentage: (count / reports.length) * 100,
    }));
  }, [reports]);

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
      sorter: true,
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
      sorter: true,
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
      sorter: true,
      render: (year: number) => (
        <Text>{year}</Text>
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      width: 150,
      sorter: true,
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
      width: 180,
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
          <Tooltip title="删除报告">
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDeleteReport(record.id, record.reportName)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'reports',
      label: '财务报告',
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

          {/* 报告生成区域 */}
          <Card title="生成财务报告" style={{ marginBottom: 24 }}>
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

          {/* 筛选和搜索工具栏 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col span={6}>
                <Input
                  placeholder="搜索报告名称或期间..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </Col>
              <Col span={4}>
                <Select
                  placeholder="报告类型"
                  value={filterReportType}
                  onChange={setFilterReportType}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="all">全部类型</Option>
                  {reportTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="状态"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="all">全部状态</Option>
                  <Option value="completed">已完成</Option>
                  <Option value="generating">生成中</Option>
                  <Option value="failed">失败</Option>
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="财政年度"
                  value={filterAuditYear}
                  onChange={setFilterAuditYear}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="all">全部年度</Option>
                  {availableAuditYears.map(year => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Space>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    title="刷新数据"
                  />
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'export-pdf',
                          label: '批量导出 PDF',
                          icon: <DownloadOutlined />,
                          onClick: () => handleBatchExport('pdf'),
                        },
                        {
                          key: 'export-excel',
                          label: '批量导出 Excel',
                          icon: <DownloadOutlined />,
                          onClick: () => handleBatchExport('excel'),
                        },
                        {
                          type: 'divider',
                        },
                        {
                          key: 'delete',
                          label: '批量删除',
                          icon: <DeleteOutlined />,
                          onClick: handleBatchDelete,
                          danger: true,
                        },
                      ],
                    }}
                    trigger={['click']}
                  >
                    <Button icon={<MoreOutlined />}>
                      批量操作 ({selectedRowKeys.length})
                    </Button>
                  </Dropdown>
                </Space>
              </Col>
            </Row>
          </Card>

          <Table
            columns={reportColumns}
            dataSource={filteredReports}
            loading={loading}
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
              getCheckboxProps: (record: FinancialReport) => ({
                disabled: record.status === 'generating',
              }),
            }}
            expandable={{
              expandedRowRender: (record: FinancialReport) => (
                <div style={{ margin: 0 }}>
                  {record.status === 'completed' && record.data ? (
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card size="small" title="财务概览">
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                              <Text type="secondary">总收入：</Text>
                              <Text strong style={{ color: '#52c41a' }}>
                                RM {(record.data.totalIncome || 0).toLocaleString('en-MY', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </Text>
                            </div>
                            <div>
                              <Text type="secondary">总支出：</Text>
                              <Text strong style={{ color: '#ff4d4f' }}>
                                RM {(record.data.totalExpense || 0).toLocaleString('en-MY', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </Text>
                            </div>
                            <div>
                              <Text type="secondary">净收入：</Text>
                              <Text strong style={{ 
                                color: (record.data.netIncome || 0) >= 0 ? '#52c41a' : '#ff4d4f' 
                              }}>
                                RM {(record.data.netIncome || 0).toLocaleString('en-MY', { 
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </Text>
                            </div>
                          </Space>
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" title="银行余额">
                          {record.data.bankBalances && record.data.bankBalances.length > 0 ? (
                            <Space direction="vertical" style={{ width: '100%' }}>
                              {record.data.bankBalances.slice(0, 3).map((balance, index) => (
                                <div key={index}>
                                  <Text type="secondary">{balance.accountName}：</Text>
                                  <Text strong style={{ 
                                    color: (balance.balance || 0) >= 0 ? '#52c41a' : '#ff4d4f' 
                                  }}>
                                    RM {(balance.balance || 0).toLocaleString('en-MY', { 
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    })}
                                  </Text>
                                </div>
                              ))}
                              {record.data.bankBalances.length > 3 && (
                                <Text type="secondary">
                                  还有 {record.data.bankBalances.length - 3} 个账户...
                                </Text>
                              )}
                            </Space>
                          ) : (
                            <Text type="secondary">暂无银行余额数据</Text>
                          )}
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card size="small" title="预算对比">
                          {record.data.budgetComparison && record.data.budgetComparison.length > 0 ? (
                            <Space direction="vertical" style={{ width: '100%' }}>
                              {record.data.budgetComparison.slice(0, 3).map((budget, index) => (
                                <div key={index}>
                                  <Text type="secondary">{budget.purposeName}：</Text>
                                  <Text strong style={{ 
                                    color: (budget.variance || 0) >= 0 ? '#52c41a' : '#ff4d4f' 
                                  }}>
                                    {(budget.variancePercentage || 0).toFixed(1)}%
                                  </Text>
                                </div>
                              ))}
                              {record.data.budgetComparison.length > 3 && (
                                <Text type="secondary">
                                  还有 {record.data.budgetComparison.length - 3} 个预算项目...
                                </Text>
                              )}
                            </Space>
                          ) : (
                            <Text type="secondary">暂无预算对比数据</Text>
                          )}
                        </Card>
                      </Col>
                    </Row>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Text type="secondary">
                        {record.status === 'generating' ? '报告生成中...' : 
                         record.status === 'failed' ? '报告生成失败' : '暂无报告数据'}
                      </Text>
                    </div>
                  )}
                </div>
              ),
              rowExpandable: (record: FinancialReport) => record.status === 'completed',
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            }}
            scroll={{ x: 1000 }}
            onChange={(_, __, sorter: any) => {
              if (sorter && sorter.field) {
                setSortField(sorter.field);
                setSortOrder(sorter.order);
              }
            }}
          />
        </div>
      ),
    },
    {
      key: 'analytics',
      label: '报告分析',
      children: (
        <div>
          {/* 报告生成趋势 */}
          <Card title="报告生成趋势" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={24}>
                {reportChartData.length > 0 ? (
                  <div style={{ height: 300, padding: '20px 0' }}>
                    {/* 这里可以集成图表库如 ECharts 或 Chart.js */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      height: '100%',
                      background: '#f5f5f5',
                      borderRadius: '8px',
                      border: '2px dashed #d9d9d9'
                    }}>
                      <Space direction="vertical" align="center">
                        <LineChartOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                        <Text type="secondary">报告生成趋势图表</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          最近 {reportChartData.length} 个月共生成 {reportChartData.reduce((sum, item) => sum + item.total, 0)} 个报告
                        </Text>
                      </Space>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: '#999'
                  }}>
                    <LineChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                    <div>暂无报告数据</div>
                  </div>
                )}
              </Col>
            </Row>
          </Card>

          {/* 报告类型分布 */}
          <Row gutter={16}>
            <Col span={12}>
              <Card title="报告类型分布" size="small">
                {reportTypeStats.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {reportTypeStats.map((stat, index) => (
                      <div key={index}>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Text>{stat.type}</Text>
                          </Col>
                          <Col>
                            <Space>
                              <Text strong>{stat.count}</Text>
                              <Text type="secondary">({stat.percentage.toFixed(1)}%)</Text>
                            </Space>
                          </Col>
                        </Row>
                        <Progress 
                          percent={stat.percentage} 
                          size="small" 
                          showInfo={false}
                          strokeColor="#1890ff"
                        />
                      </div>
                    ))}
                  </Space>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    暂无数据
                  </div>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="报告状态分布" size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          <Tag color="green">已完成</Tag>
                          <Text>{completedReports}</Text>
                        </Space>
                      </Col>
                      <Col>
                        <Text type="secondary">
                          ({totalReports > 0 ? ((completedReports / totalReports) * 100).toFixed(1) : 0}%)
                        </Text>
                      </Col>
                    </Row>
                    <Progress 
                      percent={totalReports > 0 ? (completedReports / totalReports) * 100 : 0} 
                      size="small" 
                      showInfo={false}
                      strokeColor="#52c41a"
                    />
                  </div>
                  <div>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          <Tag color="blue">生成中</Tag>
                          <Text>{generatingReports}</Text>
                        </Space>
                      </Col>
                      <Col>
                        <Text type="secondary">
                          ({totalReports > 0 ? ((generatingReports / totalReports) * 100).toFixed(1) : 0}%)
                        </Text>
                      </Col>
                    </Row>
                    <Progress 
                      percent={totalReports > 0 ? (generatingReports / totalReports) * 100 : 0} 
                      size="small" 
                      showInfo={false}
                      strokeColor="#1890ff"
                    />
                  </div>
                  <div>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Space>
                          <Tag color="red">失败</Tag>
                          <Text>{failedReports}</Text>
                        </Space>
                      </Col>
                      <Col>
                        <Text type="secondary">
                          ({totalReports > 0 ? ((failedReports / totalReports) * 100).toFixed(1) : 0}%)
                        </Text>
                      </Col>
                    </Row>
                    <Progress 
                      percent={totalReports > 0 ? (failedReports / totalReports) * 100 : 0} 
                      size="small" 
                      showInfo={false}
                      strokeColor="#ff4d4f"
                    />
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* 最近报告 */}
          <Card title="最近生成的报告" style={{ marginTop: 16 }}>
            <Table
              columns={[
                {
                  title: '报告名称',
                  dataIndex: 'reportName',
                  key: 'reportName',
                  render: (text: string) => (
                    <Space>
                      <FileTextOutlined />
                      <Text strong>{text}</Text>
                    </Space>
                  ),
                },
                {
                  title: '类型',
                  dataIndex: 'reportType',
                  key: 'reportType',
                  render: (type: FinancialReportType) => (
                    <Tag color="blue">{getReportTypeLabel(type)}</Tag>
                  ),
                },
                {
                  title: '生成时间',
                  dataIndex: 'generatedAt',
                  key: 'generatedAt',
                  render: (date: string) => dayjs(date).format('DD-MMM-YYYY HH:mm'),
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => (
                    <Tag color={getReportStatusColor(status)}>
                      {status === 'completed' ? '已完成' : 
                       status === 'generating' ? '生成中' : 
                       status === 'failed' ? '失败' : status}
                    </Tag>
                  ),
                },
              ]}
              dataSource={reports.slice(0, 5)}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
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

        <Tabs items={tabItems} />
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
                        valueStyle={{ color: viewingReport.data.netIncome >= 0 ? '#52c41a' : '#ff4d4f' }}
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
