/**
 * 全局组件配置
 * 统一管理UI组件、主题和权限控制组件的配置
 */

import React from 'react';
import { Button, Form, Table, Modal, message } from 'antd';
import { globalPermissionService, PermissionModule, PermissionAction } from './globalPermissions';

/**
 * 全局组件配置
 */
export const GLOBAL_COMPONENT_CONFIG = {
  // UI主题设置
  UI_THEME: {
    primaryColor: '#1890ff',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    lineHeight: 1.5715,
    colorText: 'rgba(0, 0, 0, 0.85)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
    borderRadiusLG: 8,
    borderRadiusSM: 4
  },
  
  // 表格默认设置
  TABLE_DEFAULTS: {
    pageSize: 20,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条记录`,
    pagination: {
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number, range: [number, number]) => 
        `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
    },
    scroll: { x: 'max-content' },
    size: 'middle' as const,
    bordered: false,
    loading: false
  },
  
  // 表单默认设置
  FORM_DEFAULTS: {
    layout: 'vertical' as const,
    validateTrigger: 'onBlur' as const,
    autoComplete: 'off' as const,
    preserve: false,
    size: 'middle' as const,
    scrollToFirstError: true
  },
  
  // 按钮默认设置
  BUTTON_DEFAULTS: {
    type: 'default' as const,
    size: 'middle' as const,
    loading: false,
    disabled: false
  },
  
  // 模态框默认设置
  MODAL_DEFAULTS: {
    width: 800,
    centered: true,
    destroyOnHidden: true,
    maskClosable: false,
    keyboard: true
  },
  
  // 权限控制组件配置
  PERMISSION_COMPONENTS: {
    ProtectedButton: 'ProtectedButton',
    ProtectedForm: 'ProtectedForm',
    ProtectedTable: 'ProtectedTable',
    ProtectedModal: 'ProtectedModal',
    ProtectedCard: 'ProtectedCard',
    ProtectedTab: 'ProtectedTab'
  },
  
  // 响应式断点
  RESPONSIVE_BREAKPOINTS: {
    xs: 480,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1600
  },
  
  // 消息配置
  MESSAGE_CONFIG: {
    duration: 3,
    maxCount: 3,
    top: 24
  }
} as const;

/**
 * 权限控制组件接口
 */
interface PermissionComponentProps {
  memberId: string;
  module: PermissionModule;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
  onPermissionDenied?: () => void;
}

/**
 * 全局组件服务
 */
