import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Table,
  Tag,
  Space,
  Statistic,
  Button,
  Modal,
  message,
  Select,
  Form
} from 'antd';
import {
  UserOutlined,
  CrownOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { ROLE_DEFINITIONS } from '@/types/rbac';
import { useAuthStore } from '@/store/authStore';
import { categoryService } from '@/services/categoryService';
import { getMembers } from '@/services/memberService';

const { Text } = Typography;

interface PermissionMatrixChartProps {}

const PermissionMatrixChart: React.FC<PermissionMatrixChartProps> = () => {
  const [developerUsers, setDeveloperUsers] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [availableMembers, setAvailableMembers] = useState<any[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [selectedAccountType, setSelectedAccountType] = useState<string>('developer');

  const { member } = useAuthStore();

  // 加载开发者与管理员用户列表
  const loadAccountTypeUsers = async () => {
    try {
      const [devCats, adminCats] = await Promise.all([
        categoryService.getMembersByAccountType('developer' as any),
        categoryService.getMembersByAccountType('admin' as any)
      ]);
      setDeveloperUsers(devCats || []);
      setAdminUsers(adminCats || []);
    } catch (e) {
      console.error('加载用户列表失败:', e);
    }
  };

  // 加载所有会员列表
  const loadAllMembers = async () => {
    try {
      const response = await getMembers();
      setAllMembers(response.data || []);
    } catch (e) {
      console.error('加载会员列表失败:', e);
    }
  };

  useEffect(() => {
    loadAccountTypeUsers();
    loadAllMembers();
  }, []);

  // 当账户类型或所有会员列表变化时，更新可选择的会员列表
  useEffect(() => {
    if (allMembers.length > 0) {
      updateAvailableMembers();
    }
  }, [selectedAccountType, allMembers]);

  // 更新可选择的会员列表（排除已有目标账户类型的用户）
  const updateAvailableMembers = async () => {
    try {
      const [devCats, adminCats] = await Promise.all([
        categoryService.getMembersByAccountType('developer' as any),
        categoryService.getMembersByAccountType('admin' as any)
      ]);
      
      const existingDevIds = new Set(devCats.map(cat => cat.memberId));
      const existingAdminIds = new Set(adminCats.map(cat => cat.memberId));
      
      const filtered = allMembers.filter(member => {
        if (selectedAccountType === 'developer') {
          return !existingDevIds.has(member.id);
        } else if (selectedAccountType === 'admin') {
          return !existingAdminIds.has(member.id);
        }
        return true;
      });
      
      setAvailableMembers(filtered);
    } catch (e) {
      console.error('获取可用会员列表失败:', e);
      setAvailableMembers(allMembers);
    }
  };

  // 手动分配账户类型
  const handleAssignAccountType = async () => {
    if (!selectedMemberId) {
      message.error('请选择会员');
      return;
    }
    if (!member?.id) {
      message.error('未获取到当前用户信息');
      return;
    }
    
    try {
      const targetMember = allMembers.find(m => m.id === selectedMemberId);
      if (!targetMember) {
        message.error('未找到选中的会员');
        return;
      }
      
      // 获取目标会员的当前分类，如果没有则默认为associate
      const existing = await categoryService.getMemberCategory(selectedMemberId);
      const membershipCategory = existing?.membershipCategory || 'associate';
      
      await categoryService.assignCategory(
        selectedMemberId, 
        membershipCategory, 
        selectedAccountType as any, 
        { assignedBy: member.id }
      );
      
      message.success(`已将 ${targetMember.name} 设置为 ${selectedAccountType === 'developer' ? '开发者' : '管理员'}`);
      setIsAssignModalOpen(false);
      setSelectedMemberId('');
      loadAccountTypeUsers(); // 刷新列表
      updateAvailableMembers(); // 更新可选择的会员列表
    } catch (e: any) {
      console.error('分配账户类型失败', e);
      message.error(`分配失败：${e?.message || '未知错误'}`);
    }
  };

  // 角色类型判断

  const getRoleType = (role: string): 'category' | 'position' => {
    const categoryRoles = ['DEVELOPER', 'ADMINISTRATOR', 'OFFICIAL_MEMBER', 'ASSOCIATE_MEMBER', 'HONORARY_MEMBER', 'AFFILIATE_MEMBER', 'VISITOR_MEMBER'];
    return categoryRoles.includes(role) ? 'category' : 'position';
  };

  // 角色图标函数（当前未使用，预留后续扩展）
  // const getRoleIcon = (_role: string) => null;

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="总角色数"
              value={Object.keys(ROLE_DEFINITIONS).length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="户口类别"
              value={Object.keys(ROLE_DEFINITIONS).filter(role => getRoleType(role) === 'category').length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="岗位角色"
              value={Object.keys(ROLE_DEFINITIONS).filter(role => getRoleType(role) === 'position').length}
              prefix={<CrownOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 手动分配账户类型 */}
      <Card title="手动分配账户类型" style={{ marginBottom: 16 }}>
        <Space>
          <Button 
            type="primary" 
            onClick={() => setIsAssignModalOpen(true)}
          >
            分配开发者/管理员
          </Button>
          <Text type="secondary">选择会员并分配为开发者或管理员</Text>
        </Space>
      </Card>

      <Card title="开发者与管理员用户" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="开发者 (Developer)" extra={<Button size="small" onClick={() => {
              try { (async () => { const list = await categoryService.getMembersByAccountType('developer' as any); setDeveloperUsers(list); })(); } catch {}
            }}>刷新</Button>}>
              <Table
                size="small"
                rowKey={(r: any) => r.id}
                pagination={{ pageSize: 10 }}
                dataSource={developerUsers}
                columns={[
                  { title: 'Member ID', dataIndex: 'memberId', key: 'memberId', width: 160 },
                  { title: 'Account Type', dataIndex: 'accountType', key: 'accountType', width: 120 },
                  { title: 'Assigned At', dataIndex: 'assignedDate', key: 'assignedDate', width: 200 },
                  { title: 'Status', dataIndex: 'status', key: 'status', width: 80 },
                ]}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="管理员 (Admin)" extra={<Button size="small" onClick={() => {
              try { (async () => { const list = await categoryService.getMembersByAccountType('admin' as any); setAdminUsers(list); })(); } catch {}
            }}>刷新</Button>}>
              <Table
                size="small"
                rowKey={(r: any) => r.id}
                pagination={{ pageSize: 10 }}
                dataSource={adminUsers}
                columns={[
                  { title: 'Member ID', dataIndex: 'memberId', key: 'memberId', width: 160 },
                  { title: 'Account Type', dataIndex: 'accountType', key: 'accountType', width: 120 },
                  { title: 'Assigned At', dataIndex: 'assignedDate', key: 'assignedDate', width: 200 },
                  { title: 'Status', dataIndex: 'status', key: 'status', width: 80 },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 详细权限矩阵已移除 */}

      {/* 户口类别列表弹窗 */}
      <Modal
        title="户口类别列表"
        open={isCategoryModalOpen}
        onCancel={() => setIsCategoryModalOpen(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {['DEVELOPER','ADMINISTRATOR','OFFICIAL_MEMBER','ASSOCIATE_MEMBER','HONORARY_MEMBER','AFFILIATE_MEMBER','VISITOR_MEMBER'].map(role => (
            <Tag key={role} color="blue">{ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]}</Tag>
          ))}
        </Space>
      </Modal>

      {/* 岗位角色列表弹窗 */}
      <Modal
        title="岗位角色列表"
        open={isPositionModalOpen}
        onCancel={() => setIsPositionModalOpen(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {['PRESIDENT','ACTING_PRESIDENT','SECRETARY_GENERAL','TREASURER','ADVISOR_PRESIDENT','VICE_PRESIDENT','DEPARTMENT_HEAD'].map(role => (
            <Tag key={role} color="purple">{ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]}</Tag>
          ))}
        </Space>
      </Modal>

      {/* 手动分配账户类型弹窗 */}
      <Modal
        title="分配账户类型"
        open={isAssignModalOpen}
        onCancel={() => {
          setIsAssignModalOpen(false);
          setSelectedMemberId('');
        }}
        afterOpenChange={(open) => {
          if (open) {
            updateAvailableMembers(); // 打开弹窗时更新可选择的会员列表
          }
        }}
        onOk={handleAssignAccountType}
        okText="确认分配"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="选择会员" required>
            <Select
              placeholder="请选择要分配的会员"
              value={selectedMemberId}
              onChange={setSelectedMemberId}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={availableMembers.map(member => ({
                value: member.id,
                label: `${member.name} (${member.email})`
              }))}
            />
          </Form.Item>
          <Form.Item label="账户类型" required>
            <Select
              value={selectedAccountType}
              onChange={(value) => {
                setSelectedAccountType(value);
                setSelectedMemberId(''); // 清空已选择的会员
              }}
              options={[
                { value: 'developer', label: '开发者' },
                { value: 'admin', label: '管理员' }
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .permission-granted {
          background-color: #f6ffed;
        }
        .permission-denied {
          background-color: #fff2f0;
        }
        .even-row {
          background-color: #fafafa;
        }
        .odd-row {
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
};

export default PermissionMatrixChart;
