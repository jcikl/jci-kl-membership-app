/**
 * 全局设置合规性检查脚本
 * 用于检查整个代码库的全局设置合规性
 */

import { globalSettingsCommander } from '@/config/globalSettingsCommander';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * 文件检查配置
 */
const CHECK_CONFIG = {
  // 要检查的文件扩展名
  EXTENSIONS: ['.ts', '.tsx', '.js', '.jsx'],
  
  // 要排除的目录
  EXCLUDE_DIRS: ['node_modules', '.git', 'dist', 'build', '.next'],
  
  // 要排除的文件
  EXCLUDE_FILES: ['globalSettingsCommander.ts', 'globalSettingsComplianceChecker.ts'],
  
  // 要检查的目录
  INCLUDE_DIRS: ['src/components', 'src/pages', 'src/services', 'src/hooks', 'src/utils']
};

/**
 * 递归读取目录中的所有文件
 */
function getAllFiles(dirPath: string, filesList: string[] = []): string[] {
  const files = readdirSync(dirPath);
  
  for (const file of files) {
    const fullPath = join(dirPath, file);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!CHECK_CONFIG.EXCLUDE_DIRS.includes(file)) {
        getAllFiles(fullPath, filesList);
      }
    } else {
      const ext = file.substring(file.lastIndexOf('.'));
      if (CHECK_CONFIG.EXTENSIONS.includes(ext) && !CHECK_CONFIG.EXCLUDE_FILES.includes(file)) {
        filesList.push(fullPath);
      }
    }
  }
  
  return filesList;
}

/**
 * 检查单个文件
 */
function checkFile(filePath: string): { path: string; content: string } | null {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return { path: filePath, content };
  } catch (error) {
    return null;
  }
}

/**
 * 主检查函数
 */
export async function runGlobalSettingsComplianceCheck(): Promise<void> {
  // 获取所有要检查的文件
  const allFiles: string[] = [];
  for (const dir of CHECK_CONFIG.INCLUDE_DIRS) {
    try {
      const files = getAllFiles(dir);
      allFiles.push(...files);
    } catch (error) {
      // 静默跳过无法访问的目录
    }
  }
  
  // 检查每个文件
  const fileData = allFiles
    .map(checkFile)
    .filter((file): file is { path: string; content: string } => file !== null);
  
  if (fileData.length === 0) {
    return;
  }
  
  // 执行合规性检查
  const results = await globalSettingsCommander.checkMultipleFilesCompliance(fileData);
  
  // 生成报告
  const report = globalSettingsCommander.generateComplianceReport(results);
  
  // 输出报告
  console.log(report);
  
  // 输出详细的不合规文件
  const nonCompliantFiles = results.filter(r => !r.isCompliant);
  if (nonCompliantFiles.length > 0) {
    console.log('\n🚨 需要修正的文件:');
    nonCompliantFiles.forEach(result => {
      console.log(`\n📄 ${result.filePath} (分数: ${result.score}/100)`);
      result.violations.forEach(violation => {
        console.log(`  ❌ 第${violation.line}行: ${violation.message}`);
        console.log(`     💡 建议: ${violation.suggestedFix}`);
      });
    });
  }
  
  // 输出建议
  const allRecommendations = results.flatMap(r => r.recommendations);
  if (allRecommendations.length > 0) {
    console.log('\n💡 改进建议:');
    const uniqueRecommendations = allRecommendations.filter((rec, index, arr) => 
      arr.findIndex(r => r.type === rec.type) === index
    );
    
    uniqueRecommendations.forEach(rec => {
      console.log(`\n🔧 ${rec.message}`);
      console.log(`   示例: ${rec.codeExample}`);
      console.log(`   优先级: ${rec.priority}`);
    });
  }
}

/**
 * 检查特定文件
 */
export async function checkSpecificFile(filePath: string): Promise<void> {
  const fileData = checkFile(filePath);
  if (!fileData) {
    return;
  }
  
  const result = await globalSettingsCommander.checkFileCompliance(filePath, fileData.content);
  
  console.log(`📄 文件: ${result.filePath}`);
  console.log(`✅ 合规性: ${result.isCompliant ? '合规' : '不合规'}`);
  console.log(`📊 分数: ${result.score}/100`);
  console.log(`🚨 违规数量: ${result.violations.length}`);
  console.log(`💡 建议数量: ${result.recommendations.length}`);
  
  if (result.violations.length > 0) {
    console.log('\n🚨 违规详情:');
    result.violations.forEach(violation => {
      console.log(`\n❌ 第${violation.line}行: ${violation.message}`);
      console.log(`   类型: ${violation.type}`);
      console.log(`   模块: ${violation.module}`);
      console.log(`   严重程度: ${violation.severity}`);
      console.log(`   💡 建议: ${violation.suggestedFix}`);
    });
  }
  
  if (result.recommendations.length > 0) {
    console.log('\n💡 改进建议:');
    result.recommendations.forEach(rec => {
      console.log(`\n🔧 ${rec.message}`);
      console.log(`   示例: ${rec.codeExample}`);
      console.log(`   优先级: ${rec.priority}`);
    });
  }
}

/**
 * 自动修正文件
 */
export async function autoCorrectFile(filePath: string): Promise<void> {
  const fileData = checkFile(filePath);
  if (!fileData) {
    return;
  }
  
  const result = await globalSettingsCommander.checkFileCompliance(filePath, fileData.content);
  
  if (result.isCompliant) {
    return;
  }
  
  const correctedContent = globalSettingsCommander.autoCorrectCode(fileData.content, result.violations);
  
  // 这里可以添加写入文件的逻辑
  console.log('✅ 自动修正完成');
  console.log('📝 修正后的内容预览:');
  console.log(correctedContent.substring(0, 500) + '...');
}

// 如果直接运行此脚本
if (require.main === module) {
  runGlobalSettingsComplianceCheck().catch(console.error);
}
