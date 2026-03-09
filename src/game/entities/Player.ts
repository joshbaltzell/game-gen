import Phaser from "phaser";
import type { TouchControls } from "../systems/TouchControls";
import { Projectile } from "./Projectile";
import type { WeaponType } from "@/types/game";

const WEAPON_TYPES: WeaponType[] = ["fireball", "boomerang", "wave"];

/** Derive weapon type from the player's heroWeapon text input */
export function weaponTypeFromText(text: string): WeaponType {
  const lower = text.toLowerCase();
  // Melee-ish words → wave (short range spread)
  if (/sword|blade|dagger|saber|axe|hammer|mace|glaive|machete|lance|spear/.test(lower)) {
    return "wave";
  }
  // Ranged words → fireball (straight shot)
  if (/bow|blaster|pistol|gun|cannon|dart|sling|trident/.test(lower)) {
    return "fireball";
  }
  // Returning/magic words → boomerang
  if (/boomerang|whip|staff|wand|vine/.test(lower)) {
    return "boomerang";
  }
  // Default
  return "fireball";
}

type HeroAnimState = "idle" | "run" | "jump" | "fall" | "turn" | "attack" | "celebrate";

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public isInvulnerable: boolean = false;
  public isStarPowered: boolean = false;
  public weaponType: WeaponType = "fireball";
  public projectiles: Projectile[] = [];
  private scene: Phaser.Scene;
  private moveSpeed: number = 340;
  private jumpForce: number = -720;
  private canJump: boolean = true;
  private jumpHeld: boolean = false;
  private maxJumpHoldTime: number = 180;
  private jumpHoldTimer: number = 0;
  private baseSpeed: number = 340;
  private starTimer?: Phaser.Time.TimerEvent;
  private starTintTimer?: Phaser.Time.TimerEvent;

  // Coyote time — brief grace period after leaving a platform
  private coyoteTime: number = 80; // ms
  private coyoteTimer: number = 0;

  // Jump buffering — register jump input slightly before landing
  private jumpBufferTime: number = 100; // ms
  private jumpBufferTimer: number = 0;

  // Weapon cooldown — varies per weapon type
  private fireCooldown: number = 0;
  private readonly cooldownByWeapon: Record<string, number> = {
    wave: 400,     // melee rhythm
    fireball: 300, // rapid fire
    boomerang: 600, // wait for return
  };
  private facingRight: boolean = true;

  // Animation state
  private animState: HeroAnimState = "idle";
  private attackAnimTimer: number = 0;
  private celebrating: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, "hero-idle");
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setBounce(0.0);
    this.sprite.setDragX(2000);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.sprite.width * 0.7, this.sprite.height * 0.9);
    body.setMaxVelocityX(this.moveSpeed);
    body.setMaxVelocityY(1200);
  }

  update(controls: TouchControls): void {
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const onGround = body.blocked.down || body.touching.down;
    const delta = this.scene.game.loop.delta;

    // ── Asymmetric gravity: fall faster than rise (Mario-like) ──
    if (!onGround && body.velocity.y > 0) {
      body.setGravityY(560);
    } else {
      body.setGravityY(0);
    }

    // ── Horizontal movement — instant acceleration ──
    const movingLeft = controls.left;
    const movingRight = controls.right;

    // Detect turn/skid: pressing opposite direction to velocity
    const isTurning =
      onGround &&
      ((movingLeft && body.velocity.x > 80) ||
        (movingRight && body.velocity.x < -80));

    if (movingLeft) {
      body.setAccelerationX(-2200);
      this.sprite.setFlipX(true);
      this.facingRight = false;
    } else if (movingRight) {
      body.setAccelerationX(2200);
      this.sprite.setFlipX(false);
      this.facingRight = true;
    } else {
      body.setAccelerationX(0);
    }

    // ── Coyote time tracking ──
    if (onGround) {
      this.coyoteTimer = this.coyoteTime;
      this.canJump = true;
      this.jumpHoldTimer = 0;
      this.jumpHeld = false;
    } else {
      this.coyoteTimer -= delta;
    }

    // ── Jump buffer ──
    if (controls.jumpJustPressed) {
      this.jumpBufferTimer = this.jumpBufferTime;
    } else {
      this.jumpBufferTimer -= delta;
    }

    // ── Jump with coyote time and input buffer ──
    const canJumpNow = onGround || this.coyoteTimer > 0;
    const wantsJump = this.jumpBufferTimer > 0;

    if (wantsJump && this.canJump && canJumpNow) {
      body.setVelocityY(this.jumpForce);
      try {
        const audio = this.scene.registry.get("audioManager");
        if (audio) audio.play("sfx-jump");
      } catch { /* ignore */ }
      this.canJump = false;
      this.jumpHeld = true;
      this.jumpHoldTimer = 0;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
    }

    // Hold jump for extra height
    if (this.jumpHeld && controls.jump) {
      this.jumpHoldTimer += delta;
      if (this.jumpHoldTimer < this.maxJumpHoldTime) {
        body.setVelocityY(this.jumpForce * 0.88);
      } else {
        this.jumpHeld = false;
      }
    } else {
      this.jumpHeld = false;
    }

    // Cut upward velocity when jump released — aggressive for short hops
    if (!controls.jump && !onGround && body.velocity.y < -50) {
      body.setVelocityY(body.velocity.y * 0.6);
    }

    // ── Squash and stretch ──
    if (!onGround) {
      if (body.velocity.y < -100) {
        this.sprite.setScale(0.88, 1.12);
      } else if (body.velocity.y > 100) {
        this.sprite.setScale(1.12, 0.88);
      }
    } else {
      this.sprite.setScale(1, 1);
    }

    // ── Weapon fire ──
    this.fireCooldown -= delta;
    if (controls.fireJustPressed && this.fireCooldown <= 0) {
      this.fire();
      this.fireCooldown = this.cooldownByWeapon[this.weaponType] ?? 350;
      this.attackAnimTimer = 200; // show attack anim for 200ms
    }

    // ── Animation state machine ──
    if (this.attackAnimTimer > 0) {
      this.attackAnimTimer -= delta;
    }

    // Stop celebrating if player starts moving
    if (this.celebrating && (movingLeft || movingRight)) {
      this.stopCelebrate();
    }

    if (!this.celebrating) {
      this.updateAnimState(onGround, movingLeft || movingRight, isTurning, body.velocity.y);
    }

    // Clean up destroyed projectiles
    this.projectiles = this.projectiles.filter((p) => p.sprite.active);
  }

  fire(): Projectile | null {
    // Limit active projectiles per weapon type
    const maxActive = this.weaponType === "wave" ? 1 : this.weaponType === "boomerang" ? 1 : 3;
    if (this.projectiles.length >= maxActive) return null;

    try {
      const audio = this.scene.registry.get("audioManager");
      if (audio) audio.play("sfx-weapon-fire");
    } catch { /* ignore */ }

    const dir = this.facingRight ? 1 : -1;

    // Position depends on weapon type
    let spawnX: number;
    let spawnY: number;

    if (this.weaponType === "wave") {
      // Blade swing: spawn at player position (follows player)
      spawnX = this.sprite.x;
      spawnY = this.sprite.y;
    } else {
      // Ranged weapons: spawn offset in front of player
      spawnX = this.sprite.x + dir * 28;
      spawnY = this.sprite.y;
    }

    const proj = new Projectile(
      this.scene,
      spawnX,
      spawnY,
      dir,
      this.weaponType,
      this.sprite,
    );
    this.projectiles.push(proj);
    return proj;
  }

  cycleWeapon(): void {
    const idx = WEAPON_TYPES.indexOf(this.weaponType);
    this.weaponType = WEAPON_TYPES[(idx + 1) % WEAPON_TYPES.length];
  }

  activateStar(scene: Phaser.Scene): void {
    this.isStarPowered = true;
    this.isInvulnerable = true;

    // Speed boost: 1.5x
    this.moveSpeed = this.baseSpeed * 1.5;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setMaxVelocityX(this.moveSpeed);

    // Rainbow tint cycling every 100ms
    const tintColors = [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff];
    let tintIndex = 0;

    this.starTintTimer = scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        this.sprite.setTint(tintColors[tintIndex % tintColors.length]);
        tintIndex++;
      },
    });

    // 8-second duration
    this.starTimer = scene.time.delayedCall(8000, () => {
      this.deactivateStar();
    });
  }

  deactivateStar(): void {
    this.isStarPowered = false;
    this.isInvulnerable = false;

    // Restore speed
    this.moveSpeed = this.baseSpeed;
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setMaxVelocityX(this.moveSpeed);

    // Stop rainbow tint
    if (this.starTintTimer) {
      this.starTintTimer.remove(false);
      this.starTintTimer = undefined;
    }
    if (this.starTimer) {
      this.starTimer.remove(false);
      this.starTimer = undefined;
    }

    this.sprite.clearTint();
    this.sprite.setAlpha(1);
  }

  /** Determine and play the correct animation based on game state */
  private updateAnimState(
    onGround: boolean,
    isMoving: boolean,
    isTurning: boolean,
    velocityY: number,
  ): void {
    let newState: HeroAnimState;

    if (this.attackAnimTimer > 0) {
      newState = "attack";
    } else if (!onGround) {
      newState = velocityY < 0 ? "jump" : "fall";
    } else if (isTurning) {
      newState = "turn";
    } else if (isMoving) {
      newState = "run";
    } else {
      newState = "idle";
    }

    if (newState !== this.animState) {
      this.animState = newState;
      this.playAnim(`hero-anim-${newState}`);
    }
  }

  /** Play an animation if it exists, otherwise fall back to the static texture */
  private playAnim(key: string): void {
    if (this.scene.anims.exists(key)) {
      this.sprite.play(key, true);
    }
  }

  /** Start celebration animation (call on level complete / boss defeat) */
  playCelebrate(): void {
    this.celebrating = true;
    this.animState = "celebrate";
    this.playAnim("hero-anim-celebrate");
  }

  /** Stop celebration and return to normal animation state */
  stopCelebrate(): void {
    this.celebrating = false;
  }

  takeDamage(): void {
    if (this.isInvulnerable || this.isStarPowered) return;

    this.isInvulnerable = true;
    this.sprite.setTint(0xff0000);

    // Knockback
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-400);

    // Flash effect
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 8,
      onComplete: () => {
        this.sprite.setAlpha(1);
        this.sprite.clearTint();
        this.isInvulnerable = false;
      },
    });
  }
}
