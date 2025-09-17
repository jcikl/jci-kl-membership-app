import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Transaction } from '@/types/finance';
import { ProjectAccount, Event } from '@/types/event';

// 项目财务管理相关类型定义
export interface ProjectFinanceRecord {
  id: string;
  projectAccountId: string;
  projectName: string;
  totalBudget: number;
  totalIncome: number;
  totalExpense: number;
  netIncome: number;
  transactionCount: number;
  lastSyncDate?: string;
  verificationStatus: 'pending' | 'verified' | 'discrepancy' | 'approved';
  verificationNotes?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityTransactionSync {
  id: string;
  projectAccountId: string;
  syncDate: string;
  syncedTransactions: string[]; // 交易记录ID数组
  syncStatus: 'success' | 'partial' | 'failed';
  syncNotes?: string;
  syncedBy: string;
  createdAt: string;
}

export interface VerificationRequest {
  id: string;
  projectAccountId: string;
  projectName: string;
  requestType: 'activity_to_finance' | 'finance_review';
  requestData: {
    totalIncome: number;
    totalExpense: number;
    netIncome: number;
    transactionCount: number;
    lastSyncDate?: string;
    discrepancies?: string[];
  };
  requestStatus: 'pending' | 'approved' | 'rejected' | 'under_review';
  requestNotes?: string;
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// 项目财务管理服务类
export class ProjectFinanceService {
  private static readonly PROJECT_FINANCE_RECORDS_COLLECTION = 'projectFinanceRecords';
  private static readonly ACTIVITY_TRANSACTION_SYNC_COLLECTION = 'activityTransactionSync';
  private static readonly VERIFICATION_REQUESTS_COLLECTION = 'verificationRequests';

  /**
   * 创建项目财务记录
   */
  static async createProjectFinanceRecord(
    projectAccount: ProjectAccount,
    userId: string
  ): Promise<string> {
    try {
      const recordData: Omit<ProjectFinanceRecord, 'id'> = {
        projectAccountId: projectAccount.id,
        projectName: projectAccount.name,
        totalBudget: projectAccount.budget,
        totalIncome: 0,
        totalExpense: 0,
        netIncome: 0,
        transactionCount: 0,
        verificationStatus: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const recordRef = await addDoc(
        collection(db, this.PROJECT_FINANCE_RECORDS_COLLECTION),
        {
          ...recordData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: userId,
          updatedBy: userId,
        }
      );

      return recordRef.id;
    } catch (error) {
      console.error('创建项目财务记录失败:', error);
      throw new Error('创建项目财务记录失败');
    }
  }

  /**
   * 获取项目财务记录
   */
  static async getProjectFinanceRecord(projectAccountId: string): Promise<ProjectFinanceRecord | null> {
    try {
      const q = query(
        collection(db, this.PROJECT_FINANCE_RECORDS_COLLECTION),
        where('projectAccountId', '==', projectAccountId)
      );
      
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      } as ProjectFinanceRecord;
    } catch (error) {
      console.error('获取项目财务记录失败:', error);
      throw new Error('获取项目财务记录失败');
    }
  }

  /**
   * 同步活动交易记录到项目财务
   */
  static async syncActivityTransactions(
    projectAccountId: string,
    userId: string,
    syncNotes?: string
  ): Promise<ActivityTransactionSync> {
    try {
      // 1. 获取项目相关活动
      const eventsQuery = query(
        collection(db, 'events'),
        where('projectAccountId', '==', projectAccountId)
      );
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];

      if (events.length === 0) {
        throw new Error('未找到项目相关活动');
      }

      // 2. 获取活动相关交易记录
      const allTransactions: Transaction[] = [];
      const syncedTransactionIds: string[] = [];

      for (const _event of events) {
        // 根据活动信息查找相关交易记录
        const transactionsQuery = query(
          collection(db, 'transactions'),
          where('projectAccount', '==', projectAccountId)
        );
        const transactionsSnapshot = await getDocs(transactionsQuery);
        const eventTransactions = transactionsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate().toISOString() : new Date().toISOString(),
        })) as Transaction[];

        allTransactions.push(...eventTransactions);
        syncedTransactionIds.push(...eventTransactions.map(t => t.id));
      }

      // 3. 创建同步记录
      const syncData: Omit<ActivityTransactionSync, 'id'> = {
        projectAccountId,
        syncDate: new Date().toISOString(),
        syncedTransactions: syncedTransactionIds,
        syncStatus: syncedTransactionIds.length > 0 ? 'success' : 'failed',
        syncNotes,
        syncedBy: userId,
        createdAt: new Date().toISOString(),
      };