export const globalComponentService = {
  /**
   * 获取带权限控制的按钮组件
   */
  getProtectedButton: (
    _memberId: string,
    _module: PermissionModule,
    _action: PermissionAction,
    buttonProps: any = {},
    _fallback?: React.ReactNode
  ) => {
    const ProtectedButton: React.FC<PermissionComponentProps> = ({ 
      memberId: propMemberId, 
      module: propModule, 
      action: propAction, 
      children, 
      fallback: propFallback,
      onPermissionDenied 
    }) => {
      const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        const checkPermission = async () => {
          try {
            const result = await globalPermissionService.checkPermission(propMemberId, propModule, propAction);
            setHasPermission(result.hasPermission);
            
            if (!result.hasPermission && onPermissionDenied) {
              onPermissionDenied();
            }
          } catch (error) {
            console.error('权限检查失败:', error);
            setHasPermission(false);
          } finally {
            setLoading(false);
          }
        };

        checkPermission();
      }, [propMemberId, propModule, propAction, onPermissionDenied]);

      if (loading) {
        return React.createElement(Button, { ...buttonProps, loading: true }, '检查权限中...');
      }

      if (!hasPermission) {
        return propFallback || React.createElement(Button, { ...buttonProps, disabled: true }, '权限不足');
      }

      return React.createElement(Button, buttonProps, children);
    };

    return ProtectedButton;
  },

  /**
   * 获取带权限控制的表单组件
   */
  getProtectedForm: (
    _memberId: string,
    _module: PermissionModule,
    _action: PermissionAction,
    formProps: any = {},
    _fallback?: React.ReactNode
  ) => {
    const ProtectedForm: React.FC<PermissionComponentProps> = ({ 
      memberId: propMemberId, 
      module: propModule, 
      action: propAction, 
      children, 
      fallback: propFallback,
      onPermissionDenied 
    }) => {
      const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        const checkPermission = async () => {
          try {
            const result = await globalPermissionService.checkPermission(propMemberId, propModule, propAction);
            setHasPermission(result.hasPermission);
            
            if (!result.hasPermission && onPermissionDenied) {
              onPermissionDenied();
            }
          } catch (error) {
            console.error('权限检查失败:', error);
            setHasPermission(false);
          } finally {
            setLoading(false);
          }
        };

        checkPermission();
      }, [propMemberId, propModule, propAction, onPermissionDenied]);

      if (loading) {
        return React.createElement(Form, formProps, React.createElement('div', null, '检查权限中...'));
      }

      if (!hasPermission) {
        return propFallback || React.createElement('div', null, '权限不足，无法访问此表单');
      }

      return React.createElement(Form, formProps, children);
    };

    return ProtectedForm;
  },

  /**
   * 获取带权限控制的表格组件
   */
  getProtectedTable: (
    _memberId: string,
    _module: PermissionModule,
    _action: PermissionAction,
    tableProps: any = {},
    _fallback?: React.ReactNode
  ) => {
    const ProtectedTable: React.FC<PermissionComponentProps> = ({ 
      memberId: propMemberId, 
      module: propModule, 
      action: propAction, 
      children, 
      fallback: propFallback,
      onPermissionDenied 
    }) => {
      const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        const checkPermission = async () => {
          try {
            const result = await globalPermissionService.checkPermission(propMemberId, propModule, propAction);
            setHasPermission(result.hasPermission);
            
            if (!result.hasPermission && onPermissionDenied) {
              onPermissionDenied();
            }
          } catch (error) {
            console.error('权限检查失败:', error);
            setHasPermission(false);
          } finally {
            setLoading(false);
          }
        };

        checkPermission();
      }, [propMemberId, propModule, propAction, onPermissionDenied]);

      if (loading) {
        return React.createElement(Table, { ...tableProps, loading: true, dataSource: [], columns: [] });
      }

      if (!hasPermission) {
        return propFallback || React.createElement('div', null, '权限不足，无法查看此数据');
      }

      return React.createElement(Table, tableProps, children);
    };

    return ProtectedTable;
  },

  /**
   * 获取带权限控制的模态框组件
   */
  getProtectedModal: (
    _memberId: string,
    _module: PermissionModule,
    _action: PermissionAction,
    modalProps: any = {},
    _fallback?: React.ReactNode
  ) => {
    const ProtectedModal: React.FC<PermissionComponentProps & { visible: boolean; onCancel: () => void }> = ({ 
      memberId: propMemberId, 
      module: propModule, 
      action: propAction, 
      children, 
      fallback: propFallback,
      onPermissionDenied,
      visible,
      onCancel
    }) => {
      const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        const checkPermission = async () => {
          try {
            const result = await globalPermissionService.checkPermission(propMemberId, propModule, propAction);
            setHasPermission(result.hasPermission);
            
            if (!result.hasPermission && onPermissionDenied) {
              onPermissionDenied();
            }
          } catch (error) {
            console.error('权限检查失败:', error);
            setHasPermission(false);
          } finally {
            setLoading(false);
          }
        };

        if (visible) {
          checkPermission();
        }
      }, [propMemberId, propModule, propAction, onPermissionDenied, visible]);

      if (!visible) {
        return null;
      }

      if (loading) {
        return React.createElement(
          Modal, 
          { ...modalProps, visible, onCancel }, 
          React.createElement('div', null, '检查权限中...')
        );
      }

      if (!hasPermission) {
        return React.createElement(
          Modal,
          { ...modalProps, visible, onCancel },
          propFallback || React.createElement('div', null, '权限不足，无法访问此功能')
        );
      }

      return React.createElement(Modal, { ...modalProps, visible, onCancel }, children);
    };

    return ProtectedModal;
  },

  /**
   * 应用全局样式
   */
  applyGlobalStyles: () => {
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --primary-color: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.primaryColor};
        --border-radius: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.borderRadius}px;
        --font-size: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.fontSize}px;
        --font-family: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.fontFamily};
        --line-height: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.lineHeight};
        --color-text: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.colorText};
        --color-text-secondary: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.colorTextSecondary};
        --color-text-tertiary: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.colorTextTertiary};
        --color-border: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.colorBorder};
        --color-border-secondary: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.colorBorderSecondary};
        --border-radius-lg: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.borderRadiusLG}px;
        --border-radius-sm: ${GLOBAL_COMPONENT_CONFIG.UI_THEME.borderRadiusSM}px;
      }
      
      .ant-table-thead > tr > th {
        background-color: #fafafa;
        font-weight: 600;
      }
      
      .ant-form-item-label > label {
        font-weight: 500;
      }
      
      .ant-btn-primary {
        background-color: var(--primary-color);
        border-color: var(--primary-color);
      }
      
      .ant-btn-primary:hover {
        background-color: #40a9ff;
        border-color: #40a9ff;
      }
    `;
    document.head.appendChild(style);
  },

  /**
   * 配置消息提示
   */
  configureMessages: () => {
    message.config({
      duration: GLOBAL_COMPONENT_CONFIG.MESSAGE_CONFIG.duration,
      maxCount: GLOBAL_COMPONENT_CONFIG.MESSAGE_CONFIG.maxCount,
      top: GLOBAL_COMPONENT_CONFIG.MESSAGE_CONFIG.top
    });
  },

  /**
   * 获取响应式配置
   */
  getResponsiveConfig: () => {
    return GLOBAL_COMPONENT_CONFIG.RESPONSIVE_BREAKPOINTS;
  },

  /**
   * 获取表格配置
   */
  getTableConfig: (customProps: any = {}) => {
    return {
      ...GLOBAL_COMPONENT_CONFIG.TABLE_DEFAULTS,
      ...customProps
    };
  },

  /**
   * 获取表单配置
   */
  getFormConfig: (customProps: any = {}) => {
    return {
      ...GLOBAL_COMPONENT_CONFIG.FORM_DEFAULTS,
      ...customProps
    };
  },

  /**
   * 获取按钮配置
   */
  getButtonConfig: (customProps: any = {}) => {
    return {
      ...GLOBAL_COMPONENT_CONFIG.BUTTON_DEFAULTS,
      ...customProps
    };
  },

  /**
   * 获取模态框配置
   */
  getModalConfig: (customProps: any = {}) => {
    return {
      ...GLOBAL_COMPONENT_CONFIG.MODAL_DEFAULTS,
      ...customProps
    };
  }
};

/**
 * 权限控制HOC
 */
export function withPermissionControl<P extends object>(
  Component: React.ComponentType<P>,
  module: PermissionModule,
  action: PermissionAction
) {
  return React.forwardRef<any, P & { memberId: string; fallback?: React.ReactNode }>((props, ref) => {
    const { memberId, fallback, ...restProps } = props;
    const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
      const checkPermission = async () => {
        try {
          const result = await globalPermissionService.checkPermission(memberId, module, action);
          setHasPermission(result.hasPermission);
        } catch (error) {
          console.error('权限检查失败:', error);
          setHasPermission(false);
        } finally {
          setLoading(false);
        }
      };

      checkPermission();
    }, [memberId]);

    if (loading) {
      return React.createElement('div', null, '检查权限中...');
    }

    if (!hasPermission) {
      return fallback || React.createElement('div', null, '权限不足');
    }

    return React.createElement(Component, { ...(restProps as P), ref });
  });
}

/**
 * 权限控制Hook
 */
export function usePermission(memberId: string, module: PermissionModule, action: PermissionAction) {
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await globalPermissionService.checkPermission(memberId, module, action);
        setHasPermission(result.hasPermission);
      } catch (err) {
        console.error('权限检查失败:', err);
        setError(err instanceof Error ? err.message : '权限检查失败');
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    if (memberId) {
      checkPermission();
    }
  }, [memberId, module, action]);

  return { hasPermission, loading, error };
}

/**
 * 导出默认配置
 */
export default GLOBAL_COMPONENT_CONFIG;