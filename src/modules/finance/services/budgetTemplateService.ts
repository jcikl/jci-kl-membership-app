import { 
  collection, 
  doc, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/services/firebase';

export interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  allocations: Array<{
    purposeId: string;
    purposeName: string;
    amount: number;
    percentage: number;
  }>;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetTemplateAllocation {
  id: string;
  templateId: string;
  purposeId: string;
  purposeName: string;
  amount: number;
  percentage: number;
  createdAt: string;
  updatedAt: string;
}

// 预算模板服务
export const budgetTemplateService = {
  // 创建预算模板
  async createTemplate(template: Omit<BudgetTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'budgetTemplates'), {
      ...template,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 更新预算模板
  async updateTemplate(id: string, template: Partial<BudgetTemplate>): Promise<void> {
    const docRef = doc(db, 'budgetTemplates', id);
    await updateDoc(docRef, {
      ...template,
      updatedAt: Timestamp.now(),
    });
  },

  // 删除预算模板
  async deleteTemplate(id: string): Promise<void> {
    await deleteDoc(doc(db, 'budgetTemplates', id));
  },

  // 获取预算模板列表
  async getTemplates(): Promise<BudgetTemplate[]> {
    const querySnapshot = await getDocs(query(collection(db, 'budgetTemplates'), orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }) as BudgetTemplate[];
  },

  // 根据ID获取预算模板
  async getTemplateById(id: string): Promise<BudgetTemplate | null> {
    const docSnap = await getDocs(query(collection(db, 'budgetTemplates'), where('id', '==', id)));
    
    if (docSnap.empty) {
      return null;
    }

    const data = docSnap.docs[0].data();
    return {
      id: docSnap.docs[0].id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    } as BudgetTemplate;
  },

  // 从模板创建预算
  async createBudgetFromTemplate(templateId: string, budgetYear: number, customizations?: {
    projectName?: string;
    totalAmount?: number;
    description?: string;
  }): Promise<string> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('预算模板不存在');
    }

    const { budgetService } = await import('./financeService');
    
    // 创建预算
    const budgetId = await budgetService.createBudget({
      projectName: customizations?.projectName || `${template.name} - ${budgetYear}年度`,
      budgetYear,
      totalBudget: customizations?.totalAmount || template.totalAmount,
      allocatedAmount: 0,
      spentAmount: 0,
      remainingAmount: customizations?.totalAmount || template.totalAmount,
      status: 'draft',
      description: customizations?.description || template.description,
      createdBy: 'current-user', // TODO: 从认证状态获取实际用户ID
    });

    // 创建预算分配
    const { budgetAllocationService } = await import('./financeService');
    const allocationPromises = template.allocations.map(allocation => {
      const allocationAmount = customizations?.totalAmount 
        ? (allocation.percentage / 100) * customizations.totalAmount
        : allocation.amount;

      return budgetAllocationService.createAllocation({
        budgetId,
        purposeId: allocation.purposeId,
        purposeName: allocation.purposeName,
        allocatedAmount: allocationAmount,
        spentAmount: 0,
        remainingAmount: allocationAmount,
      });
    });

    await Promise.all(allocationPromises);
    return budgetId;
  },

  // 创建标准预算模板
  async createStandardTemplates(): Promise<void> {
    const standardTemplates = [
      {
        name: '标准年度预算模板',
        description: '适用于一般分会的标准预算分配',
        allocations: [
          { purposeId: 'membership-fee', purposeName: '会员费', amount: 50000, percentage: 30 },
          { purposeId: 'event-expense', purposeName: '活动支出', amount: 30000, percentage: 18 },
          { purposeId: 'office-expense', purposeName: '办公支出', amount: 25000, percentage: 15 },
          { purposeId: 'marketing-expense', purposeName: '营销费用', amount: 20000, percentage: 12 },
          { purposeId: 'training-expense', purposeName: '培训费用', amount: 15000, percentage: 9 },
          { purposeId: 'equipment-expense', purposeName: '设备费用', amount: 10000, percentage: 6 },
          { purposeId: 'other', purposeName: '其他', amount: 10000, percentage: 6 },
        ],
        totalAmount: 160000,
        createdBy: 'system',
      },
      {
        name: '精简预算模板',
        description: '适用于小型分会的精简预算',
        allocations: [
          { purposeId: 'membership-fee', purposeName: '会员费', amount: 30000, percentage: 40 },
          { purposeId: 'event-expense', purposeName: '活动支出', amount: 20000, percentage: 27 },
          { purposeId: 'office-expense', purposeName: '办公支出', amount: 15000, percentage: 20 },
          { purposeId: 'other', purposeName: '其他', amount: 10000, percentage: 13 },
        ],
        totalAmount: 75000,
        createdBy: 'system',
      },
      {
        name: '大型分会预算模板',
        description: '适用于大型分会的全面预算',
        allocations: [
          { purposeId: 'membership-fee', purposeName: '会员费', amount: 100000, percentage: 25 },
          { purposeId: 'event-expense', purposeName: '活动支出', amount: 80000, percentage: 20 },
          { purposeId: 'office-expense', purposeName: '办公支出', amount: 60000, percentage: 15 },
          { purposeId: 'marketing-expense', purposeName: '营销费用', amount: 50000, percentage: 12.5 },
          { purposeId: 'training-expense', purposeName: '培训费用', amount: 40000, percentage: 10 },
          { purposeId: 'equipment-expense', purposeName: '设备费用', amount: 30000, percentage: 7.5 },
          { purposeId: 'travel-expense', purposeName: '差旅费', amount: 20000, percentage: 5 },
          { purposeId: 'other', purposeName: '其他', amount: 20000, percentage: 5 },
        ],
        totalAmount: 400000,
        createdBy: 'system',
      },
    ];

    for (const template of standardTemplates) {
      try {
        await this.createTemplate(template);
      } catch (error) {
        console.error(`创建标准模板失败: ${template.name}`, error);
      }
    }
  },
};

// 预算模板分配服务
export const budgetTemplateAllocationService = {
  // 创建模板分配
  async createAllocation(allocation: Omit<BudgetTemplateAllocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'budgetTemplateAllocations'), {
      ...allocation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 更新模板分配
  async updateAllocation(id: string, allocation: Partial<BudgetTemplateAllocation>): Promise<void> {
    const docRef = doc(db, 'budgetTemplateAllocations', id);
    await updateDoc(docRef, {
      ...allocation,
      updatedAt: Timestamp.now(),
    });
  },

  // 删除模板分配
  async deleteAllocation(id: string): Promise<void> {
    await deleteDoc(doc(db, 'budgetTemplateAllocations', id));
  },

  // 获取模板的所有分配
  async getAllocationsByTemplate(templateId: string): Promise<BudgetTemplateAllocation[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, 'budgetTemplateAllocations'),
        where('templateId', '==', templateId),
        orderBy('createdAt', 'asc')
      )
    );
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }) as BudgetTemplateAllocation[];
  },
};
