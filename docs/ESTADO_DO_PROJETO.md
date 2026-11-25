CONQUISTADOR DE WAIFU'S
ESTADO DO PROJETO E GUIA DE CONTINUIDADE
Versao: 1.1
Atualizado em: 25/11/2026
Repositorio oficial: https://github.com/BrazucaGameplay/Colecionador
Branch de referencia: main

======================================================================
ATUALIZACAO — PERSONAGEM, GLB E MOVIMENTACAO POR TOQUE
======================================================================

DECISOES APROVADAS E VIGENTES:
- O terreno do prototipo e uma imagem 2D plana. Nao existe angulacao ou
  inclinacao do terreno a ser simulada pelo personagem.
- A movimentacao do jogador e exclusivamente por toque na tela.
- Nao utilizar teclado em nenhuma camada, nem como fallback ou recurso
  secundario.
- Nao utilizar joystick virtual.
- Um toque curto define o destino do personagem (tap-to-move).
- Arrastar com um dedo continua reservado para mover a camera.
- Pinch com dois dedos continua reservado para zoom da camera.
- O pathfinding usa oito vizinhos (cardeais e diagonais), permitindo
  deslocamento em oito direcoes sobre o plano 2D.
- A direcao visual do modelo pode girar no eixo vertical para orientar o
  personagem; isso nao inclina o terreno nem cria perspectiva no mapa.
- O modelo de personagem e o arquivo warrior.glb, anexado ao GitHub Release
  1.1.4. O arquivo nao deve ser copiado para a branch antes de o responsavel
  fazer o upload local combinado.

REGRAS DE ARQUITETURA:
- Player e estado logico puro: posicao, velocidade de referencia, vida,
  estado de movimento e direcao; sem Phaser, Three.js, DOM, input ou arte.
- PlayerBodyAdapter e a ponte exclusiva entre estado logico e corpo Arcade
  invisivel do Phaser.
- MovementSystem recebe destinos e navega pelo WorldNavigation. Nao conhece
  tela, ponteiro, teclado, sprite, renderizador ou GLB.
- TouchInputController reconhece toque curto, arraste de camera e pinch.
  Nao conhece Player nem altera diretamente a posicao do jogador.
- CharacterRenderer3D recebe somente transformacao/direcao/estado de
  movimento e apresenta o GLB. Nao controla fisica, colisao, vida, destino
  ou regras de gameplay.
- A ausencia ou falha no carregamento do GLB nao pode bloquear a criacao,
  movimentacao ou estado logico do jogador.
- A animacao de locomocao usa Running; Walking e mantida como pose parada
  provisoria (o asset nao declara um clipe Idle separado).
- As oito direcoes sao direcoes de navegacao no plano 2D; o modelo GLB e
  orientado por rotacao de yaw em oito setores de 45 graus.

ESTRUTURA IMPLEMENTADA NESTA ETAPA:
- src/entities/Player.js
- src/entities/PlayerBodyAdapter.js
- src/entities/CharacterRenderer3D.js
- src/rendering/characters/CharacterAssets.js
- src/systems/MovementSystem.js
- src/systems/input/TouchInputController.js
- src/scenes/Game.js integra os adaptadores sem fazer Player depender deles.
- Removidos os controladores antigos de teclado e joystick que nao fazem
  parte da direcao aprovada.

LOCAL DO GLB APOS O UPLOAD:
public/assets/characters/warrior/warrior.glb

URL de origem confirmada:
https://github.com/BrazucaGameplay/Colecionador/releases/download/1.1.4/warrior.glb

ESTADO DE VALIDACAO:
- Estrutura e imports revisados estaticamente.
- Build de producao e workflow devem ser verificados apos o commit.
- Nao declarar teste visual ou Android sem executar em dispositivo.
- O GLB permanece no Release e ainda nao esta na pasta local de assets.
- O personagem logico deve continuar funcional enquanto o arquivo nao for
  enviado para o caminho local indicado.

FIM DA ATUALIZACAO
