import Phaser from 'phaser';

export default class Scene extends Phaser.Scene {
  private ball: Phaser.GameObjects.Sprite | undefined;

  constructor() {
    super('PlayGame');
  }

  preload = (): void => {
    this.load.image('ball', 'https://i.imgur.com/8RJgZAm.png');
  };

  create = (): void => {
    this.ball = this.add.sprite(50, 50, 'ball');

    this.physics.world.enableBody(this.ball);

    this.ball.body.velocity.x = 100;
    this.ball.body.velocity.y = 100;

    if (!(this.ball.body instanceof Phaser.Physics.Arcade.Body)) return;

    this.ball.body.collideWorldBounds = true;
    this.ball.body.bounce.set(1);
  };

  update = (): void => {
    if (!this.ball) return;

    this.ball.rotation += this.ball.body.velocity.x / 500;
  };
}
