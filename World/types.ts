import { EvolveableType } from './NeuroEvolution/types';
import PlatformManager from './World/PlatformManager';

export type PlayDataType = {
  generation: number;
  playersData: EvolveableType[];
};

export type PlaySceneType = Phaser.Scene & {
  platformManager: PlatformManager;
};
