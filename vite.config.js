import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접근 가능
    port: 5173,
    strictPort: true,
    cors: true, // CORS 활성화
    headers: {
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
      'Cross-Origin-Opener-Policy': 'unsafe-none'
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
