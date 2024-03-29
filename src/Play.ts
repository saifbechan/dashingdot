import { AnimationsNames, MobNames, PlayerNames } from '../lib/constants';
import { EvolveableType } from './World/Player';
import { memory } from '@tensorflow/tfjs';
import MobManager from './World/MobManager';
import Phaser from 'phaser';
import PlatformManager from './World/PlatformManager';
import PlayerManager from './World/PlayerManager';
import config from '../lib/config';

export type PlayDataType = {
  generation: number;
  playersData: EvolveableType[];
};

export type PlaySceneType = Phaser.Scene & {
  platformManager: PlatformManager;
  getArea: () => number[];
};

class Play extends Phaser.Scene {
  private generation!: number;

  private platformManager!: PlatformManager;
  private playerManager!: PlayerManager;
  private mobManager!: MobManager;

  private playerCountText!: Phaser.GameObjects.Text;

  private area: number[] = [];

  constructor() {
    super('Play');
  }

  init = ({ generation = 1 }: PlayDataType): void => {
    this.generation = generation;

    console.table({
      generation,
      tensors: memory().numTensors,
    });
  };

  create = ({ playersData = [] }: PlayDataType) => {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width * 0.5, height * 0.4, 'back').setScrollFactor(0);
    this.add.image(width * 0.5, height * 0.5, 'front').setScrollFactor(0.25);

    this.platformManager = new PlatformManager(this);
    this.playerManager = new PlayerManager(this, playersData);

    new MobManager(this);

    this.physics.add.collider(
      this.platformManager.getGroup(),
      this.playerManager
    );

    this.scene.launch('Pause');
    this.input?.keyboard?.on('keydown-P', () => {
      this.scene.pause('Play');
      this.scene.resume('Pause');
    });

    if (config.showGuides) {
      config.guides.forEach((guide) =>
        this.add
          .rectangle(
            guide[0],
            this.scale.height * 0.8,
            guide[1],
            guide[2],
            0x6666ff
          )
          .setOrigin(0)
      );
    }

    this.playerCountText = this.add.text(
      10,
      10,
      `Active players: ${this.playerManager.getChildren().length}`
    );
  };

  update = (): void => {
    this.area = [];
    const context = this.game.canvas.getContext('2d');
    if (context !== null) {
      config.guides.forEach((guide) =>
        this.area.push(
          ...context.getImageData(
            guide[0],
            this.scale.height * 0.8,
            guide[1],
            guide[2]
          ).data
        )
      );
    }

    this.platformManager.update();
    this.playerManager.update();

    this.playerCountText.setText(
      `Active players: ${this.playerManager.getChildren().length}`
    );

    if (this.playerManager.countActive() === 0) {
      this.scene.start('Play', <PlayDataType>{
        ...this.playerManager.getPlayersData(),
        generation: this.generation + 1,
      });
    }
  };

  preload = (): void => {
    this.load.image('back', 'images/backgrounds/purple/back.png');
    this.load.image('front', 'images/backgrounds/purple/front.png');
    this.load.image('platform', 'images/platforms/tile-purple.png');

    Object.values(PlayerNames).forEach((name) => {
      Object.values(AnimationsNames).forEach((animation) => {
        this.load.spritesheet(
          `${name}-${animation}`,
          `images/players/${name}-${animation}.png`,
          {
            frameWidth: 150,
            frameHeight: 150,
          }
        );
      });
    });

    Object.values(MobNames).forEach((name) => {
      console.log(`${name}-${AnimationsNames.FLY}`);
      this.load.spritesheet(
        `${name}-${AnimationsNames.FLY}`,
        `images/mobs/${name}-${AnimationsNames.FLY}.png`,
        {
          frameWidth: 250,
          frameHeight: 141,
        }
      );
    });
  };

  public getArea = (): number[] => this.area;
}

export default Play;
