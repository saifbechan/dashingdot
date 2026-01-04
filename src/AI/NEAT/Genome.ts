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

// Activation function implementations (kept for future activation function support)
const _activations: Record<ActivationFunction, (x: number) => number> = {
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

  // Topology cache for O(1) activation after first run
  private cachedSortedNodes: number[] | null = null;
  private cachedIncomingConnections: Map<number, ConnectionGene[]> | null =
    null;
  private topologyDirty = true;

  // Track next node ID for O(1) lookup instead of O(n) Math.max()
  private _nextNodeId = 0;

  constructor(config: GenomeConfig) {
    this._config = config;
    // Pre-allocate max possible nodes: inputs + outputs + max hidden
    this.nodeValues = new Float32Array(
      config.inputCount + config.outputCount + config.maxHiddenNodes,
    );
    // Initialize next node ID after input + output nodes
    this._nextNodeId = config.inputCount + config.outputCount;
  }

  /**
   * Mark topology as dirty (call after any structural mutation)
   */
  markTopologyDirty(): void {
    this.topologyDirty = true;
    this.cachedSortedNodes = null;
    this.cachedIncomingConnections = null;
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
   * Uses cached topological sorting for correct evaluation order
   */
  activate(inputs: Float32Array | number[]): number[] {
    // Build cache if topology changed
    if (this.topologyDirty) {
      this.buildTopologyCache();
    }

    // Reset all node values
    this.nodeValues.fill(0);

    // Set input values
    for (let i = 0; i < this.config.inputCount; i++) {
      this.nodeValues[i] = inputs[i] ?? 0;
    }

    // Process nodes in cached order using pre-indexed connections
    const sortedNodes = this.cachedSortedNodes;
    const incomingMap = this.cachedIncomingConnections;
    if (!sortedNodes || !incomingMap) return [];

    for (const nodeId of sortedNodes) {
      const incoming = incomingMap.get(nodeId);
      if (!incoming) continue;

      // Sum incoming connections (already filtered to enabled only)
      let sum = 0;
      for (const conn of incoming) {
        sum += this.nodeValues[conn.inNode] * conn.weight;
      }

      // Apply sigmoid activation (most common, inlined for speed)
      this.nodeValues[nodeId] = 1 / (1 + Math.exp(-sum));
    }

    // Extract output values
    const outputs: number[] = [];
    for (let i = 0; i < this.config.outputCount; i++) {
      outputs.push(this.nodeValues[this.config.inputCount + i]);
    }

    return outputs;
  }

  /**
   * Build topology cache: sorted nodes and incoming connection index
   */
  private buildTopologyCache(): void {
    // Build incoming connections map (only enabled connections)
    this.cachedIncomingConnections = new Map();
    for (const conn of this.connections) {
      if (!conn.enabled) continue;
      const existing = this.cachedIncomingConnections.get(conn.outNode);
      if (existing) {
        existing.push(conn);
      } else {
        this.cachedIncomingConnections.set(conn.outNode, [conn]);
      }
    }

    // Topological sort
    const visited = new Set<number>();
    const result: number[] = [];

    const visit = (nodeId: number): void => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const incoming = this.cachedIncomingConnections?.get(nodeId);
      if (incoming) {
        for (const conn of incoming) {
          visit(conn.inNode);
        }
      }

      result.push(nodeId);
    };

    // Start from output nodes
    for (let i = 0; i < this.config.outputCount; i++) {
      visit(this.config.inputCount + i);
    }

    // Filter to only non-input nodes (inputs don't need processing)
    this.cachedSortedNodes = result.filter(
      (id) => id >= this.config.inputCount,
    );
    this.topologyDirty = false;
  }

  /**
   * Get the next available node ID - O(1) using tracked counter
   */
  getNextNodeId(): number {
    return this._nextNodeId++;
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
    this._nextNodeId = this._config.inputCount + this._config.outputCount;
    this.markTopologyDirty();
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
    // Copy next node ID from source to maintain proper tracking
    this._nextNodeId = other._nextNodeId;
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
