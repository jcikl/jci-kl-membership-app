import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import advancedFormat from 'dayjs/plugin/advancedFormat';

// 扩展 dayjs 插件
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

/**
 * 智能日期解析器
 * 接受任何日期格式并自动转换为 dd-mmm-yyyy 格式
 */
export class SmartDateParser {
  // 支持的日期格式模式
  private static readonly DATE_FORMATS = [
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
    
    // Excel 数字格式（序列号）
    'EXCEL_SERIAL',
    
    // 相对日期
    'RELATIVE',
  ];

  // 月份名称映射
  private static readonly MONTH_NAMES = {
    '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug',
    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec'
  };

  // 中文月份映射
  private static readonly CHINESE_MONTHS = {
    '一月': '01', '二月': '02', '三月': '03', '四月': '04',
    '五月': '05', '六月': '06', '七月': '07', '八月': '08',
    '九月': '09', '十月': '10', '十一月': '11', '十二月': '12',
    '1月': '01', '2月': '02', '3月': '03', '4月': '04',
    '5月': '05', '6月': '06', '7月': '07', '8月': '08',
    '9月': '09', '10月': '10', '11月': '11', '12月': '12'
  };

  /**
   * 解析日期字符串并转换为 dd-mmm-yyyy 格式
   * @param dateInput 输入的日期（字符串、数字或Date对象）
   * @returns 格式化的日期字符串 (dd-mmm-yyyy) 或空字符串
   */
  static parseToDDMMMYYYY(dateInput: any): string {
    if (!dateInput) return '';

    try {
      let parsedDate: dayjs.Dayjs | null = null;

      // 1. 处理数字类型（Excel序列号）
      if (typeof dateInput === 'number') {
        parsedDate = this.parseExcelSerialNumber(dateInput);
      }
      // 2. 处理Date对象
      else if (dateInput instanceof Date) {
        parsedDate = dayjs(dateInput);
      }
      // 3. 处理字符串
      else if (typeof dateInput === 'string') {
        parsedDate = this.parseStringDate(dateInput.trim());
      }

      if (!parsedDate || !parsedDate.isValid()) {
        return '';
      }

      // 转换为 dd-mmm-yyyy 格式
      return this.formatToDDMMMYYYY(parsedDate);
    } catch (error) {
      console.warn('日期解析失败:', dateInput, error);
      return '';
    }
  }

  /**
   * 解析Excel序列号
   */
  private static parseExcelSerialNumber(serialNumber: number): dayjs.Dayjs | null {
    try {
      // Excel日期序列号从1900年1月1日开始计算
      // 但Excel错误地认为1900年是闰年，所以需要调整
      const excelEpoch = new Date(1900, 0, 1);
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      
      // 调整Excel的闰年错误
      let adjustedSerial = serialNumber;
      if (serialNumber > 59) {
        adjustedSerial = serialNumber - 1; // Excel错误地认为1900年是闰年
      }
      
      const date = new Date(excelEpoch.getTime() + (adjustedSerial - 1) * millisecondsPerDay);
      return dayjs(date);
    } catch (error) {
      return null;
    }
  }

  /**
   * 解析字符串日期
   */
  private static parseStringDate(dateStr: string): dayjs.Dayjs | null {
    // 1. 尝试直接解析
    let parsed = dayjs(dateStr);
    if (parsed.isValid()) {
      return parsed;
    }

    // 2. 尝试各种格式
    for (const format of this.DATE_FORMATS) {
      if (format === 'EXCEL_SERIAL' || format === 'RELATIVE') continue;
      
      parsed = dayjs(dateStr, format);
      if (parsed.isValid()) {
        return parsed;
      }
    }

    // 3. 处理中文日期
    parsed = this.parseChineseDate(dateStr);
    if (parsed && parsed.isValid()) {
      return parsed;
    }

    // 4. 处理相对日期
    parsed = this.parseRelativeDate(dateStr);
    if (parsed && parsed.isValid()) {
      return parsed;
    }

    // 5. 尝试智能解析
    parsed = this.parseSmartDate(dateStr);
    if (parsed && parsed.isValid()) {
      return parsed;
    }

    return null;
  }

