import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import BrainHelper from '../Helpers/BrainHelper';
import config from '../config';
import { PlayGameSceneType } from '../scene';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly brain: tf.Sequential;
  private alive = true;

  private score = 0;
  private jumps = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, brain?: tf.Sequential) {
    super(scene, x, y, 'player');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setSize(50, 58);
    this.setGravityY(config.playerGravity);

    this.brain = brain || BrainHelper.create();

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

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (!this.alive) return;

    if (this.shouldJump()) {
      this.jump();
    }

    if (this.body.touching.down) {
      this.anims.play('walk', true);
      this.score += 1;
    } else {
      this.anims.play('fly', true);
    }

    if (this.y > window.innerHeight - 50) {
      this.alive = false;
    }
    this.x = config.playerStartPosition;
  }

  private shouldJump = (): boolean =>
    tf.tidy(() => {
      const inputs = this.getInputs(this.scene as PlayGameSceneType);
      const xs = tf.tensor2d([inputs]);
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

  isAlive = (): boolean => this.alive;

  setTransparency(numberOfPlayers: number): void {
    this.alpha = 1 / numberOfPlayers;
  }

  getBrain(): tf.Sequential {
    return this.brain;
  }

  getScore(): number {
    return this.score;
  }

  private getInputs = (scene: PlayGameSceneType): number[] => [
    this.body.position.x / window.innerWidth,
    this.body.position.y / window.innerHeight,
    this.body.velocity.y / 10,
    scene.platformManager.getGroup().getFirstAlive().getTopRight().x / window.innerWidth,
    scene.platformManager.getGroup().getFirstAlive().getTopRight().y / window.innerHeight,
    scene.platformManager.getGroup().getFirstNth(2, true).getTopLeft().x / window.innerWidth,
    scene.platformManager.getGroup().getFirstNth(2, true).getTopLeft().y / window.innerHeight,
    scene.platformManager.getGroup().getFirstNth(2, true).getTopRight().x / window.innerWidth,
    scene.platformManager.getGroup().getFirstNth(2, true).getTopRight().y / window.innerHeight,
    scene.platformManager.getGroup().getFirstNth(3, true).getTopLeft().x / window.innerWidth,
    scene.platformManager.getGroup().getFirstNth(3, true).getTopLeft().y / window.innerHeight,
    scene.platformManager.getGroup().getFirstNth(3, true).getTopRight().x / window.innerWidth,
    scene.platformManager.getGroup().getFirstNth(3, true).getTopRight().y / window.innerHeight,
  ];
}
