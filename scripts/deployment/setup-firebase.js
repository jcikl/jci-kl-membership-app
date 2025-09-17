#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 设置 Firebase 项目...\n');

// 检查是否已安装 Firebase CLI
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log('✅ Firebase CLI 已安装');
} catch (error) {
  console.log('❌ Firebase CLI 未安装，正在安装...');
  execSync('npm install -g firebase-tools', { stdio: 'inherit' });
  console.log('✅ Firebase CLI 安装完成');
}

// 检查是否已登录
try {
  execSync('firebase projects:list', { stdio: 'ignore' });
  console.log('✅ 已登录 Firebase');
} catch (error) {
  console.log('❌ 请先登录 Firebase');
  console.log('运行: firebase login');
  process.exit(1);
}

// 初始化 Firebase 项目
console.log('\n🚀 初始化 Firebase 项目...');
try {
  execSync('firebase init firestore hosting emulators', { stdio: 'inherit' });
  console.log('✅ Firebase 项目初始化完成');
} catch (error) {
  console.log('⚠️  Firebase 项目可能已经初始化');
}

// 部署安全规则
console.log('\n🔒 部署 Firestore 安全规则...');
try {
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  console.log('✅ 安全规则部署完成');
} catch (error) {
  console.log('❌ 安全规则部署失败:', error.message);
}

// 部署索引
console.log('\n📊 部署 Firestore 索引...');
try {
  execSync('firebase deploy --only firestore:indexes', { stdio: 'inherit' });
  console.log('✅ 索引部署完成');
} catch (error) {
  console.log('❌ 索引部署失败:', error.message);
}

console.log('\n🎉 Firebase 设置完成！');
console.log('\n下一步:');
console.log('1. 在 Firebase Console 中启用 Authentication');
console.log('2. 配置邮箱/密码登录');
console.log('3. 运行 npm run dev 启动开发服务器');
