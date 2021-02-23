import GeneticAlgorithm from './World/GeneticAlgorithm';
import InnovationManager from './World/InnovationManager';
import PlatformManager from './World/PlatformManager';
import Brain from './World/Player/Brain/Brain';
import PlayerManager from './World/PlayerManager';

export type PlayGameDataType = {
  generation: number;
  brains: Brain[];
  innovationManager: InnovationManager;
};

export type PlayGameSceneType = Phaser.Scene & {
  generation: number;
  geneticAlgorithm: GeneticAlgorithm;
  playerManager: PlayerManager;
  platformManager: PlatformManager;
};

export type InnovationsType = { [key: string]: number };
