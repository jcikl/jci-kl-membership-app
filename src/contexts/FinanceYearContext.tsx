import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { transactionService } from '@/modules/finance/services/financeService';
import dayjs from 'dayjs';

interface FinanceYearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedMonth: number | null;
  setSelectedMonth: (month: number | null) => void;
  availableYears: number[];
  setAvailableYears: (years: number[]) => void;
  refreshAvailableYears: () => Promise<void>;
}

const FinanceYearContext = createContext<FinanceYearContextType | undefined>(undefined);

interface FinanceYearProviderProps {
  children: ReactNode;
}

export const FinanceYearProvider: React.FC<FinanceYearProviderProps> = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null); // null 表示全年
  const [availableYears, setAvailableYears] = useState<number[]>(() => {
    // 默认提供当前年份前后5年
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  });

  // 从有效交易记录获取年份范围的函数
  const getAvailableYearsFromTransactions = async (): Promise<number[]> => {
    try {
      const transactions = await transactionService.getTransactions();
      const years = new Set<number>();
      
      transactions.forEach(transaction => {
        if (transaction.transactionDate) {
          try {
            // 尝试解析 DD-MMM-YYYY 格式的日期
            const transactionDate = dayjs(transaction.transactionDate, 'DD-MMM-YYYY');
            if (transactionDate.isValid()) {
              years.add(transactionDate.year());
            }
          } catch (error) {
            console.warn('Invalid transaction date format:', transaction.transactionDate);
          }
        }
      });
      
      // 如果没有找到任何有效年份，返回默认年份范围
      if (years.size === 0) {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
      }
      
      // 确保包含当前年份
      years.add(new Date().getFullYear());
      
      return Array.from(years).sort((a, b) => b - a);
    } catch (error) {
      console.error('获取交易记录年份范围失败:', error);
      // 返回默认年份范围
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
    }
  };

  // 刷新可用年份
  const refreshAvailableYears = async () => {
    const years = await getAvailableYearsFromTransactions();
    setAvailableYears(years);
  };

  // 组件挂载时自动刷新年份范围
  useEffect(() => {
    refreshAvailableYears();
  }, []);

  // 合并年份的函数（保持向后兼容）
  const mergeAvailableYears = (newYears: number[]) => {
    setAvailableYears(prevYears => {
      const merged = new Set([...prevYears, ...newYears]);
      return Array.from(merged).sort((a, b) => b - a);
    });
  };

  const contextValue: FinanceYearContextType = {
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    availableYears,
    setAvailableYears: mergeAvailableYears,
    refreshAvailableYears,
  };

  return (
    <FinanceYearContext.Provider value={contextValue}>
      {children}
    </FinanceYearContext.Provider>
  );
};

export const useFinanceYear = (): FinanceYearContextType => {
  const context = useContext(FinanceYearContext);
  if (!context) {
    throw new Error('useFinanceYear must be used within a FinanceYearProvider');
  }
  return context;
};

export default FinanceYearContext;
