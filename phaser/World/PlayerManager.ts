import { Sequential } from '@tensorflow/tfjs';
import Phaser from 'phaser';

import Player from '../Entities/Player';
import BrainHelper from '../Helpers/BrainHelper';
import config from '../config';
import { PlayGameDataType } from '../scene';

export default class PlayerManager extends Phaser.GameObjects.Group {
  private readonly brains: Sequential[] = [];

  private highscore = 0;

  constructor(scene: Phaser.Scene, brains: Sequential[]) {
    super(scene);

    for (let index = 0; index < config.players; index++) {
      const brain =
        brains.length > 0
          ? BrainHelper.copy(brains[Math.floor(Math.random() * brains.length)])
          : undefined;
      this.add(new Player(scene, 50, window.innerHeight / 2, brain));
    }

    brains.forEach((brain) => brain.dispose());

    this.removeCallback = (child): void => {
      const player = child as Player;
      BrainHelper.dispose(player.getBrain());
    };
  }

  update(): void {
    this.getChildren().forEach((child) => {
      const player = child as Player;
      if (player.isAlive()) {
        player.setTransparency(this.countActive());
        this.highscore = Math.max(this.highscore, player.getScore());
      } else {
        this.brains.push(BrainHelper.copy(player.getBrain()));
        this.killAndHide(player);
        this.remove(player);
      }
    });
  }

  getData(): PlayGameDataType {
    return {
      brains: this.brains,
      highscore: this.highscore,
    };
  }
}
