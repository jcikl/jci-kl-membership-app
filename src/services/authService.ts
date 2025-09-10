import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
  UserCredential,
} from 'firebase/auth';
import { auth } from './firebase';
import { createMember } from './memberService';
import { Member, RegisterForm } from '@/types';

// 用户注册
export const registerUser = async (formData: RegisterForm): Promise<UserCredential> => {
  try {
    // 创建 Firebase 认证用户
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );

    // 更新用户显示名称
    await updateProfile(userCredential.user, {
      displayName: formData.name,
    });

    // 创建会员记录
    const memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'> = {
      email: formData.email,
      name: formData.name,
      phone: formData.phone,
      memberId: formData.memberId,
      joinDate: new Date().toISOString(),
      status: 'pending',
      level: 'bronze',
      profile: {},
    };

    await createMember(memberData);

    return userCredential;
  } catch (error) {
    console.error('用户注册失败:', error);
    throw error;
  }
};

// 用户登录
export const loginUser = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('用户登录失败:', error);
    throw error;
  }
};

// 用户登出
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('用户登出失败:', error);
    throw error;
  }
};

// 获取当前用户
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// 监听认证状态变化
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};
