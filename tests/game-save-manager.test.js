import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const game=readFileSync(new URL('../src/scenes/Game.js',import.meta.url),'utf8');
test('Game centraliza persistência do progresso e skin no SaveManager',()=>{
 assert.match(game,/new SaveManager\(\{ key: SAVE_KEY \}\)/);
 assert.match(game,/this\.savedProgress = this\.saveManager\.load\(\)/);
 assert.match(game,/persistProgress\(\)[\s\S]*?selectedSkin:\s*this\.skinManager\?\.getSelectedSkin\(\)/);
 assert.match(game,/onChange:[\s\S]*?this\.characterRenderer\?\.setSkin\(selectedSkin\)/);
 assert.doesNotMatch(game,/readSavedProgress|persistProgress\s*=|localStorage/);
});
