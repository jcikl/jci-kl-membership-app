import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { ChapterSettings } from '@/types';

const CHAPTER_SETTINGS_COLLECTION = 'chapter_settings';
const CHAPTER_SETTINGS_DOC_ID = 'main';

// 获取分会设置
export const getChapterSettings = async (): Promise<ChapterSettings | null> => {
  try {
    const docRef = doc(db, CHAPTER_SETTINGS_COLLECTION, CHAPTER_SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as ChapterSettings;
    }
    
    return null;
  } catch (error) {
    console.error('获取分会设置失败:', error);
    throw error;
  }
};

// 创建或更新分会设置
export const saveChapterSettings = async (settings: Omit<ChapterSettings, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const docRef = doc(db, CHAPTER_SETTINGS_COLLECTION, CHAPTER_SETTINGS_DOC_ID);
    
    // 检查文档是否存在
    const docSnap = await getDoc(docRef);
    const now = new Date().toISOString();
    
    if (docSnap.exists()) {
      // 更新现有设置
      await updateDoc(docRef, {
        ...settings,
        updatedAt: now,
      });
    } else {
      // 创建新设置
      await setDoc(docRef, {
        ...settings,
        createdAt: now,
        updatedAt: now,
      });
    }
  } catch (error) {
    console.error('保存分会设置失败:', error);
    throw error;
  }
};

// 获取默认分会设置
export const getDefaultChapterSettings = (): Omit<ChapterSettings, 'id' | 'createdAt' | 'updatedAt'> => {
  return {
    chapterName: 'JCI Kuala Lumpur',
    establishmentYear: new Date().getFullYear(),
    description: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    website: '',
    logoUrl: '',
  };
};
