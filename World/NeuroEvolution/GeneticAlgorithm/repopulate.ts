import * as tf from '@tensorflow/tfjs';

import create from '../NeuralNetwork/create';
import { EvolveableType } from '../types';

const repopulate = (populationSize: number, population: EvolveableType[]): tf.Sequential[] => {
  // First add the previous generation including children to the next population
  const repopulated = population.map(({ network }) => network);

  // Fill the population with new random networks
  [...Array(populationSize - repopulated.length)].map(() => create());

  return repopulated;
};

export default repopulate;
