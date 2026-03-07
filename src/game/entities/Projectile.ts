import Phaser from "phaser";
import type { WeaponType } from "@/types/game";

/** Projectile behavior varies by weapon type:
 *  - fireball: straight shot, fast, single hit
 *  - boomerang: arcs forward then returns to player
 *  - wave: short-range spread, passes through enemies */
export class Projectile {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public weaponType: WeaponType;
  private scene: Phaser.Scene;
  private lifetime: number = 0;
  private maxLifetime: number;
  private originX: number;
  private direction: number; // 1 = right, -1 = left
  private returning: boolean = false;
  private playerRef?: Phaser.Physics.Arcade.Sprite;
  private piercing: boolean = false;

  // Boomerang arc state
  private boomerangTime: number = 0;
  private boomerangSpeed: number = 400;
  private boomerangTurnTime: number = 300; // ms to start returning

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    direction: number,
    weaponType: WeaponType,
    playerRef?: Phaser.Physics.Arcade.Sprite,
  ) {
    this.scene = scene;
    this.direction = direction;
    this.weaponType = weaponType;
    this.originX = x;
    this.playerRef = playerRef;

    const textureKey = `projectile-${weaponType}`;
    this.sprite = scene.physics.add.sprite(x, y, textureKey);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(this.sprite.width * 0.8, this.sprite.height * 0.8);

    switch (weaponType) {
      case "fireball":
        this.maxLifetime = 1200;
        body.setVelocityX(550 * direction);
        body.setVelocityY(0);
        this.sprite.setScale(1.2);
        break;

      case "boomerang":
        this.maxLifetime = 2000;
        this.piercing = true;
        body.setVelocityX(this.boomerangSpeed * direction);
        this.sprite.setScale(1.0);
        break;

      case "wave":
        this.maxLifetime = 400;
        this.piercing = true;
        body.setVelocityX(300 * direction);
        this.sprite.setScale(1.5, 1.5);
        this.sprite.setAlpha(0.8);
        break;
    }

    if (direction < 0) {
      this.sprite.setFlipX(true);
    }

    scene.events.on("update", this.update, this);
    this.sprite.on("destroy", () => {
      scene.events.off("update", this.update, this);
    });
  }

  private update = (_time: number, delta: number): void => {
    if (!this.sprite.active) return;

    this.lifetime += delta;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    switch (this.weaponType) {
      case "fireball":
        // Slight sine wobble for visual flair
        body.setVelocityY(Math.sin(this.lifetime * 0.01) * 30);
        // Rotate in flight direction
        this.sprite.rotation += 0.15 * this.direction;
        break;

      case "boomerang":
        this.boomerangTime += delta;
        // Spin continuously
        this.sprite.rotation += 0.25;

        if (!this.returning && this.boomerangTime > this.boomerangTurnTime) {
          this.returning = true;
        }

        if (this.returning && this.playerRef?.active) {
          // Fly back toward player
          const dx = this.playerRef.x - this.sprite.x;
          const dy = this.playerRef.y - this.sprite.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 30) {
            // Returned to player — destroy
            this.sprite.destroy();
            return;
          }

          const speed = this.boomerangSpeed * 1.3;
          body.setVelocityX((dx / dist) * speed);
          body.setVelocityY((dy / dist) * speed);
        } else if (this.returning) {
          // Player gone, just expire
          this.sprite.destroy();
          return;
        }
        break;

      case "wave":
        // Expand and fade out
        const progress = this.lifetime / this.maxLifetime;
        this.sprite.setScale(1.5 + progress * 1.5, 1.5 - progress * 0.3);
        this.sprite.setAlpha(0.8 - progress * 0.7);
        break;
    }

    if (this.lifetime >= this.maxLifetime) {
      this.sprite.destroy();
    }
  };

  /** Whether this projectile should be destroyed on hit or pass through */
  get isPiercing(): boolean {
    return this.piercing;
  }
}
