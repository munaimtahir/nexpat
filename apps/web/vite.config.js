import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces (allows external access)
    port: 5173,
    proxy: {
      // Forward /api to Django backend in development
      // This eliminates CORS issues during local development
      '/api': {
        target: process.env.VITE_BACKEND_PROXY || 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
})
