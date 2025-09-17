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
import { db, auth } from '@/services/firebase';
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
import { permissionService } from '@/modules/permission/services/permissionService';
import { simpleFinancialReportGenerator } from './simpleFinancialReportGenerator';
import dayjs from 'dayjs';

// 辅助函数：安全地转换 Firebase Timestamp 为 ISO 字符串
const safeTimestampToISO = (timestamp: any): string => {
  if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  return new Date().toISOString();
};

// 银行户口信息缓存
class BankAccountCache {
  private cache = new Map<string, BankAccount>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  async getBankAccount(bankAccountId: string): Promise<BankAccount | null> {
    // 检查缓存
    if (this.cache.has(bankAccountId)) {
      const expiry = this.cacheExpiry.get(bankAccountId);
      if (expiry && Date.now() < expiry) {
        return this.cache.get(bankAccountId)!;
      } else {
        // 缓存过期，清除
        this.cache.delete(bankAccountId);
        this.cacheExpiry.delete(bankAccountId);
      }
    }

    // 从数据库获取
    try {
      const bankAccountDoc = await getDoc(doc(db, 'bank_accounts', bankAccountId));
      if (!bankAccountDoc.exists()) {
        return null;
      }

      const bankAccount = {
        id: bankAccountDoc.id,
        ...bankAccountDoc.data(),
        createdAt: safeTimestampToISO(bankAccountDoc.data().createdAt),
        updatedAt: safeTimestampToISO(bankAccountDoc.data().updatedAt),
      } as BankAccount;

      // 存入缓存
      this.cache.set(bankAccountId, bankAccount);
      this.cacheExpiry.set(bankAccountId, Date.now() + this.CACHE_DURATION);
      
      return bankAccount;
    } catch (error) {
      console.error(`获取银行户口失败: ${bankAccountId}`, error);
      return null;
    }
  }

