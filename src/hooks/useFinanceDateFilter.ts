import { useState, useMemo } from 'react';
import dayjs, { Dayjs } from 'dayjs';

export interface DateFilter {
  year: number;
  month: number | null; // null 表示全年
}

export interface UseFinanceDateFilterOptions {
  dateField?: string; // 日期字段名，默认为 'date'
  format?: string; // 日期格式，默认为 'DD-MMM-YYYY'
}

export function useFinanceDateFilter<T extends Record<string, any>>(
  data: T[],
  options: UseFinanceDateFilterOptions = {}
) {
  const { dateField = 'date', format = 'DD-MMM-YYYY' } = options;
  
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    year: new Date().getFullYear(),
    month: null, // 默认显示全年
  });

  // 筛选数据
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return data;

    return data.filter(item => {
      const dateValue = item[dateField];
      if (!dateValue) return false;

      let itemDate: Dayjs;
      
      // 尝试解析不同格式的日期
      if (typeof dateValue === 'string') {
        // 尝试 DD-MMM-YYYY 格式
        if (format === 'DD-MMM-YYYY') {
          itemDate = dayjs(dateValue, 'DD-MMM-YYYY');
        } else {
          itemDate = dayjs(dateValue);
        }
      } else {
        itemDate = dayjs(dateValue);
      }

      if (!itemDate.isValid()) return false;

      // 年份筛选
      if (itemDate.year() !== dateFilter.year) return false;

      // 月份筛选（如果指定了月份）
      if (dateFilter.month !== null && itemDate.month() + 1 !== dateFilter.month) {
        return false;
      }

      return true;
    });
  }, [data, dateFilter, dateField, format]);

  // 设置年份
  const setYear = (year: number) => {
    setDateFilter(prev => ({ ...prev, year }));
  };

  // 设置月份
  const setMonth = (month: number | null) => {
    setDateFilter(prev => ({ ...prev, month }));
  };

  // 重置筛选
  const resetFilter = () => {
    setDateFilter({
      year: new Date().getFullYear(),
      month: null,
    });
  };

  // 获取筛选后的统计信息
  const getFilteredStats = (data: any[], amountField: string) => {
    return filteredData.reduce((sum, item) => sum + (item[amountField] || 0), 0);
  };

  return {
    dateFilter,
    setDateFilter,
    setYear,
    setMonth,
    resetFilter,
    filteredData,
    getFilteredStats,
  };
}
