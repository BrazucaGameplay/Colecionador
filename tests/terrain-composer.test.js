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
test('shader compoe a textura costeira com alpha sobre terreno continuo',()=>{
 const s=buildIslandTerrainShader();
 assert.ok(s.includes('uniform sampler2D uShoreline'));
 assert.ok(s.includes('float boundaryRadius(float a)'));
 assert.ok(s.includes('if(radiusWorld<=coastRadius)'));
 assert.ok(s.includes('vec4 shore=vec4(0.0)'));
 assert.ok(s.includes('landColor=mix(landColor,shore.rgb,shore.a)'));
 assert.ok(s.includes('if(shoreInRange&&shore.a>.003)'));
 assert.ok(s.includes('const float CORE_RADIUS=1660.0'));
 assert.ok(s.includes('float shoreV=.58+(radiusWorld-coastRadius)/360.0'));
 assert.ok(s.includes('float mirroredRepeat1D(float p)'));
 assert.ok(s.includes('float shoreU=mirroredRepeat1D((angle+3.141592654)*5.570423008)'));
 assert.ok(s.includes('equivale a cerca de 36 larguras de 360 unidades'));
 assert.ok(!s.includes('float shoreU=fract(angle*.159154943+.5)'));
 assert.ok(s.includes('oceano no topo e grama na base'));
 assert.ok(!s.includes('float shoreV=.70-(radiusWorld-coastRadius)/360.0'));
 assert.ok(!s.includes('vec3 color=texture2D(uShoreline'));
 const src=readFileSync(new URL('../src/world/IslandTerrainRenderer.js',import.meta.url),'utf8');
 for(const call of ['createGeometryMask(','createCanvas(','createAlphaMask(','add.tileSprite(','setMask('])assert.ok(!src.includes(call));
});
test('Game usa a mascara de ilha compartilhada e oceano abaixo do terreno',()=>{
 const game=readFileSync(new URL('../src/scenes/Game.js',import.meta.url),'utf8');
 assert.match(game,/setIslandMask\(ISLAND_SHAPE\.centerX/);
 assert.match(game,/this\.groundObject = this\.terrain\.object/);
 assert.match(game,/setDepth\(-1200\)/);
});
test('Preload carrega materiais e textura costeira WebP',()=>{
 const preload=readFileSync(new URL('../src/scenes/Preload.js',import.meta.url),'utf8');
 for(const key of ['terrain-smooth','terrain-grass','terrain-relief','island-shoreline.webp'])assert.ok(preload.includes(key));
 const webp=readFileSync(new URL('../public/assets/world/terrain/island-shoreline.webp',import.meta.url));
 assert.equal(webp.toString('ascii',0,4),'RIFF');
 assert.equal(webp.toString('ascii',8,12),'WEBP');
 assert.ok(webp.length>10000,'textura costeira deve conter os dados da imagem atual');
});
test('nucleo permanece circular e o litoral apresenta entradas e saidas',()=>{
 assert.equal(ISLAND_SHAPE.coreRadius,1660);
 const radii=Array.from({length:720},(_,i)=>getIslandBoundaryRadius(i*Math.PI*2/720));
 assert.ok(Math.min(...radii)>1930);
 assert.ok(Math.max(...radii)<=2048);
 assert.ok(Math.max(...radii)-Math.min(...radii)>70);
 assert.ok(isInsideIsland(2048+1500,2048));
 assert.ok(isInsideIsland(2048+1850,2048));
 assert.ok(!isInsideIsland(2048+2050,2048));
 assert.ok(!isInsideIsland(2048+1500,2048+1500));
});
