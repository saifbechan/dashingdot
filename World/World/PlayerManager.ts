import * as tf from '@tensorflow/tfjs';
import Phaser from 'phaser';

import crossover from '../NeuroEvolution/GeneticAlgorithm/crossover';
import evaluate from '../NeuroEvolution/GeneticAlgorithm/evaluate';
import mutate from '../NeuroEvolution/GeneticAlgorithm/mutate';
import populate from '../NeuroEvolution/GeneticAlgorithm/populate';
import repopulate from '../NeuroEvolution/GeneticAlgorithm/repopulate';
import select from '../NeuroEvolution/GeneticAlgorithm/select';
import speciate from '../NeuroEvolution/GeneticAlgorithm/speciate';
import { EvolveableType } from '../NeuroEvolution/types';
import config from '../config';
import { PlayGameDataType } from '../types';
import Player from './Player';

export default class PlayerManager extends Phaser.GameObjects.Group {
  private readonly playersData: EvolveableType[] = [];

  constructor(scene: Phaser.Scene, playersData: EvolveableType[]) {
    super(scene);

    if (playersData.length === 0) {
      // Create a completely new generation (only on the first run)
      populate(config.playerCount).forEach((brain: tf.Sequential) => {
        this.add(new Player(scene, 50, scene.scale.height / 2, brain));
      });
    } else {
      // Evolve the previous population (all other runs)
      const evaluated = evaluate(playersData);
      const speciated = speciate(evaluated);
      const selected = select(speciated);
      const crossed = crossover(selected);
      const mutated = mutate(crossed);

      repopulate(config.playerCount, mutated).forEach((brain: tf.Sequential) => {
        this.add(new Player(scene, 50, scene.scale.height / 2, brain));
      });
    }
  }

  update = (): void => {
    this.getChildren().forEach((child: Phaser.GameObjects.GameObject, index: number) => {
      const player = child as Player;

      player.setTransparency(index > 0 ? 0.3 : 1);

      if (player.y < this.scene.scale.height - 50) return;

      this.playersData.push(<EvolveableType>{
        network: player.getBrain(),
        fitness: player.getFitness(),
      });

      this.killAndHide(player);
      this.remove(player, true, true);
    });
  };

  getPlayersData = (): PlayGameDataType =>
    <PlayGameDataType>{
      playersData: this.playersData,
    };
}
