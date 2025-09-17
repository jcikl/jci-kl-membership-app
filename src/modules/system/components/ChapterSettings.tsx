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
  Select,
} from 'antd';
import {
  SaveOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import ChapterLogoUpload from '@/modules/image/components/ChapterLogoUpload';
import { getChapterSettings, saveChapterSettings, getDefaultChapterSettings } from '@/modules/system/services/chapterSettingsService';
import { getWorldRegions } from '@/modules/system/services/worldRegionService';
import { getCountries } from '@/modules/system/services/countryService';
import { getNationalRegions } from '@/modules/system/services/nationalRegionService';
import type { ChapterSettings as ChapterSettingsType } from '@/types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ChapterSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ChapterSettingsType | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [worldRegions, setWorldRegions] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [nationalRegions, setNationalRegions] = useState<any[]>([]);
  const [filteredCountries, setFilteredCountries] = useState<any[]>([]);
  const [filteredNationalRegions, setFilteredNationalRegions] = useState<any[]>([]);

  // 加载分会设置
  const loadSettings = async () => {
    setLoading(true);
    try {
      const [data, regionsData, countriesData, nationalRegionsData] = await Promise.all([
        getChapterSettings(),
        getWorldRegions(),
        getCountries(),
        getNationalRegions()
      ]);
      
      // 调试信息
      console.log('数据加载完成:', {
        worldRegions: regionsData.length,
        countries: countriesData.length,
        nationalRegions: nationalRegionsData.length,
        chapterData: data ? '已加载' : '未加载'
      });

      // 检查数据结构
      if (regionsData.length > 0) {
        console.log('世界区域示例:', regionsData[0]);
      }
      if (countriesData.length > 0) {
        console.log('国家示例:', countriesData[0]);
      }
      if (nationalRegionsData.length > 0) {
        console.log('国家区域示例:', nationalRegionsData[0]);
      }
      
      setWorldRegions(regionsData);
      setCountries(countriesData);
      setNationalRegions(nationalRegionsData);
      
      // 初始化筛选后的数据
      setFilteredCountries(countriesData);
      setFilteredNationalRegions(nationalRegionsData);
      
      if (data) {
        setSettings(data);
        
        // 根据已选择的值进行筛选
        if (data.worldRegionId) {
          console.log('根据世界区域筛选国家:', data.worldRegionId);
          filterCountriesByWorldRegion(data.worldRegionId);
        }
        if (data.countryId) {
          console.log('根据国家筛选国家区域:', data.countryId);
          filterNationalRegionsByCountry(data.countryId);
        }
        
        // 延迟设置表单值，确保筛选完成后再设置
        setTimeout(() => {
          console.log('设置表单值:', data);
          form.setFieldsValue(data);
        }, 200);
      } else {
        // 如果没有设置，使用默认值
        const defaultSettings = getDefaultChapterSettings();
        console.log('使用默认设置:', defaultSettings);
        form.setFieldsValue(defaultSettings);
      }
      setHasUnsavedChanges(false); // 重置修改状态
    } catch (error) {
      message.error('加载分会设置失败');
      console.error('加载分会设置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // 保存设置
  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      await saveChapterSettings(values);
      
      message.success('分会设置保存成功');
      
      setHasUnsavedChanges(false); // 重置修改状态
      await loadSettings(); // 重新加载设置
    } catch (error) {
      message.error('保存分会设置失败');
      console.error('保存分会设置失败:', error);
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
      const originalValue = settings[key as keyof ChapterSettingsType];
      return currentValue !== originalValue;
    });
  };

  // 根据世界区域筛选国家
  const filterCountriesByWorldRegion = (worldRegionId: string) => {
    if (!worldRegionId || !countries.length) {
      console.log('筛选国家: 参数无效或数据未加载');
      setFilteredCountries([]);
      return;
    }
    
    const filtered = countries.filter(country => 
      country.worldRegionId === worldRegionId
    );
    console.log(`筛选国家: 世界区域ID ${worldRegionId}, 找到 ${filtered.length} 个国家`);
    filtered.forEach(country => {
      console.log(`  - ${country.name} (${country.id})`);
    });
    setFilteredCountries(filtered);
  };

  // 根据国家筛选国家区域
  const filterNationalRegionsByCountry = (countryId: string) => {
    if (!countryId || !nationalRegions.length) {
      console.log('筛选国家区域: 参数无效或数据未加载');
      setFilteredNationalRegions([]);
      return;
    }
    
    const filtered = nationalRegions.filter(region => 
      region.countryId === countryId
    );
    console.log(`筛选国家区域: 国家ID ${countryId}, 找到 ${filtered.length} 个区域`);
    filtered.forEach(region => {
      console.log(`  - ${region.name} (${region.id})`);
    });
    setFilteredNationalRegions(filtered);
  };

  // 处理世界区域变化
  const handleWorldRegionChange = (worldRegionId: string) => {
    // 筛选国家
    filterCountriesByWorldRegion(worldRegionId);
    
    // 清空国家和国家区域的选择
    form.setFieldsValue({
      countryId: undefined,
      nationalRegionId: undefined
    });
  };

  // 处理国家变化
  const handleCountryChange = (countryId: string) => {
    // 筛选国家区域
    filterNationalRegionsByCountry(countryId);
    
    // 清空国家区域的选择
    form.setFieldsValue({
      nationalRegionId: undefined
    });
  };

  // 处理表单值变化
  const handleValuesChange = (changedValues: any) => {
    setHasUnsavedChanges(hasChanges());
    
    // 处理级联筛选
    if (changedValues.worldRegionId !== undefined) {
      handleWorldRegionChange(changedValues.worldRegionId);
    }
    if (changedValues.countryId !== undefined) {
      handleCountryChange(changedValues.countryId);
    }
  };

  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            <InfoCircleOutlined style={{ marginRight: 8 }} />
            分会基本信息设置
            {hasUnsavedChanges && (
              <Text type="warning" style={{ marginLeft: 8, fontSize: 14 }}>
                (有未保存的修改)
              </Text>
            )}
          </Title>
          <Text type="secondary">
            配置分会的基本信息，包括分会名字、成立年份等
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
                name="chapterName"
                label="分会名字"
                rules={[
                  { required: true, message: '请输入分会名字' },
                  { max: 100, message: '分会名字不能超过100个字符' }
                ]}
              >
                <Input placeholder="请输入分会名字，如：JCI Kuala Lumpur" />
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
                  placeholder="请输入成立年份"
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">区域设置</Divider>

          <Row gutter={24}>
            <Col span={8}>
              <Form.Item
                name="worldRegionId"
                label="世界区域"
              >
                <Select
                  placeholder="选择世界区域"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {worldRegions.map(region => {
                    console.log('渲染世界区域选项:', region);
                    return (
                      <Option key={region.id} value={region.id || ''}>
                        {region.name} ({region.code})
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="countryId"
                label="所属国家"
                extra={filteredCountries.length === 0 ? "请先选择世界区域" : ""}
              >
                <Select
                  placeholder={filteredCountries.length === 0 ? "请先选择世界区域" : "选择国家"}
                  allowClear
                  disabled={filteredCountries.length === 0}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {filteredCountries.map(country => {
                    console.log('渲染国家选项:', country);
                    return (
                      <Option key={country.id} value={country.id || ''}>
                        {country.name} ({country.code})
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="nationalRegionId"
                label="国家区域"
                extra={filteredNationalRegions.length === 0 ? "请先选择国家" : ""}
              >
                <Select
                  placeholder={filteredNationalRegions.length === 0 ? "请先选择国家" : "选择国家区域"}
                  allowClear
                  disabled={filteredNationalRegions.length === 0}
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option?.children || '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {filteredNationalRegions.map(region => {
                    console.log('渲染国家区域选项:', region);
                    return (
                      <Option key={region.id} value={region.id || ''}>
                        {region.name} ({region.code})
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="description"
                label="分会简介"
                rules={[
                  { max: 500, message: '分会简介不能超过500个字符' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="请输入分会简介，描述分会的使命、愿景等"
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
                name="address"
                label="分会地址"
                rules={[
                  { max: 200, message: '分会地址不能超过200个字符' }
                ]}
              >
                <Input placeholder="请输入分会地址" />
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

          <Divider orientation="left">分会标识</Divider>

          <Row gutter={24}>
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
    </Card>
  );
};

export default ChapterSettings;
