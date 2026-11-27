import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTerrainPixels } from '../src/world/navigation/TerrainMaskExtractor.js';
import { createIslandNavigation } from '../src/world/navigation/IslandNavigationFactory.js';

function makeCanvasFactory(alpha = 255) {
  const calls = [];
  const factory = size => {
    const canvas = {
      width: size,
      height: size,
      getContext() {
        return {
          clearRect() {},
          drawImage(source, x, y, width, height) {
            calls.push({ source, x, y, width, height });
          },
          getImageData(x, y, width, height) {
            const data = new Uint8ClampedArray(width * height * 4);
            for (let i = 0; i < data.length; i += 4) data[i + 3] = alpha;
            return { data };
          }
        };
      }
    };
    return canvas;
  };
  return { factory, calls };
}

test('extrai a máscara da textura já carregada sem rede ou armazenamento', () => {
  const source = { width: 2048, height: 1024 };
  const { factory, calls } = makeCanvasFactory(255);
  const result = extractTerrainPixels(source, { canvasFactory: factory });
  assert.equal(result.width, 1024);
  assert.equal(result.height, 1024);
  assert.equal(result.pixels.length, 1024 * 1024 * 4);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].source, source);
});

test('a extração libera o canvas temporário mesmo quando a leitura falha', () => {
  let canvas;
  assert.throws(() => extractTerrainPixels({ width: 64, height: 64 }, {
    canvasFactory: size => {
      canvas = {
        width: size, height: size,
        getContext: () => ({
          clearRect() {}, drawImage() {},
          getImageData() { throw new Error('read failed'); }
        })
      };
      return canvas;
    }
  }), /read failed/);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test('factory entrega navegação com a grade derivada da textura', () => {
  const { factory } = makeCanvasFactory(255);
  const navigation = createIslandNavigation({
    width: 96, height: 96,
    terrainSource: { width: 4, height: 4 },
    maskOptions: { canvasFactory: factory, maxSize: 4 }
  });
  assert.ok(navigation.walkableGrid instanceof Uint8Array);
  assert.equal(navigation.walkableGrid.length, navigation.cols * navigation.rows);
  assert.ok(navigation.walkableGrid.every(value => value === 1));
});

test('factory rejeita textura inválida sem iniciar qualquer acesso externo', () => {
  assert.throws(() => createIslandNavigation({
    width: 96, height: 96, terrainSource: null
  }), /Textura do terreno inválida/);
});
