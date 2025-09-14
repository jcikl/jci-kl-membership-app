import React from 'react';
import { Button, Tooltip } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface TeamManagementButtonProps {
  onClick: () => void;
  disabled?: boolean;
  size?: 'small' | 'middle' | 'large';
  type?: 'text' | 'link' | 'default' | 'primary' | 'dashed';
}

const TeamManagementButton: React.FC<TeamManagementButtonProps> = ({
  onClick,
  disabled = false,
  size = 'small',
  type = 'text'
}) => {
  return (
    <Tooltip title="团队管理">
      <Button
        type={type}
        size={size}
        icon={<UserOutlined />}
        onClick={onClick}
        disabled={disabled}
      />
    </Tooltip>
  );
};

export default TeamManagementButton;
