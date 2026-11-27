import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const directory = process.argv[2] || 'public/assets/characters/sprites/skin_2';
const files = (await readdir(directory)).filter(name => name.endsWith('.json')).sort();
const expected = ['skin2-combat.json','skin2-dying.json','skin2-idle.json','skin2-running.json'];
if (JSON.stringify(files) !== JSON.stringify(expected)) throw new Error('Skin 02 deve conter exatamente quatro metadados: ' + files.join(', '));

for (const file of files) {
  const stem = file.slice(0,-5);
  const png = await readFile(path.join(directory,stem+'.png'));
  if (png.toString('hex',0,8) !== '89504e470d0a1a0a') throw new Error('PNG inválido: '+stem);
  const imageWidth = png.readUInt32BE(16), imageHeight = png.readUInt32BE(20);
  const meta = JSON.parse(await readFile(path.join(directory,file),'utf8'));
  if (meta.schema !== 'colecionador.sprite-atlas.v1') throw new Error('Schema inválido: '+file);
  if (meta.frameSize?.width !== 384 || meta.frameSize?.height !== 384) throw new Error('Quadros devem ser 384x384: '+file);
  if (meta.atlas?.width !== imageWidth || meta.atlas?.height !== imageHeight) throw new Error('Dimensões do PNG divergem dos metadados: '+file);
  if (imageWidth % 384 || imageHeight % 384) throw new Error('Atlas desalinhado com a grade 384x384: '+file);
  if (meta.directionCount !== 8 || !Number.isFinite(meta.fps) || meta.fps <= 0) throw new Error('Direções/FPS inválidos: '+file);
  if (meta.frames.length !== meta.frameCount * 8) throw new Error('Quantidade de quadros inválida: '+file);
  const counts = Array(8).fill(0);
  for (const frame of meta.frames) {
    if (!Number.isInteger(frame.direction) || frame.direction < 0 || frame.direction > 7) throw new Error('Direção inválida: '+file);
    if (frame.width !== 384 || frame.height !== 384 || frame.x < 0 || frame.y < 0 || frame.x+384 > imageWidth || frame.y+384 > imageHeight) throw new Error('Retângulo de quadro fora do atlas: '+file);
    if (!Number.isFinite(frame.pivotY) || frame.pivotY <= 0 || frame.pivotY > 0.96) throw new Error('Pivô inválido: '+file);
    counts[frame.direction]++;
  }
  if (counts.some(count=>count!==meta.frameCount)) throw new Error('Distribuição das oito direções inválida: '+file);
}
console.log('Skin 02 validada: quatro atlas 384x384 com oito direções.');
