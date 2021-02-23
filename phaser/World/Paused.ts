import Phaser from 'phaser';

export default class Paused extends Phaser.Scene {
  constructor() {
    super('Paused');
  }

  create = (): void => {
    this.scene.pause('Paused');
    this.input.keyboard.on('keydown-P', () => {
      this.scene.pause('Paused');
      this.scene.resume('PlayGame');
    });
  };
}
