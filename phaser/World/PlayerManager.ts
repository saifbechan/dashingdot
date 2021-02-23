import Phaser from 'phaser';

import { PlayerDataType, PlayGameSceneType } from '../types';
import Player from './Player/Player';

export default class PlayerManager extends Phaser.GameObjects.Group {
  private readonly playerData: PlayerDataType[] = [];

  constructor(scene: Phaser.Scene) {
    super(scene);

    (scene as PlayGameSceneType).geneticAlgorithm
      .getCurrentPopulation()
      .forEach((brain) => this.add(new Player(this.scene, 50, this.scene.scale.height / 2, brain)));
  }

  update = (): void => {
    this.getChildren().forEach((child: Phaser.GameObjects.GameObject, index: number) => {
      const player = child as Player;

      player.setTransparency(index === 0 ? 1 : 0.3);

      if (player.y < this.scene.scale.height - 50) return;

      this.playerData.push(player.getPlayerData());

      this.killAndHide(player);
      this.remove(player, true, true);
    });
  };

  getPlayerData = (): PlayerDataType[] => this.playerData;
}
