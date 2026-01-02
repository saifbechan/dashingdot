import config from '@/lib/config';
import { type PlayerNames } from '@/lib/constants';
import { type Sequential } from '@tensorflow/tfjs';
import Phaser from 'phaser';
import { predict } from '../NeuroEvolution/NeuralNetwork';
import { type PlaySceneType } from '../Play';

export interface EvolveableType {
  network: Sequential;
  fitness: number;
}

class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly brain: Sequential;

  private timeAlive = 0;
  private totalSteps = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    brain: Sequential,
    name: PlayerNames,
  ) {
    super(scene, x, y, name);

    this.setName(name);

    const { gravity } = config;

    this.brain = brain;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const charConfig = config.playerConfig.find(
      (c) => c.id === (name as string),
    );
    if (!charConfig) {
      console.warn(`Player config not found for ${name}`);
      return;
    }

    this.setScale(0.5);
    const bodySize = 85;
    this.setSize(bodySize, bodySize);
    this.setGravityY(gravity);

    // Center the body horizontally and align to bottom vertically with a slight adjustment
    const offsetX = (charConfig.frameWidth - bodySize) / 2;

    // Use configurable offset from player config
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    const correction = (charConfig as any).offsetYCorrection ?? 20;

    const offsetY = charConfig.frameHeight - bodySize - correction;
    this.setOffset(offsetX, offsetY);

    const { walk, fly } = charConfig.animations;
    const cols = charConfig.cols;

    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers(name, {
        start: walk.row * cols,
        end: walk.row * cols + walk.frames - 1,
      }),
      frameRate: 16,
      repeat: -1,
    });

    this.anims.create({
      key: 'fly',
      frames: this.anims.generateFrameNumbers(name, {
        start: fly.row * cols,
        end: fly.row * cols + fly.frames - 1,
      }),
      frameRate: 16,
      repeat: -1,
    });
  }

  preUpdate = (time: number, delta: number): void => {
    super.preUpdate(time, delta);

    if (!this.body) {
      throw new Error('Empty body');
    }

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
    if ((this.scene as PlaySceneType).getArea().length === 0) return false;
    const prediction = predict(
      this.brain,
      this.getInputs(this.scene as PlaySceneType),
    );
    return prediction[0] > prediction[1];
  };

  private getInputs = (scene: PlaySceneType): number[] => {
    if (!this.body?.position.x || !this.body.position.y) {
      throw new Error('Empty body');
    }
    return [
      this.body.position.x / scene.scale.width,
      this.body.position.y / this.scene.scale.height,
      this.body.velocity.y / 10,
      ...scene.getArea(),
    ];
  };

  getPlayersData = (): EvolveableType =>
    ({
      network: this.brain,
      fitness: this.timeAlive + this.totalSteps,
      timeAlive: this.timeAlive,
      totalSteps: this.totalSteps,
    }) as EvolveableType;

  setTransparency = (alpha: number): void => {
    this.alpha = alpha;
  };
}

export default Player;
