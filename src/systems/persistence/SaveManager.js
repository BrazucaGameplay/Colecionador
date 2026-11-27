export default class SaveManager {
  constructor({ key, storage = null, now = () => Date.now(), logger = console } = {}) {
    if (typeof key !== 'string' || !key.trim()) throw new TypeError('SaveManager precisa de uma chave de persistência.');
    this.key = key;
    this.storage = storage;
    this.now = now;
    this.logger = logger;
    this.data = {};
  }

  getStorage() {
    return this.storage ?? globalThis.localStorage;
  }

  load() {
    try {
      const raw = this.getStorage().getItem(this.key) || '{}';
      const saved = JSON.parse(raw);
      this.data = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
    } catch (error) {
      this.logger?.warn?.('Save inválido; usando progresso inicial.', error);
      this.data = {};
    }
    return { ...this.data };
  }

  save(patch = {}) {
    const safePatch = patch && typeof patch === 'object' && !Array.isArray(patch) ? patch : {};
    this.data = { ...this.data, ...safePatch, at: this.now() };
    try {
      this.getStorage().setItem(this.key, JSON.stringify(this.data));
      return true;
    } catch (error) {
      this.logger?.warn?.('Não foi possível salvar o progresso neste dispositivo.', error);
      return false;
    }
  }
}
