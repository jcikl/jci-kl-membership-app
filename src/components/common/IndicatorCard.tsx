import React from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Popconfirm,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { AwardIndicator, Indicator } from '@/types/awardIndicators';

const { Text } = Typography;

interface IndicatorCardProps {
  awardIndicator: AwardIndicator;
  onEditIndicator: (indicator: Indicator) => void;
  onDeleteIndicator: (indicatorId: string) => void;
  onAddIndicator: (categoryId: string) => void;
  onViewIndicator: (indicator: Indicator) => void;
}

const IndicatorCard: React.FC<IndicatorCardProps> = ({
  awardIndicator,
  onEditIndicator,
  onDeleteIndicator,
  onAddIndicator,
  onViewIndicator
}) => {
  // 获取状态标签颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'processing';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'pending':
        return '进行中';
      case 'overdue':
        return '已逾期';
      default:
        return status;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '序号',
      dataIndex: 'no',
      key: 'no',
      width: 60,
      align: 'center' as const
    },
    {
      title: '指标标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string) => (
        <Tooltip title={title}>
          <Text strong>{title}</Text>
        </Tooltip>
      )
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      align: 'center' as const,
      render: (score: number, record: Indicator) => (
        <div>
          <div>{score}</div>
          {record.myScore !== undefined && record.myScore > 0 && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              ({record.myScore})
            </Text>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center' as const,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (deadline: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {deadline}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      align: 'center' as const,
      render: (_: any, record: Indicator) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewIndicator(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEditIndicator(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定删除此指标吗？"
            description="删除后无法恢复"
            onConfirm={() => onDeleteIndicator(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 计算统计信息
  const totalScore = awardIndicator.indicators.reduce((sum, indicator) => sum + indicator.score, 0);
  const currentScore = awardIndicator.indicators.reduce((sum, indicator) => sum + (indicator.myScore || 0), 0);
  const completedCount = awardIndicator.indicators.filter(indicator => indicator.status === 'completed').length;
  const totalCount = awardIndicator.indicators.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Text strong style={{ fontSize: '16px' }}>{awardIndicator.title}</Text>
            {awardIndicator.description && (
              <div>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {awardIndicator.description}
                </Text>
              </div>
            )}
          </div>
          <Button 
            type="primary" 
            size="small"
            icon={<PlusOutlined />}
            onClick={() => onAddIndicator(awardIndicator.id)}
          >
            添加指标
          </Button>
        </div>
      }
      style={{ marginBottom: 16 }}
      bodyStyle={{ padding: '16px' }}
    >
      {/* 统计信息 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: 16,
        padding: '12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '6px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
            {totalScore}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>总分</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
            {currentScore}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>当前分</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
            {completionRate}%
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>完成率</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fa8c16' }}>
            {completedCount}/{totalCount}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>完成数</Text>
        </div>
      </div>

      {/* 指标表格 */}
      <Table
        dataSource={awardIndicator.indicators}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 600 }}
        locale={{
          emptyText: '暂无指标数据'
        }}
      />
    </Card>
  );
};

export default IndicatorCard;
