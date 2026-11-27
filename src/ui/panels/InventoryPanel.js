import InfoPanel from './InfoPanel.js';
export default class InventoryPanel extends InfoPanel {
  constructor(scene, { close } = {}) {
    super(scene, {
      title: 'INVENTÁRIO',
      status: 'Catálogo de itens pendente',
      description: 'O inventário será ativado quando o catálogo e as instâncias de itens estiverem conectados aos drops e ao salvamento.',
      close
    });
  }
}
