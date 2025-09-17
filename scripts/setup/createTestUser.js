/**
 * 创建测试用户脚本
 * 用于在Firebase中创建测试用户账户
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyDy1M3eebbk8UCgCScsb70q_bIB6XLxkYk",
  authDomain: "jci-kl-membership-app.firebaseapp.com",
  projectId: "jci-kl-membership-app",
  storageBucket: "jci-kl-membership-app.firebasestorage.app",
  messagingSenderId: "375759652962",
  appId: "1:375759652962:web:b749980280b8eb46a1e93b"
};

// 初始化Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// 测试用户信息 - 已清空
const testUsers = [];

async function createTestUser(email, password) {
  try {
    console.log(`正在创建用户: ${email}`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log(`✅ 用户创建成功: ${email}`);
    console.log(`用户ID: ${userCredential.user.uid}`);
    return userCredential;
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  用户已存在: ${email}`);
      // 尝试登录验证
      try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log(`✅ 用户验证成功: ${email}`);
      } catch (loginError) {
        console.log(`❌ 用户密码错误: ${email}`);
        console.log(`错误: ${loginError.message}`);
      }
    } else {
      console.log(`❌ 创建用户失败: ${email}`);
      console.log(`错误: ${error.message}`);
    }
  }
}

async function createAllTestUsers() {
  console.log('🚀 测试用户创建已清空...');
  console.log('=====================================');
  console.log('✅ 测试用户创建完成！');
  console.log('=====================================');
  console.log('📋 可用测试账户: 无');
  console.log('=====================================');
  console.log('💡 测试用户数据已清空！');
}

// 运行脚本
createAllTestUsers().catch(console.error);
