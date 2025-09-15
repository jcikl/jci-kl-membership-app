/**
 * 全局日期处理配置
 * 统一管理日期格式、时区和验证规则
 */

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import { SmartDateParser } from '@/utils/dateParser';

// 扩展dayjs插件
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

/**
 * 全局日期配置
 */
export const GLOBAL_DATE_CONFIG = {
  // 标准输出格式
  STANDARD_FORMAT: 'DD-MMM-YYYY',
  
  // 详细日期时间格式
  DATETIME_FORMAT: 'DD-MMM-YYYY HH:mm:ss',
  
  // 时间格式
  TIME_FORMAT: 'HH:mm:ss',
  
  // 支持输入格式列表
  SUPPORTED_INPUT_FORMATS: [
    // ISO 格式
    'YYYY-MM-DD',
    'YYYY/MM/DD', 
    'YYYY.MM.DD',
    
    // 美式格式
    'MM/DD/YYYY',
    'MM-DD-YYYY',
    'MM.DD.YYYY',
    
    // 欧式格式
    'DD/MM/YYYY',
    'DD-MM-YYYY',
    'DD.MM.YYYY',
    
    // 中文格式
    'YYYY年MM月DD日',
    'MM月DD日',
    'YYYY年MM月',
    
    // 带时间的格式
    'YYYY-MM-DD HH:mm:ss',
    'YYYY/MM/DD HH:mm:ss',
    'MM/DD/YYYY HH:mm:ss',
    'DD/MM/YYYY HH:mm:ss',
    
    // Excel 数字格式
    'EXCEL_SERIAL',
    
    // 相对日期
    'RELATIVE'
  ],
  
  // 时区设置
  TIMEZONE: 'Asia/Kuala_Lumpur',
  
  // 日期验证规则
  VALIDATION_RULES: {
    minYear: 1900,
    maxYear: new Date().getFullYear() + 10,
    allowFutureDates: true,
    allowPastDates: true,
    allowToday: true
  },
  
  // 月份名称映射
  MONTH_NAMES: {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  },
  
  // 中文月份映射
  CHINESE_MONTHS: {
    '一月': '01', '二月': '02', '三月': '03', '四月': '04',
    '五月': '05', '六月': '06', '七月': '07', '八月': '08',
    '九月': '09', '十月': '10', '十一月': '11', '十二月': '12',
    '1月': '01', '2月': '02', '3月': '03', '4月': '04',
    '5月': '05', '6月': '06', '7月': '07', '8月': '08',
    '9月': '09', '10月': '10', '11月': '11', '12月': '12'
  }
} as const;

/**
 * 全局日期处理服务
 */
