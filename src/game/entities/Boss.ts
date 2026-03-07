import Phaser from "phaser";
import type { BossType } from "@/types/game";

/**
 * Boss entity with three unique fight mechanics:
 *
 * CHARGER (Level 1): Charges across a flat arena, hits wall → stunned → vulnerable.
 *   3 HP, speeds up after each hit.
 *
 * ORBITER (Level 2): Floats in center with rotating shield orbs that block projectiles.
 *   Shield has a gap — time shots through it. Stompable from above. 4 HP.
 *
 * OVERLORD (Level 3): Multi-phase. Phase 1: jumps between platforms, ground-slams
 *   create shockwaves. Phase 2 (≤3 HP): berserk — charges AND shoots. 6 HP total.
 */
export class Boss {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public bossType: BossType;
  public hp: number;
  public maxHp: number;
  public isStunned: boolean = false;
  public isDead: boolean = false;

  /** Orbiter shield sprites — destroyed when boss takes damage */
  public shieldOrbs: Phaser.Physics.Arcade.Sprite[] = [];

  /** Overlord shockwave sprites — player must jump over these */
  public shockwaves: Phaser.Physics.Arcade.Sprite[] = [];

  /** Overlord projectile sprites — player must dodge */
  public bossProjectiles: Phaser.Physics.Arcade.Sprite[] = [];

  private scene: Phaser.Scene;
  private arenaLeft: number;
  private arenaRight: number;
  private arenaFloorY: number;

  // Charger state
  private chargeDir: number = 1;
  private chargeSpeed: number = 280;
  private stunTimer: number = 0;
  private stunDuration: number = 2000;
  private chargeWindup: number = 0;
  private windupDuration: number = 600;
  private isCharging: boolean = false;
  private isWindingUp: boolean = false;

  // Orbiter state
  private orbitAngle: number = 0;
  private orbitSpeed: number = 0.0018;
  private orbitRadius: number = 100;
  private shieldCount: number = 5; // one gap in 6 positions
  private hoverBaseY: number = 0;
  private hoverTime: number = 0;

  // Overlord state
  private phase: number = 1;
  private jumpTimer: number = 0;
  private jumpInterval: number = 2500;
  private slamming: boolean = false;
  private slamCooldown: number = 0;
  private berserkTimer: number = 0;
  private berserkFireInterval: number = 800;
  private overlordPlatforms: { x: number; y: number }[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bossType: BossType,
    arenaLeft: number,
    arenaRight: number,
    arenaFloorY: number,
  ) {
    this.scene = scene;
    this.bossType = bossType;
    this.arenaLeft = arenaLeft;
    this.arenaRight = arenaRight;
    this.arenaFloorY = arenaFloorY;

    const textureKey = `boss-${bossType}`;
    this.sprite = scene.physics.add.sprite(x, y, textureKey);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    switch (bossType) {
      case "charger":
        this.hp = this.maxHp = 3;
        this.sprite.setScale(1.4);
        body.setSize(this.sprite.width * 0.8, this.sprite.height * 0.85);
        body.setAllowGravity(true);
        body.setBounce(0);
        body.setCollideWorldBounds(false);
        break;

      case "orbiter":
        this.hp = this.maxHp = 4;
        this.sprite.setScale(1.3);
        body.setSize(this.sprite.width * 0.7, this.sprite.height * 0.7);
        body.setAllowGravity(false);
        body.setImmovable(true);
        this.hoverBaseY = y;
        this.createShieldOrbs();
        break;

      case "overlord":
        this.hp = this.maxHp = 6;
        this.sprite.setScale(1.5);
        body.setSize(this.sprite.width * 0.75, this.sprite.height * 0.85);
        body.setAllowGravity(true);
        body.setBounce(0);
        body.setMaxVelocityY(1200);
        break;
    }

    scene.events.on("update", this.update, this);
    this.sprite.on("destroy", () => {
      scene.events.off("update", this.update, this);
    });
  }

  /** Set platform positions for Overlord to jump between */
  setOverlordPlatforms(platforms: { x: number; y: number }[]): void {
    this.overlordPlatforms = platforms;
  }

  takeDamage(scene: Phaser.Scene): boolean {
    if (this.isDead) return false;

    // Charger can only be damaged when stunned
    if (this.bossType === "charger" && !this.isStunned) return false;

    this.hp--;
    this.flashDamage(scene);

    if (this.hp <= 0) {
      this.isDead = true;
      this.onDeath(scene);
      return true;
    }

    // Charger speeds up after each hit
    if (this.bossType === "charger") {
      this.chargeSpeed += 60;
      this.stunDuration -= 200;
      this.isStunned = false;
      this.stunTimer = 0;
    }

    // Orbiter: shield spins faster
    if (this.bossType === "orbiter") {
      this.orbitSpeed += 0.0006;
    }

    // Overlord: enter phase 2 at half health
    if (this.bossType === "overlord" && this.hp <= 3 && this.phase === 1) {
      this.phase = 2;
      this.jumpInterval = 1800;
      this.sprite.setTint(0xff4444);
    }

    return false;
  }

