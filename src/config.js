export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const SAVE_KEY = 'colecionador-save-v1';

// Escala de mundo: o alcance de ataque do jogador (2 m) equivale a 150 unidades.
export const PLAYER_ATTACK_RANGE_METERS = 2;
export const PLAYER_ATTACK_RANGE_WORLD_UNITS = 150;
export const WORLD_UNITS_PER_METER = PLAYER_ATTACK_RANGE_WORLD_UNITS / PLAYER_ATTACK_RANGE_METERS;

// Faixas de comportamento dos monstros, todas derivadas da mesma escala.
export const MONSTER_PURSUIT_DISTANCE_METERS = 10;
export const MONSTER_IDLE_DISTANCE_METERS = 30;
export const MONSTER_PURSUIT_DISTANCE_WORLD_UNITS = MONSTER_PURSUIT_DISTANCE_METERS * WORLD_UNITS_PER_METER;
export const MONSTER_IDLE_DISTANCE_WORLD_UNITS = MONSTER_IDLE_DISTANCE_METERS * WORLD_UNITS_PER_METER;