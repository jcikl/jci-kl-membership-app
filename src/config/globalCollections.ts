/**
 * 全局集合ID配置
 * 统一管理所有Firebase集合标识符，确保会员相关功能使用一致的集合ID
 */

export const GLOBAL_COLLECTIONS = {
  // 会员相关集合
  MEMBERS: 'members',
  MEMBER_POSITIONS: 'member_positions',
  MEMBER_CATEGORIES: 'member_categories',
  MEMBER_PROFILES: 'member_profiles',
  
  // 活动管理集合
  EVENTS: 'events',
  EVENT_REGISTRATIONS: 'eventRegistrations',
  EVENT_PARTICIPANTS: 'eventParticipants',
  
  // 财务管理集合
  TRANSACTIONS: 'transactions',
  BANK_ACCOUNTS: 'bankAccounts',
  TRANSACTION_PURPOSES: 'transactionPurposes',
  TRANSACTION_SPLITS: 'transactionSplits',
  FINANCIAL_RECORDS: 'financialRecords',
  
  // 账单支付集合
  BILL_PAYMENTS: 'billPayments',
  PAYMENT_REQUESTS: 'paymentRequests',
  PAYMENT_VOUCHERS: 'paymentVouchers',
  
  // 个人资料相关集合
  PROFILE_ATTACHMENTS: 'profileAttachments',
  PROFILE_DOCUMENTS: 'profileDocuments',
  
  // 系统配置集合
  CHAPTER_SETTINGS: 'chapterSettings',
  SYSTEM_CONFIG: 'systemConfig',
  APP_SETTINGS: 'appSettings',
  
  // 权限管理集合
  RBAC_PERMISSIONS: 'rbac_permissions',
  RBAC_ROLES: 'rbac_roles',
  RBAC_ROLE_BINDINGS: 'rbac_role_bindings',
  RBAC_PERMISSION_MATRIX: 'rbac_permission_matrix',
  
  // 奖励系统集合
  AWARDS: 'awards',
  AWARD_SUBMISSIONS: 'awardSubmissions',
  AWARD_CATEGORIES: 'awardCategories',
  
  // 问卷系统集合
  SURVEYS: 'surveys',
  SURVEY_RESPONSES: 'surveyResponses',
  SURVEY_TEMPLATES: 'surveyTemplates',
  
  // 项目户口集合
  PROJECT_ACCOUNTS: 'projectAccounts',
  
  // 审计日志集合
  AUDIT_LOGS: 'auditLogs',
  SYSTEM_LOGS: 'systemLogs'
} as const;

/**
 * 集合类型定义
 */
export type CollectionType = keyof typeof GLOBAL_COLLECTIONS;

/**
 * 全局Collection ID获取器
 * @param collectionType 集合类型
 * @returns 对应的集合ID字符串
 */
export const getCollectionId = (collectionType: CollectionType): string => {
  return GLOBAL_COLLECTIONS[collectionType];
};

/**
 * 批量获取集合ID
 * @param collectionTypes 集合类型数组
 * @returns 集合ID对象
 */
export const getCollectionIds = (collectionTypes: CollectionType[]): Record<CollectionType, string> => {
  return collectionTypes.reduce((acc, type) => {
    acc[type] = getCollectionId(type);
    return acc;
  }, {} as Record<CollectionType, string>);
};

/**
 * 验证集合ID是否存在
 * @param collectionId 集合ID字符串
 * @returns 是否为有效的集合ID
 */
export const isValidCollectionId = (collectionId: string): collectionId is string => {
  return Object.values(GLOBAL_COLLECTIONS).includes(collectionId as any);
};

/**
 * 根据集合ID获取集合类型
 * @param collectionId 集合ID字符串
 * @returns 对应的集合类型或undefined
 */
export const getCollectionType = (collectionId: string): CollectionType | undefined => {
  const entry = Object.entries(GLOBAL_COLLECTIONS).find(([_, id]) => id === collectionId);
  return entry ? (entry[0] as CollectionType) : undefined;
};

/**
 * 会员相关集合列表
 */
export const MEMBER_RELATED_COLLECTIONS: CollectionType[] = [
  'MEMBERS',
  'MEMBER_POSITIONS',
  'MEMBER_CATEGORIES',
  'MEMBER_PROFILES',
  'EVENTS',
  'EVENT_REGISTRATIONS',
  'EVENT_PARTICIPANTS',
  'TRANSACTIONS',
  'BILL_PAYMENTS',
  'PAYMENT_REQUESTS',
  'PROFILE_ATTACHMENTS',
  'PROFILE_DOCUMENTS'
];

/**
 * 财务管理相关集合列表
 */
export const FINANCE_RELATED_COLLECTIONS: CollectionType[] = [
  'TRANSACTIONS',
  'BANK_ACCOUNTS',
  'TRANSACTION_PURPOSES',
  'TRANSACTION_SPLITS',
  'FINANCIAL_RECORDS',
  'BILL_PAYMENTS',
  'PAYMENT_REQUESTS',
  'PAYMENT_VOUCHERS'
];

/**
 * 系统管理相关集合列表
 */
export const SYSTEM_COLLECTIONS: CollectionType[] = [
  'CHAPTER_SETTINGS',
  'SYSTEM_CONFIG',
  'APP_SETTINGS',
  'RBAC_PERMISSIONS',
  'RBAC_ROLES',
  'RBAC_ROLE_BINDINGS',
  'RBAC_PERMISSION_MATRIX',
  'AUDIT_LOGS',
  'SYSTEM_LOGS'
];

/**
 * 导出所有集合ID的数组
 */
export const ALL_COLLECTION_IDS = Object.values(GLOBAL_COLLECTIONS);

/**
 * 导出所有集合类型的数组
 */
export const ALL_COLLECTION_TYPES = Object.keys(GLOBAL_COLLECTIONS) as CollectionType[];