  private flashDamage(scene: Phaser.Scene): void {
    this.sprite.setTint(0xffffff);
    scene.time.delayedCall(120, () => {
      if (this.sprite.active && !this.isDead) {
        this.sprite.clearTint();
        if (this.bossType === "overlord" && this.phase === 2) {
          this.sprite.setTint(0xff4444);
        }
      }
    });
  }

  private onDeath(scene: Phaser.Scene): void {
    // Destroy shield orbs
    for (const orb of this.shieldOrbs) {
      if (orb.active) orb.destroy();
    }
    this.shieldOrbs = [];

    // Destroy shockwaves
    for (const sw of this.shockwaves) {
      if (sw.active) sw.destroy();
    }
    this.shockwaves = [];

    // Destroy boss projectiles
    for (const bp of this.bossProjectiles) {
      if (bp.active) bp.destroy();
    }
    this.bossProjectiles = [];

    // Death animation: flash and scale up then explode
    scene.tweens.add({
      targets: this.sprite,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 600,
      ease: "Power2",
      onComplete: () => {
        if (this.sprite.active) this.sprite.destroy();
      },
    });
  }

  private update = (_time: number, delta: number): void => {
    if (!this.sprite.active || this.isDead) return;

    switch (this.bossType) {
      case "charger":
        this.updateCharger(delta);
        break;
      case "orbiter":
        this.updateOrbiter(delta);
        break;
      case "overlord":
        this.updateOverlord(delta);
        break;
    }
  };

  // ═══════════════════════════════════════════════════════
  // CHARGER — charges across arena, stuns on wall hit
  // ═══════════════════════════════════════════════════════

  private updateCharger(delta: number): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    if (this.isStunned) {
      this.stunTimer += delta;
      body.setVelocityX(0);

      // Wobble while stunned
      this.sprite.setAngle(Math.sin(this.stunTimer * 0.02) * 15);

      // Stars above head effect via tint cycling
      const flashRate = Math.floor(this.stunTimer / 150) % 2;
      this.sprite.setTint(flashRate === 0 ? 0xffff00 : 0xff8800);

      if (this.stunTimer >= this.stunDuration) {
        this.isStunned = false;
        this.stunTimer = 0;
        this.isWindingUp = true;
        this.chargeWindup = 0;
        this.sprite.setAngle(0);
        this.sprite.clearTint();
        // Face player — will be set from scene
        this.chargeDir = this.sprite.x < (this.arenaLeft + this.arenaRight) / 2 ? 1 : -1;
      }
      return;
    }

    if (this.isWindingUp) {
      this.chargeWindup += delta;
      body.setVelocityX(0);

      // Shake before charging
      this.sprite.x += (Math.random() - 0.5) * 3;
      this.sprite.setTint(0xff4444);

      if (this.chargeWindup >= this.windupDuration) {
        this.isWindingUp = false;
        this.isCharging = true;
        this.sprite.clearTint();
      }
      return;
    }

