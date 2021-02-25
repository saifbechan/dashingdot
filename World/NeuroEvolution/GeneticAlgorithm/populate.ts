import * as tf from '@tensorflow/tfjs';

import create from '../NeuralNetwork/create';

// creating and array of populationSize and fill it with networks
const populate = (populationSize: number): tf.Sequential[] =>
  [...Array(populationSize)].map(() => create());

export default populate;
