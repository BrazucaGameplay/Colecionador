import test from 'node:test';
import assert from 'node:assert/strict';
import {createTreeTextureLayout,nextPowerOfTwo} from '../src/rendering/world/TreeTexturePipeline.js';

test('suporte das árvores usa dimensões POT e frames dentro dos limites',()=>{
 assert.equal(nextPowerOfTwo(256),256);assert.equal(nextPowerOfTwo(384),512);assert.equal(nextPowerOfTwo(640),1024);assert.throws(()=>nextPowerOfTwo(0),/Dimensão/);
 for(const [w,h] of [[256,256],[384,384],[640,640],[512,256]]){
  const p=createTreeTextureLayout(w,h);assert.equal(p.canvasWidth&(p.canvasWidth-1),0);assert.equal(p.canvasHeight&(p.canvasHeight-1),0);
  assert.ok(p.x>=0&&p.y>=0&&p.frameWidth>0&&p.frameHeight>0);assert.ok(p.x+p.frameWidth<=p.canvasWidth&&p.y+p.frameHeight<=p.canvasHeight);
 }
});
test('frame mantém proporção e reserva margem de proteção',()=>{
 const p=createTreeTextureLayout(256,256);assert.deepEqual([p.canvasWidth,p.canvasHeight,p.frameWidth,p.frameHeight],[256,256,252,252]);
 const q=createTreeTextureLayout(384,256);assert.deepEqual([q.canvasWidth,q.canvasHeight],[512,256]);assert.ok(Math.abs(q.frameWidth/q.frameHeight-1.5)<0.01);
});
