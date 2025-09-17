# PDF.js Worker CORS 错误修复指南

## 🚨 问题描述

遇到以下错误：
```
Access to script at 'https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.js' from origin 'http://localhost:3000' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

以及：
```
Warning: Setting up fake worker.
Error: Setting up fake worker failed: "Failed to fetch dynamically imported module: https://unpkg.com/pdfjs-dist@5.4.149/build/pdf.worker.min.js".
```

## 🔍 根本原因

1. **CORS策略限制**: 浏览器阻止从 `http://localhost:3000` 访问外部CDN资源
2. **Worker文件路径错误**: unpkg.com上的worker文件路径可能不正确
3. **开发环境限制**: 在开发环境中使用外部CDN资源会遇到跨域问题

## 🔧 修复方案

### 方案1: 使用本地Worker文件（推荐）

#### 1. 更新PDF解析服务配置

在 `src/services/pdfParseService.ts` 中：

```typescript
// Configure PDF.js worker - use local worker to avoid CORS issues
if (typeof window !== 'undefined') {
  try {
    // Use local worker file from node_modules to avoid CORS issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
    console.log('✅ PDF.js worker配置成功:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  } catch (error) {
    // Fallback to CDN if local worker is not available
    console.warn('⚠️ 无法加载本地PDF.js worker，使用CDN版本:', error);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  }
}
```

#### 2. 更新Vite配置

在 `vite.config.ts` 中：

```typescript
export default defineConfig({
  // ... 其他配置
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  },
  worker: {
    format: 'es'
  },
  assetsInclude: ['**/*.worker.js', '**/*.worker.mjs']
})
```

### 方案2: 使用Public目录托管Worker文件

#### 1. 创建public目录（如果不存在）
```bash
mkdir public
```

#### 2. 复制worker文件到public目录
```bash
cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
```

#### 3. 更新worker配置
```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
```

### 方案3: 使用Vite插件处理Worker

#### 1. 安装vite-plugin-worker
```bash
npm install vite-plugin-worker --save-dev
```

#### 2. 更新vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import worker from 'vite-plugin-worker'

export default defineConfig({
  plugins: [
    react(),
    worker()
  ],
  // ... 其他配置
})
```

## 🧪 测试修复

### 1. 启动开发服务器
```bash
npm run dev
```

### 2. 测试PDF上传功能
1. 访问PDF解读页面
2. 上传一个PDF文件
3. 检查浏览器控制台是否还有CORS错误

### 3. 检查控制台输出
应该看到：
```
✅ PDF.js worker配置成功: [worker文件路径]
🔄 开始解析PDF文件: [文件名]
📄 PDF文档加载完成: {pages: X, fingerprint: "..."}
✅ PDF解析完成: {pages: X, textLength: X, hasMetadata: true}
```

## 🔍 故障排除

### 常见问题

#### 1. Worker文件未找到
```
Error: Failed to load worker script
```
**解决方案**: 检查node_modules中是否存在worker文件，确保路径正确

#### 2. 仍然出现CORS错误
```
Access to script has been blocked by CORS policy
```
**解决方案**: 
- 确保使用本地worker文件而不是CDN
- 检查Vite配置是否正确
- 重启开发服务器

#### 3. Worker加载超时
```
Worker timeout
```
**解决方案**: 
- 检查网络连接
- 尝试使用更小的PDF文件测试
- 检查浏览器控制台是否有其他错误

### 调试步骤

1. **检查Worker文件路径**
   ```typescript
   console.log('Worker path:', pdfjsLib.GlobalWorkerOptions.workerSrc);
   ```

2. **检查PDF.js版本**
   ```typescript
   console.log('PDF.js version:', pdfjsLib.version);
   ```

3. **检查文件是否存在**
   ```bash
   ls node_modules/pdfjs-dist/build/pdf.worker.min.mjs
   ```

4. **检查浏览器网络面板**
   - 打开开发者工具
   - 查看Network面板
   - 确认worker文件是否成功加载

## 📋 部署清单

- [ ] 更新PDF解析服务配置
- [ ] 更新Vite配置
- [ ] 测试PDF上传功能
- [ ] 检查控制台错误
- [ ] 验证PDF解析结果
- [ ] 更新相关文档

## 🎯 预期结果

修复后应该能够：
- ✅ 成功加载PDF.js worker
- ✅ 无CORS错误
- ✅ 正常解析PDF文件
- ✅ 提取文本内容
- ✅ 显示解析结果

## 🔗 相关链接

- [PDF.js 官方文档](https://mozilla.github.io/pdf.js/)
- [PDF.js Worker 配置](https://mozilla.github.io/pdf.js/getting_started/#download)
- [Vite Worker 支持](https://vitejs.dev/guide/features.html#web-workers)
- [CORS 策略说明](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## 📝 注意事项

1. **文件格式**: PDF.js 5.x版本使用`.mjs`格式的worker文件
2. **开发环境**: 本地开发时建议使用本地worker文件
3. **生产环境**: 生产环境可以考虑使用CDN，但需要确保CORS配置正确
4. **版本兼容**: 确保PDF.js版本与worker文件版本匹配
