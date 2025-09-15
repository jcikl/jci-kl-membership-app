/**
 * 全局数据验证配置
 * 统一管理数据验证规则、字段验证器和表单验证
 */

import * as yup from 'yup';

/**
 * 全局验证配置
 */
export const GLOBAL_VALIDATION_CONFIG = {
  // 通用验证规则
  VALIDATION_RULES: {
    // 邮箱验证
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    
    // 马来西亚手机号验证
    phone: /^(\+?6?01)[0-46-9]-*[0-9]{7,8}$/,
    
    // 马来西亚身份证验证
    nric: /^[0-9]{6}-[0-9]{2}-[0-9]{4}$/,
    
    // 会员编号验证
    memberId: /^JCI\d{7}$/,
    
    // 密码验证
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    
    // 姓名验证（支持中英文）
    name: /^[\u4e00-\u9fa5a-zA-Z\s]{2,50}$/,
    
    // 地址验证
    address: /^[\u4e00-\u9fa5a-zA-Z0-9\s\-,.#/]{5,200}$/,
    
    // 金额验证
    amount: /^\d+(\.\d{1,2})?$/,
    
    // 网址验证
    url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
    
    // 车牌号验证（马来西亚）
    licensePlate: /^[A-Z]{1,3}\s?\d{1,4}\s?[A-Z]{0,3}$/
  },
  
  // 字段长度限制
  FIELD_LIMITS: {
    name: { min: 2, max: 50 },
    email: { max: 100 },
    phone: { min: 10, max: 15 },
    address: { max: 500 },
    description: { max: 1000 },
    notes: { max: 2000 },
    title: { min: 5, max: 100 },
    memberId: { min: 7, max: 10 },
    password: { min: 8, max: 50 },
    nric: { exact: 14 }
  },
  
  // 数值范围限制
  NUMBER_RANGES: {
    age: { min: 16, max: 100 },
    amount: { min: 0, max: 999999.99 },
    percentage: { min: 0, max: 100 },
    year: { min: 1900, max: 2100 },
    month: { min: 1, max: 12 },
    day: { min: 1, max: 31 }
  },
  
  // 日期验证规则
  DATE_RULES: {
    minDate: new Date('1900-01-01'),
    maxDate: new Date('2100-12-31'),
    allowFutureDates: true,
    allowPastDates: true,
    businessDaysOnly: false
  },
  
  // 文件验证规则
  FILE_RULES: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    maxFiles: 10
  }
} as const;

/**
 * 验证规则类型
 */
export type ValidationRule = keyof typeof GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES;

/**
 * 字段限制类型
 */
export type FieldLimit = keyof typeof GLOBAL_VALIDATION_CONFIG.FIELD_LIMITS;

/**
 * 全局验证服务
 */
