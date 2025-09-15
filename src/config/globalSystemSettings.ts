/**
 * 全局系统配置
 * 统一管理系统级配置、环境变量和运行时设置
 */

/**
 * 全局系统配置
 */
export const GLOBAL_SYSTEM_CONFIG = {
  // 应用基本信息
  APP_INFO: {
    name: 'JCI KL Membership Management System',
    version: '1.0.0',
    description: '超级国际青年商会吉隆坡分会会员管理系统',
    environment: import.meta.env.MODE,
    buildTime: new Date().toISOString(),
    author: 'JCI KL Development Team'
  },
  
  // 环境配置
  ENVIRONMENT: {
    isDevelopment: import.meta.env.MODE === 'development',
    isProduction: import.meta.env.MODE === 'production',
    isTest: import.meta.env.MODE === 'test',
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    publicUrl: import.meta.env.VITE_PUBLIC_URL || '/'
  },
  
  // Firebase配置
  FIREBASE_CONFIG: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  },
  
  // 文件上传设置
  UPLOAD_CONFIG: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ],
    storagePath: 'uploads/',
    maxFilesPerUpload: 10,
    compression: {
      enabled: true,
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080
    }
  },
  
  // 缓存设置
  CACHE_CONFIG: {
    memberCache: 5 * 60 * 1000, // 5分钟
    permissionCache: 10 * 60 * 1000, // 10分钟
    settingsCache: 30 * 60 * 1000, // 30分钟
    staticDataCache: 60 * 60 * 1000, // 1小时
    maxCacheSize: 50 * 1024 * 1024, // 50MB
    enablePersistence: true
  },
  
  // 错误处理设置
  ERROR_CONFIG: {
    showErrorDetails: import.meta.env.MODE === 'development',
    logErrors: true,
    maxRetries: 3,
    retryDelay: 1000, // 1秒
    errorReporting: {
      enabled: import.meta.env.MODE === 'production',
      endpoint: '/api/errors',
      sampleRate: 0.1 // 10%的错误会上报
    }
  },
  
  // 性能监控设置
  PERFORMANCE_CONFIG: {
    enableMonitoring: import.meta.env.MODE === 'production',
    sampleRate: 0.1,
    metricsEndpoint: '/api/metrics',
    slowQueryThreshold: 1000, // 1秒
    memoryWarningThreshold: 100 * 1024 * 1024 // 100MB
  },
  
  // 安全设置
  SECURITY_CONFIG: {
    enableCSRF: true,
    enableXSSProtection: true,
    enableContentSecurityPolicy: true,
    sessionTimeout: 30 * 60 * 1000, // 30分钟
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15分钟
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: false
    }
  },
  
  // 国际化设置
  I18N_CONFIG: {
    enabled: true,
    defaultLocale: 'zh-CN',
    supportedLocales: ['zh-CN', 'en-US', 'ms-MY'],
    fallbackLocale: 'zh-CN',
    loadLocaleFrom: '/locales/{{locale}}.json'
  },
  
  // 日志设置
  LOGGING_CONFIG: {
    level: import.meta.env.MODE === 'development' ? 'debug' : 'info',
    enableConsole: true,
    enableRemote: import.meta.env.MODE === 'production',
    remoteEndpoint: '/api/logs',
    maxLogEntries: 1000,
    logRotation: {
      enabled: true,
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    }
  },
  
  // 分页设置
  PAGINATION_CONFIG: {
    defaultPageSize: 20,
    pageSizeOptions: ['10', '20', '50', '100'],
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: true
  },
  
  // 搜索设置
  SEARCH_CONFIG: {
    minSearchLength: 2,
    maxSearchResults: 100,
    searchDelay: 300, // 300ms防抖
    enableFuzzySearch: true,
    enableHighlighting: true
  },
  
  // 通知设置
  NOTIFICATION_CONFIG: {
    enablePush: true,
    enableEmail: true,
    enableSMS: false,
    defaultChannels: ['in-app', 'email'],
    batchSize: 50,
    retryAttempts: 3
  },
  
  // 备份设置
  BACKUP_CONFIG: {
    enabled: true,
    schedule: '0 2 * * *', // 每天凌晨2点
    retention: 30, // 保留30天
    compression: true,
    encryption: true,
    storageLocation: 'backups/'
  }
} as const;

/**
 * 配置类型定义
 */
export type SystemConfig = typeof GLOBAL_SYSTEM_CONFIG;

/**
 * 全局系统服务
 */
