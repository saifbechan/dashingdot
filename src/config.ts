import { v4 as uuidv4 } from 'uuid';
import Pause from './Pause';
import Play from './Play';

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

const config = {
  playerCount: 50,

  platformStartSpeed: 350,
  platformSpeedThreshold: 500,

  spawnRange: [100, 200],
  platformSizeRange: [150, 300],
  playerGravity: 900,
  jumpForce: 400,
  playerStartPosition: 200,
  allowedJumps: 1,
  showGuides: false,

  model: {
    inputs: 16003,
    hidden: 10,
    outputs: 2,
  },

  evolution: {
    survivalRate: 0.1,
    mutationRate: 0.01,
  },

  game,
};

export default config;
