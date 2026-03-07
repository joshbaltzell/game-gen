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

    // ── Fire button — orange accent ──
    const fireGfx = this.add.graphics();
    fireGfx.fillStyle(0xf4a261, 0.7);
    fireGfx.fillCircle(30, 30, 30);
    fireGfx.lineStyle(3, 0xffffff, 0.9);
    fireGfx.strokeCircle(30, 30, 30);
    // X symbol
    fireGfx.lineStyle(4, 0xffffff, 1);
    fireGfx.lineBetween(18, 18, 42, 42);
    fireGfx.lineBetween(42, 18, 18, 42);
    fireGfx.generateTexture("fire-button", 60, 60);
    fireGfx.destroy();

    // ── Projectile: fireball — orange/red ball ──
    const fbGfx = this.add.graphics();
    fbGfx.fillStyle(0xff6b35, 1);
    fbGfx.fillCircle(8, 8, 8);
    fbGfx.fillStyle(0xffdd00, 0.8);
    fbGfx.fillCircle(6, 6, 4);
    fbGfx.generateTexture("projectile-fireball", 16, 16);
    fbGfx.destroy();

    // ── Projectile: boomerang — cyan diamond ──
    const bmGfx = this.add.graphics();
    bmGfx.fillStyle(0x00d4ff, 1);
    bmGfx.fillTriangle(8, 0, 16, 8, 8, 16);
    bmGfx.fillTriangle(8, 0, 0, 8, 8, 16);
    bmGfx.fillStyle(0xffffff, 0.6);
    bmGfx.fillCircle(8, 8, 3);
    bmGfx.generateTexture("projectile-boomerang", 16, 16);
    bmGfx.destroy();

    // ── Projectile: wave — wide teal arc ──
    const wvGfx = this.add.graphics();
    wvGfx.fillStyle(0x2ec4b6, 0.8);
    wvGfx.fillEllipse(16, 10, 32, 20);
    wvGfx.fillStyle(0xffffff, 0.4);
    wvGfx.fillEllipse(14, 8, 20, 10);
    wvGfx.generateTexture("projectile-wave", 32, 20);
    wvGfx.destroy();

    // ── Boss: Charger — red armored bull-like beast ──
    const chargerGfx = this.add.graphics();
    // Body
    chargerGfx.fillStyle(0xc9184a, 1);
    chargerGfx.fillRoundedRect(4, 10, 52, 38, 6);
    // Armor plates
    chargerGfx.fillStyle(0x8b0a30, 1);
    chargerGfx.fillRect(8, 12, 44, 6);
    chargerGfx.fillRect(8, 40, 44, 6);
    // Horns
    chargerGfx.fillStyle(0xffd700, 1);
    chargerGfx.fillTriangle(4, 14, 0, 2, 12, 10);
    chargerGfx.fillTriangle(48, 14, 56, 2, 44, 10);
    // Eyes — angry red glow
    chargerGfx.fillStyle(0xff0000, 1);
    chargerGfx.fillRect(14, 20, 10, 8);
    chargerGfx.fillRect(36, 20, 10, 8);
    chargerGfx.fillStyle(0xffffff, 1);
    chargerGfx.fillRect(16, 22, 4, 4);
    chargerGfx.fillRect(38, 22, 4, 4);
    // Mouth / grille
    chargerGfx.fillStyle(0x0b132b, 1);
    chargerGfx.fillRect(18, 34, 24, 6);
    chargerGfx.generateTexture("boss-charger", 60, 52);
    chargerGfx.destroy();

    // ── Boss: Orbiter — purple crystal entity ──
    const orbiterGfx = this.add.graphics();
    // Outer glow
    orbiterGfx.fillStyle(0x7b2cbf, 0.3);
    orbiterGfx.fillCircle(28, 28, 28);
    // Inner body
    orbiterGfx.fillStyle(0x9d4edd, 1);
    orbiterGfx.fillCircle(28, 28, 20);
    // Crystal facets
    orbiterGfx.fillStyle(0xc77dff, 0.7);
    orbiterGfx.fillTriangle(28, 8, 18, 24, 38, 24);
    // Eye — single glowing eye
    orbiterGfx.fillStyle(0xff006e, 1);
    orbiterGfx.fillCircle(28, 26, 7);
    orbiterGfx.fillStyle(0xffffff, 1);
    orbiterGfx.fillCircle(26, 24, 3);
    // Floating fragments
    orbiterGfx.fillStyle(0xc77dff, 0.8);
    orbiterGfx.fillRect(6, 6, 6, 6);
    orbiterGfx.fillRect(44, 6, 6, 6);
    orbiterGfx.fillRect(6, 44, 6, 6);
    orbiterGfx.fillRect(44, 44, 6, 6);
    orbiterGfx.generateTexture("boss-orbiter", 56, 56);
    orbiterGfx.destroy();

    // ── Boss: Overlord — massive dark warlord with cape ──
    const overlordGfx = this.add.graphics();
    // Cape
    overlordGfx.fillStyle(0x4a0e2e, 1);
    overlordGfx.fillTriangle(4, 20, 32, 8, 60, 20);
    overlordGfx.fillRect(6, 20, 52, 40);
    // Body
    overlordGfx.fillStyle(0x1a0a1e, 1);
    overlordGfx.fillRoundedRect(10, 12, 44, 44, 6);
    // Armor
    overlordGfx.fillStyle(0xc9184a, 1);
    overlordGfx.fillRect(14, 14, 36, 4);
    overlordGfx.fillRect(14, 50, 36, 4);
    // Crown — triple-pointed
    overlordGfx.fillStyle(0xffd700, 1);
    overlordGfx.fillRect(16, 4, 32, 10);
    overlordGfx.fillTriangle(16, 4, 22, -6, 28, 4);
    overlordGfx.fillTriangle(26, 4, 32, -8, 38, 4);
    overlordGfx.fillTriangle(36, 4, 42, -6, 48, 4);
    // Eyes — glowing purple
    overlordGfx.fillStyle(0xff006e, 1);
    overlordGfx.fillRect(18, 24, 10, 10);
    overlordGfx.fillRect(36, 24, 10, 10);
    overlordGfx.fillStyle(0xffffff, 1);
    overlordGfx.fillRect(20, 26, 5, 5);
    overlordGfx.fillRect(38, 26, 5, 5);
    // Mouth — jagged
    overlordGfx.fillStyle(0xff006e, 0.8);
    overlordGfx.fillRect(22, 40, 20, 4);
    overlordGfx.fillTriangle(22, 40, 26, 36, 30, 40);
    overlordGfx.fillTriangle(34, 40, 38, 36, 42, 40);
    overlordGfx.generateTexture("boss-overlord", 64, 64);
    overlordGfx.destroy();

    // ── Shield orb — for orbiter boss ──
    const shieldGfx = this.add.graphics();
    shieldGfx.fillStyle(0xc77dff, 0.8);
    shieldGfx.fillCircle(12, 12, 12);
    shieldGfx.fillStyle(0xffffff, 0.5);
    shieldGfx.fillCircle(10, 9, 5);
    shieldGfx.generateTexture("shield-orb", 24, 24);
    shieldGfx.destroy();

    // ── Shockwave — for overlord ground slam ──
    const swGfx = this.add.graphics();
    swGfx.fillStyle(0xff006e, 0.7);
    swGfx.fillEllipse(24, 12, 48, 24);
    swGfx.fillStyle(0xffffff, 0.3);
    swGfx.fillEllipse(20, 8, 24, 12);
    swGfx.generateTexture("shockwave", 48, 24);
    swGfx.destroy();

    // ── Boss projectile — for overlord phase 2 ──
    const bpGfx = this.add.graphics();
    bpGfx.fillStyle(0xff006e, 1);
    bpGfx.fillCircle(10, 10, 10);
    bpGfx.fillStyle(0xff4444, 0.7);
    bpGfx.fillCircle(8, 8, 5);
    bpGfx.generateTexture("boss-projectile", 20, 20);
    bpGfx.destroy();

    // ── Weapon pickup — cycling weapon box ──
    const wpGfx = this.add.graphics();
    wpGfx.fillStyle(0x293241, 1);
    wpGfx.fillRoundedRect(0, 0, 28, 28, 4);
    wpGfx.lineStyle(2, 0x00d4ff, 1);
    wpGfx.strokeRoundedRect(0, 0, 28, 28, 4);
    wpGfx.fillStyle(0xff6b35, 1);
    wpGfx.fillCircle(14, 14, 6);
    wpGfx.fillStyle(0xffffff, 0.8);
    wpGfx.fillCircle(12, 11, 2);
    wpGfx.generateTexture("weapon-pickup", 28, 28);
    wpGfx.destroy();
  }
}
