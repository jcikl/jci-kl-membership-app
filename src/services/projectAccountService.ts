import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import {
  ProjectAccount,
  ProjectAccountCreateData,
  ProjectAccountUpdateData,
} from '@/types/event';

// 项目户口服务类
export class ProjectAccountService {
  private static readonly COLLECTION_NAME = 'projectAccounts';

  // 创建项目户口
  static async createProjectAccount(
    accountData: ProjectAccountCreateData,
    userId: string
  ): Promise<string> {
    try {
      const accountRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        ...accountData,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId,
      });

      return accountRef.id;
    } catch (error) {
      console.error('创建项目户口失败:', error);
      throw new Error('创建项目户口失败');
    }
  }

  // 更新项目户口
  static async updateProjectAccount(
    accountId: string,
    accountData: ProjectAccountUpdateData,
    userId: string
  ): Promise<void> {
    try {
      const accountRef = doc(db, this.COLLECTION_NAME, accountId);
      await updateDoc(accountRef, {
        ...accountData,
        updatedAt: serverTimestamp(),
        updatedBy: userId,
      });
    } catch (error) {
      console.error('更新项目户口失败:', error);
      throw new Error('更新项目户口失败');
    }
  }

  // 删除项目户口
  static async deleteProjectAccount(accountId: string): Promise<void> {
    try {
      const accountRef = doc(db, this.COLLECTION_NAME, accountId);
      await deleteDoc(accountRef);
    } catch (error) {
      console.error('删除项目户口失败:', error);
      throw new Error('删除项目户口失败');
    }
  }

  // 获取项目户口详情
  static async getProjectAccount(accountId: string): Promise<ProjectAccount | null> {
    try {
      const accountRef = doc(db, this.COLLECTION_NAME, accountId);
      const accountSnapshot = await getDoc(accountRef);
      
      if (!accountSnapshot.exists()) {
        return null;
      }
      
      return { id: accountSnapshot.id, ...accountSnapshot.data() } as ProjectAccount;
    } catch (error) {
      console.error('获取项目户口详情失败:', error);
      throw new Error('获取项目户口详情失败');
    }
  }

  // 获取项目户口列表
  static async getProjectAccounts(): Promise<ProjectAccount[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const accounts: ProjectAccount[] = [];
      
      snapshot.forEach((doc) => {
        accounts.push({ id: doc.id, ...doc.data() } as ProjectAccount);
      });
      
      return accounts;
    } catch (error) {
      console.error('获取项目户口列表失败:', error);
      throw new Error('获取项目户口列表失败');
    }
  }

  // 获取活跃的项目户口
  static async getActiveProjectAccounts(): Promise<ProjectAccount[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('status', '==', 'active'),
        orderBy('name', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const accounts: ProjectAccount[] = [];
      
      snapshot.forEach((doc) => {
        accounts.push({ id: doc.id, ...doc.data() } as ProjectAccount);
      });
      
      return accounts;
    } catch (error) {
      console.error('获取活跃项目户口失败:', error);
      throw new Error('获取活跃项目户口失败');
    }
  }

  // 获取项目户口的活动统计
  static async getProjectAccountEventStatistics(accountId: string): Promise<{
    totalEvents: number;
    publishedEvents: number;
    totalRegistrations: number;
    totalRevenue: number;
    budgetUtilization: number;
  }> {
    try {
      // 获取该户口的活动
      const eventsQuery = query(
        collection(db, 'events'),
        where('projectAccountId', '==', accountId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      
      let totalEvents = 0;
      let publishedEvents = 0;
      let totalRegistrations = 0;
      let totalRevenue = 0;
      
      eventsSnapshot.forEach((doc) => {
        const event = doc.data();
        totalEvents++;
        if (event.status === 'Published') {
          publishedEvents++;
        }
        totalRegistrations += event.totalRegistrations || 0;
        if (!event.isFree) {
          totalRevenue += (event.totalRegistrations || 0) * (event.regularPrice || 0);
        }
      });
      
      // 获取项目户口预算
      const account = await this.getProjectAccount(accountId);
      const budgetUtilization = account ? (totalRevenue / account.budget) * 100 : 0;
      
      return {
        totalEvents,
        publishedEvents,
        totalRegistrations,
        totalRevenue,
        budgetUtilization: Math.min(budgetUtilization, 100),
      };
    } catch (error) {
      console.error('获取项目户口统计失败:', error);
      throw new Error('获取项目户口统计失败');
    }
  }

}

// 导出服务实例
export const projectAccountService = ProjectAccountService;
