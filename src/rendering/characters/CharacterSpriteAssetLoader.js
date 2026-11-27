import {
  CHARACTER_ANIMATIONS,
  getCharacterAnimationsForSkin
} from './CharacterAnimationCatalog.js';
import { CHARACTER_SKINS } from './CharacterSkinCatalog.js';

const BASE = import.meta.env?.BASE_URL ?? '/';
// Incrementado quando atlas/metadados mudam para impedir que o navegador reutilize pacotes antigos.
const CHARACTER_ATLAS_CACHE_VERSION = '20261127-skin-atlas-v2';
const uniqueEntries = animations => [...new Map(Object.values(animations).map(item => [item.key,item])).values()];

export function queuePlayerSpriteAssets(loader) {
  for (const skin of Object.values(CHARACTER_SKINS)) {
    if (!skin.selectable || skin.status !== 'ready') continue;
    for (const item of uniqueEntries(getCharacterAnimationsForSkin(skin) || {})) {
      loader.json(item.key + '-meta', BASE + item.path + '.json?v=' + CHARACTER_ATLAS_CACHE_VERSION);
      loader.image(item.key, BASE + item.path + '.png?v=' + CHARACTER_ATLAS_CACHE_VERSION);
    }
  }
}

export function registerPlayerSpriteAnimations(scene) {
  scene.characterAnimationsBySkin ||= new Map();
  scene.playerFramePivots ||= new Map();
  for (const skin of Object.values(CHARACTER_SKINS)) {
    if (!skin.selectable || skin.status !== 'ready') continue;
    const animations = getCharacterAnimationsForSkin(skin);
    if (!animations) continue;
    let complete = true;
    for (const item of uniqueEntries(animations)) {
      const metadata = scene.cache.json.get(item.key + '-meta');
      const texture = scene.textures.get(item.key);
      if (!metadata || !texture || !Array.isArray(metadata.frames) || !metadata.frames.length) {
        console.warn('[CharacterAnimations] Pacote indisponível:', skin.id, item.id); complete = false; continue;
      }
      try {
        const dirs = new Map();
        for (const record of metadata.frames) {
          const direction = Number(record.direction);
          const frameIndex = Number(record.frame);
          if (!Number.isInteger(direction) || direction < 0 || direction > 7 ||
              !Number.isInteger(frameIndex) || frameIndex < 0 ||
              !Number.isFinite(record.x) || !Number.isFinite(record.y) ||
              record.width <= 0 || record.height <= 0 ||
              record.x < 0 || record.y < 0) {
            complete = false;
            console.error('[CharacterAnimations] Quadro inválido:', skin.id, item.id, record);
            continue;
          }
          const frameName = `d${direction}-f${frameIndex}`;
          const pivotY = Number(record.pivotY ?? metadata.pivot?.y);
          if (Number.isFinite(pivotY)) scene.playerFramePivots.set(`${item.key}:${frameName}`,Math.max(0,Math.min(1,pivotY)));
          if (!texture.has(frameName)) texture.add(frameName,0,record.x,record.y,record.width,record.height);
          if (!dirs.has(direction)) dirs.set(direction,[]);
          dirs.get(direction).push({frame:frameName,index:frameIndex});
        }
        const expectedFrames = Number(metadata.frameCount);
        for (let direction=0;direction<8;direction++) {
          const frames=dirs.get(direction)||[];
          const indexes = new Set(frames.map(frame=>frame.index));
          if (!frames.length || indexes.size !== frames.length ||
              (Number.isInteger(expectedFrames) && expectedFrames > 0 && frames.length !== expectedFrames)) {
            complete=false;
            console.error('[CharacterAnimations] Direção incompleta:', skin.id, item.id, {
              direction, actual: frames.length, expected: expectedFrames
            });
            continue;
          }
          frames.sort((a,b)=>a.index-b.index);
          const key=`${item.key}-d${direction}`;
          if (!scene.anims.exists(key)) scene.anims.create({
            key,
            frames:frames.map(({frame})=>({key:item.key,frame})),
            frameRate:metadata.fps||12,
            repeat:item.loop?-1:0
          });
        }
      } catch (error) {
        complete = false;
        console.error('[CharacterAnimations] Falha ao registrar atlas:', skin.id, item.id, error);
      }
    }
    if (complete) scene.characterAnimationsBySkin.set(skin.id,animations);
  }
  // Phaser mantém o registry entre cenas; os mapas locais da cena Preload não são compartilhados.
  scene.registry?.set('characterAnimationsBySkin', scene.characterAnimationsBySkin);
  scene.registry?.set('playerFramePivots', scene.playerFramePivots);
}

export function attachPlayerSpriteRegistry(scene) {
  scene.characterAnimationsBySkin = scene.registry?.get('characterAnimationsBySkin') || new Map();
  scene.playerFramePivots = scene.registry?.get('playerFramePivots') || new Map();
  return {
    characterAnimationsBySkin: scene.characterAnimationsBySkin,
    playerFramePivots: scene.playerFramePivots
  };
}
