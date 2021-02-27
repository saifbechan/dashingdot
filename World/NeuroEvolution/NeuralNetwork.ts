import * as tf from '@tensorflow/tfjs';

import config from '../config';

export const create = (): tf.Sequential =>
  tf.sequential({
    layers: [
      tf.layers.dense({
        units: config.model.hidden,
        inputShape: [config.model.inputs],
        activation: 'sigmoid',
      }),
      tf.layers.dense({
        units: config.model.outputs,
        activation: 'softmax',
      }),
    ],
  });

export const predict = (
  network: tf.Sequential,
  inputs: number[]
): Uint8Array | Int32Array | Float32Array =>
  tf.tidy(() => {
    const xs = tf.tensor2d([inputs]);
    const ys = <tf.Tensor>network.predict(xs);
    return ys.dataSync();
  });
