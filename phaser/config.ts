const config = {
  players: 50,
  platformStartSpeed: 350,
  spawnRange: [75, 150],
  platformSizeRange: [300, 400],
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
    rate: 0.1,
  },
};

export default config;
