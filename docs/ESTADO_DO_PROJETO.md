CONQUISTADOR DE WAIFU'S
ESTADO DO PROJETO E GUIA DE CONTINUIDADE
Versao: 1.0
Atualizado em: 24/11/2026
Repositorio oficial: https://github.com/BrazucaGameplay/Colecionador
Branch de referencia: main

======================================================================
1. FINALIDADE DESTE DOCUMENTO
======================================================================

Este arquivo e a referencia de continuidade do projeto. Deve ser atualizado
quando uma decisao importante for aprovada, uma etapa for concluida ou o
estado real do codigo mudar.

O repositorio e a fonte oficial do codigo. Este documento registra o estado
conhecido e as decisoes de produto; nao substitui a leitura dos arquivos
atuais antes de qualquer alteracao.

Nao considerar uma funcionalidade implementada apenas porque aparece no
planejamento. Distinguir sempre:
- APROVADO: decisao de direcao tomada pelo responsavel.
- IMPLEMENTADO: existe no codigo versionado.
- VALIDADO: foi verificado no ambiente indicado.
- PENDENTE: ainda precisa ser feito ou confirmado.

======================================================================
2. DIRECAO ATUAL DO JOGO
======================================================================

Projeto: Conquistador de Waifu's.
Genero: RPG 2D de acao com estetica anime e exploracao.
Prioridade de plataforma: Android, mantendo distribuicao PWA/web.
Framework declarado: Phaser 4.
Ferramentas: Vite, GitHub Pages e Capacitor.

Direcao visual:
- Arte ilustrada anime, rica em detalhes, volume e iluminacao.
- Perspectiva isometrica.
- Evitar pixel art, chibi e visual vetorial simplificado.
- Usar assets finais aprovados; nao criar assets provisórios.
- Nao substituir asset aprovado sem avaliar a adequacao do substituto.

Direcao de mundo aprovada:
- O mundo sera composto por ilhas/areas ilustradas como pecas visuais
  continuas, em vez de construir todo o terreno com repeticao de tiles.
- Ilhas proximas poderao ser conectadas por pontes e caminhos fisicos.
- Portais podem conectar regioes distantes ou especiais.
- Um mapa-mundi podera mostrar ilhas descobertas e conexoes.
- A navegacao deve permitir que o jogador atravesse conexoes sem trocar
  de tela desnecessariamente, sempre que a geometria e o desempenho permitirem.
- A primeira validacao planejada e uma ilha principal e duas ilhas
  secundarias conectadas por pontes.

Importante: a arquitetura de multiplas ilhas, pontes, portais e mapa-mundi
esta APROVADA como direcao, mas ainda NAO esta implementada no codigo atual.

======================================================================
3. ESTADO REAL DO REPOSITORIO
======================================================================

Repositorio: BrazucaGameplay/Colecionador
Branch: main
Commit de referencia consultado em 24/11/2026:
704f7d70f1bc8331125e8ee80fc04163929c1c4c

Tecnologias declaradas:
- phaser ^4.2.1
- vite ^5.0.0
- @capacitor/core ^6.0.0
- @capacitor/android ^6.0.0
- @capacitor/cli ^6.0.0

Estrutura de codigo observada:
- src/main.js
- src/config.js
- src/scenes/Boot.js
- src/scenes/Preload.js
- src/scenes/Menu.js
- src/scenes/Game.js
- src/entities/Player.js
- src/entities/Monster.js
- src/systems/touch.js
- src/world/WorldNavigation.js

Assets de mundo presentes:
- public/assets/world/terrain/terrain-clearing-1.png
- public/assets/world/terrain/terrain-clearing-2.png
- public/assets/world/vegetation/tree-flowering.png
- public/assets/world/vegetation/tree-large.png

Os antigos SVGs provisórios de terreno e vegetacao foram removidos do
repositorio. O Preload carrega os quatro PNGs finais listados acima.

Estado do cenario no codigo:
- Game.js cria um mundo retangular de 2560 x 1100 unidades.
- As duas imagens de terreno sao posicionadas como imagens completas
  no mundo, lado a lado.
- As duas especies de arvore sao posicionadas como objetos separados.
- O movimento do jogador, clique para definir destino, arraste para mover
  a camera e zoom por gesto de dois dedos permanecem no codigo.
- WorldNavigation usa uma grade de navegacao com celulas de 32 unidades
  e obstaculos elipticos registrados para as arvores.

Limitacoes atuais confirmadas pela leitura do codigo:
- Ainda nao existe sistema de multiplas ilhas.
- Ainda nao existem pontes, portais, transicoes entre mapas ou mapa-mundi.
- A navegacao atual nao usa uma mascara completa de terreno caminhavel
  derivada da silhueta das imagens; o mundo continua limitado por um
  retangulo e por obstaculos registrados no codigo.
- As entidades Player e Monster ainda usam texturas circulares geradas
  em Preload.js, portanto nao representam os sprites finais do jogo.
- Game.js ainda concentra movimento, combate simples, pontuacao,
  persistencia simples e entrada. A modularizacao prevista no plano
  arquitetural ainda nao foi concluida.
- O salvamento observado em Game.js e simples e usa localStorage.
  Nao existe ainda o SaveManager centralizado e versionado descrito
  no plano arquitetural.

======================================================================
4. BUILD, PUBLICACAO E VALIDACAO
======================================================================

O projeto esta configurado para publicar pelo GitHub Actions em GitHub Pages.
Na consulta de 24/11/2026, o workflow Deploy associado ao commit
704f7d70f1bc8331125e8ee80fc04163929c1c4c estava concluido com sucesso.

Isso confirma o resultado do workflow de publicacao para aquele commit.
Nao confirma, por si so:
- validacao visual completa de todos os enquadramentos e escalas;
- navegacao correta sobre toda a area ilustrada;
- desempenho em aparelhos Android;
- funcionamento como aplicativo Android instalado.

Nao declarar teste Android concluido sem executar em dispositivo real.
Antes de uma etapa ser considerada pronta, registrar separadamente build,
deploy, verificacao visual e teste em dispositivo quando aplicavel.

======================================================================
5. PROXIMA ETAPA RECOMENDADA
======================================================================

Antes de construir as tres ilhas, validar tecnicamente o modelo de terreno
ilustrado em uma unica area:

1. Verificar a composicao visual real das duas imagens de terreno no jogo,
   incluindo escala, alinhamento, limites e continuidade.
2. Definir uma area caminhavel coerente com a silhueta da ilha, sem permitir
   que o jogador caminhe fora da plataforma ou sobre o vazio.
3. Separar a colisao visual dos objetos (arvores, rochas e demais elementos)
   da area caminhavel do terreno.
4. Preservar o tap-to-move, arraste de camera e pinch zoom.
5. Somente depois de validar a ilha-base, criar as conexoes fisicas e as
   duas ilhas secundarias.
6. Introduzir um grafo de conexoes entre ilhas e caminhos locais por ilha,
   para permitir pathfinding entre areas sem acoplar o sistema a Game.js.

A primeira implementacao deve ser incremental. Nao reescrever o nucleo de
navegacao nem criar uma arquitetura ampla antes de confirmar os requisitos
reais da ilha-base.

======================================================================
6. PRINCIPIOS DE TRABALHO OBRIGATORIOS
======================================================================

- Analisar os arquivos atuais antes de modificar.
- Implementar diretamente a tarefa solicitada, sem diagnosticos interminaveis.
- Nao fazer mudancas estruturais sem necessidade tecnica justificada.
- Preservar controles, camera, navegacao e comportamentos que ja funcionam.
- Nao criar assets provisórios.
- Nao apagar assets aprovados ou antigos antes de confirmar a substituicao
  e a integracao dos novos.
- Usar main como branch de referencia e registrar commits.
- Verificar imports, caminhos, dependencias e build.
- Conferir o GitHub Actions apos alteracoes relevantes.
- Nao afirmar teste Android se houve apenas verificacao estatica ou build.
- Nao afirmar validacao visual sem realmente observar o jogo renderizado.
- Nao confundir planejamento aprovado com funcionalidade implementada.
- Manter o documento de estado atualizado quando houver mudancas relevantes.

A arquitetura-alvo detalhada permanece em:
docs/PLANO_ARQUITETURA_E_DESENVOLVIMENTO.txt

A diretriz de separacao do repositorio antigo permanece em:
docs/DIRETRIZ_DE_REUSO_DO_REPOSITORIO_ORIGINAL.txt

O repositorio BrazucaGameplay/CONQUISTADOR- e referencia visual limitada
as cartas/ilustracoes de waifus e monstros, conforme a diretriz existente.
Nao copiar codigo, cenarios, mapas, tiles ou assets ambientais daquele
repositorio sem autorizacao explicita.

======================================================================
7. ORGANIZACAO DAS CONVERSAS
======================================================================

Usar conversas separadas por frente de trabalho, sem perder o contexto
central deste documento:

- CONQUISTADOR — ARQUITETURA E PROGRAMAÇÃO:
  codigo, Phaser, sistemas, navegacao, salvamento, bugs e GitHub.

- CONQUISTADOR — ASSETS DO MUNDO:
  terrenos, ilhas, vegetacao, objetos, construcoes e composicao visual.

- CONQUISTADOR — PERSONAGENS E ANIMAÇÕES:
  waifus, protagonista, monstros, spritesheets e animacoes.

- CONQUISTADOR — GAME DESIGN:
  combate, progressao, inventario, habilidades, dungeons, economia e quests.

Ao iniciar ou retomar uma frente, consultar este arquivo e os arquivos
especificos do repositorio que forem relevantes. Nao confiar apenas no
historico de outra conversa.

Decisoes novas devem ser registradas aqui ou no documento especializado
correspondente. Se uma decisao nova substituir outra, registrar claramente
o que foi substituido e por que.

======================================================================
8. REGISTRO DE ALTERACOES
======================================================================

24/11/2026
- Registrada a direcao de mundo composto por ilhas ilustradas continuas.
- Registrada a aprovacao conceitual de pontes/caminhos, portais e mapa-mundi.
- Registrado o estado real dos quatro PNGs finais no repositorio.
- Registrada a remocao dos SVGs provisórios do mundo.
- Registrado o estado do codigo de terreno e navegacao, sem declarar
  validacao Android ou validacao visual completa.
- Registrado o workflow Deploy concluido com sucesso no commit
  704f7d70f1bc8331125e8ee80fc04163929c1c4c.

FIM DO DOCUMENTO


======================================================================
9. ATUALIZACAO DE ARQUITETURA — 25/11/2026
======================================================================

Esta secao e a decisao mais recente e SUBSTITUI qualquer direcao anterior
que trate o mundo como um continente continuo, varias areas simultaneamente
carregadas ou uma sequencia de mapas sem uma regra de carregamento definida.

DIRECAO APROVADA:
- O mundo sera formado por ilhas pequenas e independentes.
- Apenas uma ilha ficara carregada como mundo jogavel por vez.
- Pontes e portais conectarao as ilhas.
- Fora da plataforma da ilha, o ambiente visual sera ceu e nuvens.
- O visual desejado tem aparencia tridimensional/2.5D, com volume,
  perspectiva, sombras e iluminacao, mantendo Phaser 4 como base inicial.
