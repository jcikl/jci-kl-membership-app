import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getChapterSettings } from '@/services/chapterSettingsService';

interface FiscalYearContextType {
  fiscalYear: number;
  fiscalYearStartMonth: number;
  setFiscalYear: (year: number) => void;
  setFiscalYearStartMonth: (month: number) => void;
  loading: boolean;
  refreshFiscalYear: () => Promise<void>;
}

const FiscalYearContext = createContext<FiscalYearContextType | undefined>(undefined);

interface FiscalYearProviderProps {
  children: ReactNode;
}

export const FiscalYearProvider: React.FC<FiscalYearProviderProps> = ({ children }) => {
  const [fiscalYear, setFiscalYearState] = useState<number>(new Date().getFullYear());
  const [fiscalYearStartMonth, setFiscalYearStartMonthState] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  // 从分会设置加载财政年度
  const loadFiscalYear = async () => {
    try {
      setLoading(true);
      const settings = await getChapterSettings();
      if (settings?.fiscalYear) {
        setFiscalYearState(settings.fiscalYear);
      }
      if (settings?.fiscalYearStartMonth) {
        setFiscalYearStartMonthState(settings.fiscalYearStartMonth);
      }
    } catch (error) {
      console.error('加载财政年度失败:', error);
      // 如果加载失败，使用当前年份作为默认值
      setFiscalYearState(new Date().getFullYear());
      setFiscalYearStartMonthState(1);
    } finally {
      setLoading(false);
    }
  };

  // 设置财政年度
  const setFiscalYear = (year: number) => {
    setFiscalYearState(year);
  };

  // 设置财政年度起始月份
  const setFiscalYearStartMonth = (month: number) => {
    setFiscalYearStartMonthState(month);
  };

  // 刷新财政年度
  const refreshFiscalYear = async () => {
    await loadFiscalYear();
  };

  useEffect(() => {
    loadFiscalYear();
  }, []);

  const value: FiscalYearContextType = {
    fiscalYear,
    fiscalYearStartMonth,
    setFiscalYear,
    setFiscalYearStartMonth,
    loading,
    refreshFiscalYear,
  };

  return (
    <FiscalYearContext.Provider value={value}>
      {children}
    </FiscalYearContext.Provider>
  );
};

export const useFiscalYear = (): FiscalYearContextType => {
  const context = useContext(FiscalYearContext);
  if (context === undefined) {
    throw new Error('useFiscalYear must be used within a FiscalYearProvider');
  }
  return context;
};
