import Phaser from "phaser";
import { EventBus } from "../EventBus";
import { Player, weaponTypeFromText } from "../entities/Player";
import { PatrolEnemy } from "../entities/PatrolEnemy";
import { FlyingEnemy } from "../entities/FlyingEnemy";
import { Collectible } from "../entities/Collectible";
import { PowerUp } from "../entities/PowerUp";
import { TouchControls } from "../systems/TouchControls";
import { LevelGenerator } from "../levels/LevelGenerator";
import type { LevelData, WeaponType } from "@/types/game";

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.GameObjects.Group;
  private collectibles!: Phaser.GameObjects.Group;
  private powerUps!: Phaser.GameObjects.Group;
  private weaponPickups!: Phaser.GameObjects.Group;
  private projectileGroup!: Phaser.GameObjects.Group;
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
  private weaponLabel?: Phaser.GameObjects.Text;

  constructor() {
    super("GameScene");
  }

  init(data: { levelIndex?: number; score?: number; lives?: number; weaponType?: WeaponType }): void {
    this.levelIndex = data.levelIndex ?? 0;
    this.score = data.score ?? this.score;
    this.lives = data.lives ?? this.lives;
    this.isLevelComplete = false;
    this.collectiblesFound = 0;
  }

  create(): void {
    this.levelData = LevelGenerator.generate(this.levelIndex);

    const worldWidth = this.levelData.width * this.levelData.tileSize;
    const worldHeight = this.levelData.height * this.levelData.tileSize;

    // Background — disabled for testing
    // const bgKey = this.textures.exists(this.levelData.backgroundKey)
    //   ? this.levelData.backgroundKey
    //   : null;

    // Create platforms
    this.platforms = this.physics.add.staticGroup();
    this.buildPlatforms();

    // Create player
    this.player = new Player(
      this,
      this.levelData.playerStart.x,
      this.levelData.playerStart.y
    );

    // Set weapon type from madlibs input or default
    const entries = this.registry.get("entries") as Record<string, string> | null;
    if (entries?.heroWeapon) {
      this.player.weaponType = weaponTypeFromText(entries.heroWeapon);
    }

    // Create enemies
    this.enemies = this.add.group();
    this.spawnEnemies();

    // Create collectibles
    this.collectibles = this.add.group();
    this.spawnCollectibles();
    this.totalCollectibles = this.levelData.collectibles.length;

    // Projectile group for overlap checks
    this.projectileGroup = this.add.group();

    // Create power-ups
    this.powerUps = this.add.group();
    this.weaponPickups = this.add.group();
    this.spawnPowerUps();

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
    this.physics.add.overlap(
      this.player.sprite,
      this.powerUps,
      this.onPowerUpCollect as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.player.sprite,
      this.weaponPickups,
      this.onWeaponPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Camera — zoom out for SNES-like proportions with tighter follow
    const baseWidth = this.scale.width;
    const zoom = baseWidth < 480 ? 0.75 : 0.6;
    this.cameras.main.setZoom(zoom);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.15, 0.15);
    // Look-ahead: offset camera in movement direction
    this.cameras.main.setFollowOffset(-60, -20);
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // Controls
    this.controls = new TouchControls(this);

    // Weapon HUD label
    this.weaponLabel = this.add
      .text(10, 10, this.getWeaponLabel(), {
        fontSize: "14px",
        color: "#ffffff",
        fontFamily: "monospace",
        backgroundColor: "#00000066",
        padding: { x: 6, y: 3 },
      })
      .setScrollFactor(0)
      .setDepth(200);

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

    // Sync projectile sprites into physics group for overlap checks
    for (const proj of this.player.projectiles) {
      if (proj.sprite.active && !this.projectileGroup.contains(proj.sprite)) {
        this.projectileGroup.add(proj.sprite);
        // Set up projectile-vs-enemy overlap per projectile
        this.physics.add.overlap(
          proj.sprite,
          this.enemies,
          this.onProjectileHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
          undefined,
          this,
        );
        // Projectiles collide with platforms (except boomerang returning)
        if (proj.weaponType !== "boomerang") {
          this.physics.add.collider(proj.sprite, this.platforms, () => {
            proj.sprite.destroy();
          });
        }
      }
    }

    // Update weapon HUD
    if (this.weaponLabel) {
      this.weaponLabel.setText(this.getWeaponLabel());
    }

    // Check if player fell off the world
    const worldHeight = this.levelData.height * this.levelData.tileSize;
    if (this.player.sprite.y > worldHeight + 100) {
      this.onPlayerDeath();
    }
  }

  private buildPlatforms(): void {
    for (const platform of this.levelData.platforms) {
      const tileKey = "platform-tile-0";
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

  private spawnPowerUps(): void {
    for (const pu of this.levelData.powerUps) {
      if (pu.type === "weapon") {
        // Weapon pickup — cycles player's weapon type
        const wpSprite = this.physics.add.sprite(pu.x, pu.y, "weapon-pickup");
        const wpBody = wpSprite.body as Phaser.Physics.Arcade.Body;
        wpBody.setAllowGravity(false);
        wpBody.setImmovable(true);
        this.tweens.add({
          targets: wpSprite,
          y: pu.y - 12,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        // Pulsing outline effect
        this.tweens.add({
          targets: wpSprite,
          scaleX: { from: 1.0, to: 1.15 },
          scaleY: { from: 1.0, to: 1.15 },
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
        this.weaponPickups.add(wpSprite);
      } else {
        const powerUp = new PowerUp(this, pu.x, pu.y);
        this.powerUps.add(powerUp.sprite);
      }
    }
  }

  private onCollectItem = (
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    item: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void => {
    const sprite = item as Phaser.Physics.Arcade.Sprite;
    // Burst particles on collect
    this.spawnParticles(sprite.x, sprite.y, 0xffd166, 6);
    sprite.destroy();
    this.collectiblesFound++;
    this.score += 100;
    EventBus.emit("item-collected", {
      collected: this.collectiblesFound,
      total: this.totalCollectibles,
      score: this.score,
    });
  };

  private onPowerUpCollect = (
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    item: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void => {
    const sprite = item as Phaser.Physics.Arcade.Sprite;
    sprite.destroy();
    this.player.activateStar(this);
    this.score += 500;
    EventBus.emit("power-up-collected", { type: "star", score: this.score });
  };

  private onWeaponPickup = (
    _player: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    item: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void => {
    const sprite = item as Phaser.Physics.Arcade.Sprite;
    this.spawnParticles(sprite.x, sprite.y, 0x00d4ff, 8);
    sprite.destroy();
    this.player.cycleWeapon();
    this.score += 150;
    EventBus.emit("weapon-changed", { weapon: this.player.weaponType, score: this.score });
  };

  private onProjectileHitEnemy = (
    projectile: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemy: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void => {
    const enemySprite = enemy as Phaser.Physics.Arcade.Sprite;
    const projSprite = projectile as Phaser.Physics.Arcade.Sprite;

    // Find matching projectile to check piercing
    const proj = this.player.projectiles.find((p) => p.sprite === projSprite);

    this.spawnParticles(enemySprite.x, enemySprite.y, 0xff6b6b, 8);
    this.screenShake(3, 80);
    enemySprite.destroy();
    this.score += 200;
    EventBus.emit("score-update", { score: this.score });

    // Non-piercing projectiles are destroyed on hit
    if (!proj?.isPiercing && projSprite.active) {
      projSprite.destroy();
    }
  };

  private onReachExit = (): void => {
    if (this.isLevelComplete) return;
    this.isLevelComplete = true;

    EventBus.emit("level-complete", {
      level: this.levelIndex + 1,
      score: this.score,
      collectibles: this.collectiblesFound,
    });

    this.time.delayedCall(500, () => {
      // Check if there are more levels
      if (this.levelIndex < 2) {
        // Skip transition screen — go straight to next level for testing
        this.scene.start("GameScene", {
          levelIndex: this.levelIndex + 1,
          score: this.score,
          lives: this.lives,
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

    // Star power: destroy enemies on contact
    if (this.player.isStarPowered) {
      this.spawnParticles(enemySprite.x, enemySprite.y, 0xffd700, 10);
      this.screenShake(4, 100);
      enemySprite.destroy();
      this.score += 200;
      EventBus.emit("score-update", { score: this.score });
      return;
    }

    // Check if player is stomping (falling onto enemy)
    if (
      playerSprite.body &&
      playerSprite.body.velocity.y > 0 &&
      playerSprite.y < enemySprite.y - enemySprite.displayHeight * 0.3
    ) {
      // Stomp kill
      this.spawnParticles(enemySprite.x, enemySprite.y, 0xff6b6b, 8);
      this.screenShake(4, 100);
      enemySprite.destroy();
      this.score += 200;
      // Bounce player up
      (playerSprite.body as Phaser.Physics.Arcade.Body).setVelocityY(-500);
      EventBus.emit("score-update", { score: this.score });
    } else {
      // Player takes damage
      this.onPlayerHit();
    }
  };

  private onPlayerHit(): void {
    if (this.player.isInvulnerable || this.player.isStarPowered) return;

    this.lives--;
    this.player.takeDamage();
    this.screenShake(6, 150);
    EventBus.emit("player-hit", { lives: this.lives });

    if (this.lives <= 0) {
      this.onPlayerDeath();
    }
  }

  private onPlayerDeath(): void {
    this.isLevelComplete = true;
    this.screenShake(8, 200);
    EventBus.emit("player-died");

    this.time.delayedCall(1500, () => {
      this.scene.start("GameOverScene", {
        victory: false,
        score: this.score,
      });
    });
  }

  private screenShake(intensity: number, duration: number): void {
    this.cameras.main.shake(duration, intensity / 1000);
  }

  private spawnParticles(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const px = x + (Math.random() - 0.5) * 20;
      const py = y + (Math.random() - 0.5) * 20;
      const particle = this.add.circle(px, py, 3, color, 1).setDepth(150);
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 60;

      this.tweens.add({
        targets: particle,
        x: px + vx * 0.5,
        y: py + vy * 0.5,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 300 + Math.random() * 200,
        ease: "Power2",
        onComplete: () => particle.destroy(),
      });
    }
  }

  private getWeaponLabel(): string {
    const icons: Record<WeaponType, string> = {
      fireball: "FIRE",
      boomerang: "RANG",
      wave: "WAVE",
    };
    return `[X] ${icons[this.player.weaponType]}`;
  }
}
