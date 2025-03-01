import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    define: {
      'process.env': process.env
    },
    optimizeDeps: {
      // Remove json-2-csv from include
      include: []
    },
    build: {
      rollupOptions: {
      }
    }
  };

  if (command === 'serve') {
    config.server = {
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        }
      }
    };
  }

  return config;
});