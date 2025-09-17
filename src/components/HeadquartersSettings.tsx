import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Tabs,
  Table,
  Modal,
  Select,
  Popconfirm,
  Tag,
} from 'antd';
import {
  SaveOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GlobalOutlined,
  FlagOutlined,
} from '@ant-design/icons';
import ImageUpload from './ImageUpload';
import { getHeadquartersSettings, saveHeadquartersSettings, getDefaultHeadquartersSettings } from '@/services/headquartersSettingsService';
import { 
  getWorldRegions, 
  createWorldRegion, 
  updateWorldRegion, 
  deleteWorldRegion,
  initializeDefaultWorldRegions 
} from '@/services/worldRegionService';
import { 
  getCountries, 
  createCountry, 
  updateCountry, 
  deleteCountry,
  initializeDefaultCountries 
} from '@/services/countryService';
import type { HeadquartersSettings, WorldRegion, Country } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const HeadquartersSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<HeadquartersSettings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 世界区域管理状态
  const [worldRegions, setWorldRegions] = useState<WorldRegion[]>([]);
  const [worldRegionModalVisible, setWorldRegionModalVisible] = useState(false);
  const [editingWorldRegion, setEditingWorldRegion] = useState<WorldRegion | null>(null);
  const [worldRegionSaving, setWorldRegionSaving] = useState(false);
  
  // 国家管理状态
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [countrySaving, setCountrySaving] = useState(false);

  // 加载所有数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [headquartersData, regionsData, countriesData] = await Promise.all([
        getHeadquartersSettings(),
        getWorldRegions(),
        getCountries()
      ]);
      
      setWorldRegions(regionsData);
      setCountries(countriesData);
      
      if (headquartersData) {
        setSettings(headquartersData);
        form.setFieldsValue(headquartersData);
      } else {
        // 如果没有设置，使用默认值
        const defaultSettings = getDefaultHeadquartersSettings();
        form.setFieldsValue(defaultSettings);
      }
      setHasUnsavedChanges(false);
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

  // 保存设置
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      await saveHeadquartersSettings(values);
      
      message.success('总部设置保存成功');
      
      setHasUnsavedChanges(false);
      await loadData();
    } catch (error) {
      message.error('保存总部设置失败');
      console.error('保存总部设置失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 检查表单是否有修改
  const hasChanges = () => {
    const currentValues = form.getFieldsValue();
    if (!settings) return false;
    
    return Object.keys(currentValues).some(key => {
      const currentValue = currentValues[key];
      const originalValue = settings[key as keyof HeadquartersSettings];
      return currentValue !== originalValue;
    });
  };

  // 处理表单值变化
  const handleValuesChange = () => {
    setHasUnsavedChanges(hasChanges());
  };

  // 世界区域管理函数
  const handleInitializeWorldRegions = async () => {
    try {
      await initializeDefaultWorldRegions();
      message.success('默认世界区域初始化成功');
      await loadData();
    } catch (error) {
      message.error('初始化默认区域失败');
      console.error('初始化默认区域失败:', error);
    }
  };

  const openWorldRegionModal = (region?: WorldRegion) => {
    if (region) {
      setEditingWorldRegion(region);
      form.setFieldsValue(region);
    } else {
      setEditingWorldRegion(null);
      form.resetFields();
    }
    setWorldRegionModalVisible(true);
  };

  const closeWorldRegionModal = () => {
    setWorldRegionModalVisible(false);
    setEditingWorldRegion(null);
    form.resetFields();
  };

  const handleWorldRegionSave = async (values: any) => {
    setWorldRegionSaving(true);
    try {
      if (editingWorldRegion) {
        await updateWorldRegion(editingWorldRegion.id, values);
        message.success('世界区域更新成功');
      } else {
        await createWorldRegion(values);
        message.success('世界区域创建成功');
      }
      closeWorldRegionModal();
      await loadData();
    } catch (error) {
      message.error(editingWorldRegion ? '更新世界区域失败' : '创建世界区域失败');
      console.error('保存世界区域失败:', error);
    } finally {
      setWorldRegionSaving(false);
    }
  };

  const handleWorldRegionDelete = async (id: string) => {
    try {
      await deleteWorldRegion(id);
      message.success('世界区域删除成功');
      await loadData();
    } catch (error) {
      message.error('删除世界区域失败');
      console.error('删除世界区域失败:', error);
    }
  };

  // 国家管理函数
  const handleInitializeCountries = async () => {
    try {
      await initializeDefaultCountries();
      message.success('默认国家初始化成功');
      await loadData();
    } catch (error) {
      message.error('初始化默认国家失败');
      console.error('初始化默认国家失败:', error);
    }
  };

  const openCountryModal = (country?: Country) => {
    if (country) {
      setEditingCountry(country);
      form.setFieldsValue(country);
    } else {
      setEditingCountry(null);
      form.resetFields();
    }
    setCountryModalVisible(true);
  };

  const closeCountryModal = () => {
    setCountryModalVisible(false);
    setEditingCountry(null);
    form.resetFields();
  };

  const handleCountrySave = async (values: any) => {
    setCountrySaving(true);
    try {
      if (editingCountry) {
        await updateCountry(editingCountry.id, values);
        message.success('国家更新成功');
      } else {
        await createCountry(values);
        message.success('国家创建成功');
      }
      closeCountryModal();
      await loadData();
    } catch (error) {
      message.error(editingCountry ? '更新国家失败' : '创建国家失败');
      console.error('保存国家失败:', error);
    } finally {
      setCountrySaving(false);
    }
  };

  const handleCountryDelete = async (id: string) => {
    try {
      await deleteCountry(id);
      message.success('国家删除成功');
      await loadData();
    } catch (error) {
      message.error('删除国家失败');
      console.error('删除国家失败:', error);
    }
  };

  // 同步世界区域的覆盖国家数据
  const syncWorldRegionCountries = async () => {
    try {
      for (const region of worldRegions) {
        const regionCountries = countries.filter(c => c.worldRegionId === region.id);
        const countryIds = regionCountries.map(c => c.id);
        
        // 只有当countries字段为空或与实际情况不符时才更新
        if (!region.countries || region.countries.length !== countryIds.length) {
          await updateWorldRegion(region.id, { countries: countryIds });
        }
      }
      message.success('世界区域覆盖国家数据同步完成');
      await loadData();
    } catch (error) {
      message.error('同步世界区域数据失败');
      console.error('同步世界区域数据失败:', error);
    }
  };

  // 获取区域覆盖的国家名称
  const getCountryNames = (countryIds: string[]) => {
    if (!countryIds || countryIds.length === 0) {
      return [];
    }
    return countryIds.map(id => {
      const country = countries.find(c => c.id === id);
      return country ? country.name : id;
    });
  };

  // 根据世界区域ID获取覆盖的国家
  const getCountriesByWorldRegion = (worldRegionId: string) => {
    return countries.filter(country => country.worldRegionId === worldRegionId);
  };

  // 获取世界区域名称
  const getWorldRegionName = (regionId?: string) => {
    if (!regionId) return '未分配';
    const region = worldRegions.find(r => r.id === regionId);
    return region ? region.name : regionId;
  };

  // 世界区域表格列
  const worldRegionColumns = [
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
      render: (countryIds: string[], record: WorldRegion) => {
        // 优先使用countries字段，如果为空则动态计算
        let displayCountries = countryIds && countryIds.length > 0 
          ? getCountryNames(countryIds) 
          : getCountriesByWorldRegion(record.id).map(c => c.name);
        
        return (
          <Space wrap>
            {displayCountries.length > 0 ? (
              displayCountries.map((name, index) => (
                <Tag key={index} color="green">{name}</Tag>
              ))
            ) : (
              <Text type="secondary">暂无</Text>
            )}
          </Space>
        );
      },
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
            onClick={() => openWorldRegionModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个世界区域吗？"
            onConfirm={() => handleWorldRegionDelete(record.id)}
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

  // 国家表格列
  const countryColumns = [
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
            onClick={() => openCountryModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个国家吗？"
            onConfirm={() => handleCountryDelete(record.id)}
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

  // 渲染总部基本信息设置
  const renderHeadquartersSettings = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={4} style={{ margin: 0 }}>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          总部基本信息设置
          {hasUnsavedChanges && (
            <Text type="warning" style={{ marginLeft: 8, fontSize: 14 }}>
              (有未保存的修改)
            </Text>
          )}
        </Title>
        <Text type="secondary">
          配置JCI总部的基本信息，包括总部名字、联系方式等
        </Text>
      </div>

      <Divider />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        onValuesChange={handleValuesChange}
        disabled={loading}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="总部名字"
              rules={[
                { required: true, message: '请输入总部名字' },
                { max: 100, message: '总部名字不能超过100个字符' }
              ]}
            >
              <Input placeholder="请输入总部名字，如：JCI Headquarters" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="website"
              label="官方网站"
              rules={[
                { type: 'url', message: '请输入有效的网址' }
              ]}
            >
              <Input placeholder="请输入官方网站地址" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={24}>
            <Form.Item
              name="description"
              label="总部简介"
              rules={[
                { max: 500, message: '总部简介不能超过500个字符' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="请输入总部简介，描述JCI的使命、愿景等"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">联系信息</Divider>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="contactEmail"
              label="联系邮箱"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入联系邮箱" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="联系电话"
              rules={[
                { max: 20, message: '联系电话不能超过20个字符' }
              ]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={24}>
            <Form.Item
              name="address"
              label="总部地址"
              rules={[
                { max: 200, message: '总部地址不能超过200个字符' }
              ]}
            >
              <Input placeholder="请输入总部地址" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">总部标识</Divider>

        <Row gutter={24}>
          <Col span={24}>
            <Form.Item
              name="logoUrl"
              label="总部Logo"
              extra="支持 JPG、PNG、GIF 格式，最大 5MB，系统会根据比例自动缩放到合适尺寸"
            >
              <ImageUpload
                placeholder="点击上传总部Logo"
                maxSize={5}
                accept="image/*"
                storagePath="headquarters-logos"
                enableCompression={true}
                targetSize={{ width: 200, height: 200 }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={loading || !hasUnsavedChanges}
          >
            {hasUnsavedChanges ? '保存修改' : '已保存'}
          </Button>
        </Form.Item>
      </Form>
    </Space>
  );

  // 渲染世界区域管理
  const renderWorldRegionManagement = () => (
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
            {worldRegions.length === 0 && (
              <Button
                type="dashed"
                onClick={handleInitializeWorldRegions}
                loading={loading}
              >
                初始化默认区域
              </Button>
            )}
            {worldRegions.length > 0 && (
              <Button
                type="default"
                onClick={syncWorldRegionCountries}
                loading={loading}
              >
                同步覆盖国家
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openWorldRegionModal()}
            >
              新增区域
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        columns={worldRegionColumns}
        dataSource={worldRegions}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个区域`,
        }}
      />
    </Space>
  );

  // 渲染国家管理
  const renderCountryManagement = () => (
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
                onClick={handleInitializeCountries}
                loading={loading}
              >
                初始化默认国家
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openCountryModal()}
            >
              新增国家
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        columns={countryColumns}
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
    </Space>
  );

  return (
    <Card>
      <Tabs
        defaultActiveKey="headquarters"
        size="large"
        items={[
          {
            key: 'headquarters',
            label: (
              <span>
                <InfoCircleOutlined />
                总部设置
              </span>
            ),
            children: renderHeadquartersSettings()
          },
           {
             key: 'world-regions',
             label: (
               <span>
                 <GlobalOutlined />
                 世界区域管理
               </span>
             ),
             children: renderWorldRegionManagement()
           },
           {
             key: 'countries',
             label: (
               <span>
                 <FlagOutlined />
                 国家管理
               </span>
             ),
             children: renderCountryManagement()
           }
        ]}
      />

      {/* 世界区域编辑模态框 */}
      <Modal
        title={editingWorldRegion ? '编辑世界区域' : '新增世界区域'}
        open={worldRegionModalVisible}
        onCancel={closeWorldRegionModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleWorldRegionSave}
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
              <Button onClick={closeWorldRegionModal}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={worldRegionSaving}
              >
                {editingWorldRegion ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 国家编辑模态框 */}
      <Modal
        title={editingCountry ? '编辑国家' : '新增国家'}
        open={countryModalVisible}
        onCancel={closeCountryModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCountrySave}
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
              <Button onClick={closeCountryModal}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={countrySaving}
              >
                {editingCountry ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default HeadquartersSettings;
