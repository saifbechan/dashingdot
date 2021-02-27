import config from '../../config';
import { EvolveableType } from '../types';

const select = (population: EvolveableType[]): EvolveableType[] =>
  population.filter((_: EvolveableType, index: number) => {
    if (index < config.evolution.survivalRate * config.playerCount) {
      return true;
    }
  });

export default select;
