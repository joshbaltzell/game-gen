import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { Player } from "../entities/Player";
import { PatrolEnemy } from "../entities/PatrolEnemy";
import { FlyingEnemy } from "../entities/FlyingEnemy";
import { Collectible } from "../entities/Collectible";
import { TouchControls } from "../systems/TouchControls";
import { LevelGenerator } from "../levels/LevelGenerator";
import type { LevelData } from "@/types/game";

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private collectibles!: Phaser.GameObjects.Group;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private exitPortal!: Phaser.GameObjects.Sprite;
  private controls!: TouchControls;
  private levelData!: LevelData;
  private levelIndex: number = 0;
  private score: number = 0;
  private collectiblesFound: number = 0;
  private totalCollectibles: number = 0;
  private lives: number = 3;
  private isLevelComplete: boolean = false;

  constructor() {
    super("GameScene");
  }

  init(data: { levelIndex?: number }): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.isLevelComplete = false;
    this.collectiblesFound = 0;
  }

  create(): void {
    this.levelData = LevelGenerator.generate(this.levelIndex);

    // Background
    const { width, height } = this.scale;
    const bgKey = this.textures.exists(this.levelData.backgroundKey)
      ? this.levelData.backgroundKey
      : null;

    if (bgKey) {
      this.add
        .image(0, 0, bgKey)
        .setOrigin(0, 0)
        .setDisplaySize(
          this.levelData.width * this.levelData.tileSize,
          this.levelData.height * this.levelData.tileSize
        )
        .setScrollFactor(0.5);
    } else {
      // Gradient background fallback
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e);
      bg.fillRect(0, 0, width, height);
      bg.setScrollFactor(0);
    }

    // Create platforms
    this.platforms = this.physics.add.staticGroup();
    this.buildPlatforms();

    // Create player
    this.player = new Player(
      this,
      this.levelData.playerStart.x,
      this.levelData.playerStart.y
    );

    // Create enemies
    this.enemies = this.add.group();
    this.spawnEnemies();

    // Create collectibles
    this.collectibles = this.add.group();
    this.spawnCollectibles();
    this.totalCollectibles = this.levelData.collectibles.length;

    // Create exit portal
    this.exitPortal = this.add
      .sprite(this.levelData.exit.x, this.levelData.exit.y, "exit-portal")
      .setOrigin(0.5, 1);

    this.physics.add.existing(this.exitPortal, true);

    // Collisions
    this.physics.add.collider(this.player.sprite, this.platforms);
    this.physics.add.overlap(
      this.player.sprite,
      this.collectibles,
      this.onCollectItem as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player.sprite,
      this.exitPortal,
      this.onReachExit as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player.sprite,
      this.enemies,
      this.onEnemyContact as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Camera
    const worldWidth = this.levelData.width * this.levelData.tileSize;
    const worldHeight = this.levelData.height * this.levelData.tileSize;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // Controls
    this.controls = new TouchControls(this);

    // HUD updates
    EventBus.emit("level-started", {
      level: this.levelIndex + 1,
      totalCollectibles: this.totalCollectibles,
    });
    EventBus.emit("current-scene-ready", this);
  }

  update(): void {
    if (this.isLevelComplete) return;

    this.player.update(this.controls);

    // Check if player fell off the world
    const worldHeight = this.levelData.height * this.levelData.tileSize;
    if (this.player.sprite.y > worldHeight + 100) {
      this.onPlayerDeath();
    }
  }

  private buildPlatforms(): void {
    for (const platform of this.levelData.platforms) {
      const tileKey = this.textures.exists("platform-tile-0")
        ? "platform-tile-0"
        : "platform-tile-0";

      const tilesNeeded = Math.ceil(platform.width / this.levelData.tileSize);
      for (let i = 0; i < tilesNeeded; i++) {
        const tile = this.platforms.create(
          platform.x + i * this.levelData.tileSize + this.levelData.tileSize / 2,
          platform.y + this.levelData.tileSize / 2,
          tileKey
        ) as Phaser.Physics.Arcade.Sprite;
        tile.setDisplaySize(this.levelData.tileSize, this.levelData.tileSize);
        tile.refreshBody();
      }
    }
  }

  private spawnEnemies(): void {
    for (const enemyData of this.levelData.enemies) {
      if (enemyData.type === "patrol") {
        const enemy = new PatrolEnemy(
          this,
          enemyData.x,
          enemyData.y,
          enemyData.patrolDistance ?? 150
        );
        this.enemies.add(enemy.sprite);
        this.physics.add.collider(enemy.sprite, this.platforms);
      } else {
        const enemy = new FlyingEnemy(this, enemyData.x, enemyData.y);
        this.enemies.add(enemy.sprite);
      }
    }
  }

  private spawnCollectibles(): void {
    for (const col of this.levelData.collectibles) {
      const collectible = new Collectible(this, col.x, col.y);
      this.collectibles.add(collectible.sprite);
    }
  }

  private onCollectItem = (
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    item: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void => {
    const sprite = item as Phaser.Physics.Arcade.Sprite;
    sprite.destroy();
    this.collectiblesFound++;
    this.score += 100;
    EventBus.emit("item-collected", {
      collected: this.collectiblesFound,
      total: this.totalCollectibles,
      score: this.score,
    });
  };

  private onReachExit = (): void => {
    if (this.isLevelComplete) return;
    this.isLevelComplete = true;

    EventBus.emit("level-complete", {
      level: this.levelIndex + 1,
      score: this.score,
      collectibles: this.collectiblesFound,
    });

    this.time.delayedCall(1000, () => {
      // Check if there are more levels
      if (this.levelIndex < 2) {
        this.scene.start("LevelTransitionScene", {
          nextLevelIndex: this.levelIndex + 1,
          score: this.score,
        });
      } else {
        this.scene.start("GameOverScene", {
          victory: true,
          score: this.score,
        });
      }
    });
  };

  private onEnemyContact = (
    player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void => {
    const playerSprite = player as Phaser.Physics.Arcade.Sprite;
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;

    // Check if player is stomping (falling onto enemy)
    if (
      playerSprite.body &&
      playerSprite.body.velocity.y > 0 &&
      playerSprite.y < enemySprite.y - enemySprite.displayHeight * 0.3
    ) {
      // Stomp kill
      enemySprite.destroy();
      this.score += 200;
      // Bounce player up
      (playerSprite.body as Phaser.Physics.Arcade.Body).setVelocityY(-350);
      EventBus.emit("score-update", { score: this.score });
    } else {
      // Player takes damage
      this.onPlayerHit();
    }
  };

  private onPlayerHit(): void {
    if (this.player.isInvulnerable) return;

    this.lives--;
    this.player.takeDamage();
    EventBus.emit("player-hit", { lives: this.lives });

    if (this.lives <= 0) {
      this.onPlayerDeath();
    }
  }

  private onPlayerDeath(): void {
    this.isLevelComplete = true;
    EventBus.emit("player-died");

    this.time.delayedCall(1500, () => {
      this.scene.start("GameOverScene", {
        victory: false,
        score: this.score,
      });
    });
  }
}
