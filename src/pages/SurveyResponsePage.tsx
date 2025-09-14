import React from 'react';
import { Card, Typography } from 'antd';
import SurveyResponseForm from '@/components/survey/SurveyResponseForm';

const { Title } = Typography;

const SurveyResponsePage: React.FC = () => {
  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={2}>填写问卷</Title>
      </Card>
      
      <SurveyResponseForm />
    </div>
  );
};

export default SurveyResponsePage;
