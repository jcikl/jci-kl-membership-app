import { ACCOUNT_TYPE_OPTIONS, AccountType } from '@/types/rbac';

// 账户类型颜色映射
export const ACCOUNT_TYPE_COLOR_MAP: Record<AccountType, string> = {
  developer: 'purple',
  admin: 'red',
  member: 'blue',
  moderator: 'orange',
  guest: 'gray',
  user: 'geekblue',
} as const;

// 获取账户类型显示信息
export const getAccountTypeInfo = (accountType: AccountType | string | undefined) => {
  const type = accountType as AccountType;
  const option = ACCOUNT_TYPE_OPTIONS.find(opt => opt.value === type);
  const color = ACCOUNT_TYPE_COLOR_MAP[type] || 'default';
  
  return {
    label: option?.label || type || '未设置',
    color,
    value: type,
    isDefault: !type || type === 'member'
  };
};

// 获取账户类型标签属性（用于 Ant Design Tag 组件）
export const getAccountTypeTagProps = (accountType: AccountType | string | undefined) => {
  const info = getAccountTypeInfo(accountType);
  return {
    color: info.color,
    children: info.label
  };
};

// 验证账户类型是否有效
export const isValidAccountType = (value: string): value is AccountType => {
  return ACCOUNT_TYPE_OPTIONS.some(option => option.value === value);
};

// 获取默认账户类型
export const getDefaultAccountType = (): AccountType => 'user';

// 获取所有账户类型选项（用于表单）
export const getAccountTypeFormOptions = () => ACCOUNT_TYPE_OPTIONS;
