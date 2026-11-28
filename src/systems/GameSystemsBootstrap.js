import MovementSystem from './MovementSystem.js';
import CombatSystem from './combat/CombatSystem.js';
import ProgressionSystem from './ProgressionSystem.js';
import MonsterCombatSystem from './monsters/MonsterCombatSystem.js';
import PerformanceMonitor from '../ui/PerformanceMonitor.js';
import TouchInputController from './input/TouchInputController.js';

/** Creates and owns the gameplay systems coordinated by the Game scene. */
export default class GameSystemsBootstrap {
  constructor(scene) {
    if (!scene) throw new TypeError('GameSystemsBootstrap precisa de uma cena.');
    this.scene = scene;
    this.initialized = false;
  }

  initialize({
    player,
    characterRenderer,
    camera,
    cameraController,
    monsterManager,
    showLevelUpNotice = () => {},
    waifuAbilities = null
  } = {}) {
    const scene = this.scene;
    if (!scene || this.initialized) {
      throw new Error('GameSystemsBootstrap já foi inicializado ou foi encerrado.');
    }
    if (!player || !characterRenderer || !camera || !cameraController || !monsterManager) {
      throw new TypeError('GameSystemsBootstrap exige jogador, renderer, câmera e gerenciador de monstros.');
    }

    scene.progression = new ProgressionSystem({
      statPointsPerLevel: 3,
      onLevelUp: ({ level }) => showLevelUpNotice(level)
    });

    scene.destinationMarker = scene.add.circle(0, 0, 12, 0xfacc15, 0.18)
      .setStrokeStyle(2, 0xfacc15, 0.95)
      .setDepth(900)
      .setVisible(false);

    scene.movement = new MovementSystem(player, scene.navigation);
    scene.combat = new CombatSystem({
      player,
      movement: scene.movement,
      getTargets: () => monsterManager?.getAliveEntities() || [],
      onAttack: (target, damage, now, penetration, attackIntervalMs) => {
        characterRenderer?.playAction('combat', { durationMs: attackIntervalMs });
        waifuAbilities?.tryActivate(target, now);
        monsterManager?.damage(target.id, damage, now, penetration);
      }
    });
    scene.monsterCombat = new MonsterCombatSystem({
      player,
      getAttackers: () => monsterManager?.getCombatEntries() || []
    });

    scene.performanceMonitor = new PerformanceMonitor(scene);
    cameraController.createHudCamera(scene.performanceMonitor.layer);

    scene.touchInput = new TouchInputController(scene, {
      camera,
      getMinZoom: () => cameraController.getMinimumZoom(),
      maxZoom: cameraController.getMaximumZoom(),
      clampCamera: () => cameraController.clampToWorld(),
      isUiPointer: (x, y) => scene.uiScene?.isUiPointer(x, y) ||
        scene.performanceMonitor?.containsScreenPoint(x, y) || false,
      onPan: () => cameraController.handleManualPan(),
      onTap: (screenX, screenY) => {
        const target = camera.getWorldPoint(screenX, screenY);
        const accepted = scene.movement.setDestination(target.x, target.y);
        if (accepted) {
          const destination = scene.movement.destination;
          scene.destinationMarker.setPosition(destination.x, destination.y).setVisible(true);
          // Retoma o follow somente depois de exploração manual.
          cameraController.followPlayer({ smoothReturn: true });
        } else {
          scene.destinationMarker.setVisible(false);
        }
      }
    });

    this.initialized = true;
    return {
      progression: scene.progression,
      movement: scene.movement,
      combat: scene.combat,
      monsterCombat: scene.monsterCombat,
      performanceMonitor: scene.performanceMonitor,
      touchInput: scene.touchInput,
      destinationMarker: scene.destinationMarker
    };
  }

  destroy() {
    const scene = this.scene;
    if (!scene) return;

    scene.performanceMonitor?.destroy();
    scene.performanceMonitor = null;
    scene.touchInput?.destroy();
    scene.touchInput = null;
    scene.combat?.destroy();
    scene.combat = null;
    scene.monsterCombat?.destroy();
    scene.monsterCombat = null;
    scene.movement?.destroy();
    scene.movement = null;
    scene.destinationMarker?.destroy();
    scene.destinationMarker = null;
    scene.progression = null;

    this.initialized = false;
    this.scene = null;
  }
}