export const globalSystemService = {
  /**
   * 获取应用信息
   */
  getAppInfo: () => GLOBAL_SYSTEM_CONFIG.APP_INFO,

  /**
   * 获取环境信息
   */
  getEnvironment: () => GLOBAL_SYSTEM_CONFIG.ENVIRONMENT,

  /**
   * 检查是否为开发环境
   */
  isDevelopment: () => GLOBAL_SYSTEM_CONFIG.ENVIRONMENT.isDevelopment,

  /**
   * 检查是否为生产环境
   */
  isProduction: () => GLOBAL_SYSTEM_CONFIG.ENVIRONMENT.isProduction,

  /**
   * 获取Firebase配置
   */
  getFirebaseConfig: () => GLOBAL_SYSTEM_CONFIG.FIREBASE_CONFIG,

  /**
   * 验证文件上传
   */
  validateFileUpload: (file: File): { valid: boolean; error?: string } => {
    const config = GLOBAL_SYSTEM_CONFIG.UPLOAD_CONFIG;
    
    // 检查文件大小
    if (file.size > config.maxFileSize) {
      return {
        valid: false,
        error: `文件大小不能超过 ${Math.round(config.maxFileSize / 1024 / 1024)}MB`
      };
    }
    
    // 检查文件类型
    if (!config.allowedTypes.includes(file.type as any)) {
      return {
        valid: false,
        error: `不支持的文件类型: ${file.type}`
      };
    }
    
    return { valid: true };
  },

  /**
   * 获取缓存配置
   */
  getCacheConfig: () => GLOBAL_SYSTEM_CONFIG.CACHE_CONFIG,

  /**
   * 获取错误配置
   */
  getErrorConfig: () => GLOBAL_SYSTEM_CONFIG.ERROR_CONFIG,

  /**
   * 记录错误
   */
  logError: (error: Error, context?: any) => {
    const config = GLOBAL_SYSTEM_CONFIG.ERROR_CONFIG;
    
    if (config.logErrors) {
      globalSystemService.log('error', '系统错误', {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
    
    // 生产环境上报错误
    if (config.errorReporting.enabled && Math.random() < config.errorReporting.sampleRate) {
      globalSystemService.reportError(error, context);
    }
  },

  /**
   * 上报错误
   */
  reportError: async (error: Error, context?: any) => {
    try {
      const config = GLOBAL_SYSTEM_CONFIG.ERROR_CONFIG;
      
      await fetch(config.errorReporting.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: 'anonymous' // 可以从认证状态获取
        })
      });
    } catch (reportError) {
      globalSystemService.log('error', '错误上报失败', reportError);
    }
  },

  /**
   * 获取性能配置
   */
  getPerformanceConfig: () => GLOBAL_SYSTEM_CONFIG.PERFORMANCE_CONFIG,

  /**
   * 监控性能
   */
  monitorPerformance: (name: string, startTime: number, metadata?: any) => {
    const config = GLOBAL_SYSTEM_CONFIG.PERFORMANCE_CONFIG;
    
    if (!config.enableMonitoring || Math.random() > config.sampleRate) {
      return;
    }
    
    const duration = performance.now() - startTime;
    
    if (duration > config.slowQueryThreshold) {
      globalSystemService.log('warn', `慢查询检测: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        metadata,
        timestamp: new Date().toISOString()
      });
    }
  },

  /**
   * 获取安全配置
   */
  getSecurityConfig: () => GLOBAL_SYSTEM_CONFIG.SECURITY_CONFIG,

  /**
   * 验证密码强度
   */
  validatePassword: (password: string): { valid: boolean; errors: string[] } => {
    const policy = GLOBAL_SYSTEM_CONFIG.SECURITY_CONFIG.passwordPolicy;
    const errors: string[] = [];
    
    if (password.length < policy.minLength) {
      errors.push(`密码长度至少为 ${policy.minLength} 位`);
    }
    
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    
    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }
    
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * 获取国际化配置
   */
  getI18nConfig: () => GLOBAL_SYSTEM_CONFIG.I18N_CONFIG,

  /**
   * 获取日志配置
   */
  getLoggingConfig: () => GLOBAL_SYSTEM_CONFIG.LOGGING_CONFIG,

  /**
   * 记录日志
   */
  log: (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => {
    const config = GLOBAL_SYSTEM_CONFIG.LOGGING_CONFIG;
    
    if (config.enableConsole) {
      const logMethod = console[level] || console.log;
      logMethod(`[${level.toUpperCase()}] ${message}`, data);
    }
    
    // 远程日志记录
    if (config.enableRemote && level === 'error') {
      globalSystemService.sendLog(level, message, data);
    }
  },

  /**
   * 发送日志到远程
   */
  sendLog: async (level: string, message: string, data?: any) => {
    try {
      await fetch(GLOBAL_SYSTEM_CONFIG.LOGGING_CONFIG.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          level,
          message,
          data,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      // 避免递归调用，直接使用console.error
      if (typeof console !== 'undefined' && console.error) {
        console.error('远程日志发送失败:', error);
      }
    }
  },

  /**
   * 获取分页配置
   */
  getPaginationConfig: () => GLOBAL_SYSTEM_CONFIG.PAGINATION_CONFIG,

  /**
   * 获取搜索配置
   */
  getSearchConfig: () => GLOBAL_SYSTEM_CONFIG.SEARCH_CONFIG,

  /**
   * 获取通知配置
   */
  getNotificationConfig: () => GLOBAL_SYSTEM_CONFIG.NOTIFICATION_CONFIG,

  /**
   * 获取备份配置
   */
  getBackupConfig: () => GLOBAL_SYSTEM_CONFIG.BACKUP_CONFIG,

  /**
   * 初始化系统
   */
  initialize: async () => {
    try {
      // 应用全局样式
      if (typeof window !== 'undefined') {
        // 设置页面标题
        document.title = GLOBAL_SYSTEM_CONFIG.APP_INFO.name;
        
        // 设置favicon
        const favicon = document.querySelector('link[rel="icon"]');
        if (favicon) {
          favicon.setAttribute('href', '/favicon.ico');
        }
      }
      
      // 初始化错误处理
      if (typeof window !== 'undefined') {
        window.addEventListener('error', (event) => {
          globalSystemService.logError(new Error(event.message), {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
          globalSystemService.logError(new Error(event.reason), {
            type: 'unhandledrejection'
          });
        });
      }
      
      globalSystemService.log('info', '系统初始化完成', {
        version: GLOBAL_SYSTEM_CONFIG.APP_INFO.version,
        environment: import.meta.env.MODE
      });
      
      return true;
    } catch (error) {
      globalSystemService.logError(error as Error, { context: 'system_initialization' });
      return false;
    }
  }
};

/**
 * 导出默认配置
 */
export default GLOBAL_SYSTEM_CONFIG;
