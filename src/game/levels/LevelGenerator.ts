import type {
  LevelData,
  PlatformData,
  EnemyPlacement,
  CollectiblePlacement,
  PowerUpPlacement,
} from "@/types/game";

// ---------------------------------------------------------------------------
// Chunk-based Level Generator
//
// Inspired by classic 2D platformer level design (Mario, Celeste, Spelunky):
//   • Handcrafted reusable "chunks" guarantee every jump is reachable
//   • Ground continuity is enforced at chunk boundaries
//   • Difficulty controls which chunks appear and enemy density
//   • Every gap has stepping-stone platforms within physics reach
//
// Player physics (from Player.ts):
//   jump -580, gravity 800, speed 300, hold 280 ms
//   → tap jump ≈ 3.3 tiles high, hold jump ≈ 4.2 tiles high
//   → horizontal reach ≈ 5-6 tiles during a full jump
//
// All chunks are designed within these limits.
// ---------------------------------------------------------------------------

/** Pure-data definition for a level chunk (section). Positions are in tiles,
 *  relative to the chunk's left edge. Row 0 = top, GROUND_ROW = ground. */
interface ChunkDef {
  name: string;
  /** Width of the chunk in tiles */
  width: number;
  /** Minimum difficulty level (1-3) for this chunk to appear */
  minDiff: number;
  /** Ground segments: [startTile, widthTiles][] — ground at GROUND_ROW */
  ground: [number, number][];
  /** Floating platforms: [startTile, tilesAboveGround, widthTiles][] */
  platforms: [number, number, number][];
  /** Enemy spawn points */
  enemies: {
    tile: number;
    above: number;
    type: "patrol" | "flying";
    dist?: number;
  }[];
  /** Collectible positions: [tile, tilesAboveGround][] */
  coins: [number, number][];
}

// Ground row in a 12-tile-high world (0-indexed)
const G = 11;

