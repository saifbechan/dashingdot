import * as tf from '@tensorflow/tfjs';
import { sampleSize } from 'lodash';

import config from '../../config';
import { nodeType } from '../../contants';
import { ConnectionType, NodeType, PlayGameSceneType } from '../../types';

export default class Brain {
  private readonly scene: PlayGameSceneType;

  private fitness = 0;
  private nodeCount = 0;

  private readonly nbInputs: number;
  private readonly nbHidden: number;
  private readonly nbOutputs: number;

  private inputWeights!: tf.Tensor<tf.Rank>;
  private outputWeights!: tf.Tensor<tf.Rank>;

  private readonly nodes: NodeType[];
  private readonly connections: ConnectionType[] = [];

  constructor(
    scene: PlayGameSceneType,
    nodes?: NodeType[],
    connections?: ConnectionType[],
    nbInputs = config.layers.inputs,
    nbHidden: number = config.layers.hidden,
    nbOutputs = config.layers.outputs
  ) {
    this.scene = scene;

    this.nbInputs = nbInputs;
    this.nbHidden = nbHidden;
    this.nbOutputs = nbOutputs;

    this.setInputWeights();

    if (nodes && connections) {
      this.nodes = nodes;
      this.connections = connections;
      return;
    }

    this.nodes = [
      ...[...Array(this.nbInputs)].map(
        (): NodeType => ({
          number: ++this.nodeCount,
          type: nodeType.INPUT,
        })
      ),
      ...[...Array(this.nbOutputs)].map(
        (): NodeType => ({
          number: ++this.nodeCount,
          type: nodeType.OUTPUT,
        })
      ),
    ];
  }

  private setInputWeights(
    inputWeights?: tf.Tensor<tf.Rank>,
    outputWeights?: tf.Tensor<tf.Rank>
  ): void {
    this.inputWeights = inputWeights
      ? inputWeights
      : tf.randomNormal([this.nbInputs, this.nbHidden]);
    this.outputWeights = outputWeights
      ? outputWeights
      : tf.randomNormal([this.nbHidden, this.nbOutputs]);
  }

  getFitness = (): number => this.fitness;

  setFitness = (fitness: number): void => {
    this.fitness = fitness;
  };

  predict = (inputs: number[]): boolean =>
    tf.tidy(() => {
      const inputLayer = tf.tensor(inputs, [1, this.nbInputs]);
      const hiddenLayer = inputLayer.matMul(this.inputWeights).sigmoid();
      const outputLayer = hiddenLayer.matMul(this.outputWeights).sigmoid();
      return outputLayer.dataSync()[0] > 0.5;
    });

  crossover = (brain: Brain): Brain => {
    let n = 1;
    const childNodes: NodeType[] = [];
    const maxNode = Math.max(this.nodeCount, brain.nodeCount);
    while (n <= maxNode) {
      const nodeX = this.getNode(n);
      const nodeY = brain.getNode(n);
      this.pushNew(nodeX, nodeY, childNodes, brain);
      n++;
    }

    let c = 1;
    const childConnections: ConnectionType[] = [];
    const maxConnection = Math.max(this.getLastInnovation(), brain.getLastInnovation());
    while (c <= maxConnection) {
      const connectionX = this.getConnection(c);
      const connectionY = brain.getConnection(c);
      this.pushNew(connectionX, connectionY, childConnections, brain);
      c++;
    }
    return new Brain(this.scene, childNodes, childConnections, this.nbInputs, this.nbOutputs);
  };

  mutate = (): Brain =>
    sampleSize([this.addConnection, this.addNode, this.updateConnectionWeight], 1)[0]();

