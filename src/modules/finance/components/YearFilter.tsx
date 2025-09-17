import React from 'react';
import { Select } from 'antd';

const { Option } = Select;

interface GlobalYearFilterModalProps {
  value?: number;
  onChange?: (year: number | undefined) => void;
  availableYears: number[];
  placeholder?: string;
  style?: React.CSSProperties;
  allowClear?: boolean;
  disabled?: boolean;
}

const GlobalYearFilterModal: React.FC<GlobalYearFilterModalProps> = ({
  value,
  onChange,
  availableYears,
  placeholder = "选择年份",
  style = { width: 120 },
  allowClear = true,
  disabled = false,
}) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      style={style}
      placeholder={placeholder}
      allowClear={allowClear}
      disabled={disabled}
    >
      {availableYears.map(year => (
        <Option key={year} value={year}>
          {year}年
        </Option>
      ))}
    </Select>
  );
};

export default GlobalYearFilterModal;
