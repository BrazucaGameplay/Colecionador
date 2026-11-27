import * as Phaser from 'phaser';
import { STAT_UPGRADES } from '../entities/Player.js';

const PANEL_COPY = Object.freeze({
  bestiary: { title: 'BESTIÁRIO', status: 'Sem registros conectados', body: 'O catálogo de espécies ainda não recebe os encontros e derrotas do mundo. Nenhum monstro será listado como descoberto sem um registro real.' },
  waifus: { title: 'WAIFUS', status: 'Sistema de vínculos pendente', body: 'Os cards e os dados de vínculo das waifus ainda não estão integrados a este save. Este painel não cria personagens ou bônus fictícios.' },
  inventory: { title: 'INVENTÁRIO', status: 'Catálogo de itens pendente', body: 'O inventário ainda não possui catálogo e instâncias de itens conectados. Nenhum item provisório foi adicionado.' },
  house: { title: 'CASA', status: 'Sistema ainda não implementado', body: 'A casa ainda não possui construção, melhorias ou armazenamento implementados. Abrir este painel não consome recursos nem altera o mundo.' }
});

export default class GameUI extends Phaser.Scene {
  constructor() {
    super('GameUI');
    this.panelObjects = [];
    this.activePanel = null;
    this.refreshElapsed = 0;
  }

  preload() {
    this.load.image('player-portrait', import.meta.env.BASE_URL + 'assets/ui/player-portrait.webp');
  }

  create() {
    this.gameScene = this.scene.get('Game');
    this.gameScene.uiScene = this;
    // A UI recebe os toques primeiro, mas não bloqueia a cena inferior.
    // Os controles interrompem a propagação e a HUD também é filtrada no mundo.
    this.input.setGlobalTopOnly(false);
    this.createHud();
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.refreshHud();
  }

