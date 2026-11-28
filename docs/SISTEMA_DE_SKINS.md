# Sistema de skins do protagonista

## Contrato de animação

Toda skin selecionável fornece exatamente quatro animações em atlas PNG com
metadados JSON:

| Estado | Identificador | Comportamento |
|---|---|---|
| Parado | `idle` | Loop |
| Correndo | `running` | Loop |
| Combate | `combat` | Ação; retorna à locomoção |
| Morte | `dying` | Ação; mantém a pose final |

Cada atlas contém oito direções (0–7), dimensões dos quadros, FPS e pivôs por
quadro. O runtime usa spritesheets 2D; GLB/Three.js não são necessários.

## Arquitetura

- `src/data/characters/CharacterSkinCatalog.js`: catálogo, retrato e quatro atlas por skin.
- `src/data/characters/CharacterAnimationCatalog.js`: comportamento dos quatro estados.
- `SkinManager.js`: valida assets e controla seleção.
- `CharacterSpriteAssetLoader.js` e `CharacterSpriteRenderer.js`: carregamento,
  registro das animações e apresentação.
- `Game.js`: conecta seleção, renderer e persistência.
- `HtmlGameUI.js`: exibe retratos e páginas do perfil.
- `ProfileImageFitter.js`: ajusta o conteúdo visível da arte ao frame.

## Estrutura de assets

```text
public/assets/characters/sprites/
  skin_01/
    perfil.png
    skin-basicas-idle.png / .json
    skin-basicas-running.png / .json
    skin-batalha-combate_dd.png / .json
    skin-basicas-dead.png / .json
  skin_2/
    perfil.png
    skin2-idle.png / .json
    skin2-running.png / .json
    skin2-combat.png / .json
    skin2-dying.png / .json
```

Os nomes dos atlas são obtidos do catálogo; manter catálogo e arquivos
sincronizados. A validação automatizada verifica os metadados e o registro
das animações da Skin 02.

## Seleção e persistência

A skin só pode ser selecionada quando o catálogo a marca como pronta, as
quatro animações estão definidas e o runtime confirma que os assets foram
carregados. A troca é recusada durante ação protegida. O ID selecionado é
salvo no registro existente; saves antigos sem `selectedSkin` usam Skin 01.

## Estado atual

- **Skin 01:** pronta e selecionável.
- **Skin 02:** pronta e selecionável após registro/validação dos quatro atlas.
- Retratos das duas skins: PNG.
