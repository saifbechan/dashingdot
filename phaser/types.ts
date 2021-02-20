import PlatformManager from './World/PlatformManager';
import Brain from './World/Player/Brain';
import PlayerManager from './World/PlayerManager';
import { nodeType } from './contants';

export type PlayGameDataType = {
  generation: number;
  brains: Brain[];
};

export type PlayGameSceneType = Phaser.Scene & {
  generation: number;
  playerManager: PlayerManager;
  platformManager: PlatformManager;
};

export type NodeType = {
  number: number;
  type: nodeType;
};

export type ConnectionType = {
  index: number;
  nbInputs: number;
  nbOutputs: number;
  disabled: boolean;
  weight: number;
};
