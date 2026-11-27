import { STAT_UPGRADES } from '../../entities/Player.js';
import PanelFrame from '../components/PanelFrame.js';

export default class ProfilePanel {
  constructor(scene, { close = () => {}, gameScene } = {}) {
    this.scene = scene;
    this.gameScene = gameScene;
    this.frame = new PanelFrame(scene, { title: 'PERFIL DO JOGADOR', width: 440, height: 520, close });
    const { x, y, width, height } = this.frame;
    this.summary = this.frame.addText(x + 22, y + 76, '');
    this.rows = [];
    const keys = Object.keys(STAT_UPGRADES);
    const rowHeight = Math.min(43, (height - 164) / Math.max(1, keys.length));
    keys.forEach((key, index) => {
      const rowY = y + 126 + index * rowHeight;
      this.frame.addText(x + 24, rowY, STAT_UPGRADES[key].label, { fontSize: '12px' });
      const value = this.frame.addText(x + width - 94, rowY, '', { fontStyle: 'bold' });
      const plus = this.frame.addButton({
        x: x + width - 38, y: rowY + 7, width: 34, height: 30, label: '+',
        onClick: () => this.allocate(key)
      });
      this.rows.push({ key, value, plus });
    });
    this.frame.addText(x + 22, y + height - 34,
      'Distribua os pontos disponíveis para evoluir os atributos.', { fontSize: '10px', color: '#c9b99f' });
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
      row.plus.background?.setAlpha(player.statPoints > 0 ? 1 : 0.45);
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
