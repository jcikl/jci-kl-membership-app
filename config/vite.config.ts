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
    sourcemap: false, // Disable sourcemaps for production to reduce memory usage
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          charts: ['@ant-design/charts'],
          utils: ['dayjs', 'axios', 'crypto-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
    include: [
      'react',
      'react-dom',
      'antd',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
      'firebase/storage',
    ],
  },
  worker: {
    format: 'es'
  },
  define: {
    global: 'globalThis',
  },
  assetsInclude: ['**/*.worker.js', '**/*.worker.mjs'],
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
})
