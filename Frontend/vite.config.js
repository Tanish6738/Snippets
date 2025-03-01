import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  server: {
    proxy: {
      '/api': {
        target: import.meta.env.VITE_API_URL,
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
