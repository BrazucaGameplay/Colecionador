# Atualização 2.9.9 — pipeline de renderização das árvores

## Implementação
- Novo TreeTexturePipeline executado no Preload antes da montagem do mundo.
- As três imagens são preparadas em canvases POT, com frame nomeado para recortar a área útil.
- Pixels de borda são estendidos aos limites do canvas para reduzir mistura com transparência artificial nos mipmaps.
- A proporção da fonte é preservada; quando necessário, há redução mínima para reservar margem.
- No WebGL, LINEAR_MIPMAP_LINEAR é aplicado temporariamente durante a criação das texturas das árvores. O filtro anterior do renderer é restaurado imediatamente; não há ativação global para terreno, sprites ou HUD.
- WorldObjectManager usa as dimensões do frame útil para calcular escala.
- O acompanhamento da câmera permanece contínuo. Não se arredonda scroll em zoom fracionário, evitando trocar shimmer por passos no movimento.
- Fallback sem WebGL mantém filtragem linear e registra mipmaps como indisponíveis.

## Arquivos
- src/rendering/world/TreeTexturePipeline.js
- src/scenes/Preload.js
- src/world/WorldObjectManager.js
- tests/tree-texture-pipeline.test.js
- tests/world-object-manager.test.js
- package.json e package-lock.json
- docs/ESTADO_DO_PROJETO.md e docs/ATUALIZACAO_2.9.9.md

## Validação
Testes automatizados cobrem dimensões POT, frames, margens e proporção. Build, suíte completa, auditoria e deploy serão confirmados pelo workflow deste commit. Validação visual em Android permanece necessária para comprovar o resultado e o custo de memória na GPU.

## Recap integral
- Produto/plataforma: RPG 2D de ação anime; Phaser 4.2.1, Vite, PWA/GitHub Pages e Capacitor Android. APK/Play Store ainda requerem validação própria.
- Mundo: ilha principal de 4096 × 4096, terreno em imagem única e 85 objetos de vegetação separados; novas ilhas, pontes, portais e mapa-múndi permanecem planejados.
- Gameplay: movimentação por toque/destino, pan, pinch zoom, combate, monstros, progressão, skins e persistência existem em diferentes graus; waifus/harem não são declarados como concluídos.
- Arquitetura: cenas Phaser e módulos JS; Player lógico, adaptador Arcade, CameraController, WorldBootstrap, WorldObjectManager, navegação, colisão, renderizadores e SaveManager.
- Assets: fontes das árvores permanecem no Git; canvases POT e mipmaps são preparados em runtime. Nenhum asset final foi substituído no repositório.
- Interface/mobile: entrada touch e HUD em câmera separada; teste físico Android não executado.
- Build/publicação: Vite e workflow Deploy; resultado depende da execução deste commit.
- Pendências: validar visualmente zoom 0,2 / 0,4 / 0,6 e movimento no Android; observar memória de textura e fallback Canvas.
