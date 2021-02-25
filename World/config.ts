import Scene from './Scene';

const config = {
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
    scene: Scene,
  },

  playerCount: 50,
  platformStartSpeed: 350,
  spawnRange: [100, 200],
  platformSizeRange: [150, 300],
  playerGravity: 900,
  jumpForce: 400,
  playerStartPosition: 200,
  allowedJumps: 1,

  layers: {
    inputs: 11,
    hidden: 8,
    outputs: 2,
  },

  mutation: {
    rate: 0.1,
  },
};

export default config;
