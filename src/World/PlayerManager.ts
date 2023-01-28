import { PlayDataType } from '../Play';
import { Sequential } from '@tensorflow/tfjs';
import {
  crossover,
  evaluate,
  mutate,
  populate,
  repopulate,
  select,
  speciate,
} from '../NeuroEvolution/GeneticAlgorithm';
import Player, { EvolveableType } from './Player';
import config from '../../lib/config';

export default class PlayerManager extends Phaser.GameObjects.Group {
  private readonly playersData: EvolveableType[] = [];

  constructor(scene: Phaser.Scene, playersData: EvolveableType[]) {
    super(scene);

    if (playersData.length === 0) {
      populate(config.playerCount).forEach((brain: Sequential) => {
        this.add(new Player(scene, 50, scene.scale.height / 2, brain));
      });
    } else {
      const evaluated = evaluate(playersData);

      const selected = select(evaluated);

      const speciated = speciate(playersData);
      const crossed = crossover(speciated);
      const mutated = mutate(crossed);

      repopulate(config.playerCount, [...selected, ...mutated]).forEach(
        (brain: Sequential) => {
          this.add(new Player(scene, 200, scene.scale.height / 2, brain));
        }
      );

      playersData.forEach(({ network }) => network.dispose());
    }
  }

  update = (): void => {
    this.getChildren().forEach(
      (child: Phaser.GameObjects.GameObject, index: number) => {
        const player = child as Player;

        player.setTransparency(index > 0 ? 0.3 : 1);

        if (player.y < this.scene.scale.height - 50) return;

        this.playersData.push(player.getPlayersData());

        this.killAndHide(player);
        this.remove(player, true, true);
      }
    );
  };

  getPlayersData = (): PlayDataType =>
    <PlayDataType>{
      playersData: this.playersData,
    };
}
