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
  QueryConstraint,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Member, PaginationParams, PaginatedResponse } from '@/types';

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
export const getMembers = async (params?: PaginationParams & { search?: string; filters?: any }): Promise<PaginatedResponse<Member>> => {
  try {
    const constraints: QueryConstraint[] = [];
    
    // Apply filters
    if (params?.filters) {
      const { status, level, accountType } = params.filters;
      
      if (status && status !== 'all') {
        constraints.push(where('status', '==', status));
      }
      
      if (level && level !== 'all') {
        constraints.push(where('level', '==', level));
      }
      
      if (accountType && accountType !== 'all') {
        constraints.push(where('accountType', '==', accountType));
      }
    }
    
    if (params?.sortBy) {
      constraints.push(orderBy(params.sortBy, params.sortOrder || 'asc'));
    }
    
    // 移除 Firestore limit，获取所有符合条件的记录
    // 这样可以确保搜索和分页在完整数据集上进行
    const q = query(collection(db, MEMBERS_COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    let members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Member[];

    // Apply search filter (client-side for text search)
    if (params?.search && params.search.trim()) {
      const searchTerm = params.search.toLowerCase().trim();
      
      members = members.filter(member => {
        // 检查基本字段
        const nameMatch = member.name?.toLowerCase().includes(searchTerm);
        const emailMatch = member.email?.toLowerCase().includes(searchTerm);
        const phoneMatch = member.phone?.toLowerCase().includes(searchTerm);
        const memberIdMatch = member.memberId?.toLowerCase().includes(searchTerm);
        
        // 检查profile字段
        const fullNameMatch = member.profile?.fullNameNric?.toLowerCase().includes(searchTerm);
        const nricMatch = member.profile?.nricOrPassport?.toLowerCase().includes(searchTerm);
        const addressMatch = member.profile?.address?.toLowerCase().includes(searchTerm);
        const companyMatch = member.profile?.company?.toLowerCase().includes(searchTerm);
        const introducerMatch = member.profile?.introducerName?.toLowerCase().includes(searchTerm);
        
        return nameMatch || emailMatch || phoneMatch || memberIdMatch || 
               fullNameMatch || nricMatch || addressMatch || companyMatch || introducerMatch;
      });
      
    }

    // Calculate pagination on the filtered results
    const total = members.length;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMembers = members.slice(startIndex, endIndex);

    return {
      data: paginatedMembers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
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
    const now = new Date().toISOString();
    const processedMemberData = {
      ...memberData,
      membershipCategory: 'associate', // 默认为准会员
      accountType: 'user',
      categoryReason: '新用户自动分配为准会员',
      categoryAssignedBy: 'system',
      categoryAssignedDate: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      createdAt: now,
      updatedAt: now
    };
    
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
export const createMembersBatch = async (membersData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[], developerMode: boolean = false): Promise<{ success: number; failed: number; errors: string[] }> => {
  try {
    const batch = writeBatch(db);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    // 验证数据（开发者模式可以绕过必填字段检查）
    for (let i = 0; i < membersData.length; i++) {
      const memberData = membersData[i];
      if (!developerMode && (!memberData.name || !memberData.email || !memberData.phone || !memberData.memberId)) {
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
        const now = new Date().toISOString();
        const processedMemberData = {
          ...memberData,
          membershipCategory: 'associate', // 默认为准会员
          accountType: 'user',
          categoryReason: '新用户自动分配为准会员',
          categoryAssignedBy: 'system',
          categoryAssignedDate: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          }),
          createdAt: now,
          updatedAt: now
        };
        
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

// 批量更新会员
export const updateMembersBatch = async (
  memberIds: string[], 
  updates: Partial<Member>, 
  reason?: string
): Promise<{ success: number; failed: number; errors: string[] }> => {
  try {
    const batch = writeBatch(db);
    let successCount = 0;
    const errors: string[] = [];

    // 准备更新数据
    const updateData = {
      ...cleanUndefinedValues(updates),
      updatedAt: new Date().toISOString(),
      ...(reason && { lastUpdateReason: reason })
    };

    for (const memberId of memberIds) {
      try {
        const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
        
        // 添加到批量操作
        batch.update(memberRef, updateData);
        successCount++;
      } catch (error) {
        console.error(`Error updating member ${memberId}:`, error);
        errors.push(`会员 ${memberId} 更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    if (successCount > 0) {
      await batch.commit();
    }

    return {
      success: successCount,
      failed: memberIds.length - successCount,
      errors
    };
  } catch (error) {
    console.error('Batch update members error:', error);
    throw new Error(`批量更新会员失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};

// 根据NRIC/护照号查找会员
export const findMemberByNricOrPassport = async (nricOrPassport: string): Promise<Member | null> => {
  try {
    if (!nricOrPassport || nricOrPassport.trim() === '') {
      return null;
    }

    const q = query(
      collection(db, MEMBERS_COLLECTION),
      where('profile.nricOrPassport', '==', nricOrPassport.trim())
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Member;
  } catch (error) {
    console.error('查找会员失败:', error);
    return null;
  }
};

// 智能批量导入/更新会员（根据NRIC/护照号判断创建或更新）
export const smartImportMembersBatch = async (
  membersData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[], 
  developerMode: boolean = false
): Promise<{ 
  success: number; 
  failed: number; 
  created: number; 
  updated: number; 
  errors: string[] 
}> => {
  try {
    const batch = writeBatch(db);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;

    // 验证数据（开发者模式可以绕过必填字段检查）
    for (let i = 0; i < membersData.length; i++) {
      const memberData = membersData[i];
      if (!developerMode && (!memberData.name || !memberData.email || !memberData.phone || !memberData.memberId)) {
        errors.push(`第${i + 1}行：缺少必填字段（姓名、邮箱、手机号、会员编号）`);
        failedCount++;
        continue;
      }
    }

    // 如果验证失败，直接返回
    if (failedCount > 0) {
      return { success: 0, failed: failedCount, created: 0, updated: 0, errors };
    }

    // 处理每个会员数据
    for (const memberData of membersData) {
      try {
        const nricOrPassport = memberData.profile?.nricOrPassport;
        
        if (nricOrPassport && nricOrPassport.trim() !== '') {
          // 尝试根据NRIC/护照号查找现有会员
          const existingMember = await findMemberByNricOrPassport(nricOrPassport);
          
          if (existingMember) {
            // 更新现有会员
            const updateData = {
              ...cleanUndefinedValues(memberData),
              updatedAt: new Date().toISOString(),
              lastUpdateReason: '批量导入更新'
            };
            
            const memberRef = doc(db, MEMBERS_COLLECTION, existingMember.id);
            batch.update(memberRef, updateData);
            updatedCount++;
            successCount++;
          } else {
            // 创建新会员
            const now = new Date().toISOString();
            const processedMemberData = {
              ...memberData,
              membershipCategory: 'associate', // 默认为准会员
              accountType: 'user',
              categoryReason: '新用户自动分配为准会员',
              categoryAssignedBy: 'system',
              categoryAssignedDate: new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }),
              createdAt: now,
              updatedAt: now
            };
            
            const docRef = doc(collection(db, MEMBERS_COLLECTION));
            batch.set(docRef, processedMemberData);
            createdCount++;
            successCount++;
          }
        } else {
          // 没有NRIC/护照号，直接创建新会员
          const now = new Date().toISOString();
          const processedMemberData = {
            ...memberData,
            membershipCategory: 'associate', // 默认为准会员
            accountType: 'user',
            categoryReason: '新用户自动分配为准会员',
            categoryAssignedBy: 'system',
            categoryAssignedDate: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            createdAt: now,
            updatedAt: now
          };
          
          const docRef = doc(collection(db, MEMBERS_COLLECTION));
          batch.set(docRef, processedMemberData);
          createdCount++;
          successCount++;
        }
      } catch (error) {
        failedCount++;
        errors.push(`处理会员 ${memberData.name} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    // 执行批量写入
    if (successCount > 0) {
      await batch.commit();
    }

    return { 
      success: successCount, 
      failed: failedCount, 
      created: createdCount, 
      updated: updatedCount, 
      errors 
    };
  } catch (error) {
    console.error('智能批量导入会员失败:', error);
    throw error;
  }
};

// 批量删除会员
export const deleteMembersBatch = async (
  memberIds: string[]
): Promise<{ success: number; failed: number; errors: string[] }> => {
  try {
    const batch = writeBatch(db);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    // 验证输入
    if (!memberIds || memberIds.length === 0) {
      throw new Error('没有选择要删除的会员');
    }

    // 批量删除
    for (const memberId of memberIds) {
      try {
        const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
        batch.delete(memberRef);
        successCount++;
      } catch (error) {
        failedCount++;
        errors.push(`删除会员 ${memberId} 失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    // 执行批量删除
    if (successCount > 0) {
      await batch.commit();
    }

    return {
      success: successCount,
      failed: failedCount,
      errors
    };
  } catch (error) {
    console.error('批量删除会员失败:', error);
    throw new Error(`批量删除会员失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
};