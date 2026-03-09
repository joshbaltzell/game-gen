/**
 * Procedural audio system — generates all SFX and music using Web Audio API.
 * No external audio files needed. Produces retro chiptune-style sounds.
 *
 * Completely standalone — does NOT use Phaser's sound system or cache.
 * This avoids React Strict Mode issues where Phaser scenes get destroyed
 * while async audio rendering is still in progress.
 *
 * Usage:
 *   const audio = new AudioManager();
 *   await audio.init();
 *   registry.set("audioManager", audio);
 *   audio.play("sfx-jump");
 *   audio.startMusic();
 */

export type SfxKey =
  | "sfx-jump"
  | "sfx-coin"
  | "sfx-enemy-hit"
  | "sfx-player-damage"
  | "sfx-weapon-fire"
  | "sfx-boss-defeat"
  | "sfx-level-complete"
  | "sfx-power-up";

export class AudioManager {
  private buffers = new Map<string, AudioBuffer>();
  private ctx: AudioContext | null = null;
  private musicSource: AudioBufferSourceNode | null = null;
  private musicGain: GainNode | null = null;
  private musicPlaying = false;
  private readonly musicKey = "music-bg";

  /** Generate all sound buffers. Safe to call even if scene is destroyed mid-render. */
  async init(): Promise<void> {
    const generators: [string, () => Promise<AudioBuffer>][] = [
      ["sfx-jump", () => this.genJump()],
      ["sfx-coin", () => this.genCoin()],
      ["sfx-enemy-hit", () => this.genEnemyHit()],
      ["sfx-player-damage", () => this.genPlayerDamage()],
      ["sfx-weapon-fire", () => this.genWeaponFire()],
      ["sfx-boss-defeat", () => this.genBossDefeat()],
      ["sfx-level-complete", () => this.genLevelComplete()],
      ["sfx-power-up", () => this.genPowerUp()],
      [this.musicKey, () => this.genBackgroundMusic()],
    ];

    for (const [key, generator] of generators) {
      try {
        const buffer = await generator();
        this.buffers.set(key, buffer);
      } catch (err) {
        console.warn(`AudioManager: failed to generate "${key}"`, err);
      }
    }
  }

  /** Lazily create or return the shared AudioContext */
  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  /** Play a sound effect by key */
  play(key: SfxKey): void {
    try {
      const buffer = this.buffers.get(key);
      if (!buffer) return;

      const ctx = this.getContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.value = 0.5;

      source.connect(gain).connect(ctx.destination);
      source.start(0);
    } catch {
      // Ignore play errors
    }
  }

  /** Start background music loop */
  startMusic(): void {
    try {
      if (this.musicPlaying) return;

      const buffer = this.buffers.get(this.musicKey);
      if (!buffer) return;

      const ctx = this.getContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      this.musicSource = ctx.createBufferSource();
      this.musicSource.buffer = buffer;
      this.musicSource.loop = true;

      this.musicGain = ctx.createGain();
      this.musicGain.gain.value = 0.25;

      this.musicSource.connect(this.musicGain).connect(ctx.destination);
      this.musicSource.start(0);
      this.musicPlaying = true;
    } catch {
      // Ignore
    }
  }

  /** Stop background music */
  stopMusic(): void {
    try {
      if (this.musicSource) {
        this.musicSource.stop();
        this.musicSource.disconnect();
        this.musicSource = null;
      }
      if (this.musicGain) {
        this.musicGain.disconnect();
        this.musicGain = null;
      }
      this.musicPlaying = false;
    } catch {
      // Ignore
    }
  }

  /** Stop all audio (music + close context) */
  stopAll(): void {
    this.stopMusic();
    try {
      if (this.ctx && this.ctx.state !== "closed") {
        this.ctx.close();
        this.ctx = null;
      }
    } catch {
      // Ignore
    }
  }

  // ═══════════════════════════════════════════════════════
  // Sound generation helpers (using OfflineAudioContext)
  // ═══════════════════════════════════════════════════════

