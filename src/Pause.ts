import Phaser from 'phaser';

export default class Pause extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create = (): void => {
    this.scene.pause('Pause');
    this.input?.keyboard?.on('keydown-P', () => {
      this.scene.pause('Pause');
      this.scene.resume('Play');
    });
  };
}
