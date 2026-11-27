import InfoPanel from './InfoPanel.js';
export default class BestiaryPanel extends InfoPanel {
  constructor(scene, { close } = {}) {
    super(scene, {
      title: 'BESTIÁRIO',
      status: 'Registros ainda não conectados',
      description: 'O catálogo de espécies será preenchido quando os encontros e as derrotas forem integrados ao sistema de bestiário.',
      close
    });
  }
}
