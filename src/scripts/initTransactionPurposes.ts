/**
 * 初始化3层级交易用途体系脚本
 * 此脚本用于自动创建完整的3层级交易用途管理体系
 */

import { transactionPurposeInitService } from '@/services/transactionPurposeInitService';

// 初始化函数
export async function initializeTransactionPurposes(userId: string): Promise<{
  success: boolean;
  message: string;
  createdCount: number;
  errors: string[];
}> {
  console.log('开始初始化3层级交易用途体系...');
  
  try {
    // 检查是否已初始化
    const isInitialized = await transactionPurposeInitService.checkInitialized();
    
    if (isInitialized) {
      console.log('3层级交易用途体系已存在，无需重复初始化');
      return {
        success: true,
        message: '3层级交易用途体系已存在，无需重复初始化',
        createdCount: 0,
        errors: [],
      };
    }

    // 执行初始化
    const result = await transactionPurposeInitService.initializeThreeTierPurposes(userId);
    
    if (result.success) {
      console.log(`初始化成功：${result.message}`);
      console.log(`创建了 ${result.createdCount} 个交易用途`);
    } else {
      console.warn(`初始化部分成功：${result.message}`);
      if (result.errors.length > 0) {
        console.error('初始化错误详情：', result.errors);
      }
    }

    return result;
  } catch (error) {
    console.error('初始化失败：', error);
    return {
      success: false,
      message: `初始化失败: ${error}`,
      createdCount: 0,
      errors: [`初始化过程出错: ${error}`],
    };
  }
}

// 重置函数
export async function resetTransactionPurposes(userId: string): Promise<{
  success: boolean;
  message: string;
  createdCount: number;
  errors: string[];
}> {
  console.log('开始重置3层级交易用途体系...');
  
  try {
    const result = await transactionPurposeInitService.resetThreeTierPurposes(userId);
    
    if (result.success) {
      console.log(`重置成功：${result.message}`);
      console.log(`创建了 ${result.createdCount} 个交易用途`);
    } else {
      console.error(`重置失败：${result.message}`);
      if (result.errors.length > 0) {
        console.error('重置错误详情：', result.errors);
      }
    }

    return result;
  } catch (error) {
    console.error('重置失败：', error);
    return {
      success: false,
      message: `重置失败: ${error}`,
      createdCount: 0,
      errors: [`重置过程出错: ${error}`],
    };
  }
}

// 检查初始化状态
export async function checkInitializationStatus(): Promise<boolean> {
  try {
    const isInitialized = await transactionPurposeInitService.checkInitialized();
    console.log(`初始化状态：${isInitialized ? '已初始化' : '未初始化'}`);
    return isInitialized;
  } catch (error) {
    console.error('检查初始化状态失败：', error);
    return false;
  }
}

// 获取3层级结构
export async function getThreeTierStructure() {
  try {
    const structure = await transactionPurposeInitService.getThreeTierStructure();
    console.log('3层级结构：', structure);
    return structure;
  } catch (error) {
    console.error('获取3层级结构失败：', error);
    return {
      mainCategories: [],
      businessCategories: [],
      specificPurposes: [],
    };
  }
}

// 命令行执行函数（用于开发环境测试）
export async function runInitializationScript() {
  console.log('=== 3层级交易用途体系初始化脚本 ===');
  
  // 模拟用户ID（实际使用时应该从认证系统获取）
  const mockUserId = 'system-admin';
  
  try {
    // 检查当前状态
    console.log('\n1. 检查当前初始化状态...');
    const isInitialized = await checkInitializationStatus();
    
    if (isInitialized) {
      console.log('系统已初始化，是否要重置？');
      // 在实际应用中，这里应该有用户确认逻辑
      // 为了演示，我们直接重置
      console.log('执行重置...');
      const resetResult = await resetTransactionPurposes(mockUserId);
      console.log('重置结果：', resetResult);
    } else {
      console.log('\n2. 开始初始化...');
      const initResult = await initializeTransactionPurposes(mockUserId);
      console.log('初始化结果：', initResult);
    }
    
    // 获取最终结构
    console.log('\n3. 获取最终3层级结构...');
    const finalStructure = await getThreeTierStructure();
    console.log('主要分类数量：', finalStructure.mainCategories.length);
    console.log('业务分类数量：', finalStructure.businessCategories.length);
    console.log('具体用途数量：', finalStructure.specificPurposes.length);
    
    console.log('\n=== 初始化脚本执行完成 ===');
  } catch (error) {
    console.error('脚本执行失败：', error);
  }
}

// 如果直接运行此脚本，执行初始化
if (typeof window === 'undefined' && require.main === module) {
  runInitializationScript();
}
