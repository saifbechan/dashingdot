import { PlaySceneType } from '../Play';
import { Sequential } from '@tensorflow/tfjs';
import { predict } from '../NeuroEvolution/NeuralNetwork';
import config from '../../lib/config';

export enum PlayerNames {
  PUNK = 'punk',
  CHAMP = 'champ',
}

export enum AnimationsNames {
  FLY = 'fly',
  WALK = 'walk',
  JUMP = 'jump',
}

export type EvolveableType = {
  network: Sequential;
  fitness: number;
};

class Player extends Phaser.Physics.Arcade.Sprite {
  private readonly brain: Sequential;

  private timeAlive = 0;
  private totalSteps = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    brain: Sequential,
    name: PlayerNames = PlayerNames.PUNK
  ) {
    super(scene, x, y, name);

    this.setName(name);

    const {
      playerGravity,
      players: { animations, offset },
    } = config;

    this.brain = brain;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setScale(0.5);
    this.setSize(85, 85);
    this.setGravityY(playerGravity);
    this.setOffset(offset[name]);

    (Object.keys(animations) as Array<keyof typeof animations>).forEach((key) => {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(`${name}-${key}`, {
          frames: animations[key],
        }),
        frameRate: 16,
        repeat: -1,
      });
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
    const prediction = predict(this.brain, this.getInputs(<PlaySceneType>this.scene));
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

export default Player;
