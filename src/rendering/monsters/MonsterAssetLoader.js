import { MONSTER_DEFINITIONS } from '../../data/monsters/index.js';

const BASE = import.meta.env.BASE_URL;

export function queueMonsterAssets(loader, definitions = MONSTER_DEFINITIONS) {
  for (const definition of Object.values(definitions)) {
    const visual = definition.visual;
    if (!visual?.enabled) continue;

    for (const pack of Object.values(visual.animations || {})) {
      if (!pack.path) continue;
      loader.json(pack.key + '-meta', BASE + pack.path + '.json');
      loader.image(pack.key, BASE + pack.path + '.png');
    }
  }
}

/**
 * Usa o mesmo contrato de atlas PNG + JSON adotado pelos sprites do jogador:
 * frames com x/y/width/height, frame, direction e pivotY.
 */
export function registerMonsterAnimations(scene, definitions = MONSTER_DEFINITIONS) {
  scene.monsterFramePivots ||= new Map();

  for (const definition of Object.values(definitions)) {
    if (!definition.visual?.enabled) continue;

    for (const pack of Object.values(definition.visual.animations || {})) {
      const metadata = scene.cache.json.get(pack.key + '-meta');
      const texture = scene.textures.get(pack.key);
      if (!metadata || !texture || !Array.isArray(metadata.frames) || !metadata.frames.length) {
        continue;
      }

      const byDirection = new Map();
      for (const record of metadata.frames) {
        const direction = Number(record.direction) || 0;
        const frameName = 'd' + direction + '-f' + record.frame;
        const pivotX = Number(record.pivotX ?? metadata.pivot?.x ?? definition.visual.originX);
        const pivotY = Number(record.pivotY ?? metadata.pivot?.y ?? definition.visual.originY);

        if (Number.isFinite(pivotX) && Number.isFinite(pivotY)) {
          scene.monsterFramePivots.set(pack.key + ':' + frameName, { x: pivotX, y: pivotY });
        }
        if (!texture.has(frameName)) {
          texture.add(frameName, 0, record.x, record.y, record.width, record.height);
        }
        if (!byDirection.has(direction)) byDirection.set(direction, []);
        byDirection.get(direction).push({ frame: frameName, index: record.frame });
      }

      for (const [direction, frames] of byDirection) {
        frames.sort((a, b) => a.index - b.index);
        const animationKey = pack.key + '-d' + direction;
        if (!scene.anims.exists(animationKey)) {
          scene.anims.create({
            key: animationKey,
            frames: frames.map(({ frame }) => ({ key: pack.key, frame })),
            frameRate: metadata.fps || pack.frameRate || 10,
            repeat: pack.loop ? -1 : 0
          });
        }
      }
    }
  }
}
