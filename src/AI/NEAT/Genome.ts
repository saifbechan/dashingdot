/**
 * NEAT Genome - Core genome representation for NeuroEvolution of Augmenting Topologies
 *
 * A genome consists of:
 * - Node genes: Input, hidden, and output neurons
 * - Connection genes: Weighted connections between nodes with innovation numbers
 *
 * This replaces TensorFlow.js Sequential models with a pure JS implementation
 * optimized for small evolving networks.
 */

// Node types in the network
export enum NodeType {
  INPUT = 'input',
  HIDDEN = 'hidden',
  OUTPUT = 'output',
}

// Activation functions
export type ActivationFunction = 'sigmoid' | 'tanh' | 'relu';

export interface NodeGene {
  id: number;
  type: NodeType;
  activation: ActivationFunction;
}

export interface ConnectionGene {
  inNode: number;
  outNode: number;
  weight: number;
  enabled: boolean;
  innovation: number;
}

export interface GenomeConfig {
  inputCount: number;
  outputCount: number;
  maxHiddenNodes: number;
}

// Activation function implementations
const activations: Record<ActivationFunction, (x: number) => number> = {
  sigmoid: (x: number) => 1 / (1 + Math.exp(-x)),
  tanh: (x: number) => Math.tanh(x),
  relu: (x: number) => Math.max(0, x),
};

export class Genome {
  public nodes: NodeGene[] = [];
  public connections: ConnectionGene[] = [];
  public fitness = 0;
  public speciesId = 0;

  private readonly _config: GenomeConfig;
  private nodeValues: Float32Array;

  constructor(config: GenomeConfig) {
    this._config = config;
    // Pre-allocate max possible nodes: inputs + outputs + max hidden
    this.nodeValues = new Float32Array(
      config.inputCount + config.outputCount + config.maxHiddenNodes,
    );
  }

  get config(): GenomeConfig {
    return this._config;
  }

  /**
   * Initialize a minimal genome with only input -> output connections
   */
  static createMinimal(
    config: GenomeConfig,
    innovationStart: number,
  ): { genome: Genome; innovationEnd: number } {
    const genome = new Genome(config);
    let innovation = innovationStart;

    // Create input nodes
    for (let i = 0; i < config.inputCount; i++) {
      genome.nodes.push({
        id: i,
        type: NodeType.INPUT,
        activation: 'sigmoid',
      });
    }

    // Create output nodes
    for (let i = 0; i < config.outputCount; i++) {
      genome.nodes.push({
        id: config.inputCount + i,
        type: NodeType.OUTPUT,
        activation: 'sigmoid',
      });
    }

    // Create initial connections (all inputs to all outputs)
    for (let i = 0; i < config.inputCount; i++) {
      for (let j = 0; j < config.outputCount; j++) {
        genome.connections.push({
          inNode: i,
          outNode: config.inputCount + j,
          weight: Math.random() * 2 - 1, // Random weight [-1, 1]
          enabled: true,
          innovation: innovation++,
        });
      }
    }

    return { genome, innovationEnd: innovation };
  }

  /**
   * Forward propagation - replaces TensorFlow.js predict()
   * Uses topological sorting for correct evaluation order
   */
  activate(inputs: Float32Array | number[]): number[] {
    // Reset all node values
    this.nodeValues.fill(0);

    // Set input values
    for (let i = 0; i < this.config.inputCount; i++) {
      this.nodeValues[i] = inputs[i] ?? 0;
    }

    // Get topologically sorted node order
    const sortedNodes = this.topologicalSort();

    // Process nodes in order
    for (const nodeId of sortedNodes) {
      const node = this.nodes.find((n) => n.id === nodeId);
      if (!node || node.type === NodeType.INPUT) continue;

      // Sum incoming connections
      let sum = 0;
      for (const conn of this.connections) {
        if (conn.outNode === nodeId && conn.enabled) {
          sum += this.nodeValues[conn.inNode] * conn.weight;
        }
      }

      // Apply activation function
      const activationFn = activations[node.activation];
      this.nodeValues[nodeId] = activationFn(sum);
    }

    // Extract output values
    const outputs: number[] = [];
    for (let i = 0; i < this.config.outputCount; i++) {
      outputs.push(this.nodeValues[this.config.inputCount + i]);
    }

    return outputs;
  }

  /**
   * Topological sort of nodes for correct activation order
   */
  private topologicalSort(): number[] {
    const visited = new Set<number>();
    const result: number[] = [];

    const visit = (nodeId: number): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      // Visit all nodes that this node depends on
      for (const conn of this.connections) {
        if (conn.outNode === nodeId && conn.enabled) {
          visit(conn.inNode);
        }
      }

      result.push(nodeId);
    };

    // Start from output nodes
    for (let i = 0; i < this.config.outputCount; i++) {
      visit(this.config.inputCount + i);
    }

    return result;
  }

  /**
   * Get the next available node ID
   */
  getNextNodeId(): number {
    return Math.max(...this.nodes.map((n) => n.id)) + 1;
  }

  /**
   * Check if we can add more hidden nodes
   */
  canAddNode(): boolean {
    const hiddenCount = this.nodes.filter(
      (n) => n.type === NodeType.HIDDEN,
    ).length;
    return hiddenCount < this.config.maxHiddenNodes;
  }

  /**
   * Reset the genome for reuse (Object Pooling)
   */
  reset(): void {
    this.nodes.length = 0;
    this.connections.length = 0;
    this.fitness = 0;
    this.speciesId = 0;
    this.nodeValues.fill(0);
  }

  /**
   * Copy state from another genome
   */
  copyFrom(other: Genome): void {
    this.reset();
    // We must deep copy gene objects to avoid shared reference mutations
    other.nodes.forEach((n) => this.nodes.push({ ...n }));
    other.connections.forEach((c) => this.connections.push({ ...c }));
    this.fitness = other.fitness;
    this.speciesId = other.speciesId;
  }

  /**
   * Deep clone this genome
   * NOTE: Prefer using GenomePool.acquire() and copyFrom() for performance
   */
  clone(): Genome {
    const cloned = new Genome(this.config);
    cloned.copyFrom(this);
    return cloned;
  }

  /**
   * Serialize to JSON for saving
   */
  toJSON(): {
    nodes: NodeGene[];
    connections: ConnectionGene[];
    fitness: number;
    speciesId: number;
  } {
    return {
      nodes: this.nodes,
      connections: this.connections,
      fitness: this.fitness,
      speciesId: this.speciesId,
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(
    config: GenomeConfig,
    json: {
      nodes: NodeGene[];
      connections: ConnectionGene[];
      fitness: number;
      speciesId: number;
    },
  ): Genome {
    const genome = new Genome(config);
    genome.nodes = json.nodes.map((n) => ({ ...n }));
    genome.connections = json.connections.map((c) => ({ ...c }));
    genome.fitness = json.fitness;
    genome.speciesId = json.speciesId;
    return genome;
  }
}
