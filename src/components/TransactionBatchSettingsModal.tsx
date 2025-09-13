import React from 'react';
import {
  Modal,
  Form,
  Select,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Card,
  TreeSelect,
} from 'antd';
import {
  SettingOutlined,
  TagOutlined,
  ProjectOutlined,
} from '@ant-design/icons';
import { TransactionPurpose } from '@/types/finance';

const { Text } = Typography;
const { Option } = Select;

interface TransactionBatchSettingsModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (settings: {
    transactionPurpose?: string;
    projectAccount?: string;
  }) => void;
  purposes: TransactionPurpose[];
  projectAccounts?: string[]; // 项目户口列表
  selectedCount: number;
  loading?: boolean;
}

const TransactionBatchSettingsModal: React.FC<TransactionBatchSettingsModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  purposes,
  projectAccounts = ['会员费项目', '活动项目', '办公项目', '培训项目', '营销项目'],
  selectedCount,
  loading = false,
}) => {
  const [form] = Form.useForm();

  // 构建3层级交易用途树形数据
  const buildPurposeTreeData = () => {
    const treeData: any[] = [];
    
    // 获取各层级用途
    const mainCategories = purposes.filter(p => p.level === 0);
    const businessCategories = purposes.filter(p => p.level === 1);
    const specificPurposes = purposes.filter(p => p.level === 2);
    
    mainCategories.forEach(main => {
      const businessChildren = businessCategories.filter(b => b.parentId === main.id);
      const businessChildrenWithSpecific = businessChildren.map(business => ({
        title: business.name,
        value: business.id,
        key: business.id,
        children: specificPurposes.filter(s => s.parentId === business.id).map(specific => ({
          title: specific.name,
          value: specific.id,
          key: specific.id,
        }))
      }));
      
      treeData.push({
        title: main.name,
        value: main.id,
        key: main.id,
        children: businessChildrenWithSpecific
      });
    });
    
    return treeData;
  };

  const handleOk = async () => {
    try {
      const values = await form.getFieldsValue();
      
      // 检查是否至少设置了一个字段
      if (!values.transactionPurpose && !values.projectAccount) {
        Modal.warning({
          title: '请至少设置一项',
          content: '请至少设置交易用途或项目户口中的一项。',
        });
        return;
      }
      
      const settings = {
        transactionPurpose: values.transactionPurpose || undefined,
        projectAccount: values.projectAccount || undefined,
      };

      onConfirm(settings);
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };



  return (
    <Modal
      title={
        <div>
          <SettingOutlined style={{ marginRight: 8 }} />
          批量设置交易记录
        </div>
      }
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      confirmLoading={loading}
      destroyOnHidden
    >
      <div style={{ marginBottom: 16 }}>
        <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text strong>选中记录数：</Text>
              <Text style={{ color: '#52c41a', fontSize: '16px', marginLeft: 8 }}>
                {selectedCount} 条
              </Text>
            </Col>
            <Col span={12}>
              <Text strong>操作类型：</Text>
              <Text style={{ marginLeft: 8 }}>批量设置</Text>
            </Col>
          </Row>
        </Card>
      </div>

      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            为选中的 {selectedCount} 条交易记录批量设置交易用途和项目户口
          </Text>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            {/* 交易用途设置 */}
            <Card 
              size="small" 
              title={
                <span>
                  <TagOutlined style={{ marginRight: 8 }} />
                  交易用途
                </span>
              }
              style={{ minHeight: '280px' }}
            >
              <Form.Item
                name="transactionPurpose"
                label="交易用途"
              >
                <TreeSelect
                  placeholder="请选择交易用途（可选）"
                  allowClear
                  treeData={buildPurposeTreeData()}
                  treeDefaultExpandAll
                  showSearch
                  treeNodeFilterProp="title"
                  style={{ width: '100%' }}
                  styles={{ popup: { root: { maxHeight: 300, overflow: 'auto' } } }}
                />
              </Form.Item>

              {/* 快速选择 */}
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>
                  快速选择（具体用途）：
                </Text>
                <Space wrap size={[4, 4]}>
                  {purposes.filter(p => p.isActive && p.level === 2).slice(0, 6).map(purpose => (
                    <Button
                      key={purpose.id}
                      size="small"
                      onClick={() => form.setFieldsValue({ transactionPurpose: purpose.id })}
                    >
                      {purpose.name}
                    </Button>
                  ))}
                </Space>
              </div>
            </Card>
          </Col>

          <Col span={12}>
            {/* 项目户口设置 */}
            <Card 
              size="small" 
              title={
                <span>
                  <ProjectOutlined style={{ marginRight: 8 }} />
                  项目户口
                </span>
              }
              style={{ minHeight: '280px' }}
            >
              <Form.Item
                name="projectAccount"
                label="项目户口"
              >
                <Select
                  placeholder="请选择项目户口（可选）"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  style={{ width: '100%' }}
                >
                  {projectAccounts.map(account => (
                    <Option key={account} value={account}>
                      {account}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* 常用项目户口 */}
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: '12px' }}>
                  常用项目户口：
                </Text>
                <Space wrap size={[4, 4]}>
                  {projectAccounts.map(project => (
                    <Button
                      key={project}
                      size="small"
                      onClick={() => form.setFieldsValue({ projectAccount: project })}
                    >
                      {project}
                    </Button>
                  ))}
                </Space>
              </div>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            可以同时设置交易用途和项目户口，或只设置其中一项
          </Text>
        </div>

      </Form>

      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 6 }}>
        <Text type="warning" style={{ fontSize: '12px' }}>
          ⚠️ 批量设置操作将同时修改 {selectedCount} 条交易记录，请确认设置内容正确无误。
        </Text>
      </div>
    </Modal>
  );
};

export default TransactionBatchSettingsModal;
