import './loading-screen.css';
import { LOADING_IMAGES } from './loading-images.js';

const BASE_URL = import.meta.env.BASE_URL;

export default class LoadingScreen {
  constructor(root = document.getElementById('loading-screen')) {
    this.root = root;
    this.art = root?.querySelector('.loading-art');
    this.backdrop = root?.querySelector('.loading-backdrop');
    this.fill = root?.querySelector('.loading-fill');
    this.percent = root?.querySelector('.loading-percent');
    this.message = root?.querySelector('.loading-message');
    this.hint = root?.querySelector('.loading-hint');
    this.images = [...LOADING_IMAGES];
    this.imageIndex = -1;
    this.rotationTimer = null;
    this.onProgress = event => this.setProgress(event.detail?.progress ?? 0, event.detail?.message);
    this.onReady = () => this.hide();
    window.addEventListener('colecionador:loading-progress', this.onProgress);
    window.addEventListener('colecionador:game-ready', this.onReady, { once: true });
    this.showNextImage();
    if (this.images.length > 1) {
      this.rotationTimer = window.setInterval(() => this.showNextImage(), 7000);
    }
  }

  showNextImage() {
    if (!this.images.length || !this.art) return;
    this.imageIndex = (this.imageIndex + 1) % this.images.length;
    const src = BASE_URL + this.images[this.imageIndex].replace(/^\//, '');
    const probe = new Image();
    probe.onload = () => {
      if (!this.root || this.root.classList.contains('is-hidden')) return;
      this.art.src = src;
      this.backdrop.style.backgroundImage = `url("${src}")`;
      this.art.classList.add('is-visible');
    };
    probe.onerror = () => {
      this.images.splice(this.imageIndex, 1);
      this.imageIndex--;
      if (!this.images.length) this.showFallback();
    };
    probe.src = src;
  }

  showFallback() {
    this.art?.classList.remove('is-visible');
    this.hint && (this.hint.textContent = 'Preparando o mundo para sua aventura');
  }

  setProgress(progress, message) {
    const value = Math.max(0, Math.min(100, Math.round(progress * 100)));
    if (this.fill) this.fill.style.width = value + '%';
    if (this.percent) this.percent.textContent = value + '%';
    if (this.message && message) this.message.textContent = message;
    if (this.hint && !message) this.hint.textContent = value < 100 ? 'Carregando recursos do mundo' : 'Finalizando...';
  }

  hide() {
    if (!this.root) return;
    this.setProgress(1, 'Aventura pronta');
    this.root.classList.add('is-hidden');
    if (this.rotationTimer) window.clearInterval(this.rotationTimer);
    window.removeEventListener('colecionador:loading-progress', this.onProgress);
  }
}
