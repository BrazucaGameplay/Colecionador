import test from 'node:test';
import assert from 'node:assert/strict';
import WorldNavigation from '../src/world/WorldNavigation.js';

function naiveCollision(blockers, x, y, radius) {
  return blockers.some(obstacle => {
    const dx = (x - obstacle.x) / (obstacle.radiusX + radius);
    const dy = (y - obstacle.y) / (obstacle.radiusY + radius);
    return dx * dx + dy * dy < 1;
  });
}

test('grade espacial mantém o resultado das colisões elípticas originais', () => {
  const navigation = new WorldNavigation(4096, 4096);
  const obstacles = [
    { x: 128, y: 128, radiusX: 29, radiusY: 27 },
    { x: 255, y: 260, radiusX: 59, radiusY: 53 },
    { x: 1024, y: 1024, radiusX: 38, radiusY: 32 },
    { x: 2048, y: 2048, radiusX: 120, radiusY: 80 },
    { x: 3900, y: 3900, radiusX: 31, radiusY: 28 }
  ];
  for (const obstacle of obstacles) navigation.addObstacle(
    obstacle.x, obstacle.y, obstacle.radiusX, obstacle.radiusY
  );

  for (let y = 0; y <= 4096; y += 37) {
    for (let x = 0; x <= 4096; x += 41) {
      for (const radius of [0, 10, 12, 24, 64, 128]) {
        const expected = !naiveCollision(obstacles, x, y, radius);
        const actual = !navigation.getNearbyObstacles(x, y, radius).some(obstacle => {
          const dx = (x - obstacle.x) / (obstacle.radiusX + radius);
          const dy = (y - obstacle.y) / (obstacle.radiusY + radius);
          return dx * dx + dy * dy < 1;
        });
        assert.equal(actual, expected, `divergência em (${x}, ${y}), raio ${radius}`);
      }
    }
  }
});

test('busca de obstáculos consulta apenas buckets locais, não toda a floresta', () => {
  const navigation = new WorldNavigation(4096, 4096);
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 12; col++) {
      navigation.addObstacle(160 + col * 320, 160 + row * 320, 31, 28);
    }
  }

  const nearby = navigation.getNearbyObstacles(160, 160, 12);
  assert.ok(nearby.length > 0);
  assert.ok(nearby.length < navigation.blockers.length / 4,
    `consulta local retornou ${nearby.length} de ${navigation.blockers.length} obstáculos`);
});

test('isWalkable e isAreaWalkable respeitam obstáculos próximos e ignoram os distantes', () => {
  const navigation = new WorldNavigation(1024, 1024);
  navigation.addObstacle(300, 300, 31, 28);
  navigation.addObstacle(900, 900, 31, 28);

  assert.equal(navigation.isWalkable(12, 12), false);
  assert.equal(navigation.isWalkable(5, 5), true);
  assert.equal(navigation.isAreaWalkable(300, 300, 10), false);
  assert.equal(navigation.isAreaWalkable(500, 500, 10), true);
});


test('máscara alfa mantém as nove amostras sem alocar offsets por célula', () => {
  const navigation = new WorldNavigation(96, 96);
  const width = 96;
  const height = 96;
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) rgba[i * 4 + 3] = 255;
  navigation.setAlphaMask(rgba, width, height, 150);
  assert.equal(navigation.isInsideIsland(48, 48), true);

  const blockedX = Math.floor((48 + 14) * width / navigation.width);
  const blockedY = Math.floor(48 * height / navigation.height);
  rgba[(blockedY * width + blockedX) * 4 + 3] = 0;
  navigation.setAlphaMask(rgba, width, height, 150);
  assert.equal(navigation.isInsideIsland(48, 48), false);
});