    if (this.isCharging) {
      body.setVelocityX(this.chargeSpeed * this.chargeDir);
      this.sprite.setFlipX(this.chargeDir < 0);

      // Hit wall → stun
      if (
        (body.blocked.left || this.sprite.x <= this.arenaLeft + 40) ||
        (body.blocked.right || this.sprite.x >= this.arenaRight - 40)
      ) {
        this.isCharging = false;
        this.isStunned = true;
        this.stunTimer = 0;
        body.setVelocityX(0);
        this.scene.cameras.main.shake(200, 0.008);
      }
    } else {
      // Idle — start winding up
      this.isWindingUp = true;
      this.chargeWindup = 0;
    }
  }

  /** Call from scene to orient charger toward player */
  facePlayer(playerX: number): void {
    if (this.bossType === "charger" && !this.isCharging && !this.isStunned) {
      this.chargeDir = playerX > this.sprite.x ? 1 : -1;
    }
  }

  // ═══════════════════════════════════════════════════════
  // ORBITER — floats with rotating shield, gap to shoot through
  // ═══════════════════════════════════════════════════════

  private createShieldOrbs(): void {
    // Create shield orbs in a ring with one gap
    for (let i = 0; i < this.shieldCount; i++) {
      const orb = this.scene.physics.add.sprite(
        this.sprite.x,
        this.sprite.y,
        "shield-orb",
      );
      const orbBody = orb.body as Phaser.Physics.Arcade.Body;
      orbBody.setAllowGravity(false);
      orbBody.setImmovable(true);
      orbBody.setCircle(12);
      orb.setDepth(5);
      this.shieldOrbs.push(orb);
    }
  }

  private updateOrbiter(delta: number): void {
    this.hoverTime += delta;
    this.orbitAngle += this.orbitSpeed * delta;

    // Gentle hover motion
    this.sprite.y = this.hoverBaseY + Math.sin(this.hoverTime * 0.002) * 20;

    // Slow horizontal drift
    const centerX = (this.arenaLeft + this.arenaRight) / 2;
    this.sprite.x = centerX + Math.sin(this.hoverTime * 0.0008) * 60;

    // Update shield orb positions (6 slots, 5 filled = 1 gap)
    const totalSlots = this.shieldCount + 1; // +1 for the gap
    for (let i = 0; i < this.shieldOrbs.length; i++) {
      const orb = this.shieldOrbs[i];
      if (!orb.active) continue;

      // Skip slot 0 (the gap), use slots 1..5
      const slotAngle =
        this.orbitAngle + ((i + 1) / totalSlots) * Math.PI * 2;
      orb.x = this.sprite.x + Math.cos(slotAngle) * this.orbitRadius;
      orb.y = this.sprite.y + Math.sin(slotAngle) * this.orbitRadius;
      orb.rotation += 0.04;
    }

    // Clean up destroyed orbs
    this.shieldOrbs = this.shieldOrbs.filter((o) => o.active);
  }

  // ═══════════════════════════════════════════════════════
  // OVERLORD — jumps between platforms, ground-slams, phase 2 berserk
  // ═══════════════════════════════════════════════════════

  private updateOverlord(delta: number): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;

    this.jumpTimer += delta;

    // Clean up expired shockwaves and projectiles
    this.shockwaves = this.shockwaves.filter((s) => s.active);
    this.bossProjectiles = this.bossProjectiles.filter((p) => p.active);

    // Landing slam
    if (this.slamming && onGround) {
      this.slamming = false;
      this.slamCooldown = 500;
      this.spawnShockwave();
      this.scene.cameras.main.shake(250, 0.01);
    }

    if (this.slamCooldown > 0) {
      this.slamCooldown -= delta;
    }

    // Jump to platforms periodically
    if (onGround && this.jumpTimer >= this.jumpInterval && this.slamCooldown <= 0) {
      this.jumpTimer = 0;
      this.jumpToRandomPlatform(body);
    }

    // Phase 2: berserk mode — shoot projectiles at player
    if (this.phase === 2 && onGround) {
      this.berserkTimer += delta;
      if (this.berserkTimer >= this.berserkFireInterval) {
        this.berserkTimer = 0;
        this.fireBossProjectile();
      }
    }

    // Flip to face center of arena
    const centerX = (this.arenaLeft + this.arenaRight) / 2;
    this.sprite.setFlipX(this.sprite.x > centerX);
  }

  private jumpToRandomPlatform(body: Phaser.Physics.Arcade.Body): void {
    if (this.overlordPlatforms.length === 0) {
      // No platforms — just jump up and slam down
      body.setVelocityY(-700);
      this.slamming = true;
      return;
    }

    // Pick a platform that isn't too close to current position
    const candidates = this.overlordPlatforms.filter(
      (p) => Math.abs(p.x - this.sprite.x) > 80,
    );
    const target =
      candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : this.overlordPlatforms[
            Math.floor(Math.random() * this.overlordPlatforms.length)
          ];

    // Calculate jump to reach target platform
    const dx = target.x - this.sprite.x;
    const jumpDuration = 600; // approximate air time ms
    const vx = (dx / jumpDuration) * 1000;

    body.setVelocityX(Phaser.Math.Clamp(vx, -350, 350));
    body.setVelocityY(-750);
    this.slamming = true;
  }

  private spawnShockwave(): void {
    // Spawn two shockwaves going left and right
    for (const dir of [-1, 1]) {
      const sw = this.scene.physics.add.sprite(
        this.sprite.x + dir * 30,
        this.arenaFloorY - 16,
        "shockwave",
      );
      const swBody = sw.body as Phaser.Physics.Arcade.Body;
      swBody.setAllowGravity(false);
      swBody.setVelocityX(dir * 300);
      swBody.setSize(sw.width, sw.height * 0.6);
      sw.setScale(1, 0.8);
      sw.setAlpha(0.9);

      this.shockwaves.push(sw);

      // Auto-destroy after travelling
      this.scene.time.delayedCall(1200, () => {
        if (sw.active) sw.destroy();
      });

      // Fade out
      this.scene.tweens.add({
        targets: sw,
        alpha: 0,
        scaleY: 0.2,
        duration: 1200,
      });
    }
  }

  private fireBossProjectile(): void {
    const dir = this.sprite.flipX ? -1 : 1;
    const bp = this.scene.physics.add.sprite(
      this.sprite.x + dir * 30,
      this.sprite.y,
      "boss-projectile",
    );
    const bpBody = bp.body as Phaser.Physics.Arcade.Body;
    bpBody.setAllowGravity(false);
    bpBody.setVelocityX(dir * 350);
    bp.setFlipX(dir < 0);

    this.bossProjectiles.push(bp);

    // Auto-destroy
    this.scene.time.delayedCall(2500, () => {
      if (bp.active) bp.destroy();
    });

    // Spin
    this.scene.tweens.add({
      targets: bp,
      rotation: dir * Math.PI * 4,
      duration: 2500,
    });
  }
}
