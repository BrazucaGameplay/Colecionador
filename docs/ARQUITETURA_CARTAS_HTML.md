# Arquitetura de cartas HTML

**Status:** Slime integrado como piloto; galeria HTML compartilhada com grade responsiva e carta com frente/verso em rotação no mesmo painel. Boss, waifus e demais monstros permanecem fora do runtime.

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
1. Galeria em grade responsiva com três colunas e pelo menos duas linhas visíveis em telas mobile; uma carta por definição cadastrada.
2. O painel do bestiário usa a moldura vertical já existente para disponibilizar área útil maior. A grade e o painel se adaptam ao viewport, nunca o arquivo da carta.
3. Toque/clique abre a carta selecionada dentro do mesmo painel; tocar na carta executa rotação 3D horizontal para alternar frente e verso. Não existe uma etapa separada por botão “Ver status”.
4. O verso apresenta somente os dados reais. Monstros e Boss usam as nove chaves documentadas em `ARQUITETURA_MONSTROS_E_BOSSES.md`. Não inventar valores.
5. O botão de retorno restaura a grade; as abas Monstros/Boss e o X permanecem disponíveis.

## Implementação
- HTML semântico, botões acessíveis e imagem com texto alternativo.
- Um componente reutilizável, sem lógica de domínio embutida.
- Separar catálogo/dados, descoberta, renderização de imagem e controle da interface.
- Limpar observers/listeners no ciclo de vida.
- Não importar módulos incompletos no runtime.
- Preloader valida imagens obrigatórias apenas quando fornecidas e declaradas.
- Testar proporção integral da imagem, grade 3 × 2, rotação frente/verso, dados de status, retorno à grade, fechamento, troca de categoria e limpeza.

## Processo de inclusão de monstros
O procedimento oficial, em cinco etapas, está centralizado em [PROCESSO_ADICIONAR_MONSTRO.md](PROCESSO_ADICIONAR_MONSTRO.md). Slime é a implementação-piloto. A galeria consome as definições cadastradas e não deve receber código específico por espécie.

## Estado e entrega
As 11 cartas JPG continuam organizadas em pastas individuais e preservadas sem conversão. Apenas Slime está ligado ao catálogo e à galeria. As outras dez imagens permanecem arquivadas e não são carregadas nem registradas no jogo. O componente compartilhado usa a definição cadastrada como fonte de dados e não faz varredura automática de arquivos.
