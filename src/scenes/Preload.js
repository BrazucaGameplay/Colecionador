import * as Phaser from 'phaser';
import { queuePlayerSpriteAssets, registerPlayerSpriteAnimations } from '../rendering/characters/CharacterSpriteRenderer.js';
import { queueMonsterAssets } from '../rendering/monsters/MonsterAssetLoader.js';

const WORLD_ASSETS = [
  ['ocean-pattern', 'assets/world/terrain/ocean-pattern-seamless-512.webp'],
  ['island-terrain', 'assets/world/terrain/ilha_terreno.webp'],
  ['tree-forest-broad', 'assets/world/vegetation/arvore_ilha_webp_256.webp'],
  ['tree-forest-pine', 'assets/world/vegetation/pinheiro_ilha_webp_384.webp'],
  ['tree-ancestral', 'assets/world/vegetation/arvore_ancestral_toca_webp_640.webp']
];

function notifyLoading(progress, message) {
  window.dispatchEvent(new CustomEvent('colecionador:loading-progress', {
    detail: { progress, message }
  }));
}

export default class Preload extends Phaser.Scene {
  constructor() { super('Preload'); }
  preload() {
    const loadStartedAt = performance.now();
    this.registry.set('assetLoadPercent', 0);
    this.registry.set('assetLoadDurationMs', 0);
    notifyLoading(0, 'Preparando recursos...');
    this.load.on('progress', progress => {
      const percent = Math.round(progress * 100);
      this.registry.set('assetLoadPercent', percent);
      notifyLoading(progress, 'Carregando recursos do mundo...');
    });
    this.load.once(Phaser.Loader.Events.COMPLETE, () => {
      this.registry.set('assetLoadPercent', 100);
      this.registry.set('assetLoadDurationMs', performance.now() - loadStartedAt);
      notifyLoading(1, 'Finalizando...');
    });
    this.load.on('loaderror', file => {
      console.error('Falha ao carregar asset final:', file.key, file.src);
      notifyLoading(this.load.progress, 'Verificando recursos...');
    });
    for (const [key, url] of WORLD_ASSETS) this.load.image(key, import.meta.env.BASE_URL + url + '?v=20261126-ocean-seamless-512-v36');
    queuePlayerSpriteAssets(this.load);
    queueMonsterAssets(this.load);
  }
  create() {
    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0xffffff, 0); graphics.fillRect(0, 0, 2, 2); graphics.generateTexture('player', 2, 2); graphics.destroy();
    registerPlayerSpriteAnimations(this);
    this.scene.start('Game');
  }
}
