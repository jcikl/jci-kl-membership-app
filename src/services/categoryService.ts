// 分类管理服务
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { MemberCategory, MembershipCategory, AccountType } from '@/types/rbac';

// 分类分配选项
export interface CategoryAssignmentOptions {
  reason?: string;
  assignedBy: string;
}

// 分类更新选项
export interface CategoryUpdateOptions {
  reason?: string;
  status?: 'active' | 'inactive';
}

// 分类统计
export interface CategoryStats {
  category: MembershipCategory;
  count: number;
  percentage: number;
}

export const categoryService = {
  // 分配分类
  assignCategory: async (
    memberId: string, 
    membershipCategory: MembershipCategory, 
    accountType: AccountType, 
    options: CategoryAssignmentOptions
  ): Promise<string> => {
    try {
      // 检查是否已有活跃的分类
      const existingCategory = await categoryService.getMemberCategory(memberId);
      if (existingCategory && existingCategory.status === 'active') {
        // 更新现有分类
        await categoryService.updateCategory(existingCategory.id, {
          membershipCategory,
          accountType,
          reason: options.reason,
          status: 'active'
        });
        return existingCategory.id;
      }

      const categoryData: Omit<MemberCategory, 'id'> = {
        memberId,
        membershipCategory,
        accountType,
        reason: options.reason,
        assignedBy: options.assignedBy,
        assignedDate: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'member_categories'), categoryData);
      return docRef.id;
    } catch (error) {
      console.error('分配分类失败:', error);
      throw error;
    }
  },

  // 获取会员分类
  getMemberCategory: async (memberId: string): Promise<MemberCategory | null> => {
    try {
      const q = query(
        collection(db, 'member_categories'),
        where('memberId', '==', memberId),
        where('status', '==', 'active'),
        orderBy('assignedDate', 'desc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as MemberCategory;
    } catch (error) {
      console.error('获取会员分类失败:', error);
      throw error;
    }
  },

  // 获取分类历史
  getCategoryHistory: async (memberId: string): Promise<MemberCategory[]> => {
    try {
      const q = query(
        collection(db, 'member_categories'),
        where('memberId', '==', memberId),
        orderBy('assignedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemberCategory[];
    } catch (error) {
      console.error('获取分类历史失败:', error);
      throw error;
    }
  },

  // 更新分类
  updateCategory: async (categoryId: string, updates: Partial<MemberCategory>): Promise<void> => {
    try {
      const categoryRef = doc(db, 'member_categories', categoryId);
      await updateDoc(categoryRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('更新分类失败:', error);
      throw error;
    }
  },

  // 获取所有分类
  getAllCategories: async (): Promise<MemberCategory[]> => {
    try {
      const q = query(
        collection(db, 'member_categories'),
        orderBy('assignedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemberCategory[];
    } catch (error) {
      console.error('获取所有分类失败:', error);
      throw error;
    }
  },

  // 根据分类获取会员
  getMembersByCategory: async (membershipCategory: MembershipCategory): Promise<MemberCategory[]> => {
    try {
      const q = query(
        collection(db, 'member_categories'),
        where('membershipCategory', '==', membershipCategory),
        where('status', '==', 'active'),
        orderBy('assignedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemberCategory[];
    } catch (error) {
      console.error('根据分类获取会员失败:', error);
      throw error;
    }
  },

  // 根据账户类型获取会员
  getMembersByAccountType: async (accountType: AccountType): Promise<MemberCategory[]> => {
    try {
      const q = query(
        collection(db, 'member_categories'),
        where('accountType', '==', accountType),
        where('status', '==', 'active'),
        orderBy('assignedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemberCategory[];
    } catch (error) {
      console.error('根据账户类型获取会员失败:', error);
      throw error;
    }
  },

  // 删除分类记录
  deleteCategory: async (categoryId: string): Promise<void> => {
    try {
      const categoryRef = doc(db, 'member_categories', categoryId);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('删除分类记录失败:', error);
      throw error;
    }
  },

  // 获取分类统计
  getCategoryStats: async (): Promise<CategoryStats[]> => {
    try {
      const allCategories = await categoryService.getAllCategories();
      const activeCategories = allCategories.filter(cat => cat.status === 'active');
      
      const categoryCounts: Record<MembershipCategory, number> = {
        active: 0,
        associate: 0,
        honorary: 0,
        affiliate: 0,
        visitor: 0,
        alumni: 0,
        corporate: 0,
        student: 0
      };

      // 统计各类别数量
      activeCategories.forEach(category => {
        categoryCounts[category.membershipCategory]++;
      });

      const total = activeCategories.length;
      
      // 计算百分比并返回统计结果
      return Object.entries(categoryCounts).map(([category, count]) => ({
        category: category as MembershipCategory,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }));
    } catch (error) {
      console.error('获取分类统计失败:', error);
      throw error;
    }
  },

  // 获取账户类型统计
  getAccountTypeStats: async (): Promise<Array<{ type: AccountType; count: number; percentage: number }>> => {
    try {
      const allCategories = await categoryService.getAllCategories();
      const activeCategories = allCategories.filter(cat => cat.status === 'active');
      
      const typeCounts: Record<AccountType, number> = {
        developer: 0,
        admin: 0,
        member: 0,
        moderator: 0,
        guest: 0
      };

      // 统计各类型数量
      activeCategories.forEach(category => {
        typeCounts[category.accountType]++;
      });

      const total = activeCategories.length;
      
      // 计算百分比并返回统计结果
      return Object.entries(typeCounts).map(([type, count]) => ({
        type: type as AccountType,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }));
    } catch (error) {
      console.error('获取账户类型统计失败:', error);
      throw error;
    }
  },

  // 批量更新分类
  batchUpdateCategories: async (updates: Array<{ categoryId: string; updates: Partial<MemberCategory> }>): Promise<void> => {
    try {
      const promises = updates.map(({ categoryId, updates: categoryUpdates }) =>
        categoryService.updateCategory(categoryId, categoryUpdates)
      );
      
      await Promise.all(promises);
    } catch (error) {
      console.error('批量更新分类失败:', error);
      throw error;
    }
  }
};
