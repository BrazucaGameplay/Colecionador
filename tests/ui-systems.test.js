import test from 'node:test';
import assert from 'node:assert/strict';
import CameraControls from '../src/ui/CameraControls.js';
import HUD from '../src/ui/HUD.js';

function createUIObject() {
  return {
    handlers: {},
    setStrokeStyle() { return this; },
    setScrollFactor() { return this; },
    setDepth() { return this; },
    setOrigin() { return this; },
    setInteractive() { return this; },
    on(event, callback) { this.handlers[event] = callback; return this; },
    setText(value) { this.text = value; return this; },
    destroy() { this.destroyed = true; }
  };
}

function createUIScene() {
  const keyboardHandlers = {};
  const removedKeyboardHandlers = {};
  const objects = [];
  return {
    objects,
    keyboardHandlers,
    removedKeyboardHandlers,
    scale: { width: 960, height: 540 },
    add: {
      circle() { const item = createUIObject(); objects.push(item); return item; },
      text(x, y, text) { const item = createUIObject(); item.x=x; item.y=y; item.text=text; objects.push(item); return item; }
    },
    input: {
      keyboard: {
        on(event, callback) { keyboardHandlers[event] = callback; },
        off(event, callback) { removedKeyboardHandlers[event] = callback; }
      }
    }
  };
}

test('CameraControls rotate the camera from buttons and keyboard and clean up listeners', () => {
  const scene = createUIScene();
  const calls = [];
  const camera = { rotateQuarterTurn(direction) { calls.push(direction); } };
  const controls = new CameraControls(scene, camera);

  assert.equal(controls.objects.length, 4);
  controls.objects[1].handlers.pointerdown();
  scene.keyboardHandlers['keydown-E']();
  scene.keyboardHandlers['keydown-Q']();
  assert.deepEqual(calls, [-1, 1, -1]);

  controls.destroy();
  assert.equal(scene.removedKeyboardHandlers['keydown-Q'] !== undefined, true);
  assert.equal(scene.removedKeyboardHandlers['keydown-E'] !== undefined, true);
  assert.ok(controls.objects.length === 0);
});

test('HUD updates score and destroys its display objects', () => {
  const scene = createUIScene();
  const hud = new HUD(scene, { hp: 5, score: 12 });

  assert.equal(hud.hpText.text, 'HP 5');
  assert.equal(hud.scoreText.text, 'Monstros: 12');
  hud.setScore(13);
  assert.equal(hud.scoreText.text, 'Monstros: 13');
  assert.throws(() => hud.setScore(-1), TypeError);

  const [hp, score] = hud.objects;
  hud.destroy();
  assert.equal(hp.destroyed, true);
  assert.equal(score.destroyed, true);
  assert.equal(hud.objects.length, 0);
});
