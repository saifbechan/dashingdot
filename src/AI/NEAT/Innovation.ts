/**
 * Innovation Tracker - Global innovation number management for NEAT
 *
 * Innovation numbers ensure that matching genes during crossover
 * represent the same structural innovation. This is key to NEAT's
 * ability to properly align genomes of different topologies.
 */

class InnovationTracker {
  private currentInnovation = 0;
  // Use Map with composite key for O(1) lookup instead of O(n) array.find()
  private historyMap = new Map<string, number>();

  /**
   * Get or create an innovation number for a connection
   * O(1) lookup using Map instead of O(n) array search
   */
  getInnovation(inNode: number, outNode: number): number {
    const key = `${String(inNode)}:${String(outNode)}`;
    const existing = this.historyMap.get(key);

    if (existing !== undefined) {
      return existing;
    }

    // New innovation
    const innovation = this.currentInnovation++;
    this.historyMap.set(key, innovation);
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
    this.historyMap.clear();
  }

  /**
   * Full reset for starting fresh
   */
  fullReset(): void {
    this.currentInnovation = 0;
    this.historyMap.clear();
  }
}

// Singleton instance for global innovation tracking
export const innovationTracker = new InnovationTracker();
