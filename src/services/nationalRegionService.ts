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
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import { NationalRegion } from '@/types';
import { GLOBAL_COLLECTIONS } from '@/config/globalCollections';

const NATIONAL_REGIONS_COLLECTION = GLOBAL_COLLECTIONS.NATIONAL_REGIONS;

// 获取所有国家区域
export const getNationalRegions = async (): Promise<NationalRegion[]> => {
  try {
    const q = query(
      collection(db, NATIONAL_REGIONS_COLLECTION),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as NationalRegion));
  } catch (error) {
    console.error('获取国家区域列表失败:', error);
    throw error;
  }
};

// 根据国家获取国家区域
export const getNationalRegionsByCountry = async (countryId: string): Promise<NationalRegion[]> => {
  try {
    const q = query(
      collection(db, NATIONAL_REGIONS_COLLECTION),
      where('countryId', '==', countryId),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as NationalRegion));
  } catch (error) {
    console.error('根据国家获取国家区域失败:', error);
    throw error;
  }
};

// 获取单个国家区域
export const getNationalRegion = async (id: string): Promise<NationalRegion | null> => {
  try {
    const docRef = doc(db, NATIONAL_REGIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as NationalRegion;
    }
    
    return null;
  } catch (error) {
    console.error('获取国家区域失败:', error);
    throw error;
  }
};

// 创建国家区域
export const createNationalRegion = async (region: Omit<NationalRegion, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date().toISOString();
    
    const docRef = await addDoc(collection(db, NATIONAL_REGIONS_COLLECTION), {
      ...region,
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('创建国家区域失败:', error);
    throw error;
  }
};

// 更新国家区域
export const updateNationalRegion = async (id: string, region: Partial<Omit<NationalRegion, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, NATIONAL_REGIONS_COLLECTION, id);
    
    // 过滤掉 undefined 值
    const cleanRegion = JSON.parse(JSON.stringify(region, (_, value) => {
      return value === undefined ? null : value;
    }));
    
    await updateDoc(docRef, {
      ...cleanRegion,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新国家区域失败:', error);
    throw error;
  }
};

// 删除国家区域
export const deleteNationalRegion = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, NATIONAL_REGIONS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('删除国家区域失败:', error);
    throw error;
  }
};

// 初始化默认马来西亚国家区域
export const initializeDefaultMalaysianRegions = async (malaysiaCountryId: string): Promise<void> => {
  try {
    const defaultRegions = [
      {
        name: 'JCI Malaysia Area Central',
        code: 'CENTRAL',
        countryId: malaysiaCountryId,
        description: 'Central region of Malaysia',
        chapters: []
      },
      {
        name: 'JCI Malaysia Area South',
        code: 'SOUTH',
        countryId: malaysiaCountryId,
        description: 'South region of Malaysia',
        chapters: []
      },
      {
        name: 'JCI Malaysia Area North',
        code: 'NORTH',
        countryId: malaysiaCountryId,
        description: 'North region of Malaysia',
        chapters: []
      },
      {
        name: 'JCI Malaysia Area Sabah',
        code: 'SABAH',
        countryId: malaysiaCountryId,
        description: 'Sabah region of Malaysia',
        chapters: []
      },
      {
        name: 'JCI Malaysia Area Sarawak',
        code: 'SARAWAK',
        countryId: malaysiaCountryId,
        description: 'Sarawak region of Malaysia',
        chapters: []
      }
    ];

    for (const region of defaultRegions) {
      await createNationalRegion(region);
    }
  } catch (error) {
    console.error('初始化默认马来西亚国家区域失败:', error);
    throw error;
  }
};
