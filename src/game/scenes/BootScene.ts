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
    this.createHeroAnimations();
    this.scene.start("PreloadScene");
  }

  /** Register all hero animations after textures exist */
  private createHeroAnimations(): void {
    // Idle — gentle breathing cycle
    this.anims.create({
      key: "hero-anim-idle",
      frames: [
        { key: "hero-idle-0" },
        { key: "hero-idle-1" },
        { key: "hero-idle-2" },
        { key: "hero-idle-1" },
      ],
      frameRate: 3,
      repeat: -1,
    });

    // Run — 4-frame run cycle
    this.anims.create({
      key: "hero-anim-run",
      frames: [
        { key: "hero-run-0" },
        { key: "hero-run-1" },
        { key: "hero-run-2" },
        { key: "hero-run-3" },
      ],
      frameRate: 10,
      repeat: -1,
    });

    // Jump — single ascending frame
    this.anims.create({
      key: "hero-anim-jump",
      frames: [{ key: "hero-jump-0" }],
      frameRate: 1,
      repeat: 0,
    });

    // Fall — single descending frame
    this.anims.create({
      key: "hero-anim-fall",
      frames: [{ key: "hero-fall-0" }],
      frameRate: 1,
      repeat: 0,
    });

    // Turn/skid
    this.anims.create({
      key: "hero-anim-turn",
      frames: [{ key: "hero-turn-0" }],
      frameRate: 1,
      repeat: 0,
    });

    // Attack — quick 2-frame punch
    this.anims.create({
      key: "hero-anim-attack",
      frames: [
        { key: "hero-attack-0" },
        { key: "hero-attack-1" },
      ],
      frameRate: 12,
      repeat: 0,
    });

    // Celebrate — pumping fists
    this.anims.create({
      key: "hero-anim-celebrate",
      frames: [
        { key: "hero-celebrate-0" },
        { key: "hero-celebrate-1" },
        { key: "hero-celebrate-2" },
        { key: "hero-celebrate-1" },
      ],
      frameRate: 6,
      repeat: -1,
    });
  }

  /** Draw all hero sprite frames programmatically in SNES pixel-art style */
  private createHeroFrames(): void {
    const C = {
      outline: 0x0b132b,
      body: 0x2ec4b6,
      bodyDk: 0x1a936f,
      bodyLt: 0x7efce0,
      visor: 0xffffff,
      eye: 0x0b132b,
      boot: 0x1a936f,
      bootDk: 0x146b54,
      belt: 0xf4a261,
      arm: 0x2ec4b6,
    };

    // ── Helper: draw the base hero with variable limb positions ──
    const drawHero = (
      g: Phaser.GameObjects.Graphics,
      opts: {
        bodyY?: number;  // vertical offset for body bob
        lLegX?: number; lLegY?: number;  // left leg offset
        rLegX?: number; rLegY?: number;  // right leg offset
        lArmX?: number; lArmY?: number; lArmW?: number; lArmH?: number;
        rArmX?: number; rArmY?: number; rArmW?: number; rArmH?: number;
        mouthOpen?: boolean;
        eyesBlink?: boolean;
        armRaise?: number; // 0 = normal, 1 = half up, 2 = full up
      } = {},
    ) => {
      const by = opts.bodyY ?? 0;

      // ── Outline layer (draw everything 1px bigger first) ──
      g.fillStyle(C.outline, 1);

      // Head outline
      g.fillRoundedRect(9, 2 + by, 30, 20, 4);
      // Body outline
      g.fillRoundedRect(11, 18 + by, 26, 16, 3);

      // ── Boots / legs ──
      const llx = 12 + (opts.lLegX ?? 0);
      const lly = 34 + (opts.lLegY ?? 0) + by;
      const rlx = 28 + (opts.rLegX ?? 0);
      const rly = 34 + (opts.rLegY ?? 0) + by;

      // Boot outlines
      g.fillRoundedRect(llx - 1, lly - 1, 10, 12, 2);
      g.fillRoundedRect(rlx - 1, rly - 1, 10, 12, 2);
      // Boot fill
      g.fillStyle(C.boot, 1);
      g.fillRoundedRect(llx, lly, 8, 10, 2);
      g.fillRoundedRect(rlx, rly, 8, 10, 2);
      // Boot sole
      g.fillStyle(C.bootDk, 1);
      g.fillRect(llx, lly + 7, 8, 3);
      g.fillRect(rlx, rly + 7, 8, 3);

      // ── Body ──
      g.fillStyle(C.body, 1);
      g.fillRoundedRect(12, 19 + by, 24, 14, 3);
      // Body shading
      g.fillStyle(C.bodyDk, 1);
      g.fillRect(12, 29 + by, 24, 4);
      // Belt
      g.fillStyle(C.belt, 1);
      g.fillRect(14, 27 + by, 20, 3);

      // ── Arms ──
      const armRaise = opts.armRaise ?? 0;
      const defArmY = armRaise === 2 ? 10 : armRaise === 1 ? 15 : 20;

      const lax = opts.lArmX ?? 6;
      const lay = (opts.lArmY ?? defArmY) + by;
      const law = opts.lArmW ?? 8;
      const lah = opts.lArmH ?? 12;
      const rax = opts.rArmX ?? 34;
      const ray = (opts.rArmY ?? defArmY) + by;
      const raw = opts.rArmW ?? 8;
      const rah = opts.rArmH ?? 12;

      // Arm outlines
      g.fillStyle(C.outline, 1);
      g.fillRoundedRect(lax - 1, lay - 1, law + 2, lah + 2, 2);
      g.fillRoundedRect(rax - 1, ray - 1, raw + 2, rah + 2, 2);
      // Arm fills
      g.fillStyle(C.arm, 1);
      g.fillRoundedRect(lax, lay, law, lah, 2);
      g.fillRoundedRect(rax, ray, raw, rah, 2);
      // Arm highlight
      g.fillStyle(C.bodyLt, 0.3);
      g.fillRect(lax + 1, lay + 1, 3, lah - 3);
      g.fillRect(rax + 1, ray + 1, 3, rah - 3);

      // ── Head ──
      g.fillStyle(C.body, 1);
      g.fillRoundedRect(10, 3 + by, 28, 18, 4);
      // Helmet top highlight
      g.fillStyle(C.bodyLt, 0.5);
      g.fillRoundedRect(14, 3 + by, 20, 4, 2);
      // Helmet dark stripe
      g.fillStyle(C.bodyDk, 1);
      g.fillRect(10, 8 + by, 28, 2);

      // ── Visor ──
      g.fillStyle(C.visor, 1);
      g.fillRoundedRect(14, 11 + by, 20, 7, 2);
      // Visor shine
      g.fillStyle(C.bodyLt, 0.4);
      g.fillRect(15, 11 + by, 8, 2);

      // ── Eyes (inside visor) ──
      if (!opts.eyesBlink) {
        g.fillStyle(C.eye, 1);
        g.fillRect(17, 13 + by, 4, 4);
        g.fillRect(27, 13 + by, 4, 4);
        // Eye highlights
        g.fillStyle(0xffffff, 0.8);
        g.fillRect(18, 13 + by, 2, 2);
        g.fillRect(28, 13 + by, 2, 2);
      } else {
        // Blink — just a line
        g.fillStyle(C.eye, 1);
        g.fillRect(17, 15 + by, 4, 1);
        g.fillRect(27, 15 + by, 4, 1);
      }

      // ── Mouth area ──
      if (opts.mouthOpen) {
        g.fillStyle(C.outline, 1);
        g.fillRect(20, 19 + by, 8, 3);
      }

      // ── Body highlight ──
      g.fillStyle(C.bodyLt, 0.25);
      g.fillRect(13, 20 + by, 4, 8);
    };

    // ════════════════════════════════════════
    // IDLE frames (3) — subtle breathing bob
    // ════════════════════════════════════════
    for (let i = 0; i < 3; i++) {
      const g = this.add.graphics();
      drawHero(g, {
        bodyY: i === 1 ? -1 : i === 2 ? 0 : 0,
        eyesBlink: i === 2, // blink on frame 2
      });
      g.generateTexture(`hero-idle-${i}`, 48, 48);
      g.destroy();
    }

    // Also generate the old static keys for backwards compat
    const idleCompat = this.add.graphics();
    drawHero(idleCompat, {});
    idleCompat.generateTexture("hero-idle", 48, 48);
    idleCompat.destroy();

    // ════════════════════════════════════════
    // RUN frames (4) — classic run cycle
    // ════════════════════════════════════════
    const runPoses = [
      // Frame 0: right leg forward, left leg back
      { lLegX: -4, lLegY: -4, rLegX: 4, rLegY: 2, lArmX: 34, lArmY: 18, rArmX: 4, rArmY: 22, bodyY: 0 },
      // Frame 1: passing (legs together, body up)
      { lLegX: 0, lLegY: 0, rLegX: 0, rLegY: 0, bodyY: -2 },
      // Frame 2: left leg forward, right leg back
      { lLegX: 4, lLegY: 2, rLegX: -4, rLegY: -4, lArmX: 4, lArmY: 22, rArmX: 34, rArmY: 18, bodyY: 0 },
      // Frame 3: passing (legs together, body up)
      { lLegX: 0, lLegY: -1, rLegX: 0, rLegY: -1, bodyY: -2 },
    ];
    for (let i = 0; i < 4; i++) {
      const g = this.add.graphics();
      drawHero(g, runPoses[i]);
      g.generateTexture(`hero-run-${i}`, 48, 48);
      g.destroy();
    }

    // Static run key for compat
    const runCompat = this.add.graphics();
    drawHero(runCompat, runPoses[0]);
    runCompat.generateTexture("hero-run", 48, 48);
    runCompat.destroy();

    // ════════════════════════════════════════
    // JUMP frame — arms up, legs tucked
    // ════════════════════════════════════════
    {
      const g = this.add.graphics();
      drawHero(g, {
        bodyY: -2,
        lLegX: 2, lLegY: -3, rLegX: -2, rLegY: -3,
        armRaise: 2,
        lArmX: 4, lArmW: 7, lArmH: 10,
        rArmX: 36, rArmW: 7, rArmH: 10,
      });
      g.generateTexture("hero-jump-0", 48, 48);
      g.destroy();
    }

    // ════════════════════════════════════════
    // FALL frame — arms out, legs spread
    // ════════════════════════════════════════
    {
      const g = this.add.graphics();
      drawHero(g, {
        bodyY: 1,
        lLegX: -3, lLegY: 2, rLegX: 3, rLegY: 2,
        lArmX: 2, lArmY: 16, lArmW: 9, lArmH: 10,
        rArmX: 37, rArmY: 16, rArmW: 9, rArmH: 10,
      });
      g.generateTexture("hero-fall-0", 48, 48);
      g.destroy();
    }

    // ════════════════════════════════════════
    // TURN/SKID frame — leaning back
    // ════════════════════════════════════════
    {
      const g = this.add.graphics();
      drawHero(g, {
        bodyY: 1,
        lLegX: 4, lLegY: 1, rLegX: -2, rLegY: 0,
        lArmX: 4, lArmY: 24, lArmW: 8, lArmH: 8,
        rArmX: 34, rArmY: 18, rArmW: 8, rArmH: 10,
      });
      // Dust puff behind character
      g.fillStyle(0xffffff, 0.3);
      g.fillCircle(8, 42, 5);
      g.fillCircle(4, 40, 3);
      g.generateTexture("hero-turn-0", 48, 48);
      g.destroy();
    }

    // ════════════════════════════════════════
    // ATTACK frames (2) — arm thrust forward
    // ════════════════════════════════════════
    {
      // Frame 0: wind up — arm pulled back
      const g0 = this.add.graphics();
      drawHero(g0, {
        lArmX: 2, lArmY: 18, lArmW: 8, lArmH: 10,
        rArmX: 32, rArmY: 22, rArmW: 10, rArmH: 8,
        bodyY: 1,
      });
      g0.generateTexture("hero-attack-0", 48, 48);
      g0.destroy();

      // Frame 1: thrust — arm extended forward with energy
      const g1 = this.add.graphics();
      drawHero(g1, {
        lArmX: 2, lArmY: 20, lArmW: 7, lArmH: 10,
        rArmX: 36, rArmY: 18, rArmW: 12, rArmH: 8,
        bodyY: -1,
      });
      // Muzzle flash / energy burst
      g1.fillStyle(0xffdd00, 0.7);
      g1.fillCircle(47, 22, 5);
      g1.fillStyle(0xffffff, 0.5);
      g1.fillCircle(47, 22, 3);
      g1.generateTexture("hero-attack-1", 48, 48);
      g1.destroy();
    }

    // ════════════════════════════════════════
    // CELEBRATE frames (3) — victory fist pump
    // ════════════════════════════════════════
    {
      // Frame 0: arms down, about to jump
      const g0 = this.add.graphics();
      drawHero(g0, { bodyY: 2, mouthOpen: true });
      g0.generateTexture("hero-celebrate-0", 48, 48);
      g0.destroy();

      // Frame 1: jump with one arm up
      const g1 = this.add.graphics();
      drawHero(g1, {
        bodyY: -4,
        lLegX: -2, lLegY: -2, rLegX: 2, rLegY: -2,
        armRaise: 1,
        rArmX: 36, rArmY: 6, rArmW: 8, rArmH: 10,
        mouthOpen: true,
      });
      // Sparkle
      g1.fillStyle(0xffd700, 1);
      g1.fillRect(40, 2, 3, 3);
      g1.fillRect(44, 6, 2, 2);
      g1.generateTexture("hero-celebrate-1", 48, 48);
      g1.destroy();

      // Frame 2: both arms up, peak of jump
      const g2 = this.add.graphics();
      drawHero(g2, {
        bodyY: -6,
        lLegX: -3, lLegY: -4, rLegX: 3, rLegY: -4,
        armRaise: 2,
        mouthOpen: true,
      });
      // Sparkles
      g2.fillStyle(0xffd700, 1);
      g2.fillRect(2, 2, 3, 3);
      g2.fillRect(42, 0, 3, 3);
      g2.fillStyle(0xffffff, 0.8);
      g2.fillRect(6, 6, 2, 2);
      g2.fillRect(38, 4, 2, 2);
      g2.generateTexture("hero-celebrate-2", 48, 48);
      g2.destroy();
    }
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

    // ══════════════════════════════════════════════════════
    // HERO — SNES-style animated character (Mega Man / Mario vibe)
    //
    // Palette: teal #2ec4b6, dark teal #1a936f, highlight #7efce0
    //          outline #0b132b, visor white, eyes dark, boots dark teal
    // Canvas: 48x48 per frame
    // ══════════════════════════════════════════════════════

    this.createHeroFrames();

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
