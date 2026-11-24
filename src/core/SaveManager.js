import { SAVE_KEY } from '../config.js';

export const SAVE_VERSION = 2;

const DEFAULT_SAVE = Object.freeze({
  score: 0,
  at: null
});

function resolveStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeSave(data) {
  if (!isRecord(data)) return null;

  try {
    const serialized = JSON.stringify(data);
    if (typeof serialized !== 'string') return null;
    const snapshot = JSON.parse(serialized);
    if (!isRecord(snapshot)) return null;

    // Preserve domain sections (player, inventory, waifus, world, settings, etc.)
    // while keeping the original score/timestamp contract compatible.
    snapshot.score = Number.isSafeInteger(snapshot.score) && snapshot.score >= 0
      ? snapshot.score
      : DEFAULT_SAVE.score;
    snapshot.at = Number.isFinite(snapshot.at) ? snapshot.at : null;
    return snapshot;
  } catch {
    return null;
  }
}

export default class SaveManager {
  constructor({ storage, key = SAVE_KEY, version = SAVE_VERSION } = {}) {
    if (!Number.isSafeInteger(version) || version < 1) {
      throw new TypeError('Save version must be a positive integer.');
    }
    this.storage = resolveStorage(storage);
    this.key = key;
    this.version = version;
  }

  load() {
    if (!this.storage) return { ...DEFAULT_SAVE };

    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return { ...DEFAULT_SAVE };

      const parsed = JSON.parse(raw);
      if (!isRecord(parsed)) return { ...DEFAULT_SAVE };

      if (parsed.version === this.version && isRecord(parsed.data)) {
        const loaded = sanitizeSave({
          ...parsed.data,
          at: parsed.savedAt
        });
        return loaded ?? { ...DEFAULT_SAVE };
      }

      // Legacy format: { score, at }. Preserve its data while upgrading storage.
      if (parsed.version === undefined && ('score' in parsed || 'at' in parsed)) {
        const migrated = sanitizeSave(parsed);
        if (!migrated) return { ...DEFAULT_SAVE };
        this.writeEnvelope(migrated, migrated.at);
        return migrated;
      }

      // Never overwrite a save created by a newer version of the game.
      return { ...DEFAULT_SAVE };
    } catch (error) {
      console.warn('[SaveManager] Não foi possível carregar o salvamento.', error);
      return { ...DEFAULT_SAVE };
    }
  }

  save(data) {
    const snapshot = sanitizeSave(data);
    if (!snapshot) return false;
    return this.writeEnvelope(snapshot, snapshot.at);
  }

  writeEnvelope(data, savedAt = Date.now()) {
    if (!this.storage || !isRecord(data)) return false;

    const snapshot = sanitizeSave(data);
    if (!snapshot) return false;

    const { at, ...persistedData } = snapshot;
    const payload = {
      version: this.version,
      savedAt: Number.isFinite(savedAt) ? savedAt : (at ?? Date.now()),
      data: persistedData
    };

    try {
      this.storage.setItem(this.key, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.warn('[SaveManager] Não foi possível gravar o salvamento.', error);
      return false;
    }
  }
}
