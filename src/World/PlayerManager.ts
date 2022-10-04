import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import * as ga from '../NeuroEvolution/GeneticAlgorithm';
import { EvolveableType } from '../NeuroEvolution/types';
import { PlayDataType } from '../types';
import Player from './Player';
import config from '../config';

export default class PlayerManager extends Phaser.GameObjects.Group {
  private readonly playersData: EvolveableType[] = [];

  constructor(scene: Phaser.Scene, playersData: EvolveableType[]) {
    super(scene);

    if (playersData.length === 0) {
      // Create a completely new generation (only on the first run)
      ga.populate(config.playerCount).forEach((brain: tf.Sequential) => {
        this.add(new Player(scene, 50, scene.scale.height / 2, brain));
      });
    } else {
      // evolve the previous population (all other runs)
      const evaluated = ga.evaluate(playersData);
      const speciated = ga.speciate(evaluated);

      // get our special selection
      const selected = ga.select(speciated);

      // get our children
      const crossed = ga.crossover(speciated);
      const mutated = ga.mutate(crossed);

      ga.repopulate(config.playerCount, [...selected, ...mutated]).forEach(
        (brain: tf.Sequential) => {
          this.add(new Player(scene, 50, scene.scale.height / 2, brain));
        }
      );

      playersData.forEach(({ network }) => network.dispose());
    }
  }

  update = (): void => {
    this.getChildren().forEach((child: Phaser.GameObjects.GameObject, index: number) => {
      const player = child as Player;

      player.setTransparency(index > 0 ? 0.3 : 1);

      if (player.y < this.scene.scale.height - 50) return;

      this.playersData.push(player.getPlayersData());

      this.killAndHide(player);
      this.remove(player, true, true);
    });
  };

  getPlayersData = (): PlayDataType =>
    <PlayDataType>{
      playersData: this.playersData,
    };
}
