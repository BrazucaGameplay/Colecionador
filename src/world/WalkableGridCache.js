const DB_NAME = 'colecionador-world-cache';
const STORE_NAME = 'walkable-grids';
const DB_VERSION = 1;
export const WALKABLE_GRID_ALGORITHM_VERSION = 1;

function openDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    let request;
    try { request = indexedDB.open(DB_NAME, DB_VERSION); }
    catch { resolve(null); return; }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

export async function readWalkableGrid(id, expectedLength) {
  const db = await openDatabase();
  if (!db) return null;
  try {
    const record = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    if (!record || record.algorithmVersion !== WALKABLE_GRID_ALGORITHM_VERSION) return null;
    const bytes = record.grid instanceof Uint8Array
      ? new Uint8Array(record.grid)
      : record.grid instanceof ArrayBuffer ? new Uint8Array(record.grid) : null;
    if (!bytes || bytes.length !== expectedLength) return null;
    for (let i = 0; i < bytes.length; i++) if (bytes[i] > 1) return null;
    return bytes;
  } catch (error) {
    console.warn('Cache de navegação indisponível; reconstruindo a grade.', error);
    return null;
  } finally { db.close(); }
}

export async function writeWalkableGrid(id, grid) {
  const db = await openDatabase();
  if (!db) return false;
  try {
    const copy = new Uint8Array(grid).buffer;
    await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put({
        id, algorithmVersion: WALKABLE_GRID_ALGORITHM_VERSION, grid: copy, savedAt: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    return true;
  } catch (error) {
    console.warn('Não foi possível persistir a grade caminhável.', error);
    return false;
  } finally { db.close(); }
}

export async function getTerrainContentHash(url) {
  if (!globalThis.crypto?.subtle || typeof fetch !== 'function') return null;
  try {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) return null;
    const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Não foi possível validar o hash do terreno; cache ignorado.', error);
    return null;
  }
}
