import { transactionPurposeService } from './financeService';
import { TransactionPurpose } from '@/types/finance';

// 3层级交易用途初始化数据
export const threeTierPurposeData = {
  // 第一层级：主要分类 (Level 0)
  mainCategories: [
    {
      name: '收入类',
      description: '所有收入相关的交易用途',
      category: 'other',
      level: 0,
      isActive: true,
    },
    {
      name: '支出类',
      description: '所有支出相关的交易用途',
      category: 'other',
      level: 0,
      isActive: true,
    },
    {
      name: '其他账户',
      description: '其他账户相关的交易用途',
      category: 'other',
      level: 0,
      isActive: true,
    },
    {
      name: '银行转账',
      description: '银行转账相关的交易用途',
      category: 'other',
      level: 0,
      isActive: true,
    },
  ],

  // 第二层级：业务分类 (Level 1)
  businessCategories: [
    // 收入类子分类
    {
      name: '会员费',
      description: '会员相关的费用收入',
      category: 'membership_fee',
      level: 1,
      isActive: true,
      parentCategory: '收入类',
    },
    {
      name: '项目收入',
      description: '项目相关的收入',
      category: 'registration_fee',
      level: 1,
      isActive: true,
      parentCategory: '收入类',
    },
    {
      name: '赞助收入',
      description: '赞助相关的收入',
      category: 'donation',
      level: 1,
      isActive: true,
      parentCategory: '收入类',
    },
    {
      name: '其他收入',
      description: '其他类型的收入',
      category: 'other',
      level: 1,
      isActive: true,
      parentCategory: '收入类',
    },

    // 支出类子分类
    {
      name: '办公支出',
      description: '办公相关的支出',
      category: 'office_expense',
      level: 1,
      isActive: true,
      parentCategory: '支出类',
    },
    {
      name: '项目支出',
      description: '项目相关的支出',
      category: 'event_expense',
      level: 1,
      isActive: true,
      parentCategory: '支出类',
    },
    {
      name: '差旅费',
      description: '差旅相关的支出',
      category: 'travel_expense',
      level: 1,
      isActive: true,
      parentCategory: '支出类',
    },
    {
      name: '其他支出',
      description: '其他类型的支出',
      category: 'other',
      level: 1,
      isActive: true,
      parentCategory: '支出类',
    },

    // 其他账户子分类
    {
      name: 'OP/OR',
      description: '运营/运营储备相关',
      category: 'other',
      level: 1,
      isActive: true,
      parentCategory: '其他账户',
    },
    {
      name: 'JCIM',
      description: '国际青年商会马来西亚相关',
      category: 'other',
      level: 1,
      isActive: true,
      parentCategory: '其他账户',
    },
    {
      name: '其他账户',
      description: '其他账户相关',
      category: 'other',
      level: 1,
      isActive: true,
      parentCategory: '其他账户',
    },

    // 银行转账子分类
    {
      name: '银行转账',
      description: '银行转账相关',
      category: 'other',
      level: 1,
      isActive: true,
      parentCategory: '银行转账',
    },
  ],

  // 第三层级：具体用途 (Level 2)
  specificPurposes: [
    // 会员费具体用途
    {
      name: '2022新会员费',
      description: '2022年新会员费用',
      category: 'membership_fee',
      level: 2,
      isActive: true,
      parentCategory: '会员费',
    },
    {
      name: '2022续费会员费',
      description: '2022年续费会员费用',
      category: 'membership_fee',
      level: 2,
      isActive: true,
      parentCategory: '会员费',
    },
    {
      name: '2023新会员费',
      description: '2023年新会员费用',
      category: 'membership_fee',
      level: 2,
      isActive: true,
      parentCategory: '会员费',
    },
    {
      name: '2023续费会员费',
      description: '2023年续费会员费用',
      category: 'membership_fee',
      level: 2,
      isActive: true,
      parentCategory: '会员费',
    },
    {
      name: '2024新会员费',
      description: '2024年新会员费用',
      category: 'membership_fee',
      level: 2,
      isActive: true,
      parentCategory: '会员费',
    },
    {
      name: '2024续费会员费',
      description: '2024年续费会员费用',
      category: 'membership_fee',
      level: 2,
      isActive: true,
      parentCategory: '会员费',
    },
    {
      name: '2025新会员费',
      description: '2025年新会员费用',
      category: 'membership_fee',
      level: 2,
      isActive: true,
      parentCategory: '会员费',
    },
    {
      name: '2025续费会员费',
      description: '2025年续费会员费用',
      category: 'membership_fee',
      level: 2,
      isActive: true,
      parentCategory: '会员费',
    },
    {
      name: '准会员费',
      description: '准会员相关费用',
      category: 'membership_fee',
      level: 2,
      isActive: true,
      parentCategory: '会员费',
    },
    {
      name: '访问会员费',
      description: '访问会员相关费用',
      category: 'membership_fee',
      level: 2,
      isActive: true,
      parentCategory: '会员费',
    },

    // 项目收入具体用途
    {
      name: '2022项目',
      description: '2022年项目收入',
      category: 'registration_fee',
      level: 2,
      isActive: true,
      parentCategory: '项目收入',
    },
    {
      name: '2023项目',
      description: '2023年项目收入',
      category: 'registration_fee',
      level: 2,
      isActive: true,
      parentCategory: '项目收入',
    },
    {
      name: '2024项目',
      description: '2024年项目收入',
      category: 'registration_fee',
      level: 2,
      isActive: true,
      parentCategory: '项目收入',
    },
    {
      name: '2025项目',
      description: '2025年项目收入',
      category: 'registration_fee',
      level: 2,
      isActive: true,
      parentCategory: '项目收入',
    },

    // 办公支出具体用途
    {
      name: '审计费',
      description: '审计相关费用',
      category: 'office_expense',
      level: 2,
      isActive: true,
      parentCategory: '办公支出',
    },
    {
      name: '电费',
      description: '电力相关费用',
      category: 'office_expense',
      level: 2,
      isActive: true,
      parentCategory: '办公支出',
    },
    {
      name: '水费',
      description: '水资源相关费用',
      category: 'office_expense',
      level: 2,
      isActive: true,
      parentCategory: '办公支出',
    },
    {
      name: '租金',
      description: '场地租金相关费用',
      category: 'office_expense',
      level: 2,
      isActive: true,
      parentCategory: '办公支出',
    },
    {
      name: '文具用品',
      description: '文具用品相关费用',
      category: 'office_expense',
      level: 2,
      isActive: true,
      parentCategory: '办公支出',
    },

    // 项目支出具体用途
    {
      name: '活动费用',
      description: '活动相关费用',
      category: 'event_expense',
      level: 2,
      isActive: true,
      parentCategory: '项目支出',
    },
    {
      name: '场地费',
      description: '场地相关费用',
      category: 'event_expense',
      level: 2,
      isActive: true,
      parentCategory: '项目支出',
    },
    {
      name: '餐饮费',
      description: '餐饮相关费用',
      category: 'event_expense',
      level: 2,
      isActive: true,
      parentCategory: '项目支出',
    },
    {
      name: '交通费',
      description: '交通相关费用',
      category: 'event_expense',
      level: 2,
      isActive: true,
      parentCategory: '项目支出',
    },

    // 其他支出具体用途
    {
      name: '慰问花圈',
      description: '慰问花圈相关费用',
      category: 'other', // 初始化服务会自动设置为正确的业务分类ID
      level: 2,
      isActive: true,
      parentCategory: '其他支出',
    },
    {
      name: '杂项费用',
      description: '杂项相关费用',
      category: 'other', // 初始化服务会自动设置为正确的业务分类ID
      level: 2,
      isActive: true,
      parentCategory: '其他支出',
    },
    {
      name: '其他支出',
      description: '其他类型支出',
      category: 'other', // 初始化服务会自动设置为正确的业务分类ID
      level: 2,
      isActive: true,
      parentCategory: '其他支出',
    },
  ],
};

