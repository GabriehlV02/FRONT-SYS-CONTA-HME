import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: [{
      find: '@ui',
      replacement: fileURLToPath(new URL('./src/ui', import.meta.url)).replaceAll(String.fromCharCode(92), '/'),
    }],
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
