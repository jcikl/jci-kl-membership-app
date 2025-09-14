import React from 'react';
import { Layout } from 'antd';
import { useParams } from 'react-router-dom';
import EventDetail from '@/components/EventDetail';

const { Content } = Layout;

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>活动ID不存在</div>;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
        <EventDetail eventId={id} mode="admin" />
      </Content>
    </Layout>
  );
};

export default EventDetailPage;
