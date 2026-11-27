import * as Phaser from 'phaser';

/** Diagnóstico de frame e do subsistema de monstros, em camada independente da câmera. */
export default class PerformanceMonitor {
  constructor(scene) {
    this.scene = scene;
    this.elapsed = 0;
    this.interval = 500;
    this.enabled = false;
    this.layer = scene.add.layer().setDepth(2100).setVisible(false);
    const { height } = scene.scale;
    this.panel = scene.add.rectangle(10, height - 10, 246, 150, 0x07111f, 0.94)
      .setOrigin(0, 1).setStrokeStyle(1, 0x94a3b8, 0.9).setScrollFactor(0);
    this.text = scene.add.text(18, height - 143,
      'DESEMPENHO\nFPS: --\nCPU jogo: --\nMonstros: --\nIA: -- ms\nVisibilidade: -- ms\nSpawn: -- ms\nMemória JS: --', {
        fontFamily: 'monospace', fontSize: '10px', fontStyle: 'bold',
        lineSpacing: 2, color: '#f8fafc', stroke: '#07111f', strokeThickness: 1, resolution: 2
      }).setScrollFactor(0).setOrigin(0, 0);
    this.layer.add([this.panel, this.text]);
    scene.scale.on('resize', this.resize, this);
    this.resize({ width: scene.scale.width, height });
  }

  resize(size) {
    if (!this.panel || !this.text) return;
    const height = size?.height || this.scene.scale.height;
    this.panel.setPosition(10, height - 10);
    this.text.setPosition(18, height - 143);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.layer?.setVisible(this.enabled);
    return this.enabled;
  }

  containsScreenPoint(x, y) {
    if (!this.enabled) return false;
    const height = this.scene?.scale.height || 0;
    return x >= 10 && x <= 256 && y >= height - 160 && y <= height - 10;
  }

  update(deltaMs, sceneUpdateMs, monsterMetrics = null) {
    if (!this.enabled) return;
    this.elapsed += Math.max(0, deltaMs || 0);
    if (this.elapsed < this.interval) return;
    this.elapsed = 0;
    const fps = Number(this.scene.game?.loop?.actualFps) || 0;
    const cpuMs = Math.max(0, sceneUpdateMs || 0);
    const cpuPercent = Phaser.Math.Clamp((cpuMs / (fps > 0 ? 1000 / fps : 16.67)) * 100, 0, 999);
    const memory = performance.memory;
    const memoryText = memory
      ? `${(memory.usedJSHeapSize / 1048576).toFixed(1)} / ${(memory.jsHeapSizeLimit / 1048576).toFixed(0)} MB`
      : 'n/d';
    const m = monsterMetrics || {};
    this.text.setText([
      'DESEMPENHO',
      `FPS: ${fps.toFixed(0)}`,
      `CPU jogo: ${cpuMs.toFixed(1)} ms · ${cpuPercent.toFixed(0)}%`,
      `Monstros: ${m.alive ?? 0} · ativos: ${m.active ?? 0}`,
      `Perseguição/combate: ${m.pursuing ?? 0}/${m.combat ?? 0}`,
      `IA: ${(m.simulationMs || 0).toFixed(2)} ms`,
      `Visibilidade: ${(m.visibilityMs || 0).toFixed(2)} ms`,
      `Spawn: ${(m.spawnMs || 0).toFixed(2)} ms`,
      `Memória JS: ${memoryText}`
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
