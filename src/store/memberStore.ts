import { create } from 'zustand';
import { Member, PaginationParams } from '@/types';
import { getMembers, getMemberById, createMember, updateMember, deleteMember, createMembersBatch } from '@/services/memberService';

interface MemberState {
  members: Member[];
  currentMember: Member | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Actions
  fetchMembers: (params?: PaginationParams) => Promise<void>;
  fetchMemberById: (id: string) => Promise<void>;
  addMember: (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addMembersBatch: (membersData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<{ success: number; failed: number; errors: string[] }>;
  updateMemberById: (id: string, memberData: Partial<Member>) => Promise<void>;
  deleteMemberById: (id: string) => Promise<void>;
  setCurrentMember: (member: Member | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  currentMember: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  fetchMembers: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await getMembers(params);
      set({
        members: response.data,
        pagination: {
          page: response.page,
          limit: response.limit,
          total: response.total,
          totalPages: response.totalPages,
        },
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取会员列表失败',
        isLoading: false,
      });
    }
  },

  fetchMemberById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const member = await getMemberById(id);
      set({
        currentMember: member,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '获取会员详情失败',
        isLoading: false,
      });
    }
  },

  addMember: async (memberData) => {
    set({ isLoading: true, error: null });
    try {
      await createMember(memberData);
      // 重新获取会员列表
      await get().fetchMembers();
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '创建会员失败',
        isLoading: false,
      });
    }
  },

  addMembersBatch: async (membersData) => {
    set({ isLoading: true, error: null });
    try {
      const result = await createMembersBatch(membersData);
      // 重新获取会员列表
      await get().fetchMembers();
      set({ isLoading: false });
      return result;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '批量创建会员失败',
        isLoading: false,
      });
      throw error;
    }
  },

  updateMemberById: async (id, memberData) => {
    set({ isLoading: true, error: null });
    try {
      await updateMember(id, memberData);
      // 更新本地状态
      const { members } = get();
      const updatedMembers = members.map(member =>
        member.id === id ? { ...member, ...memberData } : member
      );
      set({
        members: updatedMembers,
        currentMember: get().currentMember?.id === id 
          ? { ...get().currentMember, ...memberData } as Member
          : get().currentMember,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '更新会员失败',
        isLoading: false,
      });
    }
  },

  deleteMemberById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteMember(id);
      // 从本地状态中移除
      const { members } = get();
      const filteredMembers = members.filter(member => member.id !== id);
      set({
        members: filteredMembers,
        currentMember: get().currentMember?.id === id ? null : get().currentMember,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : '删除会员失败',
        isLoading: false,
      });
    }
  },

  setCurrentMember: (member) => set({ currentMember: member }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
}));
