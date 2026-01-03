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

  private readonly config: SpeciesConfig;
  private stagnationCounter = 0;

  constructor(id: number, representative: Genome, config: SpeciesConfig) {
    this.id = id;
    this.config = config;

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

    // Get all innovation numbers from both genomes
    const innovations1 = new Map(
      genome1.connections.map((c) => [c.innovation, c]),
    );
    const innovations2 = new Map(
      genome2.connections.map((c) => [c.innovation, c]),
    );

    // Find max innovation in each genome
    const maxInnovation1 = Math.max(
      ...genome1.connections.map((c) => c.innovation),
      0,
    );
    const maxInnovation2 = Math.max(
      ...genome2.connections.map((c) => c.innovation),
      0,
    );
    const maxInnovation = Math.max(maxInnovation1, maxInnovation2);

    let excess = 0;
    let disjoint = 0;
    let weightDiff = 0;
    let matchingCount = 0;

    // Iterate through all possible innovations
    for (let i = 0; i <= maxInnovation; i++) {
      const gene1 = innovations1.get(i);
      const gene2 = innovations2.get(i);

      if (gene1 && gene2) {
        // Matching gene
        matchingCount++;
        weightDiff += Math.abs(gene1.weight - gene2.weight);
      } else if (gene1 || gene2) {
        // Gene exists in only one genome
        const innovation = gene1 ? gene1.innovation : (gene2?.innovation ?? 0);
        const smallerMax = Math.min(maxInnovation1, maxInnovation2);

        if (innovation > smallerMax) {
          excess++;
        } else {
          disjoint++;
        }
      }
    }

    // Normalize by larger genome size (N)
    const N = Math.max(
      genome1.connections.length,
      genome2.connections.length,
      1,
    );
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
   */
  updateStagnation(): boolean {
    const currentBest = Math.max(...this.members.map((m) => m.fitness));

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
      // Randomly select a member as the new representative
      const idx = Math.floor(Math.random() * this.members.length);
      this.representative = this.members[idx].clone();
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
   */
  getSortedMembers(): Genome[] {
    return [...this.members].sort((a, b) => b.fitness - a.fitness);
  }

  /**
   * Release resources held by this species
   */
  release(): void {
    genomePool.release(this.representative);
    this.members = [];
  }
}
