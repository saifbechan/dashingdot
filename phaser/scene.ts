import Phaser from 'phaser';

import config from './config';

export default class Scene extends Phaser.Scene {
  private player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | undefined;
  private platformGroup: Phaser.GameObjects.Group | undefined;
  private platformPool: Phaser.GameObjects.Group | undefined;
  private playerJumps = 0;
  private nextPlatformDistance = 0;

  constructor() {
    super('PlayGame');
  }

  preload = (): void => {
    this.load.image('back', 'images/backgrounds/purple/back.png');
    this.load.image('front', 'images/backgrounds/purple/front.png');
    this.load.image('platform', 'images/platforms/tile-purple.png');
    this.load.spritesheet('player', 'images/players/punk.png', {
      frameWidth: 59,
      frameHeight: 61,
    });
  };

  create = (): void => {
    const width = this.scale.width;
    const height = this.scale.height;

    this.add.image(width * 0.5, height * 0.5, 'back').setScrollFactor(0);
    this.add.image(width * 0.5, height * 0.5, 'front').setScrollFactor(0.25);

    this.platformGroup = this.add.group({
      removeCallback: (platform: any) => {
        platform.scene.platformPool.add(platform);
      },
    });

    this.platformPool = this.add.group({
      removeCallback: (platform: any) => {
        platform.scene.platformGroup.add(platform);
      },
    });

    this.playerJumps = 0;

    this.addPlatform(window.innerWidth, window.innerHeight / 2);

    this.player = this.physics.add.sprite(50, 200, 'player');
    this.player.setGravityY(config.playerGravity);
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 7 }),
      frameRate: 32,
      repeat: -1,
    });

    this.physics.add.collider(this.player, this.platformGroup);

    this.input.keyboard.on('keydown-SPACE', this.jump, this);
  };

  update = (): void => {
    if (!this.player || !this.platformGroup) return;

    if (this.player.body.touching.down) {
      this.player.anims.play('walk', true);
    } else {
      this.player.anims.stop();
    }

    if (this.player.y > window.innerHeight) {
      this.scene.start('PlayGame');
    }
    this.player.x = config.playerStartPosition;

    let minDistance = window.innerWidth;
    this.platformGroup.getChildren().forEach((platform: any) => {
      if (!this.platformGroup) return;

      const platformDistance = window.innerWidth - platform.x - platform.displayWidth / 2;
      minDistance = Math.min(minDistance, platformDistance);
      if (platform.x < -platform.displayWidth / 2) {
        this.platformGroup.killAndHide(platform);
        this.platformGroup.remove(platform);
      }
    }, this);

    if (minDistance > this.nextPlatformDistance) {
      const nextPlatformWidth = Phaser.Math.Between(
        config.platformSizeRange[0],
        config.platformSizeRange[1]
      );
      this.addPlatform(nextPlatformWidth, window.innerWidth + nextPlatformWidth / 2);
    }
  };

  private addPlatform(platformWidth: number, posX: number): void {
    if (!this.platformPool || !this.platformGroup) return;

    let platform;
    if (this.platformPool.getLength()) {
      platform = this.platformPool.getFirst();
      platform.x = posX;
      platform.active = true;
      platform.visible = true;
      this.platformPool.remove(platform);
    } else {
      platform = this.physics.add
        .sprite(posX, window.innerHeight * 0.8, 'platform')
        .setScale(0.5)
        .refreshBody();
      platform.setImmovable(true);
      platform.setVelocityX(config.platformStartSpeed * -1);
      this.platformGroup.add(platform);
    }
    platform.displayWidth = platformWidth;
    this.nextPlatformDistance = Phaser.Math.Between(config.spawnRange[0], config.spawnRange[1]);
  }

  private jump(): void {
    if (!this.player) return;

    if (
      this.player.body.touching.down ||
      (this.playerJumps > 0 && this.playerJumps < config.jumps)
    ) {
      if (this.player.body.touching.down) {
        this.playerJumps = 0;
      }
      this.player.setVelocityY(config.jumpForce * -1);
      this.playerJumps++;
    }
  }
}
