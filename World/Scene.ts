import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import PlatformManager from './World/PlatformManager';
import PlayerManager from './World/PlayerManager';
import { PlayGameDataType } from './types';

export default class Scene extends Phaser.Scene {
  private generation!: number;

  private playerManager!: PlayerManager;
  private platformManager!: PlatformManager;

  constructor() {
    super('PlayGame');
  }

  init = ({ generation = 0 }: PlayGameDataType): void => {
    this.generation = generation;

    console.table({
      tensors: tf.memory().numTensors,
      generation,
    });
  };

  create = ({ playersData = [] }: PlayGameDataType): void => {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width * 0.5, height * 0.4, 'back').setScrollFactor(0);
    this.add.image(width * 0.5, height * 0.5, 'front').setScrollFactor(0.25);

    this.playerManager = new PlayerManager(this, playersData);
    this.platformManager = new PlatformManager(this);

    this.physics.add.collider(this.playerManager, this.platformManager.getGroup());
  };

  update = (): void => {
    this.platformManager.update();
    this.playerManager.update();

    if (this.playerManager.countActive() === 0) {
      this.scene.start('PlayGame', <PlayGameDataType>{
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
}
