export default class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, listener) {
    if (typeof eventName !== 'string' || !eventName.trim()) {
      throw new TypeError('Event name must be a non-empty string.');
    }
    if (typeof listener !== 'function') {
      throw new TypeError('Event listener must be a function.');
    }
    const listeners = this.listeners.get(eventName) ?? new Set();
    listeners.add(listener);
    this.listeners.set(eventName, listeners);
    return () => this.off(eventName, listener);
  }

  once(eventName, listener) {
    const unsubscribe = this.on(eventName, (...args) => {
      unsubscribe();
      listener(...args);
    });
    return unsubscribe;
  }

  off(eventName, listener) {
    const listeners = this.listeners.get(eventName);
    if (!listeners) return false;
    const removed = listeners.delete(listener);
    if (listeners.size === 0) this.listeners.delete(eventName);
    return removed;
  }

  emit(eventName, ...args) {
    const listeners = this.listeners.get(eventName);
    if (!listeners) return 0;
    const snapshot = [...listeners];
    for (const listener of snapshot) listener(...args);
    return snapshot.length;
  }

  clear(eventName) {
    if (eventName === undefined) {
      this.listeners.clear();
      return;
    }
    this.listeners.delete(eventName);
  }
}
