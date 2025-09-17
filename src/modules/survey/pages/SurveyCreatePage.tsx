import React from 'react';
import { Card, Typography } from 'antd';
import SurveyForm from '@/modules/survey/components/survey/SurveyForm';

const { Title } = Typography;

const SurveyCreatePage: React.FC = () => {
  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Title level={2}>创建问卷</Title>
      </Card>
      
      <SurveyForm mode="create" />
    </div>
  );
};

export default SurveyCreatePage;
