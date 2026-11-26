import * as Phaser from 'phaser';

/**
 * Monitor leve de desempenho. Atualiza o texto em baixa frequência para
 * não criar trabalho significativo a cada frame.
 */
export default class PerformanceMonitor {
  constructor(scene) {
    this.scene = scene;
    this.elapsed = 0;
    this.interval = 500;
    this.cpuSamples = [];
    this.lastCpuMs = 0;

    const { width, height } = scene.scale;
    this.panel = scene.add.rectangle(8, height - 8, 166, 88, 0x07111f, 0.82)
      .setOrigin(0, 1)
      .setStrokeStyle(1, 0x64748b, 0.55)
      .setScrollFactor(0)
      .setDepth(2000);

    this.text = scene.add.text(16, height - 82, 'DESEMPENHO\nFPS: --\nCPU jogo: --\nMemória JS: --\nCarga: --', {
      fontFamily: 'monospace',
      fontSize: '10px',
      lineSpacing: 2,
      color: '#e2e8f0'
    }).setScrollFactor(0).setDepth(2001);

    scene.scale.on('resize', this.resize, this);
    this.resize({ width, height });
  }

  resize(size) {
    if (!this.panel || !this.text) return;
    const width = size?.width || this.scene.scale.width;
    const height = size?.height || this.scene.scale.height;
    this.panel.setPosition(8, height - 8);
    this.text.setPosition(16, height - 82);
  }

  update(deltaMs, sceneUpdateMs) {
    this.elapsed += Math.max(0, deltaMs || 0);
    this.lastCpuMs = Math.max(0, sceneUpdateMs || 0);
    if (this.elapsed < this.interval) return;
    this.elapsed = 0;

    const loop = this.scene.game?.loop;
    const fps = Number(loop?.actualFps) || 0;
    const frameBudget = fps > 0 ? 1000 / fps : 16.67;
    const cpuPercent = Phaser.Math.Clamp((this.lastCpuMs / frameBudget) * 100, 0, 999);
    const memory = performance.memory;
    const memoryText = memory
      ? `${(memory.usedJSHeapSize / 1048576).toFixed(1)} / ${(memory.jsHeapSizeLimit / 1048576).toFixed(0)} MB`
      : 'indisponível';

    const loadPercent = this.scene.registry.get('assetLoadPercent');
    const loadMs = this.scene.registry.get('assetLoadDurationMs');
    const loadText = Number.isFinite(loadPercent)
      ? `${Math.round(loadPercent)}% · ${(Math.max(0, loadMs || 0) / 1000).toFixed(1)}s`
      : 'n/d';

    this.text.setText([
      'DESEMPENHO',
      `FPS: ${fps.toFixed(0)}`,
      `CPU jogo*: ${this.lastCpuMs.toFixed(1)} ms`,
      `Carga*: ${cpuPercent.toFixed(0)}%`,
      `Memória JS: ${memoryText}`,
      `Assets: ${loadText}`
    ]);
  }

  destroy() {
    this.scene.scale.off('resize', this.resize, this);
    this.panel?.destroy();
    this.text?.destroy();
    this.panel = null;
    this.text = null;
    this.scene = null;
  }
}
