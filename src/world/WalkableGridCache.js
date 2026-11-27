const DB_NAME = 'colecionador-world-cache';
const STORE_NAME = 'walkable-grids';
const DB_VERSION = 1;
export const WALKABLE_GRID_ALGORITHM_VERSION = 1;
const TERRAIN_HASH_TIMEOUT_MS = 15000;

function openDatabase() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise(resolve => {
    let settled = false;
    const finish = value => {
      if (settled) {
        value?.close?.();
        return;
      }
      settled = true;
      resolve(value);
    };
    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      finish(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      finish(db);
    };
    request.onerror = () => finish(null);
    // Uma conexão antiga pode bloquear a abertura. Se a resposta chegar
    // depois de seguirmos sem cache, finish() fecha a conexão tardia.
    request.onblocked = () => finish(null);
  });
}

function runTransaction(db, mode, operation) {
  return new Promise((resolve, reject) => {
    let result;
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      if (error) reject(error);
      else resolve(value);
    };
    try {
      const transaction = db.transaction(STORE_NAME, mode);
      transaction.oncomplete = () => finish(null, result);
      transaction.onerror = () => finish(transaction.error || new Error('Falha na transação do cache de navegação.'));
      transaction.onabort = () => finish(transaction.error || new Error('Transação do cache de navegação abortada.'));
      const request = operation(transaction);
      if (request && typeof request === 'object' && 'onsuccess' in request) {
        request.onsuccess = () => { result = request.result; };
      } else {
        result = request;
      }
    } catch (error) {
      finish(error);
    }
  });
}

export async function readWalkableGrid(id, expectedLength) {
  const db = await openDatabase();
  if (!db) return null;
  try {
    const record = await runTransaction(db, 'readonly', transaction =>
      transaction.objectStore(STORE_NAME).get(id)
    );
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
  } finally {
    db.close();
  }
}

export async function writeWalkableGrid(id, grid) {
  const db = await openDatabase();
  if (!db) return false;
  try {
    const copy = new Uint8Array(grid).buffer;
    await runTransaction(db, 'readwrite', transaction =>
      transaction.objectStore(STORE_NAME).put({
        id, algorithmVersion: WALKABLE_GRID_ALGORITHM_VERSION, grid: copy, savedAt: Date.now()
      })
    );
    return true;
  } catch (error) {
    console.warn('Não foi possível persistir a grade caminhável.', error);
    return false;
  } finally {
    db.close();
  }
}

export async function getTerrainContentHash(url) {
  if (!globalThis.crypto?.subtle || typeof fetch !== 'function') return null;
  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timeout = controller
    ? setTimeout(() => controller.abort(new Error('Tempo limite ao validar o conteúdo do terreno.')), TERRAIN_HASH_TIMEOUT_MS)
    : null;
  try {
    const response = await fetch(url, {
      cache: 'force-cache',
      ...(controller ? { signal: controller.signal } : {})
    });
    if (!response.ok) return null;
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.warn('Não foi possível validar o hash do terreno; cache ignorado.', error);
    return null;
  } finally {
    if (timeout !== null) clearTimeout(timeout);
  }
}
