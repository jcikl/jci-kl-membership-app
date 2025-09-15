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
  try {
    // 检查是否已初始化
    const isInitialized = await transactionPurposeInitService.checkInitialized();
    
    if (isInitialized) {
      return {
        success: true,
        message: '3层级交易用途体系已存在，无需重复初始化',
        createdCount: 0,
        errors: [],
      };
    }

    // 执行初始化
    const result = await transactionPurposeInitService.initializeThreeTierPurposes(userId);
    return result;
  } catch (error) {
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
  try {
    const result = await transactionPurposeInitService.resetThreeTierPurposes(userId);
    return result;
  } catch (error) {
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
    return isInitialized;
  } catch (error) {
    return false;
  }
}

// 获取3层级结构
export async function getThreeTierStructure() {
  try {
    const structure = await transactionPurposeInitService.getThreeTierStructure();
    return structure;
  } catch (error) {
    return {
      mainCategories: [],
      businessCategories: [],
      specificPurposes: [],
    };
  }
}

// 命令行执行函数（用于开发环境测试）
export async function runInitializationScript() {
  // 模拟用户ID（实际使用时应该从认证系统获取）
  const mockUserId = 'system-admin';
  
  try {
    // 检查当前状态
    const isInitialized = await checkInitializationStatus();
    
    if (isInitialized) {
      // 在实际应用中，这里应该有用户确认逻辑
      // 为了演示，我们直接重置
      const resetResult = await resetTransactionPurposes(mockUserId);
      console.log('重置结果：', resetResult);
    } else {
      const initResult = await initializeTransactionPurposes(mockUserId);
      console.log('初始化结果：', initResult);
    }
    
    // 获取最终结构
    const finalStructure = await getThreeTierStructure();
    console.log('主要分类数量：', finalStructure.mainCategories.length);
    console.log('业务分类数量：', finalStructure.businessCategories.length);
    console.log('具体用途数量：', finalStructure.specificPurposes.length);
  } catch (error) {
    console.error('脚本执行失败：', error);
  }
}

// 如果直接运行此脚本，执行初始化
if (typeof window === 'undefined' && require.main === module) {
  runInitializationScript();
}
