import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Member, PaginationParams, PaginatedResponse } from '@/types';
import { applyNewMemberRule } from './autoRulesService';

const MEMBERS_COLLECTION = 'members';

// 辅助函数：清理 undefined 值，将其转换为 null
const cleanUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedValues);
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanUndefinedValues(value);
    }
    return cleaned;
  }
  
  return obj;
};

// 获取所有会员
export const getMembers = async (params?: PaginationParams): Promise<PaginatedResponse<Member>> => {
  try {
    const constraints: QueryConstraint[] = [];
    
    if (params?.sortBy) {
      constraints.push(orderBy(params.sortBy, params.sortOrder || 'asc'));
    }
    
    if (params?.limit) {
      constraints.push(limit(params.limit));
    }

    const q = query(collection(db, MEMBERS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Member[];

    return {
      data: members,
      total: members.length,
      page: params?.page || 1,
      limit: params?.limit || 10,
      totalPages: Math.ceil(members.length / (params?.limit || 10))
    };
  } catch (error) {
    console.error('获取会员列表失败:', error);
    throw error;
  }
};

// 根据ID获取会员
export const getMemberById = async (id: string): Promise<Member | null> => {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Member;
    }
    return null;
  } catch (error) {
    console.error('获取会员详情失败:', error);
    throw error;
  }
};

// 根据邮箱获取会员
export const getMemberByEmail = async (email: string): Promise<Member | null> => {
  try {
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where('email', '==', email)
    );
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Member;
    }
    return null;
  } catch (error) {
    console.error('根据邮箱获取会员失败:', error);
    throw error;
  }
};

// 创建新会员
export const createMember = async (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // 应用新用户规则（默认为准会员）
    const processedMemberData = await applyNewMemberRule(memberData);
    
    const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), processedMemberData);
    return docRef.id;
  } catch (error) {
    console.error('创建会员失败:', error);
    throw error;
  }
};

// 更新会员信息
export const updateMember = async (id: string, memberData: Partial<Member>): Promise<void> => {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, id);
    // 清理 undefined 值，避免 Firestore 错误
    const cleanedData = cleanUndefinedValues(memberData);
    await updateDoc(docRef, {
      ...cleanedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新会员失败:', error);
    throw error;
  }
};

// 删除会员
export const deleteMember = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('删除会员失败:', error);
    throw error;
  }
};

// 搜索会员
export const searchMembers = async (searchTerm: string): Promise<Member[]> => {
  try {
    // 注意：Firestore 的文本搜索功能有限，这里使用简单的字段匹配
    // 在生产环境中，建议使用 Algolia 或其他全文搜索服务
    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Member[];
  } catch (error) {
    console.error('搜索会员失败:', error);
    throw error;
  }
};

// 批量创建会员
export const createMembersBatch = async (membersData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ success: number; failed: number; errors: string[] }> => {
  try {
    const batch = writeBatch(db);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    // 验证数据
    for (let i = 0; i < membersData.length; i++) {
      const memberData = membersData[i];
      if (!memberData.name || !memberData.email || !memberData.phone || !memberData.memberId) {
        errors.push(`第${i + 1}行：缺少必填字段（姓名、邮箱、手机号、会员编号）`);
        failedCount++;
        continue;
      }
    }

    // 如果验证失败，直接返回
    if (failedCount > 0) {
      return { success: 0, failed: failedCount, errors };
    }

    // 批量创建
    for (const memberData of membersData) {
      try {
        // 应用新用户规则（默认为准会员）
        const processedMemberData = await applyNewMemberRule(memberData);
        
        const docRef = doc(collection(db, MEMBERS_COLLECTION));
        batch.set(docRef, processedMemberData);
        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`创建会员 ${memberData.name} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    // 执行批量写入
    if (successCount > 0) {
      await batch.commit();
    }

    return { success: successCount, failed: failedCount, errors };
  } catch (error) {
    console.error('批量创建会员失败:', error);
    throw error;
  }
};