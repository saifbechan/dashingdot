import { Sequential } from '@tensorflow/tfjs';

import PlatformManager from '../World/PlatformManager';

export type PlayGameDataType = {
  players: PlayerDataType[];
  highscore: number;
};

export type PlayGameSceneType = Phaser.Scene & {
  platformManager: PlatformManager;
};

export type PlayerDataType = {
  brain: Sequential;
  fitness: number;
  normalized: number;
};
