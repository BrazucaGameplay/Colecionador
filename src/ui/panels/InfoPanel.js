import PanelFrame from '../components/PanelFrame.js';

export default class InfoPanel {
  constructor(scene, { title, status, description, close = () => {} } = {}) {
    this.scene = scene;
    this.frame = new PanelFrame(scene, { title, width: 560, height: 420, variant: 'wide', close });
    const { x, y, width, height } = this.frame;
    this.frame.addText(x + width * 0.15, y + height * 0.34, status || '', {
      fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'bold',
      color: '#ffe0a0', wordWrap: { width: width * 0.70 }
    });
    this.frame.addText(x + width * 0.15, y + height * 0.49, description || '', {
      fontSize: '12px', wordWrap: { width: width * 0.70 }
    });
  }

  destroy() {
    this.frame?.destroy();
    this.frame = null;
    this.scene = null;
  }
}
