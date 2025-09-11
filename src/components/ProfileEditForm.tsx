import React from 'react';
import { Form, Input, Select, DatePicker, Upload, Tabs, Row, Col, message, Button, Space, Switch } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { Member } from '@/types';
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
import {
  JCI_POSITION_OPTIONS,
  VP_DIVISION_OPTIONS,
  MEMBERSHIP_CATEGORY_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
} from '@/types/rbac';
import { uploadFileAndGetUrl } from '@/services/firebase';

interface ProfileEditFormProps {
  member: Member;
  onSubmit: (updated: Partial<Member>) => Promise<void>;
  onCancel?: () => void;
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ member, onSubmit, onCancel }) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: React.useMemo(() => ({
      name: member?.name || '',
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
      paymentDate: member?.profile?.paymentDate ? dayjs(member.profile.paymentDate, 'DD-MMM-YYYY') : undefined,
      endorsementDate: member?.profile?.endorsementDate ? dayjs(member.profile.endorsementDate, 'DD-MMM-YYYY') : undefined,
      paymentVerifiedDate: member?.profile?.paymentVerifiedDate ? dayjs(member.profile.paymentVerifiedDate, 'DD-MMM-YYYY') : undefined,
      profilePhotoUrl: member?.profile?.profilePhotoUrl || '',
      paymentSlipUrl: member?.profile?.paymentSlipUrl || '',
      joinedDate: member?.joinDate ? dayjs(member.joinDate) : undefined,
      // JCI职位相关
      jciPosition: member?.profile?.jciPosition,
      vpDivision: member?.profile?.vpDivision,
      positionStartDate: member?.profile?.positionStartDate ? dayjs(member.profile.positionStartDate) : undefined,
      positionEndDate: member?.profile?.positionEndDate ? dayjs(member.profile.positionEndDate) : undefined,
      isActingPosition: member?.profile?.isActingPosition || false,
      actingForPosition: member?.profile?.actingForPosition,
      // 会员分类相关
      membershipCategory: member?.profile?.membershipCategory,
      accountType: member?.profile?.accountType,
      categoryReason: member?.profile?.categoryReason || '',
      categoryAssignedBy: member?.profile?.categoryAssignedBy || '',
      categoryAssignedDate: member?.profile?.categoryAssignedDate ? dayjs(member.profile.categoryAssignedDate) : undefined,
      // 任期管理
      termStartDate: member?.profile?.termStartDate ? dayjs(member.profile.termStartDate) : undefined,
      termEndDate: member?.profile?.termEndDate ? dayjs(member.profile.termEndDate) : undefined,
      isCurrentTerm: member?.profile?.isCurrentTerm || false,
      // 特殊权限
      hasSpecialPermissions: member?.profile?.hasSpecialPermissions || false,
      specialPermissions: member?.profile?.specialPermissions || [],
      permissionNotes: member?.profile?.permissionNotes || '',
    }), [member]),
  });

  React.useEffect(() => {
    reset();
  }, [member, reset]);

  const cleanValue = (value: any) => (value === undefined ? null : value);

  const onSave = async (values: any) => {
    try {
      const updated: Partial<Member> = {
        name: values.name,
        phone: values.phone,
        joinDate: values.joinedDate ? values.joinedDate.toISOString() : member.joinDate,
        profile: {
          ...member.profile,
          fullNameNric: cleanValue(values.fullNameNric),
          nicknameWithSurname: cleanValue(values.nicknameWithSurname),
          senatorId: cleanValue(values.senatorId),
          gender: (values.gender === 'Male' ? 'male' : values.gender === 'Female' ? 'female' : undefined) as 'male' | 'female' | undefined,
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
          // JCI职位相关
          jciPosition: cleanValue(values.jciPosition),
          vpDivision: cleanValue(values.vpDivision),
          positionStartDate: cleanValue(values.positionStartDate ? values.positionStartDate.format('YYYY-MM-DD') : undefined),
          positionEndDate: cleanValue(values.positionEndDate ? values.positionEndDate.format('YYYY-MM-DD') : undefined),
          isActingPosition: cleanValue(values.isActingPosition),
          actingForPosition: cleanValue(values.actingForPosition),
          // 会员分类相关
          membershipCategory: cleanValue(values.membershipCategory),
          accountType: cleanValue(values.accountType),
          categoryReason: cleanValue(values.categoryReason),
          categoryAssignedBy: cleanValue(values.categoryAssignedBy),
          categoryAssignedDate: cleanValue(values.categoryAssignedDate ? values.categoryAssignedDate.format('YYYY-MM-DD') : undefined),
          // 任期管理
          termStartDate: cleanValue(values.termStartDate ? values.termStartDate.format('YYYY-MM-DD') : undefined),
          termEndDate: cleanValue(values.termEndDate ? values.termEndDate.format('YYYY-MM-DD') : undefined),
          isCurrentTerm: cleanValue(values.isCurrentTerm),
          // 特殊权限
          hasSpecialPermissions: cleanValue(values.hasSpecialPermissions),
          specialPermissions: cleanValue(values.specialPermissions),
          permissionNotes: cleanValue(values.permissionNotes),
        },
      };

      await onSubmit(updated);
      message.success('资料已保存');
    } catch (e: any) {
      message.error(e?.message || '保存失败，请重试');
    }
  };

  return (
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
                              <div style={{ padding: 8, border: '1px dashed #ccc', textAlign: 'center' }}>点击上传</div>
                            </Upload>
                            {field.value && (
                              <div style={{ marginTop: 8, wordBreak: 'break-all' }}>{field.value}</div>
                            )}
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
                                  const url = await uploadFileAndGetUrl(`payments/${member?.id}_${Date.now()}`, file as File);
                                  field.onChange(url);
                                  onSuccess && onSuccess({}, new XMLHttpRequest());
                                  message.success('付款凭证上传成功');
                                } catch (e: any) {
                                  onError && onError(e);
                                  message.error('付款凭证上传失败');
                                }
                              }}
                            >
                              <div style={{ padding: 8, border: '1px dashed #ccc', textAlign: 'center' }}>点击上传</div>
                            </Upload>
                            {field.value && (
                              <div style={{ marginTop: 8, wordBreak: 'break-all' }}>{field.value}</div>
                            )}
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
                  <Col span={24}>
                    <Form.Item label="对 JCI 活动感兴趣的类型">
                      <Controller name="jciEventInterests" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="希望在 JCI KL 获得的资源/活动/收益">
                      <Controller name="jciBenefitsExpectation" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="介绍人姓名" required>
                      <Controller name="introducerName" control={control} render={({ field }) => <Input {...field} />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="五年愿景">
                      <Controller name="fiveYearsVision" control={control} render={({ field }) => <Input {...field} />} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="如何成为活跃会员">
                      <Controller name="activeMemberHow" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="刺绣姓名" required>
                      <Controller name="nameToBeEmbroidered" control={control} render={({ field }) => <Input {...field} />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="接受国际商务机会？">
                      <Controller
                        name="acceptInternationalBusiness"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} options={INTERNATIONAL_BIZ_OPTIONS.map(v => ({ value: v, label: v }))} />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="T恤尺码">
                      <Controller name="shirtSize" control={control} render={({ field }) => (
                        <Select {...field} options={SIZE_OPTIONS.map(v => ({ value: v, label: v }))} />
                      )} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="外套尺码">
                      <Controller name="jacketSize" control={control} render={({ field }) => (
                        <Select {...field} options={SIZE_OPTIONS.map(v => ({ value: v, label: v }))} />
                      )} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="T恤版型">
                      <Controller name="cutting" control={control} render={({ field }) => (
                        <Select {...field} options={CUTTING_OPTIONS.map(v => ({ value: v, label: v }))} />
                      )} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="T恤领取状态">
                      <Controller name="tshirtReceivingStatus" control={control} render={({ field }) => (
                        <Select {...field} options={TSHIRT_STATUS_OPTIONS.map(v => ({ value: v, label: v }))} />
                      )} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="付款日期">
                      <Controller name="paymentDate" control={control} render={({ field }) => <DatePicker {...field} style={{ width: '100%' }} format="DD-MMM-YYYY" />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="背书日期">
                      <Controller name="endorsementDate" control={control} render={({ field }) => <DatePicker {...field} style={{ width: '100%' }} format="DD-MMM-YYYY" />} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="付款核验日期">
                      <Controller name="paymentVerifiedDate" control={control} render={({ field }) => <DatePicker {...field} style={{ width: '100%' }} format="DD-MMM-YYYY" />} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: 'jci_position',
            label: 'JCI职位',
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item label="JCI职位" required>
                      <Controller
                        name="jciPosition"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} options={[...JCI_POSITION_OPTIONS]} placeholder="选择JCI职位" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="副会长分管方向">
                      <Controller
                        name="vpDivision"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} options={[...VP_DIVISION_OPTIONS]} placeholder="选择分管方向" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="职位开始日期">
                      <Controller
                        name="positionStartDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker {...field} style={{ width: '100%' }} format="YYYY-MM-DD" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="职位结束日期">
                      <Controller
                        name="positionEndDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker {...field} style={{ width: '100%' }} format="YYYY-MM-DD" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="是否为代理职位">
                      <Controller
                        name="isActingPosition"
                        control={control}
                        render={({ field }) => (
                          <Switch {...field} checked={field.value} />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="代理职位说明">
                      <Controller
                        name="actingForPosition"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} placeholder="如：代理会长" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: 'membership_category',
            label: '会员分类',
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item label="会员类别" required>
                      <Controller
                        name="membershipCategory"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} options={[...MEMBERSHIP_CATEGORY_OPTIONS]} placeholder="选择会员类别" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="账户类型" required>
                      <Controller
                        name="accountType"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} options={[...ACCOUNT_TYPE_OPTIONS]} placeholder="选择账户类型" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="分类原因">
                      <Controller
                        name="categoryReason"
                        control={control}
                        render={({ field }) => (
                          <Input.TextArea {...field} rows={3} placeholder="说明分类原因" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="分类分配人">
                      <Controller
                        name="categoryAssignedBy"
                        control={control}
                        render={({ field }) => (
                          <Input {...field} placeholder="分配人姓名" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="分类分配日期">
                      <Controller
                        name="categoryAssignedDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker {...field} style={{ width: '100%' }} format="YYYY-MM-DD" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: 'permissions',
            label: '权限管理',
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item label="任期开始日期">
                      <Controller
                        name="termStartDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker {...field} style={{ width: '100%' }} format="YYYY-MM-DD" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="任期结束日期">
                      <Controller
                        name="termEndDate"
                        control={control}
                        render={({ field }) => (
                          <DatePicker {...field} style={{ width: '100%' }} format="YYYY-MM-DD" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="当前任期">
                      <Controller
                        name="isCurrentTerm"
                        control={control}
                        render={({ field }) => (
                          <Switch {...field} checked={field.value} />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="拥有特殊权限">
                      <Controller
                        name="hasSpecialPermissions"
                        control={control}
                        render={({ field }) => (
                          <Switch {...field} checked={field.value} />
                        )}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item label="特殊权限说明">
                      <Controller
                        name="permissionNotes"
                        control={control}
                        render={({ field }) => (
                          <Input.TextArea {...field} rows={3} placeholder="说明特殊权限内容" />
                        )}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ),
          },
        ]}
      />
      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit">保存</Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ProfileEditForm;


