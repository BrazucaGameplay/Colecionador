# Atualização 2.6.3 — WorldBootstrap

## Objetivo
Primeira etapa da modularização da inicialização do jogo. A montagem do mundo foi extraída de `Game.js` para `src/world/WorldBootstrap.js`.

## Alterações
- `WorldBootstrap` assume dimensões e limites físicos do mundo, navegação, oceano, terreno, máscara caminhável/cache, profundidade, colisões e instanciação das árvores validadas.
- `Game` solicita a inicialização do mundo e recebe o ponto de spawn; continua coordenando jogador, combate, movimento, câmera, interface e ciclo de atualização.
- O módulo também centraliza a liberação dos objetos e gerenciadores pertencentes ao mundo.
- Terreno, layout, manifestos, texturas e algoritmo de navegação não foram redesenhados nem substituídos.

## Recap do estado do jogo
- **Produto/plataforma:** RPG de ação 2D com apresentação isométrica/2.5D; Phaser 4, Vite e Capacitor. Android é prioridade; publicação Android instalada e validação em aparelho permanecem pendentes de confirmação física.
- **Mundo:** uma ilha jogável de 4096 × 4096; terreno em imagem única, oceano em TileSprite, árvores independentes e navegação por máscara alfa. Ilhas adicionais, catálogo, pontes, portais e transições continuam planejados.
- **Gameplay:** jogador com estado lógico separado do renderer; movimento por toque/destino, combate, progressão e monstros com ativação/IA. Conteúdo de waifus, inventário e progressão completa não deve ser considerado implementado sem inspeção específica.
- **Arquitetura:** Phaser 4.2.1, JavaScript ES Modules, Vite, cenas Boot/Preload/Game/GameUI, sistemas de movimento/combate/progressão, gerenciadores de monstros, renderizadores de personagens e agora WorldBootstrap.
- **Assets:** sprites de personagem PNG/JSON em `public/assets/characters/sprites/skin_01`; monstros em `public/assets/monsters`; terreno, rochas, oceano e estruturas em `public/assets/world`. Nenhum asset foi alterado nesta etapa.
- **Interface/mobile:** GameUI em cena própria e câmera HUD separada; entrada por toque e câmera com zoom/arraste. Teste visual em aparelho Android não executado nesta etapa.
- **Build/publicação:** Vite build e GitHub Actions Deploy são os caminhos declarados. O resultado do workflow para o commit desta atualização precisa ser confirmado após o push.
- **Pendências:** CameraController, SaveManager e GameSystemsBootstrap continuam em Game.js ou nos sistemas existentes e serão tratados em etapas separadas. A validação de build, testes e deploy do commit 2.6.3 é necessária antes de declarar a etapa publicada.

## Verificações
A alteração foi preparada para manter os mesmos caminhos de assets, cache, dimensões, algoritmo de navegação, ponto de spawn e ordem de inicialização. O build/teste automatizado e a publicação devem ser considerados não confirmados até a execução do workflow correspondente ao commit.
