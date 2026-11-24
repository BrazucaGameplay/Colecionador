import { defineConfig } from 'vite';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  // GitHub Pages usa subcaminho; builds locais/Capacitor usam caminhos relativos.
  base: isGitHubPages ? '/Colecionador/' : './',
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
