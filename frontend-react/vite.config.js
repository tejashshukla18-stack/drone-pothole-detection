import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const backend = env.VITE_BACKEND_URL || 'http://127.0.0.1:3000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': { target: backend, changeOrigin: true },
        '/media': { target: backend, changeOrigin: true },
        '/dataset': { target: backend, changeOrigin: true },
      },
    },
  }
})
