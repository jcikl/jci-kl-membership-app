import React from 'react';
import { Card, List, Tag, Space, Typography, Alert, Spin } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { useAccountType } from '@/hooks/useMemberCategory';
import { getAllMembershipTaskPolicies, MembershipTaskPolicy, TaskRequirement } from '@/modules/member/services/membershipTaskPolicyService';
import { useAuthStore } from '@/store/authStore';

const { Title, Text } = Typography;

const UserTasksDisplay: React.FC = () => {
  const { member } = useAuthStore();
  const { accountType, membershipCategory, loading: categoryLoading } = useAccountType(member?.id);
  const [policies, setPolicies] = React.useState<MembershipTaskPolicy[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadPolicies = React.useCallback(async () => {
    try {
      setLoading(true);
      const allPolicies = await getAllMembershipTaskPolicies();
      setPolicies(allPolicies);
    } catch (error) {
      console.error('加载任务策略失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPolicies();
  }, [loadPolicies]);

  // Find applicable policies based on user's account type and membership category
  const applicablePolicies = React.useMemo(() => {
    if (!accountType || !membershipCategory) return [];
    
    return policies.filter(policy => {
      if (!policy.isEnabled) return false;
      
      if (policy.target.type === 'accountType') {
        return policy.target.values.includes(accountType);
      } else if (policy.target.type === 'membershipCategory') {
        return policy.target.values.includes(membershipCategory);
      }
      return false;
    });
  }, [policies, accountType, membershipCategory]);

  const renderTaskRequirement = (requirement: TaskRequirement, index: number) => {
    const getTaskIcon = () => {
      switch (requirement.type) {
        case 'event_participation':
          return '🎯';
        case 'course_completion':
          return '📚';
        case 'committee_role':
          return '👥';
        default:
          return '📋';
      }
    };

    const getTaskDescription = () => {
      switch (requirement.type) {
        case 'event_participation':
          if (requirement.anyType) {
            return `参加任意类型活动至少 ${requirement.minCount} 次`;
          } else {
            return `参加指定类型活动（${requirement.specificTypes || '待指定'}）至少 ${requirement.minCount} 次`;
          }
        case 'course_completion':
          if (requirement.anyType) {
            return `参加任意类型课程至少 ${requirement.minCount} 次`;
          } else {
            return `参加指定类型课程（${requirement.specificTypes || '待指定'}）至少 ${requirement.minCount} 次`;
          }
        case 'committee_role':
          return `至少担任 ${requirement.minCount} 次活动筹委/主席`;
        default:
          return '未知任务类型';
      }
    };

    return (
      <List.Item key={index}>
        <Space>
          <span style={{ fontSize: '16px' }}>{getTaskIcon()}</span>
          <Text>{getTaskDescription()}</Text>
          <Tag color="blue">任务 {index + 1}</Tag>
        </Space>
      </List.Item>
    );
  };

  if (categoryLoading || loading) {
    return (
      <Card title="我的任务">
        <Spin size="large" style={{ display: 'block', textAlign: 'center', padding: '40px' }} />
      </Card>
    );
  }

  if (!member) {
    return (
      <Card title="我的任务">
        <Alert type="warning" message="请先登录" />
      </Card>
    );
  }

  if (applicablePolicies.length === 0) {
    return (
      <Card title="我的任务">
        <Alert 
          type="info" 
          message="暂无任务要求" 
          description={`当前户口类别：${accountType || '未知'}，会员类别：${membershipCategory || '未知'}。没有匹配的任务策略。`}
        />
      </Card>
    );
  }

  return (
    <div>
      {applicablePolicies.map((policy) => (
        <Card 
          key={policy.id} 
          title={
            <Space>
              <Title level={4} style={{ margin: 0 }}>{policy.name}</Title>
              <Tag color={policy.isEnabled ? 'green' : 'red'}>
                {policy.isEnabled ? '启用' : '禁用'}
              </Tag>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          {policy.description && (
            <Alert 
              type="info" 
              message={policy.description} 
              style={{ marginBottom: 16 }}
              showIcon
            />
          )}
          
          <div style={{ marginBottom: 8 }}>
            <Text strong>适用对象：</Text>
            <Tag color="blue">
              {policy.target.type === 'accountType' ? '户口类别' : '会员类别'}
            </Tag>
            <Text code>{policy.target.values.join(', ')}</Text>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong>任务要求：</Text>
            <List
              size="small"
              dataSource={policy.requirements}
              renderItem={renderTaskRequirement}
            />
          </div>

          <Alert
            type="success"
            message="完成提示"
            description="完成以上所有任务后，您将符合晋升为正式会员的条件。"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        </Card>
      ))}
    </div>
  );
};

export default UserTasksDisplay;
