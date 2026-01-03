import { PlayerNames } from '@/lib/constants';
import {
  NodeType,
  type ConnectionGene,
  type Genome,
  type GenomeConfig,
  type NodeGene,
} from './Genome';
import { genomePool } from './GenomePool';
import { innovationTracker } from './Innovation';
import { Species, type SpeciesConfig } from './Species';

// Map species ID to player skin name
const PLAYER_SKINS = Object.values(PlayerNames);

export interface NEATConfig {
  populationSize: number;
  inputCount: number;
  outputCount: number;
  maxHiddenNodes: number;
  targetSpecies: number;

  // Species config
  compatibilityThreshold: number;
  compatibilityModifier: number;
  excessCoefficient: number;
  disjointCoefficient: number;
  weightDifferenceCoefficient: number;
  stagnationLimit: number;

  // Evolution rates
  survivalRate: number;
  mutationRates: {
    weight: number;
    node: number;
    connection: number;
    perturbWeight: number;
  };
}

export class NEATController {
  private population: Genome[] = [];
  private species: Species[] = [];
  private generation = 0;
  private readonly config: NEATConfig;
  private readonly genomeConfig: GenomeConfig;
  private readonly speciesConfig: SpeciesConfig;

  constructor(config: NEATConfig) {
    this.config = config;

    this.genomeConfig = {
      inputCount: config.inputCount,
      outputCount: config.outputCount,
      maxHiddenNodes: config.maxHiddenNodes,
    };

    this.speciesConfig = {
      compatibilityThreshold: config.compatibilityThreshold,
      excessCoefficient: config.excessCoefficient,
      disjointCoefficient: config.disjointCoefficient,
      weightDifferenceCoefficient: config.weightDifferenceCoefficient,
      stagnationLimit: config.stagnationLimit,
    };

    this.initializePopulation();
  }

  /**
   * Initialize population with minimal genomes
   */
  private initializePopulation(): void {
    innovationTracker.fullReset();

    // Ensure pool is clean
    // genomePool.clear(); // Optional, but safer if starting fresh session

    this.population = [];

    for (let i = 0; i < this.config.populationSize; i++) {
      const genome = this.createMinimalGenome();
      this.population.push(genome);
    }

    // Initial speciation
    this.speciate();
  }

  /**
   * Create a minimal genome using the pool
   */
  private createMinimalGenome(): Genome {
    // Use innovation 0 for initial connections to keep consistent across population
    // Actually, we should use innovationTracker
    const genome = genomePool.acquire(this.genomeConfig);

    // Create input nodes
    for (let i = 0; i < this.genomeConfig.inputCount; i++) {
      genome.nodes.push({
        id: i,
        type: NodeType.INPUT,
        activation: 'sigmoid',
      });
    }

    // Create output nodes
    for (let i = 0; i < this.genomeConfig.outputCount; i++) {
      genome.nodes.push({
        id: this.genomeConfig.inputCount + i,
        type: NodeType.OUTPUT,
        activation: 'sigmoid',
      });
    }

    // Create initial connections (all inputs to all outputs)
    let innovation = innovationTracker.getCurrentInnovation();
    for (let i = 0; i < this.genomeConfig.inputCount; i++) {
      for (let j = 0; j < this.genomeConfig.outputCount; j++) {
        genome.connections.push({
          inNode: i,
          outNode: this.genomeConfig.inputCount + j,
          weight: Math.random() * 2 - 1,
          enabled: true,
          innovation: innovation++,
        });
      }
    }
    innovationTracker.setCurrentInnovation(innovation);

    return genome;
  }

  /**
   * Assign genomes to species based on compatibility
   */
  private speciate(): void {
    // Clear existing species members
    for (const species of this.species) {
      species.selectNewRepresentative();
      species.clearMembers();
    }

    // Assign each genome to a species
    for (const genome of this.population) {
      let foundSpecies = false;

      for (const species of this.species) {
        if (species.isCompatible(genome)) {
          species.addMember(genome);
          foundSpecies = true;
          break;
        }
      }

      // Create new species if no match found
      if (!foundSpecies) {
        const newSpecies = new Species(
          this.species.length,
          genome,
          this.speciesConfig,
        );
        this.species.push(newSpecies);
      }
    }

    // Remove empty species
    // Release persistent representatives of dead species
    this.species = this.species.filter((s) => {
      if (s.members.length === 0) {
        s.release(); // IMPORTANT: Release representative to pool
        return false;
      }
      return true;
    });

    // Re-assign species IDs to be sequential
    this.species.forEach((s, idx) => (s.id = idx));

    // Adjust compatibility threshold to maintain target species count
    this.adjustCompatibilityThreshold();
  }