  /**
   * 解析中文日期
   */
  private static parseChineseDate(dateStr: string): dayjs.Dayjs | null {
    try {
      // 处理 "2024年1月15日" 格式
      const chinesePattern = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
      const match = dateStr.match(chinesePattern);
      if (match) {
        const [, year, month, day] = match;
        return dayjs(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      }

      // 处理 "1月15日" 格式（假设当前年份）
      const monthDayPattern = /(\d{1,2})月(\d{1,2})日/;
      const monthDayMatch = dateStr.match(monthDayPattern);
      if (monthDayMatch) {
        const [, month, day] = monthDayMatch;
        const currentYear = new Date().getFullYear();
        return dayjs(`${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 解析相对日期
   */
  private static parseRelativeDate(dateStr: string): dayjs.Dayjs | null {
    try {
      const lowerStr = dateStr.toLowerCase();
      
      if (lowerStr === 'today' || lowerStr === '今天') {
        return dayjs();
      }
      
      if (lowerStr === 'yesterday' || lowerStr === '昨天') {
        return dayjs().subtract(1, 'day');
      }
      
      if (lowerStr === 'tomorrow' || lowerStr === '明天') {
        return dayjs().add(1, 'day');
      }

      // 处理 "3天前" 格式
      const daysAgoPattern = /(\d+)天前/;
      const daysAgoMatch = dateStr.match(daysAgoPattern);
      if (daysAgoMatch) {
        const days = parseInt(daysAgoMatch[1]);
        return dayjs().subtract(days, 'day');
      }

      // 处理 "3天后" 格式
      const daysAfterPattern = /(\d+)天后/;
      const daysAfterMatch = dateStr.match(daysAfterPattern);
      if (daysAfterMatch) {
        const days = parseInt(daysAfterMatch[1]);
        return dayjs().add(days, 'day');
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 智能解析日期
   */
  private static parseSmartDate(dateStr: string): dayjs.Dayjs | null {
    try {
      // 移除所有非数字字符，然后尝试解析
      const numbersOnly = dateStr.replace(/\D/g, '');
      
      if (numbersOnly.length === 8) {
        // YYYYMMDD 或 MMDDYYYY
        const year = numbersOnly.substring(0, 4);
        const month = numbersOnly.substring(4, 6);
        const day = numbersOnly.substring(6, 8);
        
        // 检查年份是否合理
        const yearNum = parseInt(year);
        if (yearNum >= 1900 && yearNum <= 2100) {
          return dayjs(`${year}-${month}-${day}`);
        }
        
        // 可能是 MMDDYYYY 格式
        const month2 = numbersOnly.substring(0, 2);
        const day2 = numbersOnly.substring(2, 4);
        const year2 = numbersOnly.substring(4, 8);
        
        const year2Num = parseInt(year2);
        if (year2Num >= 1900 && year2Num <= 2100) {
          return dayjs(`${year2}-${month2}-${day2}`);
        }
      }
      
      if (numbersOnly.length === 6) {
        // YYMMDD 或 MMDDYY
        const year = '20' + numbersOnly.substring(0, 2);
        const month = numbersOnly.substring(2, 4);
        const day = numbersOnly.substring(4, 6);
        
        return dayjs(`${year}-${month}-${day}`);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 格式化为 dd-mmm-yyyy
   */
  private static formatToDDMMMYYYY(date: dayjs.Dayjs): string {
    const day = date.format('DD');
    const month = date.format('MM');
    const year = date.format('YYYY');
    
    const monthName = this.MONTH_NAMES[month as keyof typeof this.MONTH_NAMES];
    
    return `${day}-${monthName}-${year}`;
  }

  /**
   * 验证日期格式是否为 dd-mmm-yyyy
   */
  static isValidDDMMMYYYY(dateStr: string): boolean {
    const pattern = /^\d{2}-[A-Za-z]{3}-\d{4}$/;
    if (!pattern.test(dateStr)) return false;
    
    const parts = dateStr.split('-');
    const day = parseInt(parts[0]);
    const month = parts[1];
    const year = parseInt(parts[2]);
    
    // 检查月份是否有效
    const validMonths = Object.values(this.MONTH_NAMES);
    if (!validMonths.includes(month)) return false;
    
    // 检查日期是否有效
    const date = dayjs(`${year}-${this.getMonthNumber(month)}-${day.toString().padStart(2, '0')}`);
    return date.isValid() && date.format('DD-MMM-YYYY') === dateStr;
  }

  /**
   * 获取月份数字
   */
  private static getMonthNumber(monthName: string): string {
    const monthMap: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    return monthMap[monthName] || '01';
  }

  /**
   * 批量解析日期数组
   */
  static parseMultipleDates(dateInputs: any[]): string[] {
    return dateInputs.map(input => this.parseToDDMMMYYYY(input));
  }

  /**
   * 获取支持的日期格式列表
   */
  static getSupportedFormats(): string[] {
    return [
      'YYYY-MM-DD (2024-01-15)',
      'YYYY/MM/DD (2024/01/15)',
      'MM/DD/YYYY (01/15/2024)',
      'DD/MM/YYYY (15/01/2024)',
      'YYYY年MM月DD日 (2024年1月15日)',
      'MM月DD日 (1月15日)',
      'Excel序列号 (44927)',
      '相对日期 (今天, 昨天, 3天前)',
      '智能解析 (20240115, 01152024)'
    ];
  }
}

/**
 * 便捷函数：解析单个日期
 */
export function parseDateToDDMMMYYYY(dateInput: any): string {
  return SmartDateParser.parseToDDMMMYYYY(dateInput);
}

/**
 * 便捷函数：批量解析日期
 */
export function parseDatesToDDMMMYYYY(dateInputs: any[]): string[] {
  return SmartDateParser.parseMultipleDates(dateInputs);
}

/**
 * 便捷函数：验证日期格式
 */
export function isValidDDMMMYYYY(dateStr: string): boolean {
  return SmartDateParser.isValidDDMMMYYYY(dateStr);
}
