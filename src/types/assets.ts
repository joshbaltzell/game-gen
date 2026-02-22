export interface GeneratedAssets {
  heroIdle: string;
  heroRun: string;
  villain: string;
  enemyA: string;
  enemyB: string;
  collectible: string;
  backgrounds: string[];
  platformTiles: string[];
}

export interface AssetGenerationProgress {
  story: "pending" | "loading" | "complete" | "error";
  heroSprite: "pending" | "loading" | "complete" | "error";
  enemySprites: "pending" | "loading" | "complete" | "error";
  backgrounds: "pending" | "loading" | "complete" | "error";
  tileset: "pending" | "loading" | "complete" | "error";
  processing: "pending" | "loading" | "complete" | "error";
}

export type PipelineStatus = "idle" | "generating" | "ready" | "error";
