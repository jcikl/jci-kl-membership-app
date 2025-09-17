import React from 'react';
import { Layout } from 'antd';
import { useParams } from 'react-router-dom';
import EventRegistrationForm from '@/modules/event/components/EventRegistrationForm';

const { Content } = Layout;

const EventRegistrationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>活动ID不存在</div>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
        <EventRegistrationForm eventId={id} />
      </Content>
    </Layout>
  );
};

export default EventRegistrationPage;
