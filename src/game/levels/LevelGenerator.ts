import type { LevelData, PlatformData, EnemyPlacement, CollectiblePlacement } from "@/types/game";

export class LevelGenerator {
  private static readonly TILE_SIZE = 64;
  private static readonly LEVEL_HEIGHT = 15;

  static generate(levelIndex: number): LevelData {
    const difficulty = levelIndex + 1;
    const width = 40 + difficulty * 20; // 60, 80, 100 tiles
    const height = this.LEVEL_HEIGHT;
    const tileSize = this.TILE_SIZE;

    const platforms = this.generatePlatforms(width, height, tileSize, difficulty);
    const enemies = this.generateEnemies(platforms, difficulty, tileSize, height);
    const collectibles = this.generateCollectibles(platforms, difficulty, tileSize);

    return {
      width,
      height,
      tileSize,
      platforms,
      enemies,
      collectibles,
      playerStart: {
        x: 2 * tileSize,
        y: (height - 3) * tileSize,
      },
      exit: {
        x: (width - 3) * tileSize,
        y: (height - 2) * tileSize,
      },
      backgroundKey: `bg-level-${levelIndex}`,
      chapterIndex: levelIndex,
    };
  }

  private static generatePlatforms(
    width: number,
    height: number,
    tileSize: number,
    difficulty: number
  ): PlatformData[] {
    const platforms: PlatformData[] = [];

    // Ground floor - full width with some gaps
    let groundX = 0;
    while (groundX < width * tileSize) {
      const segmentWidth = (6 + Math.floor(Math.random() * 12)) * tileSize;

      platforms.push({
        x: groundX,
        y: (height - 1) * tileSize,
        width: segmentWidth,
        height: tileSize,
        type: "ground",
      });

      groundX += segmentWidth;

      // Add gap sometimes (not at the very start)
      if (groundX > 5 * tileSize && Math.random() < 0.3 * difficulty) {
        groundX += (2 + Math.floor(Math.random() * 2)) * tileSize;
      }
    }

    // Floating platforms
    const platformCount = 8 + difficulty * 4;
    for (let i = 0; i < platformCount; i++) {
      const px = (5 + Math.floor(Math.random() * (width - 10))) * tileSize;
      const py = (3 + Math.floor(Math.random() * (height - 6))) * tileSize;
      const pw = (2 + Math.floor(Math.random() * 4)) * tileSize;

      platforms.push({
        x: px,
        y: py,
        width: pw,
        height: tileSize,
        type: "floating",
      });
    }

    // Stepping stones leading to exit
    const exitX = (width - 3) * tileSize;
    for (let step = 0; step < 3; step++) {
      platforms.push({
        x: exitX - (step + 1) * 4 * tileSize,
        y: (height - 3 - step * 2) * tileSize,
        width: 3 * tileSize,
        height: tileSize,
        type: "floating",
      });
    }

    return platforms;
  }

  private static generateEnemies(
    platforms: PlatformData[],
    difficulty: number,
    tileSize: number,
    height: number
  ): EnemyPlacement[] {
    const enemies: EnemyPlacement[] = [];
    const enemyCount = 3 + difficulty * 3;

    // Place patrol enemies on platforms
    const floatingPlatforms = platforms.filter(
      (p) => p.type === "floating" && p.width >= 2 * tileSize
    );

    for (let i = 0; i < Math.min(enemyCount, floatingPlatforms.length); i++) {
      const plat =
        floatingPlatforms[Math.floor(Math.random() * floatingPlatforms.length)];

      if (Math.random() < 0.6) {
        enemies.push({
          x: plat.x + plat.width / 2,
          y: plat.y - tileSize,
          type: "patrol",
          patrolDistance: plat.width / 2,
        });
      } else {
        enemies.push({
          x: plat.x + plat.width / 2,
          y: plat.y - tileSize * 3,
          type: "flying",
        });
      }
    }

    // Add some ground patrol enemies
    const groundEnemies = Math.floor(difficulty * 1.5);
    for (let i = 0; i < groundEnemies; i++) {
      enemies.push({
        x: (10 + i * 12) * tileSize,
        y: (height - 2) * tileSize,
        type: "patrol",
        patrolDistance: 4 * tileSize,
      });
    }

    return enemies;
  }

  private static generateCollectibles(
    platforms: PlatformData[],
    difficulty: number,
    tileSize: number
  ): CollectiblePlacement[] {
    const collectibles: CollectiblePlacement[] = [];
    const count = 8 + difficulty * 3;

    // Place on or above platforms
    const allPlatforms = [...platforms];

    for (let i = 0; i < count; i++) {
      const plat =
        allPlatforms[Math.floor(Math.random() * allPlatforms.length)];
      const cx = plat.x + Math.random() * plat.width;
      const cy = plat.y - tileSize * (1 + Math.floor(Math.random() * 3));

      collectibles.push({ x: cx, y: cy });
    }

    return collectibles;
  }
}
