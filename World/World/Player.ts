import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import * as nn from '../NeuroEvolution/NeuralNetwork';
import { EvolveableType } from '../NeuroEvolution/types';
import config from '../config';
import { PlaySceneType } from '../types';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly brain: tf.Sequential;

  private timeAlive = 0;

  private totalSteps = 0;
  private subsequentSteps = 0;

  private totalJumps = 0;

  private currentJumps = 0;

  private fitness = 0;

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

    this.timeAlive += 1;
    this.x = config.playerStartPosition;

    if (this.body.touching.down) {
      this.anims.play('walk', true);

      this.currentJumps = 0;
      this.totalSteps += 1;
      this.subsequentSteps += 1;

      if (this.subsequentSteps === 10) {
        this.fitness += 1;
      }
    } else {
      this.anims.play('fly', true);

      this.subsequentSteps = 0;

      if (this.currentJumps === config.allowedJumps) {
        return;
      }
    }

    if (this.shouldJump()) {
      this.totalJumps += 1;
      this.jump();
    }
  };

  private shouldJump = (): boolean => {
    const prediction = nn.predict(this.brain, this.getInputs(<PlaySceneType>this.scene));
    return prediction[0] > prediction[1];
  };

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

  private getInputs = (scene: PlaySceneType): number[] => [
    this.body.position.x / scene.scale.width,
    this.body.position.y / this.scene.scale.height,
    this.body.velocity.y / 10,
    ...scene.platformManager.getNthPlatformBounds(0),
    ...scene.platformManager.getNthPlatformBounds(1),
  ];

  getPlayersData = (): EvolveableType =>
    <EvolveableType>{
      network: this.brain,
      fitness: this.fitness,
      timeAlive: this.timeAlive,
      totalSteps: this.totalSteps,
      totalJumps: this.totalJumps,
    };

  setTransparency = (alpha: number): void => {
    this.alpha = alpha;
  };
}
