import Phaser from 'phaser';

import config from '../config';
import Brain from './Player/Brain';
import Player from './Player/Player';

export default class GeneticAlgorithm extends Phaser.GameObjects.Group {
  private innovations = {};

  protected readonly species: Brain[][] = [[]];
  protected readonly brains: Brain[] = [];

  populate = (players: number): void => {
    this.addMultiple(
      [...Array(players)].map(
        () => new Player(this.scene, 50, this.scene.scale.height / 2, new Brain())
      )
    );
  };

  evolve = (brains: Brain[]): void => {
    const evaluatedBrains = this.evaluate(brains);
    const selectedBrains = this.select(evaluatedBrains);

    this.addMultiple(
      this.reproduce(selectedBrains).map(
        (brain) => new Player(this.scene, 50, this.scene.scale.height / 2, brain)
      )
    );
  };

  evaluate = (brains: Brain[]): Brain[] =>
    brains.sort((brainX: Brain, brainY: Brain) => brainY.getFitness() - brainX.getFitness());

  select = (brains: Brain[], survivalRate: number = config.genetics.survivalRate): Brain[] =>
    brains.slice(0, Math.ceil(brains.length * survivalRate));

  reproduce = (brains: Brain[]): Brain[] => {
    const children = [];
    for (let i = 0; i < brains.length; i++) {
      for (let j = i + 1; j < brains.length; j++) {
        children.push(brains[i].crossover(brains[j]).mutate());
      }
    }
    return [...this.brains, ...children];
  };

  getInnovationNumber = (): number => Object.values(this.innovations).length;

  speciate = (species: Brain[][], brains: Brain[], threshold = 1): Brain[][] => {
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
