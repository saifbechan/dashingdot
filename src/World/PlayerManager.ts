import config from '@/lib/config';
import { EffectNames, ProjectileNames } from '@/lib/constants';
import { type Sequential } from '@tensorflow/tfjs';
import {
  crossover,
  evaluate,
  mutate,
  populate,
  repopulate,
  select,
  speciate,
} from '../NeuroEvolution/GeneticAlgorithm';
import { type PlayDataType } from '../Scenes/Play';
import type EffectManager from './EffectManager';
import Player, { type EvolveableType } from './Player';

export default class PlayerManager extends Phaser.GameObjects.Group {
  private readonly playersData: EvolveableType[] = [];
  private effectManager: EffectManager;

  constructor(
    scene: Phaser.Scene,
    playersData: EvolveableType[],
    effectManager: EffectManager,
  ) {
    super(scene);
    this.effectManager = effectManager;

    if (playersData.length === 0) {
      populate(config.playerCount).forEach((brain: Sequential) => {
        const projectileNames = Object.values(ProjectileNames);
        const randomProjectile =
          projectileNames[Math.floor(Math.random() * projectileNames.length)];

        this.add(
          new Player(
            scene,
            50,
            scene.scale.height / 2,
            brain,
            config.selectedPlayer,
            randomProjectile,
          ),
        );
      });
    } else {
      const evaluated = evaluate(playersData);

      const selected = select(evaluated);

      const speciated = speciate(playersData);
      const crossed = crossover(speciated);
      const mutated = mutate(crossed);

      repopulate(config.playerCount, [...selected, ...mutated]).forEach(
        (brain: Sequential) => {
          const projectileNames = Object.values(ProjectileNames);
          const randomProjectile =
            projectileNames[Math.floor(Math.random() * projectileNames.length)];

          this.add(
            new Player(
              scene,
              200,
              scene.scale.height / 2,
              brain,
              config.selectedPlayer,
              randomProjectile,
            ),
          );
        },
      );

      playersData.forEach(({ network }) => network.dispose());
    }
  }

  public killPlayer(player: Player, effectName: EffectNames): void {
    // Play requested effect using EffectManager
    if (effectName === EffectNames.CLOUD) {
      this.effectManager.playEffect(player.x, player.y + 30, effectName);
    } else {
      this.effectManager.playEffect(player.x, player.y, effectName);
    }

    this.playersData.push(player.getPlayersData());

    this.killAndHide(player);
    this.remove(player, true, true);
  }

  update = (): void => {
    this.getChildren().forEach(
      (child: Phaser.GameObjects.GameObject, index: number) => {
        const player = child as Player;

        player.setTransparency(index > 0 ? 0.3 : 1);

        if (player.y >= this.scene.scale.height - 50) {
          this.killPlayer(player, EffectNames.CLOUD);
        }
      },
    );
  };

  getPlayersData = (): PlayDataType =>
    ({
      playersData: this.playersData,
    }) as PlayDataType;
}
