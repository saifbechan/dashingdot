import Phaser from 'phaser';

import Player from './Entities/Player';
import config from './config';

export default class Scene extends Phaser.Scene {
  private platformGroup: Phaser.GameObjects.Group | undefined;
  private platformPool: Phaser.GameObjects.Group | undefined;

  private nextPlatformDistance = 0;

  constructor() {
    super('PlayGame');
  }

  preload = (): void => {
    this.load.image('back', 'images/backgrounds/purple/back.png');
    this.load.image('front', 'images/backgrounds/purple/front.png');
    this.load.image('platform', 'images/platforms/tile-purple.png');
    this.load.spritesheet('player', 'images/players/punk.png', {
      frameWidth: 75,
      frameHeight: 75,
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

    this.addPlatform(window.innerWidth, window.innerHeight / 2);

    const player = this.physics.add.existing(new Player(this, 50, window.innerHeight / 2));

    this.physics.add.collider(player, this.platformGroup);
  };

  update = (): void => {
    if (!this.platformGroup) return;

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
}
