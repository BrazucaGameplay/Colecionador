/**
 * Pure action-priority state for the protagonist.
 * Rendering consumes this state; movement and combat remain independent.
 */
export const ACTION_PRIORITY = Object.freeze({
  locomotion: 0,
  special: 30,
  jump: 40,
  dodge: 60,
  combat: 70,
  hitstun: 80,
  death: 100
});

export default class CharacterActionState {
  constructor() {
    this.current = null;
    this.nextToken = 1;
  }

  canStart(actionId, options = {}) {
    const priority = Number.isFinite(options.priority)
      ? options.priority
      : (ACTION_PRIORITY[actionId] ?? ACTION_PRIORITY.special);
    if (!this.current) return true;
    if (this.current.id === actionId) return false;
    return this.current.interruptible && priority > this.current.priority;
  }

  start(actionId, options = {}) {
    const priority = Number.isFinite(options.priority)
      ? options.priority
      : (ACTION_PRIORITY[actionId] ?? ACTION_PRIORITY.special);
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

  get blocksMovement() {
    return Boolean(this.current?.lockMovement);
  }

  get activeAction() {
    return this.current?.id ?? null;
  }
}
