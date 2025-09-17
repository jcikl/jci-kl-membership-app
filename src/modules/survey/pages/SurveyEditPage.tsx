import React from 'react';
import { Card, Typography } from 'antd';
import SurveyForm from '@/modules/survey/components/survey/SurveyForm';

const { Title } = Typography;

const SurveyEditPage: React.FC = () => {
  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={2}>编辑问卷</Title>
      </Card>
      
      <SurveyForm mode="edit" />
    </div>
  );
};

export default SurveyEditPage;
