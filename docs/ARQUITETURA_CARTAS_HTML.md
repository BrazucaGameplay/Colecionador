# Arquitetura de cartas HTML

**Status:** Slime integrado como piloto; galeria HTML compartilhada e navegação arte/status implementadas. Boss, waifus e demais monstros permanecem fora do runtime.

## Escopo
Cartas ilustradas de monstros comuns, Boss e waifus usam o mesmo grupo de apresentação HTML. Componente visual, enquadramento, acessibilidade e responsividade são compartilhados; catálogos, status, progressão, descoberta e regras de domínio permanecem separados. O painel HTML se adapta às dimensões intrínsecas da carta.

## Integridade visual obrigatória
- Exibir o arquivo oficial sem alterar pixels.
- Preservar resolução intrínseca e proporção. Não cortar, esticar, deformar, filtrar, recomprimir ou sobrepor texto.
- A imagem cabe por inteiro (contain); grade, painel e viewport se adaptam à imagem.
- Não usar crop de capa, máscara que esconda a arte, moldura sobre a imagem ou texto sobreposto.
- 2:3 é a proporção visual padrão das cartas ilustradas; não converter arquivo original para forçar essa proporção.
- Visualização ampliada respeita a proporção e a tela, sem cortar.
- Falha de carregamento deve ser reportada, nunca substituída silenciosamente por arte fictícia.
- O padrão responsivo de `ProfileImageFitter` é referência de engenharia, não autorização para aplicar detecção alfa a todas as cartas. Para imagens opacas, dimensionamento proporcional é suficiente.

## Caminhos finais
```text
public/assets/cards/
  monsters/<species-id>/card.<ext>
  bosses/<boss-id>/card.<ext>
  waifus/<waifu-id>/card.<ext>
```
IDs estáveis, minúsculos, sem espaços/acentos. Spritesheets de gameplay não pertencem a esse diretório. A origem principal das cartas de waifus permanece no repositório separado; este repositório recebe cópia final somente quando necessária para o bundle.

## Navegação aprovada
1. Galeria em grade responsiva: uma carta por definição cadastrada.
2. Toque/clique abre a carta ampliada, sem recorte.
3. Seta avança para a página de status do mesmo conteúdo; seta de retorno volta à arte; X fecha.
4. Status vem dos dados reais. Monstros e Boss usam as nove chaves documentadas em `ARQUITETURA_MONSTROS_E_BOSSES.md`. Não inventar valores.
5. Categorias, bloqueio/descoberta e persistência consomem os catálogos e estado real do jogador.

## Implementação
- HTML semântico, botões acessíveis e imagem com texto alternativo.
- Um componente reutilizável, sem lógica de domínio embutida.
- Separar catálogo/dados, descoberta, renderização de imagem e controle da interface.
- Limpar observers/listeners no ciclo de vida.
- Não importar módulos incompletos no runtime.
- Preloader valida imagens obrigatórias apenas quando fornecidas e declaradas.
- Testar proporção, navegação arte/status, fechamento, troca de registro e limpeza.

## Fluxo-padrão para introduzir um monstro novo (usar Slime como referência)

1. Criar `public/assets/cards/monsters/<species-id>/` e colocar a carta final original como `card.<ext>`, sem conversão.
2. Criar/expandir a definição em `src/data/monsters/index.js` com ID estável, nome, nove atributos reais e dados de gameplay aprovados.
3. Declarar o caminho da carta em `bestiary.cardAsset` na própria definição.
4. A projeção `src/data/bestiary/index.js` disponibiliza automaticamente a definição registrada; `CardGallery` apresenta a carta sem código específico por espécie.
5. Adicionar testes de catálogo, caminho do asset e dados; validar carregamento e comportamento no build.
6. Só então a espécie passa a aparecer no bestiário. Um arquivo na pasta de assets, sozinho, não cadastra uma criatura.

Não criar componentes ou telas individuais por monstro. Slime é o caso de referência para o fluxo completo; futuras espécies devem seguir o mesmo contrato.

## Estado e entrega
As 11 cartas JPG continuam organizadas em pastas individuais e preservadas sem conversão. Apenas Slime está ligado ao catálogo e à galeria. As outras dez imagens permanecem arquivadas e não são carregadas nem registradas no jogo. O componente compartilhado usa a definição cadastrada como fonte de dados e não faz varredura automática de arquivos.
