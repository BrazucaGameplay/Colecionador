import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './core/config/index.js';
import LoadingScreen from './core/lifecycle/LoadingScreen.js';
import Boot from './scenes/Boot.js';
import Preload from './scenes/Preload.js';
import Game from './scenes/Game.js';
import GameUI from './scenes/GameUI.js';

// A camada HTML é exibida antes da criação do canvas Phaser.
new LoadingScreen();

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0b0f1a',
  // Arte ilustrada (não pixel art): manter interpolação linear e subpixel.
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: false,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  input: {
    keyboard: false
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [Boot, Preload, Game, GameUI]
};

new Phaser.Game(config);