  // ... adjustCompatibilityThreshold (unchanged) ...
  // Need to include it here since I'm confusing replace tool

  private adjustCompatibilityThreshold(): void {
    const speciesCount = this.species.length;
    const target = this.config.targetSpecies;

    if (speciesCount < target) {
      this.speciesConfig.compatibilityThreshold -=
        this.config.compatibilityModifier;
    } else if (speciesCount > target) {
      this.speciesConfig.compatibilityThreshold +=
        this.config.compatibilityModifier;
    }

    this.speciesConfig.compatibilityThreshold = Math.max(
      0.5,
      Math.min(10, this.speciesConfig.compatibilityThreshold),
    );
  }

  /**
   * Run one evolution epoch
   */
  epoch(fitnessData?: { fitness: number; speciesId?: number }[]): void {
    this.generation++;

    if (fitnessData?.length === this.population.length) {
      for (let i = 0; i < this.population.length; i++) {
        this.population[i].fitness = fitnessData[i].fitness;
      }
    }

    // Calculate adjusted fitness for each species
    for (const species of this.species) {
      species.calculateAdjustedFitness();
    }

    // Remove stagnant species (keep at least 2)
    if (this.species.length > 2) {
      this.species = this.species.filter((s) => {
        const stagnant = s.updateStagnation();
        if (stagnant) {
          s.release(); // Release representative
          return false;
        }
        return true;
      });
    }

    // Create new population
    const newPopulation: Genome[] = [];
    const totalAdjustedFitness = this.species.reduce(
      (sum, s) => sum + s.averageFitness * s.members.length,
      0,
    );

    // Reset innovation history
    innovationTracker.resetHistory();

    // Reproduce
    for (const species of this.species) {
      const speciesFitness = species.averageFitness * species.members.length;
      let offspring = Math.floor(
        (speciesFitness / (totalAdjustedFitness || 1)) *
          this.config.populationSize,
      );

      offspring = Math.max(1, offspring);

      const sortedMembers = species.getSortedMembers();
      const survivalCount = Math.max(
        1,
        Math.floor(sortedMembers.length * this.config.survivalRate),
      );
      const survivors = sortedMembers.slice(0, survivalCount);

      // Elitism with pooling
      if (survivors.length > 0) {
        const elite = genomePool.acquire(this.genomeConfig);
        elite.copyFrom(survivors[0]);
        newPopulation.push(elite);
        offspring--;
      }

      // Create offspring
      for (
        let i = 0;
        i < offspring && newPopulation.length < this.config.populationSize;
        i++
      ) {
        const parent1 = this.selectParent(survivors);
        const parent2 = this.selectParent(survivors);

        let child: Genome;
        if (parent1 === parent2) {
          child = genomePool.acquire(this.genomeConfig);
          child.copyFrom(parent1);
        } else {
          child = this.crossover(parent1, parent2);
        }

        this.mutate(child);
        newPopulation.push(child);
      }
    }

    // Fill remaining slots
    while (newPopulation.length < this.config.populationSize) {
      if (this.species.length === 0) {
        // Edge case: no species exist
        const child = this.createMinimalGenome();
        newPopulation.push(child);
        continue;
      }

      const randomSpecies =
        this.species[Math.floor(Math.random() * this.species.length)];

      if (randomSpecies.members.length > 0) {
        const parent = this.selectParent(randomSpecies.members);
        const child = genomePool.acquire(this.genomeConfig);
        child.copyFrom(parent);
        this.mutate(child);
        newPopulation.push(child);
      } else {
        // Fallback
        const child = this.createMinimalGenome();
        newPopulation.push(child);
      }
    }

    const oldPopulation = this.population;
    this.population = newPopulation;

    // Re-speciate with new population
    this.speciate();

    // Release old population genomes to pool
    // MUST happen after speciate() because speciate uses old representatives
    oldPopulation.forEach((g) => {
      genomePool.release(g);
    });

    console.groupCollapsed(`NEAT Generation ${String(this.generation)}`);
    console.table({
      generation: this.generation,
      species: this.species.length,
      population: this.population.length,
      bestFitness: Math.floor(
        Math.max(...this.population.map((g) => g.fitness)),
      ),
    });

    console.log('Species Breakdown:');
    console.table(
      this.species
        .sort((a, b) => b.averageFitness - a.averageFitness)
        .map((s) => ({
          Skin: PLAYER_SKINS[s.id % PLAYER_SKINS.length].toUpperCase(),
          Members: s.members.length,
          AvgFit: Math.floor(s.averageFitness),
          Stagnant: s.stagnation,
        })),
    );
    console.groupEnd();
  }

