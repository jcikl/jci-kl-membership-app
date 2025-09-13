import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  StarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { Member } from '@/types';
import { updateMember } from '@/services/memberService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SenatorScoreManagerProps {
  member: Member;
  onUpdate: (updatedMember: Member) => void;
  isAdmin?: boolean;
}

const SenatorScoreManager: React.FC<SenatorScoreManagerProps> = ({
  member,
  onUpdate,
  isAdmin = false
}) => {
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [editingScore, setEditingScore] = useState<any>(null);
  const [form] = Form.useForm();

  const currentScore = member.profile?.senatorScore || 0;
  const scoreHistory = member.profile?.senatorScoreHistory || [];

  // 分数历史表格列定义
  const historyColumns = [
    {
      title: '日期',
      dataIndex: 'awardedDate',
      key: 'awardedDate',
      width: 100,
      render: (date: string) => (
        <Text style={{ fontSize: '12px' }}>
          {new Date(date).toLocaleDateString('zh-CN')}
        </Text>
      )
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score: number) => (
        <Tag color={score > 0 ? 'green' : score < 0 ? 'red' : 'blue'} icon={<StarOutlined />}>
          {score > 0 ? '+' : ''}{score}
        </Tag>
      )
    },
    {
      title: '原因',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
      render: (reason: string) => (
        <Text style={{ fontSize: '12px' }}>{reason}</Text>
      )
    },
    {
      title: '授予人',
      dataIndex: 'awardedBy',
      key: 'awardedBy',
      width: 100,
      render: (awardedBy: string) => (
        <Text style={{ fontSize: '12px' }}>{awardedBy}</Text>
      )
    },
    {
      title: '备注',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => (
        <Text style={{ fontSize: '12px', color: '#666' }}>{notes || '-'}</Text>
      )
    },
    ...(isAdmin ? [{
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEditScore(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这条分数记录吗？"
            onConfirm={() => onDeleteScore(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }] : [])
  ];

  const onAddScore = () => {
    setEditingScore(null);
    form.resetFields();
    setScoreModalVisible(true);
  };

  const onEditScore = (scoreRecord: any) => {
    setEditingScore(scoreRecord);
    form.setFieldsValue({
      score: scoreRecord.score,
      reason: scoreRecord.reason,
      notes: scoreRecord.notes
    });
    setScoreModalVisible(true);
  };

  const onDeleteScore = async (scoreId: string) => {
    try {
      const updatedHistory = scoreHistory.filter(record => record.id !== scoreId);
      const newTotalScore = updatedHistory.reduce((sum, record) => sum + record.score, 0);
      
      await updateMember(member.id, {
        profile: {
          ...member.profile,
          senatorScore: newTotalScore,
          senatorScoreHistory: updatedHistory
        }
      });

      message.success('分数记录已删除');
      onUpdate({
        ...member,
        profile: {
          ...member.profile,
          senatorScore: newTotalScore,
          senatorScoreHistory: updatedHistory
        }
      });
    } catch (error) {
      message.error('删除失败');
    }
  };

  const onSaveScore = async () => {
    try {
      const values = await form.validateFields();
      const newScoreRecord = {
        id: editingScore?.id || `score_${Date.now()}`,
        score: values.score,
        reason: values.reason,
        awardedBy: '当前管理员', // 实际应用中应该从认证信息获取
        awardedDate: new Date().toISOString(),
        notes: values.notes
      };

      let updatedHistory;
      if (editingScore) {
        // 编辑现有记录
        updatedHistory = scoreHistory.map(record => 
          record.id === editingScore.id ? newScoreRecord : record
        );
      } else {
        // 添加新记录
        updatedHistory = [...scoreHistory, newScoreRecord];
      }

      const newTotalScore = updatedHistory.reduce((sum, record) => sum + record.score, 0);

      await updateMember(member.id, {
        profile: {
          ...member.profile,
          senatorScore: newTotalScore,
          senatorScoreHistory: updatedHistory
        }
      });

      message.success(editingScore ? '分数记录已更新' : '分数记录已添加');
      setScoreModalVisible(false);
      onUpdate({
        ...member,
        profile: {
          ...member.profile,
          senatorScore: newTotalScore,
          senatorScoreHistory: updatedHistory
        }
      });
    } catch (error) {
      message.error('保存失败');
    }
  };

  const onViewHistory = () => {
    setHistoryModalVisible(true);
  };

  return (
    <Card size="small" title={<><StarOutlined /> 参议员分数管理</>}>
      {/* 当前分数统计 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Statistic
            title="当前总分"
            value={currentScore}
            prefix={<TrophyOutlined />}
            valueStyle={{ 
              fontSize: '24px', 
              color: currentScore > 0 ? '#52c41a' : currentScore < 0 ? '#ff4d4f' : '#1890ff' 
            }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="历史记录"
            value={scoreHistory.length}
            prefix={<HistoryOutlined />}
            valueStyle={{ fontSize: '20px' }}
          />
        </Col>
      </Row>

      {/* 操作按钮 */}
      <Space style={{ marginBottom: 16 }}>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddScore}
          >
            添加分数
          </Button>
        )}
        <Button
          icon={<HistoryOutlined />}
          onClick={onViewHistory}
        >
          查看历史
        </Button>
      </Space>

      {/* 最近记录预览 */}
      {scoreHistory.length > 0 && (
        <div>
          <Text strong style={{ fontSize: '14px' }}>最近记录：</Text>
          <div style={{ marginTop: 8 }}>
            {scoreHistory.slice(0, 3).map((record, index) => (
              <div key={record.id} style={{ 
                padding: '8px', 
                backgroundColor: '#fafafa', 
                borderRadius: '4px', 
                marginBottom: '4px',
                fontSize: '12px'
              }}>
                <Space>
                  <Tag color={record.score > 0 ? 'green' : record.score < 0 ? 'red' : 'blue'}>
                    {record.score > 0 ? '+' : ''}{record.score}
                  </Tag>
                  <Text>{record.reason}</Text>
                  <Text type="secondary">
                    {new Date(record.awardedDate).toLocaleDateString('zh-CN')}
                  </Text>
                </Space>
              </div>
            ))}
            {scoreHistory.length > 3 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                还有 {scoreHistory.length - 3} 条记录...
              </Text>
            )}
          </div>
        </div>
      )}

      {/* 添加/编辑分数模态框 */}
      <Modal
        title={editingScore ? '编辑分数记录' : '添加分数记录'}
        open={scoreModalVisible}
        onCancel={() => setScoreModalVisible(false)}
        onOk={onSaveScore}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="score"
            label="分数"
            rules={[{ required: true, message: '请输入分数' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="正数为加分，负数为扣分"
              min={-1000}
              max={1000}
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="原因"
            rules={[{ required: true, message: '请输入分数原因' }]}
          >
            <Input placeholder="例如：参加月度会议、完成培训等" />
          </Form.Item>
          <Form.Item
            name="notes"
            label="备注"
          >
            <TextArea
              rows={3}
              placeholder="可选的备注信息"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 历史记录模态框 */}
      <Modal
        title="分数历史记录"
        open={historyModalVisible}
        onCancel={() => setHistoryModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setHistoryModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <Table
          dataSource={scoreHistory}
          columns={historyColumns}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            size: 'small',
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          scroll={{ x: 600 }}
        />
      </Modal>
    </Card>
  );
};

export default SenatorScoreManager;
