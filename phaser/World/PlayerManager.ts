import { Sequential } from '@tensorflow/tfjs';
import Phaser from 'phaser';

import Player from '../Entities/Player';
import BrainHelper from '../Helpers/BrainHelper';
import FitnessHelper from '../Helpers/FitnessHelper';
import { PlayerDataType, PlayGameDataType } from '../Helpers/Types';
import config from '../config';

export default class PlayerManager extends Phaser.GameObjects.Group {
  private readonly players: PlayerDataType[] = [];

  private highscore = 0;

  constructor(scene: Phaser.Scene, players: PlayerDataType[]) {
    super(scene);
    const brains: Sequential[] = [];
    players.forEach(({ normalized, brain }: PlayerDataType) => {
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
  }

  update = (): void => {
    this.getChildren().forEach((child) => {
      const player = child as Player;
      if (player.y > window.innerHeight - 50) {
        this.players.push({
          brain: player.getBrain(),
          fitness: player.getFitness(),
          normalized: 0,
        });
        this.killAndHide(player);
        this.remove(player, true, true);
      }
      this.highscore = Math.max(this.highscore, player.getFitness());
    });
  };

  getData = (): PlayGameDataType => ({
    players: FitnessHelper.normalizePlayersFitness(this.players, this.highscore),
    highscore: this.highscore,
  });
}
