export class FakeElement {
  constructor(tagName = 'div', className = '', textContent = '') {
    this.tagName = tagName.toUpperCase();
    this.className = className;
    this.textContent = textContent;
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.listeners = new Map();
    this.style = {};
    this.hidden = false;
    this.disabled = false;
    this.complete = false;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this.clientWidth = 240;
    this.clientHeight = 320;
    this.draggable = true;
    this._src = '';
  }

  get isConnected() { return Boolean(this.parentNode); }
  get src() { return this._src; }
  set src(value) {
    const base = globalThis.document?.baseURI || 'https://example.test/';
    this._src = value ? new URL(String(value), base).href : '';
  }

  append(...nodes) { for (const node of nodes) this.appendChild(node); }
  appendChild(node) {
    if (node.parentNode) node.remove();
    node.parentNode = this;
    this.children.push(node);
    return node;
  }
  replaceChildren(...nodes) {
    for (const child of this.children) child.parentNode = null;
    this.children = [];
    this.append(...nodes);
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  addEventListener(type, callback) {
    const list = this.listeners.get(type) || [];
    list.push(callback);
    this.listeners.set(type, list);
  }
  removeEventListener(type, callback) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter(item => item !== callback));
  }
  dispatch(type, init = {}) {
    const event = {
      target: this,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.propagationStopped = true; },
      ...init
    };
    for (const callback of [...(this.listeners.get(type) || [])]) callback(event);
    return event;
  }
  click() { return this.dispatch('click'); }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter(child => child !== this);
    this.parentNode = null;
  }
  querySelector(selector) {
    const matches = node => selector.startsWith('.')
      ? node.className.split(/\s+/).includes(selector.slice(1))
      : node.tagName.toLowerCase() === selector.toLowerCase();
    for (const child of this.children) {
      if (matches(child)) return child;
      const nested = child.querySelector(selector);
      if (nested) return nested;
    }
    return null;
  }
  getBoundingClientRect() {
    return { width: this.clientWidth, height: this.clientHeight, left: 0, top: 0, right: this.clientWidth, bottom: this.clientHeight };
  }
}

export function installFakeDom() {
  const previousDocument = globalThis.document;
  const previousResizeObserver = globalThis.ResizeObserver;
  const root = new FakeElement('main');
  const document = {
    baseURI: 'https://example.test/',
    createElement(tag) {
      const node = new FakeElement(tag);
      if (tag === 'canvas') {
        node.getContext = () => ({
          drawImage() {},
          getImageData(_x, _y, width, height) {
            const data = new Uint8ClampedArray(width * height * 4);
            for (let i = 3; i < data.length; i += 4) data[i] = 255;
            return { data };
          }
        });
      }
      return node;
    },
    getElementById(id) { return id === 'game' ? root : null; }
  };
  class FakeResizeObserver {
    constructor(callback) { this.callback = callback; this.disconnected = false; }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  globalThis.document = document;
  globalThis.ResizeObserver = FakeResizeObserver;
  return {
    document,
    root,
    restore() {
      if (previousDocument === undefined) delete globalThis.document;
      else globalThis.document = previousDocument;
      if (previousResizeObserver === undefined) delete globalThis.ResizeObserver;
      else globalThis.ResizeObserver = previousResizeObserver;
    }
  };
}

export function findByClass(root, className) {
  if (root.className.split(/\s+/).includes(className)) return root;
  for (const child of root.children || []) {
    const result = findByClass(child, className);
    if (result) return result;
  }
  return null;
}

export function findAllByClass(root, className, output = []) {
  if (root.className.split(/\s+/).includes(className)) output.push(root);
  for (const child of root.children || []) findAllByClass(child, className, output);
  return output;
}
