import Phaser from 'phaser';

export default class Scene extends Phaser.Scene {
  private platforms: Phaser.Physics.Arcade.StaticGroup | undefined;
  private ball: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;

  constructor() {
    super('PlayGame');
  }

  preload = (): void => {
    this.load.image('ball', 'https://i.imgur.com/8RJgZAm.png');
    this.load.image('platform', 'https://i.imgur.com/IBO15YD.png');
  };

  create = (): void => {
    this.ball = this.physics.add.sprite(50, 50, 'ball');
    this.ball.setBounce(0);
    this.ball.setCollideWorldBounds(true);

    this.platforms = this.physics.add.staticGroup() as Phaser.Physics.Arcade.StaticGroup;
    this.platforms.create(400, 568, 'platform').setScale(2).refreshBody();

    this.physics.add.collider(this.ball, this.platforms);

    this.input.keyboard.on('keydown-SPACE', () => {
      if (this.ball?.body.touching.down) {
        this.ball?.setVelocityY(-300);
      }
    });
  };

  update = (): void => {
    if (!this.ball) return;

    this.ball.rotation += this.ball.body.velocity.x / 500;
  };
}
