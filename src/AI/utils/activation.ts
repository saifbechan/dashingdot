/**
 * Activation functions for neural network nodes
 */

export type ActivationName = 'sigmoid' | 'tanh' | 'relu' | 'linear';

export const activations: Record<ActivationName, (x: number) => number> = {
  sigmoid: (x: number) => 1 / (1 + Math.exp(-x)),
  tanh: (x: number) => Math.tanh(x),
  relu: (x: number) => Math.max(0, x),
  linear: (x: number) => x,
};

export const activationDerivatives: Record<
  ActivationName,
  (x: number) => number
> = {
  sigmoid: (x: number) => {
    const s = activations.sigmoid(x);
    return s * (1 - s);
  },
  tanh: (x: number) => 1 - Math.pow(Math.tanh(x), 2),
  relu: (x: number) => (x > 0 ? 1 : 0),
  linear: () => 1,
};
