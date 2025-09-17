import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FinanceYearContextType {
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  availableYears: number[];
  setAvailableYears: (years: number[]) => void;
}

const FinanceYearContext = createContext<FinanceYearContextType | undefined>(undefined);

interface FinanceYearProviderProps {
  children: ReactNode;
}

export const FinanceYearProvider: React.FC<FinanceYearProviderProps> = ({ children }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>(() => {
    // 默认提供当前年份前后5年
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  });

  // 合并年份的函数
  const mergeAvailableYears = (newYears: number[]) => {
    setAvailableYears(prevYears => {
      const merged = new Set([...prevYears, ...newYears]);
      return Array.from(merged).sort((a, b) => b - a);
    });
  };

  const contextValue: FinanceYearContextType = {
    selectedYear,
    setSelectedYear,
    availableYears,
    setAvailableYears: mergeAvailableYears,
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
