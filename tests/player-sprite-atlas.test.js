import test from 'node:test';
import assert from 'node:assert/strict';
import {getDirectionalAtlasLayouts} from '../src/rendering/characters/DirectionalAtlasLayout.js';
function makeRecords(directions,count){const out=[];for(let d=0;d<directions;d++)for(let f=0;f<count;f++)out.push({direction:d,frame:f,x:f*128,y:d*128,width:128,height:128,pivotY:.9375});return out;}
test('gera páginas direcionais independentes abaixo de 2048px',()=>{const pages=getDirectionalAtlasLayouts(makeRecords(8,48),{width:128,height:128});assert.equal(pages.length,8);assert.ok(pages.every(p=>p.width<=2048&&p.height<=2048&&p.frames.length===48));});
test('compacta 36 quadros em páginas 768x768',()=>{const pages=getDirectionalAtlasLayouts(makeRecords(8,36),{width:128,height:128});assert.ok(pages.every(p=>p.width===768&&p.height===768));});
test('ordena quadros por índice',()=>{const pages=getDirectionalAtlasLayouts(makeRecords(1,8).reverse(),{width:128,height:128});assert.deepEqual(pages[0].frames.map(f=>f.frame),[0,1,2,3,4,5,6,7]);});
test('rejeita quadro incompatível com o frameSize',()=>{const frames=makeRecords(1,2);frames[0].width=64;assert.throws(()=>getDirectionalAtlasLayouts(frames,{width:128,height:128}),/Quadro direcional inválido/);});
test('rejeita página maior que o limite informado',()=>{assert.throws(()=>getDirectionalAtlasLayouts(makeRecords(1,300),{width:128,height:128},1024),/excede 1024px/);});
