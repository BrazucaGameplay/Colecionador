# Sistema de skins do protagonista

## Contrato de animação

Toda skin utilizável fornece exatamente quatro animações, cada uma em atlas PNG
com metadados JSON:

| Estado | Identificador | Comportamento |
|---|---|---|
| Parado | `idle` | Loop |
| Correndo | `running` | Loop |
| Combate | `combat` | Ação não repetida; retorna à locomoção |
| Morte | `dying` | Ação não repetida; mantém a pose final |

Cada atlas deve conter as oito direções (0–7), FPS, dimensões dos quadros e
pivôs por quadro. Não existem estados separados para caminhada, salto, golpe
alternativo ou passo especial.

## Arquitetura

- `CharacterSkinCatalog.js`: define as skins, os quatro atlas e o retrato.
- `CharacterAnimationCatalog.js`: define o comportamento comum dos quatro estados.
- `SkinManager.js`: valida os quatro atlas carregados e confirma a seleção.
- `CharacterSpriteRenderer.js`: registra atlas por skin e troca a aparência sem recriar Player.
- `GameUI.js`: carrega o retrato a partir da pasta de cada skin.
- `PlayerHUD.js` e `ProfilePanel.js`: exibem o retrato da skin equipada.
- `Game.js`: conecta renderer, seleção e persistência imediata.

## Estrutura dos arquivos

Cada skin mantém seu retrato PNG transparente e seus atlas no mesmo diretório:

```text
public/assets/characters/sprites/
  skin_01/
    perfil.png
    skin-basicas-idle.png
    skin-basicas-idle.json
    skin-basicas-running.png
    skin-basicas-running.json
    skin-batalha-combate_dd.png
    skin-batalha-combate_dd.json
    skin-basicas-dead.png
    skin-basicas-dead.json
  skin_2/
    perfil.png
    parado.jpg
    corrida.jpg
    ataque.jpg
    morte.jpg
    (quatro atlas PNG/JSON ainda necessários)
```

## Troca e persistência

A troca é recusada durante uma ação ativa. Ao aceitar, preserva posição,
direção, escala, sombra e profundidade, retomando parado ou correndo na nova
aparência. O ID da skin é salvo no registro existente. Saves antigos sem
`selectedSkin` continuam usando Skin 01.

## Estado das skins

- **Skin 01:** pronta e selecionável.
- **Skin 02:** em preparação. Os quatro JPGs são referências visuais, não
  atlas de animação; o retrato `perfil.png` já fica na pasta da skin.