export const globalValidationService = {
  /**
   * 验证邮箱
   */
  validateEmail: (email: string): boolean => {
    return GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.email.test(email);
  },

  /**
   * 验证手机号
   */
  validatePhone: (phone: string): boolean => {
    return GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.phone.test(phone);
  },

  /**
   * 验证身份证号
   */
  validateNRIC: (nric: string): boolean => {
    return GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.nric.test(nric);
  },

  /**
   * 验证会员编号
   */
  validateMemberId: (memberId: string): boolean => {
    return GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.memberId.test(memberId);
  },

  /**
   * 验证密码强度
   */
  validatePassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('密码长度至少为8位');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    
    if (!/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 验证姓名
   */
  validateName: (name: string): boolean => {
    return GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.name.test(name);
  },

  /**
   * 验证地址
   */
  validateAddress: (address: string): boolean => {
    return GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.address.test(address);
  },

  /**
   * 验证金额
   */
  validateAmount: (amount: string | number): boolean => {
    const amountStr = amount.toString();
    return GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.amount.test(amountStr);
  },

  /**
   * 验证网址
   */
  validateUrl: (url: string): boolean => {
    return GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.url.test(url);
  },

  /**
   * 验证车牌号
   */
  validateLicensePlate: (plate: string): boolean => {
    return GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.licensePlate.test(plate);
  },

  /**
   * 验证字段长度
   */
  validateFieldLength: (value: string, field: FieldLimit): { valid: boolean; error?: string } => {
    const limits = GLOBAL_VALIDATION_CONFIG.FIELD_LIMITS[field];
    
    if ('min' in limits && value.length < limits.min) {
      return {
        valid: false,
        error: `${field}长度不能少于${limits.min}个字符`
      };
    }
    
    if ('max' in limits && value.length > limits.max) {
      return {
        valid: false,
        error: `${field}长度不能超过${limits.max}个字符`
      };
    }
    
    if ('exact' in limits && value.length !== limits.exact) {
      return {
        valid: false,
        error: `${field}长度必须为${limits.exact}个字符`
      };
    }
    
    return { valid: true };
  },

  /**
   * 验证数值范围
   */
  validateNumberRange: (value: number, range: keyof typeof GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES): { valid: boolean; error?: string } => {
    const limits = GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES[range];
    
    if (value < limits.min) {
      return {
        valid: false,
        error: `${range}不能小于${limits.min}`
      };
    }
    
    if (value > limits.max) {
      return {
        valid: false,
        error: `${range}不能大于${limits.max}`
      };
    }
    
    return { valid: true };
  },

  /**
   * 验证文件
   */
  validateFile: (file: File): { valid: boolean; error?: string } => {
    const rules = GLOBAL_VALIDATION_CONFIG.FILE_RULES;
    
    if (file.size > rules.maxSize) {
      return {
        valid: false,
        error: `文件大小不能超过${Math.round(rules.maxSize / 1024 / 1024)}MB`
      };
    }
    
    if (!rules.allowedTypes.includes(file.type as any)) {
      return {
        valid: false,
        error: `不支持的文件类型: ${file.type}`
      };
    }
    
    return { valid: true };
  },

  /**
   * 验证日期范围
   */
  validateDateRange: (startDate: Date, endDate: Date): { valid: boolean; error?: string } => {
    if (startDate >= endDate) {
      return {
        valid: false,
        error: '结束日期必须晚于开始日期'
      };
    }
    
    const rules = GLOBAL_VALIDATION_CONFIG.DATE_RULES;
    
    if (startDate < rules.minDate) {
      return {
        valid: false,
        error: `开始日期不能早于${rules.minDate.toLocaleDateString()}`
      };
    }
    
    if (endDate > rules.maxDate) {
      return {
        valid: false,
        error: `结束日期不能晚于${rules.maxDate.toLocaleDateString()}`
      };
    }
    
    return { valid: true };
  }
};

/**
 * Yup验证模式
 */
export const yupSchemas: Record<string, any> = {
  /**
   * 邮箱验证模式
   */
  email: yup.string()
    .required('邮箱不能为空')
    .email('邮箱格式不正确')
    .max(100, '邮箱长度不能超过100个字符'),

  /**
   * 手机号验证模式
   */
  phone: yup.string()
    .required('手机号不能为空')
    .matches(GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.phone, '手机号格式不正确'),

  /**
   * 身份证号验证模式
   */
  nric: yup.string()
    .required('身份证号不能为空')
    .matches(GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.nric, '身份证号格式不正确'),

  /**
   * 会员编号验证模式
   */
  memberId: yup.string()
    .required('会员编号不能为空')
    .matches(GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.memberId, '会员编号格式不正确'),

  /**
   * 密码验证模式
   */
  password: yup.string()
    .required('密码不能为空')
    .min(8, '密码长度至少为8位')
    .matches(/[a-z]/, '密码必须包含小写字母')
    .matches(/[A-Z]/, '密码必须包含大写字母')
    .matches(/\d/, '密码必须包含数字'),

  /**
   * 姓名验证模式
   */
  name: yup.string()
    .required('姓名不能为空')
    .matches(GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.name, '姓名格式不正确')
    .min(2, '姓名长度至少为2个字符')
    .max(50, '姓名长度不能超过50个字符'),

  /**
   * 地址验证模式
   */
  address: yup.string()
    .matches(GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.address, '地址格式不正确')
    .max(500, '地址长度不能超过500个字符'),

  /**
   * 金额验证模式
   */
  amount: yup.number()
    .required('金额不能为空')
    .min(0, '金额不能为负数')
    .max(999999.99, '金额不能超过999,999.99'),

  /**
   * 网址验证模式
   */
  url: yup.string()
    .matches(GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.url, '网址格式不正确'),

  /**
   * 日期验证模式
   */
  date: yup.date()
    .required('日期不能为空')
    .min(GLOBAL_VALIDATION_CONFIG.DATE_RULES.minDate, '日期不能早于1900年')
    .max(GLOBAL_VALIDATION_CONFIG.DATE_RULES.maxDate, '日期不能晚于2100年'),

  /**
   * 年龄验证模式
   */
  age: yup.number()
    .required('年龄不能为空')
    .min(GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES.age.min, `年龄不能小于${GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES.age.min}岁`)
    .max(GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES.age.max, `年龄不能大于${GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES.age.max}岁`),

  /**
   * 会员表单验证模式
   */
  memberForm: yup.object().shape({
    name: yup.string()
      .required('姓名不能为空')
      .min(2, '姓名长度至少为2个字符')
      .max(50, '姓名长度不能超过50个字符'),
    email: yup.string()
      .required('邮箱不能为空')
      .email('邮箱格式不正确')
      .max(100, '邮箱长度不能超过100个字符'),
    phone: yup.string()
      .required('手机号不能为空')
      .matches(GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.phone, '手机号格式不正确'),
    memberId: yup.string()
      .required('会员编号不能为空')
      .matches(GLOBAL_VALIDATION_CONFIG.VALIDATION_RULES.memberId, '会员编号格式不正确'),
    address: yup.string()
      .required('地址不能为空')
      .max(200, '地址长度不能超过200个字符'),
    nricOrPassport: yup.string().required('身份证或护照号不能为空')
  }),

  /**
   * 活动表单验证模式
   */
  eventForm: yup.object().shape({
    title: yup.string()
      .required('活动标题不能为空')
      .min(5, '活动标题长度至少为5个字符')
      .max(100, '活动标题长度不能超过100个字符'),
    description: yup.string()
      .max(1000, '活动描述长度不能超过1000个字符'),
    startDate: yup.date()
      .required('开始日期不能为空'),
    endDate: yup.date()
      .required('结束日期不能为空'),
    venue: yup.string()
      .required('活动地点不能为空')
      .max(200, '活动地点长度不能超过200个字符'),
    maxParticipants: yup.number()
      .min(1, '最大参与人数不能小于1')
      .max(1000, '最大参与人数不能超过1000')
  }),

  /**
   * 交易表单验证模式
   */
  transactionForm: yup.object().shape({
    amount: yup.number()
      .required('金额不能为空')
      .min(0.01, '金额必须大于0')
      .max(GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES.amount.max, `金额不能超过${GLOBAL_VALIDATION_CONFIG.NUMBER_RANGES.amount.max}`),
    description: yup.string()
      .max(500, '交易描述长度不能超过500个字符'),
    date: yup.date()
      .required('日期不能为空'),
    purpose: yup.string()
      .required('交易用途不能为空')
  })
};

/**
 * 表单验证工具
 */
export const formValidators = {
  /**
   * 创建字段验证器
   */
  createFieldValidator: (field: FieldLimit, required: boolean = true) => {
    return (value: string) => {
      if (required && (!value || value.trim() === '')) {
        return `${field}不能为空`;
      }
      
      if (value) {
        const result = globalValidationService.validateFieldLength(value, field);
        if (!result.valid) {
          return result.error;
        }
      }
      
      return undefined;
    };
  },

  /**
   * 创建正则验证器
   */
  createPatternValidator: (pattern: RegExp, errorMessage: string) => {
    return (value: string) => {
      if (value && !pattern.test(value)) {
        return errorMessage;
      }
      return undefined;
    };
  },

  /**
   * 创建范围验证器
   */
  createRangeValidator: (min: number, max: number, fieldName: string) => {
    return (value: number) => {
      if (value < min) {
        return `${fieldName}不能小于${min}`;
      }
      if (value > max) {
        return `${fieldName}不能大于${max}`;
      }
      return undefined;
    };
  },

  /**
   * 创建异步验证器
   */
  createAsyncValidator: <T>(validator: (value: T) => Promise<boolean>, errorMessage: string) => {
    return async (value: T) => {
      const isValid = await validator(value);
      return isValid ? undefined : errorMessage;
    };
  }
};

/**
 * 导出默认配置
 */
export default GLOBAL_VALIDATION_CONFIG;
