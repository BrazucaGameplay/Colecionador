import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { registerPlayerSpriteAnimations, attachPlayerSpriteRegistry } from '../src/rendering/characters/CharacterSpriteAssetLoader.js';
import SkinManager from '../src/rendering/characters/SkinManager.js';
import { CHARACTER_SKINS } from '../src/rendering/characters/CharacterSkinCatalog.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const skinDirectory = path.join(root, 'public/assets/characters/sprites/skin_2');

test('Skin 02 registra as quatro animações reais e fica selecionável no runtime', async () => {
  const metadataByKey = new Map();
  const textureByKey = new Map();
  const createdAnimations = new Set();

  for (const [animation, basename] of Object.entries(CHARACTER_SKINS.skin_2.animations)) {
    const key = 'character-animation-skin_2-' + animation;
    const metadata = JSON.parse(await readFile(path.join(skinDirectory, basename + '.json'), 'utf8'));
    metadataByKey.set(key + '-meta', metadata);
    textureByKey.set(key, {
      frames: new Set(),
      has(name) { return this.frames.has(name); },
      add(name) { this.frames.add(name); }
    });
  }

  const registryValues = new Map();
  const sharedRegistry = {
    set(key, value) { registryValues.set(key, value); },
    get(key) { return registryValues.get(key); }
  };
  const scene = {
    registry: sharedRegistry,
    characterAnimationsBySkin: new Map(),
    playerFramePivots: new Map(),
    cache: { json: { get: key => metadataByKey.get(key) } },
    textures: { get: key => textureByKey.get(key) },
    anims: {
      exists: key => createdAnimations.has(key),
      create: config => createdAnimations.add(config.key)
    }
  };

  registerPlayerSpriteAnimations(scene);

  assert.ok(scene.characterAnimationsBySkin.has('skin_2'),
    'Skin 02 precisa ser publicada no mapa de animações carregadas');
  assert.equal(createdAnimations.size, 32,
    'quatro animações × oito direções devem produzir 32 animações Phaser');

  // Simula a cena Game, que é outra instância, lendo o registry compartilhado.
  const gameScene = { registry: sharedRegistry };
  attachPlayerSpriteRegistry(gameScene);
  assert.notEqual(gameScene, scene, 'Preload e Game precisam ser instâncias distintas');
  assert.equal(gameScene.characterAnimationsBySkin, scene.characterAnimationsBySkin);
  assert.equal(gameScene.playerFramePivots, scene.playerFramePivots);

  const manager = new SkinManager({
    selectedSkin: 'skin_01',
    assetValidator: id => gameScene.characterAnimationsBySkin.has(id)
  });
  assert.equal(manager.isSelectable('skin_2'), true,
    'SkinManager precisa reconhecer Skin 02 como disponível após o registro');
  assert.equal(manager.selectSkin('skin_2').changed, true);
  assert.equal(manager.getSelectedSkin(), 'skin_2');
});

test('atlas da Skin 02 têm quadros únicos e completos nas oito direções', async () => {
  for (const basename of Object.values(CHARACTER_SKINS.skin_2.animations)) {
    const metadata = JSON.parse(await readFile(path.join(skinDirectory, basename + '.json'), 'utf8'));
    assert.equal(metadata.frameSize.width, 384);
    assert.equal(metadata.frameSize.height, 384);
    assert.equal(metadata.directionCount, 8);
    for (let direction = 0; direction < 8; direction++) {
      const frames = metadata.frames.filter(frame => frame.direction === direction);
      assert.equal(frames.length, metadata.frameCount, basename + ' direção ' + direction);
      assert.equal(new Set(frames.map(frame => frame.frame)).size, metadata.frameCount,
        basename + ' índices duplicados na direção ' + direction);
    }
  }
});
