import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy, 
  Timestamp,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { 
  BankAccount, 
  Transaction, 
  TransactionPurpose, 
  TransactionSplit,
  ExpenseSplit,
  Budget,
  BudgetAllocation,
  BillPaymentRequest,
  FinancialReport,
  FinancialReportData
} from '@/types/finance';
import { permissionService } from './permissionService';
import { simpleFinancialReportGenerator } from './simpleFinancialReportGenerator';

// 辅助函数：安全地转换 Firebase Timestamp 为 ISO 字符串
const safeTimestampToISO = (timestamp: any): string => {
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return new Date().toISOString();
};

// 辅助函数：查询符合格式的交易记录序号
const getTransactionNumbersByFormat = async (bankAccountId: string, year: number, lastFourDigits: string): Promise<string[]> => {
  try {
    // 构建序号前缀：TXN-年份-4位户口号码-
    const prefix = `TXN-${year}-${lastFourDigits}-`;
    
    // 查询该银行户口的所有交易记录
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('bankAccountId', '==', bankAccountId)
    );
    
    const transactionsSnapshot = await getDocs(transactionsQuery);
    
    // 筛选出符合格式的交易记录序号
    const validTransactionNumbers: string[] = [];
    transactionsSnapshot.docs.forEach(doc => {
      const transactionNumber = doc.data().transactionNumber;
      if (transactionNumber && transactionNumber.startsWith(prefix)) {
        // 提取序号部分（最后4位）
        const sequencePart = transactionNumber.substring(prefix.length);
        if (sequencePart.length === 4 && /^\d{4}$/.test(sequencePart)) {
          validTransactionNumbers.push(transactionNumber);
        }
      }
    });
    
    return validTransactionNumbers;
  } catch (error) {
    console.error('查询交易记录序号失败:', error);
    return [];
  }
};

// 辅助函数：生成交易记录序号
const generateTransactionNumber = async (bankAccountId: string, transactionDate: string): Promise<string> => {
  try {
    // 从交易日期获取年份
    const year = new Date(transactionDate).getFullYear();
    
    // 获取银行户口信息
    const bankAccountDoc = await getDoc(doc(db, 'bank_accounts', bankAccountId));
    if (!bankAccountDoc.exists()) {
      throw new Error('银行户口不存在');
    }
    
    const bankAccount = bankAccountDoc.data() as BankAccount;
    const accountNumber = bankAccount.accountNumber || '0000';
    
    // 获取银行户口的最后4位数字
    const lastFourDigits = accountNumber.slice(-4).padStart(4, '0');
    
    // 查询符合格式的交易记录序号
    const validTransactionNumbers = await getTransactionNumbersByFormat(bankAccountId, year, lastFourDigits);
    
    // 找到最大的序号
    let maxSequence = 0;
    validTransactionNumbers.forEach(transactionNumber => {
      const sequencePart = transactionNumber.substring(transactionNumber.lastIndexOf('-') + 1);
      const sequenceNumber = parseInt(sequencePart, 10);
      if (!isNaN(sequenceNumber) && sequenceNumber > maxSequence) {
        maxSequence = sequenceNumber;
      }
    });
    
    // 生成下一个序号（从0001开始）
    const nextSequence = (maxSequence + 1).toString().padStart(4, '0');
    
    return `TXN-${year}-${lastFourDigits}-${nextSequence}`;
  } catch (error) {
    console.error('生成交易记录序号失败:', error);
    // 如果生成失败，返回一个基于时间戳的备用序号
    const year = new Date(transactionDate).getFullYear();
    const timestamp = Date.now().toString().slice(-4);
    return `TXN-${year}-0000-${timestamp}`;
  }
};

// 银行户口服务
export const bankAccountService = {
  // 创建银行户口
  async createAccount(account: Omit<BankAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'bank_accounts'), {
      ...account,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 更新银行户口
  async updateAccount(id: string, account: Partial<BankAccount>): Promise<void> {
    const docRef = doc(db, 'bank_accounts', id);
    await updateDoc(docRef, {
      ...account,
      updatedAt: Timestamp.now(),
    });
  },

  // 删除银行户口
  async deleteAccount(id: string): Promise<void> {
    await deleteDoc(doc(db, 'bank_accounts', id));
  },

  // 获取银行户口列表
  async getAccounts(): Promise<BankAccount[]> {
    const q = query(collection(db, 'bank_accounts'), orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    const accounts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      };
    }) as BankAccount[];
    
    return accounts;
  },

  // 获取单个银行户口
  async getAccount(id: string): Promise<BankAccount | null> {
    const docRef = doc(db, 'bank_accounts', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      } as BankAccount;
    }
    return null;
  },
};

