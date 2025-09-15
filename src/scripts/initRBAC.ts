// RBAC 初始化脚本
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { PERMISSION_SEED_DATA, ROLE_SEED_DATA, POLICY_SEED_DATA } from '@/data/rbacSeedData';

// 初始化权限数据
export const initPermissions = async () => {
  try {
    const batch = writeBatch(db);
    
    for (const permission of PERMISSION_SEED_DATA) {
      const docRef = doc(collection(db, 'rbac_permissions'));
      batch.set(docRef, {
        ...permission,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
  } catch (error) {
    throw error;
  }
};

// 初始化角色数据
export const initRoles = async () => {
  try {
    const batch = writeBatch(db);
    
    for (const role of ROLE_SEED_DATA) {
      const docRef = doc(collection(db, 'rbac_roles'));
      batch.set(docRef, {
        ...role,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    await batch.commit();
  } catch (error) {
    throw error;
  }
};

// 初始化策略配置
export const initPolicy = async () => {
  try {
    const docRef = doc(db, 'rbac_policies', 'default');
    await setDoc(docRef, {
      ...POLICY_SEED_DATA,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    throw error;
  }
};

// 检查数据是否已存在
export const checkDataExists = async () => {
  try {
    const [permissionsSnapshot, rolesSnapshot] = await Promise.all([
      getDocs(collection(db, 'rbac_permissions')),
      getDocs(collection(db, 'rbac_roles'))
    ]);
    
    return {
      permissionsExist: !permissionsSnapshot.empty,
      rolesExist: !rolesSnapshot.empty
    };
  } catch (error) {
    return { permissionsExist: false, rolesExist: false };
  }
};

// 完整初始化
export const initRBAC = async (force = false) => {
  try {
    if (!force) {
      const { permissionsExist, rolesExist } = await checkDataExists();
      
      if (permissionsExist || rolesExist) {
        return;
      }
    }
    
    await initPermissions();
    await initRoles();
    await initPolicy();
  } catch (error) {
    throw error;
  }
};

// 在开发环境中自动初始化
if (import.meta.env.DEV) {
  // 延迟执行，确保 Firebase 已初始化
  setTimeout(() => {
    initRBAC().catch(() => {});
  }, 2000);
}
