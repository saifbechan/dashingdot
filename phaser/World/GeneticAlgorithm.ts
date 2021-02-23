import config from '../config';
import InnovationManager from './InnovationManager';
import Brain from './Player/Brain/Brain';

export default class GeneticAlgorithm {
  private readonly populationSize: number;
  private readonly currentPopulation: Brain[];
  private readonly innovationManager: InnovationManager;

  constructor(
    populationSize: number,
    currentPopulation: Brain[],
    innovationManager: InnovationManager
  ) {
    this.populationSize = populationSize;
    this.innovationManager = innovationManager;

    if (currentPopulation.length === 0) {
      this.currentPopulation = this.populate();
    } else {
      this.currentPopulation = this.evolve(currentPopulation);
    }
  }

  private populate = (): Brain[] =>
    [...Array(this.populationSize)].map(() => new Brain(this.innovationManager));

  private evolve = (brains: Brain[]): Brain[] => {
    const evaluatedBrains = this.evaluate(brains);
    const selectedBrains = this.select(evaluatedBrains);
    const reproducedBrains = this.reproduce(selectedBrains);
    const repopulatedBrains = this.repopulate(reproducedBrains);

    const stats = { nodes: 0, connections: 0 };
    repopulatedBrains.map((brain) => {
      stats.nodes += brain.getNodes().length;
      stats.connections += brain.getConnections().length;
    });
    console.log(stats);

    return repopulatedBrains;
  };

  private evaluate = (brains: Brain[]): Brain[] =>
    brains.sort((brainX: Brain, brainY: Brain) => brainY.getFitness() - brainX.getFitness());

  private select = (
    brains: Brain[],
    survivalRate: number = config.genetics.survivalRate
  ): Brain[] => {
    const nbToKeep = Math.ceil(this.populationSize * survivalRate);
    return brains.filter((brain, index) => {
      if (index < nbToKeep) {
        return true;
      }
      brain.dispose();
    });
  };

  private reproduce = (brains: Brain[]): Brain[] => {
    const children = [];
    for (let i = 0; i < brains.length; i++) {
      for (let j = i + 1; j < brains.length; j++) {
        children.push(brains[i].crossover(brains[j]).mutate());
      }
    }
    return [...brains, ...children];
  };

  private repopulate = (brains: Brain[]): Brain[] => {
    if (brains.length > this.populationSize) {
      return brains;
    }
    const newBrains = Array(this.populationSize - brains.length)
      .fill('')
      .map(() => new Brain(this.innovationManager));
    return [...brains, ...newBrains];
  };

  getCurrentPopulation = (): Brain[] => this.currentPopulation;

  private speciate = (species: Brain[][], brains: Brain[], threshold = 1): Brain[][] => {
    const speciesRepresentation = species.map(
      (specie: Brain[]) => specie[Math.floor(Math.random() * species.length)]
    );
    const newSpecies: Brain[][] = new Array(speciesRepresentation.length).fill([]) as Brain[][];
    brains.forEach((brain: Brain) => {
      speciesRepresentation.forEach((specieBrain: Brain, index: number) => {
        if (brain.distance(specieBrain) <= threshold) {
          newSpecies[index].push(brain);
          return;
        }
        if (speciesRepresentation.length === index + 1) {
          newSpecies.push([brain]);
        }
      });
    });

    return newSpecies.filter((s) => s.length > 0);
  };
}
