import Phaser from "phaser";

export class PowerUp {
  public sprite: Phaser.Physics.Arcade.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.physics.add.sprite(x, y, "power-up");

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    // Floating animation
    scene.tweens.add({
      targets: this.sprite,
      y: y - 15,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Pulsing glow effect — makes it visually distinct from collectibles
    scene.tweens.add({
      targets: this.sprite,
      alpha: { from: 0.7, to: 1.0 },
      scaleX: { from: 1.0, to: 1.2 },
      scaleY: { from: 1.0, to: 1.2 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
