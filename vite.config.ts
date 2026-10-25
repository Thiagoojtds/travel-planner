import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      }
    },
    watch: {
      usePolling: true,
      interval: 1000,
      ignored: ['**/.venv/**', '**/.git/**', '**/data/**', '**/prisma/**']
    }
  },
  preview: {
    port: 3000,
    host: true
  }
});
