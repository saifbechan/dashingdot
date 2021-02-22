import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import config from '../config';
import { PlayGameDataType } from '../types';
import GeneticAlgorithm from './GeneticAlgorithm';
import PlatformManager from './PlatformManager';
import PlayerManager from './PlayerManager';

export default class Scene extends Phaser.Scene {
  private generation!: number;
  private geneticAlgorithm!: GeneticAlgorithm;
  private playerManager!: PlayerManager;
  private platformManager!: PlatformManager;

  constructor() {
    super('PlayGame');
  }

  init = ({ generation = 1, innovations = {} }: PlayGameDataType): void => {
    this.generation = generation;

    console.table({
      generation,
      tensors: tf.memory().numTensors,
      innovations: Object.keys(innovations).length,
    });
  };

  create = ({ brains = [], innovations = {} }: PlayGameDataType): void => {
    tf.setBackend('cpu').then();

    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width * 0.5, height * 0.4, 'back').setScrollFactor(0);
    this.add.image(width * 0.5, height * 0.5, 'front').setScrollFactor(0.25);

    this.geneticAlgorithm = new GeneticAlgorithm(config.players, brains, innovations);
    this.playerManager = new PlayerManager(this);
    this.platformManager = new PlatformManager(this);

    this.physics.add.collider(this.playerManager, this.platformManager.getGroup());
  };

  update = (): void => {
    this.platformManager.update();
    this.playerManager.update();

    if (this.playerManager.countActive() !== 0) return;

    this.scene.start('PlayGame', {
      generation: ++this.generation,
      brains: this.playerManager.getBrains(),
      innovations: this.geneticAlgorithm.getInnovations(),
    } as PlayGameDataType);
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
