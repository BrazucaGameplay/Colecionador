import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = `${import.meta.env.BASE_URL}assets/characters/player/warrior.glb?v=1.1.7`;
const MODEL_HEIGHT_WORLD = 76;
const ANIMATION = Object.freeze({
  idle: 'Walking',
  walk: 'Running',
  attack: 'Right_Hand_Sword_Slash',
  jump: 'Basic_Jump',
  death: 'Dead'
});

export default class CharacterRenderer3D {
  constructor(scene, { onReady = () => {}, onError = () => {}, onProgress = () => {} } = {}) {
    this.scene = scene;
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
    this.actionTimer = null;
    this.parent = scene.sys.game.canvas.parentElement;

    try {
      this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power', stencil: false });
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
      position: 'absolute', inset: '0', width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: '2'
    });
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    this.parent.appendChild(this.renderer.domElement);

    this.scene3d = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 2000);
    this.camera.position.set(0, 0, 1000);
    this.camera.lookAt(0, 0, 0);
    this.scene3d.add(new THREE.HemisphereLight(0xffffff, 0x687080, 2.0));

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
      new THREE.MeshBasicMaterial({ color: 0x101522, transparent: true, opacity: 0.34, depthWrite: false })
    );
    this.shadow.scale.set(1, 0.38, 1);
    this.shadow.position.set(0, 1, -2);
    this.root.add(this.shadow);

    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL,
      (gltf) => this.onModelLoaded(gltf),
      (event) => {
        if (this.disposed) return;
        const loaded = Number(event.loaded) || 0;
        const total = Number(event.total) || 0;
        this.onProgress({ loaded, total, ratio: total > 0 ? Math.min(loaded / total, 1) : null });
      },
      (error) => {
        if (this.disposed) return;
        console.error('Falha ao carregar o modelo obrigatório do jogador:', error);
        this.onError('Falha ao carregar warrior.glb. Verifique a conexão e tente atualizar a página.');
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
    for (const clip of gltf.animations) this.actions.set(clip.name, this.mixer.clipAction(clip));

    const missing = Object.values(ANIMATION).filter((name) => !this.actions.has(name));
    if (missing.length) {
      this.onError('Faltam animações no warrior.glb: ' + missing.join(', '));
      return;
    }

    this.ready = true;
    this.root.rotation.y = this.direction;
    this.setAnimation(this.moving ? ANIMATION.walk : ANIMATION.idle, !this.moving);
    this.onReady();
  }

  setAnimation(name, paused = false) {
    if (!this.ready || !this.actions.has(name)) return;
    const next = this.actions.get(name);
    if (this.currentAction === name) {
      if (paused) next.paused = true;
      return;
    }
    const previous = this.currentAction ? this.actions.get(this.currentAction) : null;
    next.reset();
    next.enabled = true;
    next.paused = false;
    next.setLoop(paused ? THREE.LoopOnce : THREE.LoopRepeat, paused ? 1 : Infinity);
    next.clampWhenFinished = paused;
    next.play();
    if (previous && previous !== next) next.crossFadeFrom(previous, 0.18, true);
    this.currentAction = name;
    if (paused) {
      next.time = 0;
      next.paused = true;
    }
  }

  playOneShot(name, speed = 1) {
    if (!this.ready || !this.actions.has(name) || this.lockedAction) return;
    this.lockedAction = true;
    this.actionTimer?.remove(false);
    const action = this.actions.get(name);
    this.setAnimation(name);
    action.timeScale = speed;
    const duration = action.getClip().duration / Math.abs(speed);
    this.actionTimer = this.scene.time.delayedCall(duration * 1000, () => {
      this.actionTimer = null;
      this.lockedAction = false;
      if (!this.disposed && this.ready) {
        this.currentAction = null;
        this.setAnimation(this.moving ? ANIMATION.walk : ANIMATION.idle, !this.moving);
      }
    });
  }

  playSlash() { this.playOneShot(ANIMATION.attack, 1.15); }
  playJump() { this.playOneShot(ANIMATION.jump); }

  playDeath() {
    if (!this.ready || !this.actions.has(ANIMATION.death)) return;
    this.actionTimer?.remove(false);
    this.actionTimer = null;
    this.lockedAction = true;
    this.setAnimation(ANIMATION.death);
    const action = this.actions.get(ANIMATION.death);
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
  }

  setMoving(moving) {
    this.moving = moving;
    if (!this.ready || this.lockedAction) return;
    this.setAnimation(moving ? ANIMATION.walk : ANIMATION.idle, !moving);
  }

  setDirection(angle) {
    // Quantiza a direção em oito orientações e mantém a última ao parar.
    const step = Math.PI / 4;
    this.direction = Math.round(angle / step) * step;
    if (this.root) this.root.rotation.y = this.direction;
  }

  resize() {
    if (this.disposed || !this.renderer) return;
    const width = Math.max(1, this.parent.clientWidth);
    const height = Math.max(1, this.parent.clientHeight);
    this.renderer.setSize(width, height, false);
    this.camera.left = 0; this.camera.right = width;
    this.camera.top = height; this.camera.bottom = 0;
    this.camera.updateProjectionMatrix();
  }

  setPosition(x, y) { this.worldX = x; this.worldY = y; }

  update(delta, camera2d) {
    if (this.disposed || !this.renderer) return;
    if (this.mixer && !this.actions.get(this.currentAction)?.paused) this.mixer.update(Math.min(delta, 50) / 1000);
    if (!this.ready) return;
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
    this.actionTimer?.remove(false);
    if (this.onResize) window.removeEventListener('resize', this.onResize);
    this.mixer?.stopAllAction();
    this.scene3d?.traverse((object) => {
      if (!object.isMesh) return;
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material?.dispose();
    });
    this.renderer?.dispose();
    this.renderer?.domElement.remove();
  }
}
