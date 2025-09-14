import React from 'react';
import { Spin, Typography } from 'antd';

const { Text } = Typography;

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-container">
      <Spin size="large" />
      <Text className="loading-text">加载中...</Text>
    </div>
  );
};

export default LoadingSpinner;
