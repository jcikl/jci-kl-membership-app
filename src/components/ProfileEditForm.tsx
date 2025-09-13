import React from 'react';
import { Form, Input, Select, DatePicker, Upload, Tabs, Row, Col, message, Button, Space, Alert, Switch } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { Member } from '@/types';
import FieldGroupSection from '@/components/FieldGroupSection';
import FieldPermissionController from '@/components/FieldPermissionController';
import { FIELD_GROUPS } from '@/types/profileFields';
import { UserRole } from '@/utils/fieldPermissions';
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
  NATIONALITY_OPTIONS,
} from '@/types/constants';
import { } from '@/types/rbac';
import { useIsAdmin } from '@/hooks/usePermissions';
import { uploadFileAndGetUrl } from '@/services/firebase';
import { positionService } from '@/services/positionService';
import { getAccountTypeFormOptions } from '@/utils/accountType';
import MembershipFeeViewer from '@/components/MembershipFeeViewer';
import SenatorScoreManager from '@/components/SenatorScoreManager';
import ActivityParticipationManager from '@/components/ActivityParticipationManager';

interface ProfileEditFormProps {
  member: Member;
  onSubmit: (updated: Partial<Member>) => Promise<void>;
  onCancel?: () => void;
  transactions?: any[];
  purposes?: any[];
}

