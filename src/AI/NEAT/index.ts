import { PlayerNames } from '@/lib/constants';
import { gameStateBridge } from '@/store/bridge';
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

// Debug flag for console logging - disable in production for performance
const DEBUG_NEAT = process.env.NODE_ENV === 'development';

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
  interspeciesCrossoverRate: number; // Probability of breeding across species
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
  private previousSpeciesStats = new Map<number, { fitness: number }>();

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
    // IMPORTANT: For the initial population, the same structure MUST share the same innovation numbers
    // so that speciation can correctly identify them as matching topology.
    let currentInnov = 0;
    for (let i = 0; i < this.genomeConfig.inputCount; i++) {
      for (let j = 0; j < this.genomeConfig.outputCount; j++) {
        genome.connections.push({
          inNode: i,
          outNode: this.genomeConfig.inputCount + j,
          weight: Math.random() * 2 - 1,
          enabled: true,
          innovation: currentInnov++,
        });
      }
    }

    // Ensure the global innovation tracker starts AFTER the base connections
    if (innovationTracker.getCurrentInnovation() < currentInnov) {
      innovationTracker.setCurrentInnovation(currentInnov);
    }
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
          this.generation,
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
      0.2,
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
        const parent1 = this.tournamentSelect(survivors);
        let parent2: Genome;

        // Interspecies crossover for genetic diversity
        if (
          Math.random() < this.config.interspeciesCrossoverRate &&
          this.species.length > 1
        ) {
          // Pick a random different species
          const otherSpecies = this.species.filter((s) => s.id !== species.id);
          if (otherSpecies.length > 0) {
            const randomOther =
              otherSpecies[Math.floor(Math.random() * otherSpecies.length)];
            parent2 = this.tournamentSelect(randomOther.members);
          } else {
            parent2 = this.tournamentSelect(survivors);
          }
        } else {
          parent2 = this.tournamentSelect(survivors);
        }

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

    // Calculate best fitness without spread operator (avoids array allocation)
    let bestFitness = 0;
    for (const g of this.population) {
      if (g.fitness > bestFitness) bestFitness = g.fitness;
    }

    // Debug logging - guarded to avoid overhead in production
    if (DEBUG_NEAT) {
      console.groupCollapsed(`NEAT Generation ${String(this.generation)}`);
      console.table({
        generation: this.generation,
        species: this.species.length,
        population: this.population.length,
        bestFitness: Math.floor(bestFitness),
      });
      console.log('Species Breakdown:');
    }

    // Build speciesData - needed for both logging and gameStateBridge
    const speciesData = this.species
      .sort((a, b) => b.averageFitness - a.averageFitness)
      .map((s) => {
        const prev = this.previousSpeciesStats.get(s.id);
        const momentum: 'up' | 'down' | 'flat' = !prev
          ? 'flat'
          : s.averageFitness > prev.fitness + 1
            ? 'up'
            : s.averageFitness < prev.fitness - 1
              ? 'down'
              : 'flat';

        // Calculate technical stats
        const totalNodes = s.members.reduce(
          (sum, g) => sum + g.nodes.length,
          0,
        );
        const totalConns = s.members.reduce(
          (sum, g) => sum + g.connections.filter((c) => c.enabled).length,
          0,
        );

        return {
          id: s.id,
          name: PLAYER_SKINS[s.id % PLAYER_SKINS.length],
          members: s.members.length,
          avgFitness: s.averageFitness,
          bestFitness: s.bestFitness,
          stagnation: s.stagnation,
          momentum,
          bornGen: s.bornGeneration,
          avgNodes: totalNodes / (s.members.length || 1),
          avgConnections: totalConns / (s.members.length || 1),
        };
      });

    // Update previous stats for next epoch
    this.previousSpeciesStats.clear();
    speciesData.forEach((s) => {
      this.previousSpeciesStats.set(s.id, { fitness: s.avgFitness });
    });

    if (DEBUG_NEAT) {
      console.table(
        speciesData.map((s) => ({
          Skin: s.name.toUpperCase(),
          Members: s.members,
          AvgFit: Math.floor(s.avgFitness),
          Momentum: s.momentum,
          Stagnant: s.stagnation,
        })),
      );
      console.groupEnd();
    }

    const avgFitness =
      this.population.reduce((sum, g) => sum + g.fitness, 0) /
      (this.population.length || 1);

    const totalComplexity = this.population.reduce(
      (sum, g) => sum + g.connections.filter((c) => c.enabled).length,
      0,
    );
    const avgComplexity = totalComplexity / (this.population.length || 1);

    gameStateBridge.updateGenerationStats({
      generation: this.generation,
      speciesCount: this.species.length,
      population: this.population.length,
      bestFitness, // Use already calculated bestFitness
      avgFitness,
      avgComplexity,
      species: speciesData,
    });
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
   * Tournament selection - picks the best from a random subset
   * This provides selection pressure while maintaining diversity
   */
  private tournamentSelect(candidates: Genome[], tournamentSize = 3): Genome {
    if (candidates.length === 0) {
      return this.population[
        Math.floor(Math.random() * this.population.length)
      ];
    }

    if (candidates.length <= tournamentSize) {
      // Return the best if pool is small
      return candidates.reduce((best, curr) =>
        curr.fitness > best.fitness ? curr : best,
      );
    }

    // Pick random contestants and return the best
    let best = candidates[Math.floor(Math.random() * candidates.length)];
    for (let i = 1; i < tournamentSize; i++) {
      const contestant =
        candidates[Math.floor(Math.random() * candidates.length)];
      if (contestant.fitness > best.fitness) {
        best = contestant;
      }
    }
    return best;
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
        genome.markTopologyDirty();
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
    genome.markTopologyDirty();
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
