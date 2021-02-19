const config = {
  players: 50,
  platformStartSpeed: 350,
  spawnRange: [75, 150],
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
