#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌐 部署到 Netlify...\n');

// 检查是否已安装 Netlify CLI
try {
  execSync('netlify --version', { stdio: 'ignore' });
  console.log('✅ Netlify CLI 已安装');
} catch (error) {
  console.log('❌ Netlify CLI 未安装，正在安装...');
  execSync('npm install -g netlify-cli', { stdio: 'inherit' });
  console.log('✅ Netlify CLI 安装完成');
}

// 构建项目
console.log('🔨 构建项目...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ 项目构建完成');
} catch (error) {
  console.log('❌ 项目构建失败:', error.message);
  process.exit(1);
}

// 检查是否已登录 Netlify
try {
  execSync('netlify status', { stdio: 'ignore' });
  console.log('✅ 已登录 Netlify');
} catch (error) {
  console.log('❌ 请先登录 Netlify');
  console.log('运行: netlify login');
  process.exit(1);
}

// 部署到 Netlify
console.log('\n🚀 部署到 Netlify...');
try {
  execSync('netlify deploy --prod --dir=dist', { stdio: 'inherit' });
  console.log('✅ 部署完成');
} catch (error) {
  console.log('❌ 部署失败:', error.message);
  process.exit(1);
}

console.log('\n🎉 部署成功！');
console.log('你的应用现在可以在 Netlify 上访问了。');
