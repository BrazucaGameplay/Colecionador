import * as Phaser from 'phaser';
import Player from '../entities/Player.js';
import PlayerBodyAdapter from '../entities/PlayerBodyAdapter.js';
import CharacterSpriteRenderer from '../rendering/characters/CharacterSpriteRenderer.js';
import SkinManager from '../rendering/characters/SkinManager.js';
import MonsterManager from '../systems/monsters/MonsterManager.js';
import { ISLAND_01_MONSTER_SPAWNS } from '../world/spawn-layout/island-01.js';
import { SAVE_KEY } from '../config.js';
import WorldBootstrap from '../world/WorldBootstrap.js';
import CameraController from '../systems/camera/CameraController.js';
import SaveManager from '../systems/persistence/SaveManager.js';
import GameSystemsBootstrap from '../systems/GameSystemsBootstrap.js';

// Teste de escala: ilha circular com 4096 px de diâmetro.

export default class Game extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  async create() {
    this.initialized = false;
    this.saveManager = new SaveManager({ key: SAVE_KEY });
    this.savedProgress = this.saveManager.load();
    this.score = Math.max(0, Number(this.savedProgress.score) || 0);

    this.worldBootstrap = new WorldBootstrap(this);
    const playerSpawn = await this.worldBootstrap.initialize();

    // Logical player state remains independent of its visual renderer.
    this.player = new Player({ x: playerSpawn.x, y: playerSpawn.y, speed: 220, saveData: this.savedProgress.player });
    this.playerBody = new PlayerBodyAdapter(this, this.player);
    this.characterRenderer = new CharacterSpriteRenderer(this, {
      x: playerSpawn.x,
      y: playerSpawn.y,
      depthManager: this.depthManager
    });
    this.skinManager = new SkinManager({
      selectedSkin: this.savedProgress.selectedSkin,
      assetValidator: id => this.characterRenderer?.isSkinLoaded(id) ?? false,
      onChange: ({ selectedSkin }) => {
        const result = this.characterRenderer?.setSkin(selectedSkin);
        if (!result?.changed) return result || { changed: false, reason: 'renderer-unavailable' };
        this.persistProgress(); this.uiScene?.refreshHud(); return result;
      }
    });
    if (this.skinManager.getSelectedSkin() !== this.characterRenderer.skinId) this.characterRenderer.setSkin(this.skinManager.getSelectedSkin());

    this.monsterManager = new MonsterManager(this, {
      navigation: this.navigation,
      playerBody: this.playerBody,
      depthManager: this.depthManager,
      spawnZones: ISLAND_01_MONSTER_SPAWNS,
      onKill: ({ experience = 0 } = {}) => {
        this.score += 1;
        this.progression.award(this.player, experience);
        this.persistProgress();
      }
    });

    this.cameraController = new CameraController(this);
    this.camera = this.cameraController.initialize(this.characterRenderer.sprite);

    this.gameSystemsBootstrap = new GameSystemsBootstrap(this);
    this.gameSystemsBootstrap.initialize({
      player: this.player,
      characterRenderer: this.characterRenderer,
      camera: this.camera,
      cameraController: this.cameraController,
      monsterManager: this.monsterManager,
      showLevelUpNotice: level => this.showLevelUpNotice(level)
    });

    // Game permanece ativo enquanto a interface é exibida em cena própria.
    this.scene.launch('GameUI');

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this._cooldown = 0;
    this.initialized = true;
    window.dispatchEvent(new CustomEvent('colecionador:game-ready'));
  }

  persistProgress() {
    if (!this.player || !this.saveManager) return false;
    return this.saveManager.save({score:this.score,player:this.player.toSaveData(),selectedSkin:this.skinManager?.getSelectedSkin()});
  }

  update(time, delta = 16.67) {
    if (!this.initialized) return;
    const updateStartedAt = performance.now();
    if (!this.player?.alive) {
      this.movement?.clearDestination();
      if (this.characterRenderer?.activeAction !== 'dying') this.characterRenderer?.playAction('dying');
    }
    this.movement?.setPaused(!this.player?.alive);
    this.combat?.update(this.time.now);
    this.movement?.update(delta);
    this.player?.update(delta, this.time.now);
    this.playerBody?.sync();

    this.characterRenderer?.setTransform(this.player.x, this.player.y);
    this.characterRenderer?.setMoving(this.player.moving);
    if (this.player.moving) {
      this.characterRenderer?.setDirection(this.player.facing.x, this.player.facing.y);
    }
    this.characterRenderer?.update(delta, this.camera);

    if (!this.movement?.destination) this.destinationMarker?.setVisible(false);

    this.monsterManager?.update(this.time.now, delta);
    this.monsterCombat?.update(this.time.now);
    this.performanceMonitor?.update(delta, performance.now() - updateStartedAt, this.monsterManager?.metrics);
    // O renderer do personagem e os objetos do cenário usam a mesma escala de profundidade.
  }

  showLevelUpNotice(level) {
    const n = this.add.text(this.scale.width/2,this.scale.height*.22,'NÍVEL '+level+'!',{fontSize:'28px',color:'#fde68a',fontStyle:'bold',stroke:'#422006',strokeThickness:5}).setOrigin(.5).setScrollFactor(0).setDepth(1250);
    this.tweens.add({targets:n,y:n.y-34,alpha:0,duration:1800,onComplete:()=>n.destroy()});
  }

  shutdown() {
    this.persistProgress();

    if (this.scene.isActive('GameUI')) this.scene.stop('GameUI');
    this.cameraController?.destroy();
    this.cameraController = null;
    this.camera = null;
    this.gameSystemsBootstrap?.destroy();
    this.gameSystemsBootstrap = null;
    this.saveManager = null;
    this.skinManager?.destroy();
    this.skinManager = null;
    this.savedProgress = null;
    this.uiCamera = null;
    this.monsterManager?.destroy();
    this.playerBody?.destroy();
    this.characterRenderer?.destroy();
    this.worldBootstrap?.destroy();
    this.worldBootstrap = null;
    this.playerBody = null;
    this.characterRenderer = null;
    this.player = null;
    this.uiScene = null;
    this.monsterManager = null;
  }
}
