# Guia de sprites de monstros — Colecionador

## Localização

Os recursos de cada espécie ficam em uma pasta própria:

`public/assets/monsters/slime/`

A definição da espécie está em `src/data/monsters/index.js`. Não colocar
sprites de monstros dentro da pasta do protagonista ou dos assets do mundo.

## Pacotes da primeira espécie

| Estado | PNG | JSON |
|---|---|---|
| Repouso | `slime-idle.png` | `slime-idle.json` |
| Movimento | `slime-walk.png` | `slime-walk.json` |
| Ataque | `slime-attack.png` | `slime-attack.json` |
| Morte | `slime-death.png` | `slime-death.json` |

Os nomes e caminhos são relativos a `public/assets/monsters/slime/`.
Cada pacote é carregado separadamente, como ocorre com os atlas do protagonista.

## Contrato JSON

Usar o schema `colecionador.sprite-atlas.v1`, seguindo os metadados
já presentes em `public/assets/characters/sprites/skin_01/`.

Campos necessários:
- `fps`: quadros por segundo.
- `frameSize`: largura e altura de cada quadro.
- `frameCount`: total de quadros.
- `directionCount`: quantidade de direções.
- `atlas`: dimensões e organização do atlas.
- `pivot`: pivô de referência.
- `frames`: lista com `frame`, `direction`, `x`, `y`, `width`,
  `height`, `pivotX` e `pivotY`.

O renderer gera nomes internos `d{direction}-f{frame}`. Os quadros devem
estar ordenados por direção e índice; a direção 0 precisa existir.
O pivô deve apontar para o contato real do monstro com o chão, e pode variar
por quadro para impedir que o personagem flutue durante a animação.

## Como integrar quando os sprites estiverem prontos

1. Enviar os pares PNG/JSON para a pasta da espécie.
2. Conferir os nomes e caminhos em `src/data/monsters/index.js`.
3. Definir `visual.enabled: true`.
4. Ajustar os quadros de idle, walking, attack e death conforme os nomes
   efetivamente presentes no JSON.
5. Executar `npm test` e `npm run build`.
6. Confirmar no Android escala, pivô, leitura das animações e profundidade.

O workflow valida automaticamente os pares e os pivôs dos atlas habilitados.
Enquanto `visual.enabled` for false, o jogo não requisita arquivos ausentes
nem cria círculos ou outras imagens temporárias.

## Regras visuais

- Preferir PNG com transparência.
- Manter proporção consistente entre os quadros de uma mesma espécie.
- Não inserir nome, moldura ou texto no spritesheet.
- Não usar carta ilustrada 2:3 como spritesheet de gameplay.
- Manter o ponto de apoio coerente com a perspectiva e com o chão da ilha.
