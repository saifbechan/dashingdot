import config from '../../config';

export enum NodeType {
  INPUT = 'input',
  HIDDEN = 'hidden',
  OUTPUT = 'output',
}

export default class Brain {
  private fitness = 0;

  private inputs: number;
  private outputs: number;

  private readonly nodes: NodeType[];
  private readonly connections: [] = [];

  constructor(inputs = config.layers.inputs, outputs = config.layers.outputs) {
    this.inputs = inputs;
    this.outputs = outputs;

    this.nodes = [
      ...[...Array(this.inputs)].map(() => NodeType.INPUT),
      ...[...Array(this.outputs)].map(() => NodeType.OUTPUT),
    ];
  }

  setFitness = (fitness: number): void => {
    this.fitness = fitness;
  };

  shouldJump = (getInputs: number[]): boolean => !!getInputs;
}
