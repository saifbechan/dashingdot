import Phaser from 'phaser';

import { PlayGameSceneType } from '../types';
import GeneticAlgorithm from './GeneticAlgorithm';
import Brain from './Player/Brain';
import Player from './Player/Player';

export default class PlayerManager extends GeneticAlgorithm {
  constructor(scene: Phaser.Scene, players: number, species: Brain[][], brains: Brain[]) {
    super(scene);

    if (brains.length === 0) {
      this.populate(players);
    } else {
      this.evolve(brains);
    }
  }

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
