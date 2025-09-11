import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Space, Typography, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons';
import { useMemberStore } from '@/store/memberStore';
import { getAccountTypeTagProps } from '@/utils/accountType';
import { useAccountType } from '@/hooks/useMemberCategory';

const { Title } = Typography;

const MemberDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentMember, isLoading, fetchMemberById } = useMemberStore();
  const { accountType, loading: categoryLoading } = useAccountType(id);

  useEffect(() => {
    if (id) {
      fetchMemberById(id);
    }
  }, [id, fetchMemberById]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!currentMember) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Title level={3}>会员不存在</Title>
        <Button onClick={() => navigate('/members')}>
          返回会员列表
        </Button>
      </div>
    );
  }


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
      <Space style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/members')}
        >
          返回
        </Button>
        <Button 
          type="primary" 
          icon={<EditOutlined />}
          onClick={() => navigate(`/members/${id}/edit`)}
        >
          编辑
        </Button>
      </Space>

      <Card title="基本信息">
        <Descriptions column={2} bordered>
          <Descriptions.Item label="姓名" span={1}>
            {currentMember.name}
          </Descriptions.Item>
          <Descriptions.Item label="会员编号" span={1}>
            {currentMember.memberId}
          </Descriptions.Item>
          <Descriptions.Item label="邮箱" span={1}>
            {currentMember.email}
          </Descriptions.Item>
          <Descriptions.Item label="手机号" span={1}>
            {currentMember.phone}
          </Descriptions.Item>
          <Descriptions.Item label="用户户口类别" span={1}>
            {categoryLoading ? <Spin size="small" /> : <Tag {...getAccountTypeTagProps(accountType)} />}
          </Descriptions.Item>
          <Descriptions.Item label="等级" span={1}>
            {getLevelTag(currentMember.level)}
          </Descriptions.Item>
          <Descriptions.Item label="加入时间" span={1}>
            {new Date(currentMember.joinDate).toLocaleDateString()}
          </Descriptions.Item>
          <Descriptions.Item label="最后更新" span={1}>
            {new Date(currentMember.updatedAt).toLocaleDateString()}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {currentMember.profile && Object.keys(currentMember.profile).length > 0 && (
        <Card title="详细信息" style={{ marginTop: 16 }}>
          <Descriptions column={2} bordered>
            {currentMember.profile.birthDate && (
              <Descriptions.Item label="出生日期" span={1}>
                {new Date(currentMember.profile.birthDate).toLocaleDateString()}
              </Descriptions.Item>
            )}
            {currentMember.profile.gender && (
              <Descriptions.Item label="性别" span={1}>
                {currentMember.profile.gender === 'male' ? '男' : 
                 currentMember.profile.gender === 'female' ? '女' : '其他'}
              </Descriptions.Item>
            )}
            {currentMember.profile.address && (
              <Descriptions.Item label="地址" span={2}>
                {currentMember.profile.address}
              </Descriptions.Item>
            )}
            {currentMember.profile.occupation && (
              <Descriptions.Item label="职业" span={1}>
                {currentMember.profile.occupation}
              </Descriptions.Item>
            )}
            {currentMember.profile.company && (
              <Descriptions.Item label="公司" span={1}>
                {currentMember.profile.company}
              </Descriptions.Item>
            )}
            {currentMember.profile.emergencyContact && (
              <>
                <Descriptions.Item label="紧急联系人" span={1}>
                  {currentMember.profile.emergencyContact.name}
                </Descriptions.Item>
                <Descriptions.Item label="紧急联系电话" span={1}>
                  {currentMember.profile.emergencyContact.phone}
                </Descriptions.Item>
                <Descriptions.Item label="关系" span={1}>
                  {currentMember.profile.emergencyContact.relationship}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default MemberDetailPage;
