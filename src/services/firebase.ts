import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

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

export default app;

// 简单的上传工具函数
export const uploadFileAndGetUrl = async (path: string, file: File | Blob): Promise<string> => {
  const ref = storageRef(storage, path);
  await uploadBytes(ref, file);
  return await getDownloadURL(ref);
};