// 交易记录服务
export const transactionService = {
  // 创建交易记录
  async createTransaction(transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // 生成交易记录序号
    const transactionNumber = await generateTransactionNumber(transaction.bankAccountId, transaction.transactionDate);
    
    // 清理 undefined 值，确保 Firebase 不会收到 undefined 字段
    const cleanedTransaction = Object.fromEntries(
      Object.entries(transaction).filter(([key, value]) => {
        if (value === undefined) {
          console.warn(`⚠️ 过滤掉 undefined 字段: ${key}`);
          return false;
        }
        return true;
      })
    );
    
    // 调试信息
    console.log('📝 创建交易记录:', {
      transactionNumber,
      originalFields: Object.keys(transaction),
      cleanedFields: Object.keys(cleanedTransaction),
      hasUndefinedFields: Object.values(transaction).some(value => value === undefined)
    });
    
    const docRef = await addDoc(collection(db, 'transactions'), {
        ...cleanedTransaction,
        transactionNumber,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    
    console.log('✅ 交易记录创建成功:', docRef.id, '序号:', transactionNumber);
    return docRef.id;
  },

  // 批量创建交易记录
  async createTransactions(transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    console.log(`📦 开始批量创建 ${transactions.length} 条交易记录`);

    for (const [index, transaction] of transactions.entries()) {
      try {
        console.log(`📝 创建第 ${index + 1} 条交易记录...`);
        await this.createTransaction(transaction);
        success++;
        console.log(`✅ 第 ${index + 1} 条交易记录创建成功`);
      } catch (error) {
        failed++;
        const errorMessage = `第 ${index + 1} 条交易记录创建失败: ${error instanceof Error ? error.message : error}`;
        errors.push(errorMessage);
        console.error(`❌ ${errorMessage}`);
      }
    }

    console.log(`🎯 批量创建完成: 成功 ${success}, 失败 ${failed}`);
    return { success, failed, errors };
  },

  // 更新交易记录
  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<void> {
    const docRef = doc(db, 'transactions', id);
    await updateDoc(docRef, {
      ...transaction,
      updatedAt: Timestamp.now(),
    });
  },

  // 删除交易记录
  async deleteTransaction(id: string): Promise<void> {
    try {
      // 先删除相关的拆分记录
      await transactionSplitService.deleteSplitsByTransaction(id);
      console.log(`✅ 已删除交易 ${id} 的拆分记录`);
      
      // 删除主交易记录
      await deleteDoc(doc(db, 'transactions', id));
      console.log(`✅ 已删除交易记录: ${id}`);
      
      // 记录审计日志
      try {
        await addDoc(collection(db, 'auditLogs'), {
          action: 'DELETE_TRANSACTION',
          targetType: 'transaction',
          targetId: id,
          performedBy: auth.currentUser?.uid || 'system',
          performedAt: serverTimestamp(),
          userEmail: auth.currentUser?.email || 'unknown',
          details: {
            transactionId: id,
            alsoDeletedSplits: true
          }
        });
        console.log('📝 审计日志已记录');
      } catch (auditError) {
        console.warn('⚠️ 审计日志记录失败:', auditError);
      }
      
    } catch (error) {
      console.error(`❌ 删除交易记录失败: ${id}`, error);
      throw error;
    }
  },

  // 批量删除交易记录
  async deleteTransactions(ids: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let totalSuccess = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    // 输入验证
    if (!ids || ids.length === 0) {
      throw new Error('没有选择要删除的交易记录');
    }

    console.log(`🗑️ 开始批量删除 ${ids.length} 条交易记录`);

    // 使用 Firestore 批量操作来提高性能
    const maxBatchSize = 500; // Firestore 批量操作限制
    
    try {
      // 将 IDs 分组为批次
      for (let i = 0; i < ids.length; i += maxBatchSize) {
        const batchIds = ids.slice(i, i + maxBatchSize);
        console.log(`📦 处理批次 ${Math.floor(i/maxBatchSize) + 1}: ${batchIds.length} 条记录`);
        
        const batch = writeBatch(db);
        let batchSuccess = 0;
        let batchFailed = 0;
        const batchErrors: string[] = [];
        
        // 先删除所有相关的拆分记录
        console.log(`🧹 清理拆分记录...`);
        for (const id of batchIds) {
          try {
            await transactionSplitService.deleteSplitsByTransaction(id);
            console.log(`✅ 已清理交易 ${id} 的拆分记录`);
          } catch (error) {
            console.warn(`⚠️ 清理交易 ${id} 拆分记录时出错:`, error);
            // 拆分记录清理失败不影响主记录删除
          }
        }
        
        // 添加到批量操作中
        for (const id of batchIds) {
          try {
            const transactionRef = doc(db, 'transactions', id);
            batch.delete(transactionRef);
          } catch (error) {
            batchFailed++;
            batchErrors.push(`准备删除交易记录 ID "${id}" 失败: ${error instanceof Error ? error.message : '未知错误'}`);
          }
        }

        // 执行批量删除
        try {
          if (batchIds.length > batchFailed) {
            await batch.commit();
            batchSuccess = batchIds.length - batchFailed;
            console.log(`✅ 批量删除成功: ${batchSuccess} 条交易记录`);
          }
        } catch (error) {
          console.error('❌ 批量提交失败，尝试单独删除:', error);
          // 如果批量提交失败，尝试单独删除
          for (const id of batchIds) {
            try {
              await transactionService.deleteTransaction(id);
              batchSuccess++;
              console.log(`✅ 单独删除成功: ${id}`);
            } catch (individualError) {
              batchFailed++;
              batchErrors.push(`删除交易记录 ID "${id}" 失败: ${individualError instanceof Error ? individualError.message : '未知错误'}`);
              console.error(`❌ 单独删除失败: ${id}`, individualError);
            }
          }
        }

        // 累计结果
        totalSuccess += batchSuccess;
        totalFailed += batchFailed;
        allErrors.push(...batchErrors);
      }

      console.log(`🎯 批量删除完成: 成功 ${totalSuccess}, 失败 ${totalFailed}`);
      
      // 记录审计日志
      try {
        await addDoc(collection(db, 'auditLogs'), {
          action: 'BATCH_DELETE_TRANSACTIONS',
          targetType: 'transactions',
          targetIds: ids,
          successCount: totalSuccess,
          failedCount: totalFailed,
          errors: allErrors,
          performedBy: auth.currentUser?.uid || 'system',
          performedAt: serverTimestamp(),
          userEmail: auth.currentUser?.email || 'unknown',
          details: {
            totalRequested: ids.length,
            batchSize: maxBatchSize,
            batchesProcessed: Math.ceil(ids.length / maxBatchSize)
          }
        });
        console.log('📝 审计日志已记录');
      } catch (auditError) {
        console.warn('⚠️ 审计日志记录失败:', auditError);
      }
      
      return { 
        success: totalSuccess, 
        failed: totalFailed, 
        errors: allErrors 
      };
    } catch (error) {
      console.error('批量删除交易记录失败:', error);
      throw new Error(`批量删除交易记录失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  },

  // 获取交易记录列表
  async getTransactions(bankAccountId?: string): Promise<Transaction[]> {
    let q = query(collection(db, 'transactions'), orderBy('transactionNumber', 'desc'));

    if (bankAccountId) {
      q = query(collection(db, 'transactions'), where('bankAccountId', '==', bankAccountId), orderBy('transactionNumber', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      };
    }) as Transaction[];
  },

  // 获取单个交易记录
  async getTransaction(id: string): Promise<Transaction | null> {
    const docRef = doc(db, 'transactions', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      } as Transaction;
    }
    return null;
  },

  // 查询符合格式的交易记录序号
  async getTransactionNumbersByFormat(bankAccountId: string, year: number, lastFourDigits: string): Promise<string[]> {
    return await getTransactionNumbersByFormat(bankAccountId, year, lastFourDigits);
  },

  // 查询指定银行户口和年份的所有交易记录序号
  async getTransactionNumbersByBankAccountAndYear(bankAccountId: string, year: number): Promise<string[]> {
    try {
      // 获取银行户口信息
      const bankAccountDoc = await getDoc(doc(db, 'bank_accounts', bankAccountId));
      if (!bankAccountDoc.exists()) {
        throw new Error('银行户口不存在');
      }
      
      const bankAccount = bankAccountDoc.data() as BankAccount;
      const accountNumber = bankAccount.accountNumber || '0000';
      
      // 获取银行户口的最后4位数字
      const lastFourDigits = accountNumber.slice(-4).padStart(4, '0');
      
      // 查询符合格式的交易记录序号
      return await getTransactionNumbersByFormat(bankAccountId, year, lastFourDigits);
    } catch (error) {
      console.error('查询交易记录序号失败:', error);
      return [];
    }
  },
};

// 交易用途服务
export const transactionPurposeService = {
  // 创建交易用途
  async createPurpose(purpose: Omit<TransactionPurpose, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'transaction_purposes'), {
      ...purpose,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 批量创建交易用途
  async createPurposes(purposes: Omit<TransactionPurpose, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const purpose of purposes) {
      try {
        await this.createPurpose(purpose);
        success++;
      } catch (error) {
        failed++;
        errors.push(`交易用途 "${purpose.name}" 创建失败: ${error}`);
      }
    }

    return { success, failed, errors };
  },

  // 更新交易用途
  async updatePurpose(id: string, purpose: Partial<TransactionPurpose>): Promise<void> {
    const docRef = doc(db, 'transaction_purposes', id);
    await updateDoc(docRef, {
      ...purpose,
      updatedAt: Timestamp.now(),
    });
  },

  // 删除交易用途
  async deletePurpose(id: string): Promise<void> {
    await deleteDoc(doc(db, 'transaction_purposes', id));
  },

  // 批量删除交易用途
  async deletePurposes(ids: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const id of ids) {
      try {
        await this.deletePurpose(id);
        success++;
      } catch (error) {
        failed++;
        errors.push(`删除交易用途 ID "${id}" 失败: ${error}`);
      }
    }

    return { success, failed, errors };
  },

  // 获取交易用途列表
  async getPurposes(): Promise<TransactionPurpose[]> {
    const querySnapshot = await getDocs(query(collection(db, 'transaction_purposes'), orderBy('level', 'asc'), orderBy('name', 'asc')));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      };
    }) as TransactionPurpose[];
  },

  // 按层级获取交易用途
  async getPurposesByLevel(level: number): Promise<TransactionPurpose[]> {
    const q = query(
      collection(db, 'transaction_purposes'), 
      where('level', '==', level),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      };
    }) as TransactionPurpose[];
  },

  // 按父级ID获取交易用途
  async getPurposesByParentId(parentId: string): Promise<TransactionPurpose[]> {
    const q = query(
      collection(db, 'transaction_purposes'), 
      where('parentId', '==', parentId),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      };
    }) as TransactionPurpose[];
  },

  // 获取单个交易用途
  async getPurpose(id: string): Promise<TransactionPurpose | null> {
    const docRef = doc(db, 'transaction_purposes', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      } as TransactionPurpose;
    }
    return null;
  },

  // 获取3层级树形结构
  async getThreeTierStructure(): Promise<{
    mainCategories: TransactionPurpose[];
    businessCategories: TransactionPurpose[];
    specificPurposes: TransactionPurpose[];
  }> {
    const purposes = await this.getPurposes();
    
    return {
      mainCategories: purposes.filter(p => p.level === 0),
      businessCategories: purposes.filter(p => p.level === 1),
      specificPurposes: purposes.filter(p => p.level === 2),
    };
  },

  // 构建树形结构数据
  async buildTreeStructure(): Promise<(TransactionPurpose & { children?: TransactionPurpose[] })[]> {
    const purposes = await this.getPurposes();
    const treeData: (TransactionPurpose & { children?: TransactionPurpose[] })[] = [];
    
    // 获取根目录
    const rootPurposes = purposes.filter(p => p.level === 0);
    
    // 构建树形结构
    rootPurposes.forEach(root => {
      const children = purposes.filter(p => p.parentId === root.id);
      
      treeData.push({
        ...root,
        children: children.map(child => ({
          ...child,
          children: purposes.filter(p => p.parentId === child.id)
        }))
      });
    });
    
    return treeData;
  },
};

// 费用拆分服务
export const expenseSplitService = {
  // 创建费用拆分
  async createSplit(split: Omit<ExpenseSplit, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'expense_splits'), {
      ...split,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 批量创建费用拆分
  async createSplits(splits: Omit<ExpenseSplit, 'id' | 'createdAt'>[]): Promise<void> {
    for (const split of splits) {
      await this.createSplit(split);
    }
  },

  // 获取交易的费用拆分
  async getSplitsByTransaction(transactionId: string): Promise<ExpenseSplit[]> {
    const q = query(collection(db, 'expense_splits'), where('transactionId', '==', transactionId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
      };
    }) as ExpenseSplit[];
  },
};

// 交易拆分服务
export const transactionSplitService = {
  // 创建交易拆分
  async createSplit(split: Omit<TransactionSplit, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'transaction_splits'), {
      ...split,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 批量创建交易拆分
  async createSplits(splits: Omit<TransactionSplit, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    for (const split of splits) {
      await this.createSplit(split);
    }
  },

  // 获取交易的所有拆分记录
  async getSplitsByTransaction(transactionId: string): Promise<TransactionSplit[]> {
    const q = query(
      collection(db, 'transaction_splits'), 
      where('transactionId', '==', transactionId),
      orderBy('splitIndex', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      };
    }) as TransactionSplit[];
  },

  // 获取所有拆分记录
  async getAllSplits(): Promise<TransactionSplit[]> {
    const q = query(collection(db, 'transaction_splits'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
      };
    }) as TransactionSplit[];
  },

  // 批量获取多个交易的拆分记录
  async getSplitsByTransactions(transactionIds: string[]): Promise<TransactionSplit[]> {
    if (transactionIds.length === 0) return [];
    
    // 使用 'in' 操作符批量查询（最多10个ID）
    const chunks = [];
    for (let i = 0; i < transactionIds.length; i += 10) {
      chunks.push(transactionIds.slice(i, i + 10));
    }
    
    const allSplits: TransactionSplit[] = [];
    
    for (const chunk of chunks) {
      const q = query(
        collection(db, 'transaction_splits'), 
        where('transactionId', 'in', chunk),
        orderBy('splitIndex', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const chunkSplits = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        };
      }) as TransactionSplit[];
      allSplits.push(...chunkSplits);
    }
    
    return allSplits;
  },

  // 更新拆分记录
  async updateSplit(id: string, split: Partial<TransactionSplit>): Promise<void> {
    const docRef = doc(db, 'transaction_splits', id);
    await updateDoc(docRef, {
      ...split,
      updatedAt: Timestamp.now(),
    });
  },

  // 删除拆分记录
  async deleteSplit(id: string): Promise<void> {
    const docRef = doc(db, 'transaction_splits', id);
    await deleteDoc(docRef);
  },

  // 删除交易的所有拆分记录
  async deleteSplitsByTransaction(transactionId: string): Promise<void> {
    const q = query(collection(db, 'transaction_splits'), where('transactionId', '==', transactionId));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },
};

// 预算服务
export const budgetService = {
  // 创建预算
  async createBudget(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    // 过滤掉undefined值，只保留有效字段
    const cleanBudget = Object.fromEntries(
      Object.entries(budget).filter(([_, value]) => value !== undefined)
    );
    
    const docRef = await addDoc(collection(db, 'budgets'), {
        ...cleanBudget,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 更新预算
  async updateBudget(id: string, budget: Partial<Budget>): Promise<void> {
    // 过滤掉undefined值，只保留有效字段
    const cleanBudget = Object.fromEntries(
      Object.entries(budget).filter(([_, value]) => value !== undefined)
    );
    
    const docRef = doc(db, 'budgets', id);
    await updateDoc(docRef, {
      ...cleanBudget,
      updatedAt: Timestamp.now(),
    });
  },

  // 删除预算
  async deleteBudget(id: string): Promise<void> {
    await deleteDoc(doc(db, 'budgets', id));
  },

  // 获取预算列表
  async getBudgets(): Promise<Budget[]> {
    const querySnapshot = await getDocs(query(collection(db, 'budgets'), orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      };
    }) as Budget[];
  },
};

// 预算分配服务
export const budgetAllocationService = {
  // 创建预算分配
  async createAllocation(allocation: Omit<BudgetAllocation, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'budget_allocations'), {
      ...allocation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 更新预算分配
  async updateAllocation(id: string, allocation: Partial<BudgetAllocation>): Promise<void> {
    const docRef = doc(db, 'budget_allocations', id);
    await updateDoc(docRef, {
      ...allocation,
        updatedAt: Timestamp.now(),
      });
  },

  // 删除预算分配
  async deleteAllocation(id: string): Promise<void> {
    await deleteDoc(doc(db, 'budget_allocations', id));
  },

  // 获取预算分配列表
  async getAllocations(): Promise<BudgetAllocation[]> {
    const querySnapshot = await getDocs(query(collection(db, 'budget_allocations'), orderBy('createdAt', 'desc')));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      };
    }) as BudgetAllocation[];
  },
};

// 账单付款申请服务
export const billPaymentService = {
  // 创建账单付款申请
  async createRequest(request: Omit<BillPaymentRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'bill_payment_requests'), {
      ...request,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 更新账单付款申请
  async updateRequest(id: string, request: Partial<BillPaymentRequest>): Promise<void> {
    const docRef = doc(db, 'bill_payment_requests', id);
    await updateDoc(docRef, {
      ...request,
        updatedAt: Timestamp.now(),
      });
  },

  // 删除账单付款申请
  async deleteRequest(id: string): Promise<void> {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('用户未认证');
    }
    
    // 使用户口资料权限验证
    const hasPermission = await permissionService.checkPermission(
      currentUser.uid, 
      'finance.delete'
    );
    
    if (!hasPermission) {
      throw new Error('权限不足：无法删除账单付款申请');
    }
    
    await deleteDoc(doc(db, 'bill_payment_requests', id));
  },

  // 审批账单付款申请
  async approveRequest(id: string, notes?: string): Promise<void> {
    const docRef = doc(db, 'bill_payment_requests', id);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('用户未认证');
    }
    
    // 使用户口资料权限验证
    const hasPermission = await permissionService.checkPermission(
      currentUser.uid, 
      'finance.update'
    );
    
    if (!hasPermission) {
      throw new Error('权限不足：无法审批账单付款申请');
    }
    
    await updateDoc(docRef, {
      status: 'approved',
      approvalNotes: notes || null,
      approvedBy: currentUser.uid,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  // 拒绝账单付款申请
  async rejectRequest(id: string, notes?: string): Promise<void> {
    const docRef = doc(db, 'bill_payment_requests', id);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('用户未认证');
    }
    
    // 使用户口资料权限验证
    const hasPermission = await permissionService.checkPermission(
      currentUser.uid, 
      'finance.update'
    );
    
    if (!hasPermission) {
      throw new Error('权限不足：无法拒绝账单付款申请');
    }
    
    await updateDoc(docRef, {
      status: 'rejected',
      approvalNotes: notes || null,
      approvedBy: currentUser.uid,
      approvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  // 确认支付
  async payRequest(id: string): Promise<void> {
    const docRef = doc(db, 'bill_payment_requests', id);
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('用户未认证');
    }
    
    // 使用户口资料权限验证
    const hasPermission = await permissionService.checkPermission(
      currentUser.uid, 
      'finance.update'
    );
    
    if (!hasPermission) {
      throw new Error('权限不足：无法确认支付');
    }
    
    await updateDoc(docRef, {
      status: 'paid',
      paidAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  },

  // 获取账单付款申请列表
  async getRequests(): Promise<BillPaymentRequest[]> {
    const q = query(collection(db, 'bill_payment_requests'), orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
        submitDate: data.submitDate,
        approvedAt: safeTimestampToISO(data.approvedAt),
        paidAt: safeTimestampToISO(data.paidAt),
      };
    }) as BillPaymentRequest[];
  },
};

// 财务报告服务
export const financialReportService = {
  // 生成财务报告
  async generateReport(reportType: string, startDate: string, endDate: string, fiscalYear: number): Promise<FinancialReport> {
    
    let reportData: FinancialReportData = {
      totalIncome: 0,
      totalExpense: 0,
      netIncome: 0,
      bankBalances: [],
      transactions: [],
      budgetComparison: [],
    };

    // 根据报告类型生成相应的数据
    switch (reportType) {
      case 'statement_of_financial_position':
        reportData.statementOfFinancialPosition = await simpleFinancialReportGenerator.generateStatementOfFinancialPosition(fiscalYear);
        break;
      case 'income_statement':
        reportData.incomeStatement = await simpleFinancialReportGenerator.generateIncomeStatement(fiscalYear);
        break;
      case 'detailed_income_statement':
        reportData.detailedIncomeStatement = await simpleFinancialReportGenerator.generateDetailedIncomeStatement(fiscalYear);
        break;
      case 'notes_to_financial_statements':
        reportData.notesToFinancialStatements = await simpleFinancialReportGenerator.generateNotesToFinancialStatements(fiscalYear);
        break;
      default:
        // 生成基础财务数据
        const transactions = await transactionService.getTransactions();
        const bankAccounts = await bankAccountService.getAccounts();
        
        reportData.totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
        reportData.totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);
        reportData.netIncome = reportData.totalIncome - reportData.totalExpense;
        reportData.transactions = transactions;
        reportData.bankBalances = bankAccounts.map(account => ({
          accountId: account.id,
          accountName: account.accountName,
          balance: account.currentBalance || 0,
          lastUpdated: account.updatedAt
        }));
        break;
    }

    const reportName = this.getReportName(reportType, fiscalYear);
    const reportPeriod = this.getReportPeriod(reportType, startDate, endDate, fiscalYear);

    const report: FinancialReport = {
      id: `report-${Date.now()}`,
      reportType: reportType as any,
      reportName,
      reportPeriod,
      generatedBy: 'current-user-id', // TODO: 从认证状态获取
      generatedAt: new Date().toISOString(),
      data: reportData,
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 保存报告到数据库
    const docRef = await addDoc(collection(db, 'financial_reports'), {
      ...report,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return {
      ...report,
      id: docRef.id,
    };
  },

  // 获取报告名称
  getReportName(reportType: string, fiscalYear: number): string {
    const reportNames: Record<string, string> = {
      'statement_of_financial_position': `STATEMENT OF FINANCIAL POSITION AS AT 30 JUN ${fiscalYear}`,
      'income_statement': `INCOME STATEMENT FOR THE YEAR ENDED 30 JUN ${fiscalYear}`,
      'detailed_income_statement': `DETAILED INCOME STATEMENT FOR THE YEAR ENDED 30 JUN ${fiscalYear}`,
      'notes_to_financial_statements': `NOTES TO THE FINANCIAL STATEMENTS FOR THE YEAR ENDED 30 JUN ${fiscalYear}`,
      'cash_flow': `CASH FLOW STATEMENT FOR THE YEAR ENDED 30 JUN ${fiscalYear}`,
      'bank_reconciliation': `BANK RECONCILIATION STATEMENT AS AT 30 JUN ${fiscalYear}`,
      'monthly_summary': `MONTHLY FINANCIAL SUMMARY FOR ${fiscalYear}`,
      'project_summary': `PROJECT FINANCIAL SUMMARY FOR ${fiscalYear}`,
      'general_ledger': `GENERAL LEDGER FOR THE YEAR ENDED 30 JUN ${fiscalYear}`,
    };
    
    return reportNames[reportType] || `财务报告-${reportType}`;
  },

  // 获取报告期间
  getReportPeriod(reportType: string, startDate: string, endDate: string, fiscalYear: number): string {
    if (reportType.includes('statement_of_financial_position')) {
      return `AS AT 30 JUN ${fiscalYear}`;
    }
    if (reportType.includes('income_statement') || reportType.includes('notes')) {
      return `FOR THE YEAR ENDED 30 JUN ${fiscalYear}`;
    }
    return `${startDate} 至 ${endDate}`;
  },

  // 获取财务报告列表
  async getReports(): Promise<FinancialReport[]> {
    const querySnapshot = await getDocs(query(collection(db, 'financial_reports'), orderBy('generatedAt', 'desc')));
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        generatedAt: data.generatedAt,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      };
    }) as FinancialReport[];
  },

  // 导出报告
  async exportReport(_reportId: string, _format: 'pdf' | 'excel'): Promise<void> {
    // 这里应该实现具体的导出逻辑
  },

  // 删除报告
  async deleteReport(reportId: string): Promise<void> {
    const docRef = doc(db, 'financial_reports', reportId);
    await deleteDoc(docRef);
  },

  // 获取所有报告
  async getAllReports(): Promise<FinancialReport[]> {
    const q = query(
      collection(db, 'financial_reports'), 
      orderBy('generatedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        generatedAt: data.generatedAt,
        createdAt: safeTimestampToISO(data.createdAt),
        updatedAt: safeTimestampToISO(data.updatedAt),
      };
    }) as FinancialReport[];
  },
};