- Nao ha decisao de migrar o jogo para um motor 3D. Three.js presente no
  package.json nao significa que exista integracao ativa.

FLUXO DE TRANSICAO APROVADO:
1. Registrar estado da ilha de origem.
2. Ativar a saida por ponte ou portal.
3. Executar transicao visual.
4. Descarregar entidades, navegacao, listeners e recursos da ilha atual.
5. Carregar configuracao e assets da ilha de destino.
6. Montar a ilha e preparar navegacao.
7. Posicionar jogador no ponto de entrada.
8. Retomar jogo e camera.

ESTADO DE IMPLEMENTACAO EM 25/11/2026:
- A leitura de src/scenes/Preload.js confirma carregamento de uma imagem
  chamada island-01.
- A leitura de src/scenes/Game.js confirma que essa imagem define as
  dimensoes do mundo e e instanciada como terreno unico.
- A leitura de src/world/WorldNavigation.js confirma navegacao local
  por grade e mascara alfa.
- Os arquivos lidos nao implementam catalogo de ilhas, carregador,
  transicoes, pontes, portais ou descarregamento/carregamento de ilhas.
- Portanto, a arquitetura por ilhas esta APROVADA, mas NAO IMPLEMENTADA.

DOCUMENTACAO:
- Nova referencia: docs/ARQUITETURA_DO_MUNDO_POR_ILHAS.md
- O documento descreve decisoes, justificativas, modelo de dados conceitual,
  arquitetura sugerida, fases e criterios de aceitacao.
- Esta documentacao nao afirma que codigo futuro ja exista.

PROXIMOS PASSOS:
1. Estabilizar e validar a ilha-base existente.
2. Definir contrato de dados para cada ilha.
3. Criar uma segunda ilha real para validar a primeira transicao.
4. Implementar descarregamento/carregamento e persistencia.
5. Expandir o catalogo apenas depois da validacao.

Esta atualizacao passa a ser a referencia vigente para o desenho do mundo.



======================================================================
10. ATUALIZACAO — PERSONAGEM, GLB E MOVIMENTACAO POR TOQUE (25/11/2026)
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

ESTRUTURA IMPLEMENTADA:
- src/entities/Player.js
- src/entities/PlayerBodyAdapter.js
- src/rendering/characters/CharacterRenderer3D.js
- src/rendering/characters/CharacterAssets.js
- src/systems/MovementSystem.js
- src/systems/input/TouchInputController.js
- src/scenes/Game.js integra os adaptadores sem fazer Player depender deles.
- Removidos os controladores antigos de teclado e joystick.

LOCAL DO GLB APOS O UPLOAD:
public/assets/characters/warrior/warrior.glb

URL do Release confirmado:
https://github.com/BrazucaGameplay/Colecionador/releases/download/1.1.4/warrior.glb

ESTADO DE VALIDACAO:
- Alteracoes registradas no commit d468d77950e1809a5a3e6ba449d3801beeb0b7e7.
- Build e workflow ainda aguardam conclusao.
- Nao declarar teste visual ou Android sem executar em dispositivo.
- O GLB permanece no Release e ainda nao esta na pasta local de assets.
- O personagem logico continua funcional enquanto o arquivo nao for enviado
  para o caminho local indicado.


======================================================================
11. ATUALIZACAO — FONTES DE ANIMACAO DA SKIN 01 (25/11/2026)
======================================================================

FONTES PUBLICADAS E CONFERIDAS:
- Release: skin-01-animation-sources-v1
- animacoes_basicas.glb: Running, Dead, Flirty_Strut e Idle.
  SHA-256: 5b87f00ff4ce79018a8466b53ce7aeb66116b8aca69631028407b4d1ba5ce5a9
- animacoes_batalha.glb: Combate_dd, Salto e Right_Hand_Sword_Slash.
  SHA-256: f0b3da7edb299d117e9caf41b866696afc7dd7a253fc267ca4477a0ea3b6e355

INTEGRACAO:
- Os dois GLBs permanecem no GitHub Release e sao fontes do processo de bake.
- O workflow baixa os arquivos por URL fixa e confere SHA-256.
- Os GLBs ficam temporariamente em public/assets/characters/skin_01/
  animation-sources/ durante o bake e sao removidos ao concluir.
- O Baker apresenta os dois pacotes e exporta cada clip em PNG + JSON.
- O script confere os nomes esperados dos sete clips e exige sete pares.
- O catalogo do renderer 2D usa Idle, Running, Dead, Flirty_Strut,
  Combate_dd, Salto e Right_Hand_Sword_Slash.
- Walking e Running compartilham o atlas Running, evitando duplicacao.
- A solicitacao logica "combat" alterna entre Combate_dd e
  Right_Hand_Sword_Slash.

VALIDACAO:
- Os hashes foram conferidos contra os arquivos-fonte locais e os
  metadados dos dois assets publicados no Release.
- A geracao dos atlas depende da execucao do workflow apos este commit.
- O deploy depende do bake e da execucao subsequente do workflow Deploy.
- Teste visual e de desempenho no Android permanecem pendentes.


CORRECAO DA EXECUCAO DO WORKFLOW:
- A primeira execucao do bake falhou na etapa setup-node porque foi
  configurado cache npm sem existir package-lock.json no repositorio.
- Removida a configuracao de cache; npm install permanece como instalacao
  de dependencias do workflow.
- Ajustada a alternancia dos golpes para avancar somente depois que a
  acao for aceita pelo estado de combate.
- Esta correcao recebe novo patch de versao, conforme o processo
  obrigatorio do projeto. A nova execucao deve confirmar o bake.


CORRECOES APOS A PRIMEIRA AUDITORIA:
- O primeiro teste automatizado identificou que a morte nao interrompia
  uma acao de combate protegida. CharacterActionState agora permite que
  "death"/"dying" prevaleca sobre qualquer acao ativa.
- Os testes de catalogo foram atualizados para os sete clips dos dois
  novos pacotes e para o compartilhamento do atlas Running entre
  walking/running.
- O script de bake agora aguarda o carregamento automatico inicial do
  Baker antes de selecionar os modelos, evitando concorrencia no loader.
- O workflow Deploy passa a ignorar commits que alteram diretamente o
  catalogo/renderer de animacoes; a publicacao sera iniciada pelo evento
  workflow_run apos o bake concluir com sucesso.
- Esta correcao recebe novo patch de versao.


======================================================================
12. ATUALIZACAO — ESCALA DO PROTAGONISTA E CICLO DE COMBATE (25/11/2026)
======================================================================

ALTERACOES IMPLEMENTADAS:
- A escala mundial padrao do sprite do protagonista passou de 0.95 para
  1.12 (aproximadamente 18% maior).
- A escala e aplicada no sprite e a sombra acompanha proporcionalmente.
- A origem/pivo por quadro continua sendo obtida dos metadados dos atlas;
  portanto, o alinhamento dos pes e a ordenacao de profundidade permanecem
  vinculados ao ponto real de apoio de cada quadro.
- O comando logico "combat" agora alterna ciclicamente entre:
  1. Combate_dd (skin-batalha-combate_dd)
  2. Salto (skin-batalha-salto)
  3. Right_Hand_Sword_Slash (skin-batalha-right_hand_sword_slash)
- O ciclo reinicia apos a terceira animacao.
- O indice so avanca quando a acao e aceita pelo estado de acoes.
- Quando Salto e escolhido dentro do ciclo de combate, recebe prioridade
  70 e bloqueio de movimento, igualando a prioridade operacional dos
  golpes. O uso independente da acao "jump" preserva sua prioridade 40.
- As tres animacoes continuam sendo reproduzidas como acoes nao repetidas;
  ao concluir, o renderer retorna a locomocao.

VERSIONAMENTO:
- Versao anterior: 1.5.7
- Nova versao: 1.6.0 (nova funcionalidade de alternancia de combate).

RECAP DO ESTADO:
- Produto: RPG 2D de acao anime, prioritariamente Android, com PWA/web e
  preparacao Capacitor para futuro APK/Google Play.
- Mundo: ilha circular jogavel e navegacao local implementadas. Catalogo
  de ilhas, transicoes, pontes e portais seguem aprovados, mas pendentes.
- Gameplay: toque define destino; arraste move camera; pinch altera zoom.
  Combate simples por sobreposicao/ataque ao monstro, vida, respawn,
  pontuacao e salvamento local implementados. Progressao, inventario,
  quests e dungeons completas permanecem pendentes.
- Personagem: Player logico separado do renderer Phaser; sprite 2D usa
  atlas e metadados. Sete clips disponiveis: Idle, Running, Dead,
  Flirty_Strut, Combate_dd, Salto e Right_Hand_Sword_Slash.
- Waifus: conceito de colecao/progressao aprovado, sistema ainda nao
  implementado.
- Arquitetura: Phaser 4, Vite, JavaScript, sistemas separados para
  movimentacao, input por toque, navegacao, colisao, profundidade e
  apresentacao do personagem. Three.js e usado no Baker de GLB, nao no
  renderer 2D em tempo de jogo.
- Assets: sete pares PNG/JSON em
  public/assets/characters/sprites/skin_01/. GLBs fonte ficam no Release.
- Interface mobile: camera e controles por toque existentes; aumento da
  escala do protagonista foi aplicado no renderer. Conferencia visual
  fisica em Android ainda pendente.
- Build/publicacao: GitHub Actions executa testes, build, verificacao de
  sprites e deploy no GitHub Pages. A confirmacao desta atualizacao depende
  do workflow do commit 1.6.0.
- Riscos: escala 1.12 pode exigir ajuste fino conforme densidade/tamanho
  da tela Android; a alternancia e acionada pelo atual evento de ataque
  por contato com o monstro, nao por um botao de ataque dedicado.

VALIDACAO PENDENTE DESTA ATUALIZACAO:
- Executar testes e build no workflow associado ao commit 1.6.0.
- Confirmar deploy correspondente ao commit final.
- Testar proporcao, enquadramento e legibilidade das tres poses em aparelho
  Android real.


======================================================================
13. ATUALIZAÇÃO — SISTEMA MODULAR DE MONSTROS E PREPARAÇÃO DE SPRITES (25/11/2026)
======================================================================

VERSIONAMENTO:
- Versão anterior: 1.6.1
- Nova versão: 1.7.0.
- Motivo: nova funcionalidade compatível, com gerenciamento de entidades,
  surgimento por zonas, fábrica, comportamento e carregamento de animações.

IMPLEMENTADO NO CÓDIGO:
- Monster.js agora contém somente estado lógico, vida, dano, direção,
  movimentação e restauração; não depende de Phaser nem de arte.
- MonsterBodyAdapter cria corpo Arcade invisível, independente do sprite.
- MonsterRenderer apresenta atlas PNG/JSON e aplica pivôs por quadro,
  escala, sombra e profundidade compartilhada.
- MonsterAssetLoader carrega e registra pacotes de animação no mesmo
  contrato de metadados usado pelos sprites do protagonista.
