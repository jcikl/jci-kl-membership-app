import { create } from 'zustand';
import { User } from 'firebase/auth';
import { Member } from '@/types';

interface AuthState {
  user: User | null;
  member: Member | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setMember: (member: Member | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  member: null,
  isLoading: true,
  isAuthenticated: false,
  
  setUser: (user: User | null) => set(() => ({
    user,
    isAuthenticated: !!user,
    isLoading: false,
  })),
  
  setMember: (member: Member | null) => set({ member }),
  
  setLoading: (isLoading: boolean) => set({ isLoading }),
  
  logout: () => set({
    user: null,
    member: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));
