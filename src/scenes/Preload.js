import * as Phaser from 'phaser';
import { queuePlayerSpriteAssets, registerPlayerSpriteAnimations } from '../rendering/characters/CharacterSpriteRenderer.js';
import { queueMonsterAssets } from '../rendering/monsters/MonsterAssetLoader.js';

const WORLD_ASSETS = [
  ['ocean-pattern', 'assets/world/terrain/ocean-pattern.webp'],
  ['island-terrain', 'assets/world/terrain/ilha_terreno.webp'],
  ['tree-forest-broad', 'assets/world/vegetation/arvore_ilha_webp_256.webp'],
  ['tree-forest-pine', 'assets/world/vegetation/pinheiro_ilha_webp_384.webp'],
  ['tree-ancestral', 'assets/world/vegetation/arvore_ancestral_toca_webp_640.webp']
];

export default class Preload extends Phaser.Scene {
  constructor() { super('Preload'); }
  preload() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, 300, 20, 0x222222).setOrigin(0.5);
    const fill = this.add.rectangle(width / 2 - 140, height / 2, 0, 12, 0x22c55e).setOrigin(0, 0.5);
    const label = this.add.text(width / 2, height / 2 + 40, 'Carregando mundo... 0%', { fontSize: '16px', color: '#ffffff' }).setOrigin(0.5);
    this.load.on('progress', progress => { fill.width = 280 * progress; label.setText('Carregando mundo... ' + Math.round(progress * 100) + '%'); });
    this.load.on('loaderror', file => { console.error('Falha ao carregar asset final:', file.key, file.src); label.setText('Falha ao carregar recursos do jogo.'); });
    for (const [key, url] of WORLD_ASSETS) this.load.image(key, import.meta.env.BASE_URL + url + '?v=20261126-ocean-seamless-v29');
    queuePlayerSpriteAssets(this.load);
    queueMonsterAssets(this.load);
  }
  create() {
    const graphics = this.make.graphics({ add: false });
    graphics.fillStyle(0xffffff, 0); graphics.fillRect(0, 0, 2, 2); graphics.generateTexture('player', 2, 2); graphics.destroy();
    registerPlayerSpriteAnimations(this);
    this.scene.start('Menu');
  }
}
