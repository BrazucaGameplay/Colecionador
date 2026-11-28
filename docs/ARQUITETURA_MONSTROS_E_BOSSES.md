# Arquitetura de monstros, Boss e bestiário

**Projeto:** Conquistador de Waifu's  
**Branch:** main · **Versão-base:** 2.10.28  
**Status:** arquitetura aprovada e scaffolding de catálogo criado. IA de Boss, animações direcionais completas, descoberta persistente e UI do bestiário ainda não implementadas.

Este documento separa estado atual, contratos aprovados e trabalho futuro. Estrutura preparada não significa mecânica concluída.

## 1. Categorias e identidade

- **Monstros comuns:** espécies reutilizáveis. Todas as instâncias de uma espécie compartilham definição, atributos-base, visual e comportamento. Cada aparição recebe ID de instância apenas para runtime.
- **Boss:** entidades únicas, com ID estável, definição, identidade, habilidades, parâmetros de atividade e carta próprios.
- `speciesId` identifica a raça comum; `entityId` identifica uma aparição; `bossId` identifica um Boss. Não criar registro de bestiário por instância.

## 2. Contrato compartilhado de status

Player, Monster e Boss devem usar as mesmas nove chaves de `DEFAULT_PLAYER_STATS` em `src/entities/Player.js`:

| Chave | Significado |
|---|---|
| `attack` | poder de ataque |
| `defense` | defesa |
| `penetration` | penetração de defesa |
| `attackSpeed` | ataques por segundo |
| `movementSpeed` | multiplicador de movimento |
| `maxHealth` | vida máxima |
| `maxEnergy` | energia máxima |
| `healthRegen` | regeneração de vida por segundo |
| `energyRegen` | regeneração de energia por segundo |

Cada entidade deve possuir estado próprio. Nunca compartilhar o mesmo objeto mutável de status. Definições de espécie/Boss podem alterar valores, não as chaves nem o significado dos parâmetros. Atividade, IA, colisão, experiência, drops e habilidades são metadados adicionais.

## 3. Monstros comuns

- A animação é opcional por espécie: alguns monstros terão sprites animados; outros podem usar uma imagem estática. A ausência de animação não impede spawn, perseguição ou combate.
- Quando uma espécie tiver animações direcionais, o contrato previsto é de quatro direções visuais (cima, baixo, esquerda e direita); diagonais são mapeadas para a direção cardinal mais próxima. Não exigir atlas 4-way para espécies que não precisam dele.
- **Única espécie atualmente registrada: Slime.** É representado por uma simples bola azul; não precisa de animação direcional nem de um conjunto complexo de estados. A apresentação estática é suficiente neste estágio. Não criar sprites ou animações adicionais para o Slime sem necessidade de gameplay.
- Apenas ataque básico, respeitando `attackSpeed`.
- Perseguição simples; sem árvore de decisão ou habilidades.
- Ao entrar no raio de combate, interromper perseguição e atacar conforme alcance e intervalo.
- Fora da área ativa: sem IA, pathfinding, física dinâmica ou atualização individual contínua; manter apresentação estática.
- Instâncias não são únicas. Reutilizar renderizadores/objetos quando seguro, limpando estado anterior.

### Raios atuais — preservar

Escala atual: 75 unidades de mundo por metro. Valores vigentes em `src/config.js` e `MonsterManager.js`:

| Estado | Raio |
|---|---:|
| Combate/ataque | 2 m / 150 unidades |
| Perseguição | 10 m / 750 unidades |
| Ocioso | 30 m / 2.250 unidades |
| Ativação visual | 50 m / 3.750 unidades |
| Dormant | além de 50 m |

Não alterar estes valores ao adicionar espécies sem decisão de balanceamento separada. Se o alcance de ataque do monstro divergir do alcance do jogador, configurar os dois parâmetros explicitamente.

## 4. Boss

- Oito direções de animação.
- Entidade única, fora do catálogo de espécies comuns.
- Mesmo contrato de nove atributos, com valores próprios.
- IA avançada e habilidades.
- Parâmetros de atividade próprios: percepção, engajamento, alcance de habilidade, retorno/abandono, cadência de decisão e limites de arena.
- Habilidades devem definir custo de energia, cooldown, alcance, alvo, aviso/telegraph, execução e recuperação.
- Respeitar navegação, colisão, ciclo de vida e limpeza de recursos.
- IA avançada não roda fora da área de atividade configurada.

Boss não deve virar conjunto de exceções dentro de `MonsterManager`. Deve ter controlador e ciclo de atualização próprios, compartilhando somente contratos de domínio que forem realmente comuns.

## 5. Bestiário e cartas

Duas abas independentes:
1. **Monstros:** uma carta por espécie do catálogo.
2. **Boss:** uma carta por Boss registrado.

O catálogo deriva das definições estáticas, nunca da população ativa do mapa. Remover uma instância não remove a carta. Descoberta, encontros e derrotas são estado salvo do jogador, separado das definições.

Cada conteúdo pode declarar ID, nome, descrição, categoria, caminho da carta oficial e referência à definição. As cartas serão assets finais do projeto. Não gerar imagens provisórias nem inventar caminhos. Se a carta não existe, a UI futura deve omiti-la ou mostrar estado bloqueado usando componente visual aprovado.

