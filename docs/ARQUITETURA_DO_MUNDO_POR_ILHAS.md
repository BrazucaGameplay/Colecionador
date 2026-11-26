# Arquitetura do mundo por ilhas

**Projeto:** Conquistador de Waifu's  
**Status:** Direção aprovada; implementação incremental pendente  
**Data:** 25/11/2026  
**Branch de referência:** main

## 1. Decisão de produto

O mundo do jogo será formado por ilhas pequenas e independentes. O jogo manterá **somente uma ilha carregada como área jogável por vez**. O jogador poderá sair de uma ilha por uma ponte ou portal; a transição descarrega a ilha anterior e carrega a ilha de destino. O espaço fora da plataforma da ilha será representado visualmente por céu e nuvens.

Não será construído um continente contínuo nem um mundo aberto gigantesco. O conteúdo será expandido pela criação de novas ilhas.

## 2. Direção visual

A direção escolhida é um mundo com aparência tridimensional: volumes reconhecíveis, relevo, sombras, iluminação, perspectiva isométrica e objetos com profundidade visual. O termo **2.5D** descreve a direção visual pretendida, não uma decisão de migrar imediatamente o jogo para um motor 3D.

O projeto atual usa Phaser 4. A implementação inicial deve privilegiar recursos 2D/isométricos do Phaser (sprites, imagens, camadas, profundidade, sombras e efeitos) e só introduzir renderização 3D/Three.js se um protótipo técnico demonstrar benefício real em qualidade, desempenho e manutenção. A dependência Three.js já presente no package.json não significa que exista integração funcional com o mundo.

A ilha deve parecer um ambiente tridimensional construído, e não uma simples imagem plana com objetos colados. Entretanto, o terreno e os objetos podem continuar sendo assets 2D renderizados com perspectiva e iluminação coerentes.

## 3. Unidade de carregamento

Cada ilha é uma unidade independente de conteúdo e memória. Em execução normal:

- uma ilha ativa e seus recursos de jogo;
- jogador e estado global necessário;
- interface e sistemas compartilhados;
- céu/nuvens como cenário de fundo leve;
- nenhuma outra ilha montada simultaneamente como mundo jogável.

Os dados de outras ilhas podem permanecer em pequenos registros de configuração, mas seus assets e entidades não devem ser carregados até serem necessários.

## 4. Composição de uma ilha

Uma ilha poderá conter:

1. **Terreno:** forma, superfície, bordas, penhascos e áreas caminháveis.
2. **Decoração:** árvores, pedras, vegetação, construções e elementos ambientais.
3. **Entidades:** monstros, NPCs, objetos interativos e jogador.
4. **Navegação:** limites caminháveis, obstáculos e rotas locais.
5. **Conexões:** entradas e saídas por ponte ou portal.
6. **Ambiente:** céu, nuvens, iluminação, efeitos e ambientação sonora.
7. **Estado persistente:** monstros derrotados, objetos coletados, baús, progresso e posição de retorno, conforme o design de cada ilha.

Os elementos decorativos e entidades devem ser independentes do terreno quando isso permitir movimentação, colisão, animação ou interação própria. A área caminhável deve ser definida por dados de navegação, não inferida cegamente de toda a transparência visual da arte.

## 5. Transições entre ilhas

Pontes e portais são pontos de conexão, não carregadores de dois mundos completos.

Fluxo pretendido:

1. Jogador alcança e ativa a saída.
2. O jogo valida a conexão e registra o estado/posição de retorno da ilha atual.
3. A transição apresenta um efeito visual adequado (por exemplo, câmera, fade ou passagem pela ponte).
4. A ilha atual encerra entidades, colisões, navegação, listeners e recursos específicos.
5. O carregador obtém a configuração e os assets da ilha de destino.
6. A nova ilha é montada e sua navegação fica pronta.
7. O jogador aparece no ponto de entrada correspondente.
8. A câmera e a interface são atualizadas; o jogo retoma.

A implementação deve evitar manter as duas ilhas inteiras em memória durante a troca. Se uma transição visual exigir sobreposição temporária, limitar essa sobreposição a uma imagem/efeito leve, não à cena completa de destino.

Pontes podem representar conexões fisicamente visíveis entre ilhas no espaço ficcional, mesmo que a troca técnica ocorra ao cruzar um gatilho. Portais podem executar a mesma transição com apresentação visual diferente.

## 6. Modelo de dados proposto

Cada ilha deve possuir um identificador estável e uma configuração declarativa. Exemplo conceitual (não é ainda um contrato de código implementado):

```js
{
  id: 'island-01',
  name: 'Ilha inicial',
  assets: {
    terrainMaterials: [
      'assets/world/terrain/Terreno_liso.webp',
      'assets/world/terrain/Terreno_moita.webp',
      'assets/world/terrain/Terreno_relevo.webp'
    ],
    objectLayout: 'src/world/map-layout/island-01.js'
  },
  spawn: { x: 0, y: 0 },
  exits: [
    {
      id: 'bridge-east',
      type: 'bridge',
      targetIslandId: 'island-02',
      targetExitId: 'bridge-west'
    }
  ]
}
```

Os nomes e caminhos acima são ilustrativos. Não criar arquivos de assets ou assumir que esses arquivos já existem.

O sistema de conexões deve usar IDs, não referências diretas a objetos Phaser. Isso permite validar conexões, salvar progresso e mudar a apresentação da saída sem reescrever o grafo do mundo.

## 7. Organização de código sugerida

A implementação deve evoluir gradualmente para módulos com responsabilidades claras:

