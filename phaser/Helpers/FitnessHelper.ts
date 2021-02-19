import { PlayerDataType } from './Types';

export default class FitnessHelper {
  static getMaxFitness = (players: PlayerDataType[]): number => {
    let maxFitness = 0;
    players.forEach(({ fitness: { total } }) => {
      maxFitness = Math.max(maxFitness, Math.floor(total));
    });
    return maxFitness;
  };

  static normalizePlayersFitness = (
    players: PlayerDataType[],
    maxFitness: number
  ): PlayerDataType[] =>
    players.map((player) => ({
      ...player,
      fitness: {
        ...player.fitness,
        normalized: Math.floor((Math.floor(player.fitness.total) / maxFitness) * 10),
      },
    }));
}
