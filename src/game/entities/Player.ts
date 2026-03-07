import Phaser from "phaser";
import type { TouchControls } from "../systems/TouchControls";

export class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public isInvulnerable: boolean = false;
  public isStarPowered: boolean = false;
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
    if (controls.left) {
      body.setAccelerationX(-2200);
      this.sprite.setFlipX(true);
      if (onGround) {
        this.sprite.setTexture("hero-run");
      }
    } else if (controls.right) {
      body.setAccelerationX(2200);
      this.sprite.setFlipX(false);
      if (onGround) {
        this.sprite.setTexture("hero-run");
      }
    } else {
      body.setAccelerationX(0);
      if (onGround) {
        this.sprite.setTexture("hero-idle");
      }
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
