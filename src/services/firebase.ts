import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { GLOBAL_SYSTEM_CONFIG } from '@/config/globalSystemSettings';

// Firebase 配置
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化服务
export const auth = getAuth(app);
export const db = getFirestore(app);

// 初始化 Storage，添加配置以避免CORS问题
export const storage = getStorage(app, 'gs://jci-kl-membership-app.firebasestorage.app');

// 显式开启时连接本地 Firebase 模拟器
const useEmulators = String(import.meta.env.VITE_USE_FIREBASE_EMULATORS || '').toLowerCase() === 'true';
if (useEmulators) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
  }
}

/**
 * 上传文件到Cloudinary并获取URL
 * @param path 文件路径（用于生成唯一文件名）
 * @param file 要上传的文件
 * @returns Promise<string> 返回文件的URL
 */
export const uploadFileAndGetUrl = async (path: string, file: File): Promise<string> => {
  try {
    const cloudinaryConfig = GLOBAL_SYSTEM_CONFIG.UPLOAD_CONFIG.cloudinary;
    
    // 验证Cloudinary配置
    if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
      throw new Error('Cloudinary配置不完整');
    }

    // 验证文件类型
    const allowedTypes = GLOBAL_SYSTEM_CONFIG.UPLOAD_CONFIG.allowedTypes;
    if (!allowedTypes.includes(file.type as any)) {
      throw new Error(`不支持的文件类型: ${file.type}`);
    }

    // 验证文件大小
    const maxFileSize = GLOBAL_SYSTEM_CONFIG.UPLOAD_CONFIG.maxFileSize;
    if (file.size > maxFileSize) {
      throw new Error(`文件大小不能超过 ${Math.round(maxFileSize / 1024 / 1024)}MB`);
    }

    // 创建FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    
    // 添加文件夹路径
    if (cloudinaryConfig.folder) {
      formData.append('folder', `${cloudinaryConfig.folder}/${path}`);
    }

    // 上传到Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上传失败: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error('上传失败：未获取到文件URL');
    }
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
};

export default app;

