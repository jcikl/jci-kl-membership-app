// 职位管理服务
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
import { MemberPosition, JCIPosition } from '@/types/rbac';

// 职位分配选项
export interface PositionAssignmentOptions {
  startDate?: string;
  endDate?: string;
  isActing?: boolean;
  actingFor?: JCIPosition;
  assignedBy: string;
}

// 职位更新选项
export interface PositionUpdateOptions {
  endDate?: string;
  isActing?: boolean;
  actingFor?: JCIPosition;
  status?: 'active' | 'inactive' | 'expired';
}

export const positionService = {
  // 分配职位
  assignPosition: async (memberId: string, position: JCIPosition, options: PositionAssignmentOptions): Promise<string> => {
    try {
      // 检查是否已有活跃的相同职位
      const existingPosition = await positionService.getCurrentPosition(memberId);
      if (existingPosition && existingPosition.position === position && existingPosition.status === 'active') {
        throw new Error('该会员已拥有此职位');
      }

      // 如果分配新职位，先结束当前职位
      if (existingPosition && existingPosition.status === 'active') {
        await positionService.endPosition(existingPosition.id, new Date().toISOString());
      }

      const positionData: Omit<MemberPosition, 'id'> = {
        memberId,
        position,
        isActing: options.isActing || false,
        assignedBy: options.assignedBy,
        assignedDate: new Date().toISOString(),
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 只添加非undefined的字段
      if (options.startDate) {
        positionData.startDate = options.startDate;
      }
      if (options.endDate) {
        positionData.endDate = options.endDate;
      }
      if (options.actingFor) {
        positionData.actingFor = options.actingFor;
      }

      const docRef = await addDoc(collection(db, 'member_positions'), positionData);
      return docRef.id;
    } catch (error) {
      console.error('分配职位失败:', error);
      throw error;
    }
  },

  // 获取会员当前职位
  getCurrentPosition: async (memberId: string): Promise<MemberPosition | null> => {
    try {
      const q = query(
        collection(db, 'member_positions'),
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
      } as MemberPosition;
    } catch (error) {
      console.error('获取当前职位失败:', error);
      throw error;
    }
  },

  // 获取职位历史
  getPositionHistory: async (memberId: string): Promise<MemberPosition[]> => {
    try {
      const q = query(
        collection(db, 'member_positions'),
        where('memberId', '==', memberId),
        orderBy('assignedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemberPosition[];
    } catch (error) {
      console.error('获取职位历史失败:', error);
      throw error;
    }
  },

  // 更新职位
  updatePosition: async (positionId: string, updates: PositionUpdateOptions): Promise<void> => {
    try {
      const positionRef = doc(db, 'member_positions', positionId);
      await updateDoc(positionRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('更新职位失败:', error);
      throw error;
    }
  },

  // 结束职位
  endPosition: async (positionId: string, endDate: string): Promise<void> => {
    try {
      const positionRef = doc(db, 'member_positions', positionId);
      await updateDoc(positionRef, {
        endDate,
        status: 'inactive',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('结束职位失败:', error);
      throw error;
    }
  },

  // 获取所有职位
  getAllPositions: async (): Promise<MemberPosition[]> => {
    try {
      const q = query(
        collection(db, 'member_positions'),
        orderBy('assignedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemberPosition[];
    } catch (error) {
      console.error('获取所有职位失败:', error);
      throw error;
    }
  },

  // 根据职位获取会员
  getMembersByPosition: async (position: JCIPosition): Promise<MemberPosition[]> => {
    try {
      const q = query(
        collection(db, 'member_positions'),
        where('position', '==', position),
        where('status', '==', 'active'),
        orderBy('assignedDate', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemberPosition[];
    } catch (error) {
      console.error('根据职位获取会员失败:', error);
      throw error;
    }
  },

  // 删除职位记录
  deletePosition: async (positionId: string): Promise<void> => {
    try {
      const positionRef = doc(db, 'member_positions', positionId);
      await deleteDoc(positionRef);
    } catch (error) {
      console.error('删除职位记录失败:', error);
      throw error;
    }
  },

  // 检查职位冲突
  checkPositionConflict: async (memberId: string, position: JCIPosition, startDate: string, endDate?: string): Promise<boolean> => {
    try {
      const q = query(
        collection(db, 'member_positions'),
        where('memberId', '==', memberId),
        where('position', '==', position),
        where('status', '==', 'active')
      );
      
      const querySnapshot = await getDocs(q);
      
      // 检查时间重叠
      for (const doc of querySnapshot.docs) {
        const data = doc.data() as MemberPosition;
        const existingStart = data.startDate ? new Date(data.startDate) : new Date('1900-01-01');
        const existingEnd = data.endDate ? new Date(data.endDate) : new Date('2099-12-31');
        const newStart = startDate ? new Date(startDate) : new Date('1900-01-01');
        const newEnd = endDate ? new Date(endDate) : new Date('2099-12-31');
        
        if (newStart < existingEnd && newEnd > existingStart) {
          return true; // 存在冲突
        }
      }
      
      return false;
    } catch (error) {
      console.error('检查职位冲突失败:', error);
      throw error;
    }
  }
};
