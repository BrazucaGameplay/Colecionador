import test from 'node:test';
import assert from 'node:assert/strict';
import { GAME_CONFIG, VIEWPORT_CONFIG } from '../src/config/GameConfig.js';
import { WORLD_CONFIG } from '../src/config/WorldConfig.js';
import { CAMERA_CONFIG } from '../src/config/CameraConfig.js';
import { PLAYER_CONFIG } from '../src/config/PlayerConfig.js';
import { INPUT_CONFIG } from '../src/config/InputConfig.js';
import { RENDER_CONFIG } from '../src/config/RenderConfig.js';
import { COMBAT_CONFIG } from '../src/config/CombatConfig.js';
import { MONSTER_CONFIG } from '../src/config/MonsterConfig.js';

test('game configuration targets web, PWA and Android from one codebase', () => {
  assert.deepEqual(GAME_CONFIG.platforms, ['web', 'pwa', 'android']);
});

test('prototype viewport remains explicitly provisional', () => {
  assert.equal(VIEWPORT_CONFIG.width, 960);
  assert.equal(VIEWPORT_CONFIG.height, 540);
  assert.equal(VIEWPORT_CONFIG.status, 'provisional');
});

test('world projection is isometric without prematurely fixing world dimensions', () => {
  assert.equal(WORLD_CONFIG.projection, 'isometric');
  assert.equal(WORLD_CONFIG.dimensions.widthTiles, null);
  assert.equal(WORLD_CONFIG.dimensions.heightTiles, null);
  assert.equal(WORLD_CONFIG.chunks.requiredForInitialWorld, false);
});

test('hybrid camera allows four quarter-turn orientations', () => {
  assert.equal(CAMERA_CONFIG.mode, 'hybrid');
  assert.deepEqual(CAMERA_CONFIG.allowedRotationDegrees, [0, 90, 180, 270]);
});

test('visual direction explicitly excludes pixel art', () => {
  assert.equal(RENDER_CONFIG.pixelArt, false);
  assert.equal(RENDER_CONFIG.artDirection, 'anime-semi-realistic');
});

test('provisional movement speed is centralized and camera-relative input is enabled', () => {
  assert.equal(PLAYER_CONFIG.movement.speed, 220);
  assert.equal(PLAYER_CONFIG.movement.status, 'provisional');
  assert.equal(INPUT_CONFIG.cameraRelativeMovement, true);
});

test('combat and monster values remain explicitly provisional until gameplay rules are supplied', () => {
  assert.equal(COMBAT_CONFIG.prototype.status, 'prototype-only');
  assert.equal(MONSTER_CONFIG.prototype.status, 'prototype-only');
  assert.equal(MONSTER_CONFIG.prototype.maxHealth, 2);
});
