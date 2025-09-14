/**
 * 活动数据初始化脚本
 * 用于创建演示数据和测试数据
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

// Firebase配置 - 请替换为您的实际配置
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 演示项目户口数据 - 已清空
const demoProjectAccounts = [];

// 演示活动数据 - 已清空
const demoEvents = [];

// 初始化函数
async function initEventData() {
  try {
    console.log('开始初始化项目户口和活动数据...');
    
    // 创建项目户口
    const projectAccountIds = [];
    for (const accountData of demoProjectAccounts) {
      const docRef = await addDoc(collection(db, 'projectAccounts'), accountData);
      projectAccountIds.push(docRef.id);
      console.log(`项目户口创建成功: ${accountData.name} (ID: ${docRef.id})`);
    }
    
    // 创建活动并关联项目户口
    for (let i = 0; i < demoEvents.length; i++) {
      const eventData = { ...demoEvents[i] };
      // 为前两个活动关联项目户口
      if (i < 2 && projectAccountIds[i]) {
        eventData.projectAccountId = projectAccountIds[i];
      }
      
      const docRef = await addDoc(collection(db, 'events'), eventData);
      console.log(`活动创建成功: ${eventData.title} (ID: ${docRef.id})`);
    }
    
    console.log('项目户口和活动数据初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('初始化数据失败:', error);
    process.exit(1);
  }
}

// 运行初始化
initEventData();
