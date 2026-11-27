import { STAT_UPGRADES } from '../../entities/Player.js';
import PanelFrame from '../components/PanelFrame.js';

export default class ProfilePanel {
  constructor(scene, { close = () => {}, gameScene } = {}) {
    this.scene = scene;
    this.gameScene = gameScene;
    this.frame = new PanelFrame(scene, { title: 'PERFIL DO JOGADOR', width: 360, height: 520, variant: 'vertical', close });
    const { x, y, width, height } = this.frame;
    this.summary = this.frame.addText(x + width * 0.15, y + height * 0.235, '', {
      fontSize: '13px', color: '#ffe5ad', wordWrap: { width: width * 0.70 }
    });
    this.rows = [];
    const keys = Object.keys(STAT_UPGRADES);
    const rowGap = Math.min(34, height * 0.47 / Math.max(1, keys.length));
    keys.forEach((key, index) => {
      const rowY = y + height * 0.34 + index * rowGap;
      this.frame.addText(x + width * 0.15, rowY - 7, STAT_UPGRADES[key].label, {
        fontSize: '12px', wordWrap: { width: width * 0.38 }
      });
      const value = this.frame.addText(x + width * 0.56, rowY - 7, '', {
        fontSize: '12px', fontStyle: 'bold', color: '#ffe6b5'
      });
      const plus = this.frame.addButton({
        x: x + width * 0.80, y: rowY + 1,
        width: Math.max(26, width * 0.12), height: Math.max(16, width * 0.06),
        label: '+', texture: 'ui-button-200', onClick: () => this.allocate(key)
      });
      this.rows.push({ key, value, plus });
    });
    this.frame.addText(x + width * 0.15, y + height * 0.83,
      'Distribua os pontos disponíveis para evoluir os atributos.', {
        fontSize: '10px', color: '#e8cda6', wordWrap: { width: width * 0.70 }
      });
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
    this.gameScene = null;
    this.scene = null;
  }
}
