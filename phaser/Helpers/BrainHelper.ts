import * as tf from '@tensorflow/tfjs';

import config from '../config';

export default class BrainHelper {
  static create(weights?: tf.Tensor[]): tf.Sequential {
    const brain = tf.sequential();
    brain.add(
      tf.layers.dense({
        units: config.layers.hidden,
        inputShape: [config.layers.inputs],
        activation: 'sigmoid',
      })
    );
    brain.add(
      tf.layers.dense({
        units: config.layers.outputs,
        activation: 'softmax',
      })
    );
    if (weights) {
      brain.setWeights(weights);
    }
    return brain;
  }

  static copy(brain: tf.Sequential): tf.Sequential {
    const weights = brain.getWeights().slice();
    return BrainHelper.create(weights);
  }

  static dispose(brain: tf.Sequential): void {
    brain.dispose();
  }
}
