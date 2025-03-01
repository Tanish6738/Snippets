import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()],
    define: {
      'process.env': process.env
    },
    optimizeDeps: {
      include: ['json-2-csv']
    },
    build: {
      rollupOptions: {
        external: ['json-2-csv', 'react-feather', 'react-draggable', 'react-resizable']
      }
    }
  };

  // Only add server proxy during development
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