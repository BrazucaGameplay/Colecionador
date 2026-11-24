# World core

`WorldCore` owns map bounds, blocked-tile state and player body tile state. Gameplay systems must query it through `isWalkable`, `findPath` and `getPlayerBodyTile`; they must not access its private grid. Map construction supplies blocked tiles through the constructor. `setPlayerBodyTile` validates movement-state updates.

Pathfinding uses A* with eight-direction movement, Euclidean diagonal cost and corner-cut prevention. World dimensions are configurable and default to 90 × 120 tiles.
