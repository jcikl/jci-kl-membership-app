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
  console.log('开始初始化权限数据...');
  
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
    console.log('权限数据初始化完成');
  } catch (error) {
    console.error('权限数据初始化失败:', error);
    throw error;
  }
};

// 初始化角色数据
export const initRoles = async () => {
  console.log('开始初始化角色数据...');
  
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
    console.log('角色数据初始化完成');
  } catch (error) {
    console.error('角色数据初始化失败:', error);
    throw error;
  }
};

// 初始化策略配置
export const initPolicy = async () => {
  console.log('开始初始化策略配置...');
  
  try {
    const docRef = doc(db, 'rbac_policies', 'default');
    await setDoc(docRef, {
      ...POLICY_SEED_DATA,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log('策略配置初始化完成');
  } catch (error) {
    console.error('策略配置初始化失败:', error);
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
    console.error('检查数据存在性失败:', error);
    return { permissionsExist: false, rolesExist: false };
  }
};

// 完整初始化
export const initRBAC = async (force = false) => {
  console.log('开始初始化 RBAC 系统...');
  
  try {
    if (!force) {
      const { permissionsExist, rolesExist } = await checkDataExists();
      
      if (permissionsExist || rolesExist) {
        console.log('RBAC 数据已存在，跳过初始化');
        return;
      }
    }
    
    await initPermissions();
    await initRoles();
    await initPolicy();
    
    console.log('RBAC 系统初始化完成');
  } catch (error) {
    console.error('RBAC 系统初始化失败:', error);
    throw error;
  }
};

// 在开发环境中自动初始化
if (import.meta.env.DEV) {
  // 延迟执行，确保 Firebase 已初始化
  setTimeout(() => {
    initRBAC().catch(console.error);
  }, 2000);
}
