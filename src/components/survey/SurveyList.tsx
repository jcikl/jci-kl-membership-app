import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  DatePicker,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CopyOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ArchiveOutlined,
  BarChartOutlined,
  SearchOutlined,
  FilterOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { surveyService } from '@/services/surveyService';
import { Survey, SurveyStatus, SurveyType, SurveyTargetAudience } from '@/types';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface SurveyListProps {
  showCreateButton?: boolean;
  showStats?: boolean;
  userId?: string;
}

const SurveyList: React.FC<SurveyListProps> = ({
  showCreateButton = true,
  showStats = true,
  userId
}) => {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: undefined as SurveyStatus | undefined,
    type: undefined as SurveyType | undefined,
    targetAudience: undefined as SurveyTargetAudience | undefined,
    search: ''
  });

  // 加载问卷列表
  const loadSurveys = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pageSize,
        ...filters,
        ...(userId && { createdBy: userId })
      };

      const result = await surveyService.getSurveys(params);
      if (result.success && result.data) {
        setSurveys(result.data.data);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total: result.data!.total
        }));
      } else {
        message.error(result.error || '加载问卷列表失败');
      }
    } catch (error) {
      message.error('加载问卷列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, [filters]);

  // 处理问卷操作
  const handleAction = async (action: string, surveyId: string) => {
    try {
      let result;
      switch (action) {
        case 'publish':
          result = await surveyService.publishSurvey(surveyId);
          break;
        case 'close':
          result = await surveyService.closeSurvey(surveyId);
          break;
        case 'archive':
          result = await surveyService.archiveSurvey(surveyId);
          break;
        case 'duplicate':
          result = await surveyService.duplicateSurvey(surveyId, `副本 - ${surveys.find(s => s.id === surveyId)?.title}`, 'current-user');
          break;
        case 'delete':
          result = await surveyService.deleteSurvey(surveyId);
          break;
        default:
          return;
      }

      if (result.success) {
        message.success(result.message || '操作成功');
        loadSurveys(pagination.current, pagination.pageSize);
      } else {
        message.error(result.error || '操作失败');
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 状态标签颜色
  const getStatusColor = (status: SurveyStatus) => {
    switch (status) {
      case 'draft': return 'default';
      case 'published': return 'green';
      case 'closed': return 'orange';
      case 'archived': return 'gray';
      default: return 'default';
    }
  };

  // 状态标签文本
  const getStatusText = (status: SurveyStatus) => {
    switch (status) {
      case 'draft': return '草稿';
      case 'published': return '已发布';
      case 'closed': return '已关闭';
      case 'archived': return '已归档';
      default: return status;
    }
  };

  // 类型标签文本
  const getTypeText = (type: SurveyType) => {
    switch (type) {
      case 'feedback': return '反馈';
      case 'evaluation': return '评估';
      case 'registration': return '报名';
      case 'poll': return '投票';
      case 'assessment': return '测评';
      case 'custom': return '自定义';
      default: return type;
    }
  };

  // 目标受众标签文本
  const getTargetAudienceText = (audience: SurveyTargetAudience) => {
    switch (audience) {
      case 'all_members': return '所有会员';
      case 'official_members': return '正式会员';
      case 'associate_members': return '准会员';
      case 'honorary_members': return '荣誉会员';
      case 'affiliate_members': return '联合会员';
      case 'visitor_members': return '拜访会员';
      case 'specific_roles': return '特定角色';
      case 'custom': return '自定义';
      default: return audience;
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '问卷标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Survey) => (
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: '12px', color: '#666' }}>{record.description}</div>
          )}
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SurveyStatus) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: SurveyType) => (
        <Tag>{getTypeText(type)}</Tag>
      )
    },
    {
      title: '目标受众',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      width: 120,
      render: (audience: SurveyTargetAudience) => (
        <Tag>{getTargetAudienceText(audience)}</Tag>
      )
    },
    {
      title: '回答数',
      dataIndex: 'totalResponses',
      key: 'totalResponses',
      width: 80,
      render: (count: number) => (
        <Badge count={count} showZero color="#52c41a" />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: Survey) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/surveys/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/surveys/${record.id}/edit`)}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title="发布">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleAction('publish', record.id)}
              />
            </Tooltip>
          )}
          {record.status === 'published' && (
            <Tooltip title="关闭">
              <Button
                type="text"
                icon={<PauseCircleOutlined />}
                onClick={() => handleAction('close', record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="复制">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleAction('duplicate', record.id)}
            />
          </Tooltip>
          <Tooltip title="分析">
            <Button
              type="text"
              icon={<BarChartOutlined />}
              onClick={() => navigate(`/surveys/${record.id}/analytics`)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个问卷吗？"
            description="删除后无法恢复"
            onConfirm={() => handleAction('delete', record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 统计数据
  const stats = {
    total: surveys.length,
    published: surveys.filter(s => s.status === 'published').length,
    draft: surveys.filter(s => s.status === 'draft').length,
    totalResponses: surveys.reduce((sum, s) => sum + s.totalResponses, 0)
  };

  return (
    <div>
      {/* 统计卡片 */}
      {showStats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="总问卷数" value={stats.total} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="已发布" value={stats.published} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="草稿" value={stats.draft} valueStyle={{ color: '#cf1322' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="总回答数" value={stats.totalResponses} />
            </Card>
          </Col>
        </Row>
      )}

      {/* 操作栏 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Search
                placeholder="搜索问卷标题或描述"
                style={{ width: 300 }}
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onSearch={() => loadSurveys(1)}
              />
              <Select
                placeholder="状态"
                style={{ width: 120 }}
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                allowClear
              >
                <Option value="draft">草稿</Option>
                <Option value="published">已发布</Option>
                <Option value="closed">已关闭</Option>
                <Option value="archived">已归档</Option>
              </Select>
              <Select
                placeholder="类型"
                style={{ width: 120 }}
                value={filters.type}
                onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                allowClear
              >
                <Option value="feedback">反馈</Option>
                <Option value="evaluation">评估</Option>
                <Option value="registration">报名</Option>
                <Option value="poll">投票</Option>
                <Option value="assessment">测评</Option>
                <Option value="custom">自定义</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              {showCreateButton && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/surveys/create')}
                >
                  创建问卷
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 问卷表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={surveys}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            onChange: (page, pageSize) => loadSurveys(page, pageSize || 10)
          }}
        />
      </Card>
    </div>
  );
};

export default SurveyList;
