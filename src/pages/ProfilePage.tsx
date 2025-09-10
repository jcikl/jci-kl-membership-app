import React from 'react';
import { Card, Descriptions, Tag, Button, Space, Typography, Avatar } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';

const { Title } = Typography;

const ProfilePage: React.FC = () => {
  const { user, member } = useAuthStore();

  const getStatusTag = (status: string) => {
    const statusMap = {
      active: { color: 'green', text: '活跃' },
      inactive: { color: 'orange', text: '非活跃' },
      pending: { color: 'blue', text: '待审核' },
      suspended: { color: 'red', text: '已暂停' },
    };
    const config = statusMap[status as keyof typeof statusMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getLevelTag = (level: string) => {
    const levelMap = {
      bronze: { color: '#cd7f32', text: '铜牌' },
      silver: { color: '#c0c0c0', text: '银牌' },
      gold: { color: '#ffd700', text: '金牌' },
      platinum: { color: '#e5e4e2', text: '白金' },
      diamond: { color: '#b9f2ff', text: '钻石' },
    };
    const config = levelMap[level as keyof typeof levelMap];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <div>
      <Card>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Avatar 
            size={100} 
            icon={<UserOutlined />} 
            src={member?.profile?.avatar}
            style={{ marginBottom: 16 }}
          />
          <Title level={3} style={{ margin: 0 }}>
            {member?.name || user?.displayName || '未设置姓名'}
          </Title>
          <Space style={{ marginTop: 8 }}>
            {member && getStatusTag(member.status)}
            {member && getLevelTag(member.level)}
          </Space>
        </div>

        <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'center' }}>
          <Button type="primary" icon={<EditOutlined />}>
            编辑资料
          </Button>
        </Space>

        <Descriptions title="基本信息" column={2} bordered>
          <Descriptions.Item label="姓名" span={1}>
            {member?.name || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="会员编号" span={1}>
            {member?.memberId || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱" span={1}>
            {user?.email || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="手机号" span={1}>
            {member?.phone || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="加入时间" span={1}>
            {member?.joinDate ? new Date(member.joinDate).toLocaleDateString() : '未知'}
          </Descriptions.Item>
          <Descriptions.Item label="最后更新" span={1}>
            {member?.updatedAt ? new Date(member.updatedAt).toLocaleDateString() : '未知'}
          </Descriptions.Item>
        </Descriptions>

        {member?.profile && Object.keys(member.profile).length > 0 && (
          <Descriptions title="详细信息" column={2} bordered style={{ marginTop: 16 }}>
            {member.profile.birthDate && (
              <Descriptions.Item label="出生日期" span={1}>
                {new Date(member.profile.birthDate).toLocaleDateString()}
              </Descriptions.Item>
            )}
            {member.profile.gender && (
              <Descriptions.Item label="性别" span={1}>
                {member.profile.gender === 'male' ? '男' : 
                 member.profile.gender === 'female' ? '女' : '其他'}
              </Descriptions.Item>
            )}
            {member.profile.address && (
              <Descriptions.Item label="地址" span={2}>
                {member.profile.address}
              </Descriptions.Item>
            )}
            {member.profile.occupation && (
              <Descriptions.Item label="职业" span={1}>
                {member.profile.occupation}
              </Descriptions.Item>
            )}
            {member.profile.company && (
              <Descriptions.Item label="公司" span={1}>
                {member.profile.company}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Card>
    </div>
  );
};

export default ProfilePage;
