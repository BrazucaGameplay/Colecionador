import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const manifest = JSON.parse(
  readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8')
);
const serviceWorker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

test('PWA manifest keeps the installable app within its deployed base path', () => {
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'any');
  assert.ok(manifest.icons.some(icon => icon.src === './icons/app-icon.svg'));
});

test('PWA service worker precaches the shell and provides offline navigation fallback', () => {
  assert.match(serviceWorker, /cache\.addAll\(APP_SHELL\)/);
  assert.match(serviceWorker, /request\.mode === 'navigate'/);
  assert.match(serviceWorker, /cache\.match\(request\)/);
});
