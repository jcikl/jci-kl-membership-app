import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Row,
  Col,
  Typography,
  Tag,
  Statistic,
  Modal,
  Descriptions,
  Alert,
  Badge,
  Tooltip,
  Checkbox,
  List,
  Avatar,
  Spin
} from 'antd';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CrownOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import {
  executeAllAutoRules,
  getRuleChangeLogs,
  getRuleStats,
  triggerRuleExecution,
  executeRuleForMembers,
  RuleExecutionResult,
  RuleChangeLog
} from '@/services/autoRulesService';
import { schedulerService } from '@/services/schedulerService';
import { getMembers } from '@/services/memberService';

const { Text } = Typography;

const AutoRulesManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [stats, setStats] = useState({
    totalRules: 0,
    activeRules: 0,
    totalChanges: 0,
    recentChanges: 0
  });
  const [changeLogs, setChangeLogs] = useState<RuleChangeLog[]>([]);
  const [executionResults, setExecutionResults] = useState<RuleExecutionResult[]>([]);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [showMemberSelectionModal, setShowMemberSelectionModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [affectedMembers, setAffectedMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState({
    isRunning: false,
    config: {
      enabled: true,
      interval: 24 * 60 * 60 * 1000,
      lastExecution: '',
      nextExecution: ''
    }
  });

  // 规则定义
  const rules = [
    {
      id: 'new_member_rule',
      name: '新用户准会员规则',
      description: '所有新用户默认为准会员',
      condition: '新用户注册时',
      action: '自动设置为准会员',
      isActive: true,
      priority: 1,
      icon: <UserOutlined style={{ color: '#1890ff' }} />
    },
    {
      id: 'senator_rule',
      name: '参议员编号规则',
      description: '拥有参议员编号的用户自动成为荣誉会员',
      condition: 'profile.senatorId 不为空',
      action: '自动设置为荣誉会员',
      isActive: true,
      priority: 2,
      icon: <CrownOutlined style={{ color: '#fa8c16' }} />
    },
    {
      id: 'age_rule',
      name: '年龄规则',
      description: '40岁以上用户自动成为联合会员',
      condition: '年龄 >= 40岁',
      action: '自动设置为联合会员',
      isActive: true,
      priority: 3,
      icon: <CalendarOutlined style={{ color: '#52c41a' }} />
    }
  ];

  // 加载统计数据
  const loadStats = async () => {
    try {
      const statsData = await getRuleStats();
      setStats(statsData);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  // 加载定时任务状态
  const loadSchedulerStatus = () => {
    const status = schedulerService.getStatus();
    setSchedulerStatus({
      isRunning: status.isRunning,
      config: {
        enabled: status.config.enabled,
        interval: status.config.interval,
        lastExecution: status.config.lastExecution || '',
        nextExecution: status.config.nextExecution || ''
      }
    });
  };

  // 加载变更日志
  const loadChangeLogs = async () => {
    try {
      const logs = await getRuleChangeLogs(20);
      setChangeLogs(logs);
    } catch (error) {
      console.error('加载变更日志失败:', error);
    }
  };

  // 执行所有规则
  const handleExecuteAllRules = async () => {
    setExecuting(true);
    try {
      const results = await executeAllAutoRules();
      setExecutionResults(results);
      setShowExecutionModal(true);
      
      // 重新加载数据
      await loadStats();
      await loadChangeLogs();
      
      message.success('规则执行完成');
    } catch (error) {
      console.error('执行规则失败:', error);
      message.error('执行规则失败');
    } finally {
      setExecuting(false);
    }
  };


  // 控制定时任务
  const handleToggleScheduler = () => {
    if (schedulerStatus.isRunning) {
      schedulerService.stop();
    } else {
      schedulerService.start();
    }
    loadSchedulerStatus();
    message.success(`定时任务已${schedulerStatus.isRunning ? '停止' : '启动'}`);
  };

  // 获取受影响的会员
  const getAffectedMembers = async (ruleId: string) => {
    setLoadingMembers(true);
    try {
      const allMembers = await getMembers({ page: 1, limit: 1000 });
      let filteredMembers: any[] = [];

      switch (ruleId) {
        case 'senator_rule':
          // 有参议员编号但不是荣誉会员的用户
          filteredMembers = allMembers.data.filter(member => 
            member.profile?.senatorId && 
            member.profile.senatorId !== '' && 
            (member as any).membershipCategory !== 'honorary'
          );
          break;
        case 'age_rule':
          // 40岁以上但不是联合会员的用户
          filteredMembers = allMembers.data.filter(member => {
            if (!member.profile?.birthDate) return false;
            const age = calculateAge(member.profile.birthDate);
            return age >= 40 && (member as any).membershipCategory !== 'affiliate';
          });
          break;
        default:
          filteredMembers = [];
      }

      setAffectedMembers(filteredMembers);
      setSelectedMembers(filteredMembers.map(member => member.id));
    } catch (error) {
      console.error('获取受影响会员失败:', error);
      message.error('获取受影响会员失败');
    } finally {
      setLoadingMembers(false);
    }
  };

  // 计算年龄
  const calculateAge = (birthDate: string): number => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  // 处理规则执行
  const handleExecuteRule = async (rule: any) => {
    setSelectedRule(rule);
    
    // 新用户规则不需要选择会员
    if (rule.id === 'new_member_rule') {
      await handleExecuteRuleDirect(rule.id);
      return;
    }

    // 获取受影响的会员
    await getAffectedMembers(rule.id);
    setShowMemberSelectionModal(true);
  };

  // 直接执行规则
  const handleExecuteRuleDirect = async (ruleId: string) => {
    setLoading(true);
    try {
      const result = await triggerRuleExecution(ruleId);
      setExecutionResults([result]);
      setShowExecutionModal(true);
      
      // 重新加载数据
      await loadStats();
      await loadChangeLogs();
      
      message.success('规则执行完成');
    } catch (error) {
      console.error('执行规则失败:', error);
      message.error('执行规则失败');
    } finally {
      setLoading(false);
    }
  };

  // 执行选中的会员
  const handleExecuteSelectedMembers = async () => {
    if (selectedMembers.length === 0) {
      message.warning('请选择要执行的会员');
      return;
    }

    setLoading(true);
    try {
      // 使用新的服务函数执行选中的会员
      const result = await executeRuleForMembers(selectedRule.id, selectedMembers);
      setExecutionResults([result]);
      setShowExecutionModal(true);
      setShowMemberSelectionModal(false);
      
      // 重新加载数据
      await loadStats();
      await loadChangeLogs();
      
      message.success(`已对 ${result.successCount} 个会员执行规则`);
    } catch (error) {
      console.error('执行规则失败:', error);
      message.error('执行规则失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadChangeLogs();
    loadSchedulerStatus();
  }, []);

  // 规则表格列定义
  const ruleColumns = [
    {
      title: '规则',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Space>
          {record.icon}
          <div>
            <div style={{ fontWeight: 'bold' }}>{name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{record.description}</div>
          </div>
        </Space>
      )
    },
    {
      title: '触发条件',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition: string) => (
        <Tag color="blue">{condition}</Tag>
      )
    },
    {
      title: '执行动作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color="green">{action}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Badge 
          status={isActive ? 'success' : 'default'} 
          text={isActive ? '启用' : '禁用'} 
        />
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: number) => (
        <Tag color="purple">P{priority}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleExecuteRule(record)}
            loading={loading}
          >
            执行
          </Button>
        </Space>
      )
    }
  ];

  // 变更日志表格列定义
  const logColumns = [
    {
      title: '时间',
      dataIndex: 'executedAt',
      key: 'executedAt',
      render: (time: string) => (
        <Text type="secondary">
          {new Date(time).toLocaleString()}
        </Text>
      )
    },
    {
      title: '会员',
      dataIndex: 'memberName',
      key: 'memberName',
      render: (name: string, record: RuleChangeLog) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>ID: {record.memberId}</div>
        </div>
      )
    },
    {
      title: '变更',
      key: 'change',
      render: (_: any, record: RuleChangeLog) => (
        <Space>
          <Tag color="red">{record.oldCategory}</Tag>
          <Text>→</Text>
          <Tag color="green">{record.newCategory}</Tag>
        </Space>
      )
    },
    {
      title: '规则',
      dataIndex: 'ruleName',
      key: 'ruleName',
      render: (ruleName: string) => (
        <Tag color="blue">{ruleName}</Tag>
      )
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason: string) => (
        <Tooltip title={reason}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {reason}
          </Text>
        </Tooltip>
      )
    }
  ];

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="总规则数"
              value={stats.totalRules}
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="启用规则"
              value={stats.activeRules}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="总变更次数"
              value={stats.totalChanges}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="最近7天变更"
              value={stats.recentChanges}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Statistic
              title="定时任务"
              value={schedulerStatus.isRunning ? '运行中' : '已停止'}
              prefix={schedulerStatus.isRunning ? <CheckCircleOutlined /> : <ExclamationCircleOutlined />}
              valueStyle={{ 
                color: schedulerStatus.isRunning ? '#52c41a' : '#ff4d4f',
                fontSize: '14px'
              }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card size="small">
            <Button
              type={schedulerStatus.isRunning ? 'default' : 'primary'}
              size="small"
              onClick={handleToggleScheduler}
              style={{ width: '100%' }}
            >
              {schedulerStatus.isRunning ? '停止定时任务' : '启动定时任务'}
            </Button>
          </Card>
        </Col>
      </Row>

      {/* 规则管理 */}
      <Card title="自动化规则管理" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleExecuteAllRules}
              loading={executing}
            >
              执行所有规则
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                loadStats();
                loadChangeLogs();
              }}
            >
              刷新
            </Button>
          </Space>
        </div>

        <Table
          columns={ruleColumns}
          dataSource={rules}
          pagination={false}
          size="small"
          bordered
        />
      </Card>

      {/* 变更日志 */}
      <Card title="规则变更日志">
        <Table
          columns={logColumns}
          dataSource={changeLogs}
          pagination={{ pageSize: 10 }}
          size="small"
          bordered
          rowKey="id"
        />
      </Card>

      {/* 会员选择模态框 */}
      <Modal
        title={`选择要执行 ${selectedRule?.name} 的会员`}
        open={showMemberSelectionModal}
        onCancel={() => setShowMemberSelectionModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowMemberSelectionModal(false)}>
            取消
          </Button>,
          <Button 
            key="selectAll" 
            onClick={() => setSelectedMembers(affectedMembers.map(member => member.id))}
          >
            全选
          </Button>,
          <Button 
            key="selectNone" 
            onClick={() => setSelectedMembers([])}
          >
            全不选
          </Button>,
          <Button 
            key="execute" 
            type="primary" 
            onClick={handleExecuteSelectedMembers}
            loading={loading}
          >
            执行选中 ({selectedMembers.length})
          </Button>
        ]}
        width={1000}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            找到 {affectedMembers.length} 个符合条件的会员，请选择要执行规则的会员：
          </Text>
        </div>

        <Spin spinning={loadingMembers}>
          <List
            dataSource={affectedMembers}
            renderItem={(member) => (
              <List.Item
                key={member.id}
                actions={[
                  <Checkbox
                    key="checkbox"
                    checked={selectedMembers.includes(member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMembers([...selectedMembers, member.id]);
                      } else {
                        setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                      }
                    }}
                  />
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      src={member.profile?.profilePhotoUrl} 
                      icon={<UserOutlined />}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>{member.name}</Text>
                      <Tag color="blue">{member.memberId}</Tag>
                      <Tag color="orange">{member.membershipCategory || '未分类'}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>邮箱: {member.email}</div>
                      <div>手机: {member.phone}</div>
                      {selectedRule?.id === 'senator_rule' && member.profile?.senatorId && (
                        <div>参议员编号: {member.profile.senatorId}</div>
                      )}
                      {selectedRule?.id === 'age_rule' && member.profile?.birthDate && (
                        <div>
                          出生日期: {member.profile.birthDate} 
                          (年龄: {calculateAge(member.profile.birthDate)} 岁)
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Spin>
      </Modal>

      {/* 执行结果模态框 */}
      <Modal
        title="规则执行结果"
        open={showExecutionModal}
        onCancel={() => setShowExecutionModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowExecutionModal(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        {executionResults.map((result, index) => (
          <Card key={index} size="small" style={{ marginBottom: 16 }}>
            <Descriptions title={result.ruleName} size="small" column={2}>
              <Descriptions.Item label="规则ID">{result.ruleId}</Descriptions.Item>
              <Descriptions.Item label="执行时间">
                {new Date(result.executedAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="影响会员数">{result.affectedMembers}</Descriptions.Item>
              <Descriptions.Item label="成功数">{result.successCount}</Descriptions.Item>
              <Descriptions.Item label="失败数">{result.failedCount}</Descriptions.Item>
            </Descriptions>

            {result.errors.length > 0 && (
              <Alert
                message="执行错误"
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    {result.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                }
                type="error"
                style={{ marginTop: 16 }}
              />
            )}
          </Card>
        ))}
      </Modal>
    </div>
  );
};

export default AutoRulesManagement;
