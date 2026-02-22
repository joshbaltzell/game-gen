import Phaser from "phaser";
import { EventBus } from "../EventBus";

export class LevelTransitionScene extends Phaser.Scene {
  private nextLevelIndex: number = 0;
  private score: number = 0;

  constructor() {
    super("LevelTransitionScene");
  }

  init(data: { nextLevelIndex: number; score: number }): void {
    this.nextLevelIndex = data.nextLevelIndex;
    this.score = data.score;
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    // Level complete text
    this.add
      .text(width / 2, height * 0.3, `Level ${this.nextLevelIndex} Complete!`, {
        fontSize: "28px",
        color: "#00d4ff",
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Score
    this.add
      .text(width / 2, height * 0.45, `Score: ${this.score}`, {
        fontSize: "20px",
        color: "#ffffff",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    // Next level prompt
    const continueText = this.add
      .text(width / 2, height * 0.7, "Tap to continue", {
        fontSize: "18px",
        color: "#aaaaaa",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    // Blink effect
    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Continue on tap/click
    this.input.once("pointerdown", () => {
      this.scene.start("GameScene", { levelIndex: this.nextLevelIndex });
    });

    // Or keyboard
    this.input.keyboard?.once("keydown-SPACE", () => {
      this.scene.start("GameScene", { levelIndex: this.nextLevelIndex });
    });

    EventBus.emit("current-scene-ready", this);
  }
}
