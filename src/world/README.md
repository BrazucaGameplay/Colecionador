# Núcleo do mundo

`WorldCore` é a autoridade lógica do mapa: limites, tiles bloqueados,
posição lógica do corpo do jogador e pathfinding. Sistemas de gameplay
consultam suas APIs públicas e não acessam a GRID privada.

A dimensão do mundo deve ser fornecida explicitamente na construção.
Não existe tamanho padrão aprovado: os antigos 90 × 120 tiles são apenas
uma referência histórica e não devem ser assumidos como dimensão final.

APIs públicas:
- `isWalkable(tx, ty)`
- `findPath(start, goal)`
- `getPlayerBodyTile()`
- `setPlayerBodyTile(tile)`

Pathfinding usa A* com oito direções, custo diagonal e prevenção de corte
de cantos bloqueados. A projeção visual isométrica é independente do núcleo
lógico; conversões entre tile e pixel pertencem à camada de projeção/render.
