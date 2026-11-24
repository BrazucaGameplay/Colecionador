# Núcleo do mundo 2D isométrico

## WorldManager

`WorldManager` é a fachada pública para os sistemas que precisam consultar
o mundo. Ele encapsula o núcleo lógico e o renderizador, sem expor suas
instâncias internas.

APIs públicas:
- `isInside(tx, ty)`
- `isWalkable(tx, ty)`
- `findPath(start, goal)`
- `getPlayerBodyTile()`
- `setPlayerBodyTile(tile)`
- `render(tiles)`
- `destroy()`

Dimensões do mundo e métricas dos tiles devem ser fornecidas explicitamente.
Não existe tamanho padrão aprovado. Os antigos 90 × 120 tiles são apenas
uma referência histórica e não devem ser assumidos como dimensão final.

## WorldCore

`WorldCore` é a autoridade lógica do mapa: limites, tiles bloqueados,
posição lógica do corpo do jogador e pathfinding. Sistemas de gameplay
consultam as APIs do WorldManager e não acessam a GRID privada.

Pathfinding usa A* com oito direções, custo diagonal e prevenção de corte
de cantos bloqueados.

## IsometricProjection

Converte coordenadas de tile em coordenadas de mundo e vice-versa. As
métricas de largura e altura dos tiles são parâmetros obrigatórios; não
existem dimensões visuais fixas nesta fase.

## IsometricMapRenderer

Recebe dados visuais independentes das regras do mundo e instancia imagens
nas posições projetadas, ordenando tiles por profundidade. O renderer não
altera colisões nem a GRID.

## DepthSortingSystem

Calcula a profundidade de entidades a partir da posição lógica ou da
posição de mundo convertida para tiles. Para sprites altos, a posição
fornecida deve representar a base/ponto de contato com o chão, não o centro
visual da imagem.

## Limites desta etapa

- O WorldManager, a projeção e o renderizador estão integrados à cena por
  meio de um mapa isométrico de depuração.
- As dimensões 30 × 17 e os tiles 64 × 32 pertencem somente ao preview;
  não são especificações do mundo final.
- A substituição do preview depende da definição do mapa, métricas finais
  dos tiles e assets isométricos.
- Chunks não são obrigatórios. Só serão introduzidos se escala ou medições
  reais de desempenho justificarem.
