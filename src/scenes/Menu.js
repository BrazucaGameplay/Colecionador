import Phaser from 'phaser';
import { PLAYER_SKINS, DEFAULT_PLAYER_SKIN_ID } from '../rendering/characters/CharacterAssets.js';
import { SAVE_KEY } from '../config.js';

export default class Menu extends Phaser.Scene {
  constructor() {
    super('Menu');
    this.menuItems = [];
  }

  create() {
    this.showMainMenu();
  }

  readSave() {
    try {
      const value = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
      return {};
    }
  }

  saveSkin(skinId) {
    const current = this.readSave();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        ...current,
        skinId,
        at: Date.now()
      }));
      return true;
    } catch (error) {
      console.warn('Não foi possível salvar a skin selecionada.', error);
      return false;
    }
  }

  clearMenu() {
    for (const item of this.menuItems) item.destroy();
    this.menuItems.length = 0;
  }

  addMenuButton(x, y, label, onClick, { disabled = false, width = 240 } = {}) {
    const fill = disabled ? 0x334155 : 0x166534;
    const rect = this.add.rectangle(x, y, width, 48, fill)
      .setStrokeStyle(1, disabled ? 0x64748b : 0x86efac);
    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: disabled ? '#94a3b8' : '#f8fafc',
      align: 'center'
    }).setOrigin(0.5);
    this.menuItems.push(rect, text);

    if (!disabled) {
      rect.setInteractive({ useHandCursor: true })
        .on('pointerover', () => rect.setFillStyle(0x15803d))
        .on('pointerout', () => rect.setFillStyle(fill))
        .on('pointerdown', onClick);
      text.setInteractive({ useHandCursor: true }).on('pointerdown', onClick);
    }
    return rect;
  }

  showMainMenu() {
    this.clearMenu();
    const { width, height } = this.scale;
    this.menuItems.push(this.add.rectangle(0, 0, width, height, 0x0b0f1a).setOrigin(0));
    this.menuItems.push(this.add.text(width / 2, height * 0.28, 'COLECIONADOR', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#f8fafc'
    }).setOrigin(0.5));
    this.menuItems.push(this.add.text(width / 2, height * 0.37, 'A aventura começa aqui', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#94a3b8'
    }).setOrigin(0.5));

    const saved = this.readSave();
    const selected = Object.values(PLAYER_SKINS).find((skin) => skin.id === (saved.skinId || DEFAULT_PLAYER_SKIN_ID));
    this.menuItems.push(this.add.text(width / 2, height * 0.47,
      'Skin: ' + (selected?.name || 'Padrão'), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#cbd5e1'
    }).setOrigin(0.5));

    this.addMenuButton(width / 2, height * 0.60, 'JOGAR', () => this.scene.start('Game'));
    this.addMenuButton(width / 2, height * 0.72, 'ESCOLHER SKIN', () => this.showSkinSelector(), { width: 240 });
  }

  showSkinSelector() {
    this.clearMenu();
    const { width, height } = this.scale;
    this.menuItems.push(this.add.rectangle(0, 0, width, height, 0x0b0f1a).setOrigin(0));
    this.menuItems.push(this.add.text(width / 2, height * 0.16, 'SKINS DO PERSONAGEM', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '23px',
      fontStyle: 'bold',
      color: '#f8fafc'
    }).setOrigin(0.5));

    const saved = this.readSave();
    const currentId = saved.skinId || DEFAULT_PLAYER_SKIN_ID;
    const skins = Object.values(PLAYER_SKINS);
    let y = height * 0.31;

    for (const skin of skins) {
      const isReady = skin.animated && Boolean(skin.animations?.idle) && Boolean(skin.animations?.walk);
      const isSelected = skin.id === currentId;
      const label = [
        skin.name,
        isSelected ? 'EQUIPADA' : (isReady ? 'DISPONÍVEL' : 'EM PREPARAÇÃO — sem animações')
      ].join('\n');
      this.addMenuButton(width / 2, y, label, () => {
        if (!this.saveSkin(skin.id)) return;
        this.showSkinSelector();
      }, { disabled: !isReady, width: Math.min(300, width - 36) });
      y += 78;
    }

    this.addMenuButton(width / 2, Math.min(height * 0.86, y + 8), 'VOLTAR', () => this.showMainMenu(), { width: 180 });
  }
}
