import React from 'react';
import { 
  Card, 
  Alert, 
  Tabs, 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Progress,
  Button,
  Tooltip,
  Row,
  Col
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  EditOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { StandardEditModalData, ValidationResult } from '@/types/pdfInterpretation';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface PDFInterpretationResultProps {
  data: StandardEditModalData;
  validationResult: ValidationResult;
  onConfirm: () => void;
  onEdit: () => void;
  onRetry: () => void;
  isProcessing: boolean;
}

const PDFInterpretationResult: React.FC<PDFInterpretationResultProps> = ({
  data,
  validationResult,
  onConfirm,
  onEdit,
  onRetry,
  isProcessing
}) => {
  
  // 基础字段表格列定义
  const basicFieldsColumns = [
    {
      title: '字段',
      dataIndex: 'field',
      key: 'field',
      width: 150,
    },
    {
      title: '值',
      dataIndex: 'value',
      key: 'value',
      render: (value: any) => (
        <Text style={{ wordBreak: 'break-all' }}>
          {value || <Text type="secondary">未设置</Text>}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: 'valid' | 'warning' | 'error') => {
        const statusConfig = {
          valid: { color: 'success', icon: <CheckCircleOutlined /> },
          warning: { color: 'warning', icon: <ExclamationCircleOutlined /> },
          error: { color: 'error', icon: <ExclamationCircleOutlined /> }
        };
        const config = statusConfig[status] || statusConfig.valid;
        return <Tag color={config.color} icon={config.icon}>{status}</Tag>;
      },
    },
  ];

  // 分数规则表格列定义
  const scoreRuleColumns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '基础积分',
      dataIndex: 'baseScore',
      key: 'baseScore',
      width: 100,
      render: (score: number) => <Text strong>{score}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 80,
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '条件数量',
      dataIndex: 'conditions',
      key: 'conditions',
      width: 100,
      render: (conditions: any[]) => (
        <Text>{conditions?.length || 0} 个条件</Text>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  // 团队职位表格列定义
  const teamPositionColumns = [
    {
      title: '职位名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '是否必需',
      dataIndex: 'isRequired',
      key: 'isRequired',
      width: 100,
      render: (isRequired: boolean) => (
        <Tag color={isRequired ? 'red' : 'default'}>
          {isRequired ? '必需' : '可选'}
        </Tag>
      ),
    },
    {
      title: '最大成员数',
      dataIndex: 'maxMembers',
      key: 'maxMembers',
      width: 120,
      render: (maxMembers: number) => (
        <Text>{maxMembers || '无限制'}</Text>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
  ];

  // 准备基础字段数据
  const basicFieldsData = [
    {
      key: 'title',
      field: '标题',
      value: data.title,
      status: data.title ? 'valid' : 'error'
    },
    {
      key: 'description',
      field: '描述',
      value: data.description,
      status: data.description ? 'valid' : 'error'
    },
    {
      key: 'deadline',
      field: '截止日期',
      value: data.deadline,
      status: data.deadline ? 'valid' : 'error'
    },
    {
      key: 'externalLink',
      field: '外部链接',
      value: data.externalLink,
      status: data.externalLink ? 'warning' : 'valid'
    },
    {
      key: 'category',
      field: '类别',
      value: data.category || data.categoryId,
      status: (data.category || data.categoryId) ? 'valid' : 'warning'
    }
  ];

  // 添加特定字段
  if (data.awardType === 'efficient_star') {
    basicFieldsData.push(
      {
        key: 'no',
        field: '序号',
        value: data.no?.toString(),
        status: data.no ? 'valid' : 'warning'
      },
      {
        key: 'guidelines',
        field: '指导原则',
        value: data.guidelines,
        status: 'valid'
      }
    );
  }

  if (data.awardType === 'star_point') {
    basicFieldsData.push({
      key: 'objective',
      field: '目标分数',
      value: data.objective?.toString(),
      status: data.objective ? 'valid' : 'warning'
    });
  }

  if (data.awardType === 'national_area_incentive') {
    basicFieldsData.push(
      {
        key: 'nationalAllocation',
        field: '国家级分配',
        value: data.nationalAllocation,
        status: data.nationalAllocation ? 'valid' : 'warning'
      },
      {
        key: 'areaAllocation',
        field: '区域级分配',
        value: data.areaAllocation,
        status: data.areaAllocation ? 'valid' : 'warning'
      },
      {
        key: 'status',
        field: '状态',
        value: data.status,
        status: data.status ? 'valid' : 'warning'
      }
    );
  }

  // 获取置信度颜色
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#52c41a';
    if (confidence >= 0.6) return '#faad14';
    return '#ff4d4f';
  };

  // 获取置信度文本
  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return '高置信度';
    if (confidence >= 0.6) return '中等置信度';
    return '低置信度';
  };

  return (
    <Card title="📊 解读结果" size="small">
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        
        {/* 置信度和关键词 */}
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="解读置信度">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Progress 
                  percent={Math.round(data.confidence * 100)} 
                  strokeColor={getConfidenceColor(data.confidence)}
                  format={(percent) => `${percent}%`}
                />
                <Text style={{ color: getConfidenceColor(data.confidence) }}>
                  {getConfidenceText(data.confidence)}
                </Text>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="提取的关键词">
              <Space wrap>
                {data.extractedKeywords.length > 0 ? (
                  data.extractedKeywords.slice(0, 8).map((keyword, index) => (
                    <Tag key={index} color="blue">{keyword}</Tag>
                  ))
                ) : (
                  <Text type="secondary">无关键词</Text>
                )}
                {data.extractedKeywords.length > 8 && (
                  <Tooltip title={data.extractedKeywords.slice(8).join(', ')}>
                    <Tag>+{data.extractedKeywords.length - 8}</Tag>
                  </Tooltip>
                )}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 验证结果 */}
        {validationResult && (
          <Alert
            message={`数据验证结果 - ${validationResult.isValid ? '通过' : '未通过'}`}
            description={
              <Space direction="vertical" size="small">
                {validationResult.errors.length > 0 && (
                  <div>
                    <Text strong type="danger">错误 ({validationResult.errors.length}):</Text>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>
                          <Text type="danger">{error}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {validationResult.warnings.length > 0 && (
                  <div>
                    <Text strong type="warning">警告 ({validationResult.warnings.length}):</Text>
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>
                          <Text type="warning">{warning}</Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Space>
            }
            type={validationResult.isValid ? 'success' : 'error'}
            showIcon
          />
        )}

        {/* 解读说明 */}
        {data.notes && (
          <Alert
            message="解读说明"
            description={<Text>{data.notes}</Text>}
            type="info"
            showIcon
          />
        )}

        {/* 详细数据展示 */}
        <Tabs defaultActiveKey="basic" type="card">
          <TabPane tab="基础字段" key="basic">
            <Table
              columns={basicFieldsColumns}
              dataSource={basicFieldsData}
              pagination={false}
              size="small"
              scroll={{ x: 600 }}
            />
          </TabPane>

          {data.scoreRules.length > 0 && (
            <TabPane tab={`分数规则 (${data.scoreRules.length})`} key="score">
              <Table
                columns={scoreRuleColumns}
                dataSource={data.scoreRules.map((rule, index) => ({
                  key: rule.id || index,
                  ...rule
                }))}
                pagination={false}
                size="small"
                scroll={{ x: 800 }}
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ margin: 0 }}>
                      <Title level={5}>条件详情</Title>
                      {record.conditions && record.conditions.length > 0 ? (
                        <Table
                          columns={[
                            { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
                            { title: '积分', dataIndex: 'points', key: 'points', width: 80 },
                            { title: '描述', dataIndex: 'description', key: 'description' }
                          ]}
                          dataSource={record.conditions.map((condition: any, index: number) => ({
                            key: condition.id || index,
                            ...condition
                          }))}
                          pagination={false}
                          size="small"
                        />
                      ) : (
                        <Text type="secondary">暂无条件</Text>
                      )}
                    </div>
                  ),
                  rowExpandable: (record) => record.conditions && record.conditions.length > 0,
                }}
              />
            </TabPane>
          )}

          {data.teamManagement && data.teamManagement.positions.length > 0 && (
            <TabPane tab={`团队管理 (${data.teamManagement.positions.length})`} key="team">
              <Table
                columns={teamPositionColumns}
                dataSource={data.teamManagement.positions.map((position, index) => ({
                  key: position.id || index,
                  ...position
                }))}
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
              />
            </TabPane>
          )}
        </Tabs>

        {/* 操作按钮 */}
        <Space style={{ width: '100%', justifyContent: 'center' }}>
          <Button 
            type="primary" 
            icon={<SaveOutlined />}
            onClick={onConfirm}
            disabled={isProcessing || !validationResult?.isValid}
            size="large"
          >
            确认保存到系统
          </Button>
          
          <Button 
            icon={<EditOutlined />}
            onClick={onEdit}
            disabled={isProcessing}
            size="large"
          >
            手动编辑
          </Button>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={onRetry}
            disabled={isProcessing}
            size="large"
          >
            重新解读
          </Button>
        </Space>

        {/* 处理状态提示 */}
        {isProcessing && (
          <Alert
            message="正在处理..."
            description="系统正在保存数据到数据库，请稍候..."
            type="warning"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default PDFInterpretationResult;
