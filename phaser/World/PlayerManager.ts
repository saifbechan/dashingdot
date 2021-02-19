import { Sequential } from '@tensorflow/tfjs';
import Phaser from 'phaser';

import Player from '../Entities/Player';
import BrainHelper from '../Helpers/BrainHelper';
import FitnessHelper from '../Helpers/FitnessHelper';
import { PlayerDataType, PlayGameDataType, PlayGameSceneType } from '../Helpers/Types';
import config from '../config';

export default class PlayerManager extends Phaser.GameObjects.Group {
  private readonly players: PlayerDataType[] = [];

  constructor(scene: Phaser.Scene, players: PlayerDataType[]) {
    super(scene);

    const scores: number[] = [];

    const brains: Sequential[] = [];
    players.forEach(({ fitness: { normalized }, brain }: PlayerDataType) => {
      if (scores[normalized]) {
        scores[normalized] = scores[normalized] += 1;
        return;
      }

      scores[normalized] = 1;
      for (let index = 0; index < normalized; index += 1) {
        brains.push(BrainHelper.copy(brain));
      }
    });
    for (let index = 0; index < config.players; index++) {
      const brain = BrainHelper.create(brains);
      this.add(new Player(scene, 50, window.innerHeight / 2, brain));
    }
    players.forEach(({ brain }) => brain.dispose());
    brains.forEach((brain) => brain.dispose());

    console.table([...scores, brains.length]);
  }

  update = (): void => {
    this.getChildren().forEach((child: Phaser.GameObjects.GameObject, index: number) => {
      const player = child as Player;
      if (index === 0) {
        player.logStats(this.scene as PlayGameSceneType);
      }
      if (player.y > window.innerHeight - 50) {
        this.players.push({
          brain: player.getBrain(),
          fitness: {
            total: player.getFitness(),
            normalized: 0,
          },
        });
        this.killAndHide(player);
        this.remove(player, true, true);
      }
    });
  };

  getData = (): PlayGameDataType => {
    const maxFitness = FitnessHelper.getMaxFitness(this.players);
    const players = FitnessHelper.normalizePlayersFitness(this.players, maxFitness);

    return {
      players,
      maxFitness,
    };
  };
}
