import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import fs from 'fs';

// Simple plugin to copy sw.js to dist root
function copyServiceWorker() {
  return {
    name: 'copy-service-worker',
    closeBundle() {
      if (fs.existsSync('public/sw.js')) {
        fs.copyFileSync('public/sw.js', 'dist/sw.js');
      }
    }
  };
}

export default defineConfig(() => {
  return {
    base: '/ECO/',
    plugins: [react(), tailwindcss(), copyServiceWorker()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
