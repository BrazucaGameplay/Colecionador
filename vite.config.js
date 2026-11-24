import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages publica este projeto no subcaminho /Colecionador/.
  base: '/Colecionador/',
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
