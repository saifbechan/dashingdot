import Phaser from 'phaser';

import { PlayGameSceneType } from '../types';
import Brain from './Player/Brain';
import Player from './Player/Player';

export default class PlayerManager extends Phaser.GameObjects.Group {
  private readonly brains: Brain[] = [];

  constructor(scene: Phaser.Scene, players: number, brains: Brain[]) {
    super(scene);

    if (brains.length === 0) {
      this.populate(players);
    } else {
      this.evolve(brains);
    }
  }

  populate = (players: number): void => {
    [...Array(players)].map(() =>
      this.add(new Player(this.scene, 50, this.scene.scale.height / 2, new Brain()))
    );
  };

  evolve = (brains: Brain[]): void => {
    brains.map(() =>
      this.add(new Player(this.scene, 50, this.scene.scale.height / 2, new Brain()))
    );
  };

  private evaluate = (brains: Brain[]): Brain[] => brains;

  update = (): void => {
    this.getChildren().forEach((child: Phaser.GameObjects.GameObject, index: number) => {
      const player = child as Player;

      if (index === 0) {
        player.setTransparency(1);
        player.logStats(this.scene as PlayGameSceneType);
      } else {
        player.setTransparency(0.3);
      }

      if (player.y < this.scene.scale.height - 50) return;

      this.brains.push(player.getBrain());

      this.killAndHide(player);
      this.remove(player, true, true);
    });
  };

  getBrains = (): Brain[] => this.brains;
}
