import test from 'node:test';
import assert from 'node:assert/strict';
import TouchInputController from '../src/systems/input/TouchInputController.js';

class InputEvents {
  constructor() { this.listeners = new Map(); }
  addPointer() {}
  on(name, callback, context) { this.listeners.set(name, { callback, context }); }
  off(name) { this.listeners.delete(name); }
  emit(name, pointer) {
    const listener = this.listeners.get(name);
    listener?.callback.call(listener.context, pointer);
  }
}

function createController() {
  const input = new InputEvents();
  const scene = { input };
  const camera = {
    zoom: 0.4, scrollX: 0, scrollY: 0, stopped: 0,
    stopFollow() { this.stopped += 1; },
    setZoom(value) { this.zoom = value; },
    getWorldPoint(x, y) {
      return { x: this.scrollX + x / this.zoom, y: this.scrollY + y / this.zoom };
    }
  };
  const taps = [];
  let pans = 0;
  const controller = new TouchInputController(scene, {
    camera,
    getMinZoom: () => 0.2,
    maxZoom: 0.6,
    onTap: (...args) => taps.push(args),
    onPan: () => { pans += 1; }
  });
  return { input, camera, taps, get pans() { return pans; }, controller };
}

test('toque curto emite destino sem interromper o follow da câmera', () => {
  const f = createController();
  f.input.emit('pointerdown', { id: 1, x: 100, y: 100 });
  f.input.emit('pointerup', { id: 1, x: 100, y: 100 });
  assert.deepEqual(f.taps, [[100, 100]]);
  assert.equal(f.pans, 0);
  assert.equal(f.camera.stopped, 0);
  f.controller.destroy();
});

test('arraste interrompe follow e sinaliza retomada uma única vez', () => {
  const f = createController();
  f.input.emit('pointerdown', { id: 1, x: 100, y: 100 });
  f.input.emit('pointermove', { id: 1, x: 120, y: 100 });
  f.input.emit('pointermove', { id: 1, x: 140, y: 110 });
  f.input.emit('pointerup', { id: 1, x: 140, y: 110 });
  assert.equal(f.camera.stopped, 1);
  assert.equal(f.pans, 1);
  assert.deepEqual(f.taps, []);
  f.controller.destroy();
});


test('pinch mantém ancorado o ponto mundial sob o centro dos dedos', () => {
  const f = createController();
  f.camera.scrollX = 200;
  f.camera.scrollY = 100;
  f.input.emit('pointerdown', { id: 1, x: 100, y: 100 });
  f.input.emit('pointerdown', { id: 2, x: 200, y: 100 });
  const before = f.camera.getWorldPoint(200, 100);

  f.input.emit('pointermove', { id: 2, x: 300, y: 100 });
  const after = f.camera.getWorldPoint(200, 100);

  assert.equal(f.camera.zoom, 0.6);
  assert.ok(Math.abs(before.x - after.x) < 1e-9);
  assert.ok(Math.abs(before.y - after.y) < 1e-9);
  assert.equal(f.camera.stopped, 1);
  assert.equal(f.pans, 1);
  f.controller.destroy();
});

test('pinch respeita o zoom mínimo fixo de 0.2x fornecido pela cena', () => {
  const f = createController();
  f.input.emit('pointerdown', { id: 1, x: 100, y: 100 });
  f.input.emit('pointerdown', { id: 2, x: 200, y: 100 });
  f.input.emit('pointermove', { id: 2, x: 120, y: 100 });
  assert.equal(f.camera.zoom, 0.2);
  f.controller.destroy();
});

test('dedo restante após pinch não dispara destino nem inicia pan sem novo arraste', () => {
  const f = createController();
  f.input.emit('pointerdown', { id: 1, x: 100, y: 100 });
  f.input.emit('pointerdown', { id: 2, x: 200, y: 100 });
  f.input.emit('pointerup', { id: 2, x: 200, y: 100 });
  f.input.emit('pointerup', { id: 1, x: 100, y: 100 });
  assert.deepEqual(f.taps, []);
  assert.equal(f.pans, 1);
  f.controller.destroy();
});


test('arraste continua funcionando no zoom mínimo e no zoom máximo', () => {
  for (const zoom of [0.2, 0.6]) {
    const f = createController();
    f.camera.zoom = zoom;
    f.input.emit('pointerdown', { id: 1, x: 200, y: 200 });
    f.input.emit('pointermove', { id: 1, x: 220, y: 210 });
    assert.ok(f.camera.scrollX < 0, `scrollX deve responder no zoom ${zoom}`);
    assert.ok(f.camera.scrollY < 0, `scrollY deve responder no zoom ${zoom}`);
    assert.equal(f.pans, 1);
    f.controller.destroy();
  }
});

test('arraste de um dedo funciona depois de encerrar uma pinça', () => {
  const f = createController();
  f.input.emit('pointerdown', { id: 1, x: 100, y: 100 });
  f.input.emit('pointerdown', { id: 2, x: 200, y: 100 });
  f.input.emit('pointermove', { id: 2, x: 220, y: 100 });
  f.input.emit('pointerup', { id: 2, x: 220, y: 100 });
  const before = { x: f.camera.scrollX, y: f.camera.scrollY };
  f.input.emit('pointermove', { id: 1, x: 120, y: 120 });
  assert.notEqual(f.camera.scrollX, before.x);
  assert.notEqual(f.camera.scrollY, before.y);
  assert.deepEqual(f.taps, []);
  f.controller.destroy();
});


test('zoom máximo permite ampliar até 0.6x e bloqueia além desse limite', () => {
  const f = createController();
  f.input.emit('pointerdown', { id: 1, x: 100, y: 100 });
  f.input.emit('pointerdown', { id: 2, x: 200, y: 100 });
  f.input.emit('pointermove', { id: 2, x: 500, y: 100 });
  assert.equal(f.camera.zoom, 0.6);
  f.controller.destroy();
});
