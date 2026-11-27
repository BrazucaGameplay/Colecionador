import { STAT_UPGRADES } from '../../entities/Player.js';
import PanelFrame from '../components/PanelFrame.js';

export default class ProfilePanel {
  constructor(scene, { close = () => {}, gameScene } = {}) {
    this.scene = scene;
    this.gameScene = gameScene;
    this.frame = new PanelFrame(scene, { title: 'PERFIL DO JOGADOR', width: 360, height: 520, variant: 'vertical', close });
    const { x, y, width, height } = this.frame;

    this.summary = this.frame.addText(x + width * 0.15, y + height * 0.235, '', {
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#ffe8bd',
      align: 'center',
      wordWrap: { width: width * 0.70 }
    }).setOrigin(0.5, 0.5).setPosition(x + width * 0.5, y + height * 0.235);

    this.rows = [];
    const keys = Object.keys(STAT_UPGRADES);
    const rowStart = 0.315;
    const rowEnd = 0.755;
    const rowGap = keys.length > 1 ? height * (rowEnd - rowStart) / (keys.length - 1) : 0;

    keys.forEach((key, index) => {
      const rowY = y + height * rowStart + index * rowGap;
      const label = this.frame.addText(x + width * 0.145, rowY, STAT_UPGRADES[key].label, {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#fff0dc',
        align: 'left',
        wordWrap: { width: width * 0.49 },
        lineSpacing: 1
      }).setOrigin(0, 0.5);

      const value = this.frame.addText(x + width * 0.665, rowY, '', {
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#ffe6b5',
        align: 'center'
      }).setOrigin(0.5, 0.5);

      const plus = this.frame.addButton({
        x: x + width * 0.825,
        y: rowY,
        width: Math.max(28, width * 0.115),
        height: Math.max(17, width * 0.0575),
        label: '+',
        texture: 'ui-button-200',
        onClick: () => this.allocate(key)
      });

      this.rows.push({ key, label, value, plus });
    });

    this.footer = this.frame.addText(x + width * 0.5, y + height * 0.825,
      'Distribua os pontos disponíveis para evoluir os atributos.', {
        fontSize: '10px',
        fontStyle: 'bold',
        color: '#f0d5ad',
        align: 'center',
        wordWrap: { width: width * 0.66 },
        lineSpacing: 1
      }).setOrigin(0.5, 0.5);

    this.refresh();
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
  }

  destroy() {
    this.frame?.destroy();
    this.rows.length = 0;
    this.summary = null;
    this.footer = null;
    this.gameScene = null;
    this.scene = null;
  }
}
