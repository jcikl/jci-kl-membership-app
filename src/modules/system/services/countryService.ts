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
import { db } from '@/services/firebase';
import { Country } from '@/types';
import { GLOBAL_COLLECTIONS } from '@/config/globalCollections';

const COUNTRIES_COLLECTION = GLOBAL_COLLECTIONS.COUNTRIES;

// 获取所有国家
export const getCountries = async (): Promise<Country[]> => {
  try {
    const q = query(
      collection(db, COUNTRIES_COLLECTION),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Country));
  } catch (error) {
    console.error('获取国家列表失败:', error);
    throw error;
  }
};

// 根据世界区域获取国家
export const getCountriesByWorldRegion = async (worldRegionId: string): Promise<Country[]> => {
  try {
    const q = query(
      collection(db, COUNTRIES_COLLECTION),
      where('worldRegionId', '==', worldRegionId),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Country));
  } catch (error) {
    console.error('根据世界区域获取国家失败:', error);
    throw error;
  }
};

// 获取单个国家
export const getCountry = async (id: string): Promise<Country | null> => {
  try {
    const docRef = doc(db, COUNTRIES_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Country;
    }
    
    return null;
  } catch (error) {
    console.error('获取国家失败:', error);
    throw error;
  }
};

// 创建国家
export const createCountry = async (country: Omit<Country, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date().toISOString();
    
    const docRef = await addDoc(collection(db, COUNTRIES_COLLECTION), {
      ...country,
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('创建国家失败:', error);
    throw error;
  }
};

// 更新国家
export const updateCountry = async (id: string, country: Partial<Omit<Country, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, COUNTRIES_COLLECTION, id);
    
    // 过滤掉 undefined 值
    const cleanCountry = JSON.parse(JSON.stringify(country, (_, value) => {
      return value === undefined ? null : value;
    }));
    
    await updateDoc(docRef, {
      ...cleanCountry,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新国家失败:', error);
    throw error;
  }
};

// 删除国家
export const deleteCountry = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, COUNTRIES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('删除国家失败:', error);
    throw error;
  }
};

// 初始化默认国家
export const initializeDefaultCountries = async (): Promise<void> => {
  try {
    const defaultCountries = [
      {
        name: 'JCI Malaysia',
        code: 'MY',
        worldRegionId: '', // 需要先获取ASPAC区域ID
        nationalRegions: []
      },
      {
        name: 'JCI Singapore',
        code: 'SG',
        worldRegionId: '', // 需要先获取ASPAC区域ID
        nationalRegions: []
      },
      
    ];

    for (const country of defaultCountries) {
      await createCountry(country);
    }
  } catch (error) {
    console.error('初始化默认国家失败:', error);
    throw error;
  }
};
