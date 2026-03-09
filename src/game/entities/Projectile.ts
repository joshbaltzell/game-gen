import Phaser from "phaser";
import type { WeaponType } from "@/types/game";

/**
 * Projectile behavior varies dramatically by weapon type:
 *
 *  - fireball (gun): Straight-line shot with soft aim-assist toward nearest enemy.
 *    Fast, single hit, destroyed on impact.
 *
 *  - boomerang: Large slow throw that travels far before returning. Piercing.
 *    Only slightly faster than the player's run speed for dramatic pacing.
 *
 *  - wave (blade): Melee swing arc attached to the player. Wide hitbox covers
 *    above and in front. Short duration, hits all enemies in the arc.
 */
export class Projectile {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public weaponType: WeaponType;
  private scene: Phaser.Scene;
  private lifetime: number = 0;
  private maxLifetime: number = 1500;
  private direction: number; // 1 = right, -1 = left
  private returning: boolean = false;
  private playerRef?: Phaser.Physics.Arcade.Sprite;
  private piercing: boolean = false;

  // Boomerang state
  private boomerangTime: number = 0;
  private boomerangOutSpeed: number = 380;
  private boomerangReturnSpeed: number = 420;
  private boomerangTurnTime: number = 800; // ms before returning

  // Wave/blade swing state
  private swingStartAngle: number = 0;
  private swingEndAngle: number = 0;

  // Fireball particle trail timer
  private trailTimer: number = 0;

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
    this.playerRef = playerRef;

