import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import Player from './Entities/Player';
import PlatformManager from './World/PlatformManager';

export type PlayGameSceneType = Phaser.Scene & {
  platformManager: PlatformManager;
};

export default class Scene extends Phaser.Scene {
  private platformManager!: PlatformManager;

  constructor() {
    super('PlayGame');
  }

  create = (): void => {
    tf.setBackend('cpu').then(() => console.log('Running TF on the CPU'));

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width * 0.5, height * 0.5, 'back').setScrollFactor(0);
    this.add.image(width * 0.5, height * 0.5, 'front').setScrollFactor(0.25);

    this.platformManager = new PlatformManager(this);
    const player = this.physics.add.existing(new Player(this, 50, window.innerHeight / 2));
    this.physics.add.collider(player, this.platformManager.getGroup());
  };

  update = (): void => {
    this.platformManager.update();
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
