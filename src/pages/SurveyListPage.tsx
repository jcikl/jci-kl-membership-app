import React from 'react';
import { Card, Typography } from 'antd';
import SurveyListSimple from '@/components/survey/SurveyListSimple';

const { Title } = Typography;

const SurveyListPage: React.FC = () => {
  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={2}>问卷管理</Title>
      </Card>
      
      <SurveyListSimple />
    </div>
  );
};

export default SurveyListPage;
