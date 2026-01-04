import Pause from '@/Scenes/Pause';
import Play from '@/Scenes/Play';
import { v4 as uuidv4 } from 'uuid';
import { type AnimationsNames, MobNames, PlayerNames } from './constants';
import backgroundConfig from './sprite-configs/background-config.json';
import itemConfig from './sprite-configs/item-config.json';
import mobConfig from './sprite-configs/mob-config.json';
import playerConfig from './sprite-configs/player-config.json';
import projectileConfig from './sprite-configs/projectile-config.json';

const playerNames = Object.values(PlayerNames);
const mobNames = Object.values(MobNames);

const randomBackground =
  backgroundConfig[Math.floor(Math.random() * backgroundConfig.length)];
const randomMob = mobNames[Math.floor(Math.random() * mobNames.length)];
const randomPlayer =
  playerNames[Math.floor(Math.random() * playerNames.length)];

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
  pixelArt: true,
};

const players: {
  animations: Record<AnimationsNames, number[]>;
  offset: Record<PlayerNames, number>;
} = {
  animations: {
    fly: [0, 1, 2, 3], // fallback
    walk: [0, 1, 2, 3, 4, 5, 6, 7], // fallback
    jump: [0, 1, 2],
  },
  offset: Object.fromEntries(
    Object.values(PlayerNames).map((name) => [name, 0]),
  ) as Record<PlayerNames, number>,
};

const mobs: {
  animations: { [AnimationsNames.FLY]: number[] };
  offset: Record<MobNames, number>;
} = {
  animations: { fly: [0, 1, 2, 3] }, // fallback
  offset: Object.fromEntries(
    Object.values(MobNames).map((name) => [name, 0]),
  ) as Record<MobNames, number>,
};

const config = {
  selectedPlayer: randomPlayer,
  selectedMob: randomMob,
  selectedBackground: randomBackground,
  playerConfig,
  mobConfig,
  itemConfig,
  projectileConfig,
  backgroundConfig,
  playerCount: 160,

  platformStartSpeed: 350,
  platformSpeedThreshold: 500,

  gravity: 900,

  spawnRange: [100, 200],
  platformSizeRange: [150, 300],
  jumpForce: 400,
  playerStartPosition: 200,
  allowedJumps: 1,
  showGuides: false,

  model: {
    inputs: 51, // 17 features * 3 frames history
    hidden: 24,
    outputs: 2,
  },

  evolution: {
    survivalRate: 0.1,
    mutationRate: 0.1, // Lower mutation rate for larger stable brains
  },

  game,

  players,

  mobs,
};

export default config;
