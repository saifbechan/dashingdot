import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import PlatformManager from './World/PlatformManager';
import PlayerManager from './World/PlayerManager';

export type PlayGameDataType = {
  brains: tf.Sequential[];
  highscore: number;
};

export type PlayGameSceneType = Phaser.Scene & {
  platformManager: PlatformManager;
};

export default class Scene extends Phaser.Scene {
  private brains!: tf.Sequential[];
  private playerManager!: PlayerManager;
  private platformManager!: PlatformManager;

  constructor() {
    super('PlayGame');
  }

  init = (data: PlayGameDataType): void => {
    this.brains = data.brains || [];

    console.table({
      tensors: tf.memory().numTensors,
      highscore: data.highscore || 0,
    });
  };

  create = (): void => {
    tf.setBackend('cpu').then();

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width * 0.5, height * 0.5, 'back').setScrollFactor(0);
    this.add.image(width * 0.5, height * 0.5, 'front').setScrollFactor(0.25);

    this.playerManager = new PlayerManager(this, this.brains);
    this.platformManager = new PlatformManager(this);

    this.physics.add.collider(this.playerManager, this.platformManager.getGroup());
  };

  update = (): void => {
    this.platformManager.update();
    this.playerManager.update();

    if (this.playerManager.countActive() === 0) {
      this.scene.start('PlayGame', this.playerManager.getData() as PlayGameDataType);
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
