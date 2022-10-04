import * as tf from '@tensorflow/tfjs';

export type EvolveableType = {
  network: tf.Sequential;
  fitness: number;
};
