import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  message,
  Alert,
  Tag,
  Tooltip,
  Popconfirm,
  Statistic,
  Upload,
  DatePicker,
  Collapse
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  TrophyOutlined,
  StarOutlined,
  GiftOutlined,
  TeamOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined
} from '@ant-design/icons';

// Helper function to safely parse dates
const safeParseDate = (dateString: string | undefined, format?: string): dayjs.Dayjs | undefined => {
  if (!dateString) return undefined;
  try {
    const parsed = format ? dayjs(dateString, format) : dayjs(dateString);
    return parsed.isValid() ? parsed : undefined;
  } catch (error) {
    return undefined;
  }
};

import { 
  EAward, 
  EAwardCategory, 
  EAwardSubmission
} from '@/types/awards';
import { awardService } from '@/modules/award/services/awardService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface EAwardsComponentProps {
  year?: number;
  memberId?: string;
  isAdmin?: boolean;
  isDeveloper?: boolean;
}

const EAwardsComponent: React.FC<EAwardsComponentProps> = ({
  year = new Date().getFullYear(),
  memberId,
  isAdmin = false
}) => {
  const [awards, setAwards] = useState<EAward[]>([]);
  const [submissions, setSubmissions] = useState<EAwardSubmission[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAward, setEditingAward] = useState<EAward | null>(null);
  const [submissionModalVisible, setSubmissionModalVisible] = useState(false);
  const [selectedAward, setSelectedAward] = useState<EAward | null>(null);
  const [form] = Form.useForm();
  const [submissionForm] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState<EAwardCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [year, selectedCategory, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [awardsData, submissionsData] = await Promise.all([
        awardService.getEAwards(year, selectedCategory === 'all' ? undefined : selectedCategory),
        memberId ? awardService.getMemberEAwardSubmissions(memberId, year) : Promise.resolve([])
      ]);
      
      setAwards(awardsData);
      setSubmissions(submissionsData);
    } catch (error) {
      message.error('加载E-Awards数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAward = () => {
    if (!isAdmin) {
      message.warning('只有管理员可以创建E-Awards');
      return;
    }
    setEditingAward(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditAward = (award: EAward) => {
    if (!isAdmin) {
      message.warning('只有管理员可以编辑E-Awards');
      return;
    }
    setEditingAward(award);
    form.setFieldsValue({
      ...award,
      deadline: safeParseDate(award.deadline, 'YYYY-MM-DD')
    });
    setModalVisible(true);
  };

  const handleDeleteAward = async (awardId: string) => {
    if (!isAdmin) {
      message.warning('只有管理员可以删除E-Awards');
      return;
    }
    try {
      await awardService.deleteEAward(awardId);
      message.success('E-Award删除成功');
      loadData();
    } catch (error) {
      message.error('删除E-Award失败');
      console.error(error);
    }
  };

  const handleSaveAward = async () => {
    try {
      const values = await form.validateFields();
      
      const awardData: Omit<EAward, 'id' | 'createdAt' | 'updatedAt'> = {
        ...values,
        year,
        deadline: values.deadline?.format('YYYY-MM-DD') || null,
        createdBy: 'current_user',
        updatedBy: 'current_user',
        // 确保不传递undefined值给Firebase
        instructions: values.instructions || null,
        criteria: values.criteria || null
      };

      if (editingAward) {
        await awardService.updateEAward(editingAward.id, awardData);
        message.success('E-Award更新成功');
      } else {
        await awardService.createEAward(awardData);
        message.success('E-Award创建成功');
      }

      setModalVisible(false);
      form.resetFields();
      loadData();
    } catch (error) {
      message.error('保存E-Award失败');
      console.error(error);
    }
  };

  const handleSubmitAward = (award: EAward) => {
    if (!memberId) {
      message.warning('请先登录');
      return;
    }
    setSelectedAward(award);
    submissionForm.resetFields();
    setSubmissionModalVisible(true);
  };

  const handleSaveSubmission = async () => {
    try {
      const values = await submissionForm.validateFields();
      
      const submissionData: Omit<EAwardSubmission, 'id' | 'createdAt' | 'updatedAt'> = {
        ...values,
        awardId: selectedAward!.id,
        memberId: memberId!,
        year,
        submittedAt: new Date().toISOString(),
        status: 'pending',
        // 确保不传递undefined值给Firebase
        supportingDocuments: values.supportingDocuments || [],
        notes: values.notes || null,
        evidence: values.evidence || null
      };

      await awardService.createEAwardSubmission(submissionData);
      message.success('提交成功，等待审核');
      
      setSubmissionModalVisible(false);
      submissionForm.resetFields();
      loadData();
    } catch (error) {
      message.error('提交失败');
      console.error(error);
    }
  };

  const getCategoryIcon = (category: EAwardCategory) => {
    switch (category) {
      case 'individual':
        return <UserOutlined style={{ color: '#1890ff' }} />;
      case 'organization':
        return <TeamOutlined style={{ color: '#52c41a' }} />;
      case 'project':
        return <StarOutlined style={{ color: '#fa8c16' }} />;
      case 'leadership':
        return <TrophyOutlined style={{ color: '#722ed1' }} />;
      case 'innovation':
        return <GiftOutlined style={{ color: '#eb2f96' }} />;
      default:
        return <TrophyOutlined />;
    }
  };

  const getCategoryName = (category: EAwardCategory) => {
    switch (category) {
      case 'individual':
        return 'Individual Awards';
      case 'organization':
        return 'Organization Awards';
      case 'project':
        return 'Project Awards';
      case 'leadership':
        return 'Leadership Awards';
      case 'innovation':
        return 'Innovation Awards';
      default:
        return category;
    }
  };

  const getStatusTag = (status: string) => {
    const colorMap: Record<string, string> = {
      open: 'green',
      closed: 'red',
      draft: 'default',
      completed: 'blue'
    };
    return <Tag color={colorMap[status] || 'default'}>{status.toUpperCase()}</Tag>;
  };

  const getSubmissionStatusTag = (status: string) => {
    switch (status) {
      case 'approved':
        return <Tag color="green" icon={<CheckCircleOutlined />}>Approved</Tag>;
      case 'rejected':
        return <Tag color="red" icon={<ExclamationCircleOutlined />}>Rejected</Tag>;
      case 'pending':
        return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  // 计算统计信息
  const totalAwards = awards.length;
  const activeAwards = awards.filter(award => award.status === 'open').length;
  const totalSubmissions = submissions.length;
  const approvedSubmissions = submissions.filter(sub => sub.status === 'approved').length;
  const approvalRate = totalSubmissions > 0 ? (approvedSubmissions / totalSubmissions) * 100 : 0;

  // 按类别分组奖项
  const awardsByCategory = awards.reduce((acc, award) => {
    const category = award.category as EAwardCategory;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(award);
    return acc;
  }, {} as Record<EAwardCategory, EAward[]>);

  const initializeSampleAwards = async () => {
    try {
      setLoading(true);
      // 示例数据已清空
      const sampleAwards: any[] = [];

      for (const awardData of sampleAwards) {
        await awardService.saveEAward(awardData);
      }
      
      message.success('示例E-Awards初始化已清空');
      loadData();
    } catch (error) {
      message.error('初始化示例E-Awards失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (awards.length === 0) {
    return (
      <Card>
        <Alert
          message="暂无E-Awards配置"
          description="请点击下方按钮初始化示例E-Awards，或创建自定义奖励"
          type="info"
          showIcon
          action={
            <Space>
              <Button type="primary" onClick={initializeSampleAwards} loading={loading}>
                初始化示例E-Awards
              </Button>
              {isAdmin && (
                <Button onClick={handleCreateAward}>
                  创建自定义奖励
                </Button>
              )}
            </Space>
          }
        />
      </Card>
    );
  }

  return (
    <div>
      {/* 页面标题和操作按钮 */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={24} align="middle">
          <Col span={12}>
            <Title level={2} style={{ marginBottom: 0 }}>
              <TrophyOutlined style={{ marginRight: 8 }} />
              E-Awards - {year}
            </Title>
            <Text type="secondary">电子奖励系统 - 数字化成就认可</Text>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                style={{ width: 150 }}
              >
                <Option value="all">All Categories</Option>
                <Option value="individual">Individual</Option>
                <Option value="organization">Organization</Option>
                <Option value="project">Project</Option>
                <Option value="leadership">Leadership</Option>
                <Option value="innovation">Innovation</Option>
              </Select>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: 120 }}
              >
                <Option value="all">All Status</Option>
                <Option value="open">Open</Option>
                <Option value="closed">Closed</Option>
                <Option value="draft">Draft</Option>
              </Select>
              {isAdmin && (
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleCreateAward}
                >
                  Create Award
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计概览 */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Awards"
              value={totalAwards}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Awards"
              value={activeAwards}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Submissions"
              value={totalSubmissions}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Approval Rate"
              value={approvalRate}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 管理员功能提示 */}
      {isAdmin && (
        <Alert
          message="管理员模式"
          description="您拥有创建、编辑和删除E-Awards的权限，可以管理所有奖项和审核提交。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* 按类别展示奖项 */}
      <Collapse 
        defaultActiveKey={Object.keys(awardsByCategory)} 
        ghost
        items={Object.entries(awardsByCategory).map(([category, categoryAwards]) => ({
          key: category,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {getCategoryIcon(category as EAwardCategory)}
                <span style={{ marginLeft: 8, fontWeight: 'bold' }}>
                  {getCategoryName(category as EAwardCategory)}
                </span>
              </div>
              <div>
                <Tag color="blue">{categoryAwards.length} awards</Tag>
              </div>
            </div>
          ),
          children: (
            <Table
              dataSource={categoryAwards}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 1200 }}
            >
              <Table.Column
                title="Award Name"
                dataIndex="title"
                render={(title, record: EAward) => (
                  <div>
                    <Text strong>{title}</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.description}
                      </Text>
                    </div>
                  </div>
                )}
              />
              
              <Table.Column
                title="Status"
                dataIndex="status"
                width={100}
                render={(status) => getStatusTag(status)}
              />
              
              <Table.Column
                title="Deadline"
                dataIndex="deadline"
                width={120}
                align="center"
                render={(deadline) => (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {deadline ? new Date(deadline).toLocaleDateString() : '-'}
                  </Text>
                )}
              />
              
              <Table.Column
                title="Max Score"
                dataIndex="maxScore"
                width={100}
                align="center"
                render={(score) => (
                  <Text strong style={{ color: '#1890ff' }}>{score}</Text>
                )}
              />
              
              <Table.Column
                title="Submissions"
                width={100}
                align="center"
                render={(_, record: EAward) => {
                  const awardSubmissions = submissions.filter(sub => sub.awardId === record.id);
                  return (
                    <div>
                      <Text strong>{awardSubmissions.length}</Text>
                      <div style={{ marginTop: 2 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {awardSubmissions.filter(sub => sub.status === 'approved').length} approved
                        </Text>
                      </div>
                    </div>
                  );
                }}
              />
              
              <Table.Column
                title="Actions"
                width={150}
                align="center"
                render={(_, record: EAward) => (
                  <Space>
                    <Tooltip title="View Details">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          // 查看详情功能
                          message.info('查看详情功能开发中...');
                        }}
                      />
                    </Tooltip>
                    {isAdmin && (
                      <>
                        <Tooltip title="Edit">
                          <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleEditAward(record)}
                          />
                        </Tooltip>
                        <Tooltip title="Delete">
                          <Popconfirm
                            title="确定要删除这个E-Award吗？"
                            onConfirm={() => handleDeleteAward(record.id)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button
                              type="text"
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                            />
                          </Popconfirm>
                        </Tooltip>
                      </>
                    )}
                    {record.status === 'open' && (
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => handleSubmitAward(record)}
                        disabled={!memberId}
                      >
                        Submit
                      </Button>
                    )}
                  </Space>
                )}
              />
            </Table>
          )
        }))}
      />

      {/* 我的提交记录 */}
      {memberId && submissions.length > 0 && (
        <Card title="My Submissions" style={{ marginTop: 24 }}>
          <Table
            dataSource={submissions}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1000 }}
          >
            <Table.Column
              title="Award"
              dataIndex="awardId"
              render={(awardId) => {
                const award = awards.find(a => a.id === awardId);
                return award ? (
                  <div>
                    <Text strong>{award.title}</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {getCategoryName(award.category as EAwardCategory)}
                      </Text>
                    </div>
                  </div>
                ) : 'Unknown Award';
              }}
            />
            
            <Table.Column
              title="Score"
              dataIndex="score"
              width={100}
              align="center"
              render={(score) => (
                <Text strong style={{ color: '#1890ff' }}>{score}</Text>
              )}
            />
            
            <Table.Column
              title="Status"
              dataIndex="status"
              width={120}
              render={(status) => getSubmissionStatusTag(status)}
            />
            
            <Table.Column
              title="Submitted At"
              dataIndex="submittedAt"
              width={120}
              align="center"
              render={(date) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {new Date(date).toLocaleDateString()}
                </Text>
              )}
            />
            
            <Table.Column
              title="Review Notes"
              dataIndex="reviewNotes"
              render={(notes) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {notes || '-'}
                </Text>
              )}
            />
          </Table>
        </Card>
      )}

      {/* 创建/编辑E-Award模态框 */}
      <Modal
        title={editingAward ? 'Edit E-Award' : 'Create E-Award'}
        open={modalVisible}
        onOk={handleSaveAward}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={800}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="Award Title"
                rules={[{ required: true, message: '请输入奖项标题' }]}
              >
                <Input placeholder="奖项标题" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: '请选择类别' }]}
              >
                <Select placeholder="选择类别">
                  <Option value="individual">Individual Awards</Option>
                  <Option value="organization">Organization Awards</Option>
                  <Option value="project">Project Awards</Option>
                  <Option value="leadership">Leadership Awards</Option>
                  <Option value="innovation">Innovation Awards</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={3} placeholder="奖项描述" />
          </Form.Item>

          <Form.Item
            name="criteria"
            label="Criteria"
            rules={[{ required: true, message: '请输入评选标准' }]}
          >
            <TextArea rows={4} placeholder="评选标准和条件" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="maxScore"
                label="Max Score"
                rules={[{ required: true, message: '请输入最高分数' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }} 
                  placeholder="最高分数" 
                />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="选择状态">
                  <Option value="draft">Draft</Option>
                  <Option value="open">Open</Option>
                  <Option value="closed">Closed</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="deadline"
                label="Deadline"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="instructions"
            label="Submission Instructions"
          >
            <TextArea rows={3} placeholder="提交说明和指导" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 提交E-Award模态框 */}
      <Modal
        title={`Submit - ${selectedAward?.title}`}
        open={submissionModalVisible}
        onOk={handleSaveSubmission}
        onCancel={() => {
          setSubmissionModalVisible(false);
          submissionForm.resetFields();
        }}
        width={600}
        okText="Submit"
        cancelText="Cancel"
      >
        <Form form={submissionForm} layout="vertical">
          <Form.Item
            name="score"
            label="Score"
            rules={[{ required: true, message: '请输入分数' }]}
          >
            <InputNumber 
              min={0} 
              max={selectedAward?.maxScore || 100}
              style={{ width: '100%' }} 
              placeholder="请输入分数" 
            />
          </Form.Item>
          
          <Form.Item
            name="evidence"
            label="Evidence/Portfolio"
            rules={[{ required: true, message: '请提供证据或作品集' }]}
          >
            <TextArea rows={4} placeholder="请提供相关证据、作品集或成就说明" />
          </Form.Item>
          
          <Form.Item
            name="supportingDocuments"
            label="Supporting Documents"
          >
            <Upload
              multiple
              beforeUpload={() => false}
              onChange={(_info) => {
                // 处理文件上传
              }}
            >
              <Button icon={<UploadOutlined />}>Upload Documents</Button>
            </Upload>
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <TextArea rows={3} placeholder="额外说明或备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EAwardsComponent;
