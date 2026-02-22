// Flat map of Phaser texture key → base64 image string
// Keys match what Phaser expects: "hero-idle", "enemy-a", "bg-level-0", etc.
export type GeneratedAssets = Record<string, string>;

export type StepStatus = "pending" | "loading" | "complete" | "error";

export interface AssetGenerationStep {
  key: string;
  label: string;
  icon: string;
  phaserKey: string;
  status: StepStatus;
  preview?: string; // base64 for thumbnail
}

export type PipelineStatus = "idle" | "generating" | "ready" | "error";
