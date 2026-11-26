export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
export const SAVE_KEY = 'colecionador-save-v1';

// World scale: the player's 2 m attack range equals 150 world units.
export const PLAYER_ATTACK_RANGE_WORLD_UNITS = 150;
export const PLAYER_ATTACK_RANGE_METERS = 2;
export const WORLD_UNITS_PER_METER = PLAYER_ATTACK_RANGE_WORLD_UNITS / PLAYER_ATTACK_RANGE_METERS;
export const MONSTER_ACTIVE_DISTANCE_METERS = 50;
export const MONSTER_ACTIVE_DISTANCE_WORLD_UNITS = MONSTER_ACTIVE_DISTANCE_METERS * WORLD_UNITS_PER_METER;