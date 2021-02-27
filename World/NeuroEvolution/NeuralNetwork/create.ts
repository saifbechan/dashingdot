import * as tf from '@tensorflow/tfjs';

import config from '../../config';

const create = (): tf.Sequential =>
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

export default create;
