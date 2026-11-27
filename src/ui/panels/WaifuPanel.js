import InfoPanel from './InfoPanel.js';
export default class WaifuPanel extends InfoPanel {
  constructor(scene, { close } = {}) {
    super(scene, {
      title: 'WAIFUS',
      status: 'Sistema de vínculos pendente',
      description: 'Este painel aguarda a integração dos cards, dos vínculos, dos presentes e das habilidades. Nenhum personagem ou bônus fictício será criado.',
      close
    });
  }
}
