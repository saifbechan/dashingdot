import GeneticAlgorithm from './World/GeneticAlgorithm';
import InnovationManager from './World/InnovationManager';
import PlatformManager from './World/PlatformManager';
import Brain from './World/Player/Brain/Brain';
import PlayerManager from './World/PlayerManager';

export type PlayerDataType = {
  brain: Brain;
  fitness: number;
  alive: number;
  steps: number;
  totalJumps: number;
  nodes: number;
  connections: number;
};

export type PlayGameDataType = {
  generation: number;
  playerData: PlayerDataType[];
  innovationManager: InnovationManager;
};

export type PlayGameSceneType = Phaser.Scene & {
  generation: number;
  geneticAlgorithm: GeneticAlgorithm;
  playerManager: PlayerManager;
  platformManager: PlatformManager;
};

export type InnovationsType = { [key: string]: number };
