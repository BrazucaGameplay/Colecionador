/** Gerencia até três instâncias de cartas pertencentes à coleção salva. */
export default class WaifuEquipmentManager {
  constructor({ collection = [], equippedIds = [], onChange = () => {} } = {}) {
    this.collection = collection;
    this.equippedIds = Array.isArray(equippedIds) ? equippedIds.slice(0, 3) : [];
    this.onChange = onChange;
    this.reconcile();
  }
  setCollection(collection) { this.collection = Array.isArray(collection) ? collection : []; this.reconcile(); }
  reconcile() {
    const owned = new Set(this.collection.map(card => card.instanceId).filter(Boolean));
    const seen = new Set();
    this.equippedIds = this.equippedIds.slice(0, 3).map(id => {
      if (!id || !owned.has(id) || seen.has(id)) return null;
      seen.add(id);
      return id;
    });
    while (this.equippedIds.length && !this.equippedIds[this.equippedIds.length - 1]) this.equippedIds.pop();
  }
  getCollection() { return this.collection.slice(); }
  getEquipped() { return this.getEquippedSlots().filter(Boolean); }
  getEquippedSlots() { return this.equippedIds.map(id => id ? this.collection.find(card => card.instanceId === id) || null : null); }
  equip(instanceId, slot = null) {
    if (!this.collection.some(card => card.instanceId === instanceId)) return { changed: false, reason: 'not-owned' };
    if (this.equippedIds.includes(instanceId)) return { changed: false, reason: 'already-equipped' };
    if (slot !== null && (!Number.isInteger(slot) || slot < 0 || slot > 2)) return { changed: false, reason: 'invalid-slot' };
    if (slot === null) {
      slot = this.equippedIds.findIndex(id => !id);
      if (slot < 0) slot = this.equippedIds.length < 3 ? this.equippedIds.length : -1;
    }
    if (slot < 0) return { changed: false, reason: 'slots-full' };
    while (this.equippedIds.length <= slot) this.equippedIds.push(null);
    this.equippedIds[slot] = instanceId;
    this.onChange(this.toSaveData());
    return { changed: true, equipped: this.getEquipped() };
  }
  unequip(slot) {
    if (!Number.isInteger(slot) || slot < 0 || slot > 2 || !this.equippedIds[slot]) return { changed: false };
    this.equippedIds[slot] = null;
    while (this.equippedIds.length && !this.equippedIds[this.equippedIds.length - 1]) this.equippedIds.pop();
    this.onChange(this.toSaveData());
    return { changed: true, equipped: this.getEquipped() };
  }
  toSaveData() { return this.equippedIds.slice(); }
  destroy() { this.collection = []; this.equippedIds = []; this.onChange = null; }
}
