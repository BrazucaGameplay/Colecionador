# Arquitetura de cartas HTML

**Status:** contrato e diretórios preparados; componente funcional e tela do bestiário ainda não implementados.

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
  monsters/<species-id>/card.png
  bosses/<boss-id>/card.png
  waifus/<waifu-id>/card.png
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

## Estado e entrega
Estrutura e documentação preparadas. O usuário deve colocar a carta oficial do Slime em `public/assets/cards/monsters/slime/card.png`. A referência recebida em 27/11/2026 tem 1024 × 1536 px (2:3). Nenhuma imagem foi copiada ou alterada nesta atualização.

O componente HTML compartilhado e a integração funcional da galeria/visualização/status são trabalho futuro. Esta estrutura não significa que o bestiário esteja implementado.
