/**
 * Renderizador da ilha inicial.
 *
 * WebGL: um único Shader Game Object, três texturas existentes e regiões
 * determinísticas desenhadas no shader. Não cria canvas, TileSprite,
 * GeometryMask, textura intermediária nem objetos por região.
 *
 * Canvas fallback: círculo simples para manter a silhueta correta em
 * navegadores sem WebGL. O caminho principal Android usa WebGL.
 */

export const TERRAIN_REGIONS = Object.freeze([
  { material: 'grass', x: 0.28, y: 0.28, rx: 0.13, ry: 0.09 },
  { material: 'grass', x: 0.69, y: 0.30, rx: 0.12, ry: 0.10 },
  { material: 'grass', x: 0.50, y: 0.50, rx: 0.14, ry: 0.10 },
  { material: 'grass', x: 0.31, y: 0.72, rx: 0.13, ry: 0.09 },
  { material: 'grass', x: 0.70, y: 0.70, rx: 0.12, ry: 0.09 },
  { material: 'relief', x: 0.48, y: 0.25, rx: 0.10, ry: 0.08 },
  { material: 'relief', x: 0.73, y: 0.51, rx: 0.10, ry: 0.08 },
  { material: 'relief', x: 0.31, y: 0.52, rx: 0.09, ry: 0.07 },
  { material: 'relief', x: 0.53, y: 0.76, rx: 0.10, ry: 0.07 }
].map(Object.freeze));

function smoothstep(edge0, edge1, value) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function ellipseMask(u, v, region) {
  const dx = (u - region.x) / region.rx;
  const dy = (v - region.y) / region.ry;
  return 1 - smoothstep(0.88, 1.12, Math.hypot(dx, dy));
}

/** Classificação determinística usada para validar o desenho das regiões. */
export function getTerrainMaterialAt(u, v) {
  if (((u - 0.5) ** 2 + (v - 0.5) ** 2) > 0.25) return 'ocean';
  const grass = Math.max(0, ...TERRAIN_REGIONS
    .filter(region => region.material === 'grass')
    .map(region => ellipseMask(u, v, region)));
  const relief = Math.max(0, ...TERRAIN_REGIONS
    .filter(region => region.material === 'relief')
    .map(region => ellipseMask(u, v, region)));
  if (relief >= 0.5) return 'relief';
  if (grass >= 0.5) return 'grass';
  return 'smooth';
}

function buildMaskExpression(material) {
  const regions = TERRAIN_REGIONS.filter(region => region.material === material);
  return regions.map(region => (
    'ellipseMask(uv, vec2(' + region.x.toFixed(4) + ', ' + region.y.toFixed(4)
    + '), vec2(' + region.rx.toFixed(4) + ', ' + region.ry.toFixed(4) + '))'
  )).reduce((expression, item) => expression ? 'max(' + expression + ', ' + item + ')' : item, '');
}

export function buildIslandTerrainShader() {
  return `
precision mediump float;

uniform sampler2D uSmooth;
uniform sampler2D uGrass;
uniform sampler2D uRelief;
varying vec2 outTexCoord;

float ellipseMask(vec2 point, vec2 center, vec2 radius) {
  vec2 delta = (point - center) / radius;
  float distanceSquared = dot(delta, delta);
  return 1.0 - smoothstep(0.7744, 1.2544, distanceSquared);
}

vec2 mirroredRepeat(vec2 point) {
  vec2 cell = mod(point, 2.0);
  return 1.0 - abs(cell - 1.0);
}

void main() {
  vec2 uv = outTexCoord;
  vec2 centered = (uv - vec2(0.5)) * 2.0;
  float radius = length(centered);

  // Recorte circular feito por fragmento: funciona no WebGL do Phaser 4.
  float islandAlpha = 1.0 - smoothstep(0.998, 1.0, radius);

  // Repetição espelhada evita emendas duras nas bordas das texturas.
  vec2 tileUV = mirroredRepeat(uv * 4.0);
  float grassMask = ${buildMaskExpression('grass')};
  float reliefMask = ${buildMaskExpression('relief')};

  // Amostra somente o material ativo naquela regiao; a base custa uma
  // amostra, e os overlays so adicionam leitura onde realmente aparecem.
  vec3 terrainColor = texture2D(uSmooth, tileUV).rgb;
  if (grassMask > 0.001) {
    terrainColor = mix(terrainColor, texture2D(uGrass, tileUV).rgb, grassMask);
  }
  if (reliefMask > 0.001) {
    terrainColor = mix(terrainColor, texture2D(uRelief, tileUV).rgb, reliefMask);
  }

  gl_FragColor = vec4(terrainColor, islandAlpha);
}
`;
}

export function createIslandTerrain(scene, {
  diameter = 4096,
  smoothKey = 'terrain-smooth',
  grassKey = 'terrain-grass',
  reliefKey = 'terrain-relief'
} = {}) {
  const renderer = scene.sys.game.renderer;

  if (renderer?.gl) {
    const shader = scene.add.shader({
      name: 'island-terrain-v1',
      fragmentSource: buildIslandTerrainShader(),
      initialUniforms: {
        uSmooth: 0,
        uGrass: 1,
        uRelief: 2
      }
    }, 0, 0, diameter, diameter, [smoothKey, grassKey, reliefKey])
      .setOrigin(0, 0)
      .setDepth(-1000);

    return Object.freeze({ object: shader, mode: 'webgl-shader', drawCalls: 1 });
  }

  // Fallback deliberadamente simples: não deixa um quadrado substituir a ilha.
  const circle = scene.add.circle(
    diameter / 2,
    diameter / 2,
    diameter / 2 - 2,
    0x4c963b
  ).setDepth(-1000);

  return Object.freeze({ object: circle, mode: 'canvas-fallback', drawCalls: 1 });
}
