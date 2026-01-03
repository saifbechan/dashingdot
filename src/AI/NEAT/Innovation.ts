/**
 * Innovation Tracker - Global innovation number management for NEAT
 *
 * Innovation numbers ensure that matching genes during crossover
 * represent the same structural innovation. This is key to NEAT's
 * ability to properly align genomes of different topologies.
 */

interface InnovationRecord {
  inNode: number;
  outNode: number;
  innovation: number;
}

class InnovationTracker {
  private currentInnovation = 0;
  private history: InnovationRecord[] = [];

  /**
   * Get or create an innovation number for a connection
   */
  getInnovation(inNode: number, outNode: number): number {
    // Check if this connection has been created before
    const existing = this.history.find(
      (r) => r.inNode === inNode && r.outNode === outNode,
    );

    if (existing) {
      return existing.innovation;
    }

    // New innovation
    const innovation = this.currentInnovation++;
    this.history.push({ inNode, outNode, innovation });
    return innovation;
  }

  /**
   * Set the starting innovation number (for initialization)
   */
  setCurrentInnovation(value: number): void {
    this.currentInnovation = value;
  }

  /**
   * Get current innovation counter value
   */
  getCurrentInnovation(): number {
    return this.currentInnovation;
  }

  /**
   * Reset for a new generation (clears history but keeps counter)
   */
  resetHistory(): void {
    this.history = [];
  }

  /**
   * Full reset for starting fresh
   */
  fullReset(): void {
    this.currentInnovation = 0;
    this.history = [];
  }
}

// Singleton instance for global innovation tracking
export const innovationTracker = new InnovationTracker();
