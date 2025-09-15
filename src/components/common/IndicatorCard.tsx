import React, { useState } from 'react';
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
  EyeOutlined,
  LinkOutlined,
  DownOutlined,
  UpOutlined
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
  // 状态管理 - 为每个指标维护展开状态
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});

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

  // 切换描述展开状态
  const toggleDescriptionExpanded = (indicatorId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [indicatorId]: !prev[indicatorId]
    }));
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
      render: (title: string, record: Indicator) => {
        const isDescriptionExpanded = expandedDescriptions[record.id] || false;
        const shouldShowButton = record.description && record.description.length > 100;
        
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Tooltip title={title}>
                  <Text strong>{title}</Text>
                </Tooltip>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {record.externalLink && record.externalLink.trim() && (
                  <Tooltip title="查看外部资料">
                    <Button
                      type="text"
                      size="small"
                      icon={<LinkOutlined />}
                      onClick={() => {
                        // 确保链接有协议前缀
                        let url = record.externalLink || '';
                        if (!url.startsWith('http://') && !url.startsWith('https://')) {
                          url = 'https://' + url;
                        }
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      style={{ 
                        padding: '2px 4px',
                        height: 'auto',
                        minWidth: 'auto'
                      }}
                    />
                  </Tooltip>
                )}
                {shouldShowButton && (
                  <Tooltip title={isDescriptionExpanded ? "收起描述" : "展开描述"}>
                    <Button
                      type="text"
                      size="small"
                      icon={isDescriptionExpanded ? <UpOutlined /> : <DownOutlined />}
                      onClick={() => toggleDescriptionExpanded(record.id)}
                      style={{ 
                        padding: '2px 4px',
                        height: 'auto',
                        minWidth: 'auto'
                      }}
                    />
                  </Tooltip>
                )}
              </div>
            </div>
            {record.description && isDescriptionExpanded && (
              <div style={{ marginTop: 4 }}>
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '12px', 
                    lineHeight: '1.4',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    display: 'block',
                    overflow: 'visible',
                    maxHeight: 'none'
                  }}
                >
                  {record.description}
                </Text>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      align: 'center' as const,
      render: (score: number, record: Indicator) => {
        const safeScore = Number.isFinite(score) ? score : 0;
        const safeMyScore = Number.isFinite(record.myScore ?? 0) ? (record.myScore ?? 0) : 0;
        
        return (
          <div>
            <div>{safeScore}</div>
            {safeMyScore > 0 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ({safeMyScore})
              </Text>
            )}
          </div>
        );
      }
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
  const totalScore = awardIndicator.indicators.reduce((sum, indicator) => sum + (indicator.score || 0), 0);
  const currentScore = awardIndicator.indicators.reduce((sum, indicator) => sum + (indicator.myScore || 0), 0);
  const completedCount = awardIndicator.indicators.filter(indicator => indicator.status === 'completed').length;
  const totalCount = awardIndicator.indicators.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 确保所有数值都是有效的数字
  const safeTotalScore = Number.isFinite(totalScore) ? totalScore : 0;
  const safeCurrentScore = Number.isFinite(currentScore) ? currentScore : 0;
  const safeCompletionRate = Number.isFinite(completionRate) ? completionRate : 0;
  const safeCompletedCount = Number.isFinite(completedCount) ? completedCount : 0;
  const safeTotalCount = Number.isFinite(totalCount) ? totalCount : 0;

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
      styles={{ body: { padding: '16px' } }}
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
            {safeTotalScore}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>总分</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
            {safeCurrentScore}
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>当前分</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#722ed1' }}>
            {safeCompletionRate}%
          </div>
          <Text type="secondary" style={{ fontSize: '12px' }}>完成率</Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fa8c16' }}>
            {safeCompletedCount}/{safeTotalCount}
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