  async getBankAccountsBatch(bankAccountIds: string[]): Promise<Map<string, BankAccount>> {
    const result = new Map<string, BankAccount>();
    const uncachedIds: string[] = [];

    // 检查缓存
    for (const id of bankAccountIds) {
      if (this.cache.has(id)) {
        const expiry = this.cacheExpiry.get(id);
        if (expiry && Date.now() < expiry) {
          result.set(id, this.cache.get(id)!);
        } else {
          this.cache.delete(id);
          this.cacheExpiry.delete(id);
          uncachedIds.push(id);
        }
      } else {
        uncachedIds.push(id);
      }
    }

    // 批量获取未缓存的银行户口
    if (uncachedIds.length > 0) {
      
      const promises = uncachedIds.map(async (id) => {
        try {
          const bankAccountDoc = await getDoc(doc(db, 'bank_accounts', id));
          if (bankAccountDoc.exists()) {
            const bankAccount = {
              id: bankAccountDoc.id,
              ...bankAccountDoc.data(),
              createdAt: safeTimestampToISO(bankAccountDoc.data().createdAt),
              updatedAt: safeTimestampToISO(bankAccountDoc.data().updatedAt),
            } as BankAccount;

            // 存入缓存
            this.cache.set(id, bankAccount);
            this.cacheExpiry.set(id, Date.now() + this.CACHE_DURATION);
            
            return { id, bankAccount };
          }
          return { id, bankAccount: null };
        } catch (error) {
          console.error(`获取银行户口失败: ${id}`, error);
          return { id, bankAccount: null };
        }
      });

      const results = await Promise.all(promises);
      results.forEach(({ id, bankAccount }) => {
        if (bankAccount) {
          result.set(id, bankAccount);
        }
      });
    }

    return result;
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// 创建全局缓存实例
const bankAccountCache = new BankAccountCache();

// 辅助函数：批量查询符合格式的交易记录序号
const getTransactionNumbersByFormatBatch = async (bankAccountIds: string[], year: number): Promise<Map<string, string[]>> => {
  try {
    const result = new Map<string, string[]>();
    
    // 为每个银行户口查询交易记录序号
    const queries = bankAccountIds.map(async (bankAccountId) => {
      try {
        // 获取银行户口信息
        const bankAccountDoc = await getDoc(doc(db, 'bank_accounts', bankAccountId));
        if (!bankAccountDoc.exists()) {
          return { bankAccountId, numbers: [] };
        }
        
        const bankAccount = bankAccountDoc.data() as BankAccount;
        const accountNumber = bankAccount.accountNumber || '0000';
        const lastFourDigits = accountNumber.slice(-4).padStart(4, '0');
        
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
        
        return { bankAccountId, numbers: validTransactionNumbers };
      } catch (error) {
        console.error(`查询银行户口 ${bankAccountId} 的交易记录序号失败:`, error);
        return { bankAccountId, numbers: [] };
      }
    });
    
    const results = await Promise.all(queries);
    results.forEach(({ bankAccountId, numbers }) => {
      result.set(bankAccountId, numbers);
    });
    
    return result;
  } catch (error) {
    console.error('批量查询交易记录序号失败:', error);
    return new Map();
  }
};

// 辅助函数：批量生成交易记录序号（使用缓存优化）
const generateTransactionNumbersBatch = async (transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<string[]> => {
  try {
    // 按银行户口和年份分组
    const groupedTransactions = new Map<string, { bankAccountId: string; year: number; count: number; lastFourDigits: string }>();
    
    // 收集所有需要的银行户口ID
    const bankAccountIds = Array.from(new Set(transactions.map(t => t.bankAccountId)));
    
    // 批量获取银行户口信息（使用缓存）
    const bankAccountMap = await bankAccountCache.getBankAccountsBatch(bankAccountIds);
    
    for (const transaction of transactions) {
      const year = new Date(transaction.transactionDate).getFullYear();
      const key = `${transaction.bankAccountId}-${year}`;
      
      if (!groupedTransactions.has(key)) {
        const bankAccount = bankAccountMap.get(transaction.bankAccountId);
        if (!bankAccount) {
          throw new Error(`银行户口 ${transaction.bankAccountId} 不存在`);
        }
        
        const accountNumber = bankAccount.accountNumber || '0000';
        const lastFourDigits = accountNumber.slice(-4).padStart(4, '0');
        
        groupedTransactions.set(key, {
          bankAccountId: transaction.bankAccountId,
          year,
          count: 0,
          lastFourDigits
        });
      }
      
      groupedTransactions.get(key)!.count++;
    }
    
    // 批量查询现有序号
    const years = Array.from(new Set(Array.from(groupedTransactions.values()).map(g => g.year)));
    
    const existingNumbersMap = new Map<string, string[]>();
    for (const year of years) {
      const yearNumbers = await getTransactionNumbersByFormatBatch(bankAccountIds, year);
      for (const [bankAccountId, numbers] of yearNumbers) {
        const key = `${bankAccountId}-${year}`;
        existingNumbersMap.set(key, numbers);
      }
    }
    
    // 生成序号
    const transactionNumbers: string[] = [];
    const sequenceCounters = new Map<string, number>();
    
    for (const transaction of transactions) {
      const year = new Date(transaction.transactionDate).getFullYear();
      const key = `${transaction.bankAccountId}-${year}`;
      const group = groupedTransactions.get(key)!;
      
      // 初始化计数器
      if (!sequenceCounters.has(key)) {
        const existingNumbers = existingNumbersMap.get(key) || [];
        let maxSequence = 0;
        existingNumbers.forEach(transactionNumber => {
          const sequencePart = transactionNumber.substring(transactionNumber.lastIndexOf('-') + 1);
          const sequenceNumber = parseInt(sequencePart, 10);
          if (!isNaN(sequenceNumber) && sequenceNumber > maxSequence) {
            maxSequence = sequenceNumber;
          }
        });
        sequenceCounters.set(key, maxSequence);
      }
      
      // 生成下一个序号
      const currentCounter = sequenceCounters.get(key)! + 1;
      sequenceCounters.set(key, currentCounter);
      
      const nextSequence = currentCounter.toString().padStart(4, '0');
      const transactionNumber = `TXN-${year}-${group.lastFourDigits}-${nextSequence}`;
      
      transactionNumbers.push(transactionNumber);
    }
    
    return transactionNumbers;
  } catch (error) {
    console.error('批量生成交易记录序号失败:', error);
    // 如果生成失败，返回基于时间戳的备用序号
    return transactions.map((transaction, index) => {
      const year = new Date(transaction.transactionDate).getFullYear();
      const timestamp = (Date.now() + index).toString().slice(-4);
      return `TXN-${year}-0000-${timestamp}`;
    });
  }
};

// 辅助函数：生成单个交易记录序号（保持向后兼容）
const generateTransactionNumber = async (bankAccountId: string, transactionDate: string): Promise<string> => {
  const transactions = [{ bankAccountId, transactionDate } as Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>];
  const numbers = await generateTransactionNumbersBatch(transactions);
  return numbers[0];
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
    
    
    const docRef = await addDoc(collection(db, 'transactions'), {
        ...cleanedTransaction,
        transactionNumber,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    
    // 自动更新银行户口的当前余额
    try {
      await this.updateAccountBalanceAfterTransaction(cleanedTransaction.bankAccountId as string);
    } catch (error) {
      console.warn('更新银行户口余额失败:', error);
    }
    
    // 自动更新年末余额缓存
    try {
      if (typeof cleanedTransaction.transactionDate === 'string') {
        const transactionDate = dayjs(cleanedTransaction.transactionDate, 'DD-MMM-YYYY');
        if (transactionDate.isValid()) {
          const year = transactionDate.year();
          const account = await bankAccountService.getAccount(cleanedTransaction.bankAccountId as string);
          if (account) {
            // 计算该年份的年末余额
            const yearTransactions = await balanceCalculationService.getTransactionsByYearAndAccount(year, cleanedTransaction.bankAccountId as string);
            const yearStartBalance = balanceCalculationService.getYearStartBalance(account, year, yearTransactions);
            const yearEndBalance = yearTransactions.reduce((sum: number, t: Transaction) => sum + balanceCalculationService.calculateNetAmount(t), yearStartBalance);
            
            // 更新缓存
            await balanceCalculationService.updateYearEndBalanceCache(cleanedTransaction.bankAccountId as string, year, yearEndBalance);
          }
        }
      }
    } catch (error) {
      console.warn('更新年末余额缓存失败:', error);
    }
    
    return docRef.id;
  },

  // 自动更新银行户口的当前余额
  async updateAccountBalanceAfterTransaction(accountId: string): Promise<void> {
    try {
      const account = await bankAccountService.getAccount(accountId);
      if (!account) {
        console.warn(`银行户口不存在: ${accountId}`);
        return;
      }

      // 获取该户口的 all transactions
      const allTransactions = await this.getTransactions();
      const accountTransactions = allTransactions.filter(t => t.bankAccountId === accountId);
      
      if (accountTransactions.length === 0) {
        // 如果没有交易，使用初始金额
        await bankAccountService.updateAccount(accountId, {
          currentBalance: account.initialAmount || 0
        });
        return;
      }

      // 按时间排序交易
      const sortedTransactions = [...accountTransactions].sort((a, b) => {
        if (a.transactionNumber && b.transactionNumber) {
          return a.transactionNumber.localeCompare(b.transactionNumber);
        }
        
        const parseDate = (dateStr: string) => {
          let date = dayjs(dateStr, 'DD-MMM-YYYY');
          if (!date.isValid()) {
            date = dayjs(dateStr, 'YYYY-MM-DD');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr, 'DD/MM/YYYY');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr, 'MM/DD/YYYY');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr);
          }
          return date.isValid() ? date.toDate().getTime() : 0;
        };
        
        const dateA = typeof a.transactionDate === 'string' 
          ? parseDate(a.transactionDate)
          : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
        const dateB = typeof b.transactionDate === 'string' 
          ? parseDate(b.transactionDate)
          : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
        
        return dateA - dateB;
      });

      // 计算累计余额
      let runningBalance = account.initialAmount || 0;
      sortedTransactions.forEach(transaction => {
        const netAmount = balanceCalculationService.calculateNetAmount(transaction);
        runningBalance += netAmount;
      });

      // 更新银行户口的当前余额
      await bankAccountService.updateAccount(accountId, {
        currentBalance: runningBalance
      });

      console.log(`✅ 已更新银行户口 ${account.accountName} 的当前余额: ${runningBalance.toFixed(2)}`);
    } catch (error) {
      console.error('更新银行户口余额失败:', error);
      throw error;
    }
  },

  // 批量更新所有银行户口的当前余额
  async syncAllAccountBalances(): Promise<{ success: number; failed: number; errors: string[] }> {
    const errors: string[] = [];
    let success = 0;
    let failed = 0;

    try {
      const bankAccounts = await bankAccountService.getAccounts();
      const allTransactions = await this.getTransactions();

      console.log(`🔄 开始同步 ${bankAccounts.length} 个银行户口的余额...`);

      for (const account of bankAccounts) {
        try {
          const accountTransactions = allTransactions.filter(t => t.bankAccountId === account.id);
          
          if (accountTransactions.length === 0) {
            // 如果没有交易，使用初始金额
            await bankAccountService.updateAccount(account.id, {
              currentBalance: account.initialAmount || 0
            });
            success++;
            continue;
          }

          // 按时间排序交易
          const sortedTransactions = [...accountTransactions].sort((a, b) => {
            if (a.transactionNumber && b.transactionNumber) {
              return a.transactionNumber.localeCompare(b.transactionNumber);
            }
            
            const parseDate = (dateStr: string) => {
              let date = dayjs(dateStr, 'DD-MMM-YYYY');
              if (!date.isValid()) {
                date = dayjs(dateStr, 'YYYY-MM-DD');
              }
              if (!date.isValid()) {
                date = dayjs(dateStr, 'DD/MM/YYYY');
              }
              if (!date.isValid()) {
                date = dayjs(dateStr, 'MM/DD/YYYY');
              }
              if (!date.isValid()) {
                date = dayjs(dateStr);
              }
              return date.isValid() ? date.toDate().getTime() : 0;
            };
            
            const dateA = typeof a.transactionDate === 'string' 
              ? parseDate(a.transactionDate)
              : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
            const dateB = typeof b.transactionDate === 'string' 
              ? parseDate(b.transactionDate)
              : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
            
            return dateA - dateB;
          });

          // 计算累计余额
          let runningBalance = account.initialAmount || 0;
          sortedTransactions.forEach(transaction => {
            const netAmount = balanceCalculationService.calculateNetAmount(transaction);
            runningBalance += netAmount;
          });

          // 更新银行户口的当前余额
          await bankAccountService.updateAccount(account.id, {
            currentBalance: runningBalance
          });

          success++;
          console.log(`✅ 已同步银行户口 ${account.accountName} 的余额: ${runningBalance.toFixed(2)}`);
        } catch (error) {
          failed++;
          const errorMsg = `同步银行户口 ${account.accountName} 失败: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      console.log(`🎯 余额同步完成: 成功 ${success}, 失败 ${failed}`);
      return { success, failed, errors };
    } catch (error) {
      console.error('批量同步银行户口余额失败:', error);
      return { success, failed, errors: [...errors, `批量同步失败: ${error}`] };
    }
  },

  // 批量创建交易记录（优化版本）
  async createTransactions(
    transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[],
    options?: {
      onProgress?: (progress: { completed: number; total: number; percentage: number }) => void;
      maxRetries?: number;
    }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    if (transactions.length === 0) {
      return { success: 0, failed: 0, errors: [] };
    }

    const { onProgress, maxRetries = 3 } = options || {};

    try {
      // 根据数据量选择最优策略
      if (transactions.length <= 50) {
        // 小批量：使用串行处理
        return await this.createTransactionsSerial(transactions, { onProgress, maxRetries });
      } else if (transactions.length <= 500) {
        // 中等批量：使用批量写入
        return await this.createTransactionsBatch(transactions, { onProgress, maxRetries });
      } else {
        // 大批量：使用并行处理
        return await this.createTransactionsParallel(transactions, { onProgress, maxRetries });
      }
    } catch (error) {
      console.error('批量创建失败，回退到串行处理:', error);
      // 回退到原有的串行处理方式
      return await this.createTransactionsSerial(transactions, { onProgress, maxRetries });
    }
  },

  // 并行创建交易记录（大批量优化）
  async createTransactionsParallel(
    transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[],
    options?: {
      onProgress?: (progress: { completed: number; total: number; percentage: number }) => void;
      maxRetries?: number;
    }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    // 动态调整批次大小和并发数
    const chunkSize = Math.min(100, Math.max(20, Math.floor(transactions.length / 20)));
    const maxConcurrency = Math.min(8, Math.max(3, Math.floor(transactions.length / 200)));
    const { onProgress, maxRetries = 3 } = options || {};

    // 将交易记录分组
    const chunks: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[][] = [];
    for (let i = 0; i < transactions.length; i += chunkSize) {
      chunks.push(transactions.slice(i, i + chunkSize));
    }

    let totalSuccess = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];
    let completedCount = 0;

    // 优化的并发控制
    const processChunk = async (chunk: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[], chunkIndex: number) => {
      const startTime = Date.now();
      try {
        
        // 使用批量写入处理
        const result = await this.createTransactionsBatch(chunk, { maxRetries });
        
        
        
        // 原子性更新进度
        completedCount += result.success + result.failed;
        if (onProgress) {
          const percentage = Math.round((completedCount / transactions.length) * 100);
          onProgress({ completed: completedCount, total: transactions.length, percentage });
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ 批次 ${chunkIndex + 1} 处理失败 (耗时 ${duration}ms):`, error);
        
        // 原子性更新进度
        completedCount += chunk.length;
        if (onProgress) {
          const percentage = Math.round((completedCount / transactions.length) * 100);
          onProgress({ completed: completedCount, total: transactions.length, percentage });
        }
        
        return {
          success: 0,
          failed: chunk.length,
          errors: [`批次 ${chunkIndex + 1} 处理失败: ${error instanceof Error ? error.message : error}`]
        };
      }
    };

    // 使用 Promise.allSettled 进行更好的并发控制
    const processChunksConcurrently = async () => {
      const results: { success: number; failed: number; errors: string[] }[] = [];
      
      for (let i = 0; i < chunks.length; i += maxConcurrency) {
        const currentBatch = chunks.slice(i, i + maxConcurrency);
        const batchPromises = currentBatch.map((chunk, index) => 
          processChunk(chunk, i + index)
        );
        
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`❌ 批次 ${i + index + 1} 完全失败:`, result.reason);
            results.push({
              success: 0,
              failed: currentBatch[index].length,
              errors: [`批次 ${i + index + 1} 完全失败: ${result.reason}`]
            });
          }
        });
        