- MonsterFactory monta entidade, corpo, renderer e comportamento.
- MonsterBehaviorController implementa patrulha curta limitada à zona
  e validada por WorldNavigation.
- MonsterSpawner distribui população por zonas, respeita limite máximo,
  distância do jogador, área caminhável, ocupação e temporizador de respawn.
- MonsterManager centraliza entidades, sobreposição com o corpo do jogador,
  dano, morte, remoção e atualização.
- Game.js não mantém mais referência direta a um único monstro.
- Preload.js remove a textura circular vermelha provisória e registra
  os carregadores de atlas de monstros.
- A ilha inicial possui quatro zonas configuradas para a espécie slime,
  com até dois monstros por zona quando os sprites estiverem habilitados.

PREPARAÇÃO DOS SPRITES:
- Diretório criado: public/assets/monsters/slime/.
- Contrato documentado em public/assets/monsters/README.md e
  docs/GUIA_DE_SPRITES_DE_MONSTROS.md.
- Cada animação usa par PNG + JSON com frames direcionais, pivô por quadro,
  fps e nomes de quadros d{direction}-f{frame}.
- Pacotes previstos para a primeira espécie: idle, walking, attack e death.
- A definição do slime permanece com visual.enabled=false porque ainda
  não há atlas de monstro no repositório. Assim não são feitas requisições
  a arquivos inexistentes nem exibidos sprites provisórios.
- Ao enviar os atlas finais, ativar visual.enabled e preencher os metadados
  correspondentes em src/data/monsters/index.js.

RECAP DO ESTADO INTEGRAL:
- Produto/plataforma: RPG 2D de ação com estética anime, Android como
  prioridade e distribuição web/PWA; Capacitor mantém preparação técnica
  para APK/Google Play. APK e publicação na loja não estão concluídos.
- Mundo/conteúdo: uma ilha circular jogável está implementada. As quatro
  zonas de surgimento da ilha 01 estão configuradas. Catálogo e transição
  entre ilhas continuam planejados, não implementados.
- Gameplay: tap-to-move, arraste da câmera, pinch zoom, vida do jogador,
  contato/ataque automático, pontuação e salvamento local existem.
  O sistema de monstros suporta múltiplas entidades, dano, morte e respawn,
  mas nenhuma espécie aparece até existir atlas final habilitado.
  Drops, experiência efetiva, dano de contato contra jogador e combate
  avançado dos monstros não estão implementados.
- Personagens: Player lógico, corpo invisível e renderer 2D separados.
  Sete pacotes/ações do protagonista são catalogados conforme o código.
  Sistema de waifus ainda não está implementado nesta branch.
- Arquitetura: Phaser 4.2.1, Vite 5, JavaScript ES modules, Arcade Physics,
  WorldNavigation/A*, WorldDepthManager, WorldObjectManager, input por toque
  e sistemas modulares de monstros. Three.js permanece declarado, sem
  integração de renderização de jogo confirmada nesta etapa.
- Assets: sprites do protagonista em PNG/JSON sob
  public/assets/characters/sprites/skin_01/. Assets de ilha, vegetação
  e rochas nos diretórios de mundo. Nenhum sprite de monstro foi encontrado
  em public/assets/monsters; a pasta de slime contém apenas marcador e guia.
- Interface/mobile: orientação, escala e interação permanecem as da cena
  atual; nenhum teste visual em Android foi realizado nesta atualização.
- Build/publicação: Vite, scripts npm, Capacitor e workflows GitHub Actions
  permanecem configurados. O workflow Deploy ganhou validação opcional dos
  atlas de monstros habilitados. O resultado do workflow deste commit ainda
  precisa ser confirmado.
- Pendências/riscos: inserir atlas PNG/JSON finais; ativar a espécie;
  definir balanceamento, drops, experiência e IA de combate; executar build,
  testes, deploy e validação visual/física em aparelho Android.

VALIDAÇÃO:
- Testes automatizados do sistema de monstros adicionados em
  tests/monster-system.test.js.
- A validação de sprites de monstros foi adicionada ao workflow, mas
  precisa ser executada pelo GitHub Actions no commit desta atualização.
- Não declarar sprites de monstros carregados, gameplay visual validado
  ou teste Android concluído enquanto os atlas não forem enviados e
  verificados em dispositivo.


======================================================================
14. CORREÇÃO DE VALIDAÇÃO E CICLO DE VIDA — 25/11/2026
======================================================================

VERSIONAMENTO:
- Versão anterior: 1.7.0
- Nova versão: 1.7.1.
- Motivo: correção do teste de população/respawn, refinamento do ciclo
  de destruição e validação dos limites dos quadros de atlas.

CORREÇÕES:
- O teste do Spawner foi corrigido para distinguir a lista histórica de
  criações da população atualmente viva. A lógica de respawn não precisava
  de alteração; a expectativa do teste estava incorreta.
- MonsterManager agora é destruído antes do corpo do jogador, removendo
  primeiro os colliders de sobreposição que dependem dele.
- MonsterFactory passou a gerar IDs sequenciais por instância, eliminando
  dependência de aleatoriedade para identidade de entidades.
- A validação dos atlas verifica também se os retângulos de cada quadro
  permanecem dentro das dimensões declaradas do atlas.
- Corrigida a formatação dos exemplos de caminho e código nos guias.

VALIDAÇÃO:
- A primeira execução do workflow do commit 7ddb0f8 identificou um único
  teste com expectativa incorreta (21 aprovados, 1 reprovado).
- A falha foi localizada no teste de respawn, não no código do Spawner.
- A versão 1.7.1 deve ser validada pelo novo workflow associado ao commit
  corretivo; não considerar o commit 1.7.0 pronto para publicação.


======================================================================
15. MODERNIZAÇÃO DA STACK DE DESENVOLVIMENTO — 25/11/2026
======================================================================

VERSIONAMENTO:
- Versão anterior: 1.7.2.
- Nova versão: 2.0.0.
- Motivo: migração de versões principais do ambiente de build e runtime
  Capacitor, além da atualização das ferramentas e do contrato de imports
  ESM do Phaser 4.

VERSÕES ESTÁVEIS ADOTADAS:
- Node.js 26.13.1 LTS (fixado em .nvmrc).
- npm 12.2.2 (registrado em packageManager).
- Phaser 4.2.1.
- Vite 8.3.8.
- Capacitor Core, Android e CLI 8.6.2 (mesma versão em todos os pacotes).
- Three.js 0.187.0.
- Playwright 1.65.1.
- Requisitos mínimos de Node declarados: >=22.12.0.

ALTERAÇÕES DE CÓDIGO:
- Imports do Phaser padronizados para import * as Phaser from 'phaser'
  nos pontos de entrada, cenas, input por toque e renderer de sprites.
- Vite 8 utiliza Rolldown no pipeline de build. O vite.config.js atual
  mantém somente base, plugin transformIndexHtml, servidor e opções
  simples de build; não foi identificada configuração Rollup/esbuild
  personalizada que exija migração manual.
- CharacterRenderer3D e character-baker continuam usando os addons
  oficiais do Three.js (GLTFLoader e MeshoptDecoder); compatibilidade
  funcional depende dos testes de build e do workflow de bake.
- A configuração do Capacitor permanece em capacitor.config.ts.

LOCKFILE E SEGURANÇA:
- package-lock.json não existia na branch main consultada antes desta
  atualização. Foi criado um workflow Dependency lockfile para gerar e
  versionar o lockfile, aplicar npm audit fix sem --force, executar testes,
  build e auditoria completa.
- O lockfile será considerado confirmado somente após o workflow gerar
  e publicar o arquivo no repositório.
- Dependências de produção e de desenvolvimento serão auditadas em
  conjunto; não basta o resultado anterior de npm audit --omit=dev.
- Dependabot foi configurado para propor atualizações semanais de
  dependências npm e GitHub Actions.

ANDROID / CAPACITOR:
- A branch main não contém diretório android/ nem arquivos Gradle.
  Portanto, a dependência Capacitor foi atualizada, mas não havia projeto
  Android nativo versionado para migrar nesta etapa.
- Capacitor 8 requer Node.js 22+, Android Studio 2025.2.1 ou superior e
  Android SDK API 24 ou superior.
- A geração/sincronização do projeto Android e o teste em aparelho real
  permanecem pendentes; build web não substitui validação Android.

RECAP INTEGRAL DO JOGO:
- Produto/plataforma: RPG 2D de ação com estética anime, Android como
  prioridade e distribuição PWA/web. Capacitor prepara a integração
  nativa; APK e publicação na Google Play não estão concluídos.
- Mundo: uma ilha ativa com terreno ilustrado, máscara de navegação,
  objetos de mundo, profundidade e spawn configurado. Catálogo de ilhas,
  transições, pontes, portais e carregamento de uma ilha por vez seguem
  aprovados/planejados, não implementados.
- Gameplay: tap-to-move, arraste da câmera e pinch zoom; jogador lógico,
  corpo Arcade, movimento/pathfinding, combate simples, vida, pontuação e
  salvamento local. O sistema modular de monstros existe, mas o slime
  permanece com visual desabilitado enquanto não houver atlas final.
  Waifus, inventário, quests, progressão completa e dungeons completas
  ainda não estão implementados.
- Personagem: renderer 2D por spritesheets PNG/JSON e renderer 3D de
  personagem GLB isolado; os contratos de estado lógico e apresentação
  permanecem separados. Os pacotes de animação existentes continuam
  catalogados no repositório.
- Arquitetura: Phaser 4, JavaScript ES modules, Vite 8, Capacitor 8,
  Three.js para renderização GLB/geração de sprites, Arcade Physics,
  sistemas de movimento, input por toque, navegação, profundidade,
  objetos de mundo e monstros.
- Assets: PNG/JSON de animação do protagonista, GLBs de personagens,
  espada, ilha, terreno, árvores e rochas nos caminhos existentes.
  Não foram encontrados sprites finais de monstros na pasta slime.
- Interface/mobile: controles exclusivamente por toque, sem joystick;
  tap-to-move, arraste de câmera e pinch zoom. Não foi realizado teste
  visual/físico em Android nesta atualização.
- Build/publicação: workflows atualizados para Node 26, npm ci com
  lockfile, versões atuais das Actions e validação de auditoria, testes,
  build, assets e deploy. Resultado final depende dos workflows associados
  ao commit da modernização e da geração do lockfile.
- Riscos/pendências: confirmar resolução das vulnerabilidades em toda a
  árvore npm; validar Three.js e Phaser no build; executar bake de sprites;
  gerar/sincronizar projeto Android com Capacitor 8; testar em dispositivo
  Android real.

STATUS DE VALIDAÇÃO:
- Atualização do código e manifests registrada na versão 2.0.0.
- Build, testes, auditoria completa, lockfile e deploy precisam ser
  confirmados pelos workflows desta atualização.
- Nenhum teste em aparelho Android é declarado concluído.


======================================================================
16. CONSOLIDACAO DA MODERNIZACAO E LIMPEZA — 26/11/2026
======================================================================

ESTADO CONFIRMADO NA BRANCH MAIN:
- A modernizacao da stack foi registrada na versao 2.0.0.
- O workflow de bake concluiu com sucesso e gerou sete pares PNG/JSON
  para as animacoes do protagonista.
