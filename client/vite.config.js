import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // en développement, les appels /api partent vers le serveur Express
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: { manualChunks: { three: ['three'], react: ['react', 'react-dom', 'react-router-dom'] } },
    },
  },
  test: { environment: 'node' },
});
