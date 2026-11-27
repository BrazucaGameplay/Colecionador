import WorldNavigation from './WorldNavigation.js';
import WorldDepthManager from './WorldDepthManager.js';
import WorldCollisionManager from './WorldCollisionManager.js';
import WorldObjectManager from './WorldObjectManager.js';
import { ISLAND_01_LAYOUT } from './map-layout/island-01.js';
import validatedTreeManifest from './map-layout/island-01.validated.json';
import { ISLAND_SHAPE } from './IslandShape.js';
import {
  getTerrainContentHash,
  readWalkableGrid,
  writeWalkableGrid,
  WALKABLE_GRID_ALGORITHM_VERSION
} from './WalkableGridCache.js';

const ISLAND_DIAMETER = 4096;
const OCEAN_MARGIN = 256;
const OCEAN_RADIUS = ISLAND_SHAPE.baseRadius + OCEAN_MARGIN;
const OCEAN_PAN_BUFFER_FACTOR = 1.15;
const MIN_CAMERA_ZOOM = 0.2;

export default class WorldBootstrap {
  constructor(scene) {
    if (!scene) throw new TypeError('WorldBootstrap precisa de uma cena.');
    this.scene = scene;
    this.initialized = false;
  }

  async initialize() {
    const scene = this.scene;
    if (this.initialized) throw new Error('WorldBootstrap já foi inicializado.');

    scene.worldWidth = ISLAND_DIAMETER;
    scene.worldHeight = ISLAND_DIAMETER;
    scene.physics.world.setBounds(0, 0, scene.worldWidth, scene.worldHeight);
    scene.navigation = new WorldNavigation(scene.worldWidth, scene.worldHeight);

    createOceanBackground(scene);
    createGround(scene);
    await createIslandWalkableMask(scene);

    scene.depthManager = new WorldDepthManager();
    scene.collisionManager = new WorldCollisionManager(scene.navigation);
    scene.worldObjectManager = new WorldObjectManager(scene, {
      depthManager: scene.depthManager,
      collisionManager: scene.collisionManager
    });

    const validatedTreeIds = new Set(validatedTreeManifest.treeIds);
    const validatedTreeLayout = ISLAND_01_LAYOUT.filter(definition => validatedTreeIds.has(definition.id));
    scene.worldObjects = scene.worldObjectManager.create(validatedTreeLayout);

    const spawn = scene.navigation.findNearestWalkablePoint(
      scene.worldWidth / 2,
      scene.worldHeight / 2
    );
    if (!spawn) throw new Error('Não foi encontrado um ponto caminhável para iniciar o jogador.');

    this.initialized = true;
    return spawn;
  }

  updateOceanBounds(viewWidth, viewHeight) {
    updateOceanBounds(this.scene, viewWidth, viewHeight);
  }

  destroy() {
    const scene = this.scene;
    if (!scene) return;
    scene.worldObjectManager?.destroy();
    scene.collisionManager?.destroy();
    scene.worldObjects = [];
    scene.groundObject?.destroy();
    scene.groundObject = null;
    scene.terrain = null;
    scene.oceanBackground?.destroy();
    scene.oceanBackground = null;
    scene.worldObjectManager = null;
    scene.collisionManager = null;
    scene.depthManager = null;
    scene.navigation = null;
    this.initialized = false;
    this.scene = null;
  }
}

function createGround(scene) {
    const texture = scene.textures.get('island-terrain');
    const source = texture?.getSourceImage?.();
    if (!source?.width || !source?.height) {
      throw new Error('A imagem principal da ilha não foi carregada.');
    }

    // Um único Image estático representa todo o terreno; a textura original
    // permanece na resolução WebP e é dimensionada apenas no espaço do mundo.
    scene.groundObject = scene.add.image(
      scene.worldWidth / 2,
      scene.worldHeight / 2,
      'island-terrain'
    ).setOrigin(0.5).setDisplaySize(scene.worldWidth, scene.worldHeight).setDepth(-1000).setActive(false);

    scene.terrain = Object.freeze({
      object: scene.groundObject,
      mode: 'single-image',
      textureKey: 'island-terrain',
      sourceWidth: source.width,
      sourceHeight: source.height
    });
  }