- O commit de bake atualizou a versao para 2.0.1 e incluiu package-lock.json.
- A auditoria npm completa e os 22 testes automatizados passaram na
  execucao de validacao da modernizacao.
- O deploy da versao 2.0.0 concluiu com sucesso. O deploy posterior
  associado ao commit de bake falhou por checkout sem lockfile visivel;
  essa condicao esta sendo tratada no workflow.

CONSOLIDACAO:
- Versao patch: 2.0.2.
- packageManager alinhado ao npm 11.20.0 observado no runner Node 26.13.1.
- package-lock.json permanece versionado e com metadados sincronizados.
- O workflow separado que tentava gerar e commitar outro lockfile foi
  removido. O bake ja mantem package.json e package-lock.json juntos;
  Dependabot acompanha atualizacoes de dependencias.
- Deploy usa npm ci quando o lockfile existe e tem conteudo. Se estiver
  ausente num checkout, gera um lockfile temporario antes da instalacao.
- Assets sem conteudo e aliases binarios duplicados nao utilizados foram
  removidos somente apos verificar ausencia de referencias no codigo.
- Os PNGs originais arvore_1.png e arvore_2.png foram preservados porque
  Preload.js os carrega. Os nomes logicos tree-large/tree-flowering sao
  chaves de textura, nao dependem de arquivos homonimos.

VALIDACAO AINDA NECESSARIA:
- Confirmar o novo workflow Deploy para a versao 2.0.2.
- Confirmar npm audit e npm test apos a limpeza.
- Testar visualmente o jogo em navegador e em Android real.
- O projeto Android nativo ainda nao esta versionado; nao declarar APK
  ou teste Android concluido.


======================================================================
17. SISTEMA DE STATUS E PROGRESSÃO — 25/11/2026
======================================================================

VERSIONAMENTO:
- Versão anterior: 2.0.7. Nova versão: 2.1.0.
- Nova funcionalidade de atributos, recursos, experiência e progressão.

IMPLEMENTADO:
- Atributos iniciais: Ataque 5; Defesa 0; Penetração 0; Velocidade de
  ataque 1 ataque/s; Movimento 1.0x; Vida máxima 100; Energia máxima 100;
  Recuperação de vida 1/s; Recuperação de energia 2/s.
- Penetração absoluta reduz a defesa efetiva do alvo ponto a ponto.
  Dano causado = ataque - defesa efetiva, com dano mínimo 1.
- Velocidade de ataque controla ataques/s; movimento multiplica a
  velocidade-base de 220 unidades/s.
- Vida regenera somente após 5 segundos sem atividade de combate;
  energia regenera continuamente. Delta de tempo e limites máximos.
- XP para próximo nível = floor(100 * nível^1.5). Cada nível concede
  3 pontos distribuíveis e restaura vida e energia.
- Painel STATUS permite investir: Ataque +1; Defesa +1; Penetração +1;
  Velocidade de ataque +0.10/s; Movimento +0.05x; Vida/Energia máxima
  +10; Recuperação de vida/energia +0.50/s.
- Slime concede 25 EXP e passa a ter 10 HP. Saves antigos migram para
  valores iniciais sem perder pontuação. Recursos e progressão são salvos.

INTEGRAÇÃO:
- Player puro, ProgressionSystem e PlayerStatusUI separados de Phaser.
- CombatSystem consome velocidade de ataque, ataque e penetração.
- Monster/MonsterManager aplicam penetração absoluta.
- MovementSystem usa Player.speed derivada do multiplicador de movimento.
- Game coordena regeneração, XP, UI e persistência.

RECAP INTEGRAL:
- Produto: RPG 2D de ação anime; Android prioritário, web/PWA e Capacitor;
  APK/Google Play ainda não concluídos.
- Mundo: ilha circular jogável, objetos, navegação e zonas de spawn;
  expansão por ilhas ainda planejada.
- Gameplay: toque para mover, arraste de câmera, pinch zoom, combate
  automático, status, XP, níveis, pontos, regeneração e save local.
  Habilidades que gastam energia, dano inimigo ao jogador, drops,
  inventário, quests e waifus ainda pendentes.
- Personagem: estado lógico, corpo Arcade e renderer 2D separados;
  atlas e animações existentes.
- Monstros: sistema modular de entidades, fábrica, spawner, comportamento,
  dano e respawn; slime com experiência configurada.
- Arquitetura: Phaser 4.2.1, Vite 8, JavaScript ESM, Capacitor 8,
  Three.js para ferramentas/renderer GLB, Arcade Physics e sistemas modulares.
- Assets: atlas PNG/JSON do protagonista e assets do mundo; monstros
  dependem dos pacotes habilitados nas definições.
- Interface: HUD e painel de status em Phaser; validação visual Android
  ainda pendente.
- Build/publicação: workflows existentes; deploy do commit desta versão
  precisa ser confirmado.
- Pendências: habilidades/consumo de energia, fontes de dano inimigo,
  drops, inventário, quests, waifus, novas ilhas, APK e teste Android.

VALIDAÇÃO:
- Testes automatizados não executados conforme solicitação.
- Nenhum teste visual em dispositivo foi realizado.
- Build/deploy dependem do workflow associado ao commit 2.1.0.


======================================================================
18. SINCRONIZAÇÃO DO LOCKFILE — 25/11/2026
======================================================================
- Correção de consistência identificada na auditoria pós-commit: package.json
  estava em 2.1.0 e package-lock.json ainda registrava 2.0.7 no pacote raiz.
- Ambos foram alinhados em 2.1.1. Nenhuma dependência foi alterada.
- Versão anterior: 2.1.0. Nova versão: 2.1.1 (correção de metadados).
- A execução do workflow para 2.1.0 não valida este commit corretivo;
  confirmar a execução de deploy correspondente a 2.1.1.


======================================================================
19. COMPATIBILIDADE DO COOLDOWN DE COMBATE — 25/11/2026
======================================================================
- A execução automática do workflow 2.1.0 encontrou um teste legado que
  usa um jogador simulado sem objeto stats e pressupõe o cooldown antigo
  de 500 ms. O Player real usa o atributo attackSpeed configurado em 1/s.
- CombatSystem mantém 1/s para o Player real e usa 2/s somente como fallback
  de compatibilidade para consumidores antigos sem stats.attackSpeed.
- Nenhum teste foi executado manualmente; o erro foi identificado nos logs
  do workflow automático. Os testes não foram alterados nem removidos.
- Versão anterior: 2.1.1. Nova versão: 2.1.2 (correção compatível).
- package.json e package-lock.json foram sincronizados em 2.1.2.


======================================================================
20. AJUSTE DO CONTRATO DE VELOCIDADE DE ATAQUE — 25/11/2026
======================================================================
- O teste legado de cooldown esperava dois ataques em 500 ms. O requisito
  funcional aprovado define 1 ataque/s como valor inicial, portanto o
  comportamento correto é um segundo ataque somente em 1000 ms.
- Atualizada a expectativa temporal do teste existente para refletir o
  novo contrato. Nenhum teste foi executado manualmente nem removido.
- Removido fallback legado de 2 ataques/s: jogadores sem stats também
  recebem fallback 1/s, consistente com o valor padrão do sistema.
- Versão anterior: 2.1.2. Nova versão: 2.1.3.
- package.json e package-lock.json sincronizados em 2.1.3.


======================================================================
21. HUD INDEPENDENTE E CONTROLE DE CÂMERA — 25/11/2026
======================================================================
- HUD/status agora vive em uma Phaser Layer dedicada, renderizada por uma
  segunda câmera com viewport da tela, zoom 1 e scroll independente.
- A câmera do mundo ignora a camada de interface; a câmera da HUD ignora
  os objetos do mundo. Isso mantém texto, barras, botão e janela nítidos,
  sem acompanhar zoom ou arraste do mapa.
- A câmera principal inicia seguindo o corpo lógico do jogador.
- Arrastar o mapa interrompe temporariamente o follow, permitindo exploração.
- Ao selecionar um destino válido, a câmera volta a seguir o jogador com
  interpolação suave; o toque continua convertido com getWorldPoint.
- Zoom por pinça continua aplicado somente à câmera do mundo.
- Versão anterior: 2.1.3. Nova versão: 2.1.4.
- package.json e package-lock.json sincronizados em 2.1.4.


======================================================================
22. SINCRONIZAÇÃO DA ANIMAÇÃO COM O COOLDOWN DE ATAQUE — 25/11/2026
======================================================================
- CombatSystem calcula o intervalo real do próximo ataque (1000 / APS)
  e o envia junto com o evento de ataque.
- CharacterSpriteRenderer recebe esse intervalo como duração do clip
  Phaser. A primeira implementação não surtia efeito porque os clips tinham
  frameRate próprio; no Phaser 4.2.1, frameRate precisa ser null no play()
  para duration controlar a velocidade. O renderer agora força esse modo.
- Cada golpe reinicia a animação no primeiro quadro, inclusive quando
  o novo golpe usa a mesma ação/prioridade ou outra variante de combate.
- A sequência visual continua alternando as variantes já cadastradas.
- Versão anterior: 2.1.4. Nova versão: 2.1.5.
- package.json e package-lock.json sincronizados em 2.1.5.


======================================================================
23. CORREÇÃO DA DURAÇÃO REAL DO CLIP DE COMBATE — 25/11/2026
======================================================================
- Corrigido o PlayAnimationConfig: quando durationMs é informado, o renderer
  envia frameRate: null junto com duration. Isso impede que o FPS original
  registrado no clip prevaleça sobre a duração dinâmica do golpe.
- Sem duração dinâmica, o frameRate original do clip permanece inalterado.
- Versão anterior: 2.1.5. Nova versão: 2.1.6.
- package.json e package-lock.json sincronizados em 2.1.6.
- Testes manuais/visuais não foram executados; aguardar CI e validar no Android.


======================================================================
24. FLORESTA FIXA DA ILHA INICIAL — 26/11/2026
======================================================================

VERSIONAMENTO:
- Versão anterior: 2.1.6. Nova versão: 2.1.7.
- package.json e package-lock.json sincronizados.

ASSETS DE VEGETAÇÃO:
- Removidas as referências aos PNGs antigos arvore_1.png e arvore_2.png.
- Preload usa somente três WebP existentes em public/assets/world/vegetation:
  arvore_ilha_webp_256.webp (copa larga),
  pinheiro_ilha_webp_384.webp (pinheiro),
  arvore_ancestral_toca_webp_640.webp (marco único).
- Árvores secas, copa dourada, árvore de toca grande e assets de rocha não
  são carregados nem usados no layout desta floresta.

LAYOUT:
- ISLAND_01_LAYOUT contém 33 instâncias com coordenadas X/Y explícitas:
  16 árvores de copa larga, 16 pinheiros e uma árvore ancestral.
- Árvore ancestral posicionada em (700, 720), no canto noroeste.
- Variações de escala são declaradas por targetHeight em cada instância.
- Nenhuma árvore é posicionada por sorteio ou distribuição procedural.
- Profundidade usa a coordenada Y da base do tronco.

