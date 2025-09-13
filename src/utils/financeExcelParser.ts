import * as XLSX from 'xlsx';
import { parseDateToDDMMMYYYY } from './dateParser';

export interface BankStatementRow {
  date: string;
  description1: string;
  description2: string;
  expense: number;
  income: number;
}

export interface FinancialAccountRow {
  payerReceiver: string;
  description: string;
  projectAccount: string;
  accountType: string;
}

export interface ParsedFinanceData {
  bankStatement: BankStatementRow[];
  financialAccount: FinancialAccountRow[];
  errors: string[];
}

/**
 * 解析银行对账单Excel文件
 */
export function parseBankStatementExcel(file: File): Promise<BankStatementRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 转换为JSON数组
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // 跳过标题行，从第二行开始解析
        const rows: BankStatementRow[] = [];
        const errors: string[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length < 5) continue;
          
          try {
            const bankRow: BankStatementRow = {
              date: parseDate(row[0]),
              description1: String(row[1] || '').trim(),
              description2: String(row[2] || '').trim(),
              expense: parseNumber(row[3]),
              income: parseNumber(row[4]),
            };
            
            // 验证数据
            if (!bankRow.date) {
              errors.push(`第${i + 1}行: 日期格式错误`);
              continue;
            }
            
            if (!bankRow.description1) {
              errors.push(`第${i + 1}行: 描述1不能为空`);
              continue;
            }
            
            rows.push(bankRow);
          } catch (error) {
            errors.push(`第${i + 1}行: 数据解析错误 - ${error}`);
          }
        }
        
        if (errors.length > 0) {
          console.warn('银行对账单解析警告:', errors);
        }
        
        resolve(rows);
      } catch (error) {
        reject(new Error(`Excel文件解析失败: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * 解析财务账户对账单Excel文件
 */
export function parseFinancialAccountExcel(file: File): Promise<FinancialAccountRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // 转换为JSON数组
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // 跳过标题行，从第二行开始解析
        const rows: FinancialAccountRow[] = [];
        const errors: string[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length < 4) continue;
          
          try {
            const accountRow: FinancialAccountRow = {
              payerReceiver: String(row[0] || '').trim(),
              description: String(row[1] || '').trim(),
              projectAccount: String(row[2] || '').trim(),
              accountType: String(row[3] || '').trim().toUpperCase(),
            };
            
            // 验证数据
            if (!accountRow.payerReceiver) {
              errors.push(`第${i + 1}行: 付款人/收款人不能为空`);
              continue;
            }
            
            if (!accountRow.description) {
              errors.push(`第${i + 1}行: 描述不能为空`);
              continue;
            }
            
            if (!accountRow.projectAccount) {
              errors.push(`第${i + 1}行: 项目户口不能为空`);
              continue;
            }
            
            // 验证户口类型
            const validAccountTypes = ['MAIN', 'EVENT', 'INTERNATIONAL_PROJECT'];
            if (!validAccountTypes.includes(accountRow.accountType)) {
              errors.push(`第${i + 1}行: 户口类型无效，应为 ${validAccountTypes.join(', ')}`);
              continue;
            }
            
            rows.push(accountRow);
          } catch (error) {
            errors.push(`第${i + 1}行: 数据解析错误 - ${error}`);
          }
        }
        
        if (errors.length > 0) {
          console.warn('财务账户对账单解析警告:', errors);
        }
        
        resolve(rows);
      } catch (error) {
        reject(new Error(`Excel文件解析失败: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * 解析粘贴的银行对账单数据
 */
export function parseBankStatementPaste(text: string): BankStatementRow[] {
  const lines = text.trim().split('\n');
  const rows: BankStatementRow[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',').map(col => col.trim());
    if (columns.length < 5) continue;
    
    try {
      const row: BankStatementRow = {
        date: parseDate(columns[0]),
        description1: columns[1],
        description2: columns[2],
        expense: parseNumber(columns[3]),
        income: parseNumber(columns[4]),
      };
      
      if (row.date && row.description1) {
        rows.push(row);
      }
    } catch (error) {
      console.warn(`第${i + 1}行解析失败:`, error);
    }
  }
  
  return rows;
}

/**
 * 解析粘贴的财务账户对账单数据
 */
export function parseFinancialAccountPaste(text: string): FinancialAccountRow[] {
  const lines = text.trim().split('\n');
  const rows: FinancialAccountRow[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',').map(col => col.trim());
    if (columns.length < 4) continue;
    
    try {
      const row: FinancialAccountRow = {
        payerReceiver: columns[0],
        description: columns[1],
        projectAccount: columns[2],
        accountType: columns[3].toUpperCase(),
      };
      
      if (row.payerReceiver && row.description && row.projectAccount) {
        rows.push(row);
      }
    } catch (error) {
      console.warn(`第${i + 1}行解析失败:`, error);
    }
  }
  
  return rows;
}

/**
 * 解析日期格式 - 使用智能日期解析器
 * 自动转换为 dd-mmm-yyyy 格式
 */
function parseDate(dateStr: any): string {
  return parseDateToDDMMMYYYY(dateStr);
}

/**
 * 解析数字格式
 */
function parseNumber(numStr: any): number {
  if (typeof numStr === 'number') {
    return numStr;
  }
  
  if (typeof numStr === 'string') {
    // 移除货币符号和逗号
    const cleaned = numStr.replace(/[¥$,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

/**
 * 生成Excel模板
 */
export function generateBankStatementTemplate(): void {
  const templateData = [
    ['DATE', 'Description 1', 'Description 2', '支出', '收入'],
    ['2024-01-15', 'JCI KL Membership Fee', 'Annual Membership', '0', '500'],
    ['2024-01-16', 'Event Registration', 'Monthly Meeting', '0', '50'],
    ['2024-01-17', 'Office Supplies', 'Purchase', '150', '0'],
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '银行对账单');
  
  XLSX.writeFile(workbook, '银行对账单模板.xlsx');
}

/**
 * 生成财务账户对账单模板
 */
export function generateFinancialAccountTemplate(): void {
  const templateData = [
    ['付款人/收款人', 'DESCRIPTION', '项目户口', '户口类型'],
    ['John Doe', 'Annual Membership Fee', 'Membership', 'MAIN'],
    ['Jane Smith', 'Monthly Meeting Registration', 'Events', 'EVENT'],
    ['ABC Company', 'International Conference Fee', 'International', 'INTERNATIONAL_PROJECT'],
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '财务账户对账单');
  
  XLSX.writeFile(workbook, '财务账户对账单模板.xlsx');
}

/**
 * 验证银行对账单数据
 */
export function validateBankStatementData(data: BankStatementRow[]): { valid: BankStatementRow[]; invalid: { row: BankStatementRow; errors: string[] }[] } {
  const valid: BankStatementRow[] = [];
  const invalid: { row: BankStatementRow; errors: string[] }[] = [];
  
  data.forEach((row, _index) => {
    const errors: string[] = [];
    
    if (!row.date) {
      errors.push('日期不能为空');
    }
    
    if (!row.description1) {
      errors.push('描述1不能为空');
    }
    
    if (row.expense < 0) {
      errors.push('支出不能为负数');
    }
    
    if (row.income < 0) {
      errors.push('收入不能为负数');
    }
    
    if (row.expense > 0 && row.income > 0) {
      errors.push('支出和收入不能同时大于0');
    }
    
    if (row.expense === 0 && row.income === 0) {
      errors.push('支出和收入不能同时为0');
    }
    
    if (errors.length === 0) {
      valid.push(row);
    } else {
      invalid.push({ row, errors });
    }
  });
  
  return { valid, invalid };
}

/**
 * 验证财务账户对账单数据
 */
export function validateFinancialAccountData(data: FinancialAccountRow[]): { valid: FinancialAccountRow[]; invalid: { row: FinancialAccountRow; errors: string[] }[] } {
  const valid: FinancialAccountRow[] = [];
  const invalid: { row: FinancialAccountRow; errors: string[] }[] = [];
  
  const validAccountTypes = ['MAIN', 'EVENT', 'INTERNATIONAL_PROJECT'];
  
  data.forEach((row, _index) => {
    const errors: string[] = [];
    
    if (!row.payerReceiver) {
      errors.push('付款人/收款人不能为空');
    }
    
    if (!row.description) {
      errors.push('描述不能为空');
    }
    
    if (!row.projectAccount) {
      errors.push('项目户口不能为空');
    }
    
    if (!validAccountTypes.includes(row.accountType)) {
      errors.push(`户口类型无效，应为 ${validAccountTypes.join(', ')}`);
    }
    
    if (errors.length === 0) {
      valid.push(row);
    } else {
      invalid.push({ row, errors });
    }
  });
  
  return { valid, invalid };
}
