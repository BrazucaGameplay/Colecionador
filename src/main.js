import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './config.js';
import Boot from './scenes/Boot.js';
import Preload from './scenes/Preload.js';
import Menu from './scenes/Menu.js';
import Game from './scenes/Game.js';
import { rigbyPhaser } from './plugins/rigby2d-phaser-0.6.1.mjs';

const { RigbyPlugin } = rigbyPhaser(Phaser);

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0b0f1a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  plugins: {
    scene: [
      { key: 'RigbyPlugin', plugin: RigbyPlugin, mapping: 'rigby' }
    ]
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [Boot, Preload, Menu, Game]
};

new Phaser.Game(config);
