import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    // Create a simple loading bar
    const { width, height } = this.scale;
    const barWidth = 300;
    const barHeight = 20;
    const barX = (width - barWidth) / 2;
    const barY = height / 2;

    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 1);
    bg.fillRect(barX, barY, barWidth, barHeight);

    const bar = this.add.graphics();

    this.load.on("progress", (value: number) => {
      bar.clear();
      bar.fillStyle(0x00d4ff, 1);
      bar.fillRect(barX, barY, barWidth * value, barHeight);
    });

    this.load.on("complete", () => {
      bg.destroy();
      bar.destroy();
    });
  }

  create(): void {
    this.createPlaceholderTextures();
    this.scene.start("PreloadScene");
  }

  private createPlaceholderTextures(): void {
    // ── Controls ──

    // Jump button — coral accent
    const jumpGfx = this.add.graphics();
    jumpGfx.fillStyle(0xff6b6b, 0.7);
    jumpGfx.fillCircle(40, 40, 40);
    jumpGfx.lineStyle(3, 0xffffff, 0.9);
    jumpGfx.strokeCircle(40, 40, 40);
    jumpGfx.generateTexture("jump-button", 80, 80);
    jumpGfx.destroy();

    // D-pad base
    const dpadBase = this.add.graphics();
    dpadBase.fillStyle(0x4a4a6a, 0.5);
    dpadBase.fillCircle(60, 60, 60);
    dpadBase.generateTexture("dpad-base", 120, 120);
    dpadBase.destroy();

    // D-pad thumb
    const dpadThumb = this.add.graphics();
    dpadThumb.fillStyle(0xc0c0d8, 0.8);
    dpadThumb.fillCircle(30, 30, 30);
    dpadThumb.generateTexture("dpad-thumb", 60, 60);
    dpadThumb.destroy();

    // ── Hero — teal body with white visor ──
    const heroGfx = this.add.graphics();
    // Body
    heroGfx.fillStyle(0x2ec4b6, 1);
    heroGfx.fillRoundedRect(4, 4, 40, 40, 6);
    // Visor
    heroGfx.fillStyle(0xffffff, 1);
    heroGfx.fillRect(10, 12, 28, 8);
    // Eyes
    heroGfx.fillStyle(0x0b132b, 1);
    heroGfx.fillRect(14, 13, 6, 6);
    heroGfx.fillRect(26, 13, 6, 6);
    // Feet
    heroGfx.fillStyle(0x1a936f, 1);
    heroGfx.fillRect(8, 38, 12, 8);
    heroGfx.fillRect(28, 38, 12, 8);
    heroGfx.generateTexture("hero-idle", 48, 48);
    heroGfx.destroy();

    // Hero run — shifted legs
    const heroRunGfx = this.add.graphics();
    heroRunGfx.fillStyle(0x2ec4b6, 1);
    heroRunGfx.fillRoundedRect(4, 4, 40, 40, 6);
    heroRunGfx.fillStyle(0xffffff, 1);
    heroRunGfx.fillRect(10, 12, 28, 8);
    heroRunGfx.fillStyle(0x0b132b, 1);
    heroRunGfx.fillRect(14, 13, 6, 6);
    heroRunGfx.fillRect(26, 13, 6, 6);
    heroRunGfx.fillStyle(0x1a936f, 1);
    heroRunGfx.fillRect(6, 38, 12, 8);
    heroRunGfx.fillRect(30, 34, 12, 8);
    heroRunGfx.generateTexture("hero-run", 48, 48);
    heroRunGfx.destroy();

    // ── Enemy A — coral spiky blob (patrol) ──
    const enemyGfx = this.add.graphics();
    enemyGfx.fillStyle(0xff6b6b, 1);
    enemyGfx.fillRoundedRect(2, 6, 36, 32, 4);
    // Spikes
    enemyGfx.fillTriangle(4, 6, 10, 0, 16, 6);
    enemyGfx.fillTriangle(16, 6, 22, 0, 28, 6);
    enemyGfx.fillTriangle(24, 6, 30, 0, 36, 6);
    // Angry eyes
    enemyGfx.fillStyle(0xffffff, 1);
    enemyGfx.fillRect(8, 14, 8, 8);
    enemyGfx.fillRect(24, 14, 8, 8);
    enemyGfx.fillStyle(0x0b132b, 1);
    enemyGfx.fillRect(10, 16, 4, 4);
    enemyGfx.fillRect(26, 16, 4, 4);
    // Mouth
    enemyGfx.fillStyle(0xc9184a, 1);
    enemyGfx.fillRect(12, 28, 16, 4);
    enemyGfx.generateTexture("enemy-a", 40, 40);
    enemyGfx.destroy();

    // ── Enemy B — purple flying orb ──
    const enemyBGfx = this.add.graphics();
    enemyBGfx.fillStyle(0x7b2cbf, 1);
    enemyBGfx.fillCircle(20, 20, 18);
    enemyBGfx.fillStyle(0xc77dff, 0.6);
    enemyBGfx.fillCircle(20, 16, 10);
    // Eyes
    enemyBGfx.fillStyle(0xffffff, 1);
    enemyBGfx.fillRect(12, 14, 6, 8);
    enemyBGfx.fillRect(22, 14, 6, 8);
    enemyBGfx.fillStyle(0xff006e, 1);
    enemyBGfx.fillRect(14, 16, 3, 4);
    enemyBGfx.fillRect(24, 16, 3, 4);
    // Wings
    enemyBGfx.fillStyle(0xc77dff, 0.8);
    enemyBGfx.fillTriangle(0, 14, 6, 20, 4, 8);
    enemyBGfx.fillTriangle(34, 14, 40, 8, 36, 20);
    enemyBGfx.generateTexture("enemy-b", 40, 40);
    enemyBGfx.destroy();

    // ── Villain — dark red boss ──
    const villainGfx = this.add.graphics();
    villainGfx.fillStyle(0xc9184a, 1);
    villainGfx.fillRoundedRect(4, 8, 48, 44, 6);
    // Crown
    villainGfx.fillStyle(0xffd700, 1);
    villainGfx.fillRect(12, 2, 32, 8);
    villainGfx.fillTriangle(12, 2, 18, -6, 24, 2);
    villainGfx.fillTriangle(24, 2, 28, -8, 32, 2);
    villainGfx.fillTriangle(32, 2, 38, -6, 44, 2);
    // Eyes
    villainGfx.fillStyle(0xffffff, 1);
    villainGfx.fillRect(12, 18, 12, 10);
    villainGfx.fillRect(32, 18, 12, 10);
    villainGfx.fillStyle(0xff0000, 1);
    villainGfx.fillRect(16, 20, 6, 6);
    villainGfx.fillRect(36, 20, 6, 6);
    villainGfx.generateTexture("villain", 56, 56);
    villainGfx.destroy();

    // ── Collectible — gold coin with shine ──
    const collectGfx = this.add.graphics();
    collectGfx.fillStyle(0xf4a261, 1);
    collectGfx.fillCircle(12, 12, 11);
    collectGfx.fillStyle(0xffd166, 1);
    collectGfx.fillCircle(11, 10, 8);
    collectGfx.fillStyle(0xffffff, 0.6);
    collectGfx.fillCircle(8, 7, 3);
    collectGfx.generateTexture("collectible", 24, 24);
    collectGfx.destroy();

    // ── Power-up — pulsing star with glow ──
    const starGfx = this.add.graphics();
    starGfx.fillStyle(0xff006e, 0.3);
    starGfx.fillCircle(16, 16, 16);
    starGfx.fillStyle(0xffd700, 1);
    starGfx.fillCircle(16, 16, 12);
    starGfx.fillStyle(0xffef9f, 1);
    starGfx.fillCircle(14, 12, 5);
    starGfx.generateTexture("power-up", 32, 32);
    starGfx.destroy();

    // ── Platform tile — slate blue with highlight ──
    const platformGfx = this.add.graphics();
    platformGfx.fillStyle(0x3d5a80, 1);
    platformGfx.fillRect(0, 0, 64, 64);
    // Top highlight
    platformGfx.fillStyle(0x5b8fb9, 1);
    platformGfx.fillRect(0, 0, 64, 6);
    // Brick lines
    platformGfx.lineStyle(1, 0x293241, 0.6);
    platformGfx.strokeRect(0, 0, 64, 64);
    platformGfx.lineBetween(0, 32, 64, 32);
    platformGfx.lineBetween(32, 0, 32, 32);
    platformGfx.lineBetween(16, 32, 16, 64);
    platformGfx.lineBetween(48, 32, 48, 64);
    platformGfx.generateTexture("platform-tile-0", 64, 64);
    platformGfx.destroy();

    // ── Exit portal — swirling teal/pink ──
    const exitGfx = this.add.graphics();
    exitGfx.fillStyle(0x2ec4b6, 0.4);
    exitGfx.fillCircle(24, 24, 24);
    exitGfx.fillStyle(0xff006e, 0.6);
    exitGfx.fillCircle(24, 24, 16);
    exitGfx.fillStyle(0xffffff, 0.8);
    exitGfx.fillCircle(24, 24, 6);
    exitGfx.generateTexture("exit-portal", 48, 48);
    exitGfx.destroy();
  }
}
