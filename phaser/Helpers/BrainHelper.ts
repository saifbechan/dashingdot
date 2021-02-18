import * as tf from '@tensorflow/tfjs';
import { sampleSize } from 'lodash';

import config from '../config';

export default class BrainHelper {
  static create = (brains: tf.Sequential[]): tf.Sequential =>
    brains.length === 0 ? BrainHelper.createRandom() : BrainHelper.createFromParents(brains);

  static copy = (source: tf.Sequential): tf.Sequential => {
    const brain = BrainHelper.createRandom();
    brain.setWeights(source.getWeights().slice());
    return brain;
  };

  private static createRandom = (): tf.Sequential =>
    tf.sequential({
      layers: [
        tf.layers.dense({
          units: config.layers.hidden,
          inputShape: [config.layers.inputs],
          activation: 'sigmoid',
        }),
        tf.layers.dense({
          units: config.layers.outputs,
          activation: 'softmax',
        }),
      ],
    });

  private static createWithWeights = (weights: tf.Tensor[]): tf.Sequential => {
    const brain = BrainHelper.createRandom();
    brain.setWeights(weights);
    weights.map((weight) => weight.dispose());
    return brain;
  };

  private static createFromParents = (brains: tf.Sequential[]): tf.Sequential => {
    const [brainX, brainY]: tf.Sequential[] = sampleSize(brains, 2);

    const weightX = brainX.getWeights().slice();
    const weightY = brainY.getWeights().slice();

    const weightLength = weightX.length;

    const mutatedWeights: tf.Tensor[] = [];
    for (let index = 0; index < weightLength; index++) {
      const shape = weightX[index].shape.slice();

      const valuesX = weightX[index].dataSync().slice();
      const valuesY = weightY[index].dataSync().slice();

      const randomMidKey = Math.floor(Math.random() * valuesX.length);

      const values = valuesX.map((value: number, key: number) => {
        if (Math.random() < config.mutation.rate) {
          return value + BrainHelper.randomGaussian();
        }
        return key > randomMidKey ? value : valuesY[key];
      });
      mutatedWeights[index] = tf.tensor(values, shape);
    }

    return BrainHelper.createWithWeights(mutatedWeights);
  };

  private static randomGaussian = (): number =>
    Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(2.0 * Math.PI * Math.random());
}