export const globalDateService = {
  /**
   * 解析任意日期格式为标准格式
   * @param dateInput 输入的日期
   * @returns 标准格式的日期字符串 (DD-MMM-YYYY)
   */
  parseToStandard: (dateInput: any): string => {
    return SmartDateParser.parseToDDMMMYYYY(dateInput);
  },

  /**
   * 验证日期字符串
   * @param dateString 日期字符串
   * @param format 可选格式
   * @returns 是否为有效日期
   */
  validateDate: (dateString: string, format?: string): boolean => {
    if (!dateString) return false;
    
    const formatToUse = format || GLOBAL_DATE_CONFIG.STANDARD_FORMAT;
    const parsed = dayjs(dateString, formatToUse);
    
    if (!parsed.isValid()) return false;
    
    // 检查年份范围
    const year = parsed.year();
    if (year < GLOBAL_DATE_CONFIG.VALIDATION_RULES.minYear || 
        year > GLOBAL_DATE_CONFIG.VALIDATION_RULES.maxYear) {
      return false;
    }
    
    return true;
  },

  /**
   * 获取当前财政年度
   * @param fiscalYearStartMonth 财政年度起始月份 (1-12)
   * @returns 当前财政年度
   */
  getCurrentFiscalYear: (fiscalYearStartMonth: number = 1): number => {
    const now = dayjs().tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    const currentYear = now.year();
    const currentMonth = now.month() + 1; // dayjs月份从0开始
    
    // 如果当前月份小于财政年度起始月份，则属于上一财政年度
    return currentMonth >= fiscalYearStartMonth ? currentYear : currentYear - 1;
  },

  /**
   * 获取财政年度开始日期
   * @param fiscalYear 财政年度
   * @param fiscalYearStartMonth 财政年度起始月份
   * @returns 财政年度开始日期
   */
  getFiscalYearStartDate: (fiscalYear: number, fiscalYearStartMonth: number = 1): dayjs.Dayjs => {
    return dayjs()
      .year(fiscalYear)
      .month(fiscalYearStartMonth - 1)
      .date(1)
      .startOf('day')
      .tz(GLOBAL_DATE_CONFIG.TIMEZONE);
  },

  /**
   * 获取财政年度结束日期
   * @param fiscalYear 财政年度
   * @param fiscalYearStartMonth 财政年度起始月份
   * @returns 财政年度结束日期
   */
  getFiscalYearEndDate: (fiscalYear: number, fiscalYearStartMonth: number = 1): dayjs.Dayjs => {
    const startDate = globalDateService.getFiscalYearStartDate(fiscalYear, fiscalYearStartMonth);
    return startDate.add(1, 'year').subtract(1, 'day').endOf('day');
  },

  /**
   * 格式化日期为标准格式
   * @param date 日期对象或字符串
   * @param format 可选格式
   * @returns 格式化的日期字符串
   */
  formatDate: (date: any, format: string = GLOBAL_DATE_CONFIG.STANDARD_FORMAT): string => {
    const parsed = dayjs(date).tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    return parsed.isValid() ? parsed.format(format) : '';
  },

  /**
   * 获取相对日期描述
   * @param date 日期
   * @returns 相对日期描述
   */
  getRelativeDate: (date: any): string => {
    const parsed = dayjs(date).tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    if (!parsed.isValid()) return '';
    
    const now = dayjs().tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    const diffInDays = parsed.diff(now, 'day');
    
    if (diffInDays === 0) return '今天';
    if (diffInDays === 1) return '明天';
    if (diffInDays === -1) return '昨天';
    if (diffInDays > 1) return `${diffInDays}天后`;
    if (diffInDays < -1) return `${Math.abs(diffInDays)}天前`;
    
    return parsed.format(GLOBAL_DATE_CONFIG.STANDARD_FORMAT);
  },

  /**
   * 检查日期是否在范围内
   * @param date 要检查的日期
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 是否在范围内
   */
  isDateInRange: (date: any, startDate: any, endDate: any): boolean => {
    const targetDate = dayjs(date).tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    const start = dayjs(startDate).tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    const end = dayjs(endDate).tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    
    return targetDate.isAfter(start) && targetDate.isBefore(end);
  },

  /**
   * 获取日期范围的所有月份
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 月份数组
   */
  getMonthsInRange: (startDate: any, endDate: any): string[] => {
    const start = dayjs(startDate).tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    const end = dayjs(endDate).tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    const months: string[] = [];
    
    let current = start.startOf('month');
    while (current.isBefore(end) || current.isSame(end, 'month')) {
      months.push(current.format('YYYY-MM'));
      current = current.add(1, 'month');
    }
    
    return months;
  },

  /**
   * 安全解析日期
   * @param dateInput 输入日期
   * @param defaultValue 默认值
   * @returns 解析后的日期或默认值
   */
  safeParse: (dateInput: any, defaultValue?: any): dayjs.Dayjs | undefined => {
    try {
      const parsed = dayjs(dateInput).tz(GLOBAL_DATE_CONFIG.TIMEZONE);
      return parsed.isValid() ? parsed : (defaultValue ? dayjs(defaultValue) : undefined);
    } catch (error) {
      console.warn('日期解析失败:', dateInput, error);
      return defaultValue ? dayjs(defaultValue) : undefined;
    }
  },

  /**
   * 解析日期字符串为dayjs对象（用于表单）
   * @param dateString 日期字符串
   * @returns dayjs对象或null
   */
  parseDate: (dateString: string): dayjs.Dayjs | null => {
    if (!dateString) return null;
    try {
      const parsed = dayjs(dateString).tz(GLOBAL_DATE_CONFIG.TIMEZONE);
      return parsed.isValid() ? parsed : null;
    } catch (error) {
      console.warn('日期解析失败:', dateString, error);
      return null;
    }
  }
};

/**
 * 日期格式验证器
 */
export const dateValidators = {
  /**
   * 验证标准日期格式
   */
  standardDate: (value: string): boolean => {
    return globalDateService.validateDate(value, GLOBAL_DATE_CONFIG.STANDARD_FORMAT);
  },

  /**
   * 验证未来日期
   */
  futureDate: (value: string): boolean => {
    if (!globalDateService.validateDate(value)) return false;
    const parsed = dayjs(value, GLOBAL_DATE_CONFIG.STANDARD_FORMAT);
    const now = dayjs().tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    return parsed.isAfter(now, 'day');
  },

  /**
   * 验证过去日期
   */
  pastDate: (value: string): boolean => {
    if (!globalDateService.validateDate(value)) return false;
    const parsed = dayjs(value, GLOBAL_DATE_CONFIG.STANDARD_FORMAT);
    const now = dayjs().tz(GLOBAL_DATE_CONFIG.TIMEZONE);
    return parsed.isBefore(now, 'day');
  },

  /**
   * 验证财政年度日期范围
   */
  fiscalYearDate: (value: string, fiscalYear: number, fiscalYearStartMonth: number = 1): boolean => {
    if (!globalDateService.validateDate(value)) return false;
    
    const parsed = dayjs(value, GLOBAL_DATE_CONFIG.STANDARD_FORMAT);
    const startDate = globalDateService.getFiscalYearStartDate(fiscalYear, fiscalYearStartMonth);
    const endDate = globalDateService.getFiscalYearEndDate(fiscalYear, fiscalYearStartMonth);
    
    return parsed.isAfter(startDate) && parsed.isBefore(endDate);
  }
};

/**
 * 导出默认配置
 */
export default GLOBAL_DATE_CONFIG;
