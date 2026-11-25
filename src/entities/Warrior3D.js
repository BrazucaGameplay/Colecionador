import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = 'https://github.com/BrazucaGameplay/Colecionador/releases/download/1.1.4/warrior.glb';
const MODEL_HEIGHT_WORLD = 76;

export default class Warrior3D {
  constructor(scene, onReady = () => {}) {
    this.scene = scene;
    this.onReady = onReady;
    this.worldX = 0;
    this.worldY = 0;
    this.mixer = null;
    this.actions = new Map();
    this.currentAction = null;
    this.ready = false;
    this.disposed = false;

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'low-power'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.pointerEvents = 'none';
    this.renderer.domElement.style.zIndex = '2';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');

    this.parent = scene.sys.game.canvas.parentElement;
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

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(17, 24),
      new THREE.MeshBasicMaterial({ color: 0x101522, transparent: true, opacity: 0.34, depthWrite: false })
    );
    shadow.rotation.x = 0;
    shadow.scale.set(1, 0.38, 1);
    shadow.position.set(0, 1, -2);
    this.root.add(shadow);
    this.shadow = shadow;

    this.resize();
    this.onResize = () => this.resize();
    window.addEventListener('resize', this.onResize, { passive: true });

    const loader = new GLTFLoader();
    loader.load(
      MODEL_URL + '?v=1.1.5',
      (gltf) => this.onModelLoaded(gltf),
      undefined,
      (error) => {
        console.error('Não foi possível carregar warrior.glb. Mantendo personagem de segurança.', error);
      }
    );
  }

  onModelLoaded(gltf) {
    if (this.disposed) return;
    this.model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(this.model);
    const size = new THREE.Vector3();
    bounds.getSize(size);
    const center = new THREE.Vector3();
    bounds.getCenter(center);

    const scale = MODEL_HEIGHT_WORLD / Math.max(size.y, 0.001);
    this.model.scale.setScalar(scale);
    this.model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    this.root.add(this.model);

    // The GLB has Running, Walking, Basic_Jump, Dead and Sword_Slash.
    // It has no Idle clip, so the Walking pose is held while stationary.
    this.mixer = new THREE.AnimationMixer(this.model);
    for (const clip of gltf.animations) {
      this.actions.set(clip.name, this.mixer.clipAction(clip));
    }
    this.setAnimation('Walking', true);
    this.ready = true;
    this.onReady();
  }

  setAnimation(name, hold = false) {
    if (!this.ready || !this.actions.has(name) || this.currentAction === name) return;
    const next = this.actions.get(name);
    const previous = this.currentAction ? this.actions.get(this.currentAction) : null;
    next.reset();
    next.enabled = true;
    next.setLoop(hold ? THREE.LoopOnce : THREE.LoopRepeat, hold ? 1 : Infinity);
    next.clampWhenFinished = hold;
    next.paused = false;
    next.play();
    if (previous && previous !== next) next.crossFadeFrom(previous, 0.18, true);
    this.currentAction = name;
  }

  playSlash() {
    if (!this.ready || !this.actions.has('Right_Hand_Sword_Slash')) return;
    this.setAnimation('Right_Hand_Sword_Slash', true);
    const action = this.actions.get('Right_Hand_Sword_Slash');
    action.timeScale = 1.15;
    const duration = action.getClip().duration / action.timeScale;
    this.scene.time.delayedCall(duration * 1000, () => {
      if (!this.disposed && this.ready) {
        this.currentAction = null;
        this.setAnimation(this.moving ? 'Running' : 'Walking', !this.moving);
      }
    });
  }

  setMoving(moving) {
    this.moving = moving;
    if (!this.ready || this.currentAction === 'Right_Hand_Sword_Slash') return;
    if (moving) {
      const action = this.actions.get('Running');
      if (action) action.timeScale = 1.0;
      this.setAnimation('Running');
    } else {
      this.setAnimation('Walking', true);
      const idle = this.actions.get('Walking');
      if (idle) {
        idle.time = Math.min(0.35, idle.getClip().duration * 0.2);
        idle.paused = true;
      }
    }
  }

  resize() {
    if (this.disposed) return;
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
    if (this.disposed) return;
    if (this.mixer && this.currentAction !== 'Walking') this.mixer.update(Math.min(delta, 50) / 1000);
    if (!this.ready) return;

    const width = this.parent.clientWidth;
    const height = this.parent.clientHeight;
    const zoomX = camera2d.zoomX || camera2d.zoom;
    const zoomY = camera2d.zoomY || camera2d.zoom;
    const screenX = camera2d.x + (this.worldX - camera2d.scrollX) * zoomX;
    const screenY = camera2d.y + (this.worldY - camera2d.scrollY) * zoomY;
    this.root.position.set(screenX, height - screenY, 0);
    this.root.scale.setScalar(zoomY);
    this.shadow.scale.set(1, 0.38, 1);
    this.renderer.render(this.scene3d, this.camera);
  }

  setPosition(x, y) {
    this.worldX = x;
    this.worldY = y;
  }

  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    this.scene.time.removeAllEvents();
    this.scene3d.traverse((object) => {
      if (object.isMesh) {
        object.geometry?.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of materials) material?.dispose();
      }
    });
    this.mixer?.stopAllAction();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
