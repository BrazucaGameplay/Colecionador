import { STAT_UPGRADES } from '../../entities/Player.js';
import PanelFrame from '../components/PanelFrame.js';

export default class ProfilePanel {
  constructor(scene, { close = () => {}, gameScene } = {}) {
    this.scene = scene;
    this.gameScene = gameScene;
    this.page = 0;
    this.frame = new PanelFrame(scene, { title: 'PERFIL DO JOGADOR', width: 360, height: 520, variant: 'vertical', close });
    const { x, y, width, height } = this.frame;

    // Página inicial: reutiliza a mesma imagem do retrato clicável da HUD.
    this.portrait = scene.add.image(x + width * 0.5, y + height * 0.49, 'player-portrait')
      .setDisplaySize(width * 0.43, height * 0.49)
      .setScrollFactor(0).setDepth(4022);
    this.frame.objects.push(this.portrait);
    this.portraitCaption = this.frame.addText(x + width * 0.5, y + height * 0.765, 'PERSONAGEM', {
      fontSize: '12px', fontStyle: 'bold', color: '#ffe8bd', align: 'center'
    }).setOrigin(0.5);

    // Segunda página: mantém a tela atual de atributos.
    this.summary = this.frame.addText(x + width * 0.15, y + height * 0.235, '', {
      fontSize: '13px', fontStyle: 'bold', color: '#ffe8bd', align: 'center',
      wordWrap: { width: width * 0.70 }
    }).setOrigin(0.5, 0.5).setPosition(x + width * 0.5, y + height * 0.235);

    this.rows = [];
    const keys = Object.keys(STAT_UPGRADES);
    const rowStart = 0.315;
    const rowEnd = 0.735;
    const rowGap = keys.length > 1 ? height * (rowEnd - rowStart) / (keys.length - 1) : 0;
    keys.forEach((key, index) => {
      const rowY = y + height * rowStart + index * rowGap;
      const label = this.frame.addText(x + width * 0.145, rowY, STAT_UPGRADES[key].label, {
        fontSize: '12px', fontStyle: 'bold', color: '#fff0dc', align: 'left',
        wordWrap: { width: width * 0.49 }, lineSpacing: 1
      }).setOrigin(0, 0.5);
      const value = this.frame.addText(x + width * 0.665, rowY, '', {
        fontSize: '12px', fontStyle: 'bold', color: '#ffe6b5', align: 'center'
      }).setOrigin(0.5, 0.5);
      const plus = this.frame.addButton({
        x: x + width * 0.825, y: rowY,
        width: Math.max(28, width * 0.115), height: Math.max(17, width * 0.0575),
        label: '+', texture: 'ui-button-200', onClick: () => this.allocate(key)
      });
      this.rows.push({ key, label, value, plus });
    });

    this.footer = this.frame.addText(x + width * 0.5, y + height * 0.795,
      'Use os pontos disponíveis para evoluir os atributos.', {
        fontSize: '9px', fontStyle: 'bold', color: '#f0d5ad', align: 'center',
        wordWrap: { width: width * 0.70 }, lineSpacing: 1
      }).setOrigin(0.5, 0.5);

    this.previousButton = this.frame.addButton({
      x: x + width * 0.28, y: y + height * 0.865,
      width: Math.max(34, width * 0.13), height: Math.max(19, width * 0.065),
      label: '‹', texture: 'ui-button-200', onClick: () => this.setPage(0)
    });
    this.pageIndicator = this.frame.addText(x + width * 0.5, y + height * 0.865, '1 / 2', {
      fontSize: '11px', fontStyle: 'bold', color: '#ffe8bd', align: 'center'
    }).setOrigin(0.5);
    this.nextButton = this.frame.addButton({
      x: x + width * 0.72, y: y + height * 0.865,
      width: Math.max(34, width * 0.13), height: Math.max(19, width * 0.065),
      label: '›', texture: 'ui-button-200', onClick: () => this.setPage(1)
    });

    this.refresh();
    this.setPage(0);
  }

  setPage(page) {
    this.page = Math.max(0, Math.min(1, page));
    const showPortrait = this.page === 0;
    this.portrait.setVisible(showPortrait);
    this.portraitCaption.setVisible(showPortrait);
    this.summary.setVisible(!showPortrait);
    this.footer.setVisible(!showPortrait);
    for (const row of this.rows) {
      row.label.setVisible(!showPortrait);
      row.value.setVisible(!showPortrait);
      row.plus.background.setVisible(!showPortrait);
      row.plus.label.setVisible(!showPortrait);
    }
    this.previousButton.setAlpha(this.page === 0 ? 0.45 : 1);
    this.nextButton.setAlpha(this.page === 1 ? 0.45 : 1);
    this.pageIndicator.setText((this.page + 1) + ' / 2');
  }

  allocate(key) {
    const game = this.gameScene;
    if (!game?.player?.allocateStat(key)) return;
    game.saveManager?.save({ score: game.score, player: game.player.toSaveData() });
    this.refresh();
  }

  refresh() {
    const player = this.gameScene?.player;
    if (!player || !this.summary) return;
    const required = this.gameScene.progression?.getRequiredExperience(player.level) ?? 0;
    this.summary.setText('Nível ' + player.level + '  •  EXP ' + player.experience +
      '/' + required + '  •  Pontos: ' + player.statPoints);
    for (const row of this.rows) {
      row.value.setText(STAT_UPGRADES[row.key].format(player.stats[row.key]));
      row.plus.setAlpha(player.statPoints > 0 ? 1 : 0.45);
    }
    this.setPage(this.page);
  }

  destroy() {
    this.frame?.destroy();
    this.rows.length = 0;
    this.summary = null;
    this.footer = null;
    this.portrait = null;
    this.portraitCaption = null;
    this.previousButton = null;
    this.nextButton = null;
    this.pageIndicator = null;
    this.gameScene = null;
    this.scene = null;
  }
}
