import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { WorldRegion } from '@/types';
import { GLOBAL_COLLECTIONS } from '@/config/globalCollections';

const WORLD_REGIONS_COLLECTION = GLOBAL_COLLECTIONS.WORLD_REGIONS;

// 获取所有世界区域
export const getWorldRegions = async (): Promise<WorldRegion[]> => {
  try {
    const q = query(
      collection(db, WORLD_REGIONS_COLLECTION),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as WorldRegion));
  } catch (error) {
    console.error('获取世界区域失败:', error);
    throw error;
  }
};

// 获取单个世界区域
export const getWorldRegion = async (id: string): Promise<WorldRegion | null> => {
  try {
    const docRef = doc(db, WORLD_REGIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as WorldRegion;
    }
    
    return null;
  } catch (error) {
    console.error('获取世界区域失败:', error);
    throw error;
  }
};

// 创建世界区域
export const createWorldRegion = async (region: Omit<WorldRegion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date().toISOString();
    
    const docRef = await addDoc(collection(db, WORLD_REGIONS_COLLECTION), {
      ...region,
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('创建世界区域失败:', error);
    throw error;
  }
};

// 更新世界区域
export const updateWorldRegion = async (id: string, region: Partial<Omit<WorldRegion, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, WORLD_REGIONS_COLLECTION, id);
    
    // 过滤掉 undefined 值
    const cleanRegion = JSON.parse(JSON.stringify(region, (_, value) => {
      return value === undefined ? null : value;
    }));
    
    await updateDoc(docRef, {
      ...cleanRegion,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新世界区域失败:', error);
    throw error;
  }
};

// 删除世界区域
export const deleteWorldRegion = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, WORLD_REGIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('删除世界区域失败:', error);
    throw error;
  }
};

// 初始化默认世界区域
export const initializeDefaultWorldRegions = async (): Promise<void> => {
  try {
    const defaultRegions = [
      {
        name: 'JCI Africa and the Middle East (JCI AMEC)',
        code: 'AMEC',
        description: 'Africa and the Middle East region',
        countries: []
      },
      {
        name: 'JCI America',
        code: 'AMERICA',
        description: 'America region',
        countries: []
      },
      {
        name: 'JCI Asia and the Pacific (JCI ASPAC)',
        code: 'ASPAC',
        description: 'Asia and the Pacific region',
        countries: []
      },
      {
        name: 'JCI Europe',
        code: 'EUROPE',
        description: 'Europe region',
        countries: []
      }
    ];

    for (const region of defaultRegions) {
      await createWorldRegion(region);
    }
  } catch (error) {
    console.error('初始化默认世界区域失败:', error);
    throw error;
  }
};
