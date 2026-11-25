import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { findOpaqueBottomRow, findOpaqueTopRow, getGroundedFitY, getOpaqueBottomPivot } from './frame-grounding.js';

const $ = (id) => document.getElementById(id);
const canvas = $('preview');
const previewRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
previewRenderer.setPixelRatio(1);
previewRenderer.setClearColor(0x000000, 0);
previewRenderer.outputColorSpace = THREE.SRGBColorSpace;
previewRenderer.toneMapping = THREE.ACESFilmicToneMapping;
previewRenderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1.15, 1.15, 1.15, -1.15, 0.01, 1000);
camera.position.set(0, 0.99, 5.5);
camera.lookAt(0, 0.99, 0);
scene.add(new THREE.HemisphereLight(0xffffff, 0x657080, 2.1));
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(-3, 5, 4);
scene.add(key);
const fill = new THREE.DirectionalLight(0x9bbcff, 0.8);
fill.position.set(3, 2, -3);
scene.add(fill);

const root = new THREE.Group();
scene.add(root);
// Keep fitting transforms outside the animated GLTF root. Some clips animate
// the GLTF scene position and would otherwise overwrite the ground alignment.
const fitGroup = new THREE.Group();
root.add(fitGroup);
let mixer = null;
let gltfData = null;
let model = null;
let modelBaseTransform = null;
let fitBasePosition = new THREE.Vector3();
let clips = [];
let selected = new Set();
let frameHeightWorld = 1;
let pivotY = 0;
let currentAnimation = null;
let animationFrame = 0;
let busy = false;

function status(message) { $('status').textContent = message; }
function renderPreview() { previewRenderer.render(scene, camera); }

function disposeCurrent() {
  if (mixer && model) mixer.uncacheRoot(model);
  mixer = null;
  if (model) {
    fitGroup.remove(model);
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.geometry?.dispose();
      for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
        if (!m) continue;
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        m.dispose();
      }
    });
  }
  model = null;
  modelBaseTransform = null;
  fitBasePosition.set(0, 0, 0);
  clips = [];
  selected.clear();
}

function fitModel(object) {
  fitGroup.position.set(0, 0, 0);
  fitGroup.scale.setScalar(1);
  root.rotation.set(0, 0, 0);
  object.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(object);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bounds.getSize(size);
  bounds.getCenter(center);
  const height = Math.max(size.y, 0.0001);
  const scale = 1.8 / height;
  fitGroup.scale.setScalar(scale);
  fitGroup.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
  fitGroup.updateMatrixWorld(true);
  object.updateMatrixWorld(true);
  const fitted = new THREE.Box3().setFromObject(object);
  frameHeightWorld = Math.max(fitted.max.y - fitted.min.y, 0.01);
  pivotY = fitted.min.y;
  fitBasePosition.copy(fitGroup.position);
  modelBaseTransform = {
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone()
  };
}

function buildClipList() {
  const host = $('clips');
  host.replaceChildren();
  clips.forEach((clip, index) => {
    const label = document.createElement('label');
    label.className = 'clip';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = selected.has(index);
    input.addEventListener('change', () => input.checked ? selected.add(index) : selected.delete(index));
    const text = document.createElement('span');
    text.textContent = clip.name + ' · ' + clip.duration.toFixed(2) + 's';
    label.append(input, text);
    host.append(label);
  });
}

async function loadModel() {
  if (busy) return;
  busy = true;
  $('load').disabled = true;
  $('bake').disabled = true;
  status('Carregando GLB…');
  try {
    disposeCurrent();
    const url = import.meta.env.BASE_URL + $('model').value;
    const gltf = await new GLTFLoader().loadAsync(url);
    gltfData = gltf;
    model = gltf.scene;
    fitGroup.add(model);
    fitModel(model);
    clips = gltf.animations || [];
    if (!clips.length) throw new Error('Este GLB não contém animações.');
    mixer = new THREE.AnimationMixer(model);
    clips.forEach((clip, i) => selected.add(i));
    buildClipList();
    $('bake').disabled = false;
    status('Modelo carregado. ' + clips.length + ' animação(ões) encontrada(s): ' + clips.map(c => c.name).join(', '));
    playPreview(0);
  } catch (error) {
    status('Falha ao carregar: ' + (error?.message || error));
    console.error(error);
  } finally {
    busy = false;
    $('load').disabled = false;
  }
}

function playPreview(index) {
  if (!mixer || !clips[index]) return;
  mixer.stopAllAction();
  const action = mixer.clipAction(clips[index]);
  action.reset().play();
  mixer.setTime(0);
  currentAnimation = action;
  renderPreview();
}

