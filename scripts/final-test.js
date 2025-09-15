#!/usr/bin/env node

/**
 * JCI KL 奖励指标管理系统 - 最终测试脚本
 * 版本: v2.0.0
 */

const fs = require('fs');
const path = require('path');

// 颜色定义
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// 日志函数
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// 测试结果
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: []
};

// 添加测试结果
function addTest(name, status, message, details = null) {
  const result = {
    name,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  if (status === 'passed') {
    testResults.passed++;
    log.success(`${name}: ${message}`);
  } else if (status === 'warning') {
    testResults.warnings++;
    log.warning(`${name}: ${message}`);
  } else {
    testResults.failed++;
    log.error(`${name}: ${message}`);
  }
}

// 检查文件是否存在
function checkFileExists(filePath, description) {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    addTest(`文件检查: ${description}`, 'passed', `文件存在: ${filePath}`);
    return true;
  } else {
    addTest(`文件检查: ${description}`, 'failed', `文件不存在: ${filePath}`);
    return false;
  }
}

// 检查文件内容
function checkFileContent(filePath, description, checkFunction) {
  if (!checkFileExists(filePath, description)) {
    return false;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = checkFunction(content);
    
    if (result.passed) {
      addTest(`内容检查: ${description}`, 'passed', result.message);
    } else {
      addTest(`内容检查: ${description}`, 'failed', result.message);
    }
    
    return result.passed;
  } catch (error) {
    addTest(`内容检查: ${description}`, 'failed', `读取文件失败: ${error.message}`);
    return false;
  }
}

// 检查TypeScript配置
function checkTypeScriptConfig() {
  log.info('检查TypeScript配置...');
  
  checkFileContent('tsconfig.json', 'TypeScript配置', (content) => {
    try {
      const config = JSON.parse(content);
      
      if (!config.compilerOptions) {
        return { passed: false, message: '缺少compilerOptions配置' };
      }
      
      if (!config.compilerOptions.baseUrl) {
        return { passed: false, message: '缺少baseUrl配置' };
      }
      
      if (!config.compilerOptions.paths || !config.compilerOptions.paths['@/*']) {
        return { passed: false, message: '缺少路径别名配置' };
      }
      
      return { passed: true, message: 'TypeScript配置正确' };
    } catch (error) {
      return { passed: false, message: `JSON解析失败: ${error.message}` };
    }
  });
}

// 检查Vite配置
function checkViteConfig() {
  log.info('检查Vite配置...');
  
  checkFileContent('vite.config.ts', 'Vite配置', (content) => {
    if (!content.includes('@vitejs/plugin-react')) {
      return { passed: false, message: '缺少React插件配置' };
    }
    
    if (!content.includes('path.resolve')) {
      return { passed: false, message: '缺少路径解析配置' };
    }
    
    if (!content.includes('manualChunks')) {
      return { passed: false, message: '缺少代码分割配置' };
    }
    
    return { passed: true, message: 'Vite配置正确' };
  });
}

// 检查关键组件文件
function checkComponentFiles() {
  log.info('检查关键组件文件...');
  
  const criticalFiles = [
    'src/components/NewAwardIndicatorManagement.tsx',
    'src/components/common/ManageCategoryModal.tsx',
    'src/components/common/IndicatorCard.tsx',
    'src/components/MigrationManagement.tsx',
    'src/services/awardIndicatorService.ts',
    'src/types/awardIndicators.ts',
    'src/scripts/awardDataMigration.ts',
    'src/utils/dataValidator.ts'
  ];
  
  criticalFiles.forEach(file => {
    checkFileExists(file, `关键组件: ${path.basename(file)}`);
  });
}

// 检查路由配置
function checkRoutingConfig() {
  log.info('检查路由配置...');
  
  checkFileContent('src/App.tsx', '主应用路由', (content) => {
    if (!content.includes('MigrationPage')) {
      return { passed: false, message: '缺少迁移页面路由' };
    }
    
    if (!content.includes('/migration')) {
      return { passed: false, message: '缺少迁移路由路径' };
    }
    
    if (!content.includes('/awards/new-award-indicators')) {
      return { passed: false, message: '缺少新奖励指标路由' };
    }
    
    return { passed: true, message: '路由配置正确' };
  });
}

