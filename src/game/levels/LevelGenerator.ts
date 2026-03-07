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
//   jump -720, gravity 1400 (+560 on fall), speed 340, hold 180 ms
//   → tap jump ≈ 2.5 tiles high, hold jump ≈ 3.8 tiles high
//   → horizontal reach ≈ 5 tiles during a full jump
//   → coyote time 80ms, jump buffer 100ms
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
  /** Chunk role for pacing: "breather" chunks give the player a rest */
  role?: "breather" | "combat" | "platforming";
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

  // Flat run with coin arc (breather)
  {
    name: "flat_coins",
    width: 8,
    minDiff: 1,
    role: "breather",
    ground: [[0, 8]],
    platforms: [],
    enemies: [],
    coins: [
      [2, 2],
      [4, 2],
      [6, 2],
    ],
  },

  // Reward room — lots of coins, safe ground (breather)
  {
    name: "reward_room",
    width: 10,
    minDiff: 1,
    role: "breather",
    ground: [[0, 10]],
    platforms: [
      [2, 2, 3],
      [6, 2, 3],
    ],
    enemies: [],
    coins: [
      [2, 1],
      [4, 1],
      [6, 1],
      [8, 1],
      [3, 3],
      [7, 3],
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
    role: "platforming",
    ground: [
      [0, 3],
      [5, 3],
    ],
    platforms: [],
    enemies: [],
    coins: [[4, 2]],
  },

  // First enemy — single easy patrol on flat ground
  {
    name: "first_enemy",
    width: 10,
    minDiff: 1,
    role: "combat",
    ground: [[0, 10]],
    platforms: [[3, 2, 4]],
    enemies: [
      { tile: 6, above: 1, type: "patrol", dist: 2 },
    ],
    coins: [
      [4, 3],
      [6, 3],
    ],
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
    role: "platforming",
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
    role: "combat",
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
    role: "platforming",
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

  // Safe haven — medium breather with coins
  {
    name: "safe_haven",
    width: 8,
    minDiff: 2,
    role: "breather",
    ground: [[0, 8]],
    platforms: [[2, 2, 4]],
    enemies: [],
    coins: [
      [1, 1],
      [3, 3],
      [5, 3],
      [7, 1],
    ],
  },

  // Platform corridor — no ground, platforms only
  {
    name: "corridor",
    width: 14,
    minDiff: 2,
    role: "platforming",
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

  // Hard breather — coin bonanza before the hard stuff
  {
    name: "hard_breather",
    width: 10,
    minDiff: 3,
    role: "breather",
    ground: [[0, 10]],
    platforms: [
      [1, 2, 3],
      [5, 3, 3],
    ],
    enemies: [],
    coins: [
      [2, 3],
      [4, 1],
      [6, 4],
      [8, 1],
    ],
  },

  // Precision platforms — small platforms over a void
  {
    name: "precision",
    width: 14,
    minDiff: 3,
    role: "platforming",
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
    role: "combat",
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

  // ═══════════════════════════════════════════════════
  // EXTRA HARD — Difficulty 2+ and 3 (tighter platforming)
  // ═══════════════════════════════════════════════════

  // Pit run — consecutive small gaps with enemies between
  {
    name: "pit_run",
    width: 16,
    minDiff: 2,
    role: "combat",
    ground: [
      [0, 2],
      [4, 2],
      [8, 2],
      [12, 2],
      [14, 2],
    ],
    platforms: [],
    enemies: [
      { tile: 5, above: 1, type: "patrol", dist: 1 },
      { tile: 9, above: 1, type: "patrol", dist: 1 },
      { tile: 13, above: 1, type: "patrol", dist: 1 },
    ],
    coins: [
      [3, 2],
      [7, 2],
      [11, 2],
    ],
  },

  // Sentry towers — stacked enemies on platforms
  {
    name: "sentry_towers",
    width: 12,
    minDiff: 2,
    role: "combat",
    ground: [[0, 12]],
    platforms: [
      [2, 2, 2],
      [5, 3, 2],
      [8, 2, 2],
    ],
    enemies: [
      { tile: 3, above: 3, type: "patrol", dist: 1 },
      { tile: 6, above: 4, type: "patrol", dist: 1 },
      { tile: 9, above: 3, type: "patrol", dist: 1 },
      { tile: 6, above: 6, type: "flying" },
    ],
    coins: [
      [3, 4],
      [6, 5],
      [9, 4],
    ],
  },

  // Leap of faith — wide gaps with tiny landing zones
  {
    name: "leap_of_faith",
    width: 16,
    minDiff: 3,
    ground: [
      [0, 2],
      [14, 2],
    ],
    platforms: [
      [4, 1, 1],
      [7, 2, 1],
      [10, 1, 1],
    ],
    enemies: [
      { tile: 6, above: 4, type: "flying" },
      { tile: 9, above: 3, type: "flying" },
    ],
    coins: [
      [4, 2],
      [7, 3],
      [10, 2],
    ],
  },

  // Gauntlet v2 — ground enemies with flying sentries above
  {
    name: "gauntlet_v2",
    width: 16,
    minDiff: 3,
    ground: [[0, 16]],
    platforms: [
      [3, 3, 3],
      [9, 3, 3],
    ],
    enemies: [
      { tile: 2, above: 1, type: "patrol", dist: 2 },
      { tile: 6, above: 1, type: "patrol", dist: 2 },
      { tile: 10, above: 1, type: "patrol", dist: 2 },
      { tile: 13, above: 1, type: "patrol", dist: 2 },
      { tile: 5, above: 5, type: "flying" },
      { tile: 11, above: 5, type: "flying" },
    ],
    coins: [
      [4, 4],
      [7, 2],
      [10, 4],
      [14, 2],
    ],
  },

  // Cascade drop — descending platforms over void
  {
    name: "cascade",
    width: 14,
    minDiff: 3,
    ground: [
      [0, 2],
      [12, 2],
    ],
    platforms: [
      [3, 3, 2],
      [6, 2, 2],
      [9, 1, 2],
    ],
    enemies: [
      { tile: 4, above: 4, type: "flying" },
      { tile: 7, above: 3, type: "flying" },
    ],
    coins: [
      [4, 4],
      [7, 3],
      [10, 2],
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
    const chunkCount = 6 + difficulty * 3; // 9, 12, 15

    // ── Intro: safe flat ground ──
    let curX = 0;
    this.addGround(platforms, curX, 8, ts);
    curX += 8;

    // ── Middle: paced chunks from the pool ──
    const pool = CHUNKS.filter((c) => c.minDiff <= difficulty);
    const breathers = pool.filter((c) => c.role === "breather");
    const challenges = pool.filter((c) => c.role !== "breather");
    let lastChunkName = "";
    let sinceBreather = 0;

    // Track positions for power-up/weapon placement
    const midChunk = Math.floor(chunkCount / 2);
    const quarterChunk = Math.floor(chunkCount / 4);
    const threeQuarterChunk = Math.floor(chunkCount * 3 / 4);

    for (let i = 0; i < chunkCount; i++) {
      // Insert breather every 3-4 challenge chunks for good pacing
      const needsBreather = sinceBreather >= 3 && breathers.length > 0;

      let chunk: ChunkDef;
      let tries = 0;
      const sourcePool = needsBreather ? breathers : challenges.length > 0 ? challenges : pool;

      do {
        chunk = sourcePool[Math.floor(Math.random() * sourcePool.length)];
        tries++;
      } while (chunk.name === lastChunkName && tries < 5);
      lastChunkName = chunk.name;

      if (chunk.role === "breather") {
        sinceBreather = 0;
      } else {
        sinceBreather++;
      }

      this.buildChunk(chunk, curX, ts, difficulty, platforms, enemies, collectibles);

      // Place star power-up at midpoint
      if (i === midChunk) {
        let puY = (this.GROUND_ROW - 3) * ts;
        if (chunk.platforms.length > 0) {
          const highest = chunk.platforms.reduce((max, p) => p[1] > max[1] ? p : max, chunk.platforms[0]);
          puY = (this.GROUND_ROW - highest[1] - 1) * ts;
        }
        const puX = (curX + Math.floor(chunk.width / 2)) * ts;
        powerUps.push({ x: puX, y: puY, type: "star" });
      }

      // Place weapon pickups at 1/4 and 3/4 through the level
      if (i === quarterChunk || i === threeQuarterChunk) {
        const wpX = (curX + Math.floor(chunk.width / 2)) * ts;
        const wpY = (this.GROUND_ROW - 2) * ts;
        powerUps.push({ x: wpX, y: wpY, type: "weapon" });
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
      // On difficulty 1, 70% of enemies spawn; on 2, 85%; on 3, 100%
      if (Math.random() < 0.55 + difficulty * 0.15) {
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
