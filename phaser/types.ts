import GeneticAlgorithm from './World/GeneticAlgorithm';
import PlatformManager from './World/PlatformManager';
import Brain from './World/Player/Brain/Brain';
import PlayerManager from './World/PlayerManager';
import { nodeType } from './contants';

export type PlayGameDataType = {
  generation: number;
  brains: Brain[];
  innovations: InnovationsType;
};

export type PlayGameSceneType = Phaser.Scene & {
  generation: number;
  geneticAlgorithm: GeneticAlgorithm;
  playerManager: PlayerManager;
  platformManager: PlatformManager;
};

export type NodeType = {
  number: number;
  type: nodeType;
};

export type InnovationNumberGeneratorType = (inputNode: number, outputNode: number) => number;

export type InnovationsType = { [key: string]: number };
