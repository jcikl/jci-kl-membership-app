import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Button,
  message
} from 'antd';
import { SearchOutlined, ReloadOutlined, ExportOutlined } from '@ant-design/icons';
import { auditService } from '@/services/rbacService';
import { RBACAuditLog } from '@/types/rbac';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const RBACAudit: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<RBACAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    dateRange: null as any,
    searchText: ''
  });

  // 加载审计日志
  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await auditService.getAuditLogs(100);
      setAuditLogs(data);
    } catch (error) {
      message.error('加载审计日志失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    loadAuditLogs();
  };

  // 处理重置
  const handleReset = () => {
    setFilters({
      action: '',
      targetType: '',
      dateRange: null,
      searchText: ''
    });
    loadAuditLogs();
  };

  // 处理导出
  const handleExport = () => {
    // 实现导出功能
    message.info('导出功能开发中...');
  };

  // 过滤日志
  const filteredLogs = auditLogs.filter(log => {
    if (filters.action && !log.action.toLowerCase().includes(filters.action.toLowerCase())) {
      return false;
    }
    if (filters.targetType && log.targetType !== filters.targetType) {
      return false;
    }
    if (filters.searchText && !log.targetId.toLowerCase().includes(filters.searchText.toLowerCase())) {
      return false;
    }
    if (filters.dateRange) {
      const logDate = new Date(log.timestamp);
      const [start, end] = filters.dateRange;
      if (logDate < start || logDate > end) {
        return false;
      }
    }
    return true;
  });

  const columns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作者',
      dataIndex: 'actorId',
      key: 'actorId',
      width: 120,
      render: (text: string) => <code>{text}</code>
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => {
        const colorMap: Record<string, string> = {
          'create': 'green',
          'update': 'blue',
          'delete': 'red',
          'assign': 'orange',
          'revoke': 'purple'
        };
        return <Tag color={colorMap[action] || 'default'}>{action}</Tag>;
      }
    },
    {
      title: '目标类型',
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          'user': 'blue',
          'role': 'green',
          'permission': 'orange',
          'binding': 'purple'
        };
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>;
      }
    },
    {
      title: '目标ID',
      dataIndex: 'targetId',
      key: 'targetId',
      width: 150,
      render: (text: string) => <code>{text}</code>
    },
    {
      title: '变更内容',
      dataIndex: 'changes',
      key: 'changes',
      ellipsis: true,
      render: (changes: Record<string, any>) => (
        <div style={{ maxWidth: 300 }}>
          {Object.entries(changes).map(([key, value]) => (
            <div key={key} style={{ fontSize: '12px' }}>
              <Text strong>{key}:</Text> {JSON.stringify(value)}
            </div>
          ))}
        </div>
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 120,
      render: (text: string) => text || '-'
    }
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              审计日志
            </Title>
          </Col>
          <Col>
            <Space>
              <Button icon={<ExportOutlined />} onClick={handleExport}>
                导出
              </Button>
              <Button icon={<ReloadOutlined />} onClick={loadAuditLogs}>
                刷新
              </Button>
            </Space>
          </Col>
        </Row>

        {/* 筛选器 */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Input
                placeholder="搜索目标ID..."
                value={filters.searchText}
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="操作类型"
                value={filters.action}
                onChange={(value) => setFilters({ ...filters, action: value })}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="create">创建</Option>
                <Option value="update">更新</Option>
                <Option value="delete">删除</Option>
                <Option value="assign">分配</Option>
                <Option value="revoke">撤销</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="目标类型"
                value={filters.targetType}
                onChange={(value) => setFilters({ ...filters, targetType: value })}
                allowClear
                style={{ width: '100%' }}
              >
                <Option value="user">用户</Option>
                <Option value="role">角色</Option>
                <Option value="permission">权限</Option>
                <Option value="binding">绑定</Option>
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Space>
                <Button type="primary" onClick={handleSearch}>
                  搜索
                </Button>
                <Button onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        <Table
          columns={columns}
          dataSource={filteredLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default RBACAudit;