  private render(
    duration: number,
    setup: (ctx: OfflineAudioContext) => void,
  ): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const offline = new OfflineAudioContext(1, sampleRate * duration, sampleRate);
    setup(offline);
    return offline.startRendering();
  }

  // ── Jump: short ascending sweep ──
  private genJump(): Promise<AudioBuffer> {
    return this.render(0.15, (ctx) => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(200, 0);
      osc.frequency.exponentialRampToValueAtTime(600, 0.15);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, 0);
      gain.gain.exponentialRampToValueAtTime(0.01, 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(0);
      osc.stop(0.15);
    });
  }

  // ── Coin collect: two-note chime E6 → A6 ──
  private genCoin(): Promise<AudioBuffer> {
    return this.render(0.2, (ctx) => {
      const osc1 = ctx.createOscillator();
      osc1.type = "square";
      osc1.frequency.value = 1319; // E6
      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.25, 0);
      gain1.gain.setValueAtTime(0, 0.08);
      osc1.connect(gain1).connect(ctx.destination);
      osc1.start(0);
      osc1.stop(0.08);

      const osc2 = ctx.createOscillator();
      osc2.type = "square";
      osc2.frequency.value = 1760; // A6
      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0, 0.079);
      gain2.gain.setValueAtTime(0.25, 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, 0.2);
      osc2.connect(gain2).connect(ctx.destination);
      osc2.start(0.08);
      osc2.stop(0.2);
    });
  }

  // ── Enemy hit: noise burst + low descending tone ──
  private genEnemyHit(): Promise<AudioBuffer> {
    return this.render(0.12, (ctx) => {
      // Noise burst
      const noiseLen = Math.floor(0.12 * 44100);
      const noiseBuffer = ctx.createBuffer(1, noiseLen, 44100);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, 0);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, 0.12);
      noise.connect(noiseGain).connect(ctx.destination);
      noise.start(0);

      // Low tone
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(150, 0);
      osc.frequency.exponentialRampToValueAtTime(50, 0.12);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, 0);
      gain.gain.exponentialRampToValueAtTime(0.01, 0.12);
      osc.connect(gain).connect(ctx.destination);
      osc.start(0);
      osc.stop(0.12);
    });
  }

  // ── Player damage: descending sawtooth buzz ──
  private genPlayerDamage(): Promise<AudioBuffer> {
    return this.render(0.3, (ctx) => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(400, 0);
      osc.frequency.exponentialRampToValueAtTime(80, 0.3);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, 0);
      gain.gain.linearRampToValueAtTime(0, 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(0);
      osc.stop(0.3);
    });
  }

  // ── Weapon fire: quick descending triangle burst ──
  private genWeaponFire(): Promise<AudioBuffer> {
    return this.render(0.1, (ctx) => {
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, 0);
      osc.frequency.exponentialRampToValueAtTime(200, 0.1);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, 0);
      gain.gain.exponentialRampToValueAtTime(0.01, 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start(0);
      osc.stop(0.1);
    });
  }

  // ── Boss defeat: dramatic ascending arpeggio C5-E5-G5-C6 ──
  private genBossDefeat(): Promise<AudioBuffer> {
    return this.render(1.0, (ctx) => {
      const notes = [523, 659, 784, 1047];
      const starts = [0, 0.2, 0.4, 0.6];
      const durs = [0.2, 0.2, 0.2, 0.4];
      for (let i = 0; i < notes.length; i++) {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = notes[i];
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, starts[i]);
        gain.gain.exponentialRampToValueAtTime(0.01, starts[i] + durs[i]);
        osc.connect(gain).connect(ctx.destination);
        osc.start(starts[i]);
        osc.stop(starts[i] + durs[i]);
      }
    });
  }

  // ── Level complete: fast ascending arpeggio ──
  private genLevelComplete(): Promise<AudioBuffer> {
    return this.render(0.8, (ctx) => {
      const notes = [523, 659, 784, 1047];
      for (let i = 0; i < notes.length; i++) {
        const t = i * 0.12;
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = notes[i];
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      }
    });
  }

  // ── Power-up: rising bright sweep ──
  private genPowerUp(): Promise<AudioBuffer> {
    return this.render(0.3, (ctx) => {
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(400, 0);
      osc.frequency.exponentialRampToValueAtTime(1200, 0.25);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.25, 0);
      gain.gain.exponentialRampToValueAtTime(0.01, 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(0);
      osc.stop(0.3);
    });
  }

  // ── Background music: 4-second looping chiptune melody + bass ──
  private genBackgroundMusic(): Promise<AudioBuffer> {
    const duration = 4.0;
    return this.render(duration, (ctx) => {
      // Melody: C major pentatonic phrase (square wave)
      const melody = [
        523, 587, 659, 784, 659, 587, 523, 440, // bar 1-2
        523, 659, 784, 880, 784, 659, 523, 587, // bar 3-4
      ];
      const noteLen = duration / melody.length; // 0.25s per note

      for (let i = 0; i < melody.length; i++) {
        const t = i * noteLen;
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.value = melody[i];
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.setValueAtTime(0.12, t + noteLen * 0.8);
        gain.gain.linearRampToValueAtTime(0, t + noteLen * 0.95);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + noteLen);
      }

      // Bass: root notes (triangle wave)
      const bass = [262, 262, 220, 220, 262, 262, 294, 294];
      const bassLen = duration / bass.length; // 0.5s per note
      for (let i = 0; i < bass.length; i++) {
        const t = i * bassLen;
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = bass[i];
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.setValueAtTime(0.15, t + bassLen * 0.7);
        gain.gain.linearRampToValueAtTime(0, t + bassLen * 0.95);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + bassLen);
      }
    });
  }
}
