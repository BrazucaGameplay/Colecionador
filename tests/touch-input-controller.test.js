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
    zoom: 1.2, scrollX: 0, scrollY: 0, stopped: 0,
    stopFollow() { this.stopped += 1; },
    setZoom(value) { this.zoom = value; }
  };
  const taps = [];
  let pans = 0;
  const controller = new TouchInputController(scene, {
    camera,
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
