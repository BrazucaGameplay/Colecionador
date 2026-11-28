## 28/11/2026 — Slime como piloto do fluxo de cartas (2.10.29)

- Slime declara sua carta oficial no catálogo (`bestiary.cardAsset`).
- Criado componente HTML compartilhado `CardGallery`, dirigido pelas definições registradas, com abas Monstros/Boss, visualização integral e navegação arte/status.
- O bestiário exibe somente Slime, pois é a única espécie cadastrada. As outras dez cartas continuam arquivadas e não são carregadas nem registradas.
- Documentado o procedimento reutilizável para adicionar futuras espécies sem criar UI específica por monstro.
- Adicionado teste para garantir que a presença de outras imagens não aumenta automaticamente o catálogo.

# Changelog

## 27/11/2026 — Organização das 11 cartas JPG de monstros

- Confirmados 11 arquivos de cartas: Bear, Cyclops, Eagle, Goblin, Monkey, Ogre, Rat, Slime, Snake, Spider e Wolf.
- Reorganizados em diretórios individuais, um por espécie, como `card.jpg`.
- Os blobs originais foram reutilizados diretamente no Git tree: nenhuma imagem foi recomprimida, convertida ou editada.
- Documentação ajustada para preservar extensão/formato original (`card.<ext>`), sem exigir conversão para PNG.

## 28/11/2026 — Regra de animação opcional por espécie (2.10.28)

- Registrado que a animação de monstros comuns é opcional e definida individualmente por espécie; monstros sem animação usam imagem estática.
- Slime é a única espécie atualmente registrada. Por ser uma bola azul simples, não precisa de animação direcional nem de novos sprites de movimento neste estágio.
- Mantida a possibilidade de outras espécies receberem animações próprias; não exigir atlas animado para todas.
- Corrigida a documentação para não tratar quatro direções como requisito obrigatório de toda espécie comum. Quando uma espécie animada precisar de direções, o contrato comum previsto permanece 4-way; Boss permanece 8-way.

## 28/11/2026 — Estrutura de monstros, Boss e bestiário (2.10.27)

- Registrada a arquitetura de conteúdo hostil: espécies comuns reutilizáveis e Boss únicos, com contratos separados.
- Documentado o contrato compartilhado de nove atributos baseado em `DEFAULT_PLAYER_STATS`, preservando os raios atuais de atividade.
- Criado catálogo vazio de Boss e projeção de bestiário em duas categorias, alimentada pelos catálogos de conteúdo.
- Reservados diretórios para IA/combate de Boss, persistência do bestiário, renderização e UI, sem criar entidades ou assets fictícios.
- Adicionados testes comportamentais para a separação dos catálogos e unicidade por definição.
- IA de Boss, animações direcionais, descoberta persistente, cartas e interface continuam como trabalho futuro.

## 28/11/2026 — Documentação e testes de comportamento (2.10.26)

- `ESTADO_DO_PROJETO.md` reduzido a um resumo atual de stack, implementação, pendências e direção vigente; o histórico foi consolidado neste arquivo.
- Plano arquitetural, contrato de skins, README e processo de atualização alinhados às decisões e à estrutura atuais.
- Testes de UI, carregamento, câmera, persistência, mundo e bootstrap migrados de inspeção de strings para interação com componentes e sistemas reais/harnesses.
- Extraída a política pura de limites do oceano e escala de ação para permitir testes de comportamento.
- Corrigida divergência herdada no lockfile: `node_modules/yauzl` volta à versão real 2.10.0; versão do projeto sincronizada em 2.10.26.
- Workflow de deploy passou a exigir o lockfile versionado e executar `npm ci`, sem gerar lockfile temporário.

Histórico consolidado do repositório `BrazucaGameplay/Colecionador`. Registra marcos que explicam a evolução do projeto; não é uma segunda especificação do estado atual. Para o que existe hoje, consulte [ESTADO_DO_PROJETO.md](ESTADO_DO_PROJETO.md).

## 28/11/2026 — Interface de perfil e adaptação de retratos (2.10.18–2.10.25)

