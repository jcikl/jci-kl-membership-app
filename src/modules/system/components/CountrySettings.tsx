import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
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
  EnvironmentOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import ChapterLogoUpload from '@/modules/image/components/ChapterLogoUpload';
import ImageUpload from '@/modules/image/components/ImageUpload';
import { 
  getCountries
} from '@/modules/system/services/countryService';
import { 
  getNationalRegions, 
  createNationalRegion, 
  updateNationalRegion, 
  deleteNationalRegion,
  initializeDefaultMalaysianRegions
} from '@/modules/system/services/nationalRegionService';
import { 
  getLocalChapters,
  createLocalChapter,
  updateLocalChapter,
  deleteLocalChapter,
  initializeDefaultMalaysianChapters
} from '@/modules/system/services/localChapterService';
import { getWorldRegions } from '@/modules/system/services/worldRegionService';
import { getChapterSettings } from '@/modules/system/services/chapterSettingsService';
import type { Country, NationalRegion, WorldRegion, LocalChapter, ChapterSettings } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CountrySettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // 国家基本信息设置状态
  const [countrySettings, setCountrySettings] = useState<any>(null);
  const [currentCountryName, setCurrentCountryName] = useState<string>('');
  const [, setChapterSettings] = useState<ChapterSettings | null>(null);
  
  // 国家区域管理状态
  const [nationalRegions, setNationalRegions] = useState<NationalRegion[]>([]);
  const [nationalRegionModalVisible, setNationalRegionModalVisible] = useState(false);
  const [editingNationalRegion, setEditingNationalRegion] = useState<NationalRegion | null>(null);
  const [nationalRegionSaving, setNationalRegionSaving] = useState(false);
  
  // 地方分会管理状态
  const [localChapters, setLocalChapters] = useState<LocalChapter[]>([]);
  const [localChapterModalVisible, setLocalChapterModalVisible] = useState(false);
  const [editingLocalChapter, setEditingLocalChapter] = useState<LocalChapter | null>(null);
  const [localChapterSaving, setLocalChapterSaving] = useState(false);
  
  // 世界区域数据
  const [worldRegions, setWorldRegions] = useState<WorldRegion[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);

  // 加载所有数据
  const loadData = async () => {
    setLoading(true);
    try {
      const [regionsData, worldRegionsData, countriesData, chaptersData, chapterSettingsData] = await Promise.all([
        getNationalRegions(),
        getWorldRegions(),
        getCountries(),
        getLocalChapters(),
        getChapterSettings()
      ]);
      
      setNationalRegions(regionsData);
      setWorldRegions(worldRegionsData);
      setCountries(countriesData);
      setLocalChapters(chaptersData);
      setChapterSettings(chapterSettingsData);
      
      // 初始化国家基本信息设置
      if (!countrySettings) {
        const defaultSettings = {
          countryName: 'JCI Malaysia',
          countryCode: 'MY',
          description: 'Junior Chamber International Malaysia',
          establishmentYear: 1950,
          memberCount: 0,
          address: 'Kuala Lumpur, Malaysia',
          contactEmail: 'info@jci.org.my',
          contactPhone: '+60-3-1234-5678',
          website: 'https://jci.org.my',
          logoUrl: '',
        };
        
        // 如果分会设置存在，从中读取相关字段
        if (chapterSettingsData) {
          const settingsFromChapter = {
            countryName: defaultSettings.countryName, // 保持默认值
            countryCode: defaultSettings.countryCode, // 保持默认值
            description: chapterSettingsData.description || defaultSettings.description,
            establishmentYear: chapterSettingsData.establishmentYear || defaultSettings.establishmentYear,
            memberCount: defaultSettings.memberCount, // 会员数量保持默认值，因为分会设置中没有此字段
            address: chapterSettingsData.address || defaultSettings.address,
            contactEmail: chapterSettingsData.contactEmail || defaultSettings.contactEmail,
            contactPhone: chapterSettingsData.contactPhone || defaultSettings.contactPhone,
            website: chapterSettingsData.website || defaultSettings.website,
            logoUrl: defaultSettings.logoUrl, // 保持默认值
          };
          setCountrySettings(settingsFromChapter);
          form.setFieldsValue(settingsFromChapter);
          setCurrentCountryName(settingsFromChapter.countryName);
        } else {
          setCountrySettings(defaultSettings);
          form.setFieldsValue(defaultSettings);
          setCurrentCountryName(defaultSettings.countryName);
        }
      }
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

  // 国家基本信息设置函数
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      // 这里可以保存到数据库或本地存储
      setCountrySettings(values);
      message.success('国家基本信息保存成功');
      setHasUnsavedChanges(false);
    } catch (error) {
      message.error('保存国家基本信息失败');
      console.error('保存国家基本信息失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 检查表单是否有修改
  const hasChanges = () => {
    const currentValues = form.getFieldsValue();
    if (!countrySettings) return false;
    
    return Object.keys(currentValues).some(key => {
      const currentValue = currentValues[key];
      const originalValue = countrySettings[key];
      return currentValue !== originalValue;
    });
  };

  // 处理表单值变化
  const handleValuesChange = (changedValues: any) => {
    setHasUnsavedChanges(hasChanges());
    
    // 如果国家名字发生变化，更新当前国家名字
    if (changedValues.countryName !== undefined) {
      setCurrentCountryName(changedValues.countryName);
    }
  };

  // 国家区域管理函数
  const handleInitializeMalaysianRegions = async () => {
    try {
      const malaysia = countries.find(c => c.code === 'MY');
      if (malaysia) {
        await initializeDefaultMalaysianRegions(malaysia.id);
        message.success('默认马来西亚国家区域初始化成功');
        await loadData();
      } else {
        message.warning('请先创建马来西亚国家');
      }
    } catch (error) {
      message.error('初始化默认国家区域失败');
      console.error('初始化默认国家区域失败:', error);
    }
  };

  const openNationalRegionModal = (region?: NationalRegion) => {
    if (region) {
      setEditingNationalRegion(region);
      form.setFieldsValue(region);
    } else {
      setEditingNationalRegion(null);
      form.resetFields();
    }
    setNationalRegionModalVisible(true);
  };

  const closeNationalRegionModal = () => {
    setNationalRegionModalVisible(false);
    setEditingNationalRegion(null);
    form.resetFields();
  };

  const handleNationalRegionSave = async (values: any) => {
    setNationalRegionSaving(true);
    try {
      if (editingNationalRegion) {
        await updateNationalRegion(editingNationalRegion.id, values);
        message.success('国家区域更新成功');
      } else {
        await createNationalRegion(values);
        message.success('国家区域创建成功');
      }
      closeNationalRegionModal();
      await loadData();
    } catch (error) {
      message.error(editingNationalRegion ? '更新国家区域失败' : '创建国家区域失败');
      console.error('保存国家区域失败:', error);
    } finally {
      setNationalRegionSaving(false);
    }
  };

  const handleNationalRegionDelete = async (id: string) => {
    try {
      await deleteNationalRegion(id);
      message.success('国家区域删除成功');
      await loadData();
    } catch (error) {
      message.error('删除国家区域失败');
      console.error('删除国家区域失败:', error);
    }
  };

  // 地方分会管理函数
  const handleInitializeMalaysianChapters = async () => {
    try {
      await initializeDefaultMalaysianChapters();
      message.success('默认马来西亚地方分会初始化成功');
      await loadData();
    } catch (error) {
      message.error('初始化默认地方分会失败');
      console.error('初始化默认地方分会失败:', error);
    }
  };

  const openLocalChapterModal = (chapter?: LocalChapter) => {
    if (chapter) {
      setEditingLocalChapter(chapter);
      form.setFieldsValue(chapter);
    } else {
      setEditingLocalChapter(null);
      form.resetFields();
    }
    setLocalChapterModalVisible(true);
  };

  const closeLocalChapterModal = () => {
    setLocalChapterModalVisible(false);
    setEditingLocalChapter(null);
    form.resetFields();
  };

  const handleLocalChapterSave = async (values: any) => {
    setLocalChapterSaving(true);
    try {
      if (editingLocalChapter) {
        await updateLocalChapter(editingLocalChapter.id, values);
        message.success('地方分会更新成功');
      } else {
        await createLocalChapter(values);
        message.success('地方分会创建成功');
      }
      closeLocalChapterModal();
      await loadData();
    } catch (error) {
      message.error(editingLocalChapter ? '更新地方分会失败' : '创建地方分会失败');
      console.error('保存地方分会失败:', error);
    } finally {
      setLocalChapterSaving(false);
    }
  };

  const handleLocalChapterDelete = async (id: string) => {
    try {
      await deleteLocalChapter(id);
      message.success('地方分会删除成功');
      await loadData();
    } catch (error) {
      message.error('删除地方分会失败');
      console.error('删除地方分会失败:', error);
    }
  };

  // 获取世界区域名称
  const getWorldRegionName = (regionId?: string) => {
    if (!regionId) return '未分配';
    const region = worldRegions.find(r => r.id === regionId);
    return region ? region.name : regionId;
  };

  // 根据国家名称获取所属世界区域
  const getWorldRegionByCountryName = (countryName: string) => {
    // 从总部设置的国家管理中查找对应的国家
    const country = countries.find(c => c.name === countryName);
    if (country && country.worldRegionId) {
      return getWorldRegionName(country.worldRegionId);
    }
    return '未分配';
  };

  // 获取国家名称
  const getCountryName = (countryId?: string) => {
    if (!countryId) return '未分配';
    const country = countries.find(c => c.id === countryId);
    return country ? country.name : countryId;
  };

  // 获取国家区域名称
  const getNationalRegionName = (regionId?: string) => {
    if (!regionId) return '未分配';
    const region = nationalRegions.find(r => r.id === regionId);
    return region ? region.name : regionId;
  };

  // 地方分会表格列
  const localChapterColumns = [
    {
      title: '分会名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: LocalChapter) => (
        <Space>
          <TeamOutlined />
          <span>{text}</span>
          <Tag color="blue">{record.code}</Tag>
        </Space>
      ),
    },
    {
      title: '分会代码',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: '所属国家区域',
      dataIndex: 'nationalRegionId',
      key: 'nationalRegionId',
      render: (regionId: string) => (
        <Tag color="green">{getNationalRegionName(regionId)}</Tag>
      ),
    },
    {
      title: '成立年份',
      dataIndex: 'establishmentYear',
      key: 'establishmentYear',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap = {
          active: { color: 'green', text: '活跃' },
          inactive: { color: 'orange', text: '非活跃' },
          suspended: { color: 'red', text: '暂停' },
        };
        const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '会员数量',
      dataIndex: 'memberCount',
      key: 'memberCount',
      width: 100,
      render: (count: number) => (
        <Tag color="purple">{count || 0} 人</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: LocalChapter) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openLocalChapterModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个地方分会吗？"
            onConfirm={() => handleLocalChapterDelete(record.id)}
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

  // 渲染国家基本信息设置
  const renderCountryBasicSettings = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Title level={4} style={{ margin: 0 }}>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          国家基本信息设置
          {hasUnsavedChanges && (
            <Text type="warning" style={{ marginLeft: 8, fontSize: 14 }}>
              (有未保存的修改)
            </Text>
          )}
        </Title>
        <Text type="secondary">
          配置JCI国家的基本信息，包括国家名字、联系方式等
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
          <Col span={8}>
            <Form.Item
              name="countryName"
              label="国家名字"
              rules={[
                { required: true, message: '请输入国家名字' },
                { max: 100, message: '国家名字不能超过100个字符' }
              ]}
            >
              <Input placeholder="请输入国家名字，如：JCI Malaysia" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="countryCode"
              label="国家代码"
              rules={[
                { required: true, message: '请输入国家代码' },
                { max: 10, message: '国家代码不能超过10个字符' }
              ]}
            >
              <Input placeholder="请输入国家代码，如：MY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="所属世界区域">
              <div style={{ 
                padding: '8px 12px', 
                border: '1px solid #d9d9d9', 
                borderRadius: '6px',
                backgroundColor: '#fafafa',
                minHeight: '32px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '14px',
                color: '#666'
              }}>
                {currentCountryName 
                  ? getWorldRegionByCountryName(currentCountryName)
                  : '请先输入国家名字'
                }
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={24}>
            <Form.Item
              name="description"
              label="国家简介"
              rules={[
                { max: 500, message: '国家简介不能超过500个字符' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="请输入国家简介，描述JCI在该国的使命、愿景等"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={24}>
          <Col span={12}>
            <Form.Item
              name="establishmentYear"
              label="成立年份"
              rules={[
                { type: 'number', min: 1900, max: new Date().getFullYear(), message: '请输入有效的年份' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入成立年份"
                min={1900}
                max={new Date().getFullYear()}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="memberCount"
              label="会员数量"
              rules={[
                { type: 'number', min: 0, message: '会员数量不能小于0' }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入会员数量"
                min={0}
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
          <Col span={12}>
            <Form.Item
              name="address"
              label="国家地址"
              rules={[
                { max: 200, message: '国家地址不能超过200个字符' }
              ]}
            >
              <Input placeholder="请输入国家地址" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">国家标识</Divider>

        <Row gutter={24}>
          <Col span={24}>
            <Form.Item
              name="logoUrl"
              label="国家Logo"
              extra="支持 JPG、PNG、GIF 格式，最大 5MB，系统会根据比例自动缩放到合适尺寸"
            >
              <ImageUpload
                placeholder="点击上传国家Logo"
                maxSize={5}
                accept="image/*"
                storagePath="country-logos"
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

  // 国家区域表格列
  const nationalRegionColumns = [
    {
      title: '区域名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: NationalRegion) => (
        <Space>
          <EnvironmentOutlined />
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
      title: '所属国家',
      dataIndex: 'countryId',
      key: 'countryId',
      render: (countryId: string) => (
        <Tag color="green">{getCountryName(countryId)}</Tag>
      ),
    },
    {
      title: '覆盖分会数量',
      dataIndex: 'chapters',
      key: 'chapters',
      render: (chapters: string[]) => (
        <Tag color="orange">{chapters.length} 个分会</Tag>
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
      render: (_: any, record: NationalRegion) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openNationalRegionModal(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个国家区域吗？"
            onConfirm={() => handleNationalRegionDelete(record.id)}
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


  // 渲染国家区域管理
  const renderNationalRegionManagement = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <EnvironmentOutlined style={{ marginRight: 8 }} />
            国家区域管理
          </Title>
          <Text type="secondary">
            管理各国JCI区域，包括马来西亚的中央、南部、北部、沙巴、砂拉越等区域
          </Text>
        </Col>
        <Col>
          <Space>
            {nationalRegions.length === 0 && (
              <Button
                type="dashed"
                onClick={handleInitializeMalaysianRegions}
                loading={loading}
              >
                初始化马来西亚区域
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openNationalRegionModal()}
            >
              新增国家区域
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        columns={nationalRegionColumns}
        dataSource={nationalRegions}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个国家区域`,
        }}
      />
    </Space>
  );

  // 渲染地方分会管理
  const renderLocalChapterManagement = () => (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <TeamOutlined style={{ marginRight: 8 }} />
            地方分会管理
          </Title>
          <Text type="secondary">
            管理各国JCI地方分会，包括吉隆坡、新山、槟城等分会
          </Text>
        </Col>
        <Col>
          <Space>
            {localChapters.length === 0 && (
              <Button
                type="dashed"
                onClick={handleInitializeMalaysianChapters}
                loading={loading}
              >
                初始化马来西亚分会
              </Button>
            )}
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openLocalChapterModal()}
            >
              新增地方分会
            </Button>
          </Space>
        </Col>
      </Row>

      <Table
        columns={localChapterColumns}
        dataSource={localChapters}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个地方分会`,
        }}
      />
    </Space>
  );

  return (
    <Card>
      <Tabs
        defaultActiveKey="country-basic-settings"
        size="large"
        items={[
          {
            key: 'country-basic-settings',
            label: (
              <span>
                <InfoCircleOutlined />
                国家基本信息设置
              </span>
            ),
            children: renderCountryBasicSettings()
          },
          {
            key: 'national-regions',
            label: (
              <span>
                <EnvironmentOutlined />
                国家区域管理
              </span>
            ),
            children: renderNationalRegionManagement()
          },
          {
            key: 'local-chapters',
            label: (
              <span>
                <TeamOutlined />
                地方分会管理
              </span>
            ),
            children: renderLocalChapterManagement()
          }
        ]}
      />


      {/* 国家区域编辑模态框 */}
      <Modal
        title={editingNationalRegion ? '编辑国家区域' : '新增国家区域'}
        open={nationalRegionModalVisible}
        onCancel={closeNationalRegionModal}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleNationalRegionSave}
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
                <Input placeholder="如：JCI Malaysia Area Central" />
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
                <Input placeholder="如：MY-C" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="countryId"
            label="所属国家"
            rules={[
              { required: true, message: '请选择所属国家' }
            ]}
            extra="选择国家后，该区域将归属于该国家"
          >
            <Select
              placeholder="选择国家"
            >
              {countries.map(country => (
                <Option key={country.id} value={country.id}>
                  {country.name} ({country.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

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
              <Button onClick={closeNationalRegionModal}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={nationalRegionSaving}
              >
                {editingNationalRegion ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 地方分会编辑模态框 */}
      <Modal
        title={editingLocalChapter ? '编辑地方分会' : '新增地方分会'}
        open={localChapterModalVisible}
        onCancel={closeLocalChapterModal}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleLocalChapterSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="分会名称"
                rules={[
                  { required: true, message: '请输入分会名称' },
                  { max: 100, message: '分会名称不能超过100个字符' }
                ]}
              >
                <Input placeholder="如：JCI Kuala Lumpur" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="分会代码"
                rules={[
                  { required: true, message: '请输入分会代码' },
                  { max: 20, message: '分会代码不能超过20个字符' }
                ]}
              >
                <Input placeholder="如：KL" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nationalRegionId"
                label="所属国家区域"
                rules={[
                  { required: true, message: '请选择所属国家区域' }
                ]}
                extra="选择国家区域后，该分会将归属于该区域"
              >
                <Select
                  placeholder="选择国家区域"
                >
                  {nationalRegions.map(region => (
                    <Option key={region.id} value={region.id}>
                      {region.name} ({region.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="establishmentYear"
                label="成立年份"
                rules={[
                  { required: true, message: '请输入成立年份' },
                  { type: 'number', min: 1900, max: new Date().getFullYear(), message: '请输入有效的年份' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="如：1950"
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="分会状态"
                rules={[
                  { required: true, message: '请选择分会状态' }
                ]}
              >
                <Select placeholder="选择分会状态">
                  <Option value="active">活跃</Option>
                  <Option value="inactive">非活跃</Option>
                  <Option value="suspended">暂停</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="memberCount"
                label="会员数量"
                rules={[
                  { type: 'number', min: 0, message: '会员数量不能小于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="如：50"
                  min={0}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="分会描述"
            rules={[
              { max: 500, message: '分会描述不能超过500个字符' }
            ]}
          >
            <TextArea
              rows={3}
              placeholder="请输入分会描述"
            />
          </Form.Item>

          <Divider orientation="left">联系信息</Divider>

          <Row gutter={16}>
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

          <Row gutter={16}>
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
            <Col span={12}>
              <Form.Item
                name="address"
                label="分会地址"
                rules={[
                  { max: 200, message: '分会地址不能超过200个字符' }
                ]}
              >
                <Input placeholder="请输入分会地址" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">分会标识</Divider>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="logoUrl"
                label="分会Logo"
                extra="支持 JPG、PNG、GIF 格式，最大 5MB，系统会根据比例自动缩放到合适尺寸"
              >
                <ChapterLogoUpload
                  placeholder="点击上传分会Logo"
                  maxSize={5}
                  enableCompression={true}
                  targetSize={{ width: 200, height: 200 }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeLocalChapterModal}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={localChapterSaving}
              >
                {editingLocalChapter ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default CountrySettings;
