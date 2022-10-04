import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import * as nn from '../NeuroEvolution/NeuralNetwork';
import { EvolveableType } from '../NeuroEvolution/types';
import { PlaySceneType } from '../types';
import config from '../config';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly brain: tf.Sequential;

  private timeAlive = 0;
  private totalSteps = 0;

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

      this.totalSteps += 1;

      if (this.shouldJump()) {
        this.setVelocityY(config.jumpForce * -1);
      }
    } else {
      this.anims.play('fly', true);
    }
  };

  private shouldJump = (): boolean => {
    if ((<PlaySceneType>this.scene).getArea().length === 0) return false;

    const prediction = nn.predict(this.brain, this.getInputs(<PlaySceneType>this.scene));

    return prediction[0] > prediction[1];
  };

  private getInputs = (scene: PlaySceneType): number[] => [
    this.body.position.x / scene.scale.width,
    this.body.position.y / this.scene.scale.height,
    this.body.velocity.y / 10,
    ...scene.getArea(),
  ];

  getPlayersData = (): EvolveableType =>
    <EvolveableType>{
      network: this.brain,
      fitness: this.timeAlive + this.totalSteps,
      timeAlive: this.timeAlive,
      totalSteps: this.totalSteps,
    };

  setTransparency = (alpha: number): void => {
    this.alpha = alpha;
  };
}
