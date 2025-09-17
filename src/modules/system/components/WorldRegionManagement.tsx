import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
  Space,
  Typography,
  Tag,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { 
  getWorldRegions, 
  createWorldRegion, 
  updateWorldRegion, 
  deleteWorldRegion,
  initializeDefaultWorldRegions 
} from '@/modules/system/services/worldRegionService';
import { getCountries } from '@/modules/system/services/countryService';
import type { WorldRegion } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const WorldRegionManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [regions, setRegions] = useState<WorldRegion[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRegion, setEditingRegion] = useState<WorldRegion | null>(null);
  const [saving, setSaving] = useState(false);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [regionsData, countriesData] = await Promise.all([
        getWorldRegions(),
        getCountries()
      ]);
      setRegions(regionsData);
      setCountries(countriesData);
    } catch (error) {
      message.error('加载数据失败');
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 初始化默认区域
  const handleInitializeDefaults = async () => {
    try {
      await initializeDefaultWorldRegions();
      message.success('默认世界区域初始化成功');
      await loadData();
    } catch (error) {
      message.error('初始化默认区域失败');
      console.error('初始化默认区域失败:', error);
    }
  };

  // 打开新增/编辑模态框
  const openModal = (region?: WorldRegion) => {
    if (region) {
      setEditingRegion(region);
      form.setFieldsValue(region);
    } else {
      setEditingRegion(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setEditingRegion(null);
    form.resetFields();
  };

  // 保存区域
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      if (editingRegion) {
        await updateWorldRegion(editingRegion.id, values);
        message.success('世界区域更新成功');
      } else {
        await createWorldRegion(values);
        message.success('世界区域创建成功');
      }
      closeModal();
      await loadData();
    } catch (error) {
      message.error(editingRegion ? '更新世界区域失败' : '创建世界区域失败');
      console.error('保存世界区域失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 删除区域
  const handleDelete = async (id: string) => {
    try {
      await deleteWorldRegion(id);
      message.success('世界区域删除成功');
      await loadData();
    } catch (error) {
      message.error('删除世界区域失败');
      console.error('删除世界区域失败:', error);
    }
  };

  // 获取区域覆盖的国家名称
  const getCountryNames = (countryIds: string[]) => {
    return countryIds.map(id => {
      const country = countries.find(c => c.id === id);
      return country ? country.name : id;
    });
  };

  const columns = [
    {
      title: '区域名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: WorldRegion) => (
        <Space>
          <GlobalOutlined />
          <span>{text}</span>
          <Tag color="blue">{record.code}</Tag>
        </Space>
      ),
    },
    {
      title: '区域代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '覆盖国家',
      dataIndex: 'countries',
      key: 'countries',
      render: (countryIds: string[]) => (
        <Space wrap>
          {countryIds.length > 0 ? (
            getCountryNames(countryIds).map((name, index) => (
              <Tag key={index} color="green">{name}</Tag>
            ))
          ) : (
            <Text type="secondary">暂无</Text>
          )}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: WorldRegion) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个世界区域吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <GlobalOutlined style={{ marginRight: 8 }} />
              世界区域管理
            </Title>
            <Text type="secondary">
              管理JCI世界区域，包括AMEC、ASPAC、Europe、America等区域
            </Text>
          </Col>
          <Col>
            <Space>
              {regions.length === 0 && (
                <Button
                  type="dashed"
                  onClick={handleInitializeDefaults}
                  loading={loading}
                >
                  初始化默认区域
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                新增区域
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={regions}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个区域`,
          }}
        />

        <Modal
          title={editingRegion ? '编辑世界区域' : '新增世界区域'}
          open={modalVisible}
          onCancel={closeModal}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="区域名称"
                  rules={[
                    { required: true, message: '请输入区域名称' },
                    { max: 100, message: '区域名称不能超过100个字符' }
                  ]}
                >
                  <Input placeholder="如：JCI Asia and the Pacific (JCI ASPAC)" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="区域代码"
                  rules={[
                    { required: true, message: '请输入区域代码' },
                    { max: 20, message: '区域代码不能超过20个字符' }
                  ]}
                >
                  <Input placeholder="如：ASPAC" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="区域描述"
              rules={[
                { max: 500, message: '区域描述不能超过500个字符' }
              ]}
            >
              <TextArea
                rows={3}
                placeholder="请输入区域描述"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
              <Space>
                <Button onClick={closeModal}>
                  取消
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saving}
                >
                  {editingRegion ? '更新' : '创建'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Card>
  );
};

export default WorldRegionManagement;
