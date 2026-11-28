# Estado atual do projeto

**Projeto:** Conquistador de Waifu's  
**Repositório:** [BrazucaGameplay/Colecionador](https://github.com/BrazucaGameplay/Colecionador)  
**Branch de referência:** `main`  
**Versão do código-base consultado:** 2.13.1  
**Atualizado em:** 28/11/2026 (correção de teste do sistema de cartas)

> Este documento descreve o estado presente. O histórico de mudanças fica em [CHANGELOG.md](CHANGELOG.md); decisões especializadas e contratos ficam nos documentos próprios. O código e os testes da `main` prevalecem sobre descrições antigas.

## Resumo executivo

### Stack
- **Runtime:** JavaScript ES modules, Phaser 4 (`^4.2.1`).
- **Build/dev:** Vite (`^8.3.8`), Node.js 26.13.1, npm 11.20.0.
- **Distribuição:** PWA/web em GitHub Pages; Capacitor 8.6.2 declarado para Android.
- **Renderização:** jogo 2D com spritesheets PNG/JSON; interface híbrida Phaser + HTML/CSS. Não há runtime GLB/Three.js.

### O que existe
- Cenas Boot, Preload, Menu, Game e GameUI.
- Uma ilha circular jogável de 4096 × 4096, terreno em imagem única, oceano, vegetação e objetos independentes.
- Navegação por máscara alfa pré-calculada, grade caminhável e cache IndexedDB; obstáculos e spawn de monstros.
- Controles exclusivamente por toque: toque define destino, arraste move a câmera e pinça altera o zoom. Zoom atual: mínimo 0.2×, inicial 0.4×, máximo 0.6×.
- Player lógico, adaptador de corpo, renderização 2D, quatro animações por skin e oito direções.
- Skin 01 e Skin 02 com atlas PNG/JSON e retratos PNG; seleção validada pelo SkinManager.
- Combate de ação, ataque automático do jogador, combate dos monstros, progressão, experiência, níveis, atributos, vida e energia. Habilidades automáticas são fornecidas exclusivamente pelas cartas de waifu equipadas.
- SaveManager, WorldBootstrap, CameraController e GameSystemsBootstrap separados.
- HUD e painéis HTML. O Perfil tem três páginas: Personagem, Status e Skills; o enquadramento do retrato é adaptativo. A navegação usa setas discretas como indicação de arrasto nos dois sentidos, mantém o botão Voltar na primeira tela e não exibe botão X/Sair no Perfil. O menu principal usa uma moldura vetorial SVG dedicada, com borda inferior contínua e ornamentos completos; o layout responsivo preserva a proporção e mantém o controle FPS compacto fora do eixo central do botão global inferior.
- CI executa auditoria de dependências, testes, build e verificações de assets/versão.

### Sistema de waifus e drops — primeira aquisição funcional (2.12.0)

- Criadas classificações centrais de raridade fixa (Comum, Rara, Épica, Lendária, Mítica) e qualidade fixa na aquisição (Plebeia, Nobre, Dama, Princesa, Rainha).
- Criados pontos de entrada separados para catálogo e tabelas de drop. A tabela do Slime concede a carta Donzela Slime com 20% de chance; as demais espécies ainda não estão cadastradas.
- Reservados diretórios para cinco molduras de raridade e cinco selos de qualidade, sem assets provisórios.
- A coleção usa `public/assets/cards/waifus/carta.slime.webp` como arte original da Donzela Slime. O catálogo `src/data/waifus/catalog.js` é a fonte única das habilidades e passivas. `WaifuEquipmentManager` equipa até três instâncias possuídas e persiste seus IDs; `WaifuAbilitySystem` dispara as habilidades no ciclo do ataque automático, com cooldown individual por instância. O painel Waifus exibe as cartas efetivamente adquiridas em grade de três colunas por duas linhas, sem moldura individual, borda ou texto sobre a ilustração; a moldura do painel segue o padrão largo já usado pela interface. A galeria agrupa cópias da mesma waifu e qualidade em pilhas com contador; qualidades diferentes permanecem separadas. A galeria só reconstrói o DOM quando a composição ou quantidade das pilhas muda. O painel de Waifus usa a mesma arte vertical `painel_vertical_900x1350_transparente.webp` e a mesma proporção/área de conteúdo do Bestiário; as cartas usam dimensões constantes (largura máxima 116 px, altura máxima 150 px, proporção 2:3) e a grade se adapta com rolagem.
- A origem principal das ilustrações de waifus continua no repositório separado. A integração de equipamento e habilidade automática está implementada; presentes, evolução de nível e passivas ainda não foram implementados.
- Documento de referência: [Arquitetura do sistema de waifus](ARQUITETURA_DO_SISTEMA_DE_WAIFUS.md).

## O que falta ou não está confirmado
- Valores passivos da Donzela Slime ainda não foram definidos; seu campo permanece vazio, sem bônus inventados. Apenas a habilidade ativa Gosma Azul está cadastrada (projétil, dano 10, recarga 10 s).
- Sistemas de vínculos, presentes, inventário visual completo e casa. O catálogo do bestiário usa Slime como primeira entrada e a galeria HTML compartilhada está integrada; descoberta persistente e conteúdo Boss ainda faltam. As outras dez cartas estão apenas arquivadas, sem registro de criatura.
- Catálogo/carregador de ilhas, conexões, pontes, portais e transições entre ilhas.
- Validação visual final e de desempenho em dispositivos Android reais. A captura Android posterior à versão 2.10.34 confirmou que a arte raster original tinha a moldura inferior incompleta; a versão 2.10.35 substitui apenas a arte do menu principal por um SVG vetorial com borda inferior contínua e aguarda nova confirmação visual no aparelho.
- Build nativo/APK, instalação e publicação na Play Store.
- Confirmação de deploy correspondente ao commit mais recente, quando não houver evidência do workflow atual.

## Direção aprovada e vigente

- RPG de ação 2D com estética anime ilustrada; não usar pixel art.
- Phaser 4 permanece como motor. A profundidade visual pode usar composição 2.5D/isométrica com assets 2D; não há decisão de migrar para motor 3D.
- Mundo expansível por ilhas independentes, com **uma ilha jogável carregada por vez**. Pontes/portais e transições são direção aprovada, ainda não implementada.
- Controles mobile por toque: tap-to-move, arraste de câmera e pinch zoom. Não adicionar joystick virtual nem controles de teclado.
- Personagem e monstros usam assets 2D finais. GLB/Three.js não fazem parte do runtime.
- Cada skin utilizável fornece quatro estados (idle, running, combat, dying), com oito direções.
- O painel Perfil mantém as telas Personagem, Status e Skills, com setas laterais e X. Skills só devem permitir equipar quando existir catálogo e lógica reais.
- O repositório antigo `BrazucaGameplay/CONQUISTADOR-` é referência visual limitada a cartas/ilustrações de waifus e monstros; não é base de código nem fonte de assets ambientais.

## Arquitetura atual

| Área | Implementação atual |
|---|---|
| Inicialização | `src/main.js`, cenas Boot/Preload/Menu/Game/GameUI |
| Mundo | `src/world/WorldBootstrap.js`, `WorldNavigation.js`, layout e managers de objetos, profundidade e colisão |
| Câmera/input | `CameraController.js`, `TouchInputController.js` |
| Personagem | `Player.js`, `PlayerBodyAdapter.js`, `CharacterSpriteRenderer.js`, `SkinManager.js` |
| Gameplay | MovementSystem, CombatSystem, ProgressionSystem, MonsterManager, MonsterCombatSystem e MonsterDropResolver; catálogo de Boss/bestiário preparado |
| Persistência | `src/systems/persistence/SaveManager.js`; chave legada `colecionador-save-v1` preservada |
| UI | `GameUI.js`, `HtmlGameUI.js`, CSS da interface, HUD Phaser e `ProfileImageFitter.js` |
| Assets | `public/assets/`; catálogos e validadores em `src/rendering/` e `scripts/` |

## Critérios para declarar algo concluído

- **Implementado:** existe no código da branch.
- **Testado:** comportamento coberto por teste automatizado ou verificação indicada.
- **Publicado:** workflow do commit exato concluiu com sucesso e a publicação foi confirmada.
- **Validado em Android:** executado em dispositivo real. Build web ou CI não substitui essa validação.

Não inferir conclusão visual, Android ou publicação a partir da existência do código.

## Próximas prioridades

1. Confirmar no Android a nova arte vetorial do menu, verificando os quatro cantos e toda a borda inferior.
2. Substituir testes frágeis baseados em leitura de código por testes de comportamento nos contratos relevantes.
3. Validar a interface e o enquadramento do perfil em Android real.
4. Implementar o catálogo/runtime de Skills antes de habilitar equipar.
5. Planejar a segunda ilha somente após critérios e assets aprovados para a primeira transição.
6. Completar as integrações de waifus, inventário, bestiário e drops conforme o design aprovado.

## Conteúdo hostil

- Monstros comuns: Slime é a única espécie atualmente registrada; é uma bola azul simples e não necessita animação direcional. Outras espécies poderão ter animações próprias ou usar imagens estáticas. O sistema de spawn, perseguição simples e combate básico já existe.
- Boss: catálogo vazio preparado; entidades, IA, habilidades e renderização 8-way ainda não implementados.
- Bestiário: galeria HTML com host de posicionamento separado do componente de galeria, grade responsiva, botão global inferior para alternar Monstros/Boss ou voltar da carta, X global para fechar, carta integral do Slime e rotação frente/verso no mesmo painel; descoberta e persistência ainda pendentes. Outras dez imagens permanecem arquivadas e fora do catálogo.
- Raios atuais preservados: ataque 2 m, perseguição 10 m, ocioso 30 m, ativação 50 m.
- Processo obrigatório para qualquer espécie nova: [PROCESSO_ADICIONAR_MONSTRO.md](PROCESSO_ADICIONAR_MONSTRO.md).
- Detalhes e contratos: [Arquitetura de monstros e Boss](ARQUITETURA_MONSTROS_E_BOSSES.md).

## Documentos relacionados

- [Processo oficial para adicionar um monstro](PROCESSO_ADICIONAR_MONSTRO.md) — sequência obrigatória de asset, catálogo, `bestiary.cardAsset`, dados reais, testes e validação.
- [Arquitetura de monstros e Boss](ARQUITETURA_MONSTROS_E_BOSSES.md) — contratos de conteúdo, status, atividade, IA, assets e bestiário.
- [Arquitetura de cartas HTML](ARQUITETURA_CARTAS_HTML.md) — apresentação compartilhada e integridade das cartas.
- [Arquitetura do mundo por ilhas](ARQUITETURA_DO_MUNDO_POR_ILHAS.md) — decisão e plano de transição entre ilhas.
- [Sistema de skins](SISTEMA_DE_SKINS.md) — contrato de atlas e seleção.
- [Plano de arquitetura e desenvolvimento](PLANO_ARQUITETURA_E_DESENVOLVIMENTO.txt) — princípios técnicos, sem duplicar o estado atual.
- [Processo obrigatório de atualização](PROCESSO_OBRIGATORIO_DE_ATUALIZACAO.md) — versionamento, auditoria e publicação.
- [Changelog](CHANGELOG.md) — marcos históricos consolidados.
