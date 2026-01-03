import config from '@/lib/config';
import {
  type Sequential,
  type Tensor,
  layers,
  sequential,
  tensor2d,
  tidy,
} from '@tensorflow/tfjs';

export const create = (): Sequential =>
  sequential({
    layers: [
      layers.dense({
        units: config.model.hidden,
        inputShape: [config.model.inputs],
        activation: 'sigmoid',
      }),
      layers.dense({
        units: config.model.outputs,
        activation: 'softmax',
      }),
    ],
  });

export const clone = (network: Sequential): Sequential => {
  const newNetwork = create();
  newNetwork.setWeights(network.getWeights());
  return newNetwork;
};

export const predict = (
  network: Sequential,
  inputs: ArrayLike<number>,
): Uint8Array | Int32Array | Float32Array =>
  tidy(() => {
    const xs = tensor2d([Array.from(inputs)]);
    const ys = network.predict(xs) as Tensor;
    return ys.dataSync();
  });
