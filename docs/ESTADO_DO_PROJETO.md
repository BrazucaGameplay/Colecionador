# Estado atual do projeto

**Projeto:** Conquistador de Waifu's  
**Repositório:** [BrazucaGameplay/Colecionador](https://github.com/BrazucaGameplay/Colecionador)  
**Branch de referência:** `main`  
**Versão do código-base consultado:** 2.10.34  
**Atualizado em:** 28/11/2026 (menu principal responsivo em revisão)

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
- Combate de ação, ataque automático do jogador, combate dos monstros, progressão, experiência, níveis, atributos, vida e energia.
- SaveManager, WorldBootstrap, CameraController e GameSystemsBootstrap separados.
- HUD e painéis HTML. O Perfil tem três páginas: Personagem, Status e Skills; o enquadramento do retrato é adaptativo. O menu principal tem layout próprio, usa margens de segurança do viewport e separa o botão FPS do botão global inferior.
- CI executa auditoria de dependências, testes, build e verificações de assets/versão.

### O que falta ou não está confirmado
- Sistema de habilidades reais/equipáveis: a tela Skills existe, mas o catálogo e o gerenciador de habilidades ainda não estão integrados.
- Sistemas de waifus, vínculos, presentes, inventário completo e casa. O catálogo do bestiário usa Slime como primeira entrada e a galeria HTML compartilhada está integrada; descoberta persistente e conteúdo Boss ainda faltam. As outras dez cartas estão apenas arquivadas, sem registro de criatura.
- Catálogo/carregador de ilhas, conexões, pontes, portais e transições entre ilhas.
- Validação visual final e de desempenho em dispositivos Android reais. A captura Android mais recente identificou colisão entre o FPS e a navegação inferior e margem insuficiente na moldura do menu; a correção 2.10.34 está preparada para nova validação no aparelho.
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
| Gameplay | MovementSystem, CombatSystem, ProgressionSystem, MonsterManager e MonsterCombatSystem; catálogo de Boss/bestiário preparado |
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

1. Substituir testes frágeis baseados em leitura de código por testes de comportamento nos contratos relevantes.
2. Validar a interface e o enquadramento do perfil em Android real.
3. Implementar o catálogo/runtime de Skills antes de habilitar equipar.
4. Planejar a segunda ilha somente após critérios e assets aprovados para a primeira transição.
5. Completar as integrações de waifus, inventário, bestiário e drops conforme o design aprovado.

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