// Helper function to safely parse dates
const safeParseDate = (dateString: string | undefined, format?: string): dayjs.Dayjs | undefined => {
  if (!dateString) return undefined;
  try {
    const parsed = format ? dayjs(dateString, format) : dayjs(dateString);
    return parsed.isValid() ? parsed : undefined;
  } catch (error) {
    return undefined;
  }
};

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({ member, onSubmit, onCancel, transactions = [], purposes = [] }) => {
  const [positionHistory, setPositionHistory] = React.useState<any[]>([]);
  const [loadingPositions, setLoadingPositions] = React.useState(false);
  const { isAdmin } = useIsAdmin();
  
  // 获取用户角色
  const getUserRole = (): UserRole => {
    // TODO: 根据实际的身份验证逻辑来确定用户角色
    // 这里暂时根据 isAdmin 来判断
    return isAdmin ? 'admin' : 'member';
  };
  
  const userRole = getUserRole();
  
  const { control, handleSubmit, reset } = useForm<any>({
    defaultValues: React.useMemo(() => ({
      name: member?.name || '',
      phone: member?.phone || '',
      fullNameNric: member?.profile?.fullNameNric || '',
      senatorId: member?.profile?.senatorId || '',
      gender: member?.profile?.gender ? (member?.profile?.gender === 'Male' ? 'Male' : 'Female') : undefined,
      race: member?.profile?.race || undefined,
      nationality: member?.profile?.nationality || 'Malaysia',
      address: member?.profile?.address || '',
      nricOrPassport: member?.profile?.nricOrPassport || '',
      birthDate: safeParseDate(member?.profile?.birthDate, 'DD-MMM-YYYY'),
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
      shirtSize: member?.profile?.shirtSize || undefined,
      jacketSize: member?.profile?.jacketSize || undefined,
      cutting: member?.profile?.cutting || undefined,
      tshirtReceivingStatus: member?.profile?.tshirtReceivingStatus || undefined,
      acceptInternationalBusiness: member?.profile?.acceptInternationalBusiness || undefined,
      paymentDate: safeParseDate(member?.profile?.paymentDate, 'DD-MMM-YYYY'),
      endorsementDate: safeParseDate(member?.profile?.endorsementDate, 'DD-MMM-YYYY'),
      paymentVerifiedDate: safeParseDate(member?.profile?.paymentVerifiedDate, 'DD-MMM-YYYY'),
      profilePhotoUrl: member?.profile?.profilePhotoUrl || '',
      paymentSlipUrl: member?.profile?.paymentSlipUrl || '',
      joinedDate: safeParseDate(member?.joinDate),
      // JCI职位相关字段已移除
      // 入会信息（仅开发者可编辑）
      status: member?.status || undefined,
      level: member?.level || undefined,
      accountType: member?.accountType || 'member',
      // 任期管理字段已移除
      // 特殊权限字段已移除
    }), [member]),
  });

  React.useEffect(() => {
    reset();
  }, [member, reset]);

  // 加载职位历史（从职位管理记录获取）
  React.useEffect(() => {
    let mounted = true;
    const loadPositions = async () => {
      if (!member?.id) return;
      setLoadingPositions(true);
      try {
        const list = await positionService.getPositionHistory(member.id);
        if (!mounted) return;
        setPositionHistory(list);
      } catch (e) {
        // 忽略错误，仅不显示
      } finally {
        if (mounted) setLoadingPositions(false);
      }
    };
    loadPositions();
    return () => { mounted = false; };
  }, [member?.id]);

  const cleanValue = (value: any) => (value === undefined ? null : value);

  // 渲染字段组的辅助函数
  const renderFieldGroup = (groupKey: string) => {
    const group = FIELD_GROUPS.find(g => g.key === groupKey);
    if (!group) return null;

    const renderField = (field: string) => {
      switch (field) {
        // ========== 基本信息标签页 ==========
        
        // 个人身份信息
        case 'name':
          return (
            <Col span={12}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="姓名" required>
                  <Controller
                    name="name"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="真实姓名" />}
                  />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        case 'fullNameNric':
          return (
            <Col span={12}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
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
              </FieldPermissionController>
            </Col>
          );
        case 'gender':
          return (
            <Col span={8}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="性别" required>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} options={GENDER_OPTIONS.map(g => ({ value: g, label: g }))} allowClear />
                    )}
                  />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        case 'race':
          return (
            <Col span={8}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="种族" required>
                  <Controller
                    name="race"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} options={RACE_OPTIONS.map(g => ({ value: g, label: g }))} allowClear />
                    )}
                  />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        case 'nationality':
          return (
            <Col span={8}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="国籍" required>
                  <Controller
                    name="nationality"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        {...field} 
                        options={NATIONALITY_OPTIONS.map(n => ({ value: n, label: n }))} 
                        allowClear 
                        placeholder="请选择国籍"
                      />
                    )}
                  />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        case 'birthDate':
          return (
            <Col span={8}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="出生日期">
                  <Controller 
                    name="birthDate" 
                    control={control} 
                    render={({ field }) => (
                      <DatePicker
                        value={field.value ? (typeof field.value === 'string' ? safeParseDate(field.value, 'DD-MMM-YYYY') : field.value) : null}
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
              </FieldPermissionController>
            </Col>
          );
        case 'nricOrPassport':
          return (
            <Col span={12}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
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
              </FieldPermissionController>
            </Col>
          );
        case 'address':
          return (
            <Col span={24}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="家庭住址">
                  <Controller name="address" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        
        // 联系方式
        case 'email':
          return (
            <Col span={12}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="邮箱" required>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="邮箱" />}
                  />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        case 'phone':
          return (
            <Col span={12}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="手机号" required>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="手机号" />}
                  />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        case 'whatsappGroup':
          return (
            <Col span={12}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="加入 WhatsApp 群" valuePropName="checked">
                  <Controller name="whatsappGroup" control={control} render={({ field }) => <Switch {...field} checked={field.value} />} />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        
        // 个人兴趣
        case 'hobbies':
          return (
            <Col span={24}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="兴趣/爱好（多选）">
                  <Controller
                    name="hobbies"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} mode="multiple" options={HOBBY_OPTIONS.map(v => ({ value: v, label: v }))} />
                    )}
                  />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        
        // 文件资料
        case 'profilePhotoUrl':
          return (
            <Col span={12}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
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
              </FieldPermissionController>
            </Col>
          );
        // ========== 职业信息标签页 ==========
        
        // 公司信息
        case 'company':
          return (
            <Col span={12}>
              <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                <Form.Item label="公司/雇主名称" required>
                  <Controller name="company" control={control} render={({ field }) => <Input {...field} />} />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        case 'departmentAndPosition':
          return (
            <Col span={12}>
              <Form.Item label="部门与职位" required>
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller name="departmentAndPosition" control={control} render={({ field }) => <Input {...field} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'industryDetail':
          return (
            <Col span={24}>
              <Form.Item label="行业描述">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller name="industryDetail" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'categories':
          return (
            <Col span={12}>
              <Form.Item label="类别">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="categories"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} mode="multiple" options={CATEGORY_OPTIONS.map(v => ({ value: v, label: v }))} />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'ownIndustry':
          return (
            <Col span={12}>
              <Form.Item label="自身行业">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="ownIndustry"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} mode="multiple" options={INTERESTED_INDUSTRY_OPTIONS.map(v => ({ value: v, label: v }))} />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'companyIntro':
          return (
            <Col span={24}>
              <Form.Item label="公司与角色简介">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller name="companyIntro" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'acceptInternationalBusiness':
          return (
            <Col span={12}>
              <Form.Item label="接受国际商务机会？">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="acceptInternationalBusiness"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} options={INTERNATIONAL_BIZ_OPTIONS.map(v => ({ value: v, label: v }))} allowClear />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'interestedIndustries':
          return (
            <Col span={12}>
              <Form.Item label="关注行业">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="interestedIndustries"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} mode="multiple" options={INTERESTED_INDUSTRY_OPTIONS.map(v => ({ value: v, label: v }))} />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        
        // 社交网络
        case 'linkedin':
          return (
            <Col span={12}>
              <Form.Item label="LinkedIn">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller name="linkedin" control={control} render={({ field }) => <Input {...field} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'companyWebsite':
          return (
            <Col span={12}>
              <Form.Item label="Company Website">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller name="companyWebsite" control={control} render={({ field }) => <Input {...field} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        // ========== JCI 相关标签页 ==========
        
        // 入会信息
        case 'accountType':
          return (
            <Col span={12}>
              <Form.Item label="用户户口类别">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller 
                    name="accountType" 
                    control={control} 
                    render={({ field }) => (
                      <Select 
                        {...field} 
                        placeholder="请选择用户户口类别"
                        disabled={!isAdmin}
                        options={getAccountTypeFormOptions() as any}
                        allowClear
                      />
                    )} 
                  />
                </FieldPermissionController>
                {!isAdmin && (
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    只有管理员可以修改用户户口类别
                  </div>
                )}
              </Form.Item>
            </Col>
          );
        case 'status':
          return (
            <Col span={12}>
              <Form.Item label="状态">
                <FieldPermissionController 
                  field={field} 
                  userRole={userRole} 
                  memberData={member}
                  showPermissionIndicator={true}
                >
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        {...field} 
                        options={[
                          { value: 'active', label: '活跃' },
                          { value: 'inactive', label: '非活跃' },
                          { value: 'pending', label: '待审核' },
                          { value: 'suspended', label: '暂停' }
                        ]} 
                        disabled={userRole !== 'developer'}
                      />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'level':
          return (
            <Col span={12}>
              <Form.Item label="等级">
                <FieldPermissionController 
                  field={field} 
                  userRole={userRole} 
                  memberData={member}
                  showPermissionIndicator={true}
                >
                  <Controller
                    name="level"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        {...field} 
                        options={[
                          { value: 'bronze', label: '铜级' },
                          { value: 'silver', label: '银级' },
                          { value: 'gold', label: '金级' },
                          { value: 'platinum', label: '铂金级' },
                          { value: 'diamond', label: '钻石级' }
                        ]} 
                        disabled={userRole !== 'developer'}
                      />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'senatorId':
          return (
            <Col span={12}>
              <FieldPermissionController 
                field={field} 
                userRole={userRole} 
                memberData={member}
                showLockMessage={false}
                showPermissionIndicator={false}
              >
                <Form.Item label="参议员编号">
                  <Controller 
                    name="senatorId" 
                    control={control} 
                    render={({ field }) => (
                      <Input 
                        {...field} 
                        placeholder="请输入参议员编号"
                        disabled={member?.profile?.senatorVerified === true}
                        onChange={(e) => {
                          // 只保留英文字母和数字，并转换为大写
                          const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                          field.onChange(value);
                        }}
                        suffix={
                          member?.profile?.senatorVerified ? (
                            <CheckCircleOutlined 
                              style={{ color: '#52c41a' }} 
                              title="参议员身份已验证"
                            />
                          ) : null
                        }
                      />
                    )} 
                  />
                </Form.Item>
              </FieldPermissionController>
            </Col>
          );
        case 'memberId':
          return (
            <Col span={12}>
              <Form.Item label="会员编号">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller 
                    name="memberId" 
                    control={control} 
                    render={({ field }) => (
                      <Input 
                        {...field} 
                        placeholder="请输入会员编号"
                        onChange={(e) => {
                          // 只保留英文字母和数字，并转换为大写
                          const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                          field.onChange(value);
                        }}
                      />
                    )} 
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'introducerName':
          return (
            <Col span={12}>
              <Form.Item label="介绍人姓名" required>
                <FieldPermissionController 
                  field={field} 
                  userRole={userRole} 
                  memberData={member}
                  showLockMessage={true}
                >
                  <Controller name="introducerName" control={control} render={({ field }) => <Input {...field} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'jciEventInterests':
          return (
            <Col span={24}>
              <Form.Item label="对 JCI 活动感兴趣的类型">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller name="jciEventInterests" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'jciBenefitsExpectation':
          return (
            <Col span={24}>
              <Form.Item label="希望在 JCI KL 获得的资源/活动/收益">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller name="jciBenefitsExpectation" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'activeMemberHow':
          return (
            <Col span={24}>
              <Form.Item label="如何成为活跃会员">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller name="activeMemberHow" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'fiveYearsVision':
          return (
            <Col span={24}>
              <Form.Item label="五年愿景">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller name="fiveYearsVision" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        // 服装信息
        case 'nameToBeEmbroidered':
          return (
            <Col span={12}>
              <Form.Item label="刺绣姓名" required>
                <FieldPermissionController 
                  field={field} 
                  userRole={userRole} 
                  memberData={member}
                  showLockMessage={true}
                >
                  <Controller name="nameToBeEmbroidered" control={control} render={({ field }) => <Input {...field} />} />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'shirtSize':
          return (
            <Col span={12}>
              <Form.Item label="T恤尺码">
                <FieldPermissionController 
                  field={field} 
                  userRole={userRole} 
                  memberData={member}
                  showLockMessage={true}
                >
                  <Controller
                    name="shirtSize"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} options={SIZE_OPTIONS.map(v => ({ value: v, label: v }))} allowClear />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'jacketSize':
          return (
            <Col span={12}>
              <Form.Item label="外套尺码">
                <FieldPermissionController 
                  field={field} 
                  userRole={userRole} 
                  memberData={member}
                  showLockMessage={true}
                >
                  <Controller
                    name="jacketSize"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} options={SIZE_OPTIONS.map(v => ({ value: v, label: v }))} allowClear />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'cutting':
          return (
            <Col span={12}>
              <Form.Item label="T恤版型">
                <FieldPermissionController 
                  field={field} 
                  userRole={userRole} 
                  memberData={member}
                  showLockMessage={true}
                >
                  <Controller
                    name="cutting"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} options={CUTTING_OPTIONS.map(v => ({ value: v, label: v }))} allowClear />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'tshirtReceivingStatus':
          return (
            <Col span={12}>
              <Form.Item label="T恤领取状态">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="tshirtReceivingStatus"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} options={TSHIRT_STATUS_OPTIONS.map(v => ({ value: v, label: v }))} allowClear />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        
        // ========== JCI职位标签页 ==========
        // 职位信息字段已移除
        
        // ========== 新增字段处理 ==========
        
        // 付款信息字段
        case 'paymentDate':
          return (
            <Col span={12}>
              <Form.Item label="付款日期">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="paymentDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker 
                        {...field} 
                        format="DD-MMM-YYYY"
                        style={{ width: '100%' }}
                        disabled
                      />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'endorsementDate':
          return (
            <Col span={12}>
              <Form.Item label="背书日期">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="endorsementDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker 
                        {...field} 
                        format="DD-MMM-YYYY"
                        style={{ width: '100%' }}
                        disabled
                      />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'paymentVerifiedDate':
          return (
            <Col span={12}>
              <Form.Item label="付款验证日期">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="paymentVerifiedDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker 
                        {...field} 
                        format="DD-MMM-YYYY"
                        style={{ width: '100%' }}
                        disabled
                      />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'paymentSlipUrl':
          return (
            <Col span={24}>
              <Form.Item label="付款凭证">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="paymentSlipUrl"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} disabled placeholder="付款凭证URL" />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        
        
        
        // 任务完成情况字段
        case 'requiredTasksCompleted':
          return (
            <Col span={12}>
              <Form.Item label="必需任务完成">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="requiredTasksCompleted"
                    control={control}
                    render={({ field }) => (
                      <Switch {...field} disabled />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        case 'taskCompletions':
          return (
            <Col span={24}>
              <Form.Item label="任务完成情况">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="taskCompletions"
                    control={control}
                    render={({ field }) => (
                      <Input.TextArea 
                        {...field} 
                        disabled 
                        rows={4}
                        placeholder="任务完成情况详情"
                      />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        
        
        // 其他新增字段
        case 'joinDate':
          return (
            <Col span={12}>
              <Form.Item label="入会日期">
                <FieldPermissionController field={field} userRole={userRole} memberData={member}>
                  <Controller
                    name="joinDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker 
                        {...field} 
                        format="YYYY-MM-DD"
                        style={{ width: '100%' }}
                        disabled
                      />
                    )}
                  />
                </FieldPermissionController>
              </Form.Item>
            </Col>
          );
        
        default:
          return null;
      }
    };

    return (
      <FieldGroupSection group={group}>
        <Row gutter={[16, 16]}>
          {group.fields.map(field => (
            <React.Fragment key={field}>
              {renderField(field)}
            </React.Fragment>
          ))}
        </Row>
      </FieldGroupSection>
    );
  };

  const onSave = async (values: any) => {
    try {
      const updated: Partial<Member> = {
        name: values.name,
        phone: values.phone,
        memberId: cleanValue(values.memberId),
        joinDate: values.joinedDate ? values.joinedDate.toISOString() : member.joinDate,
        status: cleanValue(values.status),
        level: cleanValue(values.level),
        accountType: cleanValue(values.accountType),
        profile: {
          ...member.profile,
          fullNameNric: cleanValue(values.fullNameNric),
          senatorId: cleanValue(values.senatorId),
          gender: cleanValue(values.gender === 'Male' ? 'Male' : values.gender === 'Female' ? 'Female' : undefined),
          race: cleanValue(values.race),
          nationality: cleanValue(values.nationality),
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
          // JCI职位相关字段已移除
          // 会员分类相关（已迁移到分类管理系统）
          // 注意：不再通过此表单修改分类信息
          // 任期管理字段已移除
          // 特殊权限字段已移除
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
                {renderFieldGroup('personal_identity')}
                {renderFieldGroup('contact')}
                {renderFieldGroup('personal_interests')}
                {renderFieldGroup('files')}
              </div>
            ),
          },
          {
            key: 'career',
            label: '职业信息',
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                {renderFieldGroup('company_info')}
                {renderFieldGroup('social_network')}
              </div>
            ),
          },
          {
            key: 'jci',
            label: 'JCI 相关',
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                {renderFieldGroup('jci_membership')}
                {renderFieldGroup('payment_info')}
                {renderFieldGroup('clothing_info')}
              </div>
            ),
          },
          {
            key: 'jci_position',
            label: 'JCI职位',
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                <FieldGroupSection 
                  group={{
                    key: 'position_history',
                    label: '职位历史记录',
                    fields: []
                  }}
                >
                    <Alert
                      message="本会员的JCI职位记录来自职位管理模块"
                      description="任职年份与岗位会自动从职位管理记录中查询并展示。如需调整，请到系统设置 → 职位管理进行维护。"
                      type="info"
                      showIcon
                    />
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 4, padding: 8, marginTop: 16 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>历年任职</div>
                      {loadingPositions ? (
                        <div>加载中...</div>
                      ) : positionHistory && positionHistory.length > 0 ? (
                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>年份</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>岗位</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>分管方向</th>
                                <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                              </tr>
                            </thead>
                            <tbody>
                              {positionHistory.map((p) => {
                                const start = p.startDate || p.assignedDate;
                                const year = start ? new Date(start).getFullYear() : '';
                                return (
                                  <tr key={p.id}>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #fafafa' }}>{year}</td>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #fafafa' }}>{p.position}</td>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #fafafa' }}>{p.vpDivision || '-'}</td>
                                    <td style={{ padding: '6px 8px', borderBottom: '1px solid #fafafa' }}>{p.status}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ color: '#999' }}>暂无职位记录</div>
                      )}
                    </div>
                </FieldGroupSection>
              </div>
            ),
          },
          {
            key: 'task_completion',
            label: '任务完成',
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                {renderFieldGroup('task_completion')}
              </div>
            ),
          },
          {
            key: 'membership_fee',
            label: '会费记录',
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                <MembershipFeeViewer 
                  member={member}
                  transactions={transactions}
                  purposes={purposes}
                />
              </div>
            ),
          },
          {
            key: 'senator_score',
            label: '参议员分数',
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                <SenatorScoreManager 
                  member={member}
                  onUpdate={(updatedMember) => {
                    // 更新本地状态，触发重新渲染
                    Object.assign(member, updatedMember);
                  }}
                  isAdmin={isAdmin}
                />
              </div>
            ),
          },
          {
            key: 'activity_participation',
            label: '活动参与',
            children: (
              <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0 8px' }}>
                <ActivityParticipationManager 
                  member={member}
                  onUpdate={(updatedMember) => {
                    // 更新本地状态，触发重新渲染
                    Object.assign(member, updatedMember);
                  }}
                  isAdmin={isAdmin}
                />
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