## 6. Contrato visual e HTML das cartas

Cartas de monstros comuns, Boss e waifus usam o mesmo grupo de apresentação HTML, com componente visual compartilhado e dados de domínio separados. A arte oficial deve permanecer intacta: preservar pixels, resolução e proporção; não cortar, esticar, filtrar, recomprimir ou sobrepor texto. O bestiário se adapta à imagem por dimensionamento proporcional integral (contain). A proporção 2:3 é o padrão visual, sem forçar conversão do arquivo original.

Fluxo aprovado: galeria de cartas → toque abre a carta ampliada → seta avança para status do mesmo conteúdo; seta de retorno volta à arte e X fecha. Status deve vir dos dados reais, sem valores inventados. Caminhos finais e contrato detalhado: [ARQUITETURA_CARTAS_HTML.md](ARQUITETURA_CARTAS_HTML.md).

## 7. Organização de código-alvo

Módulos futuros não devem ser importados pelo runtime antes de implementados e testados.

```text
src/
  data/
    monsters/       # catálogo atual; uma definição por espécie quando crescer
    bosses/         # catálogo único de Boss
    bestiary/       # projeção em duas categorias
  entities/
    Monster.js      # existente
    Boss.js         # futuro
  systems/
    monsters/       # spawn, atividade, perseguição e combate existentes
    bosses/         # BossManager, BossAIController, BossAbilitySystem
    bestiary/       # descoberta, encontros e integração com save
  rendering/
    monsters/       # renderer/loader existentes
    bosses/         # renderer/loader 8-way
    bestiary/       # carregamento e enquadramento das cartas
  ui/
    bestiary/       # tela e abas Monstros/Boss
public/assets/
  monsters/<species-id>/
  bosses/<boss-id>/
  bestiary/monsters/
  bestiary/bosses/
tests/
  monster-*.test.js
  boss-*.test.js
  bestiary-*.test.js
```

## 8. Contratos de dados conceituais

Espécie comum:

```js
{
  id: 'species-id',
  category: 'monster',
  name: 'Nome',
  stats: { /* nove chaves compartilhadas */ },
  activity: {
    combatRadius: 150,
    pursuitRadius: 750,
    idleRadius: 2250,
    activationRadius: 3750
  },
  behavior: { kind: 'basic-melee' },
  animation: null, // opcional; usar somente quando a espécie tiver animações reais
  assets: { sprite: 'assets/monsters/species-id/static.png', atlas: null, card: null }
}
```

Boss:

```js
{
  id: 'boss-id',
  category: 'boss',
  name: 'Nome',
  unique: true,
  stats: { /* nove chaves compartilhadas */ },
  activity: { perceptionRadius: 0, engagementRadius: 0, arenaRadius: 0 },
  abilities: [],
  animation: { directions: 8, states: [] },
  assets: { atlas: null, card: null }
}
```

Exemplos são contratos, não conteúdo jogável. Zeros/nulls não são valores de balanceamento.

## 9. Desempenho e ciclo de vida

- Não criar timer, tween, Arcade Body ou callback por monstro inativo.
- Separar culling visual de ativação de IA: estar na câmera não ativa simulação.
- Escalonar ticks de atividade e simular apenas entidades relevantes.
- Quando a população justificar, usar consultas espaciais por região/célula em vez de varrer toda a população repetidamente.
- Limitar frequência de decisão e número de Boss ativos.
- Medir spawn, ativação, navegação, IA, renderização e combate na população-alvo.
- Entrada/saída de atividade deve ser idempotente e liberar controladores/listeners.
- Garantir que `movementSpeed` do status seja aplicado ao movimento real da entidade.

## 10. Critérios para novos conteúdos

- ID estável, sem duplicatas; todas as nove chaves numéricas.
- Assets referenciados existem e são validados no build.
- Monstro comum: animação opcional por espécie; quando existir animação direcional, usar quatro direções. Boss tem oito.
- Combate, alcance e cooldown cobertos por testes de comportamento.
- Entidades inativas não executam IA individual.
- Spawn, morte, remoção e respawn não deixam recursos órfãos.
- Bestiário apresenta uma carta por definição e mantém descoberta após reiniciar.
- Build e testes de carga validam o pacote final.

## 11. Estado real na versão 2.10.28

**Já existe:** entidade lógica Monster, catálogo comum com Slime (única espécie registrada), spawner por zona, perseguição simples, combate básico, renderer e loader por estado; raios documentados na seção 3.

**Regra visual atual:** o Slime é uma bola azul simples e não requer animação direcional. A animação será definida individualmente por espécie; conteúdo sem animação usa sprite estático. Não presumir que todos os monstros terão atlas animado.

**Estrutura preparada nesta versão:** catálogo vazio de Boss; projeção de catálogo do bestiário em duas categorias; diretórios reservados para sistemas, renderização e UI.

**Ainda não implementado:** catálogo de outras espécies (cada uma poderá ter animação ou imagem estática), Boss jogável/IA/habilidades 8-way, otimização espacial por células, descoberta persistente, cartas finais e UI do bestiário.
