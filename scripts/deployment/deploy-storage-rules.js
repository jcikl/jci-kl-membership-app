#!/usr/bin/env node

/**
 * Firebase Storage 规则部署脚本
 * 用于部署Storage安全规则到Firebase项目
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始部署 Firebase Storage 规则...');

try {
  // 检查是否存在 storage.rules 文件
  const rulesPath = path.join(__dirname, 'storage.rules');
  if (!fs.existsSync(rulesPath)) {
    console.error('❌ 错误: storage.rules 文件不存在');
    process.exit(1);
  }

  // 检查是否安装了 Firebase CLI
  try {
    execSync('firebase --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ 错误: Firebase CLI 未安装');
    console.log('请运行: npm install -g firebase-tools');
    process.exit(1);
  }

  // 检查是否已登录 Firebase
  try {
    execSync('firebase projects:list', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ 错误: 请先登录 Firebase');
    console.log('请运行: firebase login');
    process.exit(1);
  }

  // 部署 Storage 规则
  console.log('📤 正在部署 Storage 规则...');
  execSync('firebase deploy --only storage', { stdio: 'inherit' });

  console.log('✅ Storage 规则部署成功!');
  console.log('🔧 现在可以测试图片上传功能了');

} catch (error) {
  console.error('❌ 部署失败:', error.message);
  process.exit(1);
}