// All available level chunks, sorted by difficulty
const CHUNKS: ChunkDef[] = [
  // ═══════════════════════════════════════════════════
  // EASY — Difficulty 1+ (appear in all levels)
  // ═══════════════════════════════════════════════════

  // Flat run with coin arc
  {
    name: "flat_coins",
    width: 8,
    minDiff: 1,
    ground: [[0, 8]],
    platforms: [],
    enemies: [],
    coins: [
      [2, 2],
      [4, 2],
      [6, 2],
    ],
  },

  // Low shelf — easy hop onto a platform for rewards
  {
    name: "low_shelf",
    width: 10,
    minDiff: 1,
    ground: [[0, 10]],
    platforms: [[3, 2, 4]],
    enemies: [],
    coins: [
      [4, 3],
      [6, 3],
    ],
  },

  // Small gap (2 tiles) — baby's first gap jump
  {
    name: "small_gap",
    width: 8,
    minDiff: 1,
    ground: [
      [0, 3],
      [5, 3],
    ],
    platforms: [],
    enemies: [],
    coins: [[4, 2]],
  },

  // Step-up-and-down — platforms ascending then descending
  {
    name: "step_up_down",
    width: 12,
    minDiff: 1,
    ground: [
      [0, 3],
      [9, 3],
    ],
    platforms: [
      [3, 2, 3], // 2 tiles above ground
      [6, 3, 3], // 3 tiles above ground (peak)
    ],
    enemies: [],
    coins: [
      [4, 3],
      [7, 4],
    ],
  },

  // Coin staircase — ground with platforms forming a staircase
  {
    name: "coin_stairs",
    width: 10,
    minDiff: 1,
    ground: [[0, 10]],
    platforms: [
      [2, 2, 2],
      [5, 3, 2],
    ],
    enemies: [],
    coins: [
      [3, 3],
      [6, 4],
      [8, 2],
    ],
  },

  // ═══════════════════════════════════════════════════
  // MEDIUM — Difficulty 2+ (appear in levels 2-3)
  // ═══════════════════════════════════════════════════

  // Bridge across void — stepping stones over a gap
  {
    name: "bridge",
    width: 12,
    minDiff: 2,
    ground: [
      [0, 2],
      [10, 2],
    ],
    platforms: [
      [3, 1, 2], // slightly above ground
      [6, 1, 2],
    ],
    enemies: [{ tile: 5, above: 4, type: "flying" }],
    coins: [
      [4, 2],
      [7, 2],
    ],
  },

  // Enemy alley — ground enemies with overhead escape route
  {
    name: "enemy_alley",
    width: 10,
    minDiff: 2,
    ground: [[0, 10]],
    platforms: [[2, 3, 6]],
    enemies: [
      { tile: 4, above: 1, type: "patrol", dist: 3 },
      { tile: 7, above: 1, type: "patrol", dist: 2 },
    ],
    coins: [
      [4, 4],
      [6, 4],
    ],
  },

  // Tower climb — stacked platforms going up
  {
    name: "tower",
    width: 8,
    minDiff: 2,
    ground: [[0, 8]],
    platforms: [
      [1, 2, 3],
      [4, 4, 3],
      [1, 6, 3],
    ],
    enemies: [],
    coins: [
      [2, 3],
      [5, 5],
      [2, 7],
    ],
  },

  // Wide gap with stepping stone
  {
    name: "wide_gap",
    width: 12,
    minDiff: 2,
    ground: [
      [0, 3],
      [9, 3],
    ],
    platforms: [[5, 1, 2]], // single stepping stone
    enemies: [],
    coins: [
      [6, 3],
      [4, 2],
    ],
  },

  // Platform corridor — no ground, platforms only
  {
    name: "corridor",
    width: 14,
    minDiff: 2,
    ground: [
      [0, 2],
      [12, 2],
    ],
    platforms: [
      [3, 2, 3],
      [7, 2, 3],
      [5, 4, 2], // high reward platform
    ],
    enemies: [],
    coins: [
      [4, 3],
      [8, 3],
      [6, 5],
    ],
  },

  // ═══════════════════════════════════════════════════
  // HARD — Difficulty 3 (appear in level 3 only)
  // ═══════════════════════════════════════════════════

  // Precision platforms — small platforms over a void
  {
    name: "precision",
    width: 14,
    minDiff: 3,
    ground: [
      [0, 2],
      [12, 2],
    ],
    platforms: [
      [3, 1, 2],
      [6, 2, 2],
      [9, 1, 2],
    ],
    enemies: [
      { tile: 5, above: 4, type: "flying" },
      { tile: 8, above: 4, type: "flying" },
    ],
    coins: [
      [4, 2],
      [7, 3],
      [10, 2],
    ],
  },

  // Enemy gauntlet — dodge multiple patrols on ground with overhead escape
  {
    name: "gauntlet",
    width: 14,
    minDiff: 3,
    ground: [[0, 14]],
    platforms: [
      [2, 3, 4],
      [8, 3, 4],
    ],
    enemies: [
      { tile: 3, above: 1, type: "patrol", dist: 4 },
      { tile: 7, above: 1, type: "patrol", dist: 3 },
      { tile: 11, above: 1, type: "patrol", dist: 3 },
    ],
    coins: [
      [3, 4],
      [5, 4],
      [9, 4],
      [11, 4],
    ],
  },

  // Zigzag climb and descend
  {
    name: "zigzag",
    width: 14,
    minDiff: 3,
    ground: [
      [0, 3],
      [11, 3],
    ],
    platforms: [
      [2, 2, 3],
      [5, 4, 3],
      [8, 2, 3],
    ],
    enemies: [{ tile: 6, above: 5, type: "patrol", dist: 2 }],
    coins: [
      [3, 3],
      [6, 5],
      [9, 3],
    ],
  },

  // Double gap with enemies
  {
    name: "double_gap",
    width: 16,
    minDiff: 3,
    ground: [
      [0, 3],
      [6, 4],
      [13, 3],
    ],
    platforms: [
      [4, 1, 2],  // bridge first gap
      [11, 1, 2], // bridge second gap
    ],
    enemies: [
      { tile: 7, above: 1, type: "patrol", dist: 3 },
    ],
    coins: [
      [5, 2],
      [8, 2],
      [12, 2],
    ],
  },
];

// ---------------------------------------------------------------------------

export class LevelGenerator {
  private static readonly TILE = 64;
  private static readonly GROUND_ROW = G;
  private static readonly ROWS = 12;

