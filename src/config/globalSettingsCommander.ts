/**
 * 全局设置总指挥系统
 * 统一管理所有全局设置的引用、检查和自动修正
 * 确保代码库完全遵循全局设置标准
 */

// Import only what's actually used
import { globalSystemService } from './globalSystemSettings';
import { globalComponentService } from './globalComponentSettings';

/**
 * 全局设置总指挥配置
 */
export const GLOBAL_SETTINGS_COMMANDER_CONFIG = {
  // 所有全局设置模块
  MODULES: {
    SYSTEM: 'system',
    COMPONENT: 'component', 
    VALIDATION: 'validation',
    DATE: 'date',
    PERMISSION: 'permission',
    COLLECTIONS: 'collections'
  },
  
  // 检查规则
  COMPLIANCE_RULES: {
    // 禁止的硬编码模式
    FORBIDDEN_PATTERNS: [
      // 验证规则硬编码
      { pattern: /\/\^[^@]*@[^@]*\.[^@]*\$\/g/, type: 'email_regex', module: 'validation' },
      { pattern: /\/\^\(\+?6?01\)[0-46-9]-*[0-9]{7,8}\$\//g, type: 'phone_regex', module: 'validation' },
      { pattern: /\/\^[0-9]{6}-[0-9]{2}-[0-9]{4}\$\//g, type: 'nric_regex', module: 'validation' },
      { pattern: /\/\^JCI\d{7}\$\//g, type: 'member_id_regex', module: 'validation' },
      
      // 日期格式硬编码
      { pattern: /format=["']DD-MMM-YYYY["']/g, type: 'date_format', module: 'date' },
      { pattern: /format=["']YYYY-MM-DD["']/g, type: 'date_format', module: 'date' },
      { pattern: /format=["']MM\/DD\/YYYY["']/g, type: 'date_format', module: 'date' },
      
      // 表格配置硬编码
      { pattern: /pageSize:\s*\d+/g, type: 'table_pagination', module: 'component' },
      { pattern: /showSizeChanger:\s*(true|false)/g, type: 'table_config', module: 'component' },
      
      // 集合ID硬编码
      { pattern: /collection\(["']members["']\)/g, type: 'collection_id', module: 'collections' },
      { pattern: /collection\(["']transactions["']\)/g, type: 'collection_id', module: 'collections' },
      
      // 权限检查硬编码
      { pattern: /checkPermission\([^,]+,\s*["'][^"']+["']\)/g, type: 'permission_check', module: 'permission' }
    ],
    
    // 必需的导入模式
    REQUIRED_IMPORTS: {
      validation: /import.*globalValidationService.*from.*globalValidationSettings/,
      component: /import.*globalComponentService.*from.*globalComponentSettings/,
      date: /import.*globalDateService.*from.*globalDateSettings/,
      permission: /import.*globalPermissionService.*from.*globalPermissions/,
      system: /import.*globalSystemService.*from.*globalSystemSettings/,
      collections: /import.*GLOBAL_COLLECTIONS.*from.*globalCollections/
    },
    
    // 推荐的使用模式
    RECOMMENDED_PATTERNS: {
      email_validation: 'globalValidationService.validateEmail()',
      phone_validation: 'globalValidationService.validatePhone()',
      date_formatting: 'globalDateService.formatDate()',
      table_config: 'globalComponentService.getTableConfig()',
      permission_check: 'globalPermissionService.checkPermission()',
      collection_access: 'GLOBAL_COLLECTIONS.MEMBERS'
    }
  }
} as const;

/**
 * 代码合规性检查结果
 */
export interface ComplianceCheckResult {
  filePath: string;
  isCompliant: boolean;
  violations: ComplianceViolation[];
  recommendations: ComplianceRecommendation[];
  score: number; // 0-100
}

export interface ComplianceViolation {
  line: number;
  column: number;
  type: string;
  module: string;
  pattern: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestedFix: string;
}

export interface ComplianceRecommendation {
  type: string;
  module: string;
  message: string;
  codeExample: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * 全局设置总指挥服务
 */
export const globalSettingsCommander = {
  /**
   * 检查单个文件的合规性
   */
  checkFileCompliance: async (filePath: string, fileContent: string): Promise<ComplianceCheckResult> => {
    const violations: ComplianceViolation[] = [];
    const recommendations: ComplianceRecommendation[] = [];
    
    const lines = fileContent.split('\n');
    
    // 检查禁止的硬编码模式
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      
      for (const rule of GLOBAL_SETTINGS_COMMANDER_CONFIG.COMPLIANCE_RULES.FORBIDDEN_PATTERNS) {
        const matches = line.match(rule.pattern);
        if (matches) {
          violations.push({
            line: lineIndex + 1,
            column: line.indexOf(matches[0]) + 1,
            type: rule.type,
            module: rule.module,
            pattern: matches[0],
            severity: 'error',
            message: `发现硬编码${rule.type}，应使用全局设置`,
            suggestedFix: globalSettingsCommander.getSuggestedFix(rule.type, rule.module)
          });
        }
      }
    }
    
    // 检查必需的导入
    const importViolations = globalSettingsCommander.checkRequiredImports(fileContent);
    violations.push(...importViolations);
    
    // 生成建议
    const fileRecommendations = globalSettingsCommander.generateRecommendations(fileContent, violations);
    recommendations.push(...fileRecommendations);
    
    // 计算合规性分数
    const score = globalSettingsCommander.calculateComplianceScore(violations, recommendations);
    
    return {
      filePath,
      isCompliant: violations.length === 0,
      violations,
      recommendations,
      score
    };
  },
  
  /**
   * 批量检查多个文件
   */
  checkMultipleFilesCompliance: async (files: { path: string; content: string }[]): Promise<ComplianceCheckResult[]> => {
    const results: ComplianceCheckResult[] = [];
    
    for (const file of files) {
      const result = await globalSettingsCommander.checkFileCompliance(file.path, file.content);
      results.push(result);
    }
    
    return results;
  },
  
  /**
   * 检查必需的导入
   */
  checkRequiredImports: (fileContent: string): ComplianceViolation[] => {
    const violations: ComplianceViolation[] = [];
    
    // 检查是否使用了全局设置但没有导入
    const usedModules = globalSettingsCommander.detectUsedModules(fileContent);
    
    for (const module of usedModules) {
      const importPattern = (GLOBAL_SETTINGS_COMMANDER_CONFIG.COMPLIANCE_RULES.REQUIRED_IMPORTS as any)[module];
      if (importPattern && !importPattern.test(fileContent)) {
        violations.push({
          line: 1,
          column: 1,
          type: 'missing_import',
          module,
          pattern: '',
          severity: 'error',
          message: `缺少${module}模块的导入`,
          suggestedFix: globalSettingsCommander.getImportSuggestion(module)
        });
      }
    }
    
    return violations;
  },
  
  /**
   * 检测文件中使用的模块
   */
  detectUsedModules: (fileContent: string): string[] => {
    const usedModules: string[] = [];
    
    if (/globalValidationService|GLOBAL_VALIDATION_CONFIG/.test(fileContent)) {
      usedModules.push('validation');
    }
    if (/globalComponentService|GLOBAL_COMPONENT_CONFIG/.test(fileContent)) {
      usedModules.push('component');
    }
    if (/globalDateService|GLOBAL_DATE_CONFIG/.test(fileContent)) {
      usedModules.push('date');
    }
    if (/globalPermissionService|GLOBAL_PERMISSION_CONFIG/.test(fileContent)) {
      usedModules.push('permission');
    }
    if (/globalSystemService|GLOBAL_SYSTEM_CONFIG/.test(fileContent)) {
      usedModules.push('system');
    }
    if (/GLOBAL_COLLECTIONS/.test(fileContent)) {
      usedModules.push('collections');
    }
    
    return usedModules;
  },
  
  /**
   * 生成建议
   */
  generateRecommendations: (_fileContent: string, violations: ComplianceViolation[]): ComplianceRecommendation[] => {
    const recommendations: ComplianceRecommendation[] = [];
    
    // 基于违规情况生成建议
    const violationTypes = new Set(violations.map(v => v.type));
    
    if (violationTypes.has('email_regex')) {
      recommendations.push({
        type: 'email_validation',
        module: 'validation',
        message: '建议使用全局邮箱验证服务',
        codeExample: 'const isValid = globalValidationService.validateEmail(email);',
        priority: 'high'
      });
    }
    
    if (violationTypes.has('phone_regex')) {
      recommendations.push({
        type: 'phone_validation',
        module: 'validation',
        message: '建议使用全局手机号验证服务',
        codeExample: 'const isValid = globalValidationService.validatePhone(phone);',
        priority: 'high'
      });
    }
    
    if (violationTypes.has('date_format')) {
      recommendations.push({
        type: 'date_formatting',
        module: 'date',
        message: '建议使用全局日期格式化服务',
        codeExample: 'const formattedDate = globalDateService.formatDate(date);',
        priority: 'medium'
      });
    }
    
    if (violationTypes.has('table_pagination')) {
      recommendations.push({
        type: 'table_config',
        module: 'component',
        message: '建议使用全局表格配置服务',
        codeExample: 'const tableConfig = globalComponentService.getTableConfig();',
        priority: 'medium'
      });
    }
    
    return recommendations;
  },
  
  /**
   * 获取建议的修复方案
   */
  getSuggestedFix: (violationType: string, _module: string): string => {
    const fixes: Record<string, string> = {
      email_regex: '使用 globalValidationService.validateEmail(email)',
      phone_regex: '使用 globalValidationService.validatePhone(phone)',
      nric_regex: '使用 globalValidationService.validateNRIC(nric)',
      member_id_regex: '使用 globalValidationService.validateMemberId(memberId)',
      date_format: '使用 globalDateService.formatDate(date)',
      table_pagination: '使用 globalComponentService.getTableConfig()',
      table_config: '使用 globalComponentService.getTableConfig()',
      collection_id: '使用 GLOBAL_COLLECTIONS.MEMBERS 等常量',
      permission_check: '使用 globalPermissionService.checkPermission()'
    };
    
    return fixes[violationType] || '请参考全局设置配置';
  },
  
  /**
   * 获取导入建议
   */
  getImportSuggestion: (module: string): string => {
    const imports: Record<string, string> = {
      validation: "import { globalValidationService, GLOBAL_VALIDATION_CONFIG } from '@/config/globalValidationSettings';",
      component: "import { globalComponentService, GLOBAL_COMPONENT_CONFIG } from '@/config/globalComponentSettings';",
      date: "import { globalDateService, GLOBAL_DATE_CONFIG } from '@/config/globalDateSettings';",
      permission: "import { globalPermissionService, GLOBAL_PERMISSION_CONFIG } from '@/config/globalPermissions';",
      system: "import { globalSystemService, GLOBAL_SYSTEM_CONFIG } from '@/config/globalSystemSettings';",
      collections: "import { GLOBAL_COLLECTIONS } from '@/config/globalCollections';"
    };
    
    return imports[module] || '';
  },
  
  /**
   * 计算合规性分数
   */
  calculateComplianceScore: (violations: ComplianceViolation[], _recommendations: ComplianceRecommendation[]): number => {
    if (violations.length === 0) return 100;
    
    const errorCount = violations.filter(v => v.severity === 'error').length;
    const warningCount = violations.filter(v => v.severity === 'warning').length;
    
    // 基础分数100，每个错误扣10分，每个警告扣5分
    const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5));
    
    return score;
  },
  
  /**
   * 生成合规性报告
   */
  generateComplianceReport: (results: ComplianceCheckResult[]): string => {
    const totalFiles = results.length;
    const compliantFiles = results.filter(r => r.isCompliant).length;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalFiles;
    
    const report = `
# 全局设置合规性报告

## 总体统计
- 检查文件总数: ${totalFiles}
- 合规文件数: ${compliantFiles}
- 合规率: ${((compliantFiles / totalFiles) * 100).toFixed(1)}%
- 平均分数: ${averageScore.toFixed(1)}/100

## 详细结果
${results.map(result => `
### ${result.filePath}
- 合规性: ${result.isCompliant ? '✅ 合规' : '❌ 不合规'}
- 分数: ${result.score}/100
- 违规数量: ${result.violations.length}
- 建议数量: ${result.recommendations.length}

${result.violations.length > 0 ? `
#### 违规详情:
${result.violations.map(v => `- 第${v.line}行: ${v.message} (${v.severity})`).join('\n')}
` : ''}

${result.recommendations.length > 0 ? `
#### 改进建议:
${result.recommendations.map(r => `- ${r.message} (优先级: ${r.priority})`).join('\n')}
` : ''}
`).join('\n')}

## 建议
1. 优先修复错误级别的违规
2. 逐步替换硬编码值为全局设置引用
3. 确保所有新代码遵循全局设置标准
`;
    
    return report;
  },
  
  /**
   * 自动修正代码
   */
  autoCorrectCode: (fileContent: string, violations: ComplianceViolation[]): string => {
    let correctedContent = fileContent;
    
    // 按行号倒序排列，避免修改行号影响后续修改
    const sortedViolations = violations.sort((a, b) => b.line - a.line);
    
    for (const violation of sortedViolations) {
      correctedContent = globalSettingsCommander.applyFix(correctedContent, violation);
    }
    
    return correctedContent;
  },
  
  /**
   * 应用单个修复
   */
  applyFix: (content: string, violation: ComplianceViolation): string => {
    const lines = content.split('\n');
    const lineIndex = violation.line - 1;
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      
      switch (violation.type) {
        case 'email_regex':
          lines[lineIndex] = line.replace(/\/\^[^@]*@[^@]*\.[^@]*\$\/g/, 'globalValidationService.validateEmail');
          break;
        case 'phone_regex':
          lines[lineIndex] = line.replace(/\/\^\(\+?6?01\)[0-46-9]-*[0-9]{7,8}\$\//g, 'globalValidationService.validatePhone');
          break;
        case 'date_format':
          lines[lineIndex] = line.replace(/format=["']DD-MMM-YYYY["']/g, 'format={GLOBAL_DATE_CONFIG.STANDARD_FORMAT}');
          break;
        case 'table_pagination':
          lines[lineIndex] = line.replace(/pageSize:\s*\d+/g, '...globalComponentService.getTableConfig()');
          break;
        case 'collection_id':
          lines[lineIndex] = line.replace(/collection\(["']members["']\)/g, 'collection(GLOBAL_COLLECTIONS.MEMBERS)');
          break;
        // 可以添加更多修复规则
      }
    }
    
    return lines.join('\n');
  },
  
  /**
   * 初始化全局设置总指挥
   */
  initialize: async (): Promise<boolean> => {
    try {
      // 初始化所有全局服务
      await globalSystemService.initialize();
      globalComponentService.applyGlobalStyles();
      globalComponentService.configureMessages();
      
      return true;
    } catch (error) {
      globalSystemService.logError(error as Error, { context: 'commander_initialization' });
      return false;
    }
  }
};

/**
 * 导出默认配置
 */
export default GLOBAL_SETTINGS_COMMANDER_CONFIG;
