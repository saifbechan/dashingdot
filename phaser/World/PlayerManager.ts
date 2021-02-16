import Phaser from 'phaser';

import Player from '../Entities/Player';

export default class PlayerManager extends Phaser.GameObjects.Group {
  constructor(scene: Phaser.Scene, count: number) {
    super(scene);

    for (let index = 0; index < count; index++) {
      this.add(new Player(scene, 50, window.innerHeight / 2));
    }
  }

  update(): void {
    this.getChildren().forEach((player: any) => {
      player.setTransparency(this.countActive());

      if (player.isAlive() === false) {
        this.killAndHide(player);
        this.remove(player);
      }
    });
  }
}