  static generate(levelIndex: number): LevelData {
    const difficulty = Math.min(levelIndex + 1, 3); // 1, 2, 3
    const ts = this.TILE;

    const platforms: PlatformData[] = [];
    const enemies: EnemyPlacement[] = [];
    const collectibles: CollectiblePlacement[] = [];
    const powerUps: PowerUpPlacement[] = [];

    // Number of middle chunks scales with difficulty
    const chunkCount = 5 + difficulty * 2; // 7, 9, 11

    // ── Intro: safe flat ground ──
    let curX = 0;
    this.addGround(platforms, curX, 8, ts);
    curX += 8;

    // ── Middle: random chunks from the pool ──
    const pool = CHUNKS.filter((c) => c.minDiff <= difficulty);
    let lastChunkName = "";

    // Track midpoint for power-up placement
    const midChunk = Math.floor(chunkCount / 2);

    for (let i = 0; i < chunkCount; i++) {
      // Pick a chunk, avoiding immediate repeats
      let chunk: ChunkDef;
      let tries = 0;
      do {
        chunk = pool[Math.floor(Math.random() * pool.length)];
        tries++;
      } while (chunk.name === lastChunkName && tries < 5);
      lastChunkName = chunk.name;

      this.buildChunk(chunk, curX, ts, difficulty, platforms, enemies, collectibles);

      // Place 1 power-up per level at the midpoint chunk, on an elevated spot
      if (i === midChunk) {
        // Find the highest platform in this chunk, or use a spot 3 tiles above ground
        let puY = (this.GROUND_ROW - 3) * ts;
        if (chunk.platforms.length > 0) {
          // Find highest platform (largest 'above' value)
          const highest = chunk.platforms.reduce((max, p) => p[1] > max[1] ? p : max, chunk.platforms[0]);
          puY = (this.GROUND_ROW - highest[1] - 1) * ts; // 1 tile above the platform
        }
        const puX = (curX + Math.floor(chunk.width / 2)) * ts;
        powerUps.push({ x: puX, y: puY, type: "star" });
      }

      curX += chunk.width;
    }

    // ── Exit: flat ground with portal ──
    this.addGround(platforms, curX, 8, ts);
    const totalWidth = curX + 8;

    return {
      width: totalWidth,
      height: this.ROWS,
      tileSize: ts,
      platforms,
      enemies,
      collectibles,
      powerUps,
      playerStart: {
        x: 3 * ts,
        y: (this.GROUND_ROW - 1) * ts,
      },
      exit: {
        x: (totalWidth - 3) * ts,
        y: this.GROUND_ROW * ts,
      },
      backgroundKey: `bg-level-${levelIndex}`,
      chapterIndex: levelIndex,
    };
  }

  /** Convert a ChunkDef into world-space platforms/enemies/collectibles */
  private static buildChunk(
    chunk: ChunkDef,
    startX: number,
    ts: number,
    difficulty: number,
    platforms: PlatformData[],
    enemies: EnemyPlacement[],
    collectibles: CollectiblePlacement[]
  ): void {
    // Ground segments
    for (const [localX, w] of chunk.ground) {
      this.addGround(platforms, startX + localX, w, ts);
    }

    // Floating platforms
    for (const [localX, aboveGround, w] of chunk.platforms) {
      platforms.push({
        x: (startX + localX) * ts,
        y: (this.GROUND_ROW - aboveGround) * ts,
        width: w * ts,
        height: ts,
        type: "floating",
      });
    }

    // Enemies (scale count with difficulty — skip some on easy)
    for (const e of chunk.enemies) {
      // On difficulty 1, only 50% of enemies spawn; on 2, 75%; on 3, 100%
      if (Math.random() < 0.25 + difficulty * 0.25) {
        const worldX = (startX + e.tile) * ts;
        const worldY = (this.GROUND_ROW - e.above) * ts;

        if (e.type === "patrol") {
          enemies.push({
            x: worldX,
            y: worldY,
            type: "patrol",
            patrolDistance: (e.dist ?? 3) * ts,
          });
        } else {
          enemies.push({
            x: worldX,
            y: worldY,
            type: "flying",
          });
        }
      }
    }

    // Collectibles
    for (const [localX, aboveGround] of chunk.coins) {
      collectibles.push({
        x: (startX + localX) * ts,
        y: (this.GROUND_ROW - aboveGround) * ts,
      });
    }
  }

  /** Add a ground-level platform segment */
  private static addGround(
    platforms: PlatformData[],
    startTile: number,
    widthTiles: number,
    ts: number
  ): void {
    platforms.push({
      x: startTile * ts,
      y: this.GROUND_ROW * ts,
      width: widthTiles * ts,
      height: ts,
      type: "ground",
    });
  }
}
