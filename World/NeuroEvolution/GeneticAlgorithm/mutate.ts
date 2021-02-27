import * as tf from '@tensorflow/tfjs';

import config from '../../config';
import create from '../NeuralNetwork/create';
import { EvolveableType } from '../types';

const mutate = (population: EvolveableType[]): EvolveableType[] =>
  population.map(({ network }) => {
    const weights = network.getWeights();
    const mutatedWeights: tf.Tensor[] = [];

    weights.forEach((weight) => {
      const shape = weight.shape.slice();
      const previousValues = weight.dataSync().slice();
      const newValues = previousValues.map((value: number) => {
        if (Math.random() < config.evolution.mutationRate) {
          return value + randomGaussian();
        }
        return value;
      });

      mutatedWeights.push(tf.tensor(newValues, shape));
    });

    const newNetwork = create();
    newNetwork.setWeights(mutatedWeights);

    mutatedWeights.map((weight) => weight.dispose());

    return <EvolveableType>{ network: newNetwork };
  });

const randomGaussian = (): number =>
  Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(2.0 * Math.PI * Math.random());

export default mutate;