COLISÃO:
- Cada instância declara uma área elíptica de colisão para o tronco.
- WorldCollisionManager registra os obstáculos no WorldNavigation.
- Movimento tap-to-move e A* respeitam as áreas bloqueadas; colisão é
  separada do tamanho visual da copa.
- Testes automatizados verificam os três tipos, contagem, unicidade da
  árvore ancestral, coordenadas fixas e registro dos obstáculos.

VALIDAÇÃO:
- Código enviado para main. Aguardando GitHub Actions para confirmar
  testes, build e deploy. Nenhum teste manual ou visual Android foi feito.


======================================================================
25. REVISÃO DO POSICIONAMENTO DA FLORESTA — 26/11/2026
======================================================================

- Versão 2.1.8.
- Layout revisado em relação ao terreno circular de 4096 x 4096.
- As 32 árvores comuns foram redistribuídas em exatamente três bosques:
  oeste/noroeste (11), leste/nordeste (11) e sul/centro (10).
- Cada árvore continua com coordenadas X/Y e escala individuais e fixas.
- Colisões de tronco ampliadas para 31x28 (copa larga) e 29x27 (pinheiro),
  acrescidas do raio do jogador na verificação de navegação. A concentração
  e sobreposição das áreas bloqueadas fecha a passagem pelo interior dos
  bosques; a rota deve contorná-los.
- A árvore ancestral foi movida do canto noroeste para o ponto norte da ilha,
  no eixo central X=2048, Y=540 (posição de 12 horas / topo), afastada da
  borda externa e da faixa de nuvens.
- Testes atualizados para validar o ponto norte e os três grupos.
- Aguardando CI e deploy; nenhuma validação visual Android foi executada.


CORREÇÃO DE CI DA FLORESTA — 26/11/2026:
- A execução 45747044215 identificou uma expectativa antiga no teste de
  colisão da árvore ancestral (31 em vez de 38). O layout estava correto;
  o teste ainda verificava o raio antigo.
- Expectativa corrigida para 38 e versão atualizada para 2.1.9.
- Aguardar nova execução de build/test/deploy.


======================================================================
26. DISTRIBUIÇÃO AMPLIADA DE ÁRVORES — 26/11/2026
======================================================================

- Versão 2.2.0.
- Mantidos os três bosques existentes e a árvore ancestral única no norte.
- Adicionadas 185 árvores solitárias com coordenadas X/Y explícitas em toda
  a superfície circular jogável. Total: 218 árvores (217 comuns + ancestral).
- A escala espacial de referência usa alcance de ataque 150 ~= 5 m, portanto
  30 unidades de mundo por metro. Distância máxima ao vizinho mais próximo:
  300 unidades (10 m); cálculo automatizado no teste de layout.
- Distribuição visual das árvores comuns (217):
  22 com aumento de 80% (escala 1.8x);
  22 com aumento de 90% (escala 1.9x);
  173 sem aumento (escala-base).
- O tamanho visual e as colisões de tronco são escalados juntos. A copa não
  vira um obstáculo integral; navegação continua usando as elipses de tronco.
- Layout continua estático, determinístico e sem aleatoriedade.
- Testes adicionados para vizinhança máxima e contagem das três categorias.
- Aguardando GitHub Actions e publicação; não houve teste visual no Android.


CORREÇÃO DA ÁREA DE NASCIMENTO — 26/11/2026:
- CI da versão 2.2.0 apontou uma árvore solitária dentro do raio de início.
- Removida a árvore tree-solo-075 (1918, 1823), que invadia a área inicial.
- O layout passa a ter 217 estruturas: 216 árvores comuns + ancestral.
- 22 árvores permanecem com aumento de 80%, 21 com aumento de 90% e
  173 no tamanho-base. O arredondamento é feito sobre a quantidade real.
- Testes de contagem e área inicial atualizados. Versão 2.2.1.
- Aguardar nova execução CI/deploy.


======================================================================
14. ATUALIZAÇÃO — ATIVAÇÃO DE MONSTROS POR DISTÂNCIA (26/11/2026)
======================================================================

VERSIONAMENTO:
- Versão anterior: 2.2.1.
- Nova versão: 2.2.2.
- Motivo: otimização compatível da simulação de monstros por distância.

ESCALA E REGRA:
- O alcance de ataque do jogador permanece em 150 unidades do mundo,
  equivalente a 2 metros na escala adotada.
- A escala compartilhada está definida em src/config.js:
  75 unidades do mundo por metro.
- O limite de ativação dos monstros é 50 metros = 3.750 unidades.
- A distância é calculada ao quadrado, sem raiz quadrada no loop de IA.
- A distância de 50 m é inclusiva: exatamente no limite o monstro continua
  ativo; acima do limite entra em estado suspenso.

IMPLEMENTADO:
- MonsterManager verifica a distância do jogador para cada monstro vivo.
- Acima de 50 m, a IA deixa de decidir e executar movimentos.
- A velocidade lógica é zerada e o estado moving passa a false.
- O corpo Arcade invisível é desativado para retirar a entidade da simulação
  física enquanto estiver distante.
- O renderer deixa de atualizar transformação, profundidade e estado de
  animação a cada frame para monstros suspensos.
- O sprite permanece no mundo, visível e na última posição conhecida.
- Ao retornar ao raio de 50 m, o corpo é sincronizado uma vez, a física é
  reativada e a simulação normal é retomada.
- Vida, posição, espécie, zona de surgimento e regras de respawn são mantidas.
- O alcance padrão do CombatSystem e a conversão de escala compartilham a
  constante PLAYER_ATTACK_RANGE_WORLD_UNITS para evitar divergência.

ARQUIVOS ALTERADOS:
- package.json
- src/config.js
- src/systems/CombatSystem.js
- src/systems/monsters/MonsterManager.js
- tests/monster-system.test.js
- docs/ESTADO_DO_PROJETO.md

RECAP INTEGRAL DO ESTADO:
- Produto/plataforma: RPG 2D de ação com estética anime; Android prioritário,
  distribuição web/PWA e preparação técnica com Capacitor. APK e publicação
  na Google Play ainda não estão concluídos.
- Mundo/conteúdo: ilha circular única de 4096 x 4096 unidades, terreno
  ilustrado e navegação local por máscara/grade. Ilhas adicionais, pontes,
  portais e transições continuam planejados, não implementados.
- Gameplay: movimento por toque (tap-to-move), arraste de câmera e pinch
  zoom; combate automático por proximidade, vida, pontuação, progressão
  parcial e salvamento local. Monstros são geridos por população/zona,
  recebem dano, morrem e reaparecem. IA de patrulha e suspensão por distância
  existem; drops, combate avançado dos monstros, quests, inventário completo
  e dungeons permanecem pendentes.
- Personagem/waifus: protagonista lógico separado do renderer e sprites
  direcionais com atlas e metadados. Sistema de coleção/progressão de waifus
  permanece planejado, não implementado nesta branch.
- Arquitetura: Phaser 4.2.1, Vite, JavaScript ES modules, Arcade Physics,
  WorldNavigation, sistemas separados de movimento, combate, input,
  monstros, profundidade e objetos. Three.js permanece dependência de
  ferramenta/bake; não há integração 3D ativa no loop de jogo confirmada.
- Assets: ilha, terreno, vegetação, objetos e sprites do protagonista em
  seus diretórios públicos. A espécie slime possui definição de animações;
  a presença e habilitação de atlas finais deve ser conferida no estado
  atual dos assets antes de declarar renderização validada.
- Interface/mobile: câmera, HUD e controles por toque estão implementados.
  Teste visual e de desempenho em aparelho Android real ainda não foi feito.
- Build/publicação: scripts npm incluem test e build; GitHub Actions
  executa validações e publicação Pages. A execução do workflow para
  o commit desta atualização ainda precisa ser confirmada.
- Pendências/riscos: a ilha tem 4096 unidades de diâmetro e o limite de
  suspensão equivale a 3750 unidades. Como o jogador inicia no centro,
  nenhum monstro da ilha circular pode ficar a mais de 50 m nesse ponto
  inicial; o benefício aparece sobretudo quando o jogador explora áreas
  periféricas e há monstros na extremidade oposta. A suspensão economiza
  IA, sincronização de física e atualizações do renderer, mas não remove
  os sprites do mundo nem garante redução de draw calls para sprites que
  ainda estejam dentro da câmera.

VALIDAÇÃO:
- Foram adicionados testes para a conversão 2 m = 150 unidades e
  50 m = 3750 unidades, incluindo o limite exato e a primeira posição
  fora do limite.
- Os testes e o build devem ser confirmados pelo workflow associado ao
  commit final; não há validação visual ou Android declarada nesta etapa.

FIM DA ATUALIZAÇÃO 14


======================================================================
15. ATUALIZACAO — FAIXAS DE DISTANCIA DOS MONSTROS (26/11/2026)
======================================================================

VERSAO:
- 2.2.3 (substitui a regra provisoria de 50 metros da versao 2.2.2).

ESCALA FIXA:
- 2 metros de alcance de ataque = 150 unidades do mundo.
- 1 metro = 75 unidades do mundo.
- As distancias sao constantes centralizadas em src/config.js.

REGRAS IMPLEMENTADAS (distancia euclidiana):
- Ate 2 m (150 unidades): modo combat. O monstro para de perseguir e o
  CombatSystem do jogador pode atacar automaticamente dentro desse alcance.
- Acima de 2 m ate 10 m (750 unidades): modo pursuit. O monstro persegue
  o jogador, respeitando a zona de surgimento, a navegacao e os obstaculos.
- Acima de 10 m ate 30 m (2250 unidades): modo idle. Sem patrulha ou
  perseguicao, corpo fisico desativado e visual em repouso.
- Acima de 30 m: modo visual. IA, fisica, sincronizacao e atualizacao
  individual do renderer ficam suspensas; sprite/sombra permanecem no mapa.
- Limites: 2 m pertence a combat; 10 m pertence a pursuit; 30 m pertence
  a idle. A proxima unidade acima de cada limite entra na faixa seguinte.

OTIMIZACAO:
- Distancia calculada ao quadrado para evitar raiz quadrada na classificacao.
- Entidades paradas reavaliam a faixa a cada 100 ms, nao a cada frame.
- Fisica Arcade fica habilitada apenas nos modos combat e pursuit.
- Em idle e visual, o corpo fisico e desativado.
- Em visual, o loop pula todas as atualizacoes individuais de IA, fisica e
  renderer. A verificacao de faixa continua ocorrendo a cada 100 ms para
  detectar aproximacao do jogador.
- Em pursuit, a IA move o monstro em direcao ao jogador com limite de delta,
  validacao de navegacao e restricao da zona de spawn.
- O sistema de combate do jogador procura alvos ate 10 m e ataca a 2 m.
- Nao foi criado dano de monstros contra o jogador: o codigo atual nao
  possui um sistema de ataque/dano inimigo completo. O monstro para a 2 m;
  ataques automaticos existentes sao os do jogador contra o monstro.