async function createIslandWalkableMask(scene) {
    const source = scene.textures.get('island-terrain')?.getSourceImage?.();
    if (!source?.width || !source?.height) {
      throw new Error('Não foi possível gerar a navegação: imagem da ilha indisponível.');
    }

    const maskSize = Math.min(1024, source.width, source.height);
    const threshold = 160;
    const terrainUrl = import.meta.env.BASE_URL +
      'assets/world/terrain/ilha_terreno.webp?v=20261126-ocean-seamless-512-v36';
    const terrainHash = await getTerrainContentHash(terrainUrl);
    const cacheId = terrainHash
      ? [
          'island-walkable',
          'island-geometry-v1',
          'grid-algorithm-' + WALKABLE_GRID_ALGORITHM_VERSION,
          scene.worldWidth + 'x' + scene.worldHeight,
          scene.navigation.cols + 'x' + scene.navigation.rows,
          'cell-24',
          'mask-' + maskSize,
          'alpha-' + threshold,
          'inset-14',
          terrainHash
        ].join(':')
      : null;

    if (cacheId) {
      const cachedGrid = await readWalkableGrid(cacheId, scene.navigation.cols * scene.navigation.rows);
      if (cachedGrid) {
        scene.navigation.setWalkableGrid(cachedGrid);
        scene.walkableGridCacheStatus = 'hit';
        return;
      }
    }

    // Cache ausente/inválido: gera a máscara exatamente pelo processo atual.
    const canvas = document.createElement('canvas');
    canvas.width = maskSize;
    canvas.height = maskSize;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Não foi possível criar a máscara alfa da ilha.');

    try {
      context.clearRect(0, 0, maskSize, maskSize);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(source, 0, 0, maskSize, maskSize);
      const pixels = context.getImageData(0, 0, maskSize, maskSize).data;
      scene.navigation.setAlphaMask(pixels, maskSize, maskSize, threshold);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }

    scene.walkableGridCacheStatus = 'rebuilt';
    scene.walkableGridCacheSaved = cacheId
      ? await writeWalkableGrid(cacheId, scene.navigation.walkableGrid)
      : false;
  }

function updateOceanBounds(scene, viewWidth, viewHeight) {
    const baseDiameter = OCEAN_RADIUS * 2;
    const aspect = Math.max(0.1, viewWidth / Math.max(1, viewHeight));
    // Preserva 256 unidades de mar além da costa em todos os lados.
    // A dimensão maior cresce para acompanhar o formato da tela.
    const width = Math.max(
      (aspect >= 1 ? baseDiameter * aspect : baseDiameter) * OCEAN_PAN_BUFFER_FACTOR,
      viewWidth / MIN_CAMERA_ZOOM * OCEAN_PAN_BUFFER_FACTOR
    );
    const height = Math.max(
      (aspect >= 1 ? baseDiameter : baseDiameter / aspect) * OCEAN_PAN_BUFFER_FACTOR,
      viewHeight / MIN_CAMERA_ZOOM * OCEAN_PAN_BUFFER_FACTOR
    );
    scene.oceanBounds = Object.freeze({
      x: ISLAND_SHAPE.centerX - width / 2,
      y: ISLAND_SHAPE.centerY - height / 2,
      width,
      height
    });

    if (scene.oceanBackground) {
      scene.oceanBackground
        .setPosition(ISLAND_SHAPE.centerX, ISLAND_SHAPE.centerY)
        .setSize(width, height);
    }
  }

function createOceanBackground(scene) {
    const texture = scene.textures.get('ocean-pattern');
    if (!texture?.getSourceImage?.()) {
      throw new Error('A textura original do oceano não foi carregada.');
    }

    // O mundo jogável continua em 4096 x 4096. Só a área visual do oceano
    // é expandida para preencher a proporção do viewport, sem bordas pretas.
    updateOceanBounds(scene, scene.scale.width, scene.scale.height);
    scene.oceanBackground = scene.add.tileSprite(
      ISLAND_SHAPE.centerX,
      ISLAND_SHAPE.centerY,
      scene.oceanBounds.width,
      scene.oceanBounds.height,
      'ocean-pattern'
    ).setOrigin(0.5).setDepth(-1200);

    scene.oceanBackground.setTilePosition(0, 0);
  }

