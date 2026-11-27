/** Estado de prioridade das quatro animacoes do protagonista. */
export const ACTION_PRIORITY = Object.freeze({
  idle: 0,
  running: 0,
  combat: 70,
  dying: 100
});

export default class CharacterActionState {
  constructor() {
    this.current = null;
    this.nextToken = 1;
  }

  canStart(actionId, options = {}) {
    const priority = Number.isFinite(options.priority)
      ? options.priority
      : (ACTION_PRIORITY[actionId] ?? ACTION_PRIORITY.idle);
    if (!this.current) return true;
    if (options.restartExisting === true && this.current.interruptible &&
        priority >= this.current.priority) return true;
    if (this.current.id === actionId) return false;
    if (actionId === 'dying') return true;
    return this.current.interruptible && priority > this.current.priority;
  }

  start(actionId, options = {}) {
    const priority = Number.isFinite(options.priority)
      ? options.priority
      : (ACTION_PRIORITY[actionId] ?? ACTION_PRIORITY.idle);
    if (!this.canStart(actionId, { ...options, priority })) {
      return { accepted: false, reason: this.current?.id === actionId ? 'already-active' : 'lower-priority' };
    }
    const action = {
      id: actionId,
      priority,
      interruptible: options.interruptible !== false,
      lockMovement: options.lockMovement === true,
      holdOnComplete: options.holdOnComplete === true,
      loop: options.loop === true,
      token: this.nextToken++,
      completed: false
    };
    this.current = action;
    return { accepted: true, action };
  }

  complete(token) {
    if (!this.current || this.current.token !== token || this.current.loop) {
      return { matched: false, held: false };
    }
    if (this.current.holdOnComplete) {
      this.current.completed = true;
      return { matched: true, held: true };
    }
    this.current = null;
    return { matched: true, held: false };
  }

  cancel({ force = false } = {}) {
    if (!this.current || (!force && !this.current.interruptible)) return false;
    this.current = null;
    return true;
  }

  get blocksMovement() { return Boolean(this.current?.lockMovement); }
  get activeAction() { return this.current?.id ?? null; }
}
