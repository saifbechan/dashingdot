import { EvolveableType } from '../types';

// Currently evaluation is just sorting the population from highest to lowest fitness
const evaluate = (population: EvolveableType[]): EvolveableType[] =>
  population.sort(
    (networkX: EvolveableType, networkY: EvolveableType) => networkX.fitness - networkY.fitness
  );

export default evaluate;
