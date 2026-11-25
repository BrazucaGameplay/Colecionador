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
