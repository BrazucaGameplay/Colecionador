# Guia de produção de sprites de monstros — Colecionador

## Objetivo

Este guia define o formato de entrega para os monstros do jogo. A primeira espécie preparada é o **Slime**. O código já possui carregador, renderer, animações e validação; faltam somente os atlas finais.

## Arquivos do Slime

Coloque os oito arquivos diretamente em `public/assets/monsters/slime/`:

| Animação | PNG | JSON | Loop |
|---|---|---|---|
| Repouso | `slime-idle.png` | `slime-idle.json` | Sim |
| Caminhada | `slime-walk.png` | `slime-walk.json` | Sim |
| Ataque | `slime-attack.png` | `slime-attack.json` | Não |
| Morte | `slime-death.png` | `slime-death.json` | Não |

Não renomeie os arquivos. O catálogo do jogo já aponta para esses nomes.

## Especificação de arte e spritesheet

- PNG RGBA com fundo totalmente transparente.
- Sem chão desenhado, sombra projetada, moldura, texto ou efeitos fora da silhueta do slime. A sombra de contato é criada pelo jogo.
- Uma célula por quadro; todas as células da mesma espécie devem ter a mesma largura e altura.
- Tamanho recomendado por célula: **128 × 128 px**. O gerador aceita outras dimensões, desde que sejam idênticas em todos os quadros.
- Organize o spritesheet em **8 linhas**, uma por direção, e quadros em colunas.
- Ordem das direções, exatamente como o código espera:
  - linha 0: sul (de frente para baixo da tela)
  - linha 1: sudeste
  - linha 2: leste
  - linha 3: nordeste
  - linha 4: norte (costas)
  - linha 5: noroeste
  - linha 6: oeste
  - linha 7: sudoeste
- Todas as direções devem ter a mesma quantidade de quadros. Não deixe células vazias no meio da sequência.
- Mantenha o centro de massa e o contato com o chão consistentes. O ponto de apoio deve ficar próximo ao centro inferior da célula.
- O slime deve permanecer inteiro dentro da célula, inclusive nos quadros de ataque e morte.

### Quantidade de quadros sugerida

Esta é uma recomendação de produção, não uma limitação do motor:

| Animação | Quadros por direção | FPS inicial |
|---|---:|---:|
| Idle | 8 | 8 |
| Walk | 8 | 10 |
| Attack | 6 | 12 |
| Death | 8 | 10 |

Ajuste a quantidade se a animação precisar; informe a quantidade real ao gerar o JSON.

## Gerar o JSON automaticamente

Depois de exportar cada PNG no formato de 8 linhas por direção, use o gerador do repositório. Exemplo, executado na raiz do projeto:

```bash
node scripts/create-monster-atlas.mjs public/assets/monsters/slime/slime-idle.png public/assets/monsters/slime/slime-idle.json 128 128 8 8
node scripts/create-monster-atlas.mjs public/assets/monsters/slime/slime-walk.png public/assets/monsters/slime/slime-walk.json 128 128 8 10
node scripts/create-monster-atlas.mjs public/assets/monsters/slime/slime-attack.png public/assets/monsters/slime/slime-attack.json 128 128 6 12
node scripts/create-monster-atlas.mjs public/assets/monsters/slime/slime-death.png public/assets/monsters/slime/slime-death.json 128 128 8 10
```

Formato dos argumentos: `PNG JSON largura-da-celula altura-da-celula quadros-por-direcao FPS [pivotX] [pivotY]`.

O PNG deve ter exatamente `largura × quadros` por `altura × 8` pixels. O gerador confere as dimensões e escreve o JSON no schema `colecionador.sprite-atlas.v1`. O pivô padrão é `x=0.5`, `y=0.9375`; se o ponto de apoio visual exigir ajuste, informe os dois valores opcionais ou ajuste os pivôs individuais no JSON.

## Integração já existente

- Definição: `src/data/monsters/index.js`.
- Carregamento dos PNG/JSON: `src/rendering/monsters/MonsterAssetLoader.js`.
- Animação e pivô: `src/rendering/monsters/MonsterRenderer.js`.
- Validação automática: `scripts/validate-monster-sprites.mjs`.
- O slime continua com `visual.enabled: false` até os quatro pares estarem prontos. Isso impede requisições a arquivos ausentes e evita arte provisória.

## Checklist de entrega

1. [ ] Os quatro PNGs estão em `public/assets/monsters/slime/`.
2. [ ] Os quatro JSONs foram gerados e correspondem aos PNGs.
3. [ ] Cada atlas contém as oito direções, na ordem definida acima.
4. [ ] O pivô acompanha o contato do slime com o chão sem fazê-lo saltar visualmente.
5. [ ] Executar `node scripts/validate-monster-sprites.mjs public/assets/monsters`.
6. [ ] Só então habilitar `visual.enabled: true` em `src/data/monsters/index.js`.
7. [ ] Executar `npm test` e `npm run build`.
8. [ ] Conferir tamanho, leitura das animações e profundidade no navegador e em Android real.

**Importante:** não use cartas ilustradas 2:3 como spritesheets de gameplay. Elas são assets diferentes e não são compatíveis com este renderer.
