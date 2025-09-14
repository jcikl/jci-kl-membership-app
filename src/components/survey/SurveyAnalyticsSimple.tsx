import React from 'react';
import { Card, Typography, Alert } from 'antd';

const { Title } = Typography;

interface SurveyAnalyticsSimpleProps {
  surveyId: string;
}

const SurveyAnalyticsSimple: React.FC<SurveyAnalyticsSimpleProps> = ({ surveyId }) => {
  return (
    <Card>
      <Title level={3}>问卷分析</Title>
      <Alert
        message="分析功能开发中"
        description={`问卷 ID: ${surveyId}`}
        type="info"
        showIcon
      />
    </Card>
  );
};

export default SurveyAnalyticsSimple;
