import { SAVE_KEY } from '../config.js';

const DEFAULT_SAVE = Object.freeze({
  score: 0,
  at: null
});

export default class SaveManager {
  constructor({ storage = globalThis.localStorage, key = SAVE_KEY } = {}) {
    this.storage = storage;
    this.key = key;
  }

  load() {
    if (!this.storage) return { ...DEFAULT_SAVE };

    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return { ...DEFAULT_SAVE };

      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { ...DEFAULT_SAVE };
      }

      return {
        score: Number.isSafeInteger(data.score) && data.score >= 0
          ? data.score
          : DEFAULT_SAVE.score,
        at: Number.isFinite(data.at) ? data.at : null
      };
    } catch (error) {
      console.warn('[SaveManager] Não foi possível carregar o salvamento.', error);
      return { ...DEFAULT_SAVE };
    }
  }

  save(data) {
    if (!this.storage) return false;

    const score = Number.isSafeInteger(data?.score) && data.score >= 0
      ? data.score
      : DEFAULT_SAVE.score;

    const payload = { score, at: Date.now() };

    try {
      this.storage.setItem(this.key, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.warn('[SaveManager] Não foi possível gravar o salvamento.', error);
      return false;
    }
  }
}