ARQUIVOS:
- src/config.js
- src/systems/monsters/MonsterBehaviorController.js
- src/systems/monsters/MonsterManager.js
- src/systems/CombatSystem.js
- tests/monster-system.test.js
- package.json

TESTES ADICIONADOS:
- Conversao da escala 75 unidades por metro.
- Alcance de ataque de 2 m = 150 unidades.
- Perseguicao ate 10 m = 750 unidades.
- Ociosidade ate 30 m = 2250 unidades.
- Limites exatos e transicoes de cada faixa.
- Movimento de perseguicao e respeito a navegacao.

VALIDACAO:
- Testes automatizados foram atualizados no repositorio.
- Build, execucao do jogo, comportamento visual e desempenho em Android
  ainda precisam ser executados e observados antes de marcar como VALIDADO.

FIM DA ATUALIZACAO 15


======================================================================
16. ATUALIZAÇÃO — COMBATE OFENSIVO INDEPENDENTE DOS MONSTROS (26/11/2026)
======================================================================

VERSÃO:
- Versão anterior: 2.2.3.
- Nova versão: 2.2.6.
- package.json e package-lock.json sincronizados.

ATRIBUTOS:
- Cada monstro possui seu próprio objeto stats, sem compartilhar estado
  ou instância com o jogador.
- O esquema replica os nove atributos de Player:
  attack, defense, penetration, attackSpeed, movementSpeed, maxHealth,
  maxEnergy, healthRegen e energyRegen.
- Todos os valores-base dos monstros são 1.
- A vida máxima e energia máxima derivam de maxHealth/maxEnergy (1); o
  monstro mantém health e energy próprios.
- Movimento usa a velocidade definida pela espécie multiplicada por
  movementSpeed (1); attackSpeed (1) equivale a um ataque por segundo.
- healthRegen e energyRegen (1/s) são processados no estado lógico; vida
  não regenera durante a janela de combate e energia regenera continuamente.
- Em idle, regeneração é atualizada na cadência de classificação (100 ms);
  acima de 30 m, o modo visual suspende toda simulação conforme a regra.
- Os atributos permanecem independentes dos atributos e progressão do Player.

COMBATE INIMIGO:
- Criado MonsterCombatSystem separado do CombatSystem do jogador.
- Monstros só atacam na faixa combat, até 2 m (150 unidades).
- Cooldown usa attackSpeed: 1 ataque por segundo.
- Dano-base usa attack; defesa do jogador reduz o dano e penetration
  reduz a defesa efetiva, usando o contrato de Player.takeDamage.
- Cada monstro mantém seu próprio cooldown; não existe cooldown global.
- O ataque visual usa a animação attack já definida para o slime.
- O combate inimigo é atualizado depois da classificação/movimentação
  dos monstros no frame, evitando atacar com posição desatualizada.
- Ao morrer o jogador, o sistema deixa de aplicar ataques.

ARQUITETURA:
- MonsterCombatSystem não depende de Phaser e recebe atacantes por uma
  função de consulta; o MonsterManager expõe somente entradas em modo combat.
- Game coordena ciclo de vida e update; shutdown destrói o sistema.
- Player.takeDamage recebeu parâmetro opcional de penetração, mantendo
  compatibilidade com chamadas existentes de dois argumentos.
- CombatSystem envia ataque-base; a entidade-alvo aplica defesa/penetração
  uma única vez, evitando mitigação duplicada.
- Não há compartilhamento de atributos, progressão ou cooldown entre
  jogador e monstros.

TESTES ADICIONADOS:
- Esquema de atributos dos monstros e valores-base 1.
- Ataque no limite de 2 m.
- Cooldown de 1 ataque por segundo.
- Ausência de dano fora do alcance.
- Cálculo de defesa e penetração ao receber dano.

VALIDAÇÃO:
- Testes foram adicionados ao repositório, mas ainda não executados
  localmente nesta sessão.
- Build, workflow GitHub Actions, deploy e validação visual no Android
  ainda precisam ser confirmados.


VALIDAÇÃO ADICIONAL — 26/11/2026:
- A primeira execução do workflow detectou um teste frágil por comparação
  exata de ponto flutuante na regeneração de energia (1.2000000000000002
  versus 1.2). A asserção foi corrigida para usar tolerância numérica.
- Versão atualizada para 2.2.6; aguardando nova execução completa do CI.


======================================================================
17. OTIMIZAÇÃO — ESTRUTURAS ESTÁTICAS DA ILHA (26/11/2026)
======================================================================

DECISÃO:
- Manter os 127 objetos do layout da ilha, sem remover árvores.
- Todas as estruturas são elementos visuais estáticos, sem lógica própria,
  animação, física, input, tween ou atualização por quadro.
- O Phaser continua responsável pelo culling de renderização; não foi criado
  um segundo sistema de visibilidade nem uma rotina de varredura por câmera.

IMPLEMENTAÇÃO:
- WorldObjectManager cria estruturas com Phaser GameObjects.Image, não Sprite.
- Image não possui preUpdate e não entra na Update List do Phaser.
- Os objetos recebem active=false como garantia/documentação de que não são
  entidades ativas; visible permanece true e o renderer decide o que desenhar.
- Posição, origem, escala uniforme, rotação e profundidade são configuradas
  somente na criação.
- Colisões de troncos continuam registradas como geometria estática no
  WorldNavigation. Não existe corpo Arcade Physics por árvore nem cálculo
  recorrente por objeto.
- Removidos dados auxiliares por objeto que não eram consumidos por sistemas.
- Nenhuma árvore, posição ou escala do layout foi alterada.

VALIDAÇÃO:
- Testes de regressão verificam 127 objetos, imagens inativas mas visíveis,
  ausência de preUpdate/body/input e registro estático das colisões.
- Build e GitHub Actions ainda precisam ser executados para validar o commit.
- Desempenho visual em dispositivo Android permanece pendente de teste real.


======================================================================
18. CORREÇÃO — RETOMADA SUAVE DA CÂMERA APÓS ARRASTE (26/11/2026)
======================================================================

DIAGNÓSTICO:
- O toque curto não interrompe o follow da câmera.
- O arraste chama stopFollow() uma única vez ao ultrapassar o limiar.
- Ao tocar depois de arrastar, Game reativa o follow do jogador.
- O código anterior também chamava startFollow em todo toque aceito,
  inclusive quando a câmera já estava seguindo o jogador. Isso reiniciava
  desnecessariamente a configuração de acompanhamento.
- O Phaser documenta lerp menor como acompanhamento mais gradual; o valor
  anterior era 0.12. O valor foi reduzido para 0.06.

CORREÇÃO:
- TouchInputController emite onPan somente quando um gesto muda de pending
  para pan, sem executar callback em cada movimento.
- Game mantém cameraFollowActive para distinguir câmera seguindo de câmera
  liberada pelo arraste.
- Toques sucessivos não reiniciam startFollow se o acompanhamento já está
  ativo.
- Depois de arrastar, o follow é reativado com interpolação 0.06 nos dois
  eixos, para uma retomada mais lenta e progressiva.
- O mapeamento do toque para coordenadas do mundo e o pathfinding não foram
  alterados. Arraste e pinch permanecem independentes.

TESTES:
- Toque curto emite destino sem parar o follow.
- Arraste interrompe o follow e notifica a transição uma única vez.
- Teste de regressão do controlador de toque adicionado.

VALIDAÇÃO:
- Testes e build precisam ser confirmados pelo GitHub Actions.
- Tremor visual em Android precisa ser conferido no aparelho após publicação.


======================================================================
19. TERRENO EM TILESPRITES — 26/11/2026
======================================================================

VERSÃO:
- 2.2.9; package.json e package-lock.json sincronizados.

IMPLEMENTADO:
- Preload carrega Terreno_liso.webp, Terreno_moita.webp e
  Terreno_relevo.webp como as três texturas oficiais de terreno.
- Game não cria mais canvas nem textura intermediária de 4096 x 4096.
- Cada tipo de terreno é renderizado por Phaser TileSprite, repetindo a
  textura diretamente na GPU.
- Máscara geométrica circular recorta a base e mantém o contorno da ilha.
- Os TileSprites de terreno e o TileSprite do mar/nuvens têm o tamanho do viewport em coordenadas do mundo e acompanham a câmera; nenhum ocupa 4096 x 4096 ou 8192 x 8192.
- Máscaras geométricas independentes distribuem manchas de grama e relevo.
- A classificação usa grade determinística de 64 unidades e 16 setores espaciais (4 x 4), sem RNG no jogo. Cada setor mantém as mesmas proporções, evitando concentração em um quadrante.
- Proporções por área elegível: 70% liso, 20% moita/grama e 10% relevo,
  com diferença máxima decorrente do arredondamento da grade.
- Cada célula pertence a uma única classe; não há sobreposição entre os
  dois overlays. As células de overlay ficam inteiramente dentro do círculo.
- Texturas e máscaras são destruídas no shutdown da cena.
- Os arquivos de mapa PNG legados não fazem parte da arquitetura ativa.
- O terreno é composto pelos três materiais WebP carregados pelo Preload.

TESTES:
- Proporções, exclusividade de células, limites circulares e determinismo.
- Verificação estática de ausência de canvas gigante e das três texturas.
- A dimensão dos TileSprites segue a recomendação Phaser 4 de nunca exceder o canvas/viewport; a textura é deslocada pela posição da câmera. O fundo de nuvens também deixou de ser um TileSprite de 8192 x 8192.
- Build, GitHub Actions e inspeção visual Android ainda pendentes.



## Update 20 — composição leve do terreno (26/11/2026)
- Substituída a composição anterior com três TileSprites, máscaras regionais e sincronização por quadro.
- As três texturas finais são compostas uma única vez num padrão repetível de 512 × 512; o mundo usa um único TileSprite com máscara circular.
- Removido o campo de nuvens com 48 imagens e dois canvases; o oceano é um único retângulo estático sob a ilha.
- Nenhum canvas é criado com dimensões do mundo e nenhuma camada de terreno é reposicionada no update.
- A proporção visual do padrão é configurada para 70% liso, 20% grama e 10% relevo; a proporção exata em pixels pode variar pelo quantil do histograma.
- A validação visual em Android continua obrigatória após o deploy.


======================================================================
21. CORREÇÃO — CONTORNO CIRCULAR E OCEANO CONTÍNUO (26/11/2026)
======================================================================

DIAGNÓSTICO:
- O oceano anterior era um retângulo de 4096 x 4096, do mesmo tamanho
  da ilha. Assim, não preenchia a área externa ao mundo visível durante
  arrastes e zoom afastado.
- A máscara circular era criada a partir de um Graphics adicionado à
  Display List e depois ocultado. A geometria da máscara foi isolada da
  Display List para evitar interferência de renderização/ordenação.

CORREÇÕES:
- A máscara agora usa scene.make.graphics({ add: false }), com círculo
  centrado em (2048, 2048) e raio 2046, aplicado ao único TileSprite.
- O oceano é um retângulo estático de 49152 x 49152, centrado na ilha.
  Essa área cobre o alcance de câmera configurado até o zoom mínimo 0.08.
- O zoom mínimo foi reduzido de 0.28 para 0.08 tanto na configuração
  da câmera quanto no gesto de pinça, permitindo enquadrar a ilha inteira
  inclusive em telas mobile verticais.
