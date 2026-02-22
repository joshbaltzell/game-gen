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
    // Jump button
    const jumpGfx = this.add.graphics();
    jumpGfx.fillStyle(0x00d4ff, 0.7);
    jumpGfx.fillCircle(40, 40, 40);
    jumpGfx.lineStyle(3, 0xffffff, 0.9);
    jumpGfx.strokeCircle(40, 40, 40);
    jumpGfx.generateTexture("jump-button", 80, 80);
    jumpGfx.destroy();

    // D-pad base
    const dpadBase = this.add.graphics();
    dpadBase.fillStyle(0x888888, 0.5);
    dpadBase.fillCircle(60, 60, 60);
    dpadBase.generateTexture("dpad-base", 120, 120);
    dpadBase.destroy();

    // D-pad thumb
    const dpadThumb = this.add.graphics();
    dpadThumb.fillStyle(0xcccccc, 0.8);
    dpadThumb.fillCircle(30, 30, 30);
    dpadThumb.generateTexture("dpad-thumb", 60, 60);
    dpadThumb.destroy();

    // Fallback hero (green square)
    const heroGfx = this.add.graphics();
    heroGfx.fillStyle(0x44ff44, 1);
    heroGfx.fillRect(0, 0, 48, 48);
    heroGfx.fillStyle(0x22aa22, 1);
    heroGfx.fillRect(12, 8, 8, 8);
    heroGfx.fillRect(28, 8, 8, 8);
    heroGfx.fillRect(12, 28, 24, 8);
    heroGfx.generateTexture("hero-idle", 48, 48);
    heroGfx.destroy();

    // Fallback hero run
    const heroRunGfx = this.add.graphics();
    heroRunGfx.fillStyle(0x44ff44, 1);
    heroRunGfx.fillRect(0, 0, 48, 48);
    heroRunGfx.fillStyle(0x22aa22, 1);
    heroRunGfx.fillRect(16, 8, 8, 8);
    heroRunGfx.fillRect(32, 8, 8, 8);
    heroRunGfx.fillRect(8, 28, 32, 8);
    heroRunGfx.generateTexture("hero-run", 48, 48);
    heroRunGfx.destroy();

    // Fallback enemy (red square)
    const enemyGfx = this.add.graphics();
    enemyGfx.fillStyle(0xff4444, 1);
    enemyGfx.fillRect(0, 0, 40, 40);
    enemyGfx.fillStyle(0xaa2222, 1);
    enemyGfx.fillRect(8, 8, 8, 8);
    enemyGfx.fillRect(24, 8, 8, 8);
    enemyGfx.generateTexture("enemy-a", 40, 40);
    enemyGfx.generateTexture("enemy-b", 40, 40);
    enemyGfx.destroy();

    // Fallback villain (dark red)
    const villainGfx = this.add.graphics();
    villainGfx.fillStyle(0xcc2222, 1);
    villainGfx.fillRect(0, 0, 56, 56);
    villainGfx.fillStyle(0xff0000, 1);
    villainGfx.fillRect(8, 8, 12, 12);
    villainGfx.fillRect(36, 8, 12, 12);
    villainGfx.generateTexture("villain", 56, 56);
    villainGfx.destroy();

    // Fallback collectible (yellow circle)
    const collectGfx = this.add.graphics();
    collectGfx.fillStyle(0xffdd00, 1);
    collectGfx.fillCircle(12, 12, 12);
    collectGfx.generateTexture("collectible", 24, 24);
    collectGfx.destroy();

    // Fallback power-up (golden star)
    const starGfx = this.add.graphics();
    starGfx.fillStyle(0xffd700, 1);
    starGfx.fillCircle(16, 16, 16);
    starGfx.fillStyle(0xffff00, 1);
    starGfx.fillCircle(16, 16, 10);
    starGfx.generateTexture("power-up", 32, 32);
    starGfx.destroy();

    // Platform tile
    const platformGfx = this.add.graphics();
    platformGfx.fillStyle(0x8b6914, 1);
    platformGfx.fillRect(0, 0, 64, 64);
    platformGfx.fillStyle(0x6b4e12, 1);
    platformGfx.fillRect(0, 0, 64, 8);
    platformGfx.lineStyle(1, 0x5a3e0a, 0.5);
    platformGfx.strokeRect(0, 0, 64, 64);
    platformGfx.generateTexture("platform-tile-0", 64, 64);
    platformGfx.destroy();

    // Exit portal
    const exitGfx = this.add.graphics();
    exitGfx.fillStyle(0x9900ff, 0.8);
    exitGfx.fillCircle(24, 24, 24);
    exitGfx.fillStyle(0xcc66ff, 0.6);
    exitGfx.fillCircle(24, 24, 14);
    exitGfx.generateTexture("exit-portal", 48, 48);
    exitGfx.destroy();
  }
}
