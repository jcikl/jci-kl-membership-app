import React from 'react';
import { Select, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Option } = Select;

interface ResponsiblePersonSelectorProps {
  members: any[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const ResponsiblePersonSelector: React.FC<ResponsiblePersonSelectorProps> = ({
  members,
  value,
  onChange,
  placeholder = "选择负责人",
  disabled = false,
  style
}) => {
  return (
    <Select
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      allowClear
      showSearch
      disabled={disabled}
      style={style}
      filterOption={(input, option) =>
        String(option?.children || '').toLowerCase().includes(input.toLowerCase())
      }
      suffixIcon={<UserOutlined />}
    >
      {members.map(member => (
        <Option key={member.id} value={member.name}>
          <Tooltip title={member.email || member.phone || '无联系方式'}>
            {member.name}
          </Tooltip>
        </Option>
      ))}
    </Select>
  );
};

export default ResponsiblePersonSelector;
