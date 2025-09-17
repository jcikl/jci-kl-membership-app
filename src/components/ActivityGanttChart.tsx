import React from 'react';
import { Card, Typography, Alert } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';

const { Title } = Typography;

const ActivityGanttChart: React.FC = () => {
  return (
    <Card>
      <Title level={4}>
        <BarChartOutlined style={{ marginRight: 8 }} />
        活动甘特图
      </Title>
      <Alert
        message="功能开发中"
        description="活动甘特图功能正在开发中，敬请期待。"
        type="info"
        showIcon
      />
    </Card>
  );
};

export default ActivityGanttChart;
