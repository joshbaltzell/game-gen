import Phaser from "phaser";

export class PatrolEnemy {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private startX: number;
  private patrolDistance: number;
  private speed: number = 80;
  private direction: number = 1;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    patrolDistance: number
  ) {
    this.startX = x;
    this.patrolDistance = patrolDistance;

    this.sprite = scene.physics.add.sprite(x, y, "enemy-a");
    this.sprite.setBounce(0);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setVelocityX(this.speed * this.direction);
    body.setCollideWorldBounds(true);

    // Patrol logic in update event
    scene.events.on("update", this.update, this);
    this.sprite.on("destroy", () => {
      scene.events.off("update", this.update, this);
    });
  }

  private update = (): void => {
    if (!this.sprite.active) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // Reverse at patrol bounds
    if (this.sprite.x > this.startX + this.patrolDistance) {
      this.direction = -1;
      this.sprite.setFlipX(true);
    } else if (this.sprite.x < this.startX - this.patrolDistance) {
      this.direction = 1;
      this.sprite.setFlipX(false);
    }

    // Reverse if hitting a wall
    if (body.blocked.left) {
      this.direction = 1;
      this.sprite.setFlipX(false);
    } else if (body.blocked.right) {
      this.direction = -1;
      this.sprite.setFlipX(true);
    }

    body.setVelocityX(this.speed * this.direction);
  };
}
