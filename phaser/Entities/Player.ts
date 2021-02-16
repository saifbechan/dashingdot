import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import config from '../config';
import { PlayGameSceneType } from '../scene';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private brain: tf.Sequential;
  private score = 0;
  private jumps = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setSize(50, 58);
    this.setGravityY(config.playerGravity);

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

    this.brain = tf.sequential();
    this.brain.add(
      tf.layers.dense({
        units: 8,
        inputShape: [6],
        activation: 'sigmoid',
      })
    );
    this.brain.add(
      tf.layers.dense({
        units: 2,
        activation: 'softmax',
      })
    );

    return this;
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (this.shouldJump()) {
      this.jump();
    }

    if (this.body.touching.down) {
      this.anims.play('walk', true);
      this.score += 1;
    } else {
      this.anims.play('fly', true);
    }

    if (this.y > window.innerHeight) {
      console.log(this.score);
      this.scene.scene.start('PlayGame');
    }
    this.x = config.playerStartPosition;
  }

  private shouldJump = (): boolean =>
    tf.tidy(() => {
      const scene = this.scene as PlayGameSceneType;
      const xs = tf.tensor2d([
        [
          this.body.position.x / window.innerWidth,
          this.body.position.y / window.innerHeight,
          this.body.velocity.x / 10,
          this.body.velocity.y / 10,
          scene.platformManager.getGroup().getFirstAlive().getTopRight().x / window.innerWidth,
          scene.platformManager.getGroup().getFirstAlive().getTopRight().y / window.innerHeight,
        ],
      ]);
      const ys = this.brain.predict(xs) as tf.Tensor;
      const outputs = ys.dataSync();
      return outputs[0] > outputs[1];
    });

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
