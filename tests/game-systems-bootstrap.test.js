import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const game = read('../src/scenes/Game.js');
const bootstrap = read('../src/systems/GameSystemsBootstrap.js');

test('Game delega a inicialização dos sistemas de gameplay ao GameSystemsBootstrap', () => {
  assert.match(game, /new GameSystemsBootstrap\(this\)/);
  assert.match(game, /gameSystemsBootstrap\.initialize\(\{/);
  assert.match(game, /showLevelUpNotice: level => this\.showLevelUpNotice\(level\)/);
  for (const type of ['MovementSystem', 'CombatSystem', 'ProgressionSystem', 'MonsterCombatSystem', 'PerformanceMonitor', 'TouchInputController']) {
    assert.doesNotMatch(game, new RegExp('new ' + type + '\\('));
    assert.ok(bootstrap.includes('new ' + type + '('), type + ' deve ser criado pelo bootstrap');
  }
});

test('Game mantém o ciclo de atualização e o tap-to-move após a extração', () => {
  for (const expression of [
    /this\.combat\?\.update\(this\.time\.now\)/,
    /this\.movement\?\.update\(delta\)/,
    /this\.monsterCombat\?\.update\(this\.time\.now\)/,
    /this\.performanceMonitor\?\.update/
  ]) assert.match(game, expression);
  assert.match(bootstrap, /new TouchInputController\(scene/);
  assert.match(bootstrap, /onTap: \(screenX, screenY\)/);
  assert.match(bootstrap, /scene\.movement\.setDestination\(target\.x, target\.y\)/);
  assert.match(bootstrap, /cameraController\.followPlayer\(\{ smoothReturn: true \}\)/);
});

test('GameSystemsBootstrap libera os recursos que inicializa', () => {
  for (const expression of [
    /performanceMonitor\?\.destroy\(\)/,
    /touchInput\?\.destroy\(\)/,
    /combat\?\.destroy\(\)/,
    /monsterCombat\?\.destroy\(\)/,
    /movement\?\.destroy\(\)/,
    /destinationMarker\?\.destroy\(\)/
  ]) assert.match(bootstrap, expression);
  assert.match(game, /gameSystemsBootstrap\?\.destroy\(\)/);
});

test('GameSystemsBootstrap valida dependências e evita inicialização duplicada', () => {
  assert.match(bootstrap, /if \(!scene \|\| this\.initialized\)/);
  assert.match(bootstrap, /if \(!player \|\| !characterRenderer \|\| !camera \|\| !cameraController \|\| !monsterManager\)/);
});