  possibleNewConnection = (): ConnectionType | null => {
    const existingConnections = this.connections
      .filter((conn) => !conn.disabled)
      .map((conn) => conn.nbInputs + '>' + conn.nbOutputs);

    const possibleConnections: NodeType[][] = [];
    this.nodes.forEach((input, index) => {
      const possibilities: NodeType[][] = [];
      this.nodes.slice(index + 1).forEach((output) => {
        possibilities.push([input, output]);
      });
      possibleConnections.concat(possibilities);
    });

    possibleConnections.filter(
      ([possibilityX, possibilityY]) =>
        !existingConnections.includes(possibilityX.number + '>' + possibilityY.number) &&
        !(possibilityX.type === nodeType.INPUT && possibilityY.type === nodeType.INPUT) &&
        !(possibilityX.type === nodeType.OUTPUT && possibilityY.type === nodeType.OUTPUT)
    );

    const randomPossibility = sampleSize(possibleConnections, 1)[0];

    if (!randomPossibility) return null;

    return {
      index: this.scene.playerManager.getInnovationNumber(),
      nbInputs: randomPossibility[0].number,
      nbOutputs: randomPossibility[1].number,
    } as ConnectionType;
  };

  addConnection = (): Brain => {
    const possibleNewConnection = this.possibleNewConnection();

    if (possibleNewConnection) this.connections.push(possibleNewConnection);

    return this;
  };

  addNode = (): Brain => this;

  updateConnectionWeight = (): Brain => this;

  getLastInnovation = (): number =>
    this.connections.length
      ? this.connections.reduce(
          (max, connection) => (connection.index > max ? connection.index : max),
          this.connections[0].index
        )
      : 0;

  getNode = (number: number): NodeType => this.nodes.filter((node) => node.number === number)[0];

  getConnection = (number: number): ConnectionType | undefined =>
    this.connections.filter((c) => c.index === number)[0];

  getConnections = (): ConnectionType[] => this.connections;

  clone = (): Brain => {
    const clone = new Brain(
      this.scene,
      undefined,
      undefined,
      this.nbInputs,
      this.nbHidden,
      this.nbOutputs
    );
    clone.dispose();
    clone.setInputWeights(tf.clone(this.inputWeights));
    clone.setInputWeights(tf.clone(this.outputWeights));
    return clone;
  };

  dispose = (): Brain => {
    this.inputWeights.dispose();
    this.outputWeights.dispose();
    return this;
  };

  private pushNew = (
    aConn: ConnectionType | NodeType | undefined,
    bConn: ConnectionType | NodeType | undefined,
    children: (ConnectionType | NodeType)[],
    brain: Brain
  ): void => {
    if (aConn && bConn) {
      children.push(Math.random() > 0.5 ? aConn : bConn);
    } else if (aConn && this.fitness > brain.fitness) {
      children.push(aConn);
    } else if (bConn && this.fitness < brain.fitness) {
      children.push(bConn);
    } else if (aConn) {
      children.push(aConn);
    } else if (bConn) {
      children.push(bConn);
    }
  };

  distance = (brain: Brain): number => {
    const weights = { excess: 1, disjoint: 1, weight: 0.4 };
    const totalGenes = Math.max(this.connections.length, brain.getConnections().length);
    const N = totalGenes > 20 ? totalGenes : 1;

    let nbExcess = 0;
    let nbDisjoint = 0;
    let nbMatching = 0;
    let weightDiff = 0;
    let c = 1;

    const maxInnovationA = this.getLastInnovation();
    const maxInnovationB = brain.getLastInnovation();
    const maxInnovation = Math.max(maxInnovationA, maxInnovationB);

    while (c <= maxInnovation) {
      const aConn = this.getConnection(c);
      const bConn = brain.getConnection(c);
      if (aConn && !bConn) {
        if (c > maxInnovationB) nbExcess++;
        else nbDisjoint++;
      } else if (!aConn && bConn) {
        if (c > maxInnovationA) nbExcess++;
        else nbDisjoint++;
      } else if (aConn && bConn) {
        nbMatching++;
        weightDiff += Math.abs(aConn.weight - bConn.weight);
      }
      c++;
    }
    const avgWeightDiff = nbMatching > 0 ? weightDiff / nbMatching : 1;
    return (
      (weights.excess * nbExcess) / N +
      (weights.disjoint * nbDisjoint) / N +
      weights.weight * avgWeightDiff
    );
  };
}
