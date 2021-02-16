import Phaser from 'phaser';

import config from '../config';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private jumps = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setSize(50, 58);
    this.setGravityY(config.playerGravity);

    scene.input.keyboard.on('keydown-SPACE', this.jump, this);

    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('player', { frames: [0, 1, 2, 1, 3, 4, 5, 4] }),
      frameRate: 16,
      repeat: -1,
    });

    this.anims.create({
      key: 'fly',
      frames: this.anims.generateFrameNumbers('player', { frames: [0, 6, 0, 7] }),
      frameRate: 16,
      repeat: -1,
    });

    return this;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.body.touching.down) {
      this.anims.play('walk', true);
    } else {
      this.anims.play('fly', true);
    }

    if (this.y > window.innerHeight) {
      this.scene.scene.start('PlayGame');
    }
    this.x = config.playerStartPosition;
  }

  private jump(): void {
    if (this.body.touching.down || (this.jumps > 0 && this.jumps < config.jumps)) {
      if (this.body.touching.down) {
        this.jumps = 0;
      }
      this.setVelocityY(config.jumpForce * -1);
      this.jumps++;
    }
  }
}
