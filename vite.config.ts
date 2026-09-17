import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '0.0.0.0',
    port: 5050,
    strictPort: false,
    proxy: { '/api': loadEnv(mode, process.cwd(), 'VITE_').VITE_API_TARGET || 'http://127.0.0.1:5055' },
  },
  preview: {
    host: '0.0.0.0',
    port: 5050,
    strictPort: false,
  },
}));
