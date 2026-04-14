import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { defineConfig } from 'vite'

/** VITE_API_BASE_URL 未使用時、相対 /api をこのオリジンへ転送（dev / preview 両方） */
const apiDevProxy = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
  },
} as const

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: { ...apiDevProxy },
  },
  preview: {
    proxy: { ...apiDevProxy },
  },
})
