import * as Phaser from 'phaser';

/**
 * Painel de diagnóstico em uma camada própria da HUD.
 * Não recebe transformação da câmera do mundo.
 */
export default class PerformanceMonitor {
  constructor(scene) {
    this.scene = scene;
    this.elapsed = 0;
    this.interval = 500;
    this.layer = scene.add.layer().setDepth(2100);

    const { height } = scene.scale;
    this.panel = scene.add.rectangle(10, height - 10, 210, 112, 0x07111f, 0.94)
      .setOrigin(0, 1)
      .setStrokeStyle(1, 0x94a3b8, 0.9)
      .setScrollFactor(0);
    this.text = scene.add.text(19, height - 103, 'DESEMPENHO\nFPS: --\nCPU jogo: --\nCarga*: --\nMemória JS: --\nAssets: --', {
      fontFamily: 'monospace',
      fontSize: '12px',
      fontStyle: 'bold',
      lineSpacing: 3,
      color: '#f8fafc',
      stroke: '#07111f',
      strokeThickness: 1,
      resolution: 2
    }).setScrollFactor(0).setOrigin(0, 0);

    this.layer.add([this.panel, this.text]);
    scene.scale.on('resize', this.resize, this);
    this.resize({ width: scene.scale.width, height });
  }

  resize(size) {
    if (!this.panel || !this.text) return;
    const height = size?.height || this.scene.scale.height;
    this.panel.setPosition(10, height - 10);
    this.text.setPosition(19, height - 103);
  }

  containsScreenPoint(x, y) {
    const width = this.scene?.scale.width || 0;
    const height = this.scene?.scale.height || 0;
    return x >= 10 && x <= 220 && y >= height - 122 && y <= height - 10;
  }

  update(deltaMs, sceneUpdateMs) {
    this.elapsed += Math.max(0, deltaMs || 0);
    if (this.elapsed < this.interval) return;
    this.elapsed = 0;

    const fps = Number(this.scene.game?.loop?.actualFps) || 0;
    const frameBudget = fps > 0 ? 1000 / fps : 16.67;
    const cpuMs = Math.max(0, sceneUpdateMs || 0);
    const cpuPercent = Phaser.Math.Clamp((cpuMs / frameBudget) * 100, 0, 999);
    const memory = performance.memory;
    const memoryText = memory
      ? `${(memory.usedJSHeapSize / 1048576).toFixed(1)} / ${(memory.jsHeapSizeLimit / 1048576).toFixed(0)} MB`
      : 'não disponível';

    const loadPercent = this.scene.registry.get('assetLoadPercent');
    const loadMs = this.scene.registry.get('assetLoadDurationMs');
    const loadText = Number.isFinite(loadPercent)
      ? `${Math.round(loadPercent)}% · ${(Math.max(0, loadMs || 0) / 1000).toFixed(1)}s`
      : 'n/d';

    this.text.setText([
      'DESEMPENHO',
      `FPS: ${fps.toFixed(0)}`,
      `CPU jogo*: ${cpuMs.toFixed(1)} ms`,
      `Carga*: ${cpuPercent.toFixed(0)}%`,
      `Memória JS: ${memoryText}`,
      `Assets: ${loadText}`
    ]);
  }

  destroy() {
    this.scene.scale.off('resize', this.resize, this);
    this.layer?.destroy();
    this.layer = null;
    this.panel = null;
    this.text = null;
    this.scene = null;
  }
}
