import * as tf from '@tensorflow/tfjs';

import config from '../config';
import * as nn from './NeuralNetwork';
import { EvolveableType } from './types';
import utils from './utils';

// creating and array of populationSize and fill it with networks
export const populate = (populationSize: number): tf.Sequential[] =>
  [...Array(populationSize)].map(() => nn.create());

// Currently evaluation is just sorting the population from highest to lowest fitness
export const evaluate = (population: EvolveableType[]): EvolveableType[] =>
  population.sort(
    (networkX: EvolveableType, networkY: EvolveableType) => networkX.fitness - networkY.fitness
  );

export const speciate = (population: EvolveableType[]): EvolveableType[] => population;

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
  const selection: EvolveableType[] = [];
  population.forEach(({ network }: EvolveableType, index: number) => {
    if (index < config.evolution.crossoverRate * config.playerCount) {
      selection.push(<EvolveableType>{ network: nn.clone(network) });
    }
  });
  return selection;
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
