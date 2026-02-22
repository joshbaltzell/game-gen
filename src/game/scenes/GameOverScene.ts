import Phaser from "phaser";
import { EventBus } from "../EventBus";

export class GameOverScene extends Phaser.Scene {
  private victory: boolean = false;
  private finalScore: number = 0;

  constructor() {
    super("GameOverScene");
  }

  init(data: { victory: boolean; score: number }): void {
    this.victory = data.victory;
    this.finalScore = data.score;
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    const titleColor = this.victory ? "#44ff44" : "#ff4444";
    const titleText = this.victory ? "Victory!" : "Game Over";

    this.add
      .text(width / 2, height * 0.2, titleText, {
        fontSize: "36px",
        color: titleColor,
        fontFamily: "monospace",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // Score
    this.add
      .text(width / 2, height * 0.3, `Final Score: ${this.finalScore}`, {
        fontSize: "22px",
        color: "#ffffff",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    // Epilogue (on victory, if story data exists)
    if (this.victory) {
      const story = this.registry.get("story") as {
        epilogue?: string;
      } | null;

      if (story?.epilogue) {
        const epilogueText = this.add
          .text(width / 2, height * 0.4, "", {
            fontSize: "13px",
            color: "#cccccc",
            fontFamily: "monospace",
            wordWrap: { width: width * 0.8 },
            lineSpacing: 4,
          })
          .setOrigin(0.5, 0);

        // Typewriter effect for epilogue
        const fullText = story.epilogue;
        let charIndex = 0;

        this.time.addEvent({
          delay: 25,
          repeat: fullText.length - 1,
          callback: () => {
            charIndex++;
            epilogueText.setText(fullText.slice(0, charIndex));
          },
        });

        // Tap to skip typewriter
        this.input.once("pointerdown", () => {
          epilogueText.setText(fullText);
          this.time.removeAllEvents();
        });
      }
    }

    // Restart prompt
    const restartY = this.victory ? height * 0.75 : height * 0.55;
    const restartText = this.add
      .text(width / 2, restartY, "Tap to play again", {
        fontSize: "18px",
        color: "#aaaaaa",
        fontFamily: "monospace",
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // New game button
    const newGameText = this.add
      .text(width / 2, restartY + 50, "[ Create New Game ]", {
        fontSize: "16px",
        color: "#00d4ff",
        fontFamily: "monospace",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    newGameText.on("pointerdown", () => {
      EventBus.emit("new-game-requested");
    });

    // Restart on tap (after short delay to allow typewriter to finish)
    this.time.delayedCall(1000, () => {
      this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        // Ignore if they clicked "Create New Game"
        if (pointer.y < restartY + 30) {
          this.scene.start("GameScene", { levelIndex: 0 });
        }
      });

      this.input.keyboard?.on("keydown-SPACE", () => {
        this.scene.start("GameScene", { levelIndex: 0 });
      });
    });

    EventBus.emit("game-over", {
      victory: this.victory,
      score: this.finalScore,
    });
    EventBus.emit("current-scene-ready", this);
  }
}
