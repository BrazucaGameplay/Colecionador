import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const layoutPath = 'src/world/map-layout/island-01.js';
const shapePath = 'src/world/IslandShape.js';
const terrainPath = 'public/assets/world/terrain/ilha_terreno.webp';
const outputPath = 'src/world/map-layout/island-01.validated.json';
const [layout, shape, terrain] = await Promise.all([
  readFile(layoutPath, 'utf8'),
  readFile(shapePath, 'utf8'),
  readFile(terrainPath)
]);

function readNumber(source, name) {
  const match = source.match(new RegExp(name + ':\\s*(\\d+(?:\\.\\d+)?)'));
  if (!match) throw new Error('Não foi possível ler ' + name + ' de IslandShape.js');
  return Number(match[1]);
}

const centerX = readNumber(shape, 'centerX');
const centerY = readNumber(shape, 'centerY');
const boundaryRadius = readNumber(shape, 'baseRadius') - readNumber(shape, 'inset');
const treeIds = [];
const seen = new Set();
for (const line of layout.split(/\r?\n/)) {
  const idMatch = line.match(/^\s*\{ id: '([^']+)'/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const x = Number(line.match(/\bx: (\d+)/)?.[1]);
  const y = Number(line.match(/\by: (\d+)/)?.[1]);
  const height = Number(line.match(/\btargetHeight: (\d+)/)?.[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(height)) {
    throw new Error('Definição incompleta da árvore: ' + id);
  }
  if (seen.has(id)) throw new Error('ID de árvore duplicado: ' + id);
  seen.add(id);
  // A silhueta usa uma elipse conservadora incluindo copa, tronco e margem.
  const radiusX = height * 0.43 + 24;
  const radiusY = height * 0.47 + 24;
  const treeCenterY = y - height * 0.52;
  for (const ring of [0.55, 0.82, 1]) {
    const count = ring === 1 ? 16 : 8;
    for (let index = 0; index < count; index++) {
      const angle = index / count * Math.PI * 2;
      const sampleX = x + Math.cos(angle) * radiusX * ring;
      const sampleY = treeCenterY + Math.sin(angle) * radiusY * ring;
      if (Math.hypot(sampleX - centerX, sampleY - centerY) > boundaryRadius) {
        throw new Error('Árvore fora da ilha: ' + id + ' (x=' + x + ', y=' + y + ')');
      }
    }
  }
  treeIds.push(id);
}
if (!treeIds.length) throw new Error('Nenhuma árvore encontrada no layout.');
const manifest = {
  validatorVersion: 1,
  treeIds,
  terrainSha256: createHash('sha256').update(terrain).digest('hex'),
  layoutSha256: createHash('sha256').update(layout).digest('hex')
};
await writeFile(outputPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('Layout de árvores validado no build: ' + treeIds.length + ' posições; hashes do terreno e do layout registrados.');
