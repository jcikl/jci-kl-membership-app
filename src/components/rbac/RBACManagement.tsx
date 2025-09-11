import React, { useState } from 'react';
import { Tabs, Card } from 'antd';
import PermissionMatrix from './PermissionMatrix';
import PermissionMatrixChart from './PermissionMatrixChart';
import AutoRulesManagement from './AutoRulesManagement';
import RBACAudit from './RBACAudit';
import PositionManagement from './PositionManagement';
import CategoryManagement from './CategoryManagement';

const { TabPane } = Tabs;

const RBACManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('jci-matrix');

  return (
    <div>
      <Card>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          type="card"
        >
          <TabPane tab="JCI权限矩阵" key="jci-matrix">
            <PermissionMatrix />
          </TabPane>
          <TabPane tab="权限矩阵图表" key="matrix-chart">
            <PermissionMatrixChart />
          </TabPane>
          <TabPane tab="自动化规则" key="auto-rules">
            <AutoRulesManagement />
          </TabPane>
          <TabPane tab="审计日志" key="audit">
            <RBACAudit />
          </TabPane>
          <TabPane tab="职位管理" key="positions">
            <PositionManagement />
          </TabPane>
          <TabPane tab="分类管理" key="categories">
            <CategoryManagement />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default RBACManagement;
