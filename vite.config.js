import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

export default defineConfig({
  // GitHub Pages publica este projeto no subcaminho /Colecionador/.
  base: '/Colecionador/',
  plugins: [
    {
      name: 'inject-app-version',
      transformIndexHtml(html) {
        return html.replaceAll('__APP_VERSION__', packageJson.version);
      }
    }
  ],
  server: {
    host: true,
    port: 5173
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
});
