/**
 * Remove árvores cuja copa ou tronco invada o oceano/borda da ilha.
 * A posição original nunca é alterada: cada definição é mantida ou descartada.
 * A validação roda uma única vez na criação da cena, usando a máscara alfa
 * já pré-calculada da imagem principal do terreno.
 */
export function isTreeFullyInsideLand(definition, navigation, textures, safetyMargin = 24) {
  if (!definition || !navigation || typeof navigation.isInsideIsland !== 'function') return false;
  const source = textures?.get?.(definition.assetKey)?.getSourceImage?.();
  if (!source?.width || !source?.height) return false;

  const height = Number(definition.targetHeight) || source.height * (Number(definition.scale) || 1);
  const width = height * source.width / source.height;
  const radiusX = width * 0.43 + safetyMargin;
  const radiusY = height * 0.47 + safetyMargin;
  const centerY = definition.y - height * 0.52;
  const samples = [];

  // Vários pontos distribuídos no contorno e no interior da silhueta elíptica.
  // O teste conservador evita copas cortadas pela costa, inclusive em zoom.
  for (const ring of [0.55, 0.82, 1]) {
    const count = ring === 1 ? 16 : 8;
    for (let index = 0; index < count; index++) {
      const angle = (index / count) * Math.PI * 2;
      samples.push({
        x: definition.x + Math.cos(angle) * radiusX * ring,
        y: centerY + Math.sin(angle) * radiusY * ring
      });
    }
  }
  samples.push({ x: definition.x, y: centerY });
  samples.push({ x: definition.x, y: definition.y - height * 0.08 });

  return samples.every(point => navigation.isInsideIsland(point.x, point.y));
}

export function filterTreesToIslandLand(layout, navigation, textures, safetyMargin = 24) {
  return layout.filter(definition =>
    isTreeFullyInsideLand(definition, navigation, textures, safetyMargin)
  );
}