// 检查导航菜单
function checkNavigationMenu() {
  log.info('检查导航菜单配置...');
  
  checkFileContent('src/components/AppSider.tsx', '侧边栏导航', (content) => {
    if (!content.includes('SwapOutlined')) {
      return { passed: false, message: '缺少迁移菜单图标' };
    }
    
    if (!content.includes('数据迁移')) {
      return { passed: false, message: '缺少迁移菜单项' };
    }
    
    if (!content.includes('/migration')) {
      return { passed: false, message: '缺少迁移菜单路径' };
    }
    
    return { passed: true, message: '导航菜单配置正确' };
  });
}

// 检查部署配置
function checkDeploymentConfig() {
  log.info('检查部署配置...');
  
  checkFileExists('deployment-config.md', '部署配置文档');
  checkFileExists('scripts/deploy.sh', 'Linux部署脚本');
  checkFileExists('scripts/deploy.bat', 'Windows部署脚本');
}

// 检查环境变量模板
function checkEnvironmentTemplate() {
  log.info('检查环境变量配置...');
  
  checkFileContent('.env.example', '环境变量示例', (content) => {
    const requiredVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ];
    
    const missingVars = requiredVars.filter(varName => !content.includes(varName));
    
    if (missingVars.length > 0) {
      return { passed: false, message: `缺少环境变量: ${missingVars.join(', ')}` };
    }
    
    return { passed: true, message: '环境变量配置完整' };
  });
}

// 检查包依赖
function checkPackageDependencies() {
  log.info('检查包依赖...');
  
  checkFileContent('package.json', '包依赖配置', (content) => {
    try {
      const packageJson = JSON.parse(content);
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const requiredDeps = [
        'react',
        'react-dom',
        'antd',
        'firebase',
        '@types/react',
        '@types/react-dom',
        'typescript',
        'vite',
        '@vitejs/plugin-react'
      ];
      
      const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
      
      if (missingDeps.length > 0) {
        return { passed: false, message: `缺少依赖: ${missingDeps.join(', ')}` };
      }
      
      return { passed: true, message: '包依赖配置完整' };
    } catch (error) {
      return { passed: false, message: `JSON解析失败: ${error.message}` };
    }
  });
}

// 检查Firebase配置
function checkFirebaseConfig() {
  log.info('检查Firebase配置...');
  
  checkFileExists('firebase.json', 'Firebase配置文件');
  checkFileExists('firestore.rules', 'Firestore安全规则');
  checkFileExists('.firebaserc', 'Firebase项目配置');
}

// 生成测试报告
function generateReport() {
  const totalTests = testResults.passed + testResults.failed + testResults.warnings;
  const successRate = totalTests > 0 ? ((testResults.passed / totalTests) * 100).toFixed(1) : 0;
  
  const report = `
# 最终测试报告

## 概览
- 总测试数: ${totalTests}
- 通过: ${testResults.passed}
- 失败: ${testResults.failed}
- 警告: ${testResults.warnings}
- 成功率: ${successRate}%

## 详细结果

${testResults.tests.map(test => `
### ${test.status === 'passed' ? '✅' : test.status === 'warning' ? '⚠️' : '❌'} ${test.name}
- 状态: ${test.status}
- 消息: ${test.message}
- 时间: ${test.timestamp}
${test.details ? `- 详情: ${JSON.stringify(test.details, null, 2)}` : ''}
`).join('')}

## 总结
${testResults.failed === 0 ? '🎉 所有关键测试通过！系统已准备好部署。' : '⚠️ 发现一些问题，请修复后再部署。'}
`;

  // 保存报告到文件
  fs.writeFileSync('test-report.md', report);
  log.info('测试报告已保存到 test-report.md');
  
  return report;
}

// 主函数
async function main() {
  console.log('==========================================');
  console.log('🧪 JCI KL 奖励指标管理系统 - 最终测试');
  console.log('版本: v2.0.0');
  console.log('==========================================');
  console.log('');
  
  try {
    // 执行所有测试
    checkTypeScriptConfig();
    checkViteConfig();
    checkComponentFiles();
    checkRoutingConfig();
    checkNavigationMenu();
    checkDeploymentConfig();
    checkEnvironmentTemplate();
    checkPackageDependencies();
    checkFirebaseConfig();
    
    // 生成报告
    const report = generateReport();
    console.log(report);
    
    // 返回退出码
    if (testResults.failed > 0) {
      log.error(`测试失败: ${testResults.failed} 个测试失败`);
      process.exit(1);
    } else {
      log.success('所有测试通过！');
      process.exit(0);
    }
    
  } catch (error) {
    log.error(`测试执行失败: ${error.message}`);
    process.exit(1);
  }
}

// 执行主函数
main();
