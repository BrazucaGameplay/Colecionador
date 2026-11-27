# Sistema de skins do protagonista

## Estado desta etapa

O catálogo e o gerenciador de seleção estão implementados. A Skin 01 continua
sendo a aparência padrão e a única skin habilitada para uso no jogo.

A pasta `public/assets/characters/sprites/skin_2/` contém quatro imagens JPG
de referência (parado, corrida, ataque e morte) e uma imagem de perfil.
Essas imagens não são spritesheets de animação e não devem ser carregadas
pelo renderer como se fossem atlas.

A Skin 02 foi registrada no catálogo com estado `preparation` e não pode
ser equipada até que seus atlas PNG/JSON estejam prontos. Isso impede que
uma seleção incompleta provoque textura ausente ou animação quebrada.

## Contrato de animação

Toda skin jogável deve oferecer estes estados:

| Estado lógico | Pacote de animação |
|---|---|
| idle | parado |
| walking | corrida |
| running | corrida |
| dying | morte |
| flirtyStrut | passo especial |
| combat | ataque principal |
| combatSlash | golpe de espada |
| jump | salto |

Walking e running podem compartilhar o mesmo atlas, como já acontece na
Skin 01. O contrato lógico possui oito estados e sete pacotes distintos.

Cada pacote deve ter:
- um atlas PNG com transparência;
- um JSON com frames, direções, dimensões, FPS e pivôs;
- as oito direções utilizadas pelo protagonista;
- origem/pivô compatível com o ponto de contato dos pés no chão.

A convenção de nomes reservada para a Skin 02 está em
`src/rendering/characters/CharacterSkinCatalog.js`.

## Arquitetura

- `CharacterSkinCatalog.js`: catálogo, caminhos, referências e contrato.
- `SkinManager.js`: valida disponibilidade e mantém a skin selecionada.
- `CharacterSpriteRenderer.js`: continua responsável por renderizar
  animações, ações, pivôs, escala, sombra e profundidade.
- `Player.js`: continua independente da aparência.
- `Game.js`: inicializa o gerenciador e persiste o identificador da skin
  no save existente, sem alterar a chave ou apagar campos antigos.

A seleção da aparência não deve modificar atributos, posição, vida, energia,
direção, estado de combate, destino de movimento ou câmera.

## Persistência

O save existente passa a aceitar o campo opcional `selectedSkin`.
Saves antigos sem esse campo continuam válidos e usam `skin_01` como padrão.
O restante dos dados do jogador permanece preservado.

## Próxima integração necessária

1. Produzir os sete atlas PNG/JSON da Skin 02, cobrindo todos os estados
   acima (walking/running podem compartilhar um atlas).
2. Validar dimensões, quadros, oito direções e pivôs.
3. Habilitar a Skin 02 no catálogo somente depois de todos os arquivos
   existirem e serem verificados.
4. Integrar carregamento sob demanda e troca visual no renderer.
5. Adicionar a seleção visual ao painel de perfil.
6. Executar testes, build e validação em dispositivo Android.

Não habilitar uma skin apenas porque sua imagem de perfil existe.
