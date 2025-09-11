import React from 'react';
import { Card, Descriptions, Tag, Button, Space, Typography, Avatar, Modal, Form, Input, Select, DatePicker, Switch, message, Upload, Tabs, Row, Col, Divider } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { updateMember } from '@/services/memberService';
import { uploadFileAndGetUrl } from '@/services/firebase';
import { Controller, useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import {
  HOBBY_OPTIONS,
  CATEGORY_OPTIONS,
  SIZE_OPTIONS,
  CUTTING_OPTIONS,
  INTERESTED_INDUSTRY_OPTIONS,
  TSHIRT_STATUS_OPTIONS,
  INTERNATIONAL_BIZ_OPTIONS,
  GENDER_OPTIONS,
  RACE_OPTIONS,
} from '@/types/constants';

const { Title } = Typography;

const ProfilePage: React.FC = () => {
  const { user, member, setMember } = useAuthStore();
  const [editing, setEditing] = React.useState(false);

  const { control, handleSubmit, reset } = useForm({
    defaultValues: React.useMemo(() => ({
      name: member?.name || user?.displayName || '',
      phone: member?.phone || '',
      fullNameNric: member?.profile?.fullNameNric || '',
      nicknameWithSurname: member?.profile?.nicknameWithSurname || '',
      senatorId: member?.profile?.senatorId || '',
      gender: member?.profile?.gender ? (member?.profile?.gender === 'male' ? 'Male' : 'Female') : undefined,
      race: member?.profile?.race,
      address: member?.profile?.address || '',
      nricOrPassport: member?.profile?.nricOrPassport || '',
      birthDate: member?.profile?.birthDate ? dayjs(member.profile.birthDate, 'DD-MMM-YYYY') : undefined,
      linkedin: member?.profile?.linkedin || '',
      companyWebsite: member?.profile?.companyWebsite || '',
      company: member?.profile?.company || '',
      industryDetail: member?.profile?.industryDetail || '',
      ownIndustry: member?.profile?.ownIndustry || [],
      departmentAndPosition: member?.profile?.departmentAndPosition || '',
      categories: member?.profile?.categories || [],
      interestedIndustries: member?.profile?.interestedIndustries || [],
      hobbies: member?.profile?.hobbies || [],
      jciEventInterests: member?.profile?.jciEventInterests || '',
      jciBenefitsExpectation: member?.profile?.jciBenefitsExpectation || '',
      companyIntro: member?.profile?.companyIntro || '',
      introducerName: member?.profile?.introducerName || '',
      fiveYearsVision: member?.profile?.fiveYearsVision || '',
      activeMemberHow: member?.profile?.activeMemberHow || '',
      nameToBeEmbroidered: member?.profile?.nameToBeEmbroidered || '',
      shirtSize: member?.profile?.shirtSize,
      jacketSize: member?.profile?.jacketSize,
      cutting: member?.profile?.cutting,
      tshirtReceivingStatus: member?.profile?.tshirtReceivingStatus,
      acceptInternationalBusiness: member?.profile?.acceptInternationalBusiness,
      whatsappGroup: !!member?.profile?.whatsappGroup,
      joinedDate: member?.joinDate ? dayjs(member.joinDate) : undefined,
      paymentDate: member?.profile?.paymentDate ? dayjs(member.profile.paymentDate, 'DD-MMM-YYYY') : undefined,
      endorsementDate: member?.profile?.endorsementDate ? dayjs(member.profile.endorsementDate, 'DD-MMM-YYYY') : undefined,
      paymentVerifiedDate: member?.profile?.paymentVerifiedDate ? dayjs(member.profile.paymentVerifiedDate, 'DD-MMM-YYYY') : undefined,
      profilePhotoUrl: member?.profile?.profilePhotoUrl || '',
      paymentSlipUrl: member?.profile?.paymentSlipUrl || '',
    }), [member, user]),
  });

  const openEdit = () => {
    reset();
    setEditing(true);
  };

  const onSave = async (values: any) => {
    if (!member) return;
    try {
      // 辅助函数：将 undefined 转换为 null
      const cleanValue = (value: any) => value === undefined ? null : value;
      
      const updated: Partial<import('@/types').Member> = {
        name: values.name,
        phone: values.phone,
        joinDate: values.joinedDate ? values.joinedDate.toISOString() : member.joinDate,
        profile: {
          ...member.profile,
          fullNameNric: cleanValue(values.fullNameNric),
          nicknameWithSurname: cleanValue(values.nicknameWithSurname),
          senatorId: cleanValue(values.senatorId),
          gender: cleanValue(values.gender === 'Male' ? 'male' : values.gender === 'Female' ? 'female' : undefined),
          race: cleanValue(values.race),
          address: cleanValue(values.address),
          nricOrPassport: cleanValue(values.nricOrPassport),
          birthDate: cleanValue(values.birthDate),
          linkedin: cleanValue(values.linkedin),
          companyWebsite: cleanValue(values.companyWebsite),
          company: cleanValue(values.company),
          industryDetail: cleanValue(values.industryDetail),
          ownIndustry: cleanValue(values.ownIndustry),
          departmentAndPosition: cleanValue(values.departmentAndPosition),
          categories: cleanValue(values.categories),
          interestedIndustries: cleanValue(values.interestedIndustries),
          hobbies: cleanValue(values.hobbies),
          jciEventInterests: cleanValue(values.jciEventInterests),
          jciBenefitsExpectation: cleanValue(values.jciBenefitsExpectation),
          companyIntro: cleanValue(values.companyIntro),
          introducerName: cleanValue(values.introducerName),
          fiveYearsVision: cleanValue(values.fiveYearsVision),
          activeMemberHow: cleanValue(values.activeMemberHow),
          nameToBeEmbroidered: cleanValue(values.nameToBeEmbroidered),
          shirtSize: cleanValue(values.shirtSize),
          jacketSize: cleanValue(values.jacketSize),
          cutting: cleanValue(values.cutting),
          tshirtReceivingStatus: cleanValue(values.tshirtReceivingStatus),
          acceptInternationalBusiness: cleanValue(values.acceptInternationalBusiness),
          whatsappGroup: cleanValue(values.whatsappGroup),
          profilePhotoUrl: cleanValue(values.profilePhotoUrl),
          paymentSlipUrl: cleanValue(values.paymentSlipUrl),
          paymentDate: cleanValue(values.paymentDate ? values.paymentDate.format('DD-MMM-YYYY') : undefined),
          endorsementDate: cleanValue(values.endorsementDate ? values.endorsementDate.format('DD-MMM-YYYY') : undefined),
          paymentVerifiedDate: cleanValue(values.paymentVerifiedDate ? values.paymentVerifiedDate.format('DD-MMM-YYYY') : undefined),
        },
      };
      await updateMember(member.id, updated);
      setMember({ ...member, ...updated } as import('@/types').Member);
      message.success('资料已保存');
      setEditing(false);
    } catch (e: any) {
      message.error(e?.message || '保存失败，请重试');
    }
  };

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
          <Button type="primary" icon={<EditOutlined />} onClick={openEdit}>
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
          <Descriptions.Item label="参议员编号" span={1}>
            {member?.profile?.senatorId || '未设置'}
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
          <div style={{ marginTop: 16 }}>
            <Tabs
              defaultActiveKey="basic"
              items={[
                {
                  key: 'basic',
                  label: '基本信息',
                  children: (
                    <Descriptions column={2} bordered>
                      <Descriptions.Item label="Full Name as per NRIC" span={1}>
                        {member.profile.fullNameNric || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Nickname with surname" span={1}>
                        {member.profile.nicknameWithSurname || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="性别" span={1}>
                        {member.profile.gender ? (member.profile.gender === 'male' ? '男' : '女') : '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="种族" span={1}>
                        {member.profile.race || '未填写'}
                      </Descriptions.Item>
              <Descriptions.Item label="出生日期" span={1}>
                        {member.profile.birthDate || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="NRIC/ Passport Number" span={1}>
                        {member.profile.nricOrPassport || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="家庭住址" span={2}>
                        {member.profile.address || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="兴趣/爱好" span={2}>
                        {member.profile.hobbies && member.profile.hobbies.length > 0 ? 
                          member.profile.hobbies.join(', ') : '未填写'}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'career',
                  label: '职业信息',
                  children: (
                    <Descriptions column={2} bordered>
                      <Descriptions.Item label="公司/雇主名称" span={1}>
                        {member.profile.company || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="部门与职位" span={1}>
                        {member.profile.departmentAndPosition || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="行业描述" span={2}>
                        {member.profile.industryDetail || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="自身行业" span={2}>
                        {member.profile.ownIndustry && member.profile.ownIndustry.length > 0 ? 
                          member.profile.ownIndustry.join(', ') : '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="类别" span={1}>
                        {member.profile.categories && member.profile.categories.length > 0 ? 
                          member.profile.categories.join(', ') : '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="关注行业" span={1}>
                        {member.profile.interestedIndustries && member.profile.interestedIndustries.length > 0 ? 
                          member.profile.interestedIndustries.join(', ') : '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="LinkedIn" span={1}>
                        {member.profile.linkedin ? (
                          <a href={member.profile.linkedin} target="_blank" rel="noreferrer">查看</a>
                        ) : '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Company Website" span={1}>
                        {member.profile.companyWebsite ? (
                          <a href={member.profile.companyWebsite} target="_blank" rel="noreferrer">查看</a>
                        ) : '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="公司与角色简介" span={2}>
                        {member.profile.companyIntro || '未填写'}
                      </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'jci',
                  label: 'JCI 相关',
                  children: (
                    <Descriptions column={2} bordered>
                      <Descriptions.Item label="对 JCI 活动感兴趣的类型" span={2}>
                        {member.profile.jciEventInterests || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="希望在 JCI KL 获得的资源/活动/收益" span={2}>
                        {member.profile.jciBenefitsExpectation || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="介绍人姓名" span={1}>
                        {member.profile.introducerName || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="五年愿景" span={1}>
                        {member.profile.fiveYearsVision || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="如何成为活跃会员" span={2}>
                        {member.profile.activeMemberHow || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="刺绣姓名" span={1}>
                        {member.profile.nameToBeEmbroidered || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="T恤尺码" span={1}>
                        {member.profile.shirtSize || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="外套尺码" span={1}>
                        {member.profile.jacketSize || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="T恤版型" span={1}>
                        {member.profile.cutting || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="T恤领取状态" span={1}>
                        {member.profile.tshirtReceivingStatus || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="接受国际商务机会？" span={1}>
                        {member.profile.acceptInternationalBusiness || '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="加入 WhatsApp 群" span={1}>
                        {member.profile.whatsappGroup !== undefined ? 
                          (member.profile.whatsappGroup ? '是' : '否') : '未填写'}
                      </Descriptions.Item>
                      <Descriptions.Item label="付款日期" span={1}>
                        {member.profile.paymentDate || '未填写'}
              </Descriptions.Item>
                      <Descriptions.Item label="背书日期" span={1}>
                        {member.profile.endorsementDate || '未填写'}
              </Descriptions.Item>
                      <Descriptions.Item label="付款核验日期" span={1}>
                        {member.profile.paymentVerifiedDate || '未填写'}
              </Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'files',
                  label: '文件资料',
                  children: (
                    <Descriptions column={2} bordered>
                      <Descriptions.Item label="头像" span={1}>
                        {member.profile.profilePhotoUrl ? (
                          <a href={member.profile.profilePhotoUrl} target="_blank" rel="noreferrer">查看</a>
                        ) : '未填写'}
              </Descriptions.Item>
                      <Descriptions.Item label="付款凭证" span={1}>
                        {member.profile.paymentSlipUrl ? (
                          <a href={member.profile.paymentSlipUrl} target="_blank" rel="noreferrer">查看</a>
                        ) : '未填写'}
              </Descriptions.Item>
          </Descriptions>
                  ),
                },
              ]}
            />
          </div>
        )}
      </Card>

      <Modal
        title="编辑个人资料"
        open={editing}
        onCancel={() => setEditing(false)}
        onOk={() => {}}
        footer={null}
        width={1200}
        destroyOnClose
        style={{ top: 20 }}
      >
        <Form layout="vertical" onFinish={handleSubmit(onSave)}>
          <Tabs
            defaultActiveKey="basic"
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Form.Item label="姓名" required>
                          <Controller
                            name="name"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="真实姓名" />}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="手机号" required>
                          <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => <Input {...field} placeholder="手机号" />}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Full Name as per NRIC" required>
                          <Controller 
                            name="fullNameNric" 
                            control={control} 
                            render={({ field }) => (
                              <Input 
                                {...field} 
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                placeholder="请输入全大写姓名"
                              />
                            )} 
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Nickname with surname">
                          <Controller name="nicknameWithSurname" control={control} render={({ field }) => <Input {...field} />} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="参议员编号">
                          <Controller 
                            name="senatorId" 
                            control={control} 
                            render={({ field }) => (
                              <Input 
                                {...field} 
                                placeholder="请输入参议员编号"
                                onChange={(e) => {
                                  // 只保留英文字母和数字，并转换为大写
                                  const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                                  field.onChange(value);
                                }}
                              />
                            )} 
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="性别" required>
                          <Controller
                            name="gender"
                            control={control}
                            render={({ field }) => (
                              <Select {...field} options={GENDER_OPTIONS.map(g => ({ value: g, label: g }))} allowClear />
                            )}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="种族" required>
                          <Controller
                            name="race"
                            control={control}
                            render={({ field }) => (
                              <Select {...field} options={RACE_OPTIONS.map(g => ({ value: g, label: g }))} allowClear />
                            )}
                          />
                        </Form.Item>
                      </Col>
                       <Col span={8}>
                         <Form.Item label="出生日期">
                           <Controller 
                             name="birthDate" 
                             control={control} 
                             render={({ field }) => (
                               <DatePicker
                                 value={field.value ? (typeof field.value === 'string' ? dayjs(field.value, 'DD-MMM-YYYY') : field.value) : null}
                                 format="DD-MMM-YYYY"
                                 onChange={(date) => field.onChange(date ? date.format('DD-MMM-YYYY') : '')}
                                 placeholder="选择出生日期"
                                 style={{ width: '100%' }}
                                 inputReadOnly
                                 allowClear
                               />
                             )} 
                           />
                         </Form.Item>
                       </Col>
                      <Col span={24}>
                        <Form.Item label="家庭住址">
                          <Controller name="address" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="NRIC/ Passport Number" required>
                          <Controller 
                            name="nricOrPassport" 
                            control={control} 
                            render={({ field }) => (
                              <Input 
                                {...field} 
                                placeholder="仅限英文字母和数字"
                                onChange={(e) => {
                                  // 只保留英文字母和数字，并转换为大写
                                  const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                                  field.onChange(value);
                                }}
                              />
                            )} 
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="加入年份">
                          <Controller name="joinedDate" control={control} render={({ field }) => <DatePicker {...field} style={{ width: '100%' }} />} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="兴趣/爱好（多选）">
                          <Controller
                            name="hobbies"
                            control={control}
                            render={({ field }) => (
                              <Select {...field} mode="multiple" options={HOBBY_OPTIONS.map(v => ({ value: v, label: v }))} />
                            )}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="头像上传">
                          <Controller
                            name="profilePhotoUrl"
                            control={control}
                            render={({ field }) => (
                              <div>
                                <Upload
                                  accept="image/*"
                                  showUploadList={false}
                                  customRequest={async ({ file, onSuccess, onError }) => {
                                    try {
                                      const url = await uploadFileAndGetUrl(`avatars/${member?.id}_${Date.now()}`, file as File);
                                      field.onChange(url);
                                      onSuccess && onSuccess({}, new XMLHttpRequest());
                                      message.success('头像上传成功');
                                    } catch (e: any) {
                                      onError && onError(e);
                                      message.error('头像上传失败');
                                    }
                                  }}
                                >
                                  <Button>上传头像</Button>
                                </Upload>
                                <div style={{ marginTop: 8 }}>
                                  {field.value ? <a href={field.value} target="_blank" rel="noreferrer">查看头像</a> : <span style={{ color: '#999' }}>未上传</span>}
                                </div>
                              </div>
                            )}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="付款凭证上传">
                          <Controller
                            name="paymentSlipUrl"
                            control={control}
                            render={({ field }) => (
                              <div>
                                <Upload
                                  accept="image/*"
                                  showUploadList={false}
                                  customRequest={async ({ file, onSuccess, onError }) => {
                                    try {
                                      const url = await uploadFileAndGetUrl(`payment-slips/${member?.id}_${Date.now()}`, file as File);
                                      field.onChange(url);
                                      onSuccess && onSuccess({}, new XMLHttpRequest());
                                      message.success('付款凭证上传成功');
                                    } catch (e: any) {
                                      onError && onError(e);
                                      message.error('付款凭证上传失败');
                                    }
                                  }}
                                >
                                  <Button>上传付款凭证</Button>
                                </Upload>
                                <div style={{ marginTop: 8 }}>
                                  {field.value ? <a href={field.value} target="_blank" rel="noreferrer">查看凭证</a> : <span style={{ color: '#999' }}>未上传</span>}
                                </div>
                              </div>
                            )}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'career',
                label: '职业信息',
                children: (
                  <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Form.Item label="公司/雇主名称" required>
                          <Controller name="company" control={control} render={({ field }) => <Input {...field} />} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="部门与职位" required>
                          <Controller name="departmentAndPosition" control={control} render={({ field }) => <Input {...field} />} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="LinkedIn">
                          <Controller name="linkedin" control={control} render={({ field }) => <Input {...field} placeholder="https://linkedin.com/in/..." />} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="Company Website">
                          <Controller name="companyWebsite" control={control} render={({ field }) => <Input {...field} placeholder="https://" />} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="行业描述">
                          <Controller name="industryDetail" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="自身行业（多选）">
                          <Controller
                            name="ownIndustry"
                            control={control}
                            render={({ field }) => (
                              <Select {...field} mode="multiple" options={INTERESTED_INDUSTRY_OPTIONS.map(v => ({ value: v, label: v }))} />
                            )}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="类别（多选）">
                          <Controller
                            name="categories"
                            control={control}
                            render={({ field }) => (
                              <Select {...field} mode="multiple" options={CATEGORY_OPTIONS.map(v => ({ value: v, label: v }))} />
                            )}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="关注行业（多选）">
                          <Controller
                            name="interestedIndustries"
                            control={control}
                            render={({ field }) => (
                              <Select {...field} mode="multiple" options={INTERESTED_INDUSTRY_OPTIONS.map(v => ({ value: v, label: v }))} />
                            )}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="公司与角色简介">
                          <Controller name="companyIntro" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
              {
                key: 'jci',
                label: 'JCI 相关',
                children: (
                  <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Form.Item label="介绍人姓名" required>
                          <Controller name="introducerName" control={control} render={({ field }) => <Input {...field} />} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="五年愿景">
                          <Controller name="fiveYearsVision" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="如何成为活跃会员">
                          <Controller name="activeMemberHow" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="对 JCI 活动感兴趣的类型">
                          <Controller name="jciEventInterests" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="希望在 JCI KL 获得的资源/活动/收益">
                          <Controller name="jciBenefitsExpectation" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="接受国际商务机会？">
                          <Controller name="acceptInternationalBusiness" control={control} render={({ field }) => (
                            <Select {...field} allowClear options={INTERNATIONAL_BIZ_OPTIONS.map(v => ({ value: v, label: v }))} />
                          )} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="加入 WhatsApp 群" valuePropName="checked">
                          <Controller name="whatsappGroup" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="刺绣姓名">
                          <Controller name="nameToBeEmbroidered" control={control} render={({ field }) => <Input {...field} />} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="T恤尺码">
                          <Controller name="shirtSize" control={control} render={({ field }) => (
                            <Select {...field} allowClear options={SIZE_OPTIONS.map(v => ({ value: v, label: v }))} />
                          )} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="外套尺码">
                          <Controller name="jacketSize" control={control} render={({ field }) => (
                            <Select {...field} allowClear options={SIZE_OPTIONS.map(v => ({ value: v, label: v }))} />
                          )} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="T恤版型">
                          <Controller name="cutting" control={control} render={({ field }) => (
                            <Select {...field} allowClear options={CUTTING_OPTIONS.map(v => ({ value: v, label: v }))} />
                          )} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item label="T恤领取状态">
                          <Controller name="tshirtReceivingStatus" control={control} render={({ field }) => (
                            <Select {...field} allowClear options={TSHIRT_STATUS_OPTIONS.map(v => ({ value: v, label: v }))} />
                          )} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="付款日期">
                          <Controller name="paymentDate" control={control} render={({ field }) => <DatePicker {...field} format="DD-MMM-YYYY" style={{ width: '100%' }} />} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="背书日期">
                          <Controller name="endorsementDate" control={control} render={({ field }) => <DatePicker {...field} format="DD-MMM-YYYY" style={{ width: '100%' }} />} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="付款核验日期">
                          <Controller name="paymentVerifiedDate" control={control} render={({ field }) => <DatePicker {...field} format="DD-MMM-YYYY" style={{ width: '100%' }} />} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ),
              },
            ]}
          />
          <Divider />
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditing(false)}>取消</Button>
              <Button type="primary" htmlType="submit">保存</Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
