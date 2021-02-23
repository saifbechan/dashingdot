import Phaser from 'phaser';

import config from '../../config';
import { PlayerDataType, PlayGameSceneType } from '../../types';
import Brain from './Brain/Brain';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly brain: Brain;

  private alive = 0;
  private steps = 0;
  private currentJumps = 0;
  private totalJumps = 0;
  private touching = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, brain: Brain) {
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
      this.touching += 1;
    } else {
      this.anims.play('fly', true);
    }

    if (
      this.currentJumps !== config.allowedJumps &&
      this.brain.predict(this.getInputs(this.scene as PlayGameSceneType))
    ) {
      this.touching = 0;
      this.totalJumps += 1;
      this.jump();
    }

    this.brain.setFitness(this.getFitness());
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

  private getInputs = (scene: PlayGameSceneType): number[] => [
    this.body.position.x / scene.scale.width,
    this.body.position.y / this.scene.scale.height,
    this.body.velocity.y / 10,
    ...scene.platformManager.getNthPlatformBounds(0),
    ...scene.platformManager.getNthPlatformBounds(1),
  ];

  private getFitness = (): number => this.steps;

  getPlayerData = (): PlayerDataType => ({
    brain: this.brain,
    fitness: this.getFitness(),
    alive: this.alive,
    steps: this.steps,
    totalJumps: this.totalJumps,
    nodes: this.brain.getNodes().length,
    connections: this.brain.getConnections().length,
  });

  setTransparency = (alpha: number): void => {
    this.alpha = alpha;
  };
}
