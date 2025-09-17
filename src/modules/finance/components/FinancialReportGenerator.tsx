import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Select,
  // DatePicker, // Unused for now
  Table,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Modal,
  Form,
  InputNumber,
  Divider,
  Tag,
  Tooltip,
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { financialReportService, FiscalYearCalculator } from '@/modules/finance/services/financialReportService';
import { FinancialReport, FinancialReportType, FinancialReportData } from '@/types/finance';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

interface FinancialReportGeneratorProps {
  visible: boolean;
  onCancel: () => void;
}

const FinancialReportGenerator: React.FC<FinancialReportGeneratorProps> = ({
  visible,
  onCancel,
}) => {
  // 使用当前年份作为默认财政年度
  const fiscalYear = new Date().getFullYear();
  const fiscalYearStartMonth = 1;
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<FinancialReportType>('income_statement');
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number>(fiscalYear);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [fiscalCalculator] = useState(() => new FiscalYearCalculator(fiscalYearStartMonth));

  // 报表类型选项
  const reportTypeOptions: { value: FinancialReportType; label: string; description: string }[] = [
    {
      value: 'income_statement',
      label: '损益表',
      description: '显示财政年度内的收入和支出情况'
    },
    {
      value: 'balance_sheet',
      label: '资产负债表',
      description: '显示期初余额、期间收支和期末余额'
    },
    {
      value: 'cash_flow',
      label: '现金流量表',
      description: '显示财政年度内的现金流入和流出'
    },
    {
      value: 'monthly_summary',
      label: '月度收支报告',
      description: '按月份显示收支情况'
    },
    {
      value: 'project_summary',
      label: '项目收支报告',
      description: '按项目显示收支和预算情况'
    },
    {
      value: 'bank_reconciliation',
      label: '银行对账单',
      description: '各银行户口的对账情况'
    }
  ];

  // 加载已生成的报表
  const loadReports = async () => {
    try {
      const reportsData = await financialReportService.getReportsByFiscalYear(selectedFiscalYear);
      setReports(reportsData);
    } catch (error) {
      console.error('加载报表失败:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      loadReports();
      setSelectedFiscalYear(fiscalYear);
    }
  }, [visible, fiscalYear]);

  // 生成报表
  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      setReportData(null);

      const reportId = await financialReportService.generateReport(
        selectedReportType,
        selectedFiscalYear,
        user?.uid || 'unknown-user',
        fiscalYearStartMonth
      );

      message.success('报表生成成功');
      
      // 重新加载报表列表
      await loadReports();
      
      // 获取刚生成的报表数据用于预览
      const newReport = reports.find(r => r.id === reportId) || 
        (await financialReportService.getReports()).find(r => r.id === reportId);
      
      if (newReport) {
        setReportData(newReport.data);
      }
    } catch (error) {
      console.error('生成报表失败:', error);
      message.error('生成报表失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出报表
  const handleExportReport = (report: FinancialReport) => {
    try {
      const content = financialReportService.exportReportToCSV(report.data);
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${report.reportName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('报表导出成功');
    } catch (error) {
      console.error('导出报表失败:', error);
      message.error('导出报表失败');
    }
  };

  // 预览报表
  const handlePreviewReport = (report: FinancialReport) => {
    setReportData(report.data);
    setSelectedReportType(report.reportType);
  };

  // 获取财政年度期间显示
  const getFiscalYearPeriod = (year: number) => {
    const startDate = fiscalCalculator.getFiscalYearStartDate(year);
    const endDate = fiscalCalculator.getFiscalYearEndDate(year);
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
  };

  // 渲染报表摘要
  const renderReportSummary = () => {
    if (!reportData) return null;

    const { summary } = reportData;
    if (!summary) return null;
    const summaryItems = Object.entries(summary).map(([key, value]) => ({
      key,
      value: typeof value === 'number' ? value.toLocaleString() : value,
      label: getSummaryLabel(key)
    }));

    return (
      <Row gutter={16}>
        {summaryItems.map((item, index) => (
          <Col span={6} key={index}>
            <Card size="small">
              <Statistic
                title={item.label}
                value={item.value as any}
                valueStyle={{ fontSize: '16px' }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // 获取摘要标签
  const getSummaryLabel = (key: string): string => {
    const labels: Record<string, string> = {
      totalIncome: '总收入',
      totalExpense: '总支出',
      netIncome: '净收入',
      openingBalance: '期初余额',
      closingBalance: '期末余额',
      periodIncome: '期间收入',
      periodExpense: '期间支出',
      periodNetChange: '期间净变化',
      operatingCashFlow: '经营现金流',
      totalCashInflow: '总现金流入',
      totalCashOutflow: '总现金流出',
      netCashFlow: '净现金流',
      totalProjects: '项目总数',
      totalBudget: '总预算',
      totalSpent: '总支出',
      totalRemaining: '剩余预算',
      totalAccounts: '账户总数',
      totalOpeningBalance: '总期初余额',
      totalClosingBalance: '总期末余额',
      totalNetChange: '总净变化',
      transactionCount: '交易笔数',
      averageMonthlyIncome: '月均收入',
      averageMonthlyExpense: '月均支出'
    };
    return labels[key] || key;
  };

  // 渲染报表详情
  const renderReportDetails = () => {
    if (!reportData) return null;

    const { details } = reportData;
    if (!details) return null;

    switch (reportData.reportType) {
      case 'income_statement':
        return (
          <div>
            <Title level={4}>收入明细</Title>
            <Table
              size="small"
              dataSource={Object.entries(details.income || {}).map(([category, amount]) => ({
                key: category,
                category,
                amount: amount as number
              }))}
              columns={[
                { title: '类别', dataIndex: 'category', key: 'category' },
                { 
                  title: '金额', 
                  dataIndex: 'amount', 
                  key: 'amount',
                  render: (value: number) => `RM ${value.toLocaleString()}`
                }
              ]}
              pagination={false}
            />
            
            <Title level={4} style={{ marginTop: 24 }}>支出明细</Title>
            <Table
              size="small"
              dataSource={Object.entries(details.expense || {}).map(([category, amount]) => ({
                key: category,
                category,
                amount: amount as number
              }))}
              columns={[
                { title: '类别', dataIndex: 'category', key: 'category' },
                { 
                  title: '金额', 
                  dataIndex: 'amount', 
                  key: 'amount',
                  render: (value: number) => `RM ${value.toLocaleString()}`
                }
              ]}
              pagination={false}
            />
          </div>
        );

      case 'monthly_summary':
        return (
          <div>
            <Title level={4}>月度收支明细</Title>
            <Table
              size="small"
              dataSource={Object.entries(details.monthlyData || {}).map(([month, data]) => ({
                key: month,
                month,
                ...(typeof data === 'object' && data !== null ? data : {})
              }))}
              columns={[
                { title: '月份', dataIndex: 'month', key: 'month' },
                { 
                  title: '收入', 
                  dataIndex: 'income', 
                  key: 'income',
                  render: (value: number) => `RM ${value.toLocaleString()}`
                },
                { 
                  title: '支出', 
                  dataIndex: 'expense', 
                  key: 'expense',
                  render: (value: number) => `RM ${value.toLocaleString()}`
                },
                { 
                  title: '净收入', 
                  dataIndex: 'netIncome', 
                  key: 'netIncome',
                  render: (value: number) => (
                    <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      {value.toLocaleString()}
                    </Text>
                  )
                },
                { 
                  title: '交易笔数', 
                  dataIndex: 'transactionCount', 
                  key: 'transactionCount'
                }
              ]}
              pagination={false}
            />
          </div>
        );

      case 'project_summary':
        return (
          <div>
            <Title level={4}>项目收支明细</Title>
            <Table
              size="small"
              dataSource={Object.entries((details as any).projectData || {}).map(([project, data]) => ({
                key: project,
                project,
                ...(typeof data === 'object' && data !== null ? data : {})
              }))}
              columns={[
                { title: '项目', dataIndex: 'project', key: 'project' },
                { 
                  title: '收入', 
                  dataIndex: 'income', 
                  key: 'income',
                  render: (value: number) => `RM ${value.toLocaleString()}`
                },
                { 
                  title: '支出', 
                  dataIndex: 'expense', 
                  key: 'expense',
                  render: (value: number) => `RM ${value.toLocaleString()}`
                },
                { 
                  title: '净收入', 
                  dataIndex: 'netIncome', 
                  key: 'netIncome',
                  render: (value: number) => (
                    <Text style={{ color: value >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      {value.toLocaleString()}
                    </Text>
                  )
                },
                { 
                  title: '交易笔数', 
                  dataIndex: 'transactionCount', 
                  key: 'transactionCount'
                }
              ]}
              pagination={false}
            />
          </div>
        );

      default:
        return <Text>暂无详细数据</Text>;
    }
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          财务报表生成器
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1200}
      destroyOnHidden
      footer={null}
    >
      <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <Row gutter={24}>
          {/* 左侧：报表生成 */}
          <Col span={12}>
            <Card title="生成新报表" size="small">
              <Form form={form} layout="vertical">
                <Form.Item label="报表类型" required>
                  <Select
                    value={selectedReportType}
                    onChange={setSelectedReportType}
                    placeholder="选择报表类型"
                  >
                    {reportTypeOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        <div>
                          <div>{option.label}</div>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {option.description}
                          </Text>
                        </div>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item label="财政年度" required>
                  <InputNumber
                    value={selectedFiscalYear}
                    onChange={(value) => setSelectedFiscalYear(value || fiscalYear)}
                    min={2020}
                    max={2030}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item label="财政年度期间">
                  <Text type="secondary">
                    {getFiscalYearPeriod(selectedFiscalYear)}
                  </Text>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    onClick={handleGenerateReport}
                    loading={loading}
                    block
                  >
                    生成报表
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* 已生成的报表列表 */}
            <Card title="已生成的报表" size="small" style={{ marginTop: 16 }}>
              <Table
                size="small"
                dataSource={reports}
                columns={[
                  {
                    title: '报表名称',
                    dataIndex: 'reportName',
                    key: 'reportName',
                    render: (text: string, record: FinancialReport) => (
                      <Space>
                        <Text>{text}</Text>
                        <Tag color="blue">{reportTypeOptions.find(opt => opt.value === record.reportType)?.label}</Tag>
                      </Space>
                    )
                  },
                  {
                    title: '生成时间',
                    dataIndex: 'generatedAt',
                    key: 'generatedAt',
                    render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
                  },
                  {
                    title: '操作',
                    key: 'actions',
                    render: (_, record: FinancialReport) => (
                      <Space size="small">
                        <Tooltip title="预览">
                          <Button
                            size="small"
                            icon={<BarChartOutlined />}
                            onClick={() => handlePreviewReport(record)}
                          />
                        </Tooltip>
                        <Tooltip title="导出CSV">
                          <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={() => handleExportReport(record)}
                          />
                        </Tooltip>
                      </Space>
                    )
                  }
                ]}
                pagination={{ pageSize: 5 }}
              />
            </Card>
          </Col>

          {/* 右侧：报表预览 */}
          <Col span={12}>
            <Card title="报表预览" size="small">
              {reportData ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <Title level={4}>
                      {reportTypeOptions.find(opt => opt.value === reportData.reportType)?.label}
                    </Title>
                    <Text type="secondary">
                      {reportData.period ? getFiscalYearPeriod((reportData.period as any).fiscalYear) : '未知期间'}
                    </Text>
                  </div>

                  <Divider />

                  {renderReportSummary()}

                  <Divider />

                  {renderReportDetails()}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
                  <div style={{ marginTop: 16 }}>
                    <Text type="secondary">请生成或选择报表进行预览</Text>
                  </div>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default FinancialReportGenerator;
