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
    const base = import.meta.env.BASE_URL + 'assets/ui/';
    this.load.image('ui-panel-frame', base + 'ui-panel-frame.webp?v=20261126-ui-gold-red-v1');
    this.load.image('ui-menu-button', base + 'ui-menu-button.webp?v=20261126-ui-gold-red-v1');
    this.load.image('player-portrait', base + 'player-portrait.webp');
  }

  create() {
    this.gameScene = this.scene.get('Game');
    this.gameScene.uiScene = this;
    this.input.setGlobalTopOnly(false);
    this.createHud();
    this.scale.on('resize', this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.refreshHud();
  }

  createHud() {
    this.menuButton = this.add.nineslice(36, 36, 'ui-menu-button', undefined, 54, 42, 42, 42)
      .setDepth(3000);
    this.menuButtonText = this.add.text(36, 36, '☰', {
      fontFamily: 'Georgia, serif', fontSize: '24px', color: '#fff0c4',
      stroke: '#4b160d', strokeThickness: 3
    }).setOrigin(0.5).setDepth(3001);
    this.bindButton(this.menuButton, () => {
      this.activePanel === 'menu' ? this.closePanel() : this.openPanel('menu');
    });

    const centerX = this.scale.width / 2;
    const height = this.scale.height;
    const portraitY = height - 105;
    this.portraitImage = this.add.image(centerX, portraitY, 'player-portrait')
      .setDisplaySize(64, 96).setDepth(3002);
    this.portraitHit = this.add.zone(centerX, portraitY, 80, 108).setDepth(3004).setInteractive();
    this.portraitHit.on('pointerdown', (pointer, localX, localY, event) => {
      event?.stopPropagation();
      this.openPanel('profile');
    });

    this.hpLabel = this.add.text(0, 0, 'HP', {
      fontFamily: 'Georgia, serif', fontSize: '10px', fontStyle: 'bold', color: '#ffe2c5'
    }).setDepth(3003);
    this.enLabel = this.add.text(0, 0, 'EN', {
      fontFamily: 'Georgia, serif', fontSize: '10px', fontStyle: 'bold', color: '#dcecff'
    }).setDepth(3003);
    this.hpTrack = this.add.rectangle(0, 0, 128, 10, 0x390a10, 0.96).setStrokeStyle(1, 0xd6a642).setDepth(3001);
    this.hpFill = this.add.rectangle(0, 0, 128, 6, 0xef4444).setOrigin(0, 0.5).setDepth(3002);
    this.enTrack = this.add.rectangle(0, 0, 128, 10, 0x081a3b, 0.96).setStrokeStyle(1, 0xd6a642).setDepth(3001);
    this.enFill = this.add.rectangle(0, 0, 128, 6, 0x3b82f6).setOrigin(0, 0.5).setDepth(3002);
    this.layoutHud();
  }

  layoutHud() {
    if (!this.menuButton) return;
    const width = this.scale.width;
    const height = this.scale.height;
    this.menuButton.setPosition(36, 36);
    this.menuButtonText.setPosition(36, 36);
    const centerX = width / 2;
    const portraitY = height - 105;
    this.portraitImage.setPosition(centerX, portraitY);
    this.portraitHit.setPosition(centerX, portraitY);

    const barX = centerX - 72;
    const barY = height - 25;
    this.hpLabel.setPosition(barX - 22, barY - 6);
    this.enLabel.setPosition(barX - 22, barY + 7);
    this.hpTrack.setPosition(barX + 5, barY);
    this.hpFill.setPosition(barX - 59, barY);
    this.enTrack.setPosition(barX + 5, barY + 16);
    this.enFill.setPosition(barX - 59, barY + 16);
    this.refreshHud();
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
      (x >= width / 2 - 58 && x <= width / 2 + 58 && y >= height - 164 && y <= height);
  }

  refreshHud() {
    const player = this.gameScene?.player;
    if (!player || !this.hpFill) return;
    const hp = player.maxHealth > 0 ? Phaser.Math.Clamp(player.health / player.maxHealth, 0, 1) : 0;
    const energy = player.maxEnergy > 0 ? Phaser.Math.Clamp(player.energy / player.maxEnergy, 0, 1) : 0;
    this.hpFill.setSize(128 * hp, 6);
    this.enFill.setSize(128 * energy, 6);
    if (this.activePanel === 'profile') this.refreshProfile();
  }

  openPanel(panel) {
    this.closePanel();
    this.activePanel = panel;
    const shade = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x02040b, 0.62)
      .setOrigin(0).setDepth(3990).setInteractive();
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
      fontFamily: 'Trebuchet MS, Arial, sans-serif',
      fontSize: '14px',
      color: '#fff0d5',
      stroke: '#35100b',
      strokeThickness: 2,
      ...style
    }), depth);
  }

  addPanelFrame(x, y, width, height, title) {
    const frame = this.addPanelObject(
      this.add.nineslice(x + width / 2, y + height / 2, 'ui-panel-frame', undefined,
        width, height, 58, 58, 48, 48),
      4010
    );
    frame.setInteractive();
    frame.on('pointerdown', (pointer, localX, localY, event) => event?.stopPropagation());

    this.addPanelText(x + width / 2, y + 34, title, {
      fontFamily: 'Georgia, serif', fontSize: '19px', fontStyle: 'bold',
      color: '#ffe0a0', stroke: '#4a1009', strokeThickness: 4
    }, 4020);

    const close = this.addPanelObject(
      this.add.nineslice(x + width - 32, y + 34, 'ui-menu-button', undefined, 38, 30, 32, 32),
      4030
    );
    this.bindButton(close, () => this.closePanel());
    return { x, y, width, height };
  }

  createMenuPanel() {
    const width = Math.min(330, this.scale.width - 20);
    const x = 10;
    const y = 70;
    const height = 370;
    this.addPanelFrame(x, y, width, height, 'MENU');

    const entries = [
      ['Bestiário', 'bestiary'],
      ['Waifus', 'waifus'],
      ['Inventário', 'inventory'],
      ['Casa', 'house']
    ];
    entries.forEach(([label, key], index) => {
      const rowY = y + 104 + index * 49;
      const button = this.addPanelObject(
        this.add.nineslice(x + width / 2, rowY, 'ui-menu-button', undefined,
          width - 56, 43, 42, 42),
        4020
      );
      this.bindButton(button, () => this.openPanel(key));
      this.addPanelText(x + width / 2, rowY, label, {
        fontFamily: 'Georgia, serif', fontSize: this.scale.width < 390 ? '13px' : '15px',
        fontStyle: 'bold', color: '#fff0bd', stroke: '#4b0d08', strokeThickness: 3
      }, 4022);
    });

    const monitor = this.gameScene.performanceMonitor;
    const enabled = Boolean(monitor?.enabled);
    const rowY = y + 104 + 4 * 49;
    const toggle = this.addPanelObject(
      this.add.nineslice(x + width / 2, rowY, 'ui-menu-button', undefined,
        width - 56, 43, 42, 42),
      4020
    );
    this.performanceToggleText = this.addPanelText(x + width / 2, rowY,
      'Desempenho / DPS: ' + (enabled ? 'ATIVO' : 'DESATIVADO'),
      { fontFamily: 'Georgia, serif', fontSize: this.scale.width < 390 ? '10px' : '12px',
        fontStyle: 'bold', color: enabled ? '#ffe08a' : '#e6c7b4' }, 4022);
    this.bindButton(toggle, () => {
      const next = !Boolean(monitor?.enabled);
      monitor?.setEnabled(next);
      this.performanceToggleText?.setText('Desempenho / DPS: ' + (next ? 'ATIVO' : 'DESATIVADO'));
      this.performanceToggleText?.setColor(next ? '#ffe08a' : '#e6c7b4');
    });
  }

  createInfoPanel(key) {
    const content = PANEL_COPY[key];
    if (!content) return;
    const width = Math.min(440, this.scale.width - 24);
    const height = Math.min(270, this.scale.height - 32);
    const x = (this.scale.width - width) / 2;
    const y = (this.scale.height - height) / 2;
    this.addPanelFrame(x, y, width, height, content.title);
    this.addPanelText(x + 24, y + 88, content.status, {
      fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'bold',
      color: '#ffd77d'
    });
    this.addPanelText(x + 24, y + 120, content.body, {
      fontSize: this.scale.width < 390 ? '11px' : '13px',
      color: '#fff0df', wordWrap: { width: width - 48 }, lineSpacing: 5
    });
  }

  createProfilePanel() {
    const width = Math.min(470, this.scale.width - 20);
    const height = Math.min(620, this.scale.height - 20);
    const x = (this.scale.width - width) / 2;
    const y = (this.scale.height - height) / 2;
    this.addPanelFrame(x, y, width, height, 'PERFIL DO JOGADOR');

    this.profileSummary = this.addPanelText(x + 22, y + 78, '', {
      fontFamily: 'Georgia, serif', fontSize: this.scale.width < 390 ? '10px' : '12px',
      color: '#ffe2ae'
    });
    const divider = this.addPanelObject(
      this.add.rectangle(x + width / 2, y + 105, width - 80, 1, 0xd6a642, 0.45).setDepth(4020),
      4020
    );
    this.profileRows = [];
    const keys = Object.keys(STAT_UPGRADES);
    const rowHeight = (height - 174) / keys.length;
    keys.forEach((key, index) => {
      const rowY = y + 137 + index * rowHeight;
      this.addPanelText(x + 24, rowY, STAT_UPGRADES[key].label, {
        fontSize: this.scale.width < 390 ? '10px' : '12px',
        color: '#ffedcf'
      }, 4022);
      const value = this.addPanelText(x + width - 78, rowY, '', {
        fontSize: this.scale.width < 390 ? '10px' : '12px',
        fontStyle: 'bold', color: '#fff7e8'
      }, 4022);
      const plus = this.addPanelObject(
        this.add.nineslice(x + width - 30, rowY + 1, 'ui-menu-button', undefined, 30, 27, 24, 24),
        4030
      );
      this.addPanelText(x + width - 30, rowY - 1, '+', {
        fontFamily: 'Georgia, serif', fontSize: '17px', fontStyle: 'bold',
        color: '#fff0bd'
      }, 4031);
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
          this.add.rectangle(x + 20, rowY + rowHeight / 2, width - 40, 1, 0xd6a64b, 0.28).setOrigin(0),
          4015
        );
      }
    });
    this.addPanelText(x + 22, y + height - 30,
      'Pontos de atributo: distribua para evoluir seu personagem', {
        fontSize: this.scale.width < 390 ? '8px' : '10px',
        color: '#e7cda7'
      }, 4022);
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
      row.plus.setAlpha(player.statPoints > 0 ? 1 : 0.5);
    }
  }

  closePanel() {
    for (const object of this.panelObjects) object.destroy();
    this.panelObjects.length = 0;
    this.activePanel = null;
    this.profileSummary = null;
    this.profileRows = [];
    this.performanceToggleText = null;
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
