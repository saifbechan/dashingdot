import * as tf from '@tensorflow/tfjs';

import create from '../NeuralNetwork/create';
import { EvolveableType } from '../types';

const repopulate = (populationSize: number, population: EvolveableType[]): tf.Sequential[] =>
  [...Array(populationSize)].map((_, index) => population[index]?.network || create());

export default repopulate;
