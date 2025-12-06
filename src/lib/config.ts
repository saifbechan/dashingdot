import Pause from '@/Pause';
import Play from '@/Play';
import { v4 as uuidv4 } from 'uuid';
import {
  type AnimationsNames,
  type MobNames,
  type PlayerNames,
} from './constants';

const game: Phaser.Types.Core.GameConfig = {
  backgroundColor: '#ccc',
  type: Phaser.CANVAS,
  scale: {
    mode: Phaser.Scale.FIT,
    parent: undefined,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    height: 1024,
    width: 1366,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  fps: { min: 20, target: 30 },
  scene: [Play, Pause],
  seed: [uuidv4()],
};

const players: {
  animations: Record<AnimationsNames, number[]>;
  offset: Record<PlayerNames, number>;
} = {
  animations: {
    fly: [0, 1, 2, 3],
    walk: [0, 1, 2, 3, 4, 5, 6, 7],
    jump: [0, 1, 2],
  },
  offset: { punk: 50, champ: 32 },
};

const mobs: {
  animations: { [AnimationsNames.FLY]: number[] };
  offset: Record<MobNames, number>;
} = {
  animations: { fly: [0, 1, 2, 3] },
  offset: { crusher: 0 },
};

const config = {
  playerCount: 50,

  platformStartSpeed: 350,
  platformSpeedThreshold: 500,

  gravity: 900,

  spawnRange: [100, 200],
  platformSizeRange: [150, 300],
  jumpForce: 400,
  playerStartPosition: 200,
  allowedJumps: 1,
  showGuides: false,

  guides: [[230, 400, 5]],

  model: {
    inputs: 8003,
    hidden: 10,
    outputs: 2,
  },

  evolution: {
    survivalRate: 0.1,
    mutationRate: 0.5,
  },

  game,

  players,

  mobs,
};

export default config;
