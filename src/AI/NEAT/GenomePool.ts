import { Genome, type GenomeConfig } from './Genome';

/**
 * Object Pool for Genomes
 *
 * Reuses Genome instances to avoid Garbage Collection spikes during evolution.
 * Crucial for sustaining high frame rates with large populations (150+).
 */
export class GenomePool {
  private pool: Genome[] = [];
  private static instance: GenomePool | undefined;

  static getInstance(): GenomePool {
    GenomePool.instance ??= new GenomePool();
    return GenomePool.instance;
  }

  /**
   * Get a genome from the pool or create a new one
   */
  acquire(config: GenomeConfig): Genome {
    const genome = this.pool.pop();
    if (genome) {
      genome.reset();
      return genome;
    }
    return new Genome(config);
  }

  /**
   * Return a genome to the pool
   */
  release(genome: Genome): void {
    genome.reset();
    this.pool.push(genome);
  }

  /**
   * Total genomes in pool
   */
  get size(): number {
    return this.pool.length;
  }

  /**
   * Clear all pooled genomes
   */
  clear(): void {
    this.pool = [];
  }
}

export const genomePool = GenomePool.getInstance();
