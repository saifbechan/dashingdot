import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';
import config from './config';

import { PlayDataType } from './types';
import PlatformManager from './World/PlatformManager';
import PlayerManager from './World/PlayerManager';

export default class Play extends Phaser.Scene {
  private generation!: number;

  private playerManager!: PlayerManager;
  private platformManager!: PlatformManager;

  private playerCountText!: Phaser.GameObjects.Text;

  private area: number[] = [];

  constructor() {
    super('Play');
  }

  init = ({ generation = 1 }: PlayDataType): void => {
    this.generation = generation;

    console.table({
      generation,
      tensors: tf.memory().numTensors,
    });
  };

  create = ({ playersData = [] }: PlayDataType) => {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width * 0.5, height * 0.4, 'back').setScrollFactor(0);
    this.add.image(width * 0.5, height * 0.5, 'front').setScrollFactor(0.25);

    this.playerManager = new PlayerManager(this, playersData);
    this.platformManager = new PlatformManager(this);

    this.physics.add.collider(this.playerManager, this.platformManager.getGroup());

    this.scene.launch('Pause');
    this.input.keyboard.on('keydown-P', () => {
      this.scene.pause('Play');
      this.scene.resume('Pause');
    });

    if (config.showGuides) {
      this.add.rectangle(210, this.scale.height * 0.8, 250, 20, 0x6666ff).setOrigin(0);
    }

    this.playerCountText = this.add.text(
      10,
      10,
      `Active players: ${this.playerManager.getChildren().length}`
    );
  };

  update = (): void => {
    const context = this.game.canvas.getContext('2d');

    if (context === null) {
      this.area = [];
    } else {
      this.area = [...context.getImageData(210, this.scale.height * 0.8, 250, 20).data];
    }

    this.platformManager.update();
    this.playerManager.update();

    this.playerCountText.setText(`Active players: ${this.playerManager.getChildren().length}`);

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
    this.load.spritesheet('player', 'images/players/punk.png', {
      frameWidth: 75,
      frameHeight: 75,
    });
  };

  public getArea = (): number[] => this.area;
}
