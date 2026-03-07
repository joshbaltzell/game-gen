import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { GameScene } from "./scenes/GameScene";
import { LevelTransitionScene } from "./scenes/LevelTransitionScene";
import { GameOverScene } from "./scenes/GameOverScene";

export function StartGame(containerId: string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent: containerId,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 800,
      height: 600,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 1400 },
        debug: false,
      },
    },
    scene: [
      BootScene,
      PreloadScene,
      GameScene,
      LevelTransitionScene,
      GameOverScene,
    ],
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    backgroundColor: "#0b132b",
    input: {
      activePointers: 3,
    },
  });
}
