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

export interface LevelData {
  width: number;
  height: number;
  tileSize: number;
  platforms: PlatformData[];
  enemies: EnemyPlacement[];
  collectibles: CollectiblePlacement[];
  playerStart: { x: number; y: number };
  exit: { x: number; y: number };
  backgroundKey: string;
  chapterIndex: number;
}