- **IslandCatalog:** metadados leves das ilhas disponíveis.
- **IslandLoader:** carrega e libera os assets da ilha ativa.
- **IslandRuntime / IslandScene:** monta terreno, decoração, entidades e navegação da ilha atual.
- **WorldTransition:** coordena saída, salvamento, descarregamento e entrada.
- **WorldState / SaveManager:** persiste ilha atual, ponto de entrada e estado relevante.
- **IslandNavigation:** navegação local restrita ao terreno da ilha.
- **Connection data:** descreve pontes e portais entre IDs de ilhas.

Isso é uma arquitetura-alvo, não uma afirmação de que tais módulos já existam. Evitar criar camadas de abstração vazias. Integrar somente quando houver pelo menos uma necessidade concreta de uso e teste.

## 8. Relação com o código existente

Estado atualizado em 26/11/2026:

- `Preload` carrega o oceano em `ocean-pattern`, o terreno em `island-terrain` e as texturas de árvores a partir de `public/assets/world/`.
- `Game.createGround()` instancia uma única imagem estática de terreno, `ilha_terreno.webp`, dimensionada para o mundo de 4096 x 4096. O caminho ativo não usa shader nem o módulo legado `IslandTerrainRenderer.js`.
- O layout de árvores está em `src/world/map-layout/island-01.js`; os spawns de monstros ficam em `src/world/spawn-layout/island-01.js`.
- `WorldObjectManager` instancia as árvores; `WorldDepthManager` e `WorldCollisionManager` tratam profundidade e obstáculos.
- `WorldNavigation` constrói a máscara caminhável a partir do alfa do terreno, pré-calcula a grade e usa cache persistente versionado em IndexedDB quando o hash do terreno pode ser obtido.
- `scripts/validate-tree-layout.mjs` valida posições no build e gera `island-01.validated.json`, que limita as árvores instanciadas às posições aprovadas.
- O mundo ainda é uma única ilha; catálogo, conexões, pontes, portais e transições entre ilhas não estão implementados.

A implementação atual usa um PNG de terreno completo como base visual, objetos ambientais independentes e navegação calculada/cacheada a partir da máscara alfa.

## 9. Plano incremental

### Fase A — estabilizar a ilha-base
- Confirmar a arte atual e suas dimensões reais.
- Separar visualmente terreno, objetos e entidades conforme os assets finais disponíveis.
- Definir limites caminháveis e obstáculos.
- Preservar movimento, câmera, zoom e controles atuais.
- Medir memória e desempenho em Android real.

### Fase B — preparar o contrato de ilha
- Definir formato de configuração de ilha e IDs estáveis.
- Separar metadados de ilha dos assets pesados.
- Definir spawn, limites, navegação e conexões.
- Não criar conteúdo fictício para ilhas que ainda não existem.

### Fase C — primeira transição real
- Criar uma segunda ilha de teste com assets aprovados.
- Implementar uma saída (ponte ou portal) e ponto de chegada.
- Descarregar a ilha anterior antes de carregar o conjunto completo da próxima.
- Validar retorno, salvamento, limpeza de listeners e ausência de duplicação de entidades.

### Fase D — expansão
- Adicionar novas ilhas por dados e assets.
- Preservar estado individual de cada ilha.
- Adicionar mapa de seleção/descoberta somente quando o design de navegação exigir.

## 10. Critérios de aceitação

A arquitetura só será considerada implementada quando testes demonstrarem que:

- apenas uma ilha está ativa como mundo jogável por vez;
- a ilha de destino carrega com os assets corretos;
- a ilha anterior libera entidades, listeners e recursos específicos;
- jogador surge no ponto de entrada correto;
- pontes e portais levam ao destino configurado;
- o progresso de uma ilha persiste ao sair e retornar;
- navegação e colisões respeitam os limites da ilha;
- a troca funciona sem recarregar indevidamente o jogo inteiro;
- memória e desempenho são aceitáveis em dispositivos Android-alvo.

Build bem-sucedido ou existência dos módulos não substitui esses testes.

## 11. Decisões e justificativas

| Decisão | Justificativa |
|---|---|
| Ilhas pequenas e independentes | Escopo de conteúdo controlável e expansão por novas áreas. |
| Uma ilha jogável carregada por vez | Reduz memória e complexidade de streaming no Android. |
| Pontes e portais como conexões | Oferecem continuidade ficcional e diferentes tipos de acesso. |
| Céu e nuvens fora das ilhas | Preenche o espaço visual sem exigir um mapa de terreno gigante. |
| Aparência 2.5D/volume tridimensional | Busca profundidade visual sem impor migração imediata para um motor 3D. |
| Dados e IDs para conexões | Evita acoplamento entre objetos Phaser e facilita persistência. |
| Implementação incremental | Preserva o protótipo funcional e permite validar riscos antes de ampliar a arquitetura. |

## 12. Histórico de revisão

### 25/11/2026 — Arquitetura por ilhas
- Escopo redefinido: conjunto de ilhas pequenas, em vez de um mundo aberto gigantesco.
- Definido que somente uma ilha será carregada como mundo jogável por vez.
- Pontes e portais serão os meios de transição.
- Fora da ilha, o cenário será céu e nuvens.
- Direção visual escolhida: aparência construída com elementos de volume tridimensional (2.5D), mantendo Phaser 4 como base inicial.
- Registrado que a arquitetura é uma decisão aprovada, ainda não implementada.
- Registradas fases, critérios de aceitação e relação com o código atual.



### 26/11/2026 — Auditoria do fluxo de terreno e estruturas
- Corrigida a descrição do estado implementado para refletir o código ativo de `Preload`, `Game`, `WorldNavigation` e `WorldObjectManager`.
- Registrado que o terreno ativo é uma única imagem estática e que `IslandTerrainRenderer.js` foi removido por não possuir consumidores.
- Separadas explicitamente as validações de árvore executadas no build das rotinas de instanciação em tempo de jogo.
