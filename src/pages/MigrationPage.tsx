import React from 'react';
import { Card, Typography } from 'antd';
import MigrationManagement from '@/components/MigrationManagement';

const { Title, Paragraph } = Typography;

const MigrationPage: React.FC = () => {
  const handleMigrationComplete = () => {
    // 迁移完成后的处理
    console.log('数据迁移完成');
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={1}>数据迁移</Title>
        <Paragraph>
          此页面用于将现有奖励指标管理系统的数据迁移到新的统一系统中。
          迁移过程包括数据转换、验证和完整性检查。
        </Paragraph>
        
        <MigrationManagement onMigrationComplete={handleMigrationComplete} />
      </Card>
    </div>
  );
};

export default MigrationPage;
