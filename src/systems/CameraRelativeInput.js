export function cameraRelativeVector(vector, rotationDegrees) {
  if (!vector || !Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
    throw new TypeError('Movement vector must contain finite x and y values.');
  }
  if (!Number.isFinite(rotationDegrees)) {
    throw new TypeError('Camera rotation must be a finite number.');
  }

  const radians = (rotationDegrees * Math.PI) / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);

  // Camera.rotateTo gira a vista; aplica a rotacao inversa ao vetor da tela
  // para preservar a direcao percebida pelo jogador no mundo.
  return {
    x: (vector.x * cosine) - (vector.y * sine),
    y: (vector.x * sine) + (vector.y * cosine)
  };
}
