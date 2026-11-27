# Sistema de skins do protagonista

## Estado

A troca visual em runtime está integrada para skins `ready` cujos atlas foram
carregados e validados. Skin 01 continua habilitada. Skin 02 permanece em
preparação: os quatro JPGs são referências, não atlas de animação.

## Contrato

Oito estados lógicos: idle, walking, running, dying, flirtyStrut, combat,
combatSlash e jump. Walking/running podem compartilhar um atlas, portanto são
sete pacotes PNG/JSON. Cada pacote precisa conter frames nas oito direções
(0–7), FPS, dimensões e pivôs por quadro.

## Arquitetura

- `CharacterSkinCatalog.js`: caminhos, retratos, disponibilidade e contrato.
- `CharacterAnimationCatalog.js`: metadados comportamentais e fábrica por skin.
- `SkinManager.js`: valida assets carregados e só confirma após aceite do renderer.
- `CharacterSpriteRenderer.js`: registra atlas por skin e troca textura sem recriar Player.
- `ProfilePanel.js`: catálogo, prévia, status e ação de equipar.
- `Game.js`: conecta renderer, seleção e persistência imediata.

## Troca e persistência

A troca é recusada durante ações ativas (ataque, salto ou morte), para não
interromper clips. Ao aceitar, preserva posição, direção, escala, sombra,
profundidade e movimento, retomando idle/corrida na nova aparência. O ID é
salvo no registro existente. Saves antigos sem `selectedSkin` usam Skin 01.
Player permanece independente da aparência.

## Skin 02

`parado.jpg`, `corrida.jpg`, `ataque.jpg` e `morte.jpg` são referências;
`perfil.webp` é usado apenas na interface. Habilitar somente quando os sete
atlas PNG/JSON estiverem completos e validados nas oito direções.
