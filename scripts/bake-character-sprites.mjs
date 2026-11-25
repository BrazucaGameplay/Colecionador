import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public/assets/characters/sprites/skin_01');
// Cada GLB mantém seu catálogo de movimentos; nenhum clip é copiado para outro modelo.
const models = [
  'assets/characters/skin_01/skin-padrão1.glb',
  'assets/characters/skin_01/skin_padrão2.glb',
  'assets/characters/skin_01/skin_padrão3.glb',
  'assets/characters/skin_01/skin_padrão4.glb',
  // Fonte com espada embutida: fornece ataque e morte para a migração 2D.
  'assets/characters/skin_01/character.glb'
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const server = await createServer({
  configFile: path.join(root, 'vite.config.js'),
  server: { host: '127.0.0.1', port: 4179, strictPort: true }
});
let browser;
try {
  await server.listen();
  const base = server.config.base || '/';
  browser = await chromium.launch({
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--disable-dev-shm-usage'
    ]
  });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 900, height: 900 } });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error') console.error('[browser]', message.text());
  });
  page.on('pageerror', (error) => console.error('[browser page error]', error));
  const downloads = [];
  page.on('download', async (download) => {
    const filename = path.basename(download.suggestedFilename());
    const destination = path.join(output, filename);
    await download.saveAs(destination);
    downloads.push(filename);
  });

  await page.goto(`http://127.0.0.1:4179${base}tools/character-baker/?automation=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__characterBaker), { timeout: 30000 });
  await page.waitForFunction(() => document.getElementById('status')?.textContent.includes('Modelo carregado.'), { timeout: 120000 });

  const summary = [];
  for (const modelPath of models) {
    console.log('Loading', modelPath);
    const clips = await page.evaluate(async (value) => window.__characterBaker.loadModel(value), modelPath);
    if (!clips.length) throw new Error('Nenhuma animação detectada em ' + modelPath);
    const before = downloads.length;
    await page.evaluate(async () => window.__characterBaker.bakeAll());
    await page.waitForFunction((count) => document.getElementById('status').textContent.includes('animações exportadas.'), clips.length, { timeout: 180000 });
    // Aguarda os downloads PNG/JSON deste modelo serem gravados.
    const expected = clips.length * 2;
    const deadline = Date.now() + 30000;
    while (downloads.length - before < expected && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (downloads.length - before !== expected) {
      throw new Error(`Downloads incompletos para ${modelPath}: ${downloads.length - before}/${expected}`);
    }
    summary.push({ model: modelPath, animations: clips.map((clip) => clip.name) });
  }

  const { readdir, stat } = await import('node:fs/promises');
  const files = await readdir(output);
  const pngs = files.filter((name) => name.endsWith('.png'));
  const jsons = files.filter((name) => name.endsWith('.json'));
  if (!pngs.length || pngs.length !== jsons.length) {
    throw new Error(`Saída inconsistente: ${pngs.length} PNGs e ${jsons.length} JSONs.`);
  }
  for (const file of [...pngs, ...jsons]) {
    const info = await stat(path.join(output, file));
    if (info.size < 100) throw new Error('Arquivo de saída vazio: ' + file);
  }
  console.log(JSON.stringify({ summary, generated: files.length, output }, null, 2));
  await context.close();
} finally {
  if (browser) await browser.close();
  await server.close();
}
