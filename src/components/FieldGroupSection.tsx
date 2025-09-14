import React from 'react';
import { Card, Typography, Divider } from 'antd';
import { FieldGroup } from '@/types/profileFields';

const { Title } = Typography;

interface FieldGroupSectionProps {
  group: FieldGroup;
  children: React.ReactNode;
  showTitle?: boolean;
  showDivider?: boolean;
  cardProps?: any;
}

const FieldGroupSection: React.FC<FieldGroupSectionProps> = ({
  group,
  children,
  showTitle = true,
  showDivider = false,
  cardProps = {}
}) => {
  return (
    <div>
      {showTitle && (
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, color: '#1890ff' }}>
            {group.label}
          </Title>
          {group.description && (
            <div style={{ color: '#666', fontSize: '12px', marginTop: 4 }}>
              {group.description}
            </div>
          )}
        </div>
      )}
      
      <Card 
        size="small" 
        style={{ marginBottom: 16 }}
        styles={{ body: { padding: '16px' } }}
        {...cardProps}
      >
        {children}
      </Card>
      
      {showDivider && <Divider />}
    </div>
  );
};

export default FieldGroupSection;
