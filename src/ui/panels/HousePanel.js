import InfoPanel from './InfoPanel.js';
export default class HousePanel extends InfoPanel {
  constructor(scene, { close } = {}) {
    super(scene, {
      title: 'CASA',
      status: 'Sistema ainda não implementado',
      description: 'A casa aguarda os sistemas de construção, melhorias e armazenamento. Abrir este painel não consome recursos nem altera o mundo.',
      close
    });
  }
}