- O campo de distribuição do terreno usa harmônicos inteiros com período
  exato de 512 pixels nos eixos X e Y.
- As três texturas de material recebem mistura toroidal das bordas antes
  da composição, para reduzir emendas na repetição do TileSprite.
- O padrão é composto uma única vez na inicialização; não há trabalho
  de composição por frame.
- A distribuição efetiva por material é calculada e retornada em vez de
  declarar proporções fixas que podem divergir por quantização.

TESTES:
- Periodicidade matemática nos dois eixos.
- Uso de fontes com preparação seamless e um padrão 512 x 512.
- Máscara circular criada fora da Display List.
- Oceano com dimensões maiores que a ilha.
- Preload das três texturas oficiais.

LIMITAÇÃO DE VALIDAÇÃO:
- Os testes automatizados verificam o campo periódico e a estrutura do
  código, mas não substituem captura/renderização real do Phaser.
- A forma circular e o oceano ainda precisam de conferência visual no
  navegador Android após o deploy.


======================================================================
22. REESTRUTURACAO DO TERRENO — SHADER DETERMINISTICO (26/11/2026)
======================================================================

DIAGNOSTICO CONFIRMADO:
- O jogo usa Phaser 4.2.1 com Phaser.AUTO, selecionando WebGL nos
  navegadores Android compatíveis.
- No Phaser 4.2.1, GeometryMask funciona somente no renderer Canvas.
  No WebGL, setMask(GeometryMask) nao aplica o recorte. A ilha era
  desenhada como o quadrado do TileSprite; a borda reta da captura e
  a borda real desse quadrado, nao o contorno da ilha.
- A mascara de navegacao circular nao controla a renderizacao; ela so
  impede o jogador de caminhar fora da ilha.

ARQUITETURA SUBSTITUTA:
- Removido TerrainComposer.js, incluindo composicao de canvas, textura
  intermediaria 512x512, mascara geometrica e TileSprite de 4096x4096.
- Criado IslandTerrainRenderer.js.
- WebGL desenha a ilha com um unico Shader Game Object de 4096x4096.
- O fragment shader calcula o recorte circular diretamente em GPU.
  Nenhuma GeometryMask e usada no caminho WebGL.
- Os tres assets oficiais (terreno liso, moita e relevo) sao amostrados
  diretamente como tres texturas; nao ha canvas, copia de pixels ou
  textura intermediaria.
- A repeticao das texturas e espelhada para evitar emendas abruptas.
- As regioes de grama e relevo sao 9 elipses fixas, declaradas no codigo.
  Nao ha RNG, distribuicao por score, histograma ou posicionamento aleatorio.
- Cobertura esperada na mascara deterministica: aproximadamente 65% liso,
  23% grama e 12% relevo, calculada por amostragem nos testes.
- Custo de CPU da composicao: zero por frame; nao ha composicao na inicializacao.
- Custo de renderizacao: um Game Object e um draw call, com tres amostras
  de textura por pixel visivel. A GPU processa somente a area projetada
  pela camera; o fragmento fora do circulo recebe alpha zero.
- Fallback Canvas: circulo verde simples, sem mascara e sem quadrado,
  para manter a silhueta correta em navegadores sem WebGL.

VALIDACAO:
- Testes verificam ausencia de RNG, cobertura das regioes, amostras das
  tres texturas, recorte circular no shader e integracao em Game.
- A compilacao GLSL e a renderizacao real precisam ser verificadas no
  navegador Android; testes Node nao executam o shader na GPU.
- A arquitetura nao utiliza imagem unica como mapa-base; o terreno e
  composto diretamente pelos tres materiais WebP oficiais.
- Versao: 2.4.0.


======================================================================
23. LIMPEZA — REMOCAO DE ARTEFATOS DE MAPA LEGADO (26/11/2026)
======================================================================

- Removido o PNG legado da ilha que estava sem uso pelo jogo.
- Removidos os arquivos .gitkeep das pastas antigas de terreno e objetos,
  eliminando tambem essa estrutura vazia do repositorio.
- Atualizado docs/ARQUITETURA_DO_MUNDO_POR_ILHAS.md para retirar caminhos
  antigos e descrever a arquitetura atualmente implementada.
- O Preload e o Game nao carregam nem referenciam mapas PNG antigos.
- Preservados os tres materiais WebP ativos (terreno liso, moita e relevo),
  pois sao assets finais usados pelo shader; preservadas tambem as imagens
  de vegetacao, rochas, monstros e personagens, que nao sao mapas antigos.
- Nenhum caminho de runtime foi removido porque nao havia referencia ativa
  para o PNG legado; a limpeza elimina o arquivo e a documentacao obsoleta.


======================================================================
24. CORRECAO DO RECORTE DO SHADER — DISCARD (26/11/2026)
======================================================================

- O shader anterior produzia alpha zero fora do circulo. Na renderizacao
  Android observada, a area externa continuava exibindo o material, logo
  o caminho de alpha blending nao estava entregando o recorte esperado.
- Substituido por descarte de fragmento: quando dot(centered, centered)
  >= 1.0, o fragment shader executa discard e nao escreve pixel algum.
- Dentro do circulo, o shader escreve alpha 1.0; o oceano solido que ja
  esta atras do terreno aparece naturalmente na area descartada.
- Nao foram adicionadas mascaras, canvases, texturas ou objetos de cena.
- Custo adicional: uma multiplicacao escalar/dot por fragmento e um
  branch de descarte na borda. Sem CPU por frame, sem memoria adicional.
- Atualizada a chave de cache dos assets para terrain-discard-01 e versao
  do jogo para 2.4.1.
- Teste automatizado verifica o discard e garante que alpha zero nao seja
  usado como mecanismo de recorte.
- A validacao final depende de observar a renderizacao real no Android.


======================================================================
25. OCEANO TEXTURIZADO COM TILE ESTATICO (26/11/2026)
======================================================================

- Substituida a cor solida por um TileSprite usando o asset SVG
  ocean-pattern.svg, com tile de 256 x 256.
- O tile tem gradiente azul profundo, linhas de onda suaves e pequenas
  variacoes de brilho, sem filtros SVG e sem imagens incorporadas.
- O asset e carregado uma vez no Preload e rasterizado pelo renderer
  como uma unica textura pequena; o TileSprite repete essa textura.
- O oceano continua sendo um unico Game Object, abaixo da ilha, sem
  animação, tweens, atualizacao por frame ou geração procedural.
- Custo estimado de textura: 256 x 256 x 4 bytes = 262.144 bytes
  (aproximadamente 256 KiB, sem contar overhead do renderer).
- Custo de CPU em runtime: zero por frame. O custo de desenho e um
  TileSprite estatico; o fragment fill acompanha apenas a area visivel
  do oceano, nao os 49.152 x 49.152 pixels geometricos inteiros.
- Versao: 2.4.2.


======================================================================
26. OCEANO — TEXTURA FOTOGRAFICA DE REFERENCIA (26/11/2026)
======================================================================

- Substituido o SVG procedural anterior pela textura de oceano fornecida
  como referencia visual pelo usuario.
- Arquivo: public/assets/world/terrain/ocean-pattern-seamless-512.webp.
- A imagem de origem foi reduzida para 384 x 384 pixels e codificada em
  WebP com qualidade 62, mantendo ondas profundas e reflexos ciano.
- O TileSprite existente continua usando a mesma chave ocean-pattern;
  nenhuma mudanca de geometria, camera ou quantidade de objetos.
- A textura e carregada uma vez e repetida no TileSprite estatico.
- Peso do arquivo WebP: aproximadamente 12.6 KB; textura RGBA expandida
  em memoria: aproximadamente 576 KiB (384 x 384 x 4), sem contar overhead.
- CPU por frame: zero para geracao; o desenho continua sendo um TileSprite.
- Removido o SVG estilizado anterior, que nao correspondia ao nivel de
  realismo da referencia enviada.
- Versao: 2.4.3.


======================================================================
27. MARGEM COSTEIRA CIRCULAR — TEXTURA DO USUARIO (26/11/2026)
======================================================================

- A imagem de referencia enviada pelo usuario foi convertida em uma faixa
  costeira circular, mapeando a transicao de oceano/espuma para grama ao
  redor de toda a ilha.
- Arquivo: public/assets/world/terrain/island-shoreline.png.
- Textura final: 256 x 256, PNG indexado com transparencia; arquivo de aproximadamente 6.9 KB.
- A faixa acompanha a circunferencia da ilha de 4096 unidades, posicionada
  no centro (2048, 2048) e exibida em 4224 x 4224 unidades.
- A parte verde sobrepoe a borda interna do terreno; a espuma/agua avanca
  ligeiramente para fora, sobre o oceano de fundo.
- A emenda angular da textura foi suavizada antes do mapeamento circular.
- Renderizacao: uma imagem estatica adicional, depth -990, entre o shader
  do terreno (-1000) e os objetos do mundo. Sem loops, shaders novos,
  atualizacao por frame, fisica ou colisores.
- Memoria RGBA teorica da textura decodificada: cerca de 256 KiB
  (256 x 256 x 4), mais overhead do navegador.
- Versao: 2.4.4.


======================================================================
28. MARGEM COSTEIRA INTEGRADA AO SHADER (26/11/2026)
======================================================================

- A revisao da captura Android mostrou que a faixa costeira anterior estava
  com baixa resolucao e era ampliada por um Game Object independente. A
  imagem apresentava degraus/faixas e nao preservava o detalhe da referencia.
- Removido o PNG indexado de 256 x 256 e removida a imagem costeira separada
  da cena. Nao existe mais shorelineObject nem draw call adicional.
- A referencia original foi recortada para manter oceano, espuma e grama,
  corrigida para repeticao horizontal e convertida em WebP 384 x 192,
  qualidade 68. Arquivo: island-shoreline.webp.
- O shader principal agora desenha o disco da ilha e o anel costeiro
  exterior na mesma chamada, com uma quarta textura amostrada apenas
  nos fragmentos da margem.
- O raio da ilha permanece 4096 unidades de diametro. A area do shader
  cresce para 5120 x 5120, com o anel costeiro ocupando 512 unidades radiais.
- A textura e mapeada por angulo e distancia ao centro, com quatro repeticoes
  ao redor da circunferencia. A margem acompanha a curvatura sem canvas,
  mascara, sprites extras, fisica ou atualizacao por frame.
- Custo estimado da textura WebP: 9.806 bytes; memoria RGBA decodificada:
  288 KiB. O custo de fragmentos aumenta apenas na area do anel costeiro;
  a cena continua com um unico objeto shader para terreno e margem.
- Versao: 2.4.5.


======================================================================
ATUALIZACAO — 26/11/2026 — ILHA COM COSTA IRREGULAR
======================================================================

Versao de codigo: 2.4.6

- A area jogavel deixa de usar uma borda circular perfeita.
- O nucleo interior permanece circular, com raio de 1660 unidades.
- A costa externa varia deterministicamente por angulo, mantendo a
  extensao maxima dentro do mundo 4096 x 4096.
