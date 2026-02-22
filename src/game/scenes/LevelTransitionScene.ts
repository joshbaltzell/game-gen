import Phaser from "phaser";
import { EventBus } from "../EventBus";

interface TransitionData {
  nextLevelIndex: number;
  score: number;
  lives: number;
  chapterTitle?: string;
  chapterNarrative?: string;
  chapterObjective?: string;
  illustrationKey?: string;
}

export class LevelTransitionScene extends Phaser.Scene {
  private nextLevelIndex: number = 0;
  private score: number = 0;
  private lives: number = 3;
  private chapterTitle: string = "";
  private chapterNarrative: string = "";
  private chapterObjective: string = "";
  private illustrationKey: string = "";
  private canContinue: boolean = false;

  constructor() {
    super("LevelTransitionScene");
  }

  init(data: TransitionData): void {
    this.nextLevelIndex = data.nextLevelIndex;
    this.score = data.score;
    this.lives = data.lives ?? 3;
    this.chapterTitle = data.chapterTitle || "";
    this.chapterNarrative = data.chapterNarrative || "";
    this.chapterObjective = data.chapterObjective || "";
    this.illustrationKey = data.illustrationKey || "";
    this.canContinue = false;
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    let yPos = 30;

    // Level complete banner
    this.add
      .text(width / 2, yPos, `Level ${this.nextLevelIndex} Complete!`, {
        fontSize: "24px",
        color: "#00d4ff",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);
    yPos += 40;

    // Score
    this.add
      .text(width / 2, yPos, `Score: ${this.score}`, {
        fontSize: "16px",
        color: "#ffffff",
        fontFamily: "monospace",
      })
      .setOrigin(0.5, 0);
    yPos += 40;

    // Chapter illustration (if texture exists)
    if (this.illustrationKey && this.textures.exists(this.illustrationKey)) {
      const img = this.add
        .image(width / 2, yPos, this.illustrationKey)
        .setOrigin(0.5, 0);

      // Scale illustration to fit within ~70% of width
      const maxW = width * 0.7;
      const maxH = height * 0.25;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      img.setScale(scale);
      yPos += img.height * scale + 20;
    }

    // Chapter title
    if (this.chapterTitle) {
      this.add
        .text(width / 2, yPos, `Chapter ${this.nextLevelIndex + 1}`, {
          fontSize: "12px",
          color: "#00d4ff",
          fontFamily: "monospace",
        })
        .setOrigin(0.5, 0);
      yPos += 20;

      this.add
        .text(width / 2, yPos, this.chapterTitle, {
          fontSize: "18px",
          color: "#ffffff",
          fontFamily: "monospace",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0);
      yPos += 30;
    }

    // Chapter narrative with typewriter effect
    if (this.chapterNarrative) {
      const narrativeText = this.add
        .text(width / 2, yPos, "", {
          fontSize: "13px",
          color: "#cccccc",
          fontFamily: "monospace",
          wordWrap: { width: width * 0.8 },
          lineSpacing: 4,
        })
        .setOrigin(0.5, 0);

      const fullText = this.chapterNarrative;
      let charIndex = 0;

      this.time.addEvent({
        delay: 25,
        repeat: fullText.length - 1,
        callback: () => {
          charIndex++;
          narrativeText.setText(fullText.slice(0, charIndex));

          if (charIndex >= fullText.length) {
            this.showObjectiveAndContinue(width, narrativeText.y + narrativeText.height + 20);
          }
        },
      });

      // Allow tap to skip typewriter
      this.input.once("pointerdown", () => {
        if (!this.canContinue) {
          // Skip to end of typewriter
          narrativeText.setText(fullText);
          this.time.removeAllEvents();
          this.showObjectiveAndContinue(width, narrativeText.y + narrativeText.height + 20);
        }
      });
    } else {
      this.showObjectiveAndContinue(width, yPos + 20);
    }

    EventBus.emit("current-scene-ready", this);
  }

  private showObjectiveAndContinue(screenWidth: number, yStart: number): void {
    let y = yStart;

    // Objective
    if (this.chapterObjective) {
      this.add
        .text(screenWidth / 2, y, "OBJECTIVE", {
          fontSize: "11px",
          color: "#ffaa00",
          fontFamily: "monospace",
        })
        .setOrigin(0.5, 0);
      y += 18;

      this.add
        .text(screenWidth / 2, y, this.chapterObjective, {
          fontSize: "13px",
          color: "#ffffff",
          fontFamily: "monospace",
          wordWrap: { width: screenWidth * 0.8 },
        })
        .setOrigin(0.5, 0);
      y += 40;
    }

    // Continue prompt
    const continueText = this.add
      .text(screenWidth / 2, Math.min(y + 10, this.scale.height - 40), "Tap to continue", {
        fontSize: "16px",
        color: "#aaaaaa",
        fontFamily: "monospace",
      })
      .setOrigin(0.5, 0);

    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.canContinue = true;

    // Continue on tap
    this.input.on("pointerdown", () => {
      if (this.canContinue) {
        this.scene.start("GameScene", {
          levelIndex: this.nextLevelIndex,
          score: this.score,
          lives: this.lives,
        });
      }
    });

    // Or keyboard
    this.input.keyboard?.on("keydown-SPACE", () => {
      if (this.canContinue) {
        this.scene.start("GameScene", {
          levelIndex: this.nextLevelIndex,
          score: this.score,
          lives: this.lives,
        });
      }
    });
  }
}
