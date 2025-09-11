import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import PermissionMatrix from './PermissionMatrix';
import PermissionMatrixChart from './PermissionMatrixChart';
import RBACAudit from './RBACAudit';
import PositionManagement from './PositionManagement';
import CategoryManagement from './CategoryManagement';


const RBACManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('jci-matrix');

  return (
    <div>
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
          items={[
            {
              key: 'jci-matrix',
              label: 'JCI权限矩阵',
              children: <PermissionMatrix />
            },
            {
              key: 'matrix-chart',
              label: '权限矩阵图表',
              children: <PermissionMatrixChart />
            },
            {
              key: 'audit',
              label: '审计日志',
              children: <RBACAudit />
            },
            {
              key: 'positions',
              label: '职位管理',
              children: <PositionManagement />
            },
            {
              key: 'categories',
              label: '分类管理',
              children: <CategoryManagement />
            }
          ]}
        />
      </Card>
    </div>
  );
};

export default RBACManagement;
