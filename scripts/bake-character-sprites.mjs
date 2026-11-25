import { createServer } from 'vite';
import { chromium } from 'playwright';
import { mkdir, rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'public/assets/characters/sprites/skin_01');
const sourceDirectory = path.join(root, 'public/assets/characters/skin_01/animation-sources');

const models = [
  {
    path: 'assets/characters/skin_01/animation-sources/animacoes_basicas.glb',
    expected: ['Running', 'Dead', 'Flirty_Strut', 'Idle']
  },
  {
    path: 'assets/characters/skin_01/animation-sources/animacoes_batalha.glb',
    expected: ['Combate_dd', 'Salto', 'Right_Hand_Sword_Slash']
  }
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

const server = await createServer({
  configFile: path.join(root, 'vite.config.js'),
  server: { host: '127.0.0.1', port: 4179, strictPort: true }
});
let browser;
let completed = false;
try {
  await server.listen();
  const base = server.config.base || '/';
  browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl','--ignore-gpu-blocklist','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage']
  });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 900, height: 900 } });
  const page = await context.newPage();
  page.on('console', (message) => { if (message.type() === 'error') console.error('[browser]', message.text()); });
  page.on('pageerror', (error) => console.error('[browser page error]', error));
  const downloads = [];
  page.on('download', async (download) => {
    const filename = path.basename(download.suggestedFilename());
    await download.saveAs(path.join(output, filename));
    downloads.push(filename);
  });

  await page.goto(`http://127.0.0.1:4179${base}tools/character-baker/?automation=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.__characterBaker), { timeout: 30000 });

  const summary = [];
  for (const model of models) {
    console.log('Loading', model.path);
    const clips = await page.evaluate(async (value) => window.__characterBaker.loadModel(value), model.path);
    const actual = clips.map((clip) => clip.name).sort();
    const expected = [...model.expected].sort();
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Clips divergentes em ${model.path}. Esperados: ${expected.join(', ')}. Encontrados: ${actual.join(', ')}`);
    }
    const before = downloads.length;
    await page.evaluate(async () => window.__characterBaker.bakeAll());
    await page.waitForFunction((count) => {
      const status = document.getElementById('status')?.textContent || '';
      return status === `Concluído: ${count}/${count} animações exportadas.`;
    }, clips.length, { timeout: 240000 });

    const expectedDownloads = clips.length * 2;
    const deadline = Date.now() + 30000;
    while (downloads.length - before < expectedDownloads && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (downloads.length - before !== expectedDownloads) {
      throw new Error(`Downloads incompletos para ${model.path}: ${downloads.length - before}/${expectedDownloads}`);
    }
    summary.push({ model: model.path, animations: clips.map((clip) => clip.name) });
  }

  const generated = await readdir(output);
  const pngs = generated.filter((name) => name.endsWith('.png'));
  const jsons = generated.filter((name) => name.endsWith('.json'));
  if (pngs.length !== 7 || jsons.length !== 7 || generated.length !== 14) {
    throw new Error(`Saída inconsistente: ${pngs.length} PNGs e ${jsons.length} JSONs; esperado 7 de cada.`);
  }
  for (const file of generated) {
    if ((await stat(path.join(output, file))).size < 100) throw new Error('Arquivo de saída vazio: ' + file);
  }
  console.log(JSON.stringify({ summary, generated: generated.length, output }, null, 2));
  completed = true;
  await context.close();
} finally {
  if (browser) await browser.close();
  await server.close();
  if (completed) await rm(sourceDirectory, { recursive: true, force: true });
}
