import React from 'react';
import { Layout } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import EventForm from '@/modules/event/components/EventForm';

const { Content } = Layout;

const EventCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // 判断是否为编辑模式
  const isEditMode = !!id;

  const handleSuccess = (eventId: string) => {
    navigate(`/events/${eventId}`);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
        <EventForm
          eventId={id}
          mode={isEditMode ? 'edit' : 'create'}
          onSuccess={handleSuccess}
        />
      </Content>
    </Layout>
  );
};

export default EventCreatePage;
