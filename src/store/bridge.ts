/**
 * Game State Bridge
 *
 * Provides methods for Phaser to update React state via Jotai.
 * This is a singleton that holds references to atom setters.
 */

import type {
  GenerationHistoryPoint,
  GenerationStats,
  SessionStats,
  TopPlayerStats,
} from './gameState';

type SetterFn<T> = (value: T | ((prev: T) => T)) => void;

class GameStateBridge {
  private static instance: GameStateBridge | undefined;

  private generationStatsSetter: SetterFn<GenerationStats> | null = null;
  private sessionStatsSetter: SetterFn<SessionStats> | null = null;
  private topPlayerStatsSetter: SetterFn<TopPlayerStats | null> | null = null;
  private generationHistorySetter: SetterFn<GenerationHistoryPoint[]> | null =
    null;
  private playersAliveSetter: SetterFn<number> | null = null;
  private isGamePausedSetter: SetterFn<boolean> | null = null;
  private allTimeChampionsSetter: SetterFn<TopPlayerStats[]> | null = null;

  private lastGenerationStats: GenerationStats | null = null;

  static getInstance(): GameStateBridge {
    GameStateBridge.instance ??= new GameStateBridge();
    return GameStateBridge.instance;
  }

  // Register setters from React components
  registerSetters(setters: {
    setGenerationStats?: SetterFn<GenerationStats>;
    setSessionStats?: SetterFn<SessionStats>;
    setTopPlayerStats?: SetterFn<TopPlayerStats | null>;
    setGenerationHistory?: SetterFn<GenerationHistoryPoint[]>;
    setPlayersAlive?: SetterFn<number>;
    setIsGamePaused?: SetterFn<boolean>;
    setAllTimeChampions?: SetterFn<TopPlayerStats[]>;
  }): void {
    if (setters.setGenerationStats)
      this.generationStatsSetter = setters.setGenerationStats;
    if (setters.setSessionStats)
      this.sessionStatsSetter = setters.setSessionStats;
    if (setters.setTopPlayerStats)
      this.topPlayerStatsSetter = setters.setTopPlayerStats;
    if (setters.setGenerationHistory)
      this.generationHistorySetter = setters.setGenerationHistory;
    if (setters.setPlayersAlive)
      this.playersAliveSetter = setters.setPlayersAlive;
    if (setters.setIsGamePaused)
      this.isGamePausedSetter = setters.setIsGamePaused;
    if (setters.setAllTimeChampions)
      this.allTimeChampionsSetter = setters.setAllTimeChampions;
  }

  // Update generation stats (called from NEATController)
  updateGenerationStats(stats: GenerationStats): void {
    // Calculate deltas
    const bestFitnessDelta = this.lastGenerationStats
      ? stats.bestFitness - this.lastGenerationStats.bestFitness
      : 0;
    const avgFitnessDelta = this.lastGenerationStats
      ? stats.avgFitness - this.lastGenerationStats.avgFitness
      : 0;

    const statsWithDeltas = {
      ...stats,
      bestFitnessDelta,
      avgFitnessDelta,
    };

    this.generationStatsSetter?.(statsWithDeltas);
    this.lastGenerationStats = statsWithDeltas;

    // Also update history
    this.generationHistorySetter?.((prev) => [
      ...prev.slice(-49), // Keep last 50 generations
      {
        generation: stats.generation,
        bestFitness: stats.bestFitness,
        avgFitness: stats.avgFitness,
        speciesCount: stats.speciesCount,
      },
    ]);

    // Update session peak
    this.sessionStatsSetter?.((prev) => ({
      ...prev,
      totalGenerations: stats.generation,
      peakFitness: Math.max(prev.peakFitness, stats.bestFitness),
    }));
  }

  // Update top player stats (called from PlayerManager)
  updateTopPlayerStats(stats: TopPlayerStats | null): void {
    this.topPlayerStatsSetter?.(stats);

    if (stats && stats.fitness > 0) {
      this.allTimeChampionsSetter?.((prev) => {
        // Only keep if new champion is better than worst in top 5
        const newTop = [...prev, stats]
          .sort((a, b) => b.fitness - a.fitness)
          .filter(
            (player, index, self) =>
              index === self.findIndex((p) => p.id === player.id),
          )
          .slice(0, 5);
        return newTop;
      });
    }
  }

  // Update players alive count
  updatePlayersAlive(count: number): void {
    this.playersAliveSetter?.(count);
  }

  // Update furthest platform
  updateFurthestPlatform(platform: number): void {
    this.sessionStatsSetter?.((prev) => ({
      ...prev,
      furthestPlatform: Math.max(prev.furthestPlatform, platform),
    }));
  }

  // Increment mob kills
  incrementMobKills(): void {
    this.sessionStatsSetter?.((prev) => ({
      ...prev,
      totalMobsKilled: prev.totalMobsKilled + 1,
    }));
  }

  // Increment items collected
  incrementItemsCollected(): void {
    this.sessionStatsSetter?.((prev) => ({
      ...prev,
      totalItemsCollected: prev.totalItemsCollected + 1,
    }));
  }

  // Set game paused state
  setGamePaused(paused: boolean): void {
    this.isGamePausedSetter?.(paused);
  }
}

export const gameStateBridge = GameStateBridge.getInstance();
