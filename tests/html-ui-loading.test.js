import test from 'node:test';
import assert from 'node:assert/strict';

function makeImageClass({ fail = () => false } = {}) {
  return class FakeImage {
    static created = 0;
    static decoded = 0;
    constructor() {
      FakeImage.created++;
      this.onload = null;
      this.onerror = null;
      this.decoding = '';
      this.decode = async () => { FakeImage.decoded++; };
    }
    set src(value) {
      this._src = value;
      queueMicrotask(() => {
        if (fail(value)) this.onerror?.(new Error('network failure'));
        else this.onload?.();
      });
    }
    get src() { return this._src; }
  };
}

test('pré-carregador baixa e decodifica cada imagem HTML e informa progresso', async () => {
  const previousImage = globalThis.Image;
  const FakeImage = makeImageClass();
  globalThis.Image = FakeImage;
  try {
    const { preloadHtmlUiAssets } = await import('../src/core/lifecycle/HtmlUiAssetPreloader.js?success');
    const progress = [];
    const result = await preloadHtmlUiAssets((loaded, total, path) => progress.push({ loaded, total, path }));
    assert.ok(result.total >= 8);
    assert.equal(result.images.size, result.total);
    assert.equal(FakeImage.created, result.total);
    assert.equal(FakeImage.decoded, result.total);
    assert.equal(progress[0].loaded, 0);
    assert.equal(progress.at(-1).loaded, result.total);

    await preloadHtmlUiAssets();
    assert.equal(FakeImage.created, result.total, 'uma segunda chamada reutiliza as imagens já carregadas');
  } finally {
    if (previousImage === undefined) delete globalThis.Image;
    else globalThis.Image = previousImage;
  }
});

test('falha de uma imagem obrigatória rejeita o preload em vez de liberar a UI incompleta', async () => {
  const previousImage = globalThis.Image;
  const FakeImage = makeImageClass({ fail: url => url.includes('/skin_2/perfil.png') });
  globalThis.Image = FakeImage;
  try {
    const { preloadHtmlUiAssets } = await import('../src/core/lifecycle/HtmlUiAssetPreloader.js?failure');
    await assert.rejects(preloadHtmlUiAssets(), /Não foi possível carregar a imagem da interface/);
  } finally {
    if (previousImage === undefined) delete globalThis.Image;
    else globalThis.Image = previousImage;
  }
});
