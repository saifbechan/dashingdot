import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import { PlayGameSceneType } from '../Helpers/Types';
import config from '../config';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly brain: tf.Sequential;

  private alive = 0;
  private steps = 0;
  private currentJumps = 0;
  private totalJumps = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, brain: tf.Sequential) {
    super(scene, x, y, 'player');

    this.brain = brain;

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
  }

  preUpdate = (time: number, delta: number): void => {
    super.preUpdate(time, delta);

    this.alive += 1;
    this.x = config.playerStartPosition;

    if (this.body.touching.down) {
      this.currentJumps = 0;
      this.anims.play('walk', true);
      this.steps += 1;
    } else {
      this.anims.play('fly', true);

      if (this.currentJumps === config.allowedJumps) {
        return;
      }
    }

    if (this.shouldJump()) {
      this.totalJumps += 1;
      this.jump();
    }
  };

  getBrain = (): tf.Sequential => this.brain;

  getFitness = (): number =>
    this.totalJumps > 0 ? (this.steps + this.alive) / this.totalJumps : 0;

  logStats = (scene: PlayGameSceneType): void => {
    if (Math.floor(scene.time.now) % 10 >= 0) return;

    console.log([
      ...scene.platformManager.getNthPlatformBounds(0),
      ...scene.platformManager.getNthPlatformBounds(1),
    ]);
  };

  private shouldJump = (): boolean =>
    tf.tidy(() => {
      const inputs = this.getInputs(this.scene as PlayGameSceneType);
      const xs = tf.tensor2d([inputs]);
      const ys = this.brain.predict(xs) as tf.Tensor;
      const outputs = ys.dataSync();
      return outputs[0] > outputs[1];
    });

  private jump = (): void => {
    if (
      this.body.touching.down ||
      (this.currentJumps > 0 && this.currentJumps < config.allowedJumps)
    ) {
      if (this.body.touching.down) {
        this.currentJumps = 0;
      }
      this.setVelocityY(config.jumpForce * -1);
      this.currentJumps++;
    }
  };

  private getInputs = (scene: PlayGameSceneType): number[] => [
    this.body.position.x / window.innerWidth,
    this.body.position.y / window.innerHeight,
    this.body.velocity.y / 10,
    ...scene.platformManager.getNthPlatformBounds(0),
    ...scene.platformManager.getNthPlatformBounds(1),
  ];
}
