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
import { LocalChapter } from '@/types';
import { GLOBAL_COLLECTIONS } from '@/config/globalCollections';
import { getNationalRegions } from './nationalRegionService';

const LOCAL_CHAPTERS_COLLECTION = GLOBAL_COLLECTIONS.LOCAL_CHAPTERS;

// 获取所有地方分会
export const getLocalChapters = async (): Promise<LocalChapter[]> => {
  try {
    const q = query(
      collection(db, LOCAL_CHAPTERS_COLLECTION),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LocalChapter));
  } catch (error) {
    console.error('获取地方分会列表失败:', error);
    throw error;
  }
};

// 根据国家区域获取地方分会
export const getLocalChaptersByNationalRegion = async (nationalRegionId: string): Promise<LocalChapter[]> => {
  try {
    const q = query(
      collection(db, LOCAL_CHAPTERS_COLLECTION),
      where('nationalRegionId', '==', nationalRegionId),
      orderBy('name', 'asc')
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as LocalChapter));
  } catch (error) {
    console.error('根据国家区域获取地方分会失败:', error);
    throw error;
  }
};

// 获取单个地方分会
export const getLocalChapter = async (id: string): Promise<LocalChapter | null> => {
  try {
    const docRef = doc(db, LOCAL_CHAPTERS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as LocalChapter;
    }

    return null;
  } catch (error) {
    console.error('获取地方分会失败:', error);
    throw error;
  }
};

// 创建地方分会
export const createLocalChapter = async (chapter: Omit<LocalChapter, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = new Date().toISOString();

    const docRef = await addDoc(collection(db, LOCAL_CHAPTERS_COLLECTION), {
      ...chapter,
      createdAt: now,
      updatedAt: now,
    });

    return docRef.id;
  } catch (error) {
    console.error('创建地方分会失败:', error);
    throw error;
  }
};

// 更新地方分会
export const updateLocalChapter = async (id: string, chapter: Partial<Omit<LocalChapter, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> => {
  try {
    const docRef = doc(db, LOCAL_CHAPTERS_COLLECTION, id);

    const cleanChapter = JSON.parse(JSON.stringify(chapter, (_, value) => {
      return value === undefined ? null : value;
    }));

    await updateDoc(docRef, {
      ...cleanChapter,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新地方分会失败:', error);
    throw error;
  }
};

// 删除地方分会
export const deleteLocalChapter = async (id: string): Promise<void> => {
  try {
    const docRef = doc(db, LOCAL_CHAPTERS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('删除地方分会失败:', error);
    throw error;
  }
};

// 初始化默认马来西亚地方分会
export const initializeDefaultMalaysianChapters = async (): Promise<void> => {
  try {
    // 首先获取国家区域数据，以便匹配正确的区域ID
    const nationalRegions = await getNationalRegions();
    console.log('获取到的国家区域数据:', nationalRegions);

    const defaultChapters = [
      {
        name: 'JCI Kuala Lumpur',
        code: 'KL',
        nationalRegionId: '', // 将在下面动态设置
        establishmentYear: 1950,
        description: 'JCI Kuala Lumpur Chapter',
        address: 'Kuala Lumpur, Malaysia',
        contactEmail: 'info@jci-kl.org.my',
        contactPhone: '+60-3-1234-5678',
        website: 'https://jci-kl.org.my',
        logoUrl: '',
        status: 'active' as const,
        memberCount: 0,
      },
      {
        name: 'JCI Johor Bahru',
        code: 'JB',
        nationalRegionId: '', // 将在下面动态设置
        establishmentYear: 1960,
        description: 'JCI Johor Bahru Chapter',
        address: 'Johor Bahru, Malaysia',
        contactEmail: 'info@jci-jb.org.my',
        contactPhone: '+60-7-1234-5678',
        website: 'https://jci-jb.org.my',
        logoUrl: '',
        status: 'active' as const,
        memberCount: 0,
      },
      {
        name: 'JCI Penang',
        code: 'PG',
        nationalRegionId: '', // 将在下面动态设置
        establishmentYear: 1970,
        description: 'JCI Penang Chapter',
        address: 'Penang, Malaysia',
        contactEmail: 'info@jci-pg.org.my',
        contactPhone: '+60-4-1234-5678',
        website: 'https://jci-pg.org.my',
        logoUrl: '',
        status: 'active' as const,
        memberCount: 0,
      },
    ];

    // 区域代码映射
    const regionCodeMapping = {
      'KL': 'CENTRAL', // 吉隆坡属于中央区域
      'JB': 'SOUTH',   // 新山属于南部区域
      'PG': 'NORTH'    // 槟城属于北部区域
    };

    const createdChapters = [];

    for (const chapter of defaultChapters) {
      // 根据分会代码找到对应的国家区域
      const regionCode = regionCodeMapping[chapter.code as keyof typeof regionCodeMapping];
      const matchingRegion = nationalRegions.find(region => region.code === regionCode);
      
      if (matchingRegion) {
        chapter.nationalRegionId = matchingRegion.id;
        console.log(`为分会 ${chapter.name} 设置区域ID: ${matchingRegion.id} (${matchingRegion.name})`);
      } else {
        console.warn(`未找到分会 ${chapter.name} 对应的国家区域 (代码: ${regionCode})`);
        // 如果没有找到匹配的区域，使用第一个可用的区域
        if (nationalRegions.length > 0) {
          chapter.nationalRegionId = nationalRegions[0].id;
          console.log(`使用默认区域ID: ${nationalRegions[0].id} (${nationalRegions[0].name})`);
        }
      }

      // 创建分会
      try {
        const chapterId = await createLocalChapter(chapter);
        createdChapters.push({ id: chapterId, name: chapter.name });
        console.log(`✅ 成功创建分会: ${chapter.name} (ID: ${chapterId})`);
      } catch (createError) {
        console.error(`❌ 创建分会 ${chapter.name} 失败:`, createError);
      }
    }

    console.log(`初始化完成，共创建 ${createdChapters.length} 个分会:`, createdChapters);
  } catch (error) {
    console.error('初始化默认马来西亚地方分会失败:', error);
    throw error;
  }
};