      const syncRef = await addDoc(
        collection(db, this.ACTIVITY_TRANSACTION_SYNC_COLLECTION),
        {
          ...syncData,
          syncDate: serverTimestamp(),
          createdAt: serverTimestamp(),
        }
      );

      // 4. 更新项目财务记录
      await this.updateProjectFinanceRecord(projectAccountId, allTransactions);

      return {
        id: syncRef.id,
        ...syncData,
      };
    } catch (error) {
      console.error('同步活动交易记录失败:', error);
      throw new Error('同步活动交易记录失败');
    }
  }

  /**
   * 更新项目财务记录
   */
  static async updateProjectFinanceRecord(
    projectAccountId: string,
    transactions: Transaction[]
  ): Promise<void> {
    try {
      // 计算财务汇总
      const totalIncome = transactions.reduce((sum, t) => sum + (t.income || 0), 0);
      const totalExpense = transactions.reduce((sum, t) => sum + (t.expense || 0), 0);
      const netIncome = totalIncome - totalExpense;
      const lastSyncDate = transactions.length > 0 ? 
        transactions.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())[0].transactionDate : undefined;

      // 获取现有记录
      const existingRecord = await this.getProjectFinanceRecord(projectAccountId);
      if (!existingRecord) {
        throw new Error('项目财务记录不存在');
      }

      // 更新记录
      const updateData = {
        totalIncome,
        totalExpense,
        netIncome,
        transactionCount: transactions.length,
        lastSyncDate,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(
        doc(db, this.PROJECT_FINANCE_RECORDS_COLLECTION, existingRecord.id),
        updateData
      );
    } catch (error) {
      console.error('更新项目财务记录失败:', error);
      throw new Error('更新项目财务记录失败');
    }
  }

  /**
   * 创建验证请求
   */
  static async createVerificationRequest(
    projectAccountId: string,
    requestType: 'activity_to_finance' | 'finance_review',
    requestData: any,
    userId: string,
    requestNotes?: string
  ): Promise<string> {
    try {
      const request: Omit<VerificationRequest, 'id'> = {
        projectAccountId,
        projectName: requestData.projectName || '',
        requestType,
        requestData,
        requestStatus: 'pending',
        requestNotes,
        requestedBy: userId,
        requestedAt: new Date().toISOString(),
      };

      const requestRef = await addDoc(
        collection(db, this.VERIFICATION_REQUESTS_COLLECTION),
        {
          ...request,
          requestedAt: serverTimestamp(),
        }
      );

      return requestRef.id;
    } catch (error) {
      console.error('创建验证请求失败:', error);
      throw new Error('创建验证请求失败');
    }
  }

  /**
   * 获取验证请求列表
   */
  static async getVerificationRequests(
    status?: string
  ): Promise<VerificationRequest[]> {
    try {
      let q = query(
        collection(db, this.VERIFICATION_REQUESTS_COLLECTION),
        orderBy('requestedAt', 'desc')
      );

      if (status) {
        q = query(q, where('requestStatus', '==', status));
      }

      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          requestedAt: data.requestedAt?.toDate ? data.requestedAt.toDate().toISOString() : new Date().toISOString(),
          reviewedAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate().toISOString() : undefined,
        };
      }) as VerificationRequest[];

      return requests;
    } catch (error) {
      console.error('获取验证请求列表失败:', error);
      throw new Error('获取验证请求列表失败');
    }
  }

  /**
   * 处理验证请求
   */
  static async processVerificationRequest(
    requestId: string,
    action: 'approve' | 'reject' | 'under_review',
    reviewerId: string,
    reviewNotes?: string
  ): Promise<void> {
    try {
      const updateData = {
        requestStatus: action,
        reviewedBy: reviewerId,
        reviewedAt: serverTimestamp(),
        reviewNotes,
      };

      await updateDoc(
        doc(db, this.VERIFICATION_REQUESTS_COLLECTION, requestId),
        updateData
      );

      // 如果是批准，更新项目财务记录状态
      if (action === 'approve') {
        const requestDoc = await getDoc(doc(db, this.VERIFICATION_REQUESTS_COLLECTION, requestId));
        const requestData = requestDoc.data();
        
        if (requestData) {
          await this.updateProjectFinanceVerificationStatus(
            requestData.projectAccountId,
            'verified'
          );
        }
      }
    } catch (error) {
      console.error('处理验证请求失败:', error);
      throw new Error('处理验证请求失败');
    }
  }

  /**
   * 更新项目财务验证状态
   */
  static async updateProjectFinanceVerificationStatus(
    projectAccountId: string,
    status: 'pending' | 'verified' | 'discrepancy' | 'approved',
    notes?: string,
    verifiedBy?: string
  ): Promise<void> {
    try {
      const existingRecord = await this.getProjectFinanceRecord(projectAccountId);
      if (!existingRecord) {
        throw new Error('项目财务记录不存在');
      }

      const updateData = {
        verificationStatus: status,
        updatedAt: serverTimestamp(),
        ...(notes && { verificationNotes: notes }),
        ...(verifiedBy && { verifiedBy }),
        ...(status === 'verified' && { verifiedAt: serverTimestamp() }),
      };

      await updateDoc(
        doc(db, this.PROJECT_FINANCE_RECORDS_COLLECTION, existingRecord.id),
        updateData
      );
    } catch (error) {
      console.error('更新项目财务验证状态失败:', error);
      throw new Error('更新项目财务验证状态失败');
    }
  }

  /**
   * 获取项目财务汇总数据
   */
  static async getProjectFinanceSummary(): Promise<ProjectFinanceRecord[]> {
    try {
      let q = query(
        collection(db, this.PROJECT_FINANCE_RECORDS_COLLECTION),
        orderBy('updatedAt', 'desc')
      );


      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
          verifiedAt: data.verifiedAt?.toDate ? data.verifiedAt.toDate().toISOString() : undefined,
        };
      }) as ProjectFinanceRecord[];

      return records;
    } catch (error) {
      console.error('获取项目财务汇总失败:', error);
      throw new Error('获取项目财务汇总失败');
    }
  }

  /**
   * 批量处理项目财务记录
   */
  static async batchUpdateProjectFinanceRecords(
    updates: Array<{
      projectAccountId: string;
      verificationStatus: 'pending' | 'verified' | 'discrepancy' | 'approved';
      notes?: string;
      verifiedBy?: string;
    }>
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      for (const update of updates) {
        const existingRecord = await this.getProjectFinanceRecord(update.projectAccountId);
        if (existingRecord) {
          const updateData = {
            verificationStatus: update.verificationStatus,
            updatedAt: serverTimestamp(),
            ...(update.notes && { verificationNotes: update.notes }),
            ...(update.verifiedBy && { verifiedBy: update.verifiedBy }),
            ...(update.verificationStatus === 'verified' && { verifiedAt: serverTimestamp() }),
          };

          batch.update(
            doc(db, this.PROJECT_FINANCE_RECORDS_COLLECTION, existingRecord.id),
            updateData
          );
        }
      }

      await batch.commit();
    } catch (error) {
      console.error('批量更新项目财务记录失败:', error);
      throw new Error('批量更新项目财务记录失败');
    }
  }

  /**
   * 获取项目财务统计数据
   */
  static async getProjectFinanceStatistics(): Promise<{
    totalProjects: number;
    totalBudget: number;
    totalIncome: number;
    totalExpense: number;
    totalNetIncome: number;
    pendingVerifications: number;
    verifiedProjects: number;
    averageBudgetUtilization: number;
  }> {
    try {
      const records = await this.getProjectFinanceSummary();
      
      const stats = {
        totalProjects: records.length,
        totalBudget: records.reduce((sum, r) => sum + r.totalBudget, 0),
        totalIncome: records.reduce((sum, r) => sum + r.totalIncome, 0),
        totalExpense: records.reduce((sum, r) => sum + r.totalExpense, 0),
        totalNetIncome: records.reduce((sum, r) => sum + r.netIncome, 0),
        pendingVerifications: records.filter(r => r.verificationStatus === 'pending').length,
        verifiedProjects: records.filter(r => r.verificationStatus === 'verified').length,
        averageBudgetUtilization: 0,
      };

      // 计算平均预算使用率
      if (records.length > 0) {
        const totalUtilization = records.reduce((sum, r) => {
          const utilization = r.totalBudget > 0 ? (r.totalExpense / r.totalBudget) * 100 : 0;
          return sum + utilization;
        }, 0);
        stats.averageBudgetUtilization = totalUtilization / records.length;
      }

      return stats;
    } catch (error) {
      console.error('获取项目财务统计数据失败:', error);
      throw new Error('获取项目财务统计数据失败');
    }
  }
}

export const projectFinanceService = ProjectFinanceService;
