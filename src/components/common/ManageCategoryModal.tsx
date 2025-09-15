import React, { useState, useEffect } from 'react';
import {
  Modal,
  Table,
  Button,
  Input,
  Space,
  message,
  Popconfirm,
  Typography,
  Tabs,
  Switch
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  StarOutlined,
  GiftOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { 
  AwardLevel, 
  StarPointCategory, 
  NationalAreaCategory, 
  EAwardCategory,
  CreateAwardIndicatorInput
} from '@/types/awardIndicators';
import { awardIndicatorService } from '@/services/awardIndicatorService';

const { TextArea } = Input;
const { Text } = Typography;

interface ManageCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  year: number;
  onSave: () => void;
}

interface EditableCategory {
  id?: string;
  level: AwardLevel;
  category: StarPointCategory | NationalAreaCategory | EAwardCategory;
  title: string;
  description: string;
  isActive: boolean;
  isDefault?: boolean;
  isEditing?: boolean;
  isNew?: boolean;
}

const ManageCategoryModal: React.FC<ManageCategoryModalProps> = ({
  visible,
  onClose,
  year,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<AwardLevel>('star_point');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<EditableCategory[]>([]);

  // 预定义默认类别配置
  const defaultCategories = {
    star_point: [
      { value: 'efficient_star', label: 'Efficient Star', isDefault: true },
      { value: 'network_star', label: 'Network Star', isDefault: true },
      { value: 'experience_star', label: 'Experience Star', isDefault: true },
      { value: 'outreach_star', label: 'Outreach Star', isDefault: true },
      { value: 'social_star', label: 'Social Star', isDefault: true }
    ],
    national_area_incentive: [
      { value: 'individual_award', label: 'Individual Award', isDefault: true },
      { value: 'local_organisation_award', label: 'Local Organisation Award', isDefault: true },
      { value: 'area_award', label: 'Area Award', isDefault: true },
      { value: 'special_award', label: 'Special Award', isDefault: true },
      { value: 'jci_junior', label: 'JCI Junior & Youth Award', isDefault: true }
    ],
    e_awards: [
      { value: 'multi_entry_award', label: 'Multi Entry Award', isDefault: true },
      { value: 'best_of_the_best_award', label: 'Best of the Best Award', isDefault: true }
    ]
  };

  // 确保默认类别存在
  const ensureDefaultCategories = async () => {
    const currentIndicators = await awardIndicatorService.getAllAwardIndicators(year);
    const existingCategories = currentIndicators.map(indicator => indicator.category);
    
    // 为每个级别创建缺失的默认类别
    for (const [level, categories] of Object.entries(defaultCategories)) {
      for (const categoryConfig of categories) {
        if (!existingCategories.includes(categoryConfig.value as any)) {
          const categoryInput: CreateAwardIndicatorInput = {
            level: level as AwardLevel,
            category: categoryConfig.value as any,
            title: categoryConfig.label,
            description: `${categoryConfig.label} 默认类别`,
            year,
            createdBy: 'system'
          };
          
          try {
            await awardIndicatorService.saveAwardIndicator(categoryInput);
            console.log(`创建默认类别: ${categoryConfig.label}`);
          } catch (error) {
            console.error(`创建默认类别失败: ${categoryConfig.label}`, error);
          }
        }
      }
    }
  };

  // 加载数据
  const loadCategories = async () => {
    try {
      setLoading(true);
      
      // 确保默认类别存在
      await ensureDefaultCategories();
      
      const awardIndicators = await awardIndicatorService.getAllAwardIndicators(year);
      
      // 转换为可编辑格式
      const editableCategories: EditableCategory[] = awardIndicators.map(indicator => {
        const defaultCategory = defaultCategories[indicator.level]?.find(
          cat => cat.value === indicator.category
        );
        
        return {
          id: indicator.id,
          level: indicator.level,
          category: indicator.category as StarPointCategory | NationalAreaCategory | EAwardCategory,
          title: indicator.title,
          description: indicator.description,
          isActive: indicator.status === 'active',
          isDefault: !!defaultCategory,
          isEditing: false,
          isNew: false
        };
      });
      
      setCategories(editableCategories);
    } catch (error) {
      message.error('加载类别数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible, year]);

  // 切换状态
  const toggleStatus = async (record: EditableCategory) => {
    try {
      setLoading(true);
      const newStatus = !record.isActive;
      
      await awardIndicatorService.updateAwardIndicator(record.id!, {
        status: newStatus ? 'active' : 'inactive',
        updatedBy: 'system'
      });
      
      message.success(`类别已${newStatus ? '激活' : '禁用'}`);
      await loadCategories();
      onSave();
    } catch (error) {
      message.error('状态更新失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 开始编辑
  const startEdit = (record: EditableCategory) => {
    setCategories(categories.map(item => ({
      ...item,
      isEditing: item.id === record.id
    })));
  };

  // 取消编辑
  const cancelEdit = (record: EditableCategory) => {
    if (record.isNew) {
      // 删除新行
      setCategories(categories.filter(item => !item.isNew));
    } else {
      // 恢复原始数据
      setCategories(categories.map(item => ({
        ...item,
        isEditing: false
      })));
    }
  };

  // 保存编辑
  const saveEdit = async (record: EditableCategory) => {
    try {
      setLoading(true);
      
      // 验证必填字段
      if (!record.category || !record.title) {
        message.error('请填写必填字段');
        return;
      }

      // 检查重复
      const duplicate = categories.find(item => 
        item.category === record.category && 
        item.level === record.level && 
        item.id !== record.id &&
        !item.isNew
      );
      
      if (duplicate) {
        message.error('该类别已存在');
        return;
      }

      // 验证自定义类别名称格式
      if (!defaultCategories[record.level].find(option => option.value === record.category)) {
        // 这是一个自定义类别，验证格式
        if (!/^[a-z_]+$/.test(record.category)) {
          message.error('自定义类别名称只能包含小写字母和下划线');
          return;
        }
      }

      const categoryInput: CreateAwardIndicatorInput = {
        level: record.level,
        category: record.category,
        title: record.title,
        description: record.description,
        year,
        createdBy: 'system' // TODO: 从用户上下文获取
      };

      if (record.isNew) {
        // 创建新类别（自定义类别）
        await awardIndicatorService.saveAwardIndicator(categoryInput);
        message.success('自定义类别创建成功');
      } else {
        // 更新现有类别
        await awardIndicatorService.updateAwardIndicator(record.id!, {
          title: record.title,
          description: record.description,
          status: record.isActive ? 'active' : 'inactive',
          updatedBy: 'system' // TODO: 从用户上下文获取
        });
        message.success('类别更新成功');
      }

      // 重新加载数据
      await loadCategories();
      onSave(); // 通知父组件刷新
      
    } catch (error) {
      message.error('保存失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 删除类别
  const deleteCategory = async (record: EditableCategory) => {
    try {
      setLoading(true);
      await awardIndicatorService.deleteAwardIndicator(record.id!);
      message.success('自定义类别删除成功');
      await loadCategories();
      onSave(); // 通知父组件刷新
    } catch (error) {
      message.error('删除自定义类别失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 渲染可编辑单元格
  const renderEditableCell = (
    value: string,
    record: EditableCategory,
    field: keyof EditableCategory,
    type: 'input' | 'select' | 'textarea' = 'input'
  ) => {
    const isEditing = record.isEditing;
    
    if (!isEditing) {
      return <Text>{value}</Text>;
    }

    if (type === 'select') {
      return (
        <Input
          value={value}
          onChange={(e) => {
            setCategories(categories.map(item => 
              item.id === record.id ? { ...item, [field]: e.target.value } : item
            ));
          }}
          placeholder="请输入类别名称"
        />
      );
    }

    if (type === 'textarea') {
      return (
        <TextArea
          value={value}
          onChange={(e) => {
            setCategories(categories.map(item => 
              item.id === record.id ? { ...item, [field]: e.target.value } : item
            ));
          }}
          rows={2}
          placeholder="请输入描述"
        />
      );
    }

    return (
      <Input
        value={value}
        onChange={(e) => {
          setCategories(categories.map(item => 
            item.id === record.id ? { ...item, [field]: e.target.value } : item
          ));
        }}
        placeholder="请输入标题"
      />
    );
  };

  // 表格列配置
  const columns = [
    {
      title: '类别',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (value: string, record: EditableCategory) => {
        if (record.isEditing) {
          return renderEditableCell(value, record, 'category', 'select');
        }
        const categoryLabel = defaultCategories[record.level]?.find(cat => cat.value === value)?.label || value;
        return (
          <div>
            <Text>{categoryLabel}</Text>
            {record.isDefault && (
              <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                (默认)
              </Text>
            )}
          </div>
        );
      }
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (value: string, record: EditableCategory) => 
        renderEditableCell(value, record, 'title', 'input')
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (value: string, record: EditableCategory) => 
        renderEditableCell(value, record, 'description', 'textarea')
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: EditableCategory) => {
        if (record.isEditing) {
          return (
            <Switch
              checked={isActive}
              onChange={(checked) => {
                setCategories(categories.map(item => 
                  item.id === record.id ? { ...item, isActive: checked } : item
                ));
              }}
              checkedChildren="激活"
              unCheckedChildren="禁用"
            />
          );
        }
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Text style={{ color: isActive ? '#52c41a' : '#ff4d4f' }}>
              {isActive ? '激活' : '禁用'}
            </Text>
            <Switch
              checked={isActive}
              onChange={() => toggleStatus(record)}
              loading={loading}
              size="small"
            />
          </div>
        );
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: EditableCategory) => {
        const isEditing = record.isEditing;
        
        if (isEditing) {
          return (
            <Space>
              <Button
                type="link"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => saveEdit(record)}
                loading={loading}
              >
                保存
              </Button>
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => cancelEdit(record)}
              >
                取消
              </Button>
            </Space>
          );
        }

        return (
          <Space>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => startEdit(record)}
            >
              编辑
            </Button>
            {!record.isDefault && (
              <Popconfirm
                title="确定删除此自定义类别吗？删除后无法恢复。"
                onConfirm={() => deleteCategory(record)}
                okText="确定删除"
                cancelText="取消"
              >
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                >
                  删除
                </Button>
              </Popconfirm>
            )}
          </Space>
        );
      }
    }
  ];

  // 获取当前标签页的数据
  const getCurrentTabData = () => {
    return categories.filter(category => category.level === activeTab);
  };

  // 创建新行（非默认类别）
  const createNewRow = () => {
    const newRow: EditableCategory = {
      level: activeTab,
      category: '' as any, // 用户需要选择类别
      title: '',
      description: '',
      isActive: false,
      isDefault: false,
      isEditing: true,
      isNew: true
    };
    
    setCategories([...categories, newRow]);
  };


  // 检查是否可以添加新类别
  const canAddNewCategory = () => {
    // 总是允许添加新类别，因为用户可以创建完全自定义的类别
    return true;
  };

  // 渲染标签页内容
  const renderTabContent = () => {
    const currentData = getCurrentTabData();
    
    return (
      <div>
        <div style={{ 
          marginBottom: 16, 
          padding: '8px 12px', 
          backgroundColor: '#f6ffed', 
          border: '1px solid #b7eb8f', 
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Text type="secondary">
            💡 默认奖励类别（绿色标记）由系统自动创建，只能编辑和切换状态。您可以创建自定义奖励类别进行完整管理。
          </Text>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={createNewRow}
            disabled={!canAddNewCategory()}
            size="small"
          >
            添加自定义类别
          </Button>
        </div>
        
        <Table
          columns={columns}
          dataSource={currentData}
          rowKey={(record) => record.id || 'new'}
          pagination={false}
          loading={loading}
          size="small"
          bordered
        />
      </div>
    );
  };

  // 标签页配置
  const tabItems = [
    {
      key: 'star_point',
      label: (
        <span>
          <StarOutlined />
          Star Point
        </span>
      ),
      children: renderTabContent()
    },
    {
      key: 'national_area_incentive',
      label: (
        <span>
          <GiftOutlined />
          National & Area Incentive
        </span>
      ),
      children: renderTabContent()
    },
    {
      key: 'e_awards',
      label: (
        <span>
          <TrophyOutlined />
          E-Awards
        </span>
      ),
      children: renderTabContent()
    }
  ];

  return (
    <Modal
      title="管理奖励类别"
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
      destroyOnHidden
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key as AwardLevel);
          // 切换标签页时取消编辑
          setCategories(categories.map(item => ({
            ...item,
            isEditing: false
          })));
        }}
        items={tabItems}
      />
    </Modal>
  );
};

export default ManageCategoryModal;
