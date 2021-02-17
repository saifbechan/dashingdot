import * as tf from '@tensorflow/tfjs';

import config from '../config';
import { PlayerDataType } from './Types';

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
      weights.map((weight) => weight.dispose());
    }
    return brain;
  }

  static mutate = (weights: tf.Tensor[]): tf.Tensor[] => {
    const mutatedWeights: tf.Tensor[] = [];
    for (let index = 0; index < weights.length; index++) {
      const tensor = weights[index];
      const shape = weights[index].shape.slice();
      const values = tensor.dataSync().slice();
      for (let j = 0; j < values.length; j++) {
        if (Math.random() < config.mutation.rate) {
          const w = values[j];
          values[j] = w + Math.random();
        }
      }
      mutatedWeights[index] = tf.tensor(values, shape);
    }
    return mutatedWeights;
  };

  static copy(brain: tf.Sequential): tf.Sequential {
    const weights = BrainHelper.mutate(brain.getWeights().slice());
    //const weights = brain.getWeights().slice();
    return BrainHelper.create(weights);
  }

  static pick(players: PlayerDataType[]): tf.Sequential {
    if (players.length === 0) {
      return BrainHelper.create();
    }
    let index = 0;
    let r = Math.random();
    while (r > 0) {
      r = r - players[index].normalized;
      index++;
    }
    index--;
    return BrainHelper.copy(players[index].brain);
  }
}
