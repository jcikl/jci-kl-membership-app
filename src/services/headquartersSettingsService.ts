import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { HeadquartersSettings } from '@/types';
import { GLOBAL_COLLECTIONS } from '@/config/globalCollections';

const HEADQUARTERS_SETTINGS_COLLECTION = GLOBAL_COLLECTIONS.HEADQUARTERS_SETTINGS;
const HEADQUARTERS_SETTINGS_DOC_ID = 'main';

// 获取总部设置
export const getHeadquartersSettings = async (): Promise<HeadquartersSettings | null> => {
  try {
    const docRef = doc(db, HEADQUARTERS_SETTINGS_COLLECTION, HEADQUARTERS_SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as HeadquartersSettings;
    }
    
    return null;
  } catch (error) {
    console.error('获取总部设置失败:', error);
    throw error;
  }
};

// 创建或更新总部设置
export const saveHeadquartersSettings = async (settings: Omit<HeadquartersSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const docRef = doc(db, HEADQUARTERS_SETTINGS_COLLECTION, HEADQUARTERS_SETTINGS_DOC_ID);
    
    // 检查文档是否存在
    const docSnap = await getDoc(docRef);
    const now = new Date().toISOString();
    
    // 过滤掉 undefined 值，避免 Firebase 错误
    const cleanSettings = JSON.parse(JSON.stringify(settings, (_, value) => {
      return value === undefined ? null : value;
    }));
    
    if (docSnap.exists()) {
      // 更新现有设置
      await updateDoc(docRef, {
        ...cleanSettings,
        updatedAt: now,
      });
    } else {
      // 创建新设置
      await setDoc(docRef, {
        ...cleanSettings,
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error('保存总部设置失败:', error);
    throw error;
  }
};

// 获取默认总部设置
export const getDefaultHeadquartersSettings = (): Omit<HeadquartersSettings, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    name: 'JCI Headquarters',
    description: 'Junior Chamber International Headquarters',
    address: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    logoUrl: ''
  };
};
