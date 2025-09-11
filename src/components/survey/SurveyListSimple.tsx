import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const SurveyListSimple: React.FC = () => {
  return (
    <Card>
      <Title level={3}>问卷列表</Title>
      <p>问卷功能开发中...</p>
    </Card>
  );
};

export default SurveyListSimple;
