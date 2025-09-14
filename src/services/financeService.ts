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
  Timestamp
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
  async getAccounts(auditYear?: number): Promise<BankAccount[]> {
    let q = query(collection(db, 'bank_accounts'), orderBy('createdAt', 'desc'));
    
    if (auditYear) {
      q = query(collection(db, 'bank_accounts'), where('auditYear', '==', auditYear), orderBy('createdAt', 'desc'));
    }

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
    const docRef = await addDoc(collection(db, 'transactions'), {
        ...transaction,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 批量创建交易记录
  async createTransactions(transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

      for (const transaction of transactions) {
        try {
        await this.createTransaction(transaction);
        success++;
        } catch (error) {
        failed++;
        errors.push(`交易记录创建失败: ${error}`);
      }
    }

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
    await deleteDoc(doc(db, 'transactions', id));
  },

  // 获取交易记录列表
  async getTransactions(auditYear?: number, bankAccountId?: string): Promise<Transaction[]> {
    let q = query(collection(db, 'transactions'), orderBy('transactionDate', 'desc'));
    
    if (auditYear) {
      q = query(collection(db, 'transactions'), where('auditYear', '==', auditYear), orderBy('transactionDate', 'desc'));
    }

    if (bankAccountId) {
      q = query(collection(db, 'transactions'), where('bankAccountId', '==', bankAccountId), orderBy('transactionDate', 'desc'));
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
    const docRef = await addDoc(collection(db, 'budgets'), {
        ...budget,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // 更新预算
  async updateBudget(id: string, budget: Partial<Budget>): Promise<void> {
    const docRef = doc(db, 'budgets', id);
    await updateDoc(docRef, {
      ...budget,
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
  async getRequests(auditYear?: number): Promise<BillPaymentRequest[]> {
    let q = query(collection(db, 'bill_payment_requests'), orderBy('createdAt', 'desc'));
    
    if (auditYear) {
      q = query(collection(db, 'bill_payment_requests'), where('auditYear', '==', auditYear), orderBy('createdAt', 'desc'));
    }

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
  async generateReport(reportType: string, startDate: string, endDate: string, auditYear: number): Promise<FinancialReport> {
    
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
        reportData.statementOfFinancialPosition = await simpleFinancialReportGenerator.generateStatementOfFinancialPosition(auditYear);
        break;
      case 'income_statement':
        reportData.incomeStatement = await simpleFinancialReportGenerator.generateIncomeStatement(auditYear);
        break;
      case 'detailed_income_statement':
        reportData.detailedIncomeStatement = await simpleFinancialReportGenerator.generateDetailedIncomeStatement(auditYear);
        break;
      case 'notes_to_financial_statements':
        reportData.notesToFinancialStatements = await simpleFinancialReportGenerator.generateNotesToFinancialStatements(auditYear);
        break;
      default:
        // 生成基础财务数据
        const transactions = await transactionService.getTransactions(auditYear);
        const bankAccounts = await bankAccountService.getAccounts(auditYear);
        
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

    const reportName = this.getReportName(reportType, auditYear);
    const reportPeriod = this.getReportPeriod(reportType, startDate, endDate, auditYear);

    const report: FinancialReport = {
      id: `report-${Date.now()}`,
      reportType: reportType as any,
      reportName,
      reportPeriod,
      auditYear: auditYear,
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
  getReportName(reportType: string, auditYear: number): string {
    const reportNames: Record<string, string> = {
      'statement_of_financial_position': `STATEMENT OF FINANCIAL POSITION AS AT 30 JUN ${auditYear}`,
      'income_statement': `INCOME STATEMENT FOR THE YEAR ENDED 30 JUN ${auditYear}`,
      'detailed_income_statement': `DETAILED INCOME STATEMENT FOR THE YEAR ENDED 30 JUN ${auditYear}`,
      'notes_to_financial_statements': `NOTES TO THE FINANCIAL STATEMENTS FOR THE YEAR ENDED 30 JUN ${auditYear}`,
      'cash_flow': `CASH FLOW STATEMENT FOR THE YEAR ENDED 30 JUN ${auditYear}`,
      'bank_reconciliation': `BANK RECONCILIATION STATEMENT AS AT 30 JUN ${auditYear}`,
      'monthly_summary': `MONTHLY FINANCIAL SUMMARY FOR ${auditYear}`,
      'project_summary': `PROJECT FINANCIAL SUMMARY FOR ${auditYear}`,
      'general_ledger': `GENERAL LEDGER FOR THE YEAR ENDED 30 JUN ${auditYear}`,
    };
    
    return reportNames[reportType] || `财务报告-${reportType}`;
  },

  // 获取报告期间
  getReportPeriod(reportType: string, startDate: string, endDate: string, auditYear: number): string {
    if (reportType.includes('statement_of_financial_position')) {
      return `AS AT 30 JUN ${auditYear}`;
    }
    if (reportType.includes('income_statement') || reportType.includes('notes')) {
      return `FOR THE YEAR ENDED 30 JUN ${auditYear}`;
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

  // 按财政年度获取报告
  async getReportsByFiscalYear(auditYear: number): Promise<FinancialReport[]> {
    const q = query(
      collection(db, 'financial_reports'), 
      where('auditYear', '==', auditYear),
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
