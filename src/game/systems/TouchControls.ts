import Phaser from "phaser";

export class TouchControls {
  private scene: Phaser.Scene;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;
  private isMobile: boolean;

  // Virtual joystick state
  private joystickBase: Phaser.GameObjects.Image | null = null;
  private joystickThumb: Phaser.GameObjects.Image | null = null;
  private joystickPointer: Phaser.Input.Pointer | null = null;
  private joystickOrigin: { x: number; y: number } = { x: 0, y: 0 };
  private joystickRadius: number = 50;
  private joystickVector: { x: number; y: number } = { x: 0, y: 0 };

  // Jump button state
  private jumpButton: Phaser.GameObjects.Image | null = null;
  private _jumpPressed: boolean = false;
  private _jumpJustPressedFrame: boolean = false;
  private _prevJumpPressed: boolean = false;

  // Fire button state
  private fireButton: Phaser.GameObjects.Image | null = null;
  private fireKey: Phaser.Input.Keyboard.Key | null = null;
  private _firePressed: boolean = false;
  private _fireJustPressedFrame: boolean = false;
  private _prevFirePressed: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.isMobile = !scene.sys.game.device.os.desktop;

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.spaceKey = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );
      this.fireKey = scene.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.X
      );
    }

    if (this.isMobile) {
      this.createVirtualControls();
    }
  }

  private createVirtualControls(): void {
    const { height } = this.scene.scale;

    // Virtual joystick (left side)
    const joyX = 100;
    const joyY = height - 120;

    this.joystickBase = this.scene.add
      .image(joyX, joyY, "dpad-base")
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.6);

    this.joystickThumb = this.scene.add
      .image(joyX, joyY, "dpad-thumb")
      .setScrollFactor(0)
      .setDepth(101)
      .setAlpha(0.8);

    this.joystickOrigin = { x: joyX, y: joyY };

    // Jump button (right side)
    const { width } = this.scene.scale;
    this.jumpButton = this.scene.add
      .image(width - 80, height - 100, "jump-button")
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive()
      .setAlpha(0.7);

    this.jumpButton.on("pointerdown", () => {
      this._jumpPressed = true;
    });
    this.jumpButton.on("pointerup", () => {
      this._jumpPressed = false;
    });
    this.jumpButton.on("pointerout", () => {
      this._jumpPressed = false;
    });

    // Fire button (right side, above jump)
    this.fireButton = this.scene.add
      .image(width - 80, height - 200, "fire-button")
      .setScrollFactor(0)
      .setDepth(100)
      .setInteractive()
      .setAlpha(0.7);

    this.fireButton.on("pointerdown", () => {
      this._firePressed = true;
    });
    this.fireButton.on("pointerup", () => {
      this._firePressed = false;
    });
    this.fireButton.on("pointerout", () => {
      this._firePressed = false;
    });

    // Handle joystick touch
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Left half of screen = joystick
      if (pointer.x < this.scene.scale.width / 2) {
        this.joystickPointer = pointer;
      }
    });

    this.scene.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (pointer === this.joystickPointer) {
        this.updateJoystick(pointer);
      }
    });

    this.scene.input.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (pointer === this.joystickPointer) {
        this.joystickPointer = null;
        this.joystickVector = { x: 0, y: 0 };
        if (this.joystickThumb) {
          this.joystickThumb.setPosition(
            this.joystickOrigin.x,
            this.joystickOrigin.y
          );
        }
      }
    });

    // Update just-pressed tracking for jump and fire
    this.scene.events.on("update", () => {
      this._jumpJustPressedFrame =
        this._jumpPressed && !this._prevJumpPressed;
      this._prevJumpPressed = this._jumpPressed;

      this._fireJustPressedFrame =
        this._firePressed && !this._prevFirePressed;
      this._prevFirePressed = this._firePressed;
    });
  }

  private updateJoystick(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.joystickOrigin.x;
    const dy = pointer.y - this.joystickOrigin.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > this.joystickRadius) {
      this.joystickVector = {
        x: (dx / dist) * this.joystickRadius,
        y: (dy / dist) * this.joystickRadius,
      };
    } else {
      this.joystickVector = { x: dx, y: dy };
    }

    if (this.joystickThumb) {
      this.joystickThumb.setPosition(
        this.joystickOrigin.x + this.joystickVector.x,
        this.joystickOrigin.y + this.joystickVector.y
      );
    }
  }

  get left(): boolean {
    return (
      (this.cursors?.left.isDown ?? false) ||
      this.joystickVector.x < -15
    );
  }

  get right(): boolean {
    return (
      (this.cursors?.right.isDown ?? false) ||
      this.joystickVector.x > 15
    );
  }

  get jump(): boolean {
    return (
      (this.cursors?.up.isDown ?? false) ||
      (this.spaceKey?.isDown ?? false) ||
      this._jumpPressed
    );
  }

  get jumpJustPressed(): boolean {
    const keyboardJump =
      (this.spaceKey
        ? Phaser.Input.Keyboard.JustDown(this.spaceKey)
        : false) ||
      (this.cursors?.up
        ? Phaser.Input.Keyboard.JustDown(this.cursors.up)
        : false);
    return keyboardJump || this._jumpJustPressedFrame;
  }

  get fireJustPressed(): boolean {
    const keyboardFire = this.fireKey
      ? Phaser.Input.Keyboard.JustDown(this.fireKey)
      : false;
    return keyboardFire || this._fireJustPressedFrame;
  }
}
