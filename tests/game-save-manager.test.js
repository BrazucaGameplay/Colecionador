import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const game=readFileSync(new URL('../src/scenes/Game.js',import.meta.url),'utf8');
test('Game delega persistência ao SaveManager',()=>{
 assert.match(game,/new SaveManager\(\{ key: SAVE_KEY \}\)/);
 assert.match(game,/this\.savedProgress = this\.saveManager\.load\(\)/);
 assert.match(game,/this\.saveManager\.save\(\{ score: this\.score, player: this\.player\.toSaveData\(\) \}\)/);
 assert.doesNotMatch(game,/readSavedProgress|persistProgress|localStorage/);
});
