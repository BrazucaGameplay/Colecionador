import test from 'node:test';
import assert from 'node:assert/strict';
import TreeTexturePipeline, {createTreeTextureLayout,nextPowerOfTwo} from '../src/rendering/world/TreeTexturePipeline.js';

test('suporte das árvores usa dimensões POT e frames dentro dos limites',()=>{
 assert.equal(nextPowerOfTwo(256),256);assert.equal(nextPowerOfTwo(384),512);assert.equal(nextPowerOfTwo(640),1024);assert.throws(()=>nextPowerOfTwo(0),/Dimensão/);
 for(const [w,h] of [[256,256],[384,384],[640,640],[512,256]]){
  const p=createTreeTextureLayout(w,h);assert.equal(p.canvasWidth&(p.canvasWidth-1),0);assert.equal(p.canvasHeight&(p.canvasHeight-1),0);
  assert.ok(p.x>=0&&p.y>=0&&p.frameWidth>0&&p.frameHeight>0);assert.ok(p.x+p.frameWidth<=p.canvasWidth&&p.y+p.frameHeight<=p.canvasHeight);
 }
});
test('frame mantém proporção e reserva margem de proteção',()=>{
 const p=createTreeTextureLayout(256,256);assert.deepEqual([p.canvasWidth,p.canvasHeight,p.frameWidth,p.frameHeight],[256,256,252,252]);
 const q=createTreeTextureLayout(384,256);assert.deepEqual([q.canvasWidth,q.canvasHeight],[512,256]);assert.ok(Math.abs(q.frameWidth/q.frameHeight-1.5)<0.01);
});


test('árvores usam mipmaps com seleção do nível mais próximo e restauram o renderer', () => {
  const previousDocument = globalThis.document;
  const previousMipmaps = 'LINEAR_MIPMAP_LINEAR';
  let filterDuringCreation = 'unset';
  globalThis.document = {
    createElement() {
      return {
        width: 0, height: 0,
        getContext() {
          return {
            clearRect() {}, drawImage() {},
            imageSmoothingEnabled: false,
            imageSmoothingQuality: 'low'
          };
        }
      };
    }
  };
  const renderer = {
    gl: { LINEAR_MIPMAP_LINEAR: 9987, LINEAR_MIPMAP_NEAREST: 9985 },
    mipmapFilter: previousMipmaps
  };
  const source = { width: 256, height: 256 };
  const texture = { add() {} };
  const scene = {
    game: { renderer },
    textures: {
      get() { return { getSourceImage: () => source }; },
      remove() {},
      addCanvas() { filterDuringCreation = renderer.mipmapFilter; return texture; }
    }
  };

  try {
    const profiles = new TreeTexturePipeline(scene).prepare(['tree']);
    assert.equal(filterDuringCreation, 9985, 'deve selecionar o mipmap mais próximo');
    assert.equal(renderer.mipmapFilter, previousMipmaps, 'a configuração global precisa ser restaurada');
    assert.equal(profiles.tree.mipmapsEnabled, true);
    assert.equal(profiles.tree.minificationFilter, 'LINEAR_MIPMAP_NEAREST');
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});

test('fallback sem WebGL mantém filtro linear sem mipmaps', () => {
  const previousDocument = globalThis.document;
  globalThis.document = {
    createElement() {
      return { width: 0, height: 0, getContext() { return { clearRect() {}, drawImage() {} }; } };
    }
  };
  const scene = {
    game: { renderer: {} },
    textures: {
      get() { return { getSourceImage: () => ({ width: 256, height: 256 }) }; },
      remove() {},
      addCanvas() { return { add() {} }; }
    }
  };
  try {
    const profiles = new TreeTexturePipeline(scene).prepare(['tree']);
    assert.equal(profiles.tree.mipmapsEnabled, false);
    assert.equal(profiles.tree.minificationFilter, 'LINEAR');
  } finally {
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
});