  createHud() {
    this.menuButton = this.add.rectangle(36, 36, 48, 48, 0x101b2d, 0.94)
      .setStrokeStyle(1.5, 0x8ba4c7).setDepth(3000);
    this.menuButtonText = this.add.text(36, 36, '☰', {
      fontFamily: 'Arial, sans-serif', fontSize: '25px', color: '#f8fafc'
    }).setOrigin(0.5).setDepth(3001);
    this.bindButton(this.menuButton, () => {
      this.activePanel === 'menu' ? this.closePanel() : this.openPanel('menu');
    });

    const centerX = this.scale.width / 2;
    const portraitY = this.scale.height - 65;
    // Raio 30% maior que o retrato anterior (26 -> 33,8 px).
    this.portraitFrame = this.add.circle(centerX, portraitY, 33.8, 0x101b2d, 0.98)
      .setStrokeStyle(2, 0xfbbf24).setDepth(3000);
    this.portraitMaskShape = this.make.graphics({ x: 0, y: 0, add: false });
    this.portraitMask = this.portraitMaskShape.createGeometryMask();
    this.portraitImage = this.add.image(centerX, portraitY, 'player-portrait')
      .setDisplaySize(45.2, 67.8).setDepth(3002).setMask(this.portraitMask);
    this.portraitHit = this.add.zone(centerX, portraitY, 88, 88).setDepth(3004).setInteractive();
    this.portraitHit.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation();
      this.openPanel('profile');
    });
    this.hpLabel = this.add.text(0, 0, 'HP', { fontSize: '9px', fontStyle: 'bold', color: '#fecaca' }).setDepth(3003);
    this.enLabel = this.add.text(0, 0, 'EN', { fontSize: '9px', fontStyle: 'bold', color: '#bfdbfe' }).setDepth(3003);
    this.hpTrack = this.add.rectangle(0, 0, 128, 7, 0x451a1a).setOrigin(0, 0.5).setDepth(3001);
    this.hpFill = this.add.rectangle(0, 0, 128, 7, 0xef4444).setOrigin(0, 0.5).setDepth(3002);
    this.enTrack = this.add.rectangle(0, 0, 128, 7, 0x172554).setOrigin(0, 0.5).setDepth(3001);
    this.enFill = this.add.rectangle(0, 0, 128, 7, 0x3b82f6).setOrigin(0, 0.5).setDepth(3002);
    this.layoutHud();
  }

  layoutHud() {
    if (!this.menuButton) return;
    const width = this.scale.width;
    const height = this.scale.height;
    this.menuButton.setPosition(36, 36);
    this.menuButtonText.setPosition(36, 36);
    const centerX = width / 2;
    const portraitY = height - 65;
    this.portraitFrame.setPosition(centerX, portraitY);
    this.portraitImage.setPosition(centerX, portraitY);
    this.portraitHit.setPosition(centerX, portraitY);
    this.portraitMaskShape.clear();
    this.portraitMaskShape.fillStyle(0xffffff, 1);
    this.portraitMaskShape.fillCircle(centerX, portraitY, 33.8);
    const barX = centerX - 64;
    const barY = height - 24;
    this.hpLabel.setPosition(barX - 22, barY - 6);
    this.enLabel.setPosition(barX - 22, barY + 7);
    this.hpTrack.setPosition(barX, barY);
    this.hpFill.setPosition(barX, barY);
    this.enTrack.setPosition(barX, barY + 13);
    this.enFill.setPosition(barX, barY + 13);
  }

  bindButton(object, callback) {
    object.setInteractive().on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation();
      callback();
    });
    return object;
  }

  isUiPointer(x, y) {
    if (this.activePanel) return true;
    const width = this.scale.width;
    const height = this.scale.height;
    return (x >= 8 && x <= 64 && y >= 8 && y <= 64) ||
      (x >= width / 2 - 104 && x <= width / 2 + 104 && y >= height - 116 && y <= height);
  }

  refreshHud() {
    const player = this.gameScene?.player;
    if (!player || !this.hpFill) return;
    const hp = player.maxHealth > 0 ? Phaser.Math.Clamp(player.health / player.maxHealth, 0, 1) : 0;
    const energy = player.maxEnergy > 0 ? Phaser.Math.Clamp(player.energy / player.maxEnergy, 0, 1) : 0;
    this.hpFill.setSize(128 * hp, 7);
    this.enFill.setSize(128 * energy, 7);
    if (this.activePanel === 'profile') this.refreshProfile();
  }

  openPanel(panel) {
    this.closePanel();
    this.activePanel = panel;
    const shade = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x020617, 0.38)
      .setOrigin(0).setDepth(4000).setInteractive();
    shade.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation();
      this.closePanel();
    });
    this.panelObjects.push(shade);
    if (panel === 'menu') this.createMenuPanel();
    else if (panel === 'profile') this.createProfilePanel();
    else this.createInfoPanel(panel);
  }

  addPanelObject(object, depth = 4010) {
    object.setDepth(depth);
    this.panelObjects.push(object);
    return object;
  }

  addPanelText(x, y, value, style = {}, depth = 4020) {
    return this.addPanelObject(this.add.text(x, y, value, {
      fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#e2e8f0', ...style
    }), depth);
  }

  addPanelFrame(x, y, width, height, title) {
    const frame = this.addPanelObject(
      this.add.rectangle(x, y, width, height, 0x101827, 0.98)
        .setOrigin(0).setStrokeStyle(1.5, 0x64748b), 4010
    );
    frame.setInteractive();
    frame.on('pointerdown', (pointer, localX, localY, event) => event?.stopPropagation());
    this.addPanelText(x + 18, y + 15, title, { fontSize: '18px', fontStyle: 'bold', color: '#f8fafc' });
    const close = this.addPanelObject(
      this.add.rectangle(x + width - 24, y + 24, 34, 34, 0x334155).setStrokeStyle(1, 0x94a3b8), 4030
    );
    this.addPanelText(x + width - 32, y + 11, '×', { fontSize: '25px', color: '#fff' }, 4031);
    this.bindButton(close, () => this.closePanel());
  }

  createMenuPanel() {
    const width = Math.min(290, this.scale.width - 24);
    const x = 12, y = 72, height = 318;
    this.addPanelFrame(x, y, width, height, 'MENU');
    [['Bestiário', 'bestiary'], ['Waifus', 'waifus'], ['Inventário', 'inventory'], ['Casa', 'house']]
      .forEach(([label, key], index) => {
        const rowY = y + 62 + index * 46;
        const button = this.addPanelObject(
          this.add.rectangle(x + width / 2, rowY, width - 28, 38, 0x1e293b).setStrokeStyle(1, 0x475569), 4020
        );
        this.addPanelText(x + 28, rowY - 10, label, { fontSize: '14px', fontStyle: 'bold', color: '#f8fafc' }, 4021);
        this.bindButton(button, () => this.openPanel(key));
      });

    const monitor = this.gameScene.performanceMonitor;
    const enabled = Boolean(monitor?.enabled);
    const rowY = y + 62 + 4 * 46;
    const toggle = this.addPanelObject(
      this.add.rectangle(x + width / 2, rowY, width - 28, 38, enabled ? 0x164e35 : 0x1e293b)
        .setStrokeStyle(1, enabled ? 0x4ade80 : 0x64748b), 4020
    );
    this.performanceToggleText = this.addPanelText(x + 28, rowY - 10,
      'Desempenho / DPS: ' + (enabled ? 'ATIVO' : 'DESATIVADO'),
      { fontSize: this.scale.width < 390 ? '11px' : '13px', fontStyle: 'bold', color: '#f8fafc' }, 4021);
    this.bindButton(toggle, () => {
      const next = !Boolean(monitor?.enabled);
      monitor?.setEnabled(next);
      this.performanceToggleText?.setText('Desempenho / DPS: ' + (next ? 'ATIVO' : 'DESATIVADO'));
      toggle.setFillStyle(next ? 0x164e35 : 0x1e293b);
      toggle.setStrokeStyle(1, next ? 0x4ade80 : 0x64748b);
    });
  }

  createInfoPanel(key) {
    const content = PANEL_COPY[key];
    if (!content) return;
    const width = Math.min(430, this.scale.width - 24);
    const height = Math.min(250, this.scale.height - 32);
    const x = (this.scale.width - width) / 2;
    const y = (this.scale.height - height) / 2;
    this.addPanelFrame(x, y, width, height, content.title);
    this.addPanelText(x + 20, y + 72, content.status, { fontSize: '13px', fontStyle: 'bold', color: '#fbbf24' });
    this.addPanelText(x + 20, y + 103, content.body, {
      fontSize: this.scale.width < 390 ? '11px' : '13px',
      color: '#cbd5e1', wordWrap: { width: width - 40 }, lineSpacing: 5
    });
  }

  createProfilePanel() {
    const width = Math.min(440, this.scale.width - 24);
    const height = Math.min(560, this.scale.height - 24);
    const x = (this.scale.width - width) / 2;
    const y = (this.scale.height - height) / 2;
    this.addPanelFrame(x, y, width, height, 'PERFIL DO JOGADOR');
    this.profileSummary = this.addPanelText(x + 18, y + 52, '', { fontSize: '12px', color: '#cbd5e1' });
    this.profileRows = [];
    const keys = Object.keys(STAT_UPGRADES);
    const rowHeight = Math.max(22, (height - 126) / keys.length);
    keys.forEach((key, index) => {
      const rowY = y + 91 + index * rowHeight;
      this.addPanelText(x + 18, rowY - 8, STAT_UPGRADES[key].label, {
        fontSize: this.scale.width < 390 ? '10px' : '12px'
      });
      const value = this.addPanelText(x + width - 62, rowY - 8, '', {
        fontSize: '11px', fontStyle: 'bold', color: '#fff'
      });
      const plus = this.addPanelObject(
        this.add.rectangle(x + width - 28, rowY, 25, 22, 0x166534).setStrokeStyle(1, 0x86efac), 4030
      );
      this.addPanelText(x + width - 33, rowY - 10, '+', { fontSize: '18px', color: '#fff' }, 4031);
      this.bindButton(plus, () => {
        if (this.gameScene.player.allocateStat(key)) {
          this.gameScene.persistProgress({
            score: this.gameScene.score, player: this.gameScene.player.toSaveData()
          });
          this.refreshHud();
        }
      });
      this.profileRows.push({ key, value, plus });
      if (index < keys.length - 1) {
        this.addPanelObject(
          this.add.rectangle(x + 14, rowY + rowHeight / 2 - 2, width - 28, 1, 0x334155).setOrigin(0), 4015
        );
      }
    });
    this.addPanelText(x + 18, y + height - 25,
      '3 pontos por nível • evolua os atributos disponíveis', {
        fontSize: this.scale.width < 390 ? '8px' : '10px', color: '#94a3b8'
      });
    this.refreshProfile();
  }

  refreshProfile() {
    if (!this.profileSummary || !this.gameScene?.player) return;
    const player = this.gameScene.player;
    const required = this.gameScene.progression.getRequiredExperience(player.level);
    this.profileSummary.setText(
      'Nível ' + player.level + '  •  EXP ' + player.experience + '/' + required +
      '  •  Pontos: ' + player.statPoints
    );
    for (const row of this.profileRows || []) {
      row.value.setText(STAT_UPGRADES[row.key].format(player.stats[row.key]));
      row.plus.setFillStyle(player.statPoints > 0 ? 0x166534 : 0x334155);
      row.plus.setAlpha(player.statPoints > 0 ? 1 : 0.5);
    }
  }

  closePanel() {
    for (const object of this.panelObjects) object.destroy();
    this.panelObjects.length = 0;
    this.activePanel = null;
    this.profileSummary = null;
    this.profileRows = [];
  }

  handleResize() {
    this.closePanel();
    this.layoutHud();
  }

  update(time, delta = 16.67) {
    this.refreshElapsed += Math.max(0, delta);
    if (this.refreshElapsed < 100) return;
    this.refreshElapsed = 0;
    this.refreshHud();
  }

  shutdown() {
    this.scale.off('resize', this.handleResize, this);
    this.closePanel();
    if (this.gameScene?.uiScene === this) this.gameScene.uiScene = null;
    this.gameScene = null;
  }
}
