import Phaser from 'phaser';

import config from '../config';

export default class PlatformManager {
  private scene: Phaser.Scene;

  private readonly group: Phaser.GameObjects.Group;
  private readonly pool: Phaser.GameObjects.Group;

  private nextPlatformDistance = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.group = scene.add.group({
      removeCallback: (platform: any) => {
        platform.scene.platformManager.addToPool(platform);
      },
    });

    this.pool = scene.add.group({
      removeCallback: (platform: any) => {
        platform.scene.platformManager.addToGroup(platform);
      },
    });

    this.addPlatform(window.innerWidth, window.innerHeight / 2);
  }

  addToPool(platform: Phaser.GameObjects.GameObject): void {
    this.pool.add(platform);
  }

  addToGroup(platform: Phaser.GameObjects.GameObject): void {
    this.group.add(platform);
  }

  update(): void {
    let minDistance = window.innerWidth;
    this.group.getChildren().forEach((platform: any) => {
      if (!this.group) return;

      const platformDistance = window.innerWidth - platform.x - platform.displayWidth / 2;
      minDistance = Math.min(minDistance, platformDistance);
      if (platform.x < -platform.displayWidth / 2) {
        this.group.killAndHide(platform);
        this.group.remove(platform);
      }
    }, this);

    if (minDistance > this.nextPlatformDistance) {
      const nextPlatformWidth = Phaser.Math.Between(
        config.platformSizeRange[0],
        config.platformSizeRange[1]
      );
      this.addPlatform(nextPlatformWidth, window.innerWidth + nextPlatformWidth / 2);
    }
  }

  private addPlatform(platformWidth: number, posX: number): void {
    let platform;
    if (this.pool.getLength()) {
      platform = this.pool.getFirst();
      platform.x = posX;
      platform.active = true;
      platform.visible = true;
      this.pool.remove(platform);
    } else {
      platform = this.scene.physics.add
        .sprite(posX, window.innerHeight * 0.8, 'platform')
        .setScale(0.5)
        .refreshBody();
      platform.setImmovable(true);
      platform.setVelocityX(config.platformStartSpeed * -1);
      this.group.add(platform);
    }
    platform.displayWidth = platformWidth;
    this.nextPlatformDistance = Phaser.Math.Between(config.spawnRange[0], config.spawnRange[1]);
  }

  getGroup(): Phaser.GameObjects.Group {
    return this.group;
  }
}
