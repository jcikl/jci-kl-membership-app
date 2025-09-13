import React from 'react';
import { Card, Row, Col, Select, Button, Space, Typography, Tag } from 'antd';
import { CalendarOutlined, ReloadOutlined } from '@ant-design/icons';
import { DateFilter } from '@/hooks/useFinanceDateFilter';

const { Text } = Typography;
const { Option } = Select;

interface FinanceDateFilterProps {
  dateFilter: DateFilter;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number | null) => void;
  onReset: () => void;
  fiscalYear: number;
}

const FinanceDateFilter: React.FC<FinanceDateFilterProps> = ({
  dateFilter,
  onYearChange,
  onMonthChange,
  onReset,
  fiscalYear,
}) => {
  // 生成年份选项（当前年份前后5年）
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  // 月份选项
  const monthOptions = [
    { value: undefined, label: '全年' },
    { value: 1, label: '1月' },
    { value: 2, label: '2月' },
    { value: 3, label: '3月' },
    { value: 4, label: '4月' },
    { value: 5, label: '5月' },
    { value: 6, label: '6月' },
    { value: 7, label: '7月' },
    { value: 8, label: '8月' },
    { value: 9, label: '9月' },
    { value: 10, label: '10月' },
    { value: 11, label: '11月' },
    { value: 12, label: '12月' },
  ];

  return (
    <Card size="small" style={{ marginBottom: 16 }}>
      <Row align="middle" gutter={16}>
        <Col>
          <Space>
            <CalendarOutlined />
            <Text strong>财务数据筛选：</Text>
          </Space>
        </Col>
        <Col>
          <Space>
            <Text>财政年度：</Text>
            <Select
              value={dateFilter.year}
              onChange={onYearChange}
              style={{ width: 100 }}
              size="small"
            >
              {yearOptions.map(year => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col>
          <Space>
            <Text>月份：</Text>
            <Select
              value={dateFilter.month}
              onChange={onMonthChange}
              style={{ width: 80 }}
              size="small"
            >
              {monthOptions.map(month => (
                <Option key={month.value || 'all'} value={month.value}>
                  {month.label}
                </Option>
              ))}
            </Select>
          </Space>
        </Col>
        <Col>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={onReset}
          >
            重置
          </Button>
        </Col>
        <Col flex="auto">
          <Space>
            <Tag color="blue">
              当前筛选：{dateFilter.year}年
              {dateFilter.month ? ` ${dateFilter.month}月` : ' 全年'}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              筛选将应用于所有财务模块
            </Text>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default FinanceDateFilter;
