import { Sequential } from '@tensorflow/tfjs';

export type EvolveableType = {
  network: Sequential;
  fitness: number;
};
