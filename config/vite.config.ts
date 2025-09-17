import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@/modules': path.resolve(__dirname, '../src/modules'),
      '@/modules/finance': path.resolve(__dirname, '../src/modules/finance'),
      '@/modules/member': path.resolve(__dirname, '../src/modules/member'),
      '@/modules/event': path.resolve(__dirname, '../src/modules/event'),
      '@/modules/permission': path.resolve(__dirname, '../src/modules/permission'),
      '@/modules/award': path.resolve(__dirname, '../src/modules/award'),
      '@/modules/survey': path.resolve(__dirname, '../src/modules/survey'),
      '@/modules/image': path.resolve(__dirname, '../src/modules/image'),
      '@/modules/system': path.resolve(__dirname, '../src/modules/system'),
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist']
  },
  worker: {
    format: 'es'
  },
  define: {
    global: 'globalThis',
  },
  assetsInclude: ['**/*.worker.js', '**/*.worker.mjs']
})
