import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TERRAIN_REGIONS, buildIslandTerrainShader, getTerrainMaterialAt } from '../src/world/IslandTerrainRenderer.js';
import { getIslandBoundaryRadius, isInsideIsland, ISLAND_SHAPE } from '../src/world/IslandShape.js';

test('regioes do terreno sao deterministicas',()=>{
 assert.equal(TERRAIN_REGIONS.length,9);
 assert.ok(TERRAIN_REGIONS.every(r=>['grass','relief'].includes(r.material)));
 const src=readFileSync(new URL('../src/world/IslandTerrainRenderer.js',import.meta.url),'utf8');
 assert.doesNotMatch(src,/Math\.random|randomBetween|RandomDataGenerator/);
});
test('materiais ocupam regioes estaveis no nucleo circular',()=>{
 const counts={smooth:0,grass:0,relief:0},n=300;
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const m=getTerrainMaterialAt((x+.5)/n,(y+.5)/n);if(m!=='ocean')counts[m]++;}
 const land=counts.smooth+counts.grass+counts.relief;
 assert.ok(counts.grass/land>.20&&counts.grass/land<.27);
 assert.ok(counts.relief/land>.09&&counts.relief/land<.14);
 assert.equal(getTerrainMaterialAt(0,0),'ocean');
 assert.equal(getTerrainMaterialAt(.5,.5),'grass');
});
test('shader termina o mapa circular diretamente no oceano sem texturas de margem',()=>{
 const s=buildIslandTerrainShader();
 assert.ok(!s.includes('uShoreline'));
 assert.ok(s.includes('float boundaryRadius(float a){return 1992.0;}'));
 assert.ok(s.includes('if(radiusWorld<=coastRadius)'));
 assert.ok(s.includes('float edgeWidth=max(fwidth(radiusWorld),1.0)'));
 assert.ok(s.includes('gl_FragColor=vec4(landColor,landAlpha)'));
 assert.ok(s.includes('discard;'));
 assert.ok(!s.includes('shorelineAlpha'));
 const src=readFileSync(new URL('../src/world/IslandTerrainRenderer.js',import.meta.url),'utf8');
 for(const call of ['createGeometryMask(','createCanvas(','createAlphaMask(','add.tileSprite(','setMask('])assert.ok(!src.includes(call));
});
test('Game usa a mascara de ilha compartilhada e oceano abaixo do terreno',()=>{
 const game=readFileSync(new URL('../src/scenes/Game.js',import.meta.url),'utf8');
 assert.match(game,/setIslandMask\(ISLAND_SHAPE\.centerX/);
 assert.match(game,/this\.groundObject = this\.terrain\.object/);
 assert.match(game,/setDepth\(-1200\)/);
});
test('Preload carrega materiais sem textura de margem',()=>{
 const preload=readFileSync(new URL('../src/scenes/Preload.js',import.meta.url),'utf8');
 for(const key of ['terrain-smooth','terrain-grass','terrain-relief'])assert.ok(preload.includes(key));
 assert.ok(!preload.includes('island-shoreline'));
});
test('nucleo e contorno externo permanecem circulares',()=>{
 assert.equal(ISLAND_SHAPE.coreRadius,1660);
 const radii=Array.from({length:720},(_,i)=>getIslandBoundaryRadius(i*Math.PI*2/720));
 assert.ok(Math.min(...radii)>1991);
 assert.ok(Math.max(...radii)<=1993);
 assert.ok(Math.max(...radii)-Math.min(...radii)<0.01);
 assert.ok(isInsideIsland(2048+1500,2048));
 assert.ok(isInsideIsland(2048+1850,2048));
 assert.ok(!isInsideIsland(2048+2050,2048));
 assert.ok(!isInsideIsland(2048+1500,2048+1500));
});
