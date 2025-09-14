import React from 'react';
import { Typography, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ResponsiblePersonDisplayProps {
  responsiblePerson?: string;
  showIcon?: boolean;
  style?: React.CSSProperties;
}

const ResponsiblePersonDisplay: React.FC<ResponsiblePersonDisplayProps> = ({
  responsiblePerson,
  showIcon = false,
  style
}) => {
  if (!responsiblePerson) {
    return (
      <Text type="secondary" style={style}>
        {showIcon && <UserOutlined style={{ marginRight: 4 }} />}
        -
      </Text>
    );
  }

  return (
    <Tag 
      icon={showIcon ? <UserOutlined /> : undefined}
      style={{ 
        margin: 0,
        ...style 
      }}
    >
      {responsiblePerson}
    </Tag>
  );
};

export default ResponsiblePersonDisplay;