    const textureKey = `projectile-${weaponType}`;
    this.sprite = scene.physics.add.sprite(x, y, textureKey);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    switch (weaponType) {
      case "fireball":
        this.setupFireball(body, scene);
        break;

      case "boomerang":
        this.setupBoomerang(body);
        break;

      case "wave":
        this.setupWaveSwing(body);
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

  // ═══════════════════════════════════════════════════════
  // Setup methods
  // ═══════════════════════════════════════════════════════

  private setupFireball(body: Phaser.Physics.Arcade.Body, scene: Phaser.Scene): void {
    this.maxLifetime = 1500;
    this.piercing = false;
    this.sprite.setScale(1.3);

    // Straight-line base velocity
    const speed = 650;
    let vy = 0;

    // Soft aim-assist: find nearest enemy and angle slightly toward it
    const enemies = scene.children.list.filter(
      (child) =>
        child instanceof Phaser.Physics.Arcade.Sprite &&
        child.active &&
        child.texture.key.startsWith("enemy") &&
        Math.abs(child.x - this.sprite.x) < 400 &&
        Math.abs(child.y - this.sprite.y) < 200 &&
        // Only aim at enemies in the firing direction
        (this.direction > 0 ? child.x > this.sprite.x : child.x < this.sprite.x),
    ) as Phaser.Physics.Arcade.Sprite[];

    if (enemies.length > 0) {
      // Find closest
      let closest = enemies[0];
      let closestDist = Infinity;
      for (const e of enemies) {
        const dist = Math.abs(e.x - this.sprite.x) + Math.abs(e.y - this.sprite.y);
        if (dist < closestDist) {
          closestDist = dist;
          closest = e;
        }
      }

      // Soft aim: calculate angle but cap vertical component
      const dx = closest.x - this.sprite.x;
      const dy = closest.y - this.sprite.y;
      const angle = Math.atan2(dy, Math.abs(dx));
      // Cap aim angle to ±25° so it doesn't look like homing
      const maxAngle = Math.PI / 7;
      const clampedAngle = Math.max(-maxAngle, Math.min(maxAngle, angle));
      vy = Math.sin(clampedAngle) * speed;
    }

    body.setVelocityX(speed * this.direction);
    body.setVelocityY(vy);
    body.setSize(this.sprite.width * 0.8, this.sprite.height * 0.8);
  }

  private setupBoomerang(body: Phaser.Physics.Arcade.Body): void {
    this.maxLifetime = 4000;
    this.piercing = true;
    this.sprite.setScale(2.0);

    body.setVelocityX(this.boomerangOutSpeed * this.direction);
    body.setSize(this.sprite.width * 0.8, this.sprite.height * 0.8);
  }

  private setupWaveSwing(body: Phaser.Physics.Arcade.Body): void {
    this.maxLifetime = 250;
    this.piercing = true;

    // Position at player, large hitbox
    this.sprite.setScale(0.5);
    this.sprite.setAlpha(0.9);

    // Large collision area for the swing arc
    body.setSize(72, 56);
    body.setOffset(-4, 4);

    // No movement — follows player
    body.setVelocity(0, 0);

    // Swing angles: from behind overhead to in front
    // Direction determines swing direction
    this.swingStartAngle = this.direction > 0 ? -1.2 : 1.2; // ~-70° or +70°
    this.swingEndAngle = this.direction > 0 ? 1.2 : -1.2;   // ~+70° or -70°
    this.sprite.rotation = this.swingStartAngle;
  }

  // ═══════════════════════════════════════════════════════
  // Update loop
  // ═══════════════════════════════════════════════════════

  private update = (_time: number, delta: number): void => {
    if (!this.sprite.active) return;

    this.lifetime += delta;

    switch (this.weaponType) {
      case "fireball":
        this.updateFireball(delta);
        break;
      case "boomerang":
        this.updateBoomerang(delta);
        break;
      case "wave":
        this.updateWaveSwing();
        break;
    }

    if (this.lifetime >= this.maxLifetime) {
      this.sprite.destroy();
    }
  };

  private updateFireball(delta: number): void {
    // Fast rotation in flight direction
    this.sprite.rotation += 0.25 * this.direction;

    // Particle trail effect — spawn small fading circles behind
    this.trailTimer += delta;
    if (this.trailTimer > 40) {
      this.trailTimer = 0;
      const trail = this.scene.add
        .circle(
          this.sprite.x - this.direction * 8,
          this.sprite.y + (Math.random() - 0.5) * 6,
          3 + Math.random() * 3,
          0xff6b35,
          0.7,
        )
        .setDepth(this.sprite.depth - 1);

      this.scene.tweens.add({
        targets: trail,
        alpha: 0,
        scaleX: 0.1,
        scaleY: 0.1,
        duration: 150,
        onComplete: () => trail.destroy(),
      });
    }
  }

  private updateBoomerang(delta: number): void {
    this.boomerangTime += delta;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Dramatic spin
    this.sprite.rotation += 0.3;

    // Scale pulse for visual drama
    const pulse = 1.8 + Math.sin(this.lifetime * 0.008) * 0.2;
    this.sprite.setScale(pulse);

    if (!this.returning && this.boomerangTime > this.boomerangTurnTime) {
      this.returning = true;
    }

    if (this.returning && this.playerRef?.active) {
      // Fly back toward player at return speed
      const dx = this.playerRef.x - this.sprite.x;
      const dy = this.playerRef.y - this.sprite.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 30) {
        this.sprite.destroy();
        return;
      }

      body.setVelocityX((dx / dist) * this.boomerangReturnSpeed);
      body.setVelocityY((dy / dist) * this.boomerangReturnSpeed);
    } else if (this.returning) {
      // Player gone, just expire
      this.sprite.destroy();
      return;
    }
  }

  private updateWaveSwing(): void {
    // Follow player position
    if (this.playerRef?.active) {
      const offsetX = this.direction * 24;
      const offsetY = -16; // Slightly above player center
      this.sprite.x = this.playerRef.x + offsetX;
      this.sprite.y = this.playerRef.y + offsetY;
    }

    // Swing arc animation
    const progress = Math.min(this.lifetime / this.maxLifetime, 1);

    // Ease-out swing for satisfying feel
    const easedProgress = 1 - Math.pow(1 - progress, 2);

    // Interpolate rotation
    this.sprite.rotation =
      this.swingStartAngle +
      (this.swingEndAngle - this.swingStartAngle) * easedProgress;

    // Scale up during swing (expanding arc effect)
    const scale = 0.5 + easedProgress * 2.0;
    this.sprite.setScale(scale * (this.direction > 0 ? 1 : -1), scale);

    // Fade out near end
    if (progress > 0.7) {
      this.sprite.setAlpha(0.9 - (progress - 0.7) / 0.3 * 0.8);
    }
  }

  /** Whether this projectile should be destroyed on hit or pass through */
  get isPiercing(): boolean {
    return this.piercing;
  }
}