- Perfil HTML reorganizado em três páginas: Personagem, Status e Skills.
- Navegação lateral e botão X restaurados; o perfil preserva moldura e enquadramento responsivo.
- Criado o adaptador `ProfileImageFitter`, que considera dimensões intrínsecas e limites alfa visíveis, redimensiona com o frame e libera o observador ao fechar.
- Status conectado aos dados reais do Player e à alocação de atributos.
- A tela Skills apresenta três slots e consome uma interface opcional de catálogo/equipamento; sem gerenciador real, informa que não há habilidades cadastradas.
- Testes foram ajustados após mudanças de interface; esta sequência motivou a substituição de testes de strings por testes de comportamento.

## 27/11/2026 — Modularização, retratos e UI HTML (2.6.x–2.10.x)

- Extraídos WorldBootstrap, CameraController, SaveManager e GameSystemsBootstrap de responsabilidades antes concentradas em Game.
- Mantidos movimento por toque, follow suave, zoom fracionário e câmera HUD independente.
- Introduzida tela de carregamento HTML com progresso ligado ao loader e pré-carregamento/decodificação das imagens obrigatórias da UI.
- Painéis e retratos migrados para HTML/CSS; mundo e HUD de status continuam no Phaser.
- Retratos de skins migrados de WebP para PNG; ajustes de filtro, escala, enquadramento e atualização idempotente.
- Skin 02 passou a registrar quatro atlas reais, cada um com oito direções, e a ser selecionável após validação.
- Ajustes de CI corrigiram expectativas de testes que ainda apontavam para responsabilidades antigas após extrações.

## 26/11/2026 — Ilha inicial, renderização e desempenho (2.4.x–2.6.x)

- Consolidada uma ilha circular de 4096 × 4096 com terreno em imagem única, oceano e vegetação como objetos independentes.
- Navegação derivada da máscara alfa, grade pré-calculada, cache versionado no IndexedDB e validação do layout de árvores no build.
- Criados managers de objetos, profundidade e colisão; layout da floresta e área de nascimento refinados.
- Spawn, ativação, perseguição e combate dos monstros separados e escalonados para reduzir trabalho por frame.
- Limpeza removeu renderizadores GLB, pipeline de bake e código sem consumidores. O runtime permaneceu 2D com spritesheets PNG/JSON.
- Foram experimentadas abordagens de terreno, oceano e zoom. A implementação vigente é a descrita no estado atual; tentativas substituídas não são requisitos.

## 25/11/2026 — Base de gameplay e arquitetura

- Direção de mundo por ilhas independentes aprovada: uma ilha ativa por vez, com futuras conexões por pontes/portais.
- Controles definidos como toque para destino, arraste para câmera e pinch para zoom; joystick e teclado foram descartados.
- Personagem lógico separado da apresentação visual; animação 2D em quatro estados e oito direções.
- Estrutura de monstros, combate, progressão, atributos e status evoluiu para sistemas independentes.
- Decisões iniciais sobre GLB/Three.js foram posteriormente substituídas pela direção 2D; não representam o runtime atual.

## 24/11/2026 — Registro inicial

- Definidos Phaser 4, Vite, GitHub Pages e Capacitor como stack do projeto.
- Estabelecida a separação entre implementação nova no Colecionador e referência visual limitada do repositório original.
- Criados os primeiros documentos de arquitetura e continuidade.

## Direções substituídas (não reintroduzir sem nova aprovação)

- Mundo contínuo/continente ou várias ilhas jogáveis carregadas simultaneamente: substituído por ilhas independentes, uma ativa por vez.
- Joystick virtual e teclado: substituídos por controles exclusivamente por toque.
- Personagem GLB/renderer 3D no runtime: abandonado; o jogo usa spritesheets 2D.
- Renderizadores antigos, shaders e composições de terreno experimentais: não são contratos de arquitetura; consultar o código atual.
- Zooms temporários testados durante ajustes: substituídos pelos limites vigentes registrados em `ESTADO_DO_PROJETO.md`.
- Retratos WebP das skins: substituídos por PNG.
