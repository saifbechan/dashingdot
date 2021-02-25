import * as tf from '@tensorflow/tfjs';

import config from '../../config';

const create = (): tf.Sequential =>
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

export default create;
