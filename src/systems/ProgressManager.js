const INVALID_JSON = Symbol('invalid-json');

function cloneJson(value) {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return INVALID_JSON;
    return JSON.parse(serialized);
  } catch {
    return INVALID_JSON;
  }
}

function isValidSectionName(name) {
  return typeof name === 'string'
    && /^[a-z][a-zA-Z0-9_-]*$/.test(name)
    && name !== 'score'
    && name !== 'at';
}

export default class ProgressManager {
  constructor({ eventBus, saveManager }) {
    if (!eventBus || typeof eventBus.emit !== 'function'
      || !saveManager || typeof saveManager.load !== 'function'
      || typeof saveManager.save !== 'function') {
      throw new TypeError('EventBus and SaveManager are required.');
    }

    this.eventBus = eventBus;
    this.saveManager = saveManager;
    this.sections = new Map();
    this.values = new Map();
    this.extraData = new Map();
    this.score = 0;
  }

  registerSection(name, initialValue, validator = null) {
    if (!isValidSectionName(name)) {
      throw new TypeError('Progress section name is invalid or reserved.');
    }
    if (this.sections.has(name)) {
      throw new Error('Progress section is already registered: ' + name);
    }
    if (validator !== null && typeof validator !== 'function') {
      throw new TypeError('Section validator must be a function.');
    }

    const snapshot = cloneJson(initialValue);
    if (snapshot === INVALID_JSON || (validator && !validator(snapshot))) {
      throw new TypeError('Initial progress section data is invalid.');
    }

    this.sections.set(name, { initialValue: snapshot, validator });
    const hasSavedValue = this.extraData.has(name);
    const savedValue = this.extraData.get(name);
    const restored = hasSavedValue && (!validator || validator(savedValue))
      ? cloneJson(savedValue)
      : snapshot;
    this.values.set(name, restored);
    this.extraData.delete(name);
  }

  load() {
    const saved = this.saveManager.load();
    this.score = Number.isSafeInteger(saved.score) && saved.score >= 0
      ? saved.score
      : 0;

    this.extraData.clear();
    for (const [name, definition] of this.sections) {
      const candidate = cloneJson(saved[name]);
      const valid = candidate !== INVALID_JSON
        && (!definition.validator || definition.validator(candidate));
      this.values.set(
        name,
        valid ? candidate : cloneJson(definition.initialValue)
      );
    }

    for (const [name, value] of Object.entries(saved)) {
      if (name === 'score' || name === 'at' || this.sections.has(name)) continue;
      const extra = cloneJson(value);
      if (extra !== INVALID_JSON) this.extraData.set(name, extra);
    }

    const snapshot = this.getSnapshot();
    this.eventBus.emit('progress:loaded', snapshot);
    return snapshot;
  }

  getSection(name) {
    if (!this.sections.has(name)) return null;
    return cloneJson(this.values.get(name));
  }

  setSection(name, value) {
    const definition = this.sections.get(name);
    if (!definition) return false;

    const snapshot = cloneJson(value);
    if (snapshot === INVALID_JSON || (definition.validator && !definition.validator(snapshot))) {
      return false;
    }

    this.values.set(name, snapshot);
    this.eventBus.emit('progress:changed', {
      section: name,
      data: cloneJson(snapshot)
    });
    return true;
  }

  setScore(score) {
    if (!Number.isSafeInteger(score) || score < 0) return false;
    this.score = score;
    this.eventBus.emit('progress:changed', {
      section: 'score',
      data: score
    });
    return true;
  }

  getSnapshot() {
    const snapshot = { score: this.score };
    for (const [name, value] of this.extraData) {
      snapshot[name] = cloneJson(value);
    }
    for (const [name, value] of this.values) {
      snapshot[name] = cloneJson(value);
    }
    return snapshot;
  }

  save() {
    return this.saveManager.save(this.getSnapshot());
  }
}
