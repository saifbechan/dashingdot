import Pause from './Pause';
import Play from './Play';

const config = {
  playerCount: 50,
  platformStartSpeed: 350,
  spawnRange: [100, 200],
  platformSizeRange: [150, 300],
  playerGravity: 900,
  jumpForce: 400,
  playerStartPosition: 200,
  allowedJumps: 1,

  model: {
    inputs: 11,
    hidden: 8,
    outputs: 2,
  },

  evolution: {
    survivalRate: 0.2, // goes untouched to the next generation
    crossoverRate: 0.4, // will create children
    mutationRate: 0.1, // how often do we mutate weights
  },

  game: {
    backgroundColor: '#ccc',
    type: Phaser.AUTO,
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
  },
};

export default config;
