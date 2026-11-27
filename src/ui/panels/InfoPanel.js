import PanelFrame from '../components/PanelFrame.js';

export default class InfoPanel {
  constructor(scene, { title, status, description, close = () => {} } = {}) {
    this.scene = scene;
    this.frame = new PanelFrame(scene, { title, width: 440, height: 270, close });
    const { x, y, width } = this.frame;
    this.frame.addText(x + 24, y + 94, status || '', {
      fontFamily: 'Georgia, serif', fontSize: '14px', fontStyle: 'bold', color: '#f1cf88'
    });
    this.frame.addText(x + 24, y + 132, description || '', {
      fontSize: '12px', wordWrap: { width: width - 48 }
    });
  }

  destroy() {
    this.frame?.destroy();
    this.frame = null;
    this.scene = null;
  }
}
