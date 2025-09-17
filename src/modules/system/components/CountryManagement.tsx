import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
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
  FlagOutlined,
} from '@ant-design/icons';
import { 
  getCountries, 
  createCountry, 
  updateCountry, 
  deleteCountry,
  initializeDefaultCountries 
} from '@/modules/system/services/countryService';
import { getWorldRegions } from '@/modules/system/services/worldRegionService';
import type { Country } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

const CountryManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [countries, setCountries] = useState<Country[]>([]);
  const [worldRegions, setWorldRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [saving, setSaving] = useState(false);

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [countriesData, regionsData] = await Promise.all([
        getCountries(),
        getWorldRegions()
      ]);
      setCountries(countriesData);
      setWorldRegions(regionsData);
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

  // 初始化默认国家
  const handleInitializeDefaults = async () => {
    try {
      await initializeDefaultCountries();
      message.success('默认国家初始化成功');
      await loadData();
    } catch (error) {
      message.error('初始化默认国家失败');
      console.error('初始化默认国家失败:', error);
    }
  };

  // 打开新增/编辑模态框
  const openModal = (country?: Country) => {
    if (country) {
      setEditingCountry(country);
      form.setFieldsValue(country);
    } else {
      setEditingCountry(null);
      form.resetFields();
    }
    setModalVisible(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalVisible(false);
    setEditingCountry(null);
    form.resetFields();
  };

  // 保存国家
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      if (editingCountry) {
        await updateCountry(editingCountry.id, values);
        message.success('国家更新成功');
      } else {
        await createCountry(values);
        message.success('国家创建成功');
      }
      closeModal();
      await loadData();
    } catch (error) {
      message.error(editingCountry ? '更新国家失败' : '创建国家失败');
      console.error('保存国家失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 删除国家
  const handleDelete = async (id: string) => {
    try {
      await deleteCountry(id);
      message.success('国家删除成功');
      await loadData();
    } catch (error) {
      message.error('删除国家失败');
      console.error('删除国家失败:', error);
    }
  };

  // 获取世界区域名称
  const getWorldRegionName = (regionId?: string) => {
    if (!regionId) return '未分配';
    const region = worldRegions.find(r => r.id === regionId);
    return region ? region.name : regionId;
  };

  const columns = [
    {
      title: '国家名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Country) => (
        <Space>
          <FlagOutlined />
          <span>{text}</span>
          <Tag color="blue">{record.code}</Tag>
        </Space>
      ),
    },
    {
      title: '国家代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '所属世界区域',
      dataIndex: 'worldRegionId',
      key: 'worldRegionId',
      render: (regionId: string) => (
        <Tag color="green">{getWorldRegionName(regionId)}</Tag>
      ),
    },
    {
      title: '国家区域数量',
      dataIndex: 'nationalRegions',
      key: 'nationalRegions',
      render: (regions: string[]) => (
        <Tag color="orange">{regions.length} 个区域</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: Country) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个国家吗？"
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
              <FlagOutlined style={{ marginRight: 8 }} />
              国家管理
            </Title>
            <Text type="secondary">
              管理JCI成员国，包括马来西亚、新加坡、中国等国家
            </Text>
          </Col>
          <Col>
            <Space>
              {countries.length === 0 && (
                <Button
                  type="dashed"
                  onClick={handleInitializeDefaults}
                  loading={loading}
                >
                  初始化默认国家
                </Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
              >
                新增国家
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={countries}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个国家`,
          }}
        />

        <Modal
          title={editingCountry ? '编辑国家' : '新增国家'}
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
                  label="国家名称"
                  rules={[
                    { required: true, message: '请输入国家名称' },
                    { max: 100, message: '国家名称不能超过100个字符' }
                  ]}
                >
                  <Input placeholder="如：Malaysia" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="code"
                  label="国家代码"
                  rules={[
                    { required: true, message: '请输入国家代码' },
                    { max: 10, message: '国家代码不能超过10个字符' }
                  ]}
                >
                  <Input placeholder="如：MY" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="worldRegionId"
              label="所属世界区域"
              extra="选择世界区域后，该国家将归属于该区域"
            >
              <Select
                placeholder="选择世界区域"
                allowClear
              >
                {worldRegions.map(region => (
                  <Option key={region.id} value={region.id}>
                    {region.name} ({region.code})
                  </Option>
                ))}
              </Select>
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
                  {editingCountry ? '更新' : '创建'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Space>
    </Card>
  );
};

export default CountryManagement;
