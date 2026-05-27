import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 63840,
    strictPort: true,
    proxy: {
      '/connector-api': {
        target: 'https://connector-host.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/connector-api/, ''),
      },
      '/api': {
        target: 'https://imxirmbzqcmacqukzvar.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});
