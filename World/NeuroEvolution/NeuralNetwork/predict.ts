import * as tf from '@tensorflow/tfjs';

const predict = (
  network: tf.Sequential,
  inputs: number[]
): Uint8Array | Int32Array | Float32Array =>
  tf.tidy(() => {
    const xs = tf.tensor2d([inputs]);

    const ys = <tf.Tensor>network.predict(xs);

    return ys.dataSync();
  });

export default predict;
