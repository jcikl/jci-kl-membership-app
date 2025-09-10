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
} from 'firebase/firestore';
import { db } from './firebase';
import { Member, PaginationParams, PaginatedResponse } from '@/types';

const MEMBERS_COLLECTION = 'members';

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
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, MEMBERS_COLLECTION), {
      ...memberData,
      createdAt: now,
      updatedAt: now,
    });
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
    await updateDoc(docRef, {
      ...memberData,
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
