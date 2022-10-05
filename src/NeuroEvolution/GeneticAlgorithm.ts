import * as tf from '@tensorflow/tfjs';

import * as nn from './NeuralNetwork';
import { EvolveableType } from './types';
import config from '../config';
import utils from './utils';

export const populate = (populationSize: number): tf.Sequential[] =>
  [...Array(populationSize)].map(() => nn.create());

export const evaluate = (population: EvolveableType[]): EvolveableType[] =>
  population.sort(
    (networkX: EvolveableType, networkY: EvolveableType) => networkX.fitness - networkY.fitness
  );

export const speciate = (population: EvolveableType[]): EvolveableType[] => {
  const speciated: EvolveableType[] = [];
  const fitnessScores: number[] = [];

  const reachedTargetCount = 0;

  population.forEach((player: EvolveableType, index: number) => {
    fitnessScores[index] = player.fitness;
  });

  const maxFitness: number = Math.max(...fitnessScores);

  const totalFitness: number = fitnessScores.reduce(
    (total: number, score: number) => (total += score)
  );

  const normalizedFitnessScores: number[] = fitnessScores.map((score: number) =>
    Math.floor((score / maxFitness) * 100)
  );

  population.forEach((player: EvolveableType, index: number) => {
    for (let i = 0; i < normalizedFitnessScores[index]; i += 1) {
      speciated.push(player);
    }
  });

  console.table({
    'max-fitness': Math.floor(maxFitness),
    'total-fitness': Math.floor(totalFitness),
    'pool-size': speciated.length,
    'reached-target': reachedTargetCount,
  });

  return speciated;
};

export const select = (population: EvolveableType[]): EvolveableType[] => {
  const selection: EvolveableType[] = [];
  population.forEach(({ network }: EvolveableType, index: number) => {
    if (index < config.evolution.survivalRate * config.playerCount) {
      selection.push(<EvolveableType>{ network: nn.clone(network) });
    }
  });
  return selection;
};

export const crossover = (population: EvolveableType[]): EvolveableType[] => {
  const crossed: EvolveableType[] = [];
  const playersToCreate = (1 - config.evolution.crossoverRate) * config.playerCount;

  for (let i = 0; i < playersToCreate; i++) {
    const weights: tf.Tensor[] = [];

    const weightsX = Phaser.Math.RND.pick(population).network.getWeights();
    const weightsY = Phaser.Math.RND.pick(population).network.getWeights();

    for (let j = 0; j < weightsX.length; j++) {
      const values = [];
      const shape = weightsX[j].shape.slice();

      const valuesX = weightsX[j].dataSync().slice();
      const valuesY = weightsY[j].dataSync().slice();

      for (let k = 0; k < valuesX.length; k++) {
        if (Math.random() < 0.5) {
          values[k] = valuesX[k];
        } else {
          values[k] = valuesY[k];
        }
      }

      weights[j] = tf.tensor(values, shape);
    }

    const brain = nn.create();
    brain.setWeights(weights);
    weights.map((weight) => weight.dispose());

    crossed.push(<EvolveableType>{ network: brain });
  }

  return crossed;
};

export const mutate = (population: EvolveableType[]): EvolveableType[] =>
  population.map(({ network }) => {
    const weights = network.getWeights();
    const mutatedWeights: tf.Tensor[] = [];

    weights.forEach((weight) => {
      const shape = weight.shape.slice();
      const previousValues = weight.dataSync().slice();
      const newValues = previousValues.map((value: number) => {
        if (Math.random() < config.evolution.mutationRate) {
          return value + utils.randomGaussian();
        }
        return value;
      });

      mutatedWeights.push(tf.tensor(newValues, shape));
      weight.dispose();
    });

    const newNetwork = nn.create();
    newNetwork.setWeights(mutatedWeights);
    mutatedWeights.map((weight) => weight.dispose());

    return <EvolveableType>{ network: newNetwork };
  });

export const repopulate = (populationSize: number, population: EvolveableType[]): tf.Sequential[] =>
  [...Array(populationSize)].map((_, index) => population[index]?.network || nn.create());
