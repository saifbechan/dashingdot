const config = {
  players: 100,
  platformStartSpeed: 350,
  spawnRange: [50, 150],
  platformSizeRange: [200, 300],
  playerGravity: 900,
  jumpForce: 400,
  playerStartPosition: 200,
  jumps: 1,

  layers: {
    inputs: 7,
    hidden: 4,
    outputs: 2,
  },

  mutation: {
    rate: 0.4,
  },
};

export default config;