  // ... selectParent (unchanged) ...
  private selectParent(candidates: Genome[]): Genome {
    if (candidates.length === 0) {
      return this.population[
        Math.floor(Math.random() * this.population.length)
      ];
    }
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  /**
   * Crossover two genomes using pool
   */
  private crossover(parent1: Genome, parent2: Genome): Genome {
    const [dominant, recessive] =
      parent1.fitness >= parent2.fitness
        ? [parent1, parent2]
        : [parent2, parent1];

    const child = genomePool.acquire(this.genomeConfig);

    // Copy all nodes from dominant parent
    child.nodes = dominant.nodes.map((n) => ({ ...n }));

    const recessiveGenes = new Map(
      recessive.connections.map((c) => [c.innovation, c]),
    );

    for (const gene of dominant.connections) {
      const recessiveGene = recessiveGenes.get(gene.innovation);

      if (recessiveGene && Math.random() < 0.5) {
        child.connections.push({ ...recessiveGene });
      } else {
        child.connections.push({ ...gene });
      }
    }

    return child;
  }

  // ... mutate methods (mostly unchanged as they modify in place) ...

  private mutate(genome: Genome): void {
    const { mutationRates } = this.config;

    if (Math.random() < mutationRates.weight) {
      this.mutateWeights(genome);
    }

    if (Math.random() < mutationRates.connection) {
      this.mutateAddConnection(genome);
    }

    if (Math.random() < mutationRates.node && genome.canAddNode()) {
      this.mutateAddNode(genome);
    }
  }

  private mutateWeights(genome: Genome): void {
    for (const conn of genome.connections) {
      if (Math.random() < this.config.mutationRates.perturbWeight) {
        conn.weight += (Math.random() * 2 - 1) * 0.5;
        conn.weight = Math.max(-4, Math.min(4, conn.weight));
      } else {
        conn.weight = Math.random() * 2 - 1;
      }
    }
  }

  private mutateAddConnection(genome: Genome): void {
    const sourceNodes = genome.nodes.filter((n) => n.type !== NodeType.OUTPUT);
    const targetNodes = genome.nodes.filter((n) => n.type !== NodeType.INPUT);

    for (let attempts = 0; attempts < 20; attempts++) {
      const source =
        sourceNodes[Math.floor(Math.random() * sourceNodes.length)];
      const target =
        targetNodes[Math.floor(Math.random() * targetNodes.length)];

      const exists = genome.connections.some(
        (c) => c.inNode === source.id && c.outNode === target.id,
      );

      if (!exists && source.id !== target.id) {
        genome.connections.push({
          inNode: source.id,
          outNode: target.id,
          weight: Math.random() * 2 - 1,
          enabled: true,
          innovation: innovationTracker.getInnovation(source.id, target.id),
        });
        return;
      }
    }
  }

  private mutateAddNode(genome: Genome): void {
    const enabledConnections = genome.connections.filter((c) => c.enabled);
    if (enabledConnections.length === 0) return;

    const conn =
      enabledConnections[Math.floor(Math.random() * enabledConnections.length)];
    conn.enabled = false;

    const newNodeId = genome.getNextNodeId();
    const newNode: NodeGene = {
      id: newNodeId,
      type: NodeType.HIDDEN,
      activation: 'sigmoid',
    };
    genome.nodes.push(newNode);

    const conn1: ConnectionGene = {
      inNode: conn.inNode,
      outNode: newNodeId,
      weight: 1,
      enabled: true,
      innovation: innovationTracker.getInnovation(conn.inNode, newNodeId),
    };

    const conn2: ConnectionGene = {
      inNode: newNodeId,
      outNode: conn.outNode,
      weight: conn.weight,
      enabled: true,
      innovation: innovationTracker.getInnovation(newNodeId, conn.outNode),
    };

    genome.connections.push(conn1, conn2);
  }

  getPopulation(): { genome: Genome; speciesId: number }[] {
    return this.population.map((genome) => ({
      genome,
      speciesId: genome.speciesId,
    }));
  }

  getSpeciesCount(): number {
    return this.species.length;
  }

  getGeneration(): number {
    return this.generation;
  }
}

// Export all types
export { Genome, NodeType, type GenomeConfig } from './Genome';
export { genomePool, GenomePool } from './GenomePool';
export { innovationTracker } from './Innovation';
export { Species, type SpeciesConfig } from './Species';
