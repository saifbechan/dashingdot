import { atom } from 'jotai';

/**
 * Game State Store
 *
 * Centralized state management for sharing data between
 * Phaser game engine and React UI using Jotai atoms.
 */

// Species data type
export interface SpeciesData {
  id: number;
  name: string;
  members: number;
  avgFitness: number;
  bestFitness: number;
  stagnation: number;
  momentum: 'up' | 'down' | 'flat';
  bornGen: number;
  avgNodes: number;
  avgConnections: number;
}

// Generation statistics
export interface GenerationStats {
  generation: number;
  speciesCount: number;
  population: number;
  bestFitness: number;
  bestFitnessDelta?: number;
  avgFitness: number;
  avgFitnessDelta?: number;
  avgComplexity: number;
  species: SpeciesData[];
}

// Current game session stats
export interface SessionStats {
  startTime: number;
  totalGenerations: number;
  peakFitness: number;
  furthestPlatform: number;
  totalMobsKilled: number;
  totalItemsCollected: number;
}

// Real-time player stats (top performer)
export interface TopPlayerStats {
  id: string;
  speciesName: string;
  fitness: number;
  timeAlive: number;
  mobsKilled: number;
  itemsCollected: number;
  ammo: number;
}

// Generation history for chart
export interface GenerationHistoryPoint {
  generation: number;
  bestFitness: number;
  avgFitness: number;
  speciesCount: number;
}

// Atoms
export const generationStatsAtom = atom<GenerationStats>({
  generation: 1,
  speciesCount: 0,
  population: 0,
  bestFitness: 0,
  bestFitnessDelta: 0,
  avgFitness: 0,
  avgFitnessDelta: 0,
  avgComplexity: 0,
  species: [],
});

export const allTimeChampionsAtom = atom<TopPlayerStats[]>([]);

export const sessionStatsAtom = atom<SessionStats>({
  startTime: Date.now(),
  totalGenerations: 0,
  peakFitness: 0,
  furthestPlatform: 0,
  totalMobsKilled: 0,
  totalItemsCollected: 0,
});

export const topPlayerStatsAtom = atom<TopPlayerStats | null>(null);

export const generationHistoryAtom = atom<GenerationHistoryPoint[]>([]);

export const isGamePausedAtom = atom<boolean>(false);

export const playersAliveAtom = atom<number>(0);
