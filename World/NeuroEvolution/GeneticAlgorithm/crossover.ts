import config from '../../config';
import { EvolveableType } from '../types';

const crossover = (population: EvolveableType[]): EvolveableType[] =>
  population.filter((_: EvolveableType, index: number) => {
    if (index < config.evolution.crossoverRate * config.playerCount) {
      return true;
    }
  });

export default crossover;