// 初始化3层级交易用途服务
export const transactionPurposeInitService = {
  // 检查是否已初始化
  async checkInitialized(): Promise<boolean> {
    try {
      const purposes = await transactionPurposeService.getPurposes();
      // 检查是否存在3层级结构
      const hasMainCategories = purposes.some(p => p.level === 0);
      const hasBusinessCategories = purposes.some(p => p.level === 1);
      const hasSpecificPurposes = purposes.some(p => p.level === 2);
      
      return hasMainCategories && hasBusinessCategories && hasSpecificPurposes;
    } catch (error) {
      console.error('检查初始化状态失败:', error);
      return false;
    }
  },

  // 初始化3层级交易用途
  async initializeThreeTierPurposes(createdBy: string): Promise<{
    success: boolean;
    message: string;
    createdCount: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let createdCount = 0;

    try {
      // 检查是否已初始化
      const isInitialized = await this.checkInitialized();
      if (isInitialized) {
        return {
          success: true,
          message: '3层级交易用途体系已存在，无需重复初始化',
          createdCount: 0,
          errors: [],
        };
      }

      // 创建第一层级：主要分类
      const mainCategoryIds: { [key: string]: string } = {};
      for (const category of threeTierPurposeData.mainCategories) {
        try {
          const { category: _, ...categoryData } = category; // 移除category字段
          const id = await transactionPurposeService.createPurpose({
            ...categoryData,
            createdBy,
          });
          mainCategoryIds[category.name] = id;
          createdCount++;
        } catch (error) {
          errors.push(`创建主要分类 "${category.name}" 失败: ${error}`);
        }
      }

      // 创建第二层级：业务分类
      const businessCategoryIds: { [key: string]: string } = {};
      for (const category of threeTierPurposeData.businessCategories) {
        try {
          const parentId = mainCategoryIds[category.parentCategory];
          if (!parentId) {
            errors.push(`找不到父分类 "${category.parentCategory}" 对于业务分类 "${category.name}"`);
            continue;
          }

          const { category: _, ...categoryData } = category; // 移除category字段
          const id = await transactionPurposeService.createPurpose({
            ...categoryData,
            parentId,
            createdBy,
          });
          businessCategoryIds[category.name] = id;
          createdCount++;
        } catch (error) {
          errors.push(`创建业务分类 "${category.name}" 失败: ${error}`);
        }
      }

      // 创建第三层级：具体用途
      for (const purpose of threeTierPurposeData.specificPurposes) {
        try {
          const parentId = businessCategoryIds[purpose.parentCategory];
          if (!parentId) {
            errors.push(`找不到父分类 "${purpose.parentCategory}" 对于具体用途 "${purpose.name}"`);
            continue;
          }

          await transactionPurposeService.createPurpose({
            ...purpose,
            parentId,
            category: parentId, // 2级目录的category字段应该是业务分类的ID
            createdBy,
          });
          createdCount++;
        } catch (error) {
          errors.push(`创建具体用途 "${purpose.name}" 失败: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        message: errors.length === 0 
          ? `成功初始化3层级交易用途体系，共创建 ${createdCount} 个用途` 
          : `部分初始化完成，创建了 ${createdCount} 个用途，但有 ${errors.length} 个错误`,
        createdCount,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        message: `初始化失败: ${error}`,
        createdCount,
        errors: [`初始化过程出错: ${error}`],
      };
    }
  },

  // 重置3层级交易用途（删除所有现有用途并重新创建）
  async resetThreeTierPurposes(createdBy: string): Promise<{
    success: boolean;
    message: string;
    createdCount: number;
    errors: string[];
  }> {
    try {
      // 获取所有现有用途
      const existingPurposes = await transactionPurposeService.getPurposes();
      
      // 删除所有现有用途
      for (const purpose of existingPurposes) {
        try {
          await transactionPurposeService.deletePurpose(purpose.id);
        } catch (error) {
          console.warn(`删除用途 "${purpose.name}" 失败:`, error);
        }
      }

      // 重新初始化
      return await this.initializeThreeTierPurposes(createdBy);
    } catch (error) {
      return {
        success: false,
        message: `重置失败: ${error}`,
        createdCount: 0,
        errors: [`重置过程出错: ${error}`],
      };
    }
  },

  // 获取3层级结构数据
  async getThreeTierStructure(): Promise<{
    mainCategories: TransactionPurpose[];
    businessCategories: TransactionPurpose[];
    specificPurposes: TransactionPurpose[];
  }> {
    try {
      const purposes = await transactionPurposeService.getPurposes();
      
      return {
        mainCategories: purposes.filter(p => p.level === 0),
        businessCategories: purposes.filter(p => p.level === 1),
        specificPurposes: purposes.filter(p => p.level === 2),
      };
    } catch (error) {
      console.error('获取3层级结构失败:', error);
      return {
        mainCategories: [],
        businessCategories: [],
        specificPurposes: [],
      };
    }
  },
};
