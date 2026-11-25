import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { DEFAULT_PLAYER_SKIN_ID, getPlayerSkin } from './CharacterAssets.js';

const MAX_DELTA_MS = 50;
const CROSS_FADE_SECONDS = 0.16;

/**
 * Renderização visual do personagem.
 *
 * Contrato: recebe snapshots de posição/direção/estado. Nunca recebe Player,
 * corpo Arcade, controlador de toque ou sistema de movimento.
 * A troca de skin substitui somente o modelo e seu conjunto de animações.
 */
export default class CharacterRenderer3D {
  constructor(parent, {
    skinId = DEFAULT_PLAYER_SKIN_ID,
    onReady = () => {},
    onError = () => {},
    onProgress = () => {},
    onSkinChanged = () => {},
    onWeaponStatus = () => {}
  } = {}) {
    this.parent = parent;
    this.onReady = onReady;
    this.onError = onError;
    this.onProgress = onProgress;
    this.onSkinChanged = onSkinChanged;
    this.onWeaponStatus = onWeaponStatus;

    this.worldX = 0;
    this.worldY = 0;
    this.direction = 0;
    this.moving = false;
    this.dead = false;
    this.lockedAction = false;
    this.disposed = false;
    this.ready = false;
    this.skin = null;
    this.model = null;
    this.mixer = null;
    this.actions = new Map();
    this.currentActionName = null;
    this.loadGeneration = 0;
    this.weapon = null;
    this.weaponAnchor = null;
    this.weaponShouldBeVisible = false;

    if (!parent) {
      this.onError('Não foi encontrado o elemento de exibição do personagem.');
      return;
    }

    try {
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
        stencil: false
      });
    } catch (error) {
      console.error('Não foi possível iniciar o renderizador 3D.', error);
      this.onError('Este aparelho não conseguiu iniciar o renderizador 3D.');
      return;
    }

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    Object.assign(this.renderer.domElement.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '2'
    });
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    parent.appendChild(this.renderer.domElement);

    this.scene3d = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 2000);
    this.camera.position.set(0, 0, 1000);
    this.camera.lookAt(0, 0, 0);
    this.scene3d.add(new THREE.HemisphereLight(0xffffff, 0x687080, 2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(-120, 220, 350);
    this.scene3d.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x9bbcff, 0.8);
    fillLight.position.set(160, 40, 180);
    this.scene3d.add(fillLight);

    this.root = new THREE.Group();
    this.scene3d.add(this.root);

    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(17, 24),
      new THREE.MeshBasicMaterial({
        color: 0x101522,
        transparent: true,
        opacity: 0.34,
        depthWrite: false
      })
    );
    this.shadow.scale.set(1, 0.38, 1);
    this.shadow.position.set(0, 1, -2);
    this.root.add(this.shadow);

    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });
    this.resize();

    this.setSkin(skinId).catch((error) => {
      if (!this.disposed) {
        console.error('Falha ao carregar a skin inicial.', error);
        this.onError('Não foi possível carregar a skin. O jogador lógico continua funcionando.');
      }
    });
  }

  setSkin(skinId) {
    if (this.disposed) return Promise.resolve(false);

    const skin = getPlayerSkin(skinId);
    if (!skin) {
      this.onError('Skin não encontrada: ' + skinId);
      return Promise.resolve(false);
    }
    if (this.skin?.id === skin.id && this.ready) return Promise.resolve(true);

    const generation = ++this.loadGeneration;
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);

    return new Promise((resolve, reject) => {
      loader.load(
        skin.modelUrl,
        (gltf) => {
          if (this.disposed || generation !== this.loadGeneration) {
            this.disposeGltf(gltf);
            resolve(false);
            return;
          }

          try {
            this.installModel(gltf, skin);
            this.onSkinChanged({ id: skin.id, name: skin.name, animated: skin.animated });
            if (!this._hasEverBeenReady) {
              this._hasEverBeenReady = true;
              this.onReady({ id: skin.id, name: skin.name });
            }
            resolve(true);
          } catch (error) {
            this.disposeGltf(gltf);
            reject(error);
          }
        },
        (event) => {
          if (this.disposed || generation !== this.loadGeneration) return;
          const loaded = Number(event.loaded) || 0;
          const total = Number(event.total) || 0;
          this.onProgress({
            skinId: skin.id,
            loaded,
            total,
            ratio: total > 0 ? Math.min(loaded / total, 1) : null
          });
        },
        (error) => {
          if (this.disposed || generation !== this.loadGeneration) {
            resolve(false);
            return;
          }
          reject(error);
        }
      );
    });
  }

  installModel(gltf, skin) {
    const nextModel = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(nextModel);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    const height = Math.max(size.y, 0.001);
    const scale = (skin.modelHeight || 76) / height;
    nextModel.scale.setScalar(scale);
    nextModel.position.set(
      -center.x * scale,
      -bounds.min.y * scale,
      -center.z * scale
    );

    // O modelo anterior só é removido depois que o novo foi carregado.
    this.clearCurrentModel();
    this.model = nextModel;
    this.root.add(nextModel);
    this.skin = skin;
    // A arma começa sempre oculta ao instalar/trocar o modelo.
    this.setWeaponVisible(false);
    this.attachEmbeddedWeapon();
    this.actions.clear();
    this.currentActionName = null;
    this.lockedAction = false;
    this.dead = false;

    if (gltf.animations?.length) {
      this.mixer = new THREE.AnimationMixer(nextModel);
      for (const clip of gltf.animations) {
        this.actions.set(clip.name, this.mixer.clipAction(clip));
      }
      this.mixer.addEventListener('finished', this.onActionFinished);
    } else {
      this.mixer = null;
    }

    this.ready = true;
    this.root.rotation.y = this.direction;
    this.applyLocomotionAnimation();
  }

  reportWeaponStatus(status, details = {}) {
    this.onWeaponStatus({ status, details });
    console.info('[CharacterWeapon]', status, details);
  }

  findRightHand() {
    const exact = this.model?.getObjectByName('mixamorig:RightHand') ||
      this.model?.getObjectByName('RightHand');
    if (exact) return exact;

    const candidates = [];
    this.model?.traverse((object) => {
      if (/right.?hand|hand.?right/i.test(object.name || '')) {
        candidates.push({ name: object.name, type: object.type, isBone: Boolean(object.isBone) });
      }
    });
    this.reportWeaponStatus('MÃO NÃO ENCONTRADA', { candidates });
    return null;
  }

  attachEmbeddedWeapon() {
    // A espada já está incluída no GLB do personagem e é filha do osso
    // mixamorig:RightHand. Não carregamos outro GLB nem criamos outro anchor.
    const hand = this.findRightHand();
    const weapon = this.model?.getObjectByName('ColossalSword_AttachedToRightHand');

    if (!hand) {
      this.weapon = null;
      this.reportWeaponStatus('MÃO DIREITA NÃO ENCONTRADA');
      return false;
    }

    if (!weapon) {
      this.weapon = null;
      this.reportWeaponStatus('ESPADA NÃO ENCONTRADA NO MODELO', {
        expectedNode: 'ColossalSword_AttachedToRightHand',
        hint: 'O character.glb publicado ainda pode ser a versão sem espada.'
      });
      return false;
    }

    if (weapon.parent !== hand) {
      this.weapon = null;
      this.reportWeaponStatus('ESPADA NÃO ESTÁ ANEXADA À MÃO', {
        weaponParent: weapon.parent?.name || weapon.parent?.type,
        expectedParent: hand.name
      });
      return false;
    }

    this.weapon = weapon;
    this.weaponAnchor = weapon;
    this.setWeaponVisible(false);
    this.reportWeaponStatus('ESPADA EMBUTIDA E ANEXADA', {
      hand: hand.name,
      weapon: weapon.name,
      visible: weapon.visible
    });
    return true;
  }

  countWeaponMeshes(root) {
    let count = 0;
    root?.traverse((object) => { if (object.isMesh) count += 1; });
    return count;
  }

  setWeaponVisible(visible) {
    this.weaponShouldBeVisible = Boolean(visible);
    if (this.weaponAnchor) this.weaponAnchor.visible = this.weaponShouldBeVisible;
  }

  clearCurrentModel() {
    if (this.mixer) {
      this.mixer.removeEventListener('finished', this.onActionFinished);
      this.mixer.stopAllAction();
      this.mixer.uncacheRoot(this.model);
    }
    this.mixer = null;
    if (this.model) {
      // A espada faz parte da hierarquia do GLB do personagem. Não removê-la
      // nem descartá-la separadamente; clearCurrentModel descarta o modelo todo.
      this.weapon = null;
      this.weaponAnchor = null;
      this.root.remove(this.model);
      this.disposeObject(this.model);
    }
    this.model = null;
    this.actions.clear();
    this.currentActionName = null;
  }

  disposeObject(root) {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();

    root.traverse((object) => {
      if (!object.isMesh) return;
      if (object.geometry) geometries.add(object.geometry);
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) {
        if (!material) continue;
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value?.isTexture) textures.add(value);
        }
      }
    });

    for (const texture of textures) texture.dispose();
    for (const material of materials) material.dispose();
    for (const geometry of geometries) geometry.dispose();
  }

  disposeGltf(gltf) {
    if (gltf?.scene) this.disposeObject(gltf.scene);
  }

  setAnimation(name, { loop = true, timeScale = 1 } = {}) {
    if (!this.ready || !this.mixer || !name || !this.actions.has(name)) return false;

    const next = this.actions.get(name);
    if (this.currentActionName === name && next.isRunning()) return true;

    const previous = this.currentActionName
      ? this.actions.get(this.currentActionName)
      : null;

    next.reset();
    next.enabled = true;
    next.paused = false;
    next.timeScale = timeScale;
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.play();

    if (previous && previous !== next) {
      next.crossFadeFrom(previous, CROSS_FADE_SECONDS, true);
    }

    this.currentActionName = name;
    return true;
  }

  applyLocomotionAnimation() {
    if (!this.ready || this.lockedAction || this.dead || !this.skin?.animated) return;
    const animations = this.skin.animations || {};
    const name = this.moving ? animations.walk : animations.idle;
    if (name) this.setAnimation(name);
  }

  playOneShot(animationKey, speed = 1) {
    if (!this.ready || this.dead || this.lockedAction || !this.skin?.animated) return false;
    const name = this.skin.animations?.[animationKey];
    if (!name || !this.actions.has(name)) return false;

    this.lockedAction = true;
    if (animationKey === 'attack' || animationKey === 'attackAlternate') this.setWeaponVisible(true);
    const started = this.setAnimation(name, { loop: false, timeScale: speed });
    if (!started) {
      this.lockedAction = false;
      this.setWeaponVisible(false);
    }
    return started;
  }

  onActionFinished = (event) => {
    if (this.disposed || !this.ready || this.dead) return;
    if (!this.currentActionName || this.actions.get(this.currentActionName) !== event.action) return;
    this.lockedAction = false;
    this.currentActionName = null;
    this.setWeaponVisible(false);
    this.applyLocomotionAnimation();
  };

  playSlash() {
    if (this.skin?.animations?.attackAlternate && this._useAlternateAttack) {
      this._useAlternateAttack = false;
      return this.playOneShot('attackAlternate', 1);
    }
    this._useAlternateAttack = Boolean(this.skin?.animations?.attackAlternate);
    return this.playOneShot('attack', 1);
  }

  playJump() { return this.playOneShot('jump'); }

  playDeath() {
    if (!this.ready || this.dead || !this.skin?.animated) return false;
    if (!this.skin.animations?.death) return false;
    this.dead = true;
    this.lockedAction = true;
    this.setWeaponVisible(false);
    return this.setAnimation(this.skin.animations.death, { loop: false });
  }

  setMoving(moving) {
    this.moving = Boolean(moving);
    this.applyLocomotionAnimation();
  }

  setDirection(x, y) {
    if (Math.hypot(x, y) < 0.0001) return;
    // O eixo vertical do GLB está invertido em relação ao mapa: norte/sul precisam trocar.
    const angle = Math.atan2(x, y);
    const sector = Math.PI / 4;
    this.direction = Math.round(angle / sector) * sector;
    if (this.root) this.root.rotation.y = this.direction;
  }

  setTransform(x, y) {
    this.worldX = x;
    this.worldY = y;
  }

  resize() {
    if (this.disposed || !this.renderer || !this.parent) return;
    const width = Math.max(1, this.parent.clientWidth);
    const height = Math.max(1, this.parent.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = height;
    this.camera.bottom = 0;
    this.camera.updateProjectionMatrix();
  }

  update(delta, camera2d) {
    if (this.disposed || !this.renderer) return;
    this.mixer?.update(Math.min(Math.max(delta, 0), MAX_DELTA_MS) / 1000);
    if (!this.ready || !camera2d || !this.parent) return;

    const width = this.parent.clientWidth;
    const height = this.parent.clientHeight;

    // Usa o mesmo zoom uniforme efetivo da câmera Phaser. Não usa zoomX/zoomY
    // separados: em alguns ciclos de resize/pinch eles podem ficar defasados
    // em relação ao zoom que está sendo aplicado ao mundo 2D.
    const zoom = camera2d.zoom;
    const view = camera2d.worldView;
    const viewX = view?.x ?? camera2d.scrollX;
    const viewY = view?.y ?? camera2d.scrollY;

    // Converte as coordenadas lógicas do jogo para pixels do canvas overlay.
    // Isso também cobre diferenças entre o tamanho lógico Phaser e o CSS.
    const scaleX = width / Math.max(1, camera2d.width);
    const scaleY = height / Math.max(1, camera2d.height);
    const screenX = (camera2d.x + (this.worldX - viewX) * zoom) * scaleX;
    const screenY = (camera2d.y + (this.worldY - viewY) * zoom) * scaleY;

    this.root.position.set(screenX, height - screenY, 0);
    this.root.scale.setScalar(zoom * scaleY);
    this.renderer.render(this.scene3d, this.camera);
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    this.loadGeneration += 1;
    window.removeEventListener('resize', this.onResize);
    this.clearCurrentModel();

    this.root?.remove(this.shadow);
    this.shadow?.geometry?.dispose();
    this.shadow?.material?.dispose();
    this.renderer?.dispose();
    this.renderer?.domElement.remove();

    this.parent = null;
    this.skin = null;
  }
}
