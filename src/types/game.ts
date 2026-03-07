export interface PlatformData {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "ground" | "floating" | "moving";
}

export interface EnemyPlacement {
  x: number;
  y: number;
  type: "patrol" | "flying";
  patrolDistance?: number;
}

export interface CollectiblePlacement {
  x: number;
  y: number;
}

export type WeaponType = "fireball" | "boomerang" | "wave";

export type BossType = "charger" | "orbiter" | "overlord";

export interface BossPlacement {
  x: number;
  y: number;
  type: BossType;
}

export interface PowerUpPlacement {
  x: number;
  y: number;
  type: "star" | "weapon";
}

export interface LevelData {
  width: number;
  height: number;
  tileSize: number;
  platforms: PlatformData[];
  enemies: EnemyPlacement[];
  collectibles: CollectiblePlacement[];
  powerUps: PowerUpPlacement[];
  playerStart: { x: number; y: number };
  exit: { x: number; y: number };
  boss?: BossPlacement;
  backgroundKey: string;
  chapterIndex: number;
}
