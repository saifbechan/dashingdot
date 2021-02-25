import { EvolveableType } from './NeuroEvolution/types';
import PlatformManager from './World/PlatformManager';

export type PlayGameDataType = {
  generation: number;
  playersData: EvolveableType[];
};

export type PlayGameSceneType = Phaser.Scene & {
  platformManager: PlatformManager;
};
