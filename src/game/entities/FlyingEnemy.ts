import Phaser from "phaser";

export class FlyingEnemy {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private startY: number;
  private amplitude: number = 65;
  private frequency: number = 0.003;
  private time: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.startY = y;

    this.sprite = scene.physics.add.sprite(x, y, "enemy-b");

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    // Bobbing animation
    scene.events.on("update", this.update, this);
    this.sprite.on("destroy", () => {
      scene.events.off("update", this.update, this);
    });
  }

  private update = (_time: number, delta: number): void => {
    if (!this.sprite.active) return;

    this.time += delta;
    this.sprite.y = this.startY + Math.sin(this.time * this.frequency) * this.amplitude;
  };
}
