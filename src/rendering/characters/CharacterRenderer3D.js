import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const MODEL_HEIGHT_WORLD = 76;
const IDLE_POSE_TIME = 0.12;

const ANIMATION = Object.freeze({
  idle: 'Walking',
  walk: 'Running',
  attack: 'Right_Hand_Sword_Slash',
  jump: 'Basic_Jump',
  death: 'Dead'
});

/**
 * Standalone GLB presentation adapter.
 * It receives a DOM mount point and transform/camera snapshots, never a Player
 * instance, physics body, input controller or gameplay system.
 */
export default class CharacterRenderer3D {
  constructor(parent, { modelUrl, onReady = () => {}, onError = () => {}, onProgress = () => {} } = {}) {
    this.parent = parent;
    this.modelUrl = modelUrl;
    this.onReady = onReady;
    this.onError = onError;
    this.onProgress = onProgress;
    this.worldX = 0;
    this.worldY = 0;
    this.direction = 0;
    this.mixer = null;
    this.actions = new Map();
    this.currentAction = null;
    this.ready = false;
    this.disposed = false;
    this.moving = false;
    this.lockedAction = false;
    this.dead = false;

    if (!parent) {
      this.onError('Não foi encontrado o elemento de exibição do jogo.');
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
    this.parent.appendChild(this.renderer.domElement);

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

    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(
      modelUrl,
      (gltf) => this.onModelLoaded(gltf),
      (event) => {
        if (this.disposed) return;
        const loaded = Number(event.loaded) || 0;
        const total = Number(event.total) || 0;
        this.onProgress({
          loaded,
          total,
          ratio: total > 0 ? Math.min(loaded / total, 1) : null
        });
      },
      (error) => {
        if (this.disposed) return;
        console.error('Falha ao carregar warrior.glb:', error);
        this.onError('warrior.glb ainda não está na pasta de assets. O jogador lógico continuará funcionando.');
      }
    );
  }

  onModelLoaded(gltf) {
    if (this.disposed) return;
    this.model = gltf.scene;

    const bounds = new THREE.Box3().setFromObject(this.model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    const scale = MODEL_HEIGHT_WORLD / Math.max(size.y, 0.001);
    this.model.scale.setScalar(scale);
    this.model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    this.root.add(this.model);

    this.mixer = new THREE.AnimationMixer(this.model);
    for (const clip of gltf.animations) {
      this.actions.set(clip.name, this.mixer.clipAction(clip));
    }

    const missing = Object.values(ANIMATION).filter((name) => !this.actions.has(name));
    if (missing.length) {
      this.onError('Faltam animações no warrior.glb: ' + missing.join(', '));
      return;
    }

    this.mixer.addEventListener('finished', this.onActionFinished);
    this.ready = true;
    this.root.rotation.y = this.direction;
    this.setAnimation(this.moving ? ANIMATION.walk : ANIMATION.idle, {
      idlePose: !this.moving
    });
    this.onReady();
  }

  setAnimation(name, { loop = true, idlePose = false } = {}) {
    if (!this.ready && !this.mixer) return;
    if (!this.actions.has(name)) return;
    const next = this.actions.get(name);
    if (this.currentAction === name) {
      if (idlePose) {
        next.time = next.getClip().duration * IDLE_POSE_TIME;
        next.paused = true;
      }
      return;
    }

    const previous = this.currentAction ? this.actions.get(this.currentAction) : null;
    next.reset();
    next.enabled = true;
    next.paused = false;
    next.timeScale = 1;
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.play();
    if (previous && previous !== next) next.crossFadeFrom(previous, 0.16, true);
    this.currentAction = name;

    if (idlePose) {
      next.time = next.getClip().duration * IDLE_POSE_TIME;
      next.paused = true;
    }
  }

  playOneShot(name, speed = 1) {
    if (!this.ready || this.dead || this.lockedAction || !this.actions.has(name)) return;
    this.lockedAction = true;
    this.setAnimation(name, { loop: false });
    this.actions.get(name).timeScale = speed;
  }

  onActionFinished = (event) => {
    if (this.disposed || !this.ready) return;
    if (this.actions.get(this.currentAction) !== event.action) return;
    if (this.dead || this.currentAction === ANIMATION.death) return;
    this.lockedAction = false;
    this.currentAction = null;
    this.setAnimation(this.moving ? ANIMATION.walk : ANIMATION.idle, {
      idlePose: !this.moving
    });
  };

  playSlash() { this.playOneShot(ANIMATION.attack, 1.15); }
  playJump() { this.playOneShot(ANIMATION.jump); }

  playDeath() {
    if (!this.ready || this.dead || !this.actions.has(ANIMATION.death)) return;
    this.dead = true;
    this.lockedAction = true;
    this.setAnimation(ANIMATION.death, { loop: false });
  }

  setMoving(moving) {
    this.moving = Boolean(moving);
    if (!this.ready || this.lockedAction || this.dead) return;
    this.setAnimation(this.moving ? ANIMATION.walk : ANIMATION.idle, {
      idlePose: !this.moving
    });
  }

  setDirection(x, y) {
    if (Math.hypot(x, y) < 0.0001) return;
    const angle = Math.atan2(x, -y);
    const step = Math.PI / 4;
    this.direction = Math.round(angle / step) * step;
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
    this.mixer?.update(Math.min(Math.max(delta, 0), 50) / 1000);
    if (!this.ready || !camera2d) return;

    const height = this.parent.clientHeight;
    const zoomX = camera2d.zoomX || camera2d.zoom;
    const zoomY = camera2d.zoomY || camera2d.zoom;
    const screenX = camera2d.x + (this.worldX - camera2d.scrollX) * zoomX;
    const screenY = camera2d.y + (this.worldY - camera2d.scrollY) * zoomY;
    this.root.position.set(screenX, height - screenY, 0);
    this.root.scale.setScalar(zoomY);
    this.renderer.render(this.scene3d, this.camera);
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.onResize) window.removeEventListener('resize', this.onResize);
    this.mixer?.removeEventListener('finished', this.onActionFinished);
    this.mixer?.stopAllAction();

    this.scene3d?.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material?.dispose();
    });

    this.renderer?.dispose();
    this.renderer?.domElement.remove();
    this.actions.clear();
    this.currentAction = null;
    this.parent = null;
  }
}