function makeFrame(position, yaw, frameSize, verticalOffset = 0) {
  mixer.stopAllAction();
  const action = mixer.clipAction(currentClip);
  action.reset();
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();
  mixer.setTime(position);
  // O deslocamento de raiz dos GLBs não deve mover o sprite dentro do quadro:
  // o mundo controla a posição do protagonista, e cada pose é apoiada no chão.
  model.position.copy(modelBaseTransform.position);
  model.quaternion.copy(modelBaseTransform.quaternion);
  model.scale.copy(modelBaseTransform.scale);
  fitGroup.position.copy(fitBasePosition);
  root.rotation.y = yaw;
  fitGroup.updateMatrixWorld(true);
  model.updateMatrixWorld(true);
  // Box3 usa os bounds estáticos da geometria se não atualizarmos o SkinnedMesh.
  // Recalcula a caixa com os ossos já avaliados para capturar os pés na pose atual.
  model.traverse((node) => {
    if (!node.isSkinnedMesh) return;
    node.skeleton?.update();
    node.computeBoundingBox();
  });
  const poseBounds = new THREE.Box3().setFromObject(model);
  if (!Number.isFinite(poseBounds.min.y)) throw new Error('Não foi possível calcular o ponto de apoio da pose.');
  fitGroup.position.y = getGroundedFitY(fitBasePosition.y, poseBounds.min.y);
  fitGroup.updateMatrixWorld(true);
  model.updateMatrixWorld(true);
  // Desloca o enquadramento da câmera (não a raiz animada) para alinhar a
  // margem inferior com o limite real dos pixels renderizados.
  const cameraBaseY = (camera.top + camera.bottom) / 2;
  camera.position.y = cameraBaseY - verticalOffset;
  camera.lookAt(0, cameraBaseY - verticalOffset, 0);
  camera.updateMatrixWorld(true);
  renderPreview();

  const frame = document.createElement('canvas');
  frame.width = frameSize;
  frame.height = frameSize;
  const ctx = frame.getContext('2d');
  const source = previewRenderer.domElement;
  const sourceSize = Math.min(source.width, source.height);
  const cropX = Math.floor((source.width - sourceSize) / 2);
  const cropY = Math.floor((source.height - sourceSize) / 2);
  ctx.drawImage(source, cropX, cropY, sourceSize, sourceSize, 0, 0, frameSize, frameSize);
  return frame;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function safeName(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

let currentClip = null;
async function bakeClip(index) {
  currentClip = clips[index];
  const fps = Math.max(1, Math.min(30, Number($('fps').value) || 12));
  const frameSize = Math.max(64, Math.min(256, Number($('width').value) || 128));
  const directions = Number($('directions').value);
  const scalePercent = Math.max(40, Math.min(100, Number($('scale').value) || 78)) / 100;
  const duration = currentClip.duration;
  const frameCount = Math.max(1, Math.ceil(duration * fps));
  const totalFrames = frameCount * directions;
  const columns = Math.min(16, totalFrames);
  const rows = Math.ceil(totalFrames / columns);
  const atlasWidth = columns * frameSize;
  const atlasHeight = rows * frameSize;
  if (atlasWidth > 4096 || atlasHeight > 4096 || totalFrames > 512) {
    throw new Error('Atlas muito grande (' + atlasWidth + '×' + atlasHeight + '). Reduza FPS, tamanho ou direções.');
  }

  const oldSize = previewRenderer.getSize(new THREE.Vector2());
  previewRenderer.setSize(frameSize, frameSize, false);
  const viewHeight = 1.8 / scalePercent;
  // Reserve visible space below the feet; the old 8% framing placed opaque
  // pixels on the final atlas row and visually clipped the character.
  const viewBottom = -viewHeight * 0.16;
  const viewTop = viewBottom + viewHeight;
  camera.left = -viewHeight / 2;
  camera.right = viewHeight / 2;
  camera.top = viewTop;
  camera.bottom = viewBottom;
  camera.position.set(0, (viewTop + viewBottom) / 2, 5.5);
  camera.lookAt(0, (viewTop + viewBottom) / 2, 0);
  camera.updateProjectionMatrix();

  const atlas = document.createElement('canvas');
  atlas.width = atlasWidth;
  atlas.height = atlasHeight;
  const ctx = atlas.getContext('2d');
  const frames = [];
  let frameIndex = 0;
  const yawStep = (Math.PI * 2) / directions;

  for (let d = 0; d < directions; d++) {
    const yaw = d * yawStep;
    for (let f = 0; f < frameCount; f++) {
      const time = Math.min(f / fps, Math.max(0, duration - 0.0001));
      const safeBottomRow = frameSize - 8;
      let verticalOffset = 0;
      let tile = makeFrame(time, yaw, frameSize, verticalOffset);
      let pixels = tile.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, frameSize, frameSize).data;
      let bottomOpaqueRow = findOpaqueBottomRow(pixels, frameSize, frameSize, 24);
      let topOpaqueRow = findOpaqueTopRow(pixels, frameSize, frameSize, 24);

      // A caixa geométrica pode não incluir a deformação final dos ossos.
      // Os pixels renderizados são a referência final: sobe a pose em passos
      // calculados pela projeção para reservar margem real abaixo dos pés.
      for (let attempt = 0; bottomOpaqueRow > safeBottomRow && attempt < 3; attempt++) {
        const overflowPixels = bottomOpaqueRow - safeBottomRow + 1;
        verticalOffset += overflowPixels * viewHeight / frameSize;
        tile = makeFrame(time, yaw, frameSize, verticalOffset);
        pixels = tile.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, frameSize, frameSize).data;
        bottomOpaqueRow = findOpaqueBottomRow(pixels, frameSize, frameSize, 24);
        topOpaqueRow = findOpaqueTopRow(pixels, frameSize, frameSize, 24);
      }

      if (bottomOpaqueRow > safeBottomRow || (topOpaqueRow >= 0 && topOpaqueRow < 2)) {
        throw new Error(
          `Quadro ${currentClip.name} d${d}-f${f} não cabe com margem segura: ` +
          `topo=${topOpaqueRow}, base=${bottomOpaqueRow}, limite inferior=${safeBottomRow}, deslocamento=${verticalOffset.toFixed(4)}.`
        );
      }
      const framePivotY = getOpaqueBottomPivot(bottomOpaqueRow, frameSize);
      const x = (frameIndex % columns) * frameSize;
      const y = Math.floor(frameIndex / columns) * frameSize;
      ctx.drawImage(tile, x, y);
      frames.push({ filename: currentClip.name, frame: f, direction: d, x, y, width: frameSize, height: frameSize, duration: 1 / fps, pivotX: 0.5, pivotY: framePivotY });
      frameIndex++;
      if (frameIndex % 8 === 0) {
        status('Exportando ' + currentClip.name + ': ' + frameIndex + '/' + totalFrames + ' quadros…');
        await new Promise(resolve => requestAnimationFrame(resolve));
      }
    }
  }

  const png = await new Promise(resolve => atlas.toBlob(resolve, 'image/png'));
  if (!png) throw new Error('O navegador não conseguiu codificar o PNG.');
  const prefix = safeName($('model').selectedOptions[0].dataset.exportPrefix || $('model').selectedOptions[0].textContent);
  const animationName = safeName(currentClip.name);
  downloadBlob(png, prefix + '-' + animationName + '.png');
  const metadata = {
    schema: 'colecionador.sprite-atlas.v1',
    source: import.meta.env.BASE_URL + $('model').value,
    animation: currentClip.name,
    fps,
    frameSize: { width: frameSize, height: frameSize },
    frameCount,
    directionCount: directions,
    atlas: { width: atlasWidth, height: atlasHeight, columns, rows },
    pivot: { x: 0.5, y: 0.84, mode: 'per-frame-opaque-bottom' },
    rootMotion: 'normalized-to-ground; gameplay controls world movement',
    frames
  };
  downloadBlob(new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' }), prefix + '-' + animationName + '.json');

  previewRenderer.setSize(oldSize.x, oldSize.y, false);
  return totalFrames;
}

// API usada pelo GitHub Actions para gerar os arquivos sem intervenção manual.
window.__characterBaker = {
  async loadModel(path) {
    $('model').value = path;
    await loadModel();
    if (!model || !clips.length) throw new Error('Não foi possível carregar animações de ' + path);
    return clips.map((clip, index) => ({ index, name: clip.name, duration: clip.duration }));
  },
  async bakeAll() {
    if (!model || !clips.length) throw new Error('Nenhum modelo carregado.');
    selected = new Set(clips.map((_, index) => index));
    const jobs = [...selected];
    for (let i = 0; i < jobs.length; i++) {
      await bakeClip(jobs[i]);
      status('Concluído: ' + (i + 1) + '/' + jobs.length + ' animações exportadas.');
    }
    return jobs.length;
  }
};

$('load').addEventListener('click', loadModel);
$('all').addEventListener('click', () => {
  selected = new Set(clips.map((_, i) => i));
  buildClipList();
});
$('bake').addEventListener('click', async () => {
  if (busy || !selected.size) return;
  busy = true;
  $('bake').disabled = true;
  $('load').disabled = true;
  try {
    const jobs = [...selected];
    for (let i = 0; i < jobs.length; i++) {
      await bakeClip(jobs[i]);
      status('Concluído: ' + (i + 1) + '/' + jobs.length + ' animações exportadas.');
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    status('Bake concluído. PNG e JSON foram baixados para cada animação selecionada.');
  } catch (error) {
    status('Bake interrompido: ' + (error?.message || error));
    console.error(error);
  } finally {
    busy = false;
    $('bake').disabled = false;
    $('load').disabled = false;
  }
});

previewRenderer.setSize(512, 512, false);
renderPreview();
loadModel();