- A navegacao usa a mesma funcao radial do shader, com recuo de seguranca.
- A faixa costeira usa textura SVG estatica no shader, sem sprites extras.
- O raio de distribuicao dos monstros foi ajustado para a nova silhueta.
- Validacao visual Android e publicacao desta versao ainda dependem do CI.


======================================================================
ATUALIZACAO TECNICA — 26/11/2026
======================================================================

Versao do jogo: 2.4.46
Branch: main
Escopo concluido: correção do zoom por pinça e limites adaptativos da câmera.

CAMERA E CONTROLES — IMPLEMENTADO NO CODIGO
- O zoom de dois dedos agora mantém como âncora a coordenada mundial sob
  o ponto médio entre os dedos.
- O limite mínimo é calculado com base na menor razão entre largura/altura
  do viewport e largura/altura do mundo, permitindo enquadrar a ilha inteira
  sem exigir um valor fixo inadequado a telas de proporções diferentes.
- O limite máximo permanece em 2.25x.
- Os limites de scroll são aplicados aos limites reais do mundo (0,0 a
  4096,4096), centralizando a câmera no eixo em que o viewport excede a ilha.
- Em redimensionamento/orientação, o zoom mínimo é recalculado e a câmera
  é mantida dentro do mundo.
- O gesto de pinça interrompe o camera follow para que o acompanhamento do
  personagem não concorra com o gesto manual.
- Ao terminar a pinça com um dedo restante, o toque não vira destino por
  engano; o usuário precisa ultrapassar o limiar normal para iniciar arraste.
- Toque curto, arraste, destino por toque, camera follow, HUD em câmera
  separada e movimento do jogador foram preservados.

ARQUITETURA E ARQUIVOS ALTERADOS
- src/systems/input/TouchInputController.js: reconhecimento da pinça,
  ancoragem espacial, zoom adaptativo e transição de gestos.
- src/scenes/Game.js: cálculo do zoom mínimo, clamp de scroll, limites do
  mundo e atualização em resize.
- tests/touch-input-controller.test.js: testes de ancoragem, zoom mínimo e
  transição após pinça.
- package.json e package-lock.json: versão sincronizada em 2.4.46.

RECAP INTEGRAL DO ESTADO OBSERVADO NO REPOSITORIO
1. Produto e plataforma
- Implementado: RPG de ação 2D com Phaser 4, Vite, distribuição web e
  configuração Capacitor para Android.
- Parcial/não verificado: preparação de APK e teste em dispositivo Android.
- Planejado: publicação e validação final na Google Play.

2. Mundo e conteúdo
- Implementado: uma ilha principal de 4096 x 4096 unidades, terreno como
  imagem única, oceano em TileSprite, máscara alfa de área caminhável,
  distribuição de árvores, colisões e pontos de surgimento de monstros.
- Planejado: múltiplas ilhas, pontes, portais e mapa-mundi; não considerar
  esses sistemas implementados.

3. Gameplay
- Implementado: movimentação por toque para marcar destino, pathfinding A*,
  movimento automático, combate automático por proximidade, monstros,
  progressão por experiência, atributos, vida/energia e salvamento local.
- Parcial: menu principal contém entrada para jogar; a interface de status
  permite distribuir pontos de atributo.
- Planejado/não identificado no fluxo atual: sistema funcional de waifus,
  loja, inventário completo, presentes e habilidades de waifus.

4. Arquitetura
- Implementado: Phaser 4, JavaScript ES modules, Vite, cenas Boot/Preload/
  Menu/Game, entidades, renderizadores, sistemas de combate/movimento,
  navegação, colisão, profundidade, entrada por toque e HUD.
- Parcial: Game.js coordena diversos sistemas; persistência ainda usa
  localStorage diretamente, sem SaveManager centralizado.

5. Assets
- Implementado: terreno em public/assets/world/terrain/ilha_terreno.webp,
  oceano em ocean-pattern-seamless-512.webp, árvores em WebP, spritesheets
  de personagem PNG/JSON, modelos GLB e sprites de monstros.
- O Preload registra os caminhos de terreno, oceano e vegetação; os
  carregadores especializados registram os sprites de personagens e monstros.
- Não foi realizada substituição nem remoção de assets nesta atualização.

6. Interface e experiência mobile
- Implementado: escala Phaser.Scale.RESIZE, entrada sem teclado, toque,
  arraste e pinça; HUD em câmera independente do mundo.
- Parcial: orientação e ergonomia precisam de teste visual em diferentes
  aparelhos Android.
- O zoom por pinça agora se adapta à proporção do viewport e enquadra a ilha
  no afastamento mínimo.

7. Build e publicação
- Implementado: scripts npm de teste/build e workflow GitHub Actions para
  instalar dependências, auditar, testar, compilar e publicar no Pages.
- A versão do package.json e as duas declarações de versão do package-lock
  foram atualizadas para 2.4.46.
- Build, auditoria de dependências e publicação desta versão dependem da
  execução do workflow após o commit final; não declarar concluídos antes
  de verificar a execução correspondente.

8. Pendências e riscos
- Executar npm test, npm run build e npm audit no workflow do commit final.
- Confirmar o workflow Deploy e a versão publicada 2.4.46.
- Validar em Android real: ancoragem da pinça, limites ao afastar,
  orientação portrait/landscape, arraste nas bordas e retomada do follow.
- Verificar visualmente a ilha inteira no afastamento mínimo; não foi feito
  teste visual em dispositivo nesta alteração.

Esta atualização complementa e prevalece sobre observações históricas
anteriores deste documento quando divergirem do código atual consultado.


======================================================================
ATUALIZAÇÃO — 26/11/2026 — OCEANO COM MARGEM SIMÉTRICA
======================================================================

Versão do jogo: 2.4.47

- O terreno, a navegação, a física e as estruturas permanecem no mundo
  lógico de 4096 x 4096; nenhuma coordenada de árvore ou estrutura foi
  alterada.
- O oceano passa a ter limites visuais próprios, independentes dos limites
  jogáveis.
- A costa atual tem raio-base de 1992 unidades. Foi definida uma margem
  de oceano de 512 unidades a partir da costa em todas as direções.
- O retângulo do oceano fica centrado no mesmo ponto da ilha e mede
  5008 x 5008 unidades (raio externo de 2504).
- A câmera e o zoom mínimo usam os limites visuais do oceano; a física e
  a navegação continuam limitadas aos 4096 x 4096 do terreno.
- O oceano é um único TileSprite estático. Foi removida a atualização
  por frame que redimensionava e reposicionava o TileSprite na câmera.
- Testes cobrem a separação entre limites jogáveis e visuais, a margem
  simétrica e a ausência de sincronização por frame.
- Build, testes completos e publicação devem ser confirmados pelo CI.


======================================================================
ATUALIZAÇÃO — 26/11/2026 — OCEANO RESPONSIVO EM TELAS VERTICAIS
======================================================================

Versão do jogo: 2.4.48

- Corrigida a cobertura do oceano em viewports de celular com proporção
  vertical: a dimensão maior do TileSprite agora acompanha a proporção
  real da tela, mantendo a margem costeira mínima de 512 unidades.
- O tamanho visual do oceano é recalculado em mudanças de tamanho ou
  orientação do navegador.
- O viewport da câmera principal também é atualizado explicitamente no
  resize, junto com o viewport da HUD.
- Os limites de câmera e o zoom mínimo são recalculados após o resize.
- O mundo jogável, terreno, física, navegação e posições de árvores
  permanecem inalterados em 4096 x 4096.
- Testes adicionados para cobertura responsiva e atualização dos viewports.
- Build e testes completos devem ser confirmados pelo GitHub Actions.


======================================================================
ATUALIZAÇÃO — 26/11/2026 — ZOOM INICIAL NO MAIOR AFASTAMENTO
======================================================================

Versão do jogo: 2.4.49

- A câmera inicia no menor fator de zoom permitido pelo viewport e pelos
  limites visuais do oceano, ou seja, no maior afastamento que a tela suporta.
- O enquadramento inicial mostra toda a área visual do oceano, evitando
  iniciar aproximado em uma pequena região do terreno.
- O gesto de pinça continua permitindo aproximação até o limite máximo
  CAMERA_ZOOM.max (2.25).
- Nenhuma escala, coordenada ou estrutura do terreno foi alterada.


======================================================================
ATUALIZAÇÃO — 26/11/2026 — LIMITE DE ZOOM E ARRASTE ROBUSTO
======================================================================

Versão do jogo: 2.4.50

- O enquadramento mostrado pelo usuário na captura Android passa a ser
  o limite máximo de aproximação: CAMERA_ZOOM.max = 1.2.
- A câmera inicia nesse enquadramento de referência, desde que o viewport
  permita esse nível sem violar o limite mínimo adaptativo.
- O zoom por pinça continua permitindo afastar até o mínimo calculado e
  aproximar somente até 1.2x.
- O arraste de um dedo passou a usar o último ponto de cada ponteiro ativo,
  em vez de depender do identificador de gesto compartilhado.
- A transição de pinça para um dedo reinicia as coordenadas de arraste,
  evitando saltos e mantendo o pan após o gesto de zoom.
- Adicionados testes de arraste nos zooms mínimo/máximo e após pinça.
- Nenhuma posição, escala ou estrutura do terreno foi alterada.
- Testes/build/publicação devem ser confirmados pelo CI.


======================================================================
ATUALIZAÇÃO — 26/11/2026 — RESTAURAÇÃO DO ZOOM E BUFFER DE ARRASTE
======================================================================

Versão do jogo: 2.4.51

- Restaurado o limite máximo de aproximação para 2.25x. O limite 1.2x
  da versão anterior estava abaixo do enquadramento de referência e
  impedia alcançar a ampliação desejada.
- Zoom inicial permanece em 1.2x.
- O oceano visual recebe buffer externo de 1.35x em relação à área-base.
- O zoom mínimo é calculado pela área-base, mantendo o buffer externo
  disponível para deslocamento da câmera mesmo no zoom mínimo.
- Os limites da câmera continuam contidos na área coberta pelo TileSprite;
  o mar permanece desenhado sob a ilha durante o arraste.
- Adicionados testes para o fator de buffer, zoom mínimo com espaço de
  pan e limite máximo 2.25x.
- Terreno, árvores, estruturas, física e navegação do mundo 4096 x 4096
  permanecem inalterados.
- CI e validação visual Android ainda precisam ser conferidos.


======================================================================
ATUALIZAÇÃO — 26/11/2026 — ZOOM INICIAL 0.1X
======================================================================

Versão do jogo: 2.4.52

- Zoom inicial alterado de 1.2x para 0.1x.
- O limite máximo de aproximação permanece em 2.25x.
- A área visual do oceano é expandida conforme a dimensão do viewport
  dividida pelo zoom inicial, preservando cobertura e buffer de arraste.
- O limite mínimo adaptativo continua calculado com o buffer externo,
  permitindo pan sem expor o fundo preto no zoom inicial.
- Terreno, mundo jogável 4096 x 4096, árvores e estruturas permanecem
  inalterados.
- Testes/build/publicação devem ser confirmados pelo CI.
