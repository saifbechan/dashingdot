import { PlayerDataType } from './Types';

export default class FitnessHelper {
  static normalizePlayersFitness = (
    players: PlayerDataType[],
    highscore: number
  ): PlayerDataType[] =>
    players.map((player) => ({
      ...player,
      normalized: Math.floor((player.fitness / highscore) * 10),
    }));
}
