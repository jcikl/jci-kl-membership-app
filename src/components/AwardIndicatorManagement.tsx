import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  DatePicker,
  Button,
  Modal,
  Table,
  Space,
  Typography,
  message,
  Popconfirm,
  Tabs,
  Tag,
  Tooltip,
  Alert
} from 'antd';
import dayjs from 'dayjs';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  StarOutlined,
  GiftOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { 
  EfficientStarAward,
  StarPointAward,
  NationalAreaIncentiveAward,
  EfficientStarStandard,
  StarCategory,
  IncentiveAward
} from '@/types/awards';
import { awardService } from '@/services/awardService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

interface AwardIndicatorManagementProps {
  year?: number;
}

const AwardIndicatorManagement: React.FC<AwardIndicatorManagementProps> = ({
  year = new Date().getFullYear()
}) => {
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('efficient-star');
  
  // Efficient Star states
  const [efficientStarAward, setEfficientStarAward] = useState<EfficientStarAward | null>(null);
  const [efficientStarModalVisible, setEfficientStarModalVisible] = useState(false);
  const [editingStandard, setEditingStandard] = useState<EfficientStarStandard | null>(null);
  const [efficientStarForm] = Form.useForm();
  
  // Star Point states
  const [starPointAward, setStarPointAward] = useState<StarPointAward | null>(null);
  const [starPointModalVisible, setStarPointModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StarCategory | null>(null);
  const [starPointForm] = Form.useForm();
  
  // National & Area Incentive states
  const [nationalIncentiveAward, setNationalIncentiveAward] = useState<NationalAreaIncentiveAward | null>(null);
  const [nationalIncentiveModalVisible, setNationalIncentiveModalVisible] = useState(false);
  const [editingIncentiveAward, setEditingIncentiveAward] = useState<IncentiveAward | null>(null);
  const [nationalIncentiveForm] = Form.useForm();

  useEffect(() => {
    loadAllAwards();
  }, [year]);

  const loadAllAwards = async () => {
    try {
      setLoading(true);
      const [efficientStar, starPoint, nationalIncentive] = await Promise.all([
        awardService.getEfficientStarAward(year),
        awardService.getStarPointAward(year),
        awardService.getNationalAreaIncentiveAward(year)
      ]);
      
      setEfficientStarAward(efficientStar);
      setStarPointAward(starPoint);
      setNationalIncentiveAward(nationalIncentive);
    } catch (error) {
      message.error('加载奖励数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ========== Efficient Star Management ==========
  
  const handleEfficientStarStandardEdit = (standard: EfficientStarStandard) => {
    setEditingStandard(standard);
    efficientStarForm.setFieldsValue({
      ...standard,
      deadline: standard.deadline ? dayjs(standard.deadline) : undefined
    });
    setEfficientStarModalVisible(true);
  };

  const handleEfficientStarStandardCreate = () => {
    setEditingStandard(null);
    efficientStarForm.resetFields();
    setEfficientStarModalVisible(true);
  };

  const handleEfficientStarStandardSave = async () => {
    try {
      const values = await efficientStarForm.validateFields();
      
      if (!efficientStarAward) {
        message.error('Efficient Star奖励数据未加载');
        return;
      }

      const updatedStandards = [...efficientStarAward.standards];
      
      if (editingStandard) {
        // Update existing standard
        const index = updatedStandards.findIndex(s => s.id === editingStandard.id);
        if (index >= 0) {
          updatedStandards[index] = {
            ...values,
            id: editingStandard.id,
            deadline: values.deadline?.format('YYYY-MM-DD') || '',
            status: editingStandard.status
          };
        }
      } else {
        // Create new standard
        const newStandard: EfficientStarStandard = {
          ...values,
          id: `standard_${Date.now()}`,
          deadline: values.deadline?.format('YYYY-MM-DD') || '',
          status: 'pending' as const,
          myScore: 0
        };
        updatedStandards.push(newStandard);
      }

      const updatedAward = {
        ...efficientStarAward,
        standards: updatedStandards,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveEfficientStarAward(updatedAward);
      setEfficientStarAward(updatedAward);
      setEfficientStarModalVisible(false);
      message.success(editingStandard ? '标准更新成功' : '标准创建成功');
    } catch (error) {
      message.error('保存失败');
      console.error(error);
    }
  };

  const handleEfficientStarStandardDelete = async (standardId: string) => {
    try {
      if (!efficientStarAward) return;

      const updatedStandards = efficientStarAward.standards.filter(s => s.id !== standardId);
      const updatedAward = {
        ...efficientStarAward,
        standards: updatedStandards,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveEfficientStarAward(updatedAward);
      setEfficientStarAward(updatedAward);
      message.success('标准删除成功');
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // ========== Star Point Management ==========
  
  const handleStarCategoryEdit = (category: StarCategory) => {
    setEditingCategory(category);
    starPointForm.setFieldsValue(category);
    setStarPointModalVisible(true);
  };

  const handleStarCategoryCreate = () => {
    setEditingCategory(null);
    starPointForm.resetFields();
    setStarPointModalVisible(true);
  };

  const handleStarCategorySave = async () => {
    try {
      const values = await starPointForm.validateFields();
      
      if (!starPointAward) {
        message.error('Star Point奖励数据未加载');
        return;
      }

      const updatedCategories = [...starPointAward.starCategories];
      
      if (editingCategory) {
        // Update existing category
        const index = updatedCategories.findIndex(c => c.id === editingCategory.id);
        if (index >= 0) {
          updatedCategories[index] = {
            ...values,
            id: editingCategory.id,
            activities: editingCategory.activities
          };
        }
      } else {
        // Create new category
        const newCategory: StarCategory = {
          ...values,
          id: `category_${Date.now()}`,
          activities: [],
          myPoints: 0
        };
        updatedCategories.push(newCategory);
      }

      const updatedAward = {
        ...starPointAward,
        starCategories: updatedCategories,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveStarPointAward(updatedAward);
      setStarPointAward(updatedAward);
      setStarPointModalVisible(false);
      message.success(editingCategory ? '类别更新成功' : '类别创建成功');
    } catch (error) {
      message.error('保存失败');
      console.error(error);
    }
  };

  const handleStarCategoryDelete = async (categoryId: string) => {
    try {
      if (!starPointAward) return;

      const updatedCategories = starPointAward.starCategories.filter(c => c.id !== categoryId);
      const updatedAward = {
        ...starPointAward,
        starCategories: updatedCategories,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveStarPointAward(updatedAward);
      setStarPointAward(updatedAward);
      message.success('类别删除成功');
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // ========== National & Area Incentive Management ==========
  
  const handleIncentiveAwardEdit = (award: IncentiveAward) => {
    setEditingIncentiveAward(award);
    nationalIncentiveForm.setFieldsValue(award);
    setNationalIncentiveModalVisible(true);
  };

  const handleIncentiveAwardCreate = () => {
    setEditingIncentiveAward(null);
    nationalIncentiveForm.resetFields();
    setNationalIncentiveModalVisible(true);
  };

  const handleIncentiveAwardSave = async () => {
    try {
      const values = await nationalIncentiveForm.validateFields();
      
      if (!nationalIncentiveAward) {
        message.error('National & Area Incentive奖励数据未加载');
        return;
      }

      const updatedCategories = [...nationalIncentiveAward.awardCategories];
      
      if (editingIncentiveAward) {
        // Update existing award
        const categoryIndex = updatedCategories.findIndex(c => 
          c.awards.some(a => a.id === editingIncentiveAward.id)
        );
        if (categoryIndex >= 0) {
          const awardIndex = updatedCategories[categoryIndex].awards.findIndex(
            a => a.id === editingIncentiveAward.id
          );
          if (awardIndex >= 0) {
            updatedCategories[categoryIndex].awards[awardIndex] = {
              ...values,
              id: editingIncentiveAward.id
            };
          }
        }
      } else {
        // Create new award - add to first category for now
        if (updatedCategories.length > 0) {
          const newAward: IncentiveAward = {
            ...values,
            id: `award_${Date.now()}`
          };
          updatedCategories[0].awards.push(newAward);
        }
      }

      const updatedAward = {
        ...nationalIncentiveAward,
        awardCategories: updatedCategories,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveNationalAreaIncentiveAward(updatedAward);
      setNationalIncentiveAward(updatedAward);
      setNationalIncentiveModalVisible(false);
      message.success(editingIncentiveAward ? '奖项更新成功' : '奖项创建成功');
    } catch (error) {
      message.error('保存失败');
      console.error(error);
    }
  };

  const handleIncentiveAwardDelete = async (awardId: string) => {
    try {
      if (!nationalIncentiveAward) return;

      const updatedCategories = nationalIncentiveAward.awardCategories.map(category => ({
        ...category,
        awards: category.awards.filter(a => a.id !== awardId)
      }));

      const updatedAward = {
        ...nationalIncentiveAward,
        awardCategories: updatedCategories,
        updatedAt: new Date().toISOString()
      };

      await awardService.saveNationalAreaIncentiveAward(updatedAward);
      setNationalIncentiveAward(updatedAward);
      message.success('奖项删除成功');
    } catch (error) {
      message.error('删除失败');
      console.error(error);
    }
  };

  // ========== Render Functions ==========
  
  const renderEfficientStarTab = () => (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4}>Efficient Star 指标管理</Title>
          <Text type="secondary">管理Efficient Star奖励的标准和指标</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleEfficientStarStandardCreate}
        >
          添加标准
        </Button>
      </div>

      {efficientStarAward ? (
        <Table
          dataSource={efficientStarAward.standards}
          rowKey="id"
          pagination={false}
          scroll={{ x: 800 }}
          columns={[
            {
              title: 'NO.',
              dataIndex: 'no',
              width: 60,
              align: 'center'
            },
            {
              title: 'STANDARDS',
              dataIndex: 'title',
              render: (text, record) => (
                <div>
                  <Text strong>{text}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {record.description}
                  </Text>
                </div>
              )
            },
            {
              title: 'DEADLINE/CRITERIA',
              dataIndex: 'deadline',
              width: 120,
              render: (deadline) => (
                <Tag color="blue">{deadline}</Tag>
              )
            },
            {
              title: 'SCORE',
              dataIndex: 'score',
              width: 80,
              align: 'center',
              render: (score) => (
                <Text strong>{score}%</Text>
              )
            },
            {
              title: 'MY SCORE',
              dataIndex: 'myScore',
              width: 80,
              align: 'center',
              render: (myScore) => (
                <Text>{myScore || '-'}</Text>
              )
            },
            {
              title: 'ACTION',
              width: 120,
              render: (_, record) => (
                <Space>
                  <Tooltip title="编辑">
                    <Button 
                      type="text" 
                      icon={<EditOutlined />} 
                      onClick={() => handleEfficientStarStandardEdit(record)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="确定删除此标准？"
                    onConfirm={() => handleEfficientStarStandardDelete(record.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Tooltip title="删除">
                      <Button type="text" danger icon={<DeleteOutlined />} />
                    </Tooltip>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      ) : (
        <Alert 
          message="暂无数据" 
          description="请先初始化Efficient Star奖励数据" 
          type="info" 
        />
      )}
    </Card>
  );

  const renderStarPointTab = () => (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4}>Star Point 指标管理</Title>
          <Text type="secondary">管理Star Point奖励的类别和活动</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleStarCategoryCreate}
        >
          添加类别
        </Button>
      </div>

      {starPointAward ? (
        <div>
          {starPointAward.starCategories.map(category => (
            <Card key={category.id} style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={5}>
                    {category.title.toUpperCase()} - [{category.myPoints} points]
                  </Title>
                  <Text type="secondary">
                    {category.myPoints} / {category.points} Points
                  </Text>
                  <br />
                  <Text>{category.description}</Text>
                  <br />
                  <Text strong>Objective:</Text> {category.objective}
                  <br />
                  <Text strong>Note:</Text> {category.note}
                </div>
                <Space>
                  <Button 
                    type="text" 
                    icon={<EditOutlined />} 
                    onClick={() => handleStarCategoryEdit(category)}
                  >
                    编辑类别
                  </Button>
                  <Popconfirm
                    title="确定删除此类别？"
                    onConfirm={() => handleStarCategoryDelete(category.id)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="text" danger icon={<DeleteOutlined />}>
                      删除类别
                    </Button>
                  </Popconfirm>
                </Space>
              </div>

              <Table
                dataSource={category.activities}
                rowKey="id"
                pagination={false}
                size="small"
                columns={[
                  {
                    title: 'NO.',
                    dataIndex: 'no',
                    width: 60,
                    align: 'center'
                  },
                  {
                    title: 'DETAILS',
                    dataIndex: 'title',
                    render: (text, record) => (
                      <div>
                        <Text strong>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {record.description}
                        </Text>
                      </div>
                    )
                  },
                  {
                    title: 'SCORE',
                    dataIndex: 'score',
                    width: 100,
                    align: 'center'
                  },
                  {
                    title: 'MY SCORE',
                    dataIndex: 'myScore',
                    width: 100,
                    align: 'center',
                    render: (myScore) => (
                      <Text>{myScore || '-'}</Text>
                    )
                  },
                  {
                    title: 'ACTION',
                    width: 100,
                    render: () => (
                      <Space>
                        <Tooltip title="编辑活动">
                          <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            onClick={() => {/* TODO: Implement activity editing */}}
                          />
                        </Tooltip>
                        <Tooltip title="删除活动">
                          <Button type="text" danger icon={<DeleteOutlined />} />
                        </Tooltip>
                      </Space>
                    )
                  }
                ]}
              />
            </Card>
          ))}
        </div>
      ) : (
        <Alert 
          message="暂无数据" 
          description="请先初始化Star Point奖励数据" 
          type="info" 
        />
      )}
    </Card>
  );

  const renderNationalIncentiveTab = () => (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4}>National & Area Incentive 指标管理</Title>
        <Text type="secondary">管理National & Area Incentive奖励的奖项</Text>
      </div>

      {nationalIncentiveAward ? (
        <div>
          <Alert 
            message="National Incentive简介" 
            description={
              <div>
                <Text strong>{nationalIncentiveAward.title}</Text>
                <br />
                <Text>{nationalIncentiveAward.description}</Text>
                <br />
                <Text>The Award categories are divided into:</Text>
                <ul>
                  <li>A. Individual Awards</li>
                  <li>B. Local Organisation Awards</li>
                  <li>C. Area Awards</li>
                  <li>D. Special Awards</li>
                  <li>E. JCI Junior, Youth Awards</li>
                </ul>
              </div>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />

          {nationalIncentiveAward.awardCategories.map(category => (
            <Card key={category.id} style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={5}>{category.category}</Title>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => handleIncentiveAwardCreate()}
                >
                  添加奖项
                </Button>
              </div>

              <Table
                dataSource={category.awards}
                rowKey="id"
                pagination={false}
                columns={[
                  {
                    title: 'NO.',
                    dataIndex: 'no',
                    width: 80,
                    align: 'center'
                  },
                  {
                    title: 'AWARDS',
                    dataIndex: 'title',
                    render: (text, record) => (
                      <div>
                        <Text strong>{text}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {record.guidelines}
                        </Text>
                      </div>
                    )
                  },
                  {
                    title: 'NATIONAL',
                    dataIndex: 'nationalAllocation',
                    width: 100,
                    align: 'center',
                    render: (allocation) => (
                      <Text strong>{allocation}</Text>
                    )
                  },
                  {
                    title: 'AREA',
                    dataIndex: 'areaAllocation',
                    width: 100,
                    align: 'center',
                    render: (allocation) => (
                      <Text strong>{allocation}</Text>
                    )
                  },
                  {
                    title: 'STATUS',
                    dataIndex: 'status',
                    width: 100,
                    align: 'center',
                    render: (status) => (
                      <Tag color={status === 'open' ? 'green' : status === 'closed' ? 'red' : 'blue'}>
                        {status === 'open' ? '开放中' : status === 'closed' ? '已关闭' : '已完成'}
                      </Tag>
                    )
                  },
                  {
                    title: 'ACTION',
                    width: 120,
                    render: (_, record) => (
                      <Space>
                        <Tooltip title="编辑">
                          <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            onClick={() => handleIncentiveAwardEdit(record)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="确定删除此奖项？"
                          onConfirm={() => handleIncentiveAwardDelete(record.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Tooltip title="删除">
                            <Button type="text" danger icon={<DeleteOutlined />} />
                          </Tooltip>
                        </Popconfirm>
                      </Space>
                    )
                  }
                ]}
              />
            </Card>
          ))}
        </div>
      ) : (
        <Alert 
          message="暂无数据" 
          description="请先初始化National & Area Incentive奖励数据" 
          type="info" 
        />
      )}
    </Card>
  );

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={3}>奖励指标管理</Title>
          <Text type="secondary">管理所有奖励系统的指标和标准</Text>
        </div>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={loadAllAwards}
            loading={loading}
          >
            刷新数据
          </Button>
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <TrophyOutlined />
              Efficient Star
            </span>
          } 
          key="efficient-star"
        >
          {renderEfficientStarTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <StarOutlined />
              Star Point
            </span>
          } 
          key="star-point"
        >
          {renderStarPointTab()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <GiftOutlined />
              National & Area Incentive
            </span>
          } 
          key="national-incentive"
        >
          {renderNationalIncentiveTab()}
        </TabPane>
      </Tabs>

      {/* Efficient Star Modal */}
      <Modal
        title={editingStandard ? '编辑标准' : '创建标准'}
        open={efficientStarModalVisible}
        onOk={handleEfficientStarStandardSave}
        onCancel={() => setEfficientStarModalVisible(false)}
        width={600}
      >
        <Form form={efficientStarForm} layout="vertical">
          <Form.Item
            name="no"
            label="编号"
            rules={[{ required: true, message: '请输入编号' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="title"
            label="标准标题"
            rules={[{ required: true, message: '请输入标准标题' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={3} />
          </Form.Item>
          
          <Form.Item
            name="score"
            label="分数"
            rules={[{ required: true, message: '请输入分数' }]}
          >
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="deadline"
            label="截止日期"
            rules={[{ required: true, message: '请选择截止日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="guidelines"
            label="指导原则"
          >
            <Input placeholder="输入指导原则或链接" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Star Point Modal */}
      <Modal
        title={editingCategory ? '编辑类别' : '创建类别'}
        open={starPointModalVisible}
        onOk={handleStarCategorySave}
        onCancel={() => setStarPointModalVisible(false)}
        width={600}
      >
        <Form form={starPointForm} layout="vertical">
          <Form.Item
            name="type"
            label="类别类型"
            rules={[{ required: true, message: '请选择类别类型' }]}
          >
            <Select>
              <Option value="network_star">Network Star</Option>
              <Option value="experience_star">Experience Star</Option>
              <Option value="outreach_star">Outreach Star</Option>
              <Option value="social_star">Social Star</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="title"
            label="类别标题"
            rules={[{ required: true, message: '请输入类别标题' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <TextArea rows={2} />
          </Form.Item>
          
          <Form.Item
            name="objective"
            label="目标"
            rules={[{ required: true, message: '请输入目标' }]}
          >
            <TextArea rows={2} />
          </Form.Item>
          
          <Form.Item
            name="points"
            label="总分数"
            rules={[{ required: true, message: '请输入总分数' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="note"
            label="备注"
          >
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      {/* National & Area Incentive Modal */}
      <Modal
        title={editingIncentiveAward ? '编辑奖项' : '创建奖项'}
        open={nationalIncentiveModalVisible}
        onOk={handleIncentiveAwardSave}
        onCancel={() => setNationalIncentiveModalVisible(false)}
        width={600}
      >
        <Form form={nationalIncentiveForm} layout="vertical">
          <Form.Item
            name="no"
            label="奖项编号"
            rules={[{ required: true, message: '请输入奖项编号' }]}
          >
            <Input placeholder="如: A01, B02" />
          </Form.Item>
          
          <Form.Item
            name="title"
            label="奖项标题"
            rules={[{ required: true, message: '请输入奖项标题' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="nationalAllocation"
            label="国家级分配"
            rules={[{ required: true, message: '请输入国家级分配' }]}
          >
            <Input placeholder="如: 1, 3, 1**" />
          </Form.Item>
          
          <Form.Item
            name="areaAllocation"
            label="区域级分配"
            rules={[{ required: true, message: '请输入区域级分配' }]}
          >
            <Input placeholder="如: -, 1*, 1" />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              <Option value="open">开放中</Option>
              <Option value="closed">已关闭</Option>
              <Option value="completed">已完成</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="guidelines"
            label="指导原则"
          >
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AwardIndicatorManagement;
