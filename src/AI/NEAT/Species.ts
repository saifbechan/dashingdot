/**
 * NEAT Species - Species management for speciation
 *
 * Species group genomes with similar topology to protect innovation.
 * Each species has a representative genome used for compatibility testing.
 */

import { type Genome } from './Genome';
import { genomePool } from './GenomePool';

export interface SpeciesConfig {
  compatibilityThreshold: number;
  excessCoefficient: number; // c1
  disjointCoefficient: number; // c2
  weightDifferenceCoefficient: number; // c3
  stagnationLimit: number;
}
export class Species {
  public id: number;
  public members: Genome[] = [];
  public representative: Genome;
  public averageFitness = 0;
  public stagnation = 0;
  public bestFitness = 0;
  public bornGeneration: number;

  private readonly config: SpeciesConfig;
  private stagnationCounter = 0;

  constructor(
    id: number,
    representative: Genome,
    config: SpeciesConfig,
    generation: number,
  ) {
    this.id = id;
    this.config = config;
    this.bornGeneration = generation;

    // Create a deep copy of the representative using the pool
    // This ensures the species has its own independent reference
    this.representative = genomePool.acquire(representative.config);
    this.representative.copyFrom(representative);

    this.members.push(representative);
  }

  /**
   * Calculate compatibility distance between two genomes
   * δ = (c1 * E / N) + (c2 * D / N) + (c3 * W̄)
   *
   * E = excess genes, D = disjoint genes, W̄ = average weight difference
   *
   * Optimized: O(n + m) merge algorithm instead of O(maxInnovation)
   */
  static compatibilityDistance(
    genome1: Genome,
    genome2: Genome,
    config: SpeciesConfig,
  ): number {
    const {
      excessCoefficient,
      disjointCoefficient,
      weightDifferenceCoefficient,
    } = config;

    const conns1 = genome1.connections;
    const conns2 = genome2.connections;

    // Find max innovations without spread operator (avoids array allocation)
    let maxInnovation1 = 0;
    for (const c of conns1) {
      if (c.innovation > maxInnovation1) maxInnovation1 = c.innovation;
    }
    let maxInnovation2 = 0;
    for (const c of conns2) {
      if (c.innovation > maxInnovation2) maxInnovation2 = c.innovation;
    }
    const smallerMax = Math.min(maxInnovation1, maxInnovation2);

    // Build innovation -> connection map for genome2
    const innovations2 = new Map(conns2.map((c) => [c.innovation, c]));

    let excess = 0;
    let disjoint = 0;
    let weightDiff = 0;
    let matchingCount = 0;

    // Iterate through genome1's connections
    for (const gene1 of conns1) {
      const gene2 = innovations2.get(gene1.innovation);

      if (gene2) {
        // Matching gene
        matchingCount++;
        weightDiff += Math.abs(gene1.weight - gene2.weight);
        innovations2.delete(gene1.innovation); // Mark as processed
      } else {
        // Gene only in genome1
        if (gene1.innovation > smallerMax) {
          excess++;
        } else {
          disjoint++;
        }
      }
    }

    // Remaining genes in innovations2 are only in genome2
    for (const [innovation] of innovations2) {
      if (innovation > smallerMax) {
        excess++;
      } else {
        disjoint++;
      }
    }

    // Normalize by larger genome size (N)
    const N = Math.max(conns1.length, conns2.length, 1);
    const avgWeightDiff = matchingCount > 0 ? weightDiff / matchingCount : 0;

    return (
      (excessCoefficient * excess) / N +
      (disjointCoefficient * disjoint) / N +
      weightDifferenceCoefficient * avgWeightDiff
    );
  }

  /**
   * Check if a genome is compatible with this species
   */
  isCompatible(genome: Genome): boolean {
    const distance = Species.compatibilityDistance(
      genome,
      this.representative,
      this.config,
    );
    return distance < this.config.compatibilityThreshold;
  }

  /**
   * Add a genome to this species
   */
  addMember(genome: Genome): void {
    genome.speciesId = this.id;
    this.members.push(genome);
  }

  /**
   * Calculate adjusted fitness for all members (fitness sharing)
   */
  calculateAdjustedFitness(): void {
    const speciesSize = this.members.length;
    if (speciesSize === 0) return;

    let totalFitness = 0;
    for (const member of this.members) {
      // Adjusted fitness = raw fitness / species size
      totalFitness += member.fitness / speciesSize;
    }

    this.averageFitness = totalFitness / speciesSize;
  }

  /**
   * Update stagnation and check if species should be eliminated
   * Optimized: avoid spread operator allocation
   */
  updateStagnation(): boolean {
    let currentBest = 0;
    for (const m of this.members) {
      if (m.fitness > currentBest) currentBest = m.fitness;
    }

    if (currentBest > this.bestFitness) {
      this.bestFitness = currentBest;
      this.stagnationCounter = 0;
    } else {
      this.stagnationCounter++;
    }

    return this.stagnationCounter >= this.config.stagnationLimit;
  }

  /**
   * Select a new representative for next generation
   */
  selectNewRepresentative(): void {
    if (this.members.length > 0) {
      // Randomly select a member as the new representative source
      const newRepSource =
        this.members[Math.floor(Math.random() * this.members.length)];

      // Release old representative back to pool
      genomePool.release(this.representative);

      // Acquire new representative from pool and copy state
      this.representative = genomePool.acquire(newRepSource.config);
      this.representative.copyFrom(newRepSource);
    }
  }

  /**
   * Clear members for next generation
   */
  clearMembers(): void {
    this.members = [];
  }

  /**
   * Get the best performing member
   */
  getBestMember(): Genome | undefined {
    if (this.members.length === 0) return undefined;
    return this.members.reduce((best, current) =>
      current.fitness > best.fitness ? current : best,
    );
  }

  /**
   * Get sorted members by fitness (descending)
   * Sorts in-place to avoid array allocation - caller should not modify result
   */
  getSortedMembers(): Genome[] {
    this.members.sort((a, b) => b.fitness - a.fitness);
    return this.members;
  }

  /**
   * Release resources held by this species
   */
  release(): void {
    genomePool.release(this.representative);
    this.members = [];
  }
}
