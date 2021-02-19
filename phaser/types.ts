import PlatformManager from './World/PlatformManager';
import Brain from './World/Player/Brain';
import PlayerManager from './World/PlayerManager';

export type PlayGameDataType = {
  generation: number;
  brains: Brain[];
};

export type PlayGameSceneType = Phaser.Scene & {
  generation: number;
  playerManager: PlayerManager;
  platformManager: PlatformManager;
};
