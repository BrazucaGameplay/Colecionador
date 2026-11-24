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
  return {
    score: Number.isSafeInteger(data?.score) && data.score >= 0
      ? data.score
      : DEFAULT_SAVE.score,
    at: Number.isFinite(data?.at) ? data.at : null
  };
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
        return sanitizeSave({
          ...parsed.data,
          at: parsed.savedAt
        });
      }

      // Legacy format: { score, at }. Preserve its data while upgrading storage.
      if (parsed.version === undefined && ('score' in parsed || 'at' in parsed)) {
        const migrated = sanitizeSave(parsed);
        this.writeEnvelope(migrated, migrated.at);
        return migrated;
      }

      return { ...DEFAULT_SAVE };
    } catch (error) {
      console.warn('[SaveManager] Não foi possível carregar o salvamento.', error);
      return { ...DEFAULT_SAVE };
    }
  }

  save(data) {
    return this.writeEnvelope(sanitizeSave(data));
  }

  writeEnvelope(data, savedAt = Date.now()) {
    if (!this.storage) return false;

    const payload = {
      version: this.version,
      savedAt: Number.isFinite(savedAt) ? savedAt : Date.now(),
      data: {
        score: data.score
      }
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
