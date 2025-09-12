// 字段权限相关类型定义
export enum FieldPermission {
  READ_WRITE = 'read_write',
  READ_ONLY = 'read_only',
  LOCKED = 'locked',
  ADMIN_ONLY = 'admin_only'
}

export enum LockReason {
  TSHIRT_REQUESTED = 'tshirt_requested',
  SENATOR_VERIFIED = 'senator_verified',
  INTRODUCER_FILLED = 'introducer_filled',
  ADMIN_LOCKED = 'admin_locked'
}

export interface FieldPermissionRule {
  field: string;
  permission: FieldPermission;
  lockReason?: LockReason;
  condition?: (memberData: any) => boolean;
}

export interface FieldGroup {
  key: string;
  label: string;
  description?: string;
  fields: string[];
}

// 字段分组定义
export const FIELD_GROUPS: FieldGroup[] = [
  // 基本信息标签页
  {
    key: 'personal_identity',
    label: '个人身份信息',
    fields: [
      'name',
      'fullNameNric', 
      'gender',
      'race',
      'birthDate',
      'nricOrPassport',
      'address'
    ]
  },
  {
    key: 'contact',
    label: '联系方式',
    fields: [
      'email',
      'phone',
      'whatsappGroup'
    ]
  },
  {
    key: 'personal_interests',
    label: '个人兴趣',
    fields: [
      'hobbies'
    ]
  },
  {
    key: 'files',
    label: '文件资料',
    fields: [
      'profilePhotoUrl'
    ]
  },
  // 职业信息标签页
  {
    key: 'company_info',
    label: '公司信息',
    fields: [
      'company',
      'departmentAndPosition',
      'industryDetail',
      'categories',
      'ownIndustry',
      'companyIntro',
      'acceptInternationalBusiness',
      'interestedIndustries'
    ]
  },
  {
    key: 'social_network',
    label: '社交网络',
    fields: [
      'linkedin',
      'companyWebsite'
    ]
  },
  // JCI 相关标签页
  {
    key: 'jci_membership',
    label: '入会信息',
    fields: [
      'accountType',
      'status',
      'level',
      'senatorId',
      'memberId',
      'introducerName',
      'jciEventInterests',
      'jciBenefitsExpectation',
      'activeMemberHow',
      'fiveYearsVision'
    ]
  },
  {
    key: 'clothing_info',
    label: '服装信息',
    fields: [
      'nameToBeEmbroidered',
      'shirtSize',
      'jacketSize',
      'cutting',
      'tshirtReceivingStatus'
    ]
  },
  // JCI职位标签页
  {
    key: 'jci_position',
    label: '职位信息',
    fields: [
      'jciPosition',
      'positionStartDate',
      'positionEndDate'
    ]
  }
];

// 字段权限规则定义
export const FIELD_PERMISSION_RULES: FieldPermissionRule[] = [
  // 管理员专用字段
  {
    field: 'status',
    permission: FieldPermission.ADMIN_ONLY
  },
  {
    field: 'level',
    permission: FieldPermission.ADMIN_ONLY
  },
  {
    field: 'memberId',
    permission: FieldPermission.ADMIN_ONLY
  },
  {
    field: 'accountType',
    permission: FieldPermission.ADMIN_ONLY
  },
  {
    field: 'whatsappGroup',
    permission: FieldPermission.ADMIN_ONLY
  },
  {
    field: 'tshirtReceivingStatus',
    permission: FieldPermission.ADMIN_ONLY
  },
  {
    field: 'jciPosition',
    permission: FieldPermission.ADMIN_ONLY
  },
  {
    field: 'positionStartDate',
    permission: FieldPermission.ADMIN_ONLY
  },
  {
    field: 'positionEndDate',
    permission: FieldPermission.ADMIN_ONLY
  },
  
  // 条件锁定字段
  {
    field: 'senatorId',
    permission: FieldPermission.READ_WRITE,
    condition: (memberData) => !memberData.profile?.senatorVerified,
    lockReason: LockReason.SENATOR_VERIFIED
  },
  {
    field: 'introducerName',
    permission: FieldPermission.READ_WRITE,
    condition: (memberData) => !memberData.profile?.introducerName,
    lockReason: LockReason.INTRODUCER_FILLED
  },
  {
    field: 'nameToBeEmbroidered',
    permission: FieldPermission.READ_WRITE,
    condition: (memberData) => memberData.profile?.tshirtReceivingStatus !== 'Requested',
    lockReason: LockReason.TSHIRT_REQUESTED
  },
  {
    field: 'shirtSize',
    permission: FieldPermission.READ_WRITE,
    condition: (memberData) => memberData.profile?.tshirtReceivingStatus !== 'Requested',
    lockReason: LockReason.TSHIRT_REQUESTED
  },
  {
    field: 'jacketSize',
    permission: FieldPermission.READ_WRITE,
    condition: (memberData) => memberData.profile?.tshirtReceivingStatus !== 'Requested',
    lockReason: LockReason.TSHIRT_REQUESTED
  },
  {
    field: 'cutting',
    permission: FieldPermission.READ_WRITE,
    condition: (memberData) => memberData.profile?.tshirtReceivingStatus !== 'Requested',
    lockReason: LockReason.TSHIRT_REQUESTED
  }
];

// 锁定原因提示信息
export const LOCK_REASON_MESSAGES: Record<LockReason, string> = {
  [LockReason.TSHIRT_REQUESTED]: 'T恤已申请，无法修改',
  [LockReason.SENATOR_VERIFIED]: '参议员编号已验证',
  [LockReason.INTRODUCER_FILLED]: '介绍人姓名已填写',
  [LockReason.ADMIN_LOCKED]: '管理员已锁定此字段'
};