        // 添加短暂延迟避免过载
        if (i + maxConcurrency < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      return results;
    };

    try {
      const results = await processChunksConcurrently();

      // 汇总结果
      results.forEach(result => {
        totalSuccess += result.success;
        totalFailed += result.failed;
        allErrors.push(...result.errors);
      });

      return { success: totalSuccess, failed: totalFailed, errors: allErrors };
    } catch (error) {
      console.error('❌ 并行处理完全失败:', error);
      return {
        success: 0,
        failed: transactions.length,
        errors: [`并行处理完全失败: ${error instanceof Error ? error.message : error}`]
      };
    }
  },

  // 批量创建交易记录（Firebase批量写入）
  async createTransactionsBatch(
    transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[],
    options?: {
      onProgress?: (progress: { completed: number; total: number; percentage: number }) => void;
      maxRetries?: number;
    }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const maxBatchSize = 500; // Firebase批量操作限制
    const { onProgress, maxRetries = 3 } = options || {};
    let totalSuccess = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    // 预生成所有交易序号（优化：并行生成）
    const transactionNumbers = await generateTransactionNumbersBatch(transactions);

    // 将交易记录分组为批次
    const batches = [];
    for (let i = 0; i < transactions.length; i += maxBatchSize) {
      batches.push({
        transactions: transactions.slice(i, i + maxBatchSize),
        numbers: transactionNumbers.slice(i, i + maxBatchSize),
        index: Math.floor(i/maxBatchSize) + 1
      });
    }

    // 处理每个批次
    for (const batch of batches) {
      let retryCount = 0;
      let batchSuccess = false;

      while (retryCount <= maxRetries && !batchSuccess) {
        try {
          
          const writeBatchInstance = writeBatch(db);
          
          // 优化的数据准备：预清理所有数据
          const cleanedTransactions = batch.transactions.map((transaction, index) => {
            const transactionNumber = batch.numbers[index];
            
            // 使用更高效的方式清理 undefined 值
            const cleanedTransaction: any = {};
            for (const [key, value] of Object.entries(transaction)) {
              if (value !== undefined) {
                cleanedTransaction[key] = value;
              }
            }

            return {
              ...cleanedTransaction,
              transactionNumber,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
          });

          // 批量设置文档
          cleanedTransactions.forEach((data) => {
            const docRef = doc(collection(db, 'transactions'));
            writeBatchInstance.set(docRef, data);
          });

          // 执行批量写入
          await writeBatchInstance.commit();
          
          totalSuccess += batch.transactions.length;
          batchSuccess = true;
          
        } catch (error) {
          retryCount++;
          const errorMessage = `批次 ${batch.index} 创建失败 (尝试 ${retryCount}/${maxRetries + 1}): ${error instanceof Error ? error.message : error}`;
          console.error(`❌ ${errorMessage}`);
          
          if (retryCount > maxRetries) {
            totalFailed += batch.transactions.length;
            allErrors.push(errorMessage);
            console.error(`❌ 批次 ${batch.index} 重试次数用尽，标记为失败`);
          } else {
            // 等待一段时间后重试
            const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // 指数退避，最大5秒
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // 更新进度
      if (onProgress) {
        const completed = totalSuccess + totalFailed;
        const percentage = Math.round((completed / transactions.length) * 100);
        onProgress({ completed, total: transactions.length, percentage });
      }
    }

    return { success: totalSuccess, failed: totalFailed, errors: allErrors };
  },

  // 串行创建交易记录（备用方案）
  async createTransactionsSerial(
    transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[],
    options?: {
      onProgress?: (progress: { completed: number; total: number; percentage: number }) => void;
      maxRetries?: number;
    }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const { onProgress, maxRetries = 3 } = options || {};
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const [index, transaction] of transactions.entries()) {
      let retryCount = 0;
      let transactionSuccess = false;

      while (retryCount <= maxRetries && !transactionSuccess) {
        try {
          await this.createTransaction(transaction);
          success++;
          transactionSuccess = true;
        } catch (error) {
          retryCount++;
          const errorMessage = `第 ${index + 1} 条交易记录创建失败 (尝试 ${retryCount}/${maxRetries + 1}): ${error instanceof Error ? error.message : error}`;
          console.error(`❌ ${errorMessage}`);
          
          if (retryCount > maxRetries) {
            failed++;
            errors.push(errorMessage);
            console.error(`❌ 第 ${index + 1} 条交易记录重试次数用尽，标记为失败`);
          } else {
            // 等待一段时间后重试
            const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // 指数退避，最大5秒
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // 更新进度
      if (onProgress) {
        const completed = success + failed;
        const percentage = Math.round((completed / transactions.length) * 100);
        onProgress({ completed, total: transactions.length, percentage });
      }
    }

    return { success, failed, errors };
  },

  // 更新交易记录
  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<void> {
    try {
      // 获取原始交易记录信息（用于后续更新余额）
      const originalTransactionDoc = await getDoc(doc(db, 'transactions', id));
      const originalTransactionData = originalTransactionDoc.exists() ? originalTransactionDoc.data() : null;
      const originalBankAccountId = originalTransactionData?.bankAccountId;
      const newBankAccountId = transaction.bankAccountId || originalBankAccountId;

      const docRef = doc(db, 'transactions', id);
      await updateDoc(docRef, {
        ...transaction,
        updatedAt: Timestamp.now(),
      });

      // 自动更新银行户口的当前余额
      // 如果银行户口发生变化，需要更新两个户口的余额
      const accountsToUpdate = new Set<string>();
      if (originalBankAccountId) {
        accountsToUpdate.add(originalBankAccountId);
      }
      if (newBankAccountId && newBankAccountId !== originalBankAccountId) {
        accountsToUpdate.add(newBankAccountId);
      }

      for (const accountId of accountsToUpdate) {
        try {
          await this.updateAccountBalanceAfterTransaction(accountId);
        } catch (error) {
          console.warn(`更新交易后更新银行户口 ${accountId} 余额失败:`, error);
        }
      }
    } catch (error) {
      console.error('更新交易记录失败:', error);
      throw error;
    }
  },

  // 删除交易记录
  async deleteTransaction(id: string): Promise<void> {
    try {
      // 获取交易记录信息（用于后续更新余额）
      const transactionDoc = await getDoc(doc(db, 'transactions', id));
      const transactionData = transactionDoc.exists() ? transactionDoc.data() : null;
      const bankAccountId = transactionData?.bankAccountId;

      // 先删除相关的拆分记录
      await transactionSplitService.deleteSplitsByTransaction(id);
      
      // 删除主交易记录
      await deleteDoc(doc(db, 'transactions', id));
      
      // 自动更新银行户口的当前余额
      if (bankAccountId) {
        try {
          await this.updateAccountBalanceAfterTransaction(bankAccountId);
        } catch (error) {
          console.warn('删除交易后更新银行户口余额失败:', error);
        }
      }
      
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
      } catch (auditError) {
        console.warn('⚠️ 审计日志记录失败:', auditError);
      }
      
    } catch (error) {
      console.error(`❌ 删除交易记录失败: ${id}`, error);
      throw error;
    }
  },

  // 批量删除交易记录
  async deleteTransactions(
    ids: string[], 
    options?: {
      onProgress?: (progress: { completed: number; total: number; percentage: number; currentStep: string }) => void;
    }
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let totalSuccess = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];

    // 输入验证
    if (!ids || ids.length === 0) {
      throw new Error('没有选择要删除的交易记录');
    }

    // 使用 Firestore 批量操作来提高性能
    const maxBatchSize = 500; // Firestore 批量操作限制
    let processedCount = 0;
    
    try {
      // 将 IDs 分组为批次
      for (let i = 0; i < ids.length; i += maxBatchSize) {
        const batchIds = ids.slice(i, i + maxBatchSize);
        const batchNumber = Math.floor(i/maxBatchSize) + 1;
        const totalBatches = Math.ceil(ids.length / maxBatchSize);
        
        
        // 更新进度：开始处理批次
        if (options?.onProgress) {
          options.onProgress({
            completed: processedCount,
            total: ids.length,
            percentage: Math.round((processedCount / ids.length) * 100),
            currentStep: `处理批次 ${batchNumber}/${totalBatches}`
          });
        }
        
        const batch = writeBatch(db);
        let batchSuccess = 0;
        let batchFailed = 0;
        const batchErrors: string[] = [];
        
        // 批量删除所有相关的拆分记录（高性能版本）
        
        // 更新进度：清理拆分记录
        if (options?.onProgress) {
          options.onProgress({
            completed: processedCount,
            total: ids.length,
            percentage: Math.round((processedCount / ids.length) * 100),
            currentStep: `清理批次 ${batchNumber} 的拆分记录`
          });
        }
        
        const splitCleanupResult = await transactionSplitService.deleteSplitsByTransactions(batchIds);
        if (splitCleanupResult.failed > 0) {
          console.warn(`⚠️ 拆分记录清理部分失败: ${splitCleanupResult.failed} 个交易`);
          // 拆分记录清理失败不影响主记录删除，但记录错误
          batchErrors.push(...splitCleanupResult.errors);
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
            // 更新进度：执行批量删除
            if (options?.onProgress) {
              options.onProgress({
                completed: processedCount,
                total: ids.length,
                percentage: Math.round((processedCount / ids.length) * 100),
                currentStep: `删除批次 ${batchNumber} 的交易记录`
              });
            }
            
            await batch.commit();
            batchSuccess = batchIds.length - batchFailed;
          }
        } catch (error) {
          console.error('❌ 批量提交失败，尝试单独删除:', error);
          // 如果批量提交失败，尝试单独删除
          for (const id of batchIds) {
            try {
              await transactionService.deleteTransaction(id);
              batchSuccess++;
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
        
        // 更新已处理计数
        processedCount += batchIds.length;
        
        // 更新进度：批次完成
        if (options?.onProgress) {
          options.onProgress({
            completed: processedCount,
            total: ids.length,
            percentage: Math.round((processedCount / ids.length) * 100),
            currentStep: `批次 ${batchNumber} 完成`
          });
        }
      }

      
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
  async getTransactionNumbersByFormat(bankAccountId: string, year: number, _lastFourDigits: string): Promise<string[]> {
    const result = await getTransactionNumbersByFormatBatch([bankAccountId], year);
    return result.get(bankAccountId) || [];
  },

  // 查询指定银行户口和年份的所有交易记录序号
  async getTransactionNumbersByBankAccountAndYear(bankAccountId: string, year: number): Promise<string[]> {
    try {
      // 获取银行户口信息
      const bankAccountDoc = await getDoc(doc(db, 'bank_accounts', bankAccountId));
      if (!bankAccountDoc.exists()) {
        throw new Error('银行户口不存在');
      }
      
      // 查询符合格式的交易记录序号
      const result = await getTransactionNumbersByFormatBatch([bankAccountId], year);
      return result.get(bankAccountId) || [];
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

  // 批量删除多个交易的拆分记录（高性能版本）
  async deleteSplitsByTransactions(transactionIds: string[]): Promise<{ success: number; failed: number; errors: string[] }> {
    if (transactionIds.length === 0) return { success: 0, failed: 0, errors: [] };
    
    let totalSuccess = 0;
    let totalFailed = 0;
    const allErrors: string[] = [];
    
    
    try {
      // 使用 'in' 操作符批量查询拆分记录（最多10个ID）
      const chunks = [];
      for (let i = 0; i < transactionIds.length; i += 10) {
        chunks.push(transactionIds.slice(i, i + 10));
      }
      
      for (const chunk of chunks) {
        try {
          // 批量查询拆分记录
          const q = query(
            collection(db, 'transaction_splits'), 
            where('transactionId', 'in', chunk)
          );
          const querySnapshot = await getDocs(q);
          
          if (querySnapshot.docs.length === 0) {
            continue;
          }
          
          // 使用批量删除操作
          const batch = writeBatch(db);
          querySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          
          await batch.commit();
          totalSuccess += querySnapshot.docs.length;
          
        } catch (error) {
          console.error(`❌ 批量清理失败:`, error);
          totalFailed += chunk.length;
          allErrors.push(`清理交易 ${chunk.join(', ')} 的拆分记录失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
      
      return { success: totalSuccess, failed: totalFailed, errors: allErrors };
      
    } catch (error) {
      console.error('❌ 批量清理拆分记录失败:', error);
      return { success: 0, failed: transactionIds.length, errors: [`批量清理失败: ${error instanceof Error ? error.message : '未知错误'}`] };
    }
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

// 累计余额计算服务
export const balanceCalculationService = {
  // 计算单笔交易的净额
  calculateNetAmount(transaction: Transaction): number {
    return (transaction.income || 0) - (transaction.expense || 0);
  },

  // 优化的累计余额计算 - 使用缓存数据
  calculateOptimizedBalances(
    filteredTransactions: Transaction[], 
    allTransactions: Transaction[],
    bankAccounts: BankAccount[],
    yearFilter?: number
  ): { [transactionId: string]: number } {
    if (!yearFilter) {
      return this.calculateBalancesByAccount(filteredTransactions, bankAccounts);
    }

    const balances: { [transactionId: string]: number } = {};
    
    // 按银行户口分组
    const transactionsByAccount: { [accountId: string]: Transaction[] } = {};
    filteredTransactions.forEach(transaction => {
      if (!transactionsByAccount[transaction.bankAccountId]) {
        transactionsByAccount[transaction.bankAccountId] = [];
      }
      transactionsByAccount[transaction.bankAccountId].push(transaction);
    });

    Object.entries(transactionsByAccount).forEach(([accountId, accountTransactions]) => {
      const account = bankAccounts.find(acc => acc.id === accountId);
      if (!account) return;

      // 使用缓存的年初余额
      let yearStartBalance = this.getYearStartBalance(account, yearFilter, allTransactions);
      
      // 按交易记录序号排序（从早到晚）
      const sortedTransactions = [...accountTransactions].sort((a, b) => {
        if (a.transactionNumber && b.transactionNumber) {
          return a.transactionNumber.localeCompare(b.transactionNumber);
        }
        
        const parseDate = (dateStr: string) => {
          let date = dayjs(dateStr, 'DD-MMM-YYYY');
          if (!date.isValid()) {
            date = dayjs(dateStr, 'YYYY-MM-DD');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr, 'DD/MM/YYYY');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr, 'MM/DD/YYYY');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr);
          }
          return date.isValid() ? date.toDate().getTime() : 0;
        };
        
        const dateA = typeof a.transactionDate === 'string' 
          ? parseDate(a.transactionDate)
          : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
        const dateB = typeof b.transactionDate === 'string' 
          ? parseDate(b.transactionDate)
          : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
        
        return dateA - dateB;
      });

      // 基于年初余额计算该年份的累计余额
      let runningBalance = yearStartBalance;
      
      sortedTransactions.forEach(transaction => {
        runningBalance += this.calculateNetAmount(transaction);
        balances[transaction.id] = runningBalance;
      });
    });

    return balances;
  },

  // 获取年初余额 - 优先使用缓存
  getYearStartBalance(account: BankAccount, year: number, allTransactions: Transaction[]): number {
    // 如果有缓存的年末余额，直接使用
    if (account.yearEndBalances && account.yearEndBalances[year - 1]) {
      return account.yearEndBalances[year - 1];
    }

    // 如果没有缓存，计算年初余额
    const previousTransactions = allTransactions.filter(t => {
      if (t.bankAccountId !== account.id) return false;
      
      let transactionDate = dayjs(t.transactionDate, 'DD-MMM-YYYY');
      if (!transactionDate.isValid()) {
        transactionDate = dayjs(t.transactionDate, 'YYYY-MM-DD');
      }
      if (!transactionDate.isValid()) {
        transactionDate = dayjs(t.transactionDate, 'DD/MM/YYYY');
      }
      if (!transactionDate.isValid()) {
        transactionDate = dayjs(t.transactionDate, 'MM/DD/YYYY');
      }
      if (!transactionDate.isValid()) {
        transactionDate = dayjs(t.transactionDate);
      }
      
      if (!transactionDate.isValid()) {
        return false;
      }
      
      return transactionDate.year() < year;
    });

    let yearStartBalance = account.initialAmount || 0;
    
    if (previousTransactions.length > 0) {
      const sortedPreviousTransactions = [...previousTransactions].sort((a, b) => {
        if (a.transactionNumber && b.transactionNumber) {
          return a.transactionNumber.localeCompare(b.transactionNumber);
        }
        
        const parseDate = (dateStr: string) => {
          let date = dayjs(dateStr, 'DD-MMM-YYYY');
          if (!date.isValid()) {
            date = dayjs(dateStr, 'YYYY-MM-DD');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr, 'DD/MM/YYYY');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr, 'MM/DD/YYYY');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr);
          }
          return date.isValid() ? date.toDate().getTime() : 0;
        };
        
        const dateA = typeof a.transactionDate === 'string' 
          ? parseDate(a.transactionDate)
          : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
        const dateB = typeof b.transactionDate === 'string' 
          ? parseDate(b.transactionDate)
          : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
        
        return dateA - dateB;
      });
      
      sortedPreviousTransactions.forEach(transaction => {
        yearStartBalance += this.calculateNetAmount(transaction);
      });
    }

    return yearStartBalance;
  },

  // 更新银行户口的年末余额缓存
  async updateYearEndBalanceCache(
    accountId: string, 
    year: number, 
    yearEndBalance: number
  ): Promise<void> {
    try {
      const accountRef = doc(db, 'bank_accounts', accountId);
      const accountSnap = await getDoc(accountRef);
      
      if (accountSnap.exists()) {
        const accountData = accountSnap.data() as BankAccount;
        const yearEndBalances = accountData.yearEndBalances || {};
        yearEndBalances[year] = yearEndBalance;
        
        await updateDoc(accountRef, {
          yearEndBalances,
          lastCalculatedYear: year,
          updatedAt: Timestamp.now()
        });
      }
    } catch (error) {
      console.error('更新年末余额缓存失败:', error);
    }
  },

  // 批量更新年末余额缓存
  async batchUpdateYearEndBalanceCache(
    accountBalances: { [accountId: string]: { [year: number]: number } }
  ): Promise<void> {
    const batch = writeBatch(db);
    
    Object.entries(accountBalances).forEach(([accountId, yearBalances]) => {
      const accountRef = doc(db, 'bank_accounts', accountId);
      batch.update(accountRef, {
        yearEndBalances: yearBalances,
        lastCalculatedYear: Math.max(...Object.keys(yearBalances).map(Number)),
        updatedAt: Timestamp.now()
      });
    });
    
    await batch.commit();
  },

  // 获取特定年份和账户的交易记录
  async getTransactionsByYearAndAccount(year: number, accountId: string): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, 'transactions'),
        where('bankAccountId', '==', accountId),
        orderBy('transactionNumber')
      );
      
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: safeTimestampToISO(data.createdAt),
          updatedAt: safeTimestampToISO(data.updatedAt),
        };
      }) as Transaction[];

      // 过滤指定年份的交易
      return transactions.filter(transaction => {
        let transactionDate = dayjs(transaction.transactionDate, 'DD-MMM-YYYY');
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(transaction.transactionDate, 'YYYY-MM-DD');
        }
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(transaction.transactionDate, 'DD/MM/YYYY');
        }
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(transaction.transactionDate, 'MM/DD/YYYY');
        }
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(transaction.transactionDate);
        }
        
        return transactionDate.isValid() && transactionDate.year() === year;
      });
    } catch (error) {
      console.error('获取年份交易记录失败:', error);
      return [];
    }
  },

  // 数据迁移：初始化银行户口的年末余额缓存
  async initializeYearEndBalanceCache(): Promise<void> {
    try {
      // 获取所有银行户口
      const bankAccounts = await bankAccountService.getAccounts();
      
      // 获取所有交易记录
      const allTransactions = await transactionService.getTransactions();
      
      // 按年份分组交易
      const transactionsByYear: { [year: number]: Transaction[] } = {};
      allTransactions.forEach((transaction: Transaction) => {
        let transactionDate = dayjs(transaction.transactionDate, 'DD-MMM-YYYY');
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(transaction.transactionDate, 'YYYY-MM-DD');
        }
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(transaction.transactionDate, 'DD/MM/YYYY');
        }
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(transaction.transactionDate, 'MM/DD/YYYY');
        }
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(transaction.transactionDate);
        }
        
        if (transactionDate.isValid()) {
          const year = transactionDate.year();
          if (!transactionsByYear[year]) {
            transactionsByYear[year] = [];
          }
          transactionsByYear[year].push(transaction);
        }
      });

      // 计算每个户口的年末余额
      const accountBalances: { [accountId: string]: { [year: number]: number } } = {};
      
      bankAccounts.forEach(account => {
        accountBalances[account.id] = {};
        
        // 按年份计算累计余额
        const years = Object.keys(transactionsByYear).map(Number).sort();
        let runningBalance = account.initialAmount || 0;
        
        years.forEach(year => {
          const yearTransactions = transactionsByYear[year].filter(t => t.bankAccountId === account.id);
          
          // 按时间排序
          const sortedTransactions = yearTransactions.sort((a, b) => {
            if (a.transactionNumber && b.transactionNumber) {
              return a.transactionNumber.localeCompare(b.transactionNumber);
            }
            
            const parseDate = (dateStr: string) => {
              let date = dayjs(dateStr, 'DD-MMM-YYYY');
              if (!date.isValid()) {
                date = dayjs(dateStr, 'YYYY-MM-DD');
              }
              if (!date.isValid()) {
                date = dayjs(dateStr, 'DD/MM/YYYY');
              }
              if (!date.isValid()) {
                date = dayjs(dateStr, 'MM/DD/YYYY');
              }
              if (!date.isValid()) {
                date = dayjs(dateStr);
              }
              return date.isValid() ? date.toDate().getTime() : 0;
            };
            
            const dateA = typeof a.transactionDate === 'string' 
              ? parseDate(a.transactionDate)
              : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
            const dateB = typeof b.transactionDate === 'string' 
              ? parseDate(b.transactionDate)
              : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
            
            return dateA - dateB;
          });
          
          // 计算该年份的累计余额
          sortedTransactions.forEach(transaction => {
            runningBalance += this.calculateNetAmount(transaction);
          });
          
          // 保存年末余额
          accountBalances[account.id][year] = runningBalance;
        });
      });

      // 批量更新银行户口
      await this.batchUpdateYearEndBalanceCache(accountBalances);
      
    } catch (error) {
      console.error('初始化年末余额缓存失败:', error);
      throw error;
    }
  },

  // 验证年末余额缓存的准确性
  async validateYearEndBalanceCache(): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      const bankAccounts = await bankAccountService.getAccounts();
      const allTransactions = await transactionService.getTransactions();
      
      for (const account of bankAccounts) {
        if (!account.yearEndBalances) continue;
        
        const years = Object.keys(account.yearEndBalances).map(Number).sort();
        
        for (const year of years) {
          // 使用原始方法计算年末余额
          const originalBalance = this.calculateCrossYearBalances(
            allTransactions.filter((t: Transaction) => {
              if (t.bankAccountId !== account.id) return false;
              let transactionDate = dayjs(t.transactionDate, 'DD-MMM-YYYY');
              if (!transactionDate.isValid()) {
                transactionDate = dayjs(t.transactionDate, 'YYYY-MM-DD');
              }
              if (!transactionDate.isValid()) {
                transactionDate = dayjs(t.transactionDate, 'DD/MM/YYYY');
              }
              if (!transactionDate.isValid()) {
                transactionDate = dayjs(t.transactionDate, 'MM/DD/YYYY');
              }
              if (!transactionDate.isValid()) {
                transactionDate = dayjs(t.transactionDate);
              }
              return transactionDate.isValid() && transactionDate.year() === year;
            }),
            allTransactions,
            [account],
            year
          );
          
          // 获取最后一笔交易的余额
          const yearTransactions = allTransactions.filter((t: Transaction) => {
            if (t.bankAccountId !== account.id) return false;
            let transactionDate = dayjs(t.transactionDate, 'DD-MMM-YYYY');
            if (!transactionDate.isValid()) {
              transactionDate = dayjs(t.transactionDate, 'YYYY-MM-DD');
            }
            if (!transactionDate.isValid()) {
              transactionDate = dayjs(t.transactionDate, 'DD/MM/YYYY');
            }
            if (!transactionDate.isValid()) {
              transactionDate = dayjs(t.transactionDate, 'MM/DD/YYYY');
            }
            if (!transactionDate.isValid()) {
              transactionDate = dayjs(t.transactionDate);
            }
            return transactionDate.isValid() && transactionDate.year() === year;
          });
          
          if (yearTransactions.length > 0) {
            const lastTransaction = yearTransactions[yearTransactions.length - 1];
            const calculatedBalance = originalBalance[lastTransaction.id];
            const cachedBalance = account.yearEndBalances[year];
            
            if (Math.abs(calculatedBalance - cachedBalance) > 0.01) {
              errors.push(`${account.accountName} ${year}年余额不匹配: 计算值=${calculatedBalance}, 缓存值=${cachedBalance}`);
            }
          }
        }
      }
      
    } catch (error) {
      errors.push(`验证过程出错: ${error}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // 生成优化的跨年分余额报告
  generateOptimizedCrossYearBalanceReport(
    filteredTransactions: Transaction[], 
    allTransactions: Transaction[],
    bankAccounts: BankAccount[],
    yearFilter?: number
  ): {
    summary: {
      totalInitialBalance: number;
      totalNetAmount: number;
      totalRunningBalance: number;
      transactionCount: number;
      accountCount: number;
    };
    accountDetails: Array<{
      accountId: string;
      accountName: string;
      initialBalance: number;
      netAmount: number;
      runningBalance: number;
      transactionCount: number;
    }>;
    validation: { isValid: boolean; errors: string[] };
  } {
    const validation = this.validateCalculationConsistency(filteredTransactions, bankAccounts);
    
    // 计算汇总数据
    const totalInitialBalance = bankAccounts.reduce((sum, account) => sum + (account.initialAmount || 0), 0);
    const totalNetAmount = filteredTransactions.reduce((sum, transaction) => sum + this.calculateNetAmount(transaction), 0);
    
    // 使用优化的累计余额计算
    const optimizedBalances = this.calculateOptimizedBalances(filteredTransactions, allTransactions, bankAccounts, yearFilter);
    
    // 计算总累计余额（所有户口的最终余额之和）
    const totalRunningBalance = bankAccounts.reduce((sum, account) => {
      const accountTransactions = filteredTransactions.filter(t => t.bankAccountId === account.id);
      if (accountTransactions.length === 0) {
        // 如果没有该年份的交易，使用年初余额
        if (yearFilter) {
          const yearStartBalance = this.getYearStartBalance(account, yearFilter, allTransactions);
          return sum + yearStartBalance;
        }
        return sum + (account.initialAmount || 0);
      }
      
      // 获取该户口的最后一笔交易的累计余额
      const lastTransaction = accountTransactions[accountTransactions.length - 1];
      return sum + (optimizedBalances[lastTransaction.id] || 0);
    }, 0);
    
    // 按户口生成详细数据
    const accountDetails = bankAccounts.map(account => {
      const accountTransactions = filteredTransactions.filter(t => t.bankAccountId === account.id);
      const accountNetAmount = accountTransactions.reduce((sum, transaction) => sum + this.calculateNetAmount(transaction), 0);
      
      let accountRunningBalance = 0;
      if (accountTransactions.length === 0) {
        // 如果没有该年份的交易，使用年初余额
        if (yearFilter) {
          accountRunningBalance = this.getYearStartBalance(account, yearFilter, allTransactions);
        } else {
          accountRunningBalance = account.initialAmount || 0;
        }
      } else {
        // 获取该户口的最后一笔交易的累计余额
        const lastTransaction = accountTransactions[accountTransactions.length - 1];
        accountRunningBalance = optimizedBalances[lastTransaction.id] || 0;
      }
      
      return {
        accountId: account.id,
        accountName: account.accountName,
        initialBalance: account.initialAmount || 0,
        netAmount: accountNetAmount,
        runningBalance: accountRunningBalance,
        transactionCount: accountTransactions.length
      };
    });
    
    return {
      summary: {
        totalInitialBalance,
        totalNetAmount,
        totalRunningBalance,
        transactionCount: filteredTransactions.length,
        accountCount: bankAccounts.length
      },
      accountDetails,
      validation
    };
  },

  // 格式化净额显示
  formatNetAmount(transaction: Transaction): string {
    const netAmount = this.calculateNetAmount(transaction);
    return netAmount >= 0 ? `+$${netAmount.toFixed(2)}` : `-$${Math.abs(netAmount).toFixed(2)}`;
  },

  // 计算所有交易的累计余额
  calculateRunningBalance(transactions: Transaction[], initialBalance: number = 0): number {
    return transactions.reduce((balance, transaction) => {
      return balance + this.calculateNetAmount(transaction);
    }, initialBalance);
  },

  // 计算每笔交易后的累计余额
  calculateRunningBalances(
    transactions: Transaction[], 
    initialBalance: number = 0
  ): { transaction: Transaction; runningBalance: number }[] {
    let currentBalance = initialBalance;
    return transactions.map(transaction => {
      const netAmount = this.calculateNetAmount(transaction);
      currentBalance += netAmount;
      return { transaction, runningBalance: currentBalance };
    });
  },

  // 按银行户口分组计算累计余额
  calculateBalancesByAccount(
    transactions: Transaction[], 
    bankAccounts: BankAccount[]
  ): { [transactionId: string]: number } {
    // 按银行户口分组交易
    const transactionsByAccount: { [accountId: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      if (!transactionsByAccount[transaction.bankAccountId]) {
        transactionsByAccount[transaction.bankAccountId] = [];
      }
      transactionsByAccount[transaction.bankAccountId].push(transaction);
    });

    // 为每个银行户口计算余额
    const balances: { [transactionId: string]: number } = {};
    
    Object.entries(transactionsByAccount).forEach(([accountId, accountTransactions]) => {
      // 按交易记录序号排序（从最旧到最新）
      const sortedTransactions = [...accountTransactions].sort((a, b) => {
        // 优先按交易序号排序
        if (a.transactionNumber && b.transactionNumber) {
          return a.transactionNumber.localeCompare(b.transactionNumber);
        }
        
        // 如果没有交易序号，按日期排序作为备用
        const dateA = typeof a.transactionDate === 'string' 
          ? new Date(a.transactionDate).getTime() 
          : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
        const dateB = typeof b.transactionDate === 'string' 
          ? new Date(b.transactionDate).getTime() 
          : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
        
        return dateA - dateB; // 从最旧到最新排序
      });

      // 获取银行户口的开创金额
      const account = bankAccounts.find(acc => acc.id === accountId);
      let runningBalance = account?.initialAmount || 0;

      // 计算每笔交易后的余额
      sortedTransactions.forEach(transaction => {
        runningBalance += this.calculateNetAmount(transaction);
        balances[transaction.id] = runningBalance;
      });
    });

    return balances;
  },

  // 获取指定交易的累计余额
  getRunningBalance(
    transactionId: string, 
    transactions: Transaction[], 
    bankAccounts: BankAccount[]
  ): number {
    const balances = this.calculateBalancesByAccount(transactions, bankAccounts);
    return balances[transactionId] || 0;
  },

  // 按银行户口分别计算累计余额
  calculateBalancesByAccountSeparately(
    transactions: Transaction[], 
    bankAccounts: BankAccount[]
  ): {
    [accountId: string]: {
      accountName: string;
      initialBalance: number;
      finalBalance: number;
      totalIncome: number;
      totalExpense: number;
      netAmount: number;
      transactionCount: number;
      transactionBalances: Array<{
        transactionId: string;
        transactionNumber: string;
        description: string;
        income: number;
        expense: number;
        netAmount: number;
        runningBalance: number;
        transactionDate: string;
      }>;
    }
  } {
    // 按银行户口分组交易
    const transactionsByAccount: { [accountId: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      if (!transactionsByAccount[transaction.bankAccountId]) {
        transactionsByAccount[transaction.bankAccountId] = [];
      }
      transactionsByAccount[transaction.bankAccountId].push(transaction);
    });

    const result: any = {};

    Object.entries(transactionsByAccount).forEach(([accountId, accountTransactions]) => {
      const account = bankAccounts.find(acc => acc.id === accountId);
      if (!account) return;

      // 按交易记录序号排序（从最旧到最新）
      const sortedTransactions = [...accountTransactions].sort((a, b) => {
        // 优先按交易序号排序
        if (a.transactionNumber && b.transactionNumber) {
          return a.transactionNumber.localeCompare(b.transactionNumber);
        }
        
        // 如果没有交易序号，按日期排序作为备用
        const dateA = typeof a.transactionDate === 'string' 
          ? new Date(a.transactionDate).getTime() 
          : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
        const dateB = typeof b.transactionDate === 'string' 
          ? new Date(b.transactionDate).getTime() 
          : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
        
        return dateA - dateB; // 从最旧到最新排序
      });

      // 计算该户口的统计信息
      const initialBalance = account.initialAmount || 0;
      const totalIncome = sortedTransactions.reduce((sum, t) => sum + (t.income || 0), 0);
      const totalExpense = sortedTransactions.reduce((sum, t) => sum + (t.expense || 0), 0);
      const netAmount = totalIncome - totalExpense;
      const finalBalance = initialBalance + netAmount;

      // 计算每笔交易的累计余额
      const transactionBalances: Array<{
        transactionId: string;
        transactionNumber: string;
        description: string;
        income: number;
        expense: number;
        netAmount: number;
        runningBalance: number;
        transactionDate: string;
      }> = [];
      let runningBalance = initialBalance;
      
      sortedTransactions.forEach(transaction => {
        const netAmount = this.calculateNetAmount(transaction);
        runningBalance += netAmount;
        
        transactionBalances.push({
          transactionId: transaction.id,
          transactionNumber: transaction.transactionNumber || 'N/A',
          description: transaction.mainDescription || 'N/A',
          income: transaction.income || 0,
          expense: transaction.expense || 0,
          netAmount,
          runningBalance,
          transactionDate: transaction.transactionDate
        });
      });

      result[accountId] = {
        accountName: account.accountName,
        initialBalance,
        finalBalance,
        totalIncome,
        totalExpense,
        netAmount,
        transactionCount: sortedTransactions.length,
        transactionBalances
      };
    });

    return result;
  },

  // 获取指定银行户口的累计余额信息
  getAccountBalanceInfo(
    accountId: string,
    transactions: Transaction[],
    bankAccounts: BankAccount[]
  ): {
    accountName: string;
    initialBalance: number;
    finalBalance: number;
    totalIncome: number;
    totalExpense: number;
    netAmount: number;
    transactionCount: number;
    transactionBalances: Array<{
      transactionId: string;
      transactionNumber: string;
      description: string;
      income: number;
      expense: number;
      netAmount: number;
      runningBalance: number;
      transactionDate: string;
    }>;
  } | null {
    const allAccountBalances = this.calculateBalancesByAccountSeparately(transactions, bankAccounts);
    return allAccountBalances[accountId] || null;
  },

  // 验证计算一致性
  validateCalculationConsistency(
    transactions: Transaction[], 
    bankAccounts: BankAccount[]
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // 按银行户口分组验证
    const transactionsByAccount: { [accountId: string]: Transaction[] } = {};
    
    transactions.forEach(transaction => {
      if (!transactionsByAccount[transaction.bankAccountId]) {
        transactionsByAccount[transaction.bankAccountId] = [];
      }
      transactionsByAccount[transaction.bankAccountId].push(transaction);
    });

    // 为每个银行户口验证计算一致性
    Object.entries(transactionsByAccount).forEach(([accountId, accountTransactions]) => {
      const account = bankAccounts.find(acc => acc.id === accountId);
      if (!account) {
        errors.push(`找不到银行户口: ${accountId}`);
        return;
      }

      // 按交易记录序号排序
      const sortedTransactions = [...accountTransactions].sort((a, b) => {
        if (a.transactionNumber && b.transactionNumber) {
          return a.transactionNumber.localeCompare(b.transactionNumber);
        }
        
        const dateA = typeof a.transactionDate === 'string' 
          ? new Date(a.transactionDate).getTime() 
          : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
        const dateB = typeof b.transactionDate === 'string' 
          ? new Date(b.transactionDate).getTime() 
          : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
        
        return dateA - dateB;
      });

      // 计算该户口的净额
      const accountNetAmount = sortedTransactions.reduce((sum, transaction) => {
        return sum + this.calculateNetAmount(transaction);
      }, 0);

      // 计算该户口的最终余额
      const initialBalance = account.initialAmount || 0;
      const expectedFinalBalance = initialBalance + accountNetAmount;

      // 计算实际的最终余额（最后一个交易的累计余额）
      let actualFinalBalance = initialBalance;
      sortedTransactions.forEach(transaction => {
        actualFinalBalance += this.calculateNetAmount(transaction);
      });

      // 验证一致性
      const difference = Math.abs(actualFinalBalance - expectedFinalBalance);
      if (difference > 0.01) {
        errors.push(`户口 ${account.accountName} 计算不一致: 实际 ${actualFinalBalance.toFixed(2)}, 预期 ${expectedFinalBalance.toFixed(2)}, 差异 ${difference.toFixed(2)}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // 生成余额报告
  generateBalanceReport(
    transactions: Transaction[], 
    bankAccounts: BankAccount[]
  ): {
    summary: {
      totalInitialBalance: number;
      totalNetAmount: number;
      totalRunningBalance: number;
      transactionCount: number;
      accountCount: number;
    };
    accountDetails: Array<{
      accountId: string;
      accountName: string;
      initialBalance: number;
      netAmount: number;
      runningBalance: number;
      transactionCount: number;
    }>;
    validation: { isValid: boolean; errors: string[] };
  } {
    const validation = this.validateCalculationConsistency(transactions, bankAccounts);
    
    // 计算汇总数据
    const totalInitialBalance = bankAccounts.reduce((sum, account) => sum + (account.initialAmount || 0), 0);
    const totalNetAmount = transactions.reduce((sum, transaction) => sum + this.calculateNetAmount(transaction), 0);
    
    // 计算总累计余额（所有户口的最终余额之和）
    const totalRunningBalance = bankAccounts.reduce((sum, account) => {
      const accountTransactions = transactions.filter(t => t.bankAccountId === account.id);
      const accountNetAmount = accountTransactions.reduce((acc, transaction) => acc + this.calculateNetAmount(transaction), 0);
      return sum + (account.initialAmount || 0) + accountNetAmount;
    }, 0);
    
    // 按户口生成详细数据
    const accountDetails = bankAccounts.map(account => {
      const accountTransactions = transactions.filter(t => t.bankAccountId === account.id);
      const accountNetAmount = accountTransactions.reduce((sum, transaction) => sum + this.calculateNetAmount(transaction), 0);
      const accountRunningBalance = account.initialAmount + accountNetAmount;
      
      return {
        accountId: account.id,
        accountName: account.accountName,
        initialBalance: account.initialAmount || 0,
        netAmount: accountNetAmount,
        runningBalance: accountRunningBalance,
        transactionCount: accountTransactions.length
      };
    });
    
    return {
      summary: {
        totalInitialBalance,
        totalNetAmount,
        totalRunningBalance,
        transactionCount: transactions.length,
        accountCount: bankAccounts.length
      },
      accountDetails,
      validation
    };
  },

  // 跨年分累计余额计算 - 基于年初余额计算筛选后的累计余额
  calculateCrossYearBalances(
    filteredTransactions: Transaction[], 
    allTransactions: Transaction[],
    bankAccounts: BankAccount[],
    yearFilter?: number
  ): { [transactionId: string]: number } {
    if (!yearFilter) {
      // 没有年份筛选时，使用标准计算
      return this.calculateBalancesByAccount(filteredTransactions, bankAccounts);
    }


    // 按银行户口分组
    const transactionsByAccount: { [accountId: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(transaction => {
      if (!transactionsByAccount[transaction.bankAccountId]) {
        transactionsByAccount[transaction.bankAccountId] = [];
      }
      transactionsByAccount[transaction.bankAccountId].push(transaction);
    });

    const balances: { [transactionId: string]: number } = {};
    
    Object.entries(transactionsByAccount).forEach(([accountId, accountTransactions]) => {
      // 获取该年份之前的所有交易（用于计算年初余额）
      const previousTransactions = allTransactions.filter(t => {
        if (t.bankAccountId !== accountId) return false;
        
        
        // 尝试多种日期格式解析
        let transactionDate = dayjs(t.transactionDate, 'DD-MMM-YYYY');
        
        // 如果第一种格式失败，尝试其他常见格式
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(t.transactionDate, 'YYYY-MM-DD');
        }
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(t.transactionDate, 'DD/MM/YYYY');
        }
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(t.transactionDate, 'MM/DD/YYYY');
        }
        if (!transactionDate.isValid()) {
          transactionDate = dayjs(t.transactionDate); // 尝试自动解析
        }
        
        
        if (!transactionDate.isValid()) {
          return false;
        }
        
        return transactionDate.year() < yearFilter;
      });

      // 计算年初余额
      let yearStartBalance = 0;
      if (previousTransactions.length > 0) {
        // 获取账户开创金额
        const account = bankAccounts.find(acc => acc.id === accountId);
        let runningBalance = account?.initialAmount || 0;
        
        // 按时间顺序计算历史交易的累计余额
        const sortedPreviousTransactions = [...previousTransactions].sort((a, b) => {
          if (a.transactionNumber && b.transactionNumber) {
            return a.transactionNumber.localeCompare(b.transactionNumber);
          }
          
          // 使用与过滤逻辑相同的日期解析方法
          const parseDate = (dateStr: string) => {
            let date = dayjs(dateStr, 'DD-MMM-YYYY');
            if (!date.isValid()) {
              date = dayjs(dateStr, 'YYYY-MM-DD');
            }
            if (!date.isValid()) {
              date = dayjs(dateStr, 'DD/MM/YYYY');
            }
            if (!date.isValid()) {
              date = dayjs(dateStr, 'MM/DD/YYYY');
            }
            if (!date.isValid()) {
              date = dayjs(dateStr);
            }
            return date.isValid() ? date.toDate().getTime() : 0;
          };
          
          const dateA = typeof a.transactionDate === 'string' 
            ? parseDate(a.transactionDate)
            : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
          const dateB = typeof b.transactionDate === 'string' 
            ? parseDate(b.transactionDate)
            : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
          
          return dateA - dateB;
        });
        
        // 计算到上一年年末的累计余额
        sortedPreviousTransactions.forEach(transaction => {
          runningBalance += this.calculateNetAmount(transaction);
        });
        
        yearStartBalance = runningBalance;
      } else {
        // 没有历史交易时，使用账户开创金额
        const account = bankAccounts.find(acc => acc.id === accountId);
        yearStartBalance = account?.initialAmount || 0;
      }

      // 按交易记录序号排序（从早到晚）
      const sortedTransactions = [...accountTransactions].sort((a, b) => {
        if (a.transactionNumber && b.transactionNumber) {
          return a.transactionNumber.localeCompare(b.transactionNumber);
        }
        
        // 使用与过滤逻辑相同的日期解析方法
        const parseDate = (dateStr: string) => {
          let date = dayjs(dateStr, 'DD-MMM-YYYY');
          if (!date.isValid()) {
            date = dayjs(dateStr, 'YYYY-MM-DD');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr, 'DD/MM/YYYY');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr, 'MM/DD/YYYY');
          }
          if (!date.isValid()) {
            date = dayjs(dateStr);
          }
          return date.isValid() ? date.toDate().getTime() : 0;
        };
        
        const dateA = typeof a.transactionDate === 'string' 
          ? parseDate(a.transactionDate)
          : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
        const dateB = typeof b.transactionDate === 'string' 
          ? parseDate(b.transactionDate)
          : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
        
        return dateA - dateB; // 从早到晚排序
      });

      // 基于年初余额计算该年份的累计余额
      let runningBalance = yearStartBalance;
      
      
      sortedTransactions.forEach(transaction => {
        runningBalance += this.calculateNetAmount(transaction);
        balances[transaction.id] = runningBalance;
        
      });
      
    });

    return balances;
  },

  // 生成跨年分余额报告
  generateCrossYearBalanceReport(
    filteredTransactions: Transaction[], 
    allTransactions: Transaction[],
    bankAccounts: BankAccount[],
    yearFilter?: number
  ): {
    summary: {
      totalInitialBalance: number;
      totalNetAmount: number;
      totalRunningBalance: number;
      transactionCount: number;
      accountCount: number;
    };
    accountDetails: Array<{
      accountId: string;
      accountName: string;
      initialBalance: number;
      netAmount: number;
      runningBalance: number;
      transactionCount: number;
    }>;
    validation: { isValid: boolean; errors: string[] };
  } {
    const validation = this.validateCalculationConsistency(filteredTransactions, bankAccounts);
    
    // 计算汇总数据
    const totalInitialBalance = bankAccounts.reduce((sum, account) => sum + (account.initialAmount || 0), 0);
    const totalNetAmount = filteredTransactions.reduce((sum, transaction) => sum + this.calculateNetAmount(transaction), 0);
    
    // 使用跨年分累计余额计算
    const crossYearBalances = this.calculateCrossYearBalances(filteredTransactions, allTransactions, bankAccounts, yearFilter);
    
    // 计算总累计余额（所有户口的最终余额之和）
    const totalRunningBalance = bankAccounts.reduce((sum, account) => {
      const accountTransactions = filteredTransactions.filter(t => t.bankAccountId === account.id);
      if (accountTransactions.length === 0) {
        // 如果没有该年份的交易，使用年初余额
        if (yearFilter) {
          const previousTransactions = allTransactions.filter(t => {
            if (t.bankAccountId !== account.id) return false;
            const transactionDate = dayjs(t.transactionDate, 'DD-MMM-YYYY');
            return transactionDate.year() < yearFilter;
          });
          
          let yearStartBalance = account.initialAmount || 0;
          if (previousTransactions.length > 0) {
            const sortedPreviousTransactions = [...previousTransactions].sort((a, b) => {
              if (a.transactionNumber && b.transactionNumber) {
                return a.transactionNumber.localeCompare(b.transactionNumber);
              }
              const dateA = typeof a.transactionDate === 'string' 
                ? new Date(a.transactionDate).getTime() 
                : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
              const dateB = typeof b.transactionDate === 'string' 
                ? new Date(b.transactionDate).getTime() 
                : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
              return dateA - dateB;
            });
            
            sortedPreviousTransactions.forEach(transaction => {
              yearStartBalance += this.calculateNetAmount(transaction);
            });
          }
          return sum + yearStartBalance;
        }
        return sum + (account.initialAmount || 0);
      }
      
      // 获取该户口的最后一笔交易的累计余额
      const lastTransaction = accountTransactions[accountTransactions.length - 1];
      return sum + (crossYearBalances[lastTransaction.id] || 0);
    }, 0);
    
    // 按户口生成详细数据
    const accountDetails = bankAccounts.map(account => {
      const accountTransactions = filteredTransactions.filter(t => t.bankAccountId === account.id);
      const accountNetAmount = accountTransactions.reduce((sum, transaction) => sum + this.calculateNetAmount(transaction), 0);
      
      let accountRunningBalance = 0;
      if (accountTransactions.length === 0) {
        // 如果没有该年份的交易，使用年初余额
        if (yearFilter) {
          const previousTransactions = allTransactions.filter(t => {
            if (t.bankAccountId !== account.id) return false;
            const transactionDate = dayjs(t.transactionDate, 'DD-MMM-YYYY');
            return transactionDate.year() < yearFilter;
          });
          
          accountRunningBalance = account.initialAmount || 0;
          if (previousTransactions.length > 0) {
            const sortedPreviousTransactions = [...previousTransactions].sort((a, b) => {
              if (a.transactionNumber && b.transactionNumber) {
                return a.transactionNumber.localeCompare(b.transactionNumber);
              }
              const dateA = typeof a.transactionDate === 'string' 
                ? new Date(a.transactionDate).getTime() 
                : new Date((a.transactionDate as any)?.seconds * 1000).getTime();
              const dateB = typeof b.transactionDate === 'string' 
                ? new Date(b.transactionDate).getTime() 
                : new Date((b.transactionDate as any)?.seconds * 1000).getTime();
              return dateA - dateB;
            });
            
            sortedPreviousTransactions.forEach(transaction => {
              accountRunningBalance += this.calculateNetAmount(transaction);
            });
          }
        } else {
          accountRunningBalance = account.initialAmount || 0;
        }
      } else {
        // 获取该户口的最后一笔交易的累计余额
        const lastTransaction = accountTransactions[accountTransactions.length - 1];
        accountRunningBalance = crossYearBalances[lastTransaction.id] || 0;
      }
      
      return {
        accountId: account.id,
        accountName: account.accountName,
        initialBalance: account.initialAmount || 0,
        netAmount: accountNetAmount,
        runningBalance: accountRunningBalance,
        transactionCount: accountTransactions.length
      };
    });
    
    return {
      summary: {
        totalInitialBalance,
        totalNetAmount,
        totalRunningBalance,
        transactionCount: filteredTransactions.length,
        accountCount: bankAccounts.length
      },
      accountDetails,
      validation
    };
  }
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
