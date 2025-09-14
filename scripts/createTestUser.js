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

// 测试用户信息
const testUsers = [
  {
    email: 'admin@jcikl.com',
    password: 'admin123456',
    role: 'super_admin'
  },
  {
    email: 'test@jcikl.com',
    password: 'test123456',
    role: 'member'
  },
  {
    email: 'developer@jcikl.com',
    password: 'dev123456',
    role: 'developer'
  }
];

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
  console.log('🚀 开始创建测试用户...');
  console.log('=====================================');
  
  for (const user of testUsers) {
    await createTestUser(user.email, user.password);
    console.log('-------------------------------------');
  }
  
  console.log('✅ 测试用户创建完成！');
  console.log('=====================================');
  console.log('📋 可用测试账户:');
  testUsers.forEach(user => {
    console.log(`邮箱: ${user.email} | 密码: ${user.password} | 角色: ${user.role}`);
  });
  console.log('=====================================');
  console.log('💡 现在你可以使用这些账户登录应用了！');
}

// 运行脚本
createAllTestUsers().catch(console.error);
